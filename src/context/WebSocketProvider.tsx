import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import { getAuthToken, onAuthTokenChange } from "../lib/authToken";
import { useAuth } from "../hooks/useAuth";
import {
  conversationKeys,
  messageKeys,
  notificationKeys,
} from "../lib/queryKeys";
import {
  removeConversationFromCache,
  upsertConversation,
} from "../hooks/useMessaging";
import {
  patchNotificationLists,
  prependNotification,
} from "../hooks/useNotifications";
import {
  WebSocketContext,
  type WebSocketContextValue,
} from "./WebSocketContext";
import type {
  Conversation,
  Message,
  MessagesResponse,
  ServerToClientEvents,
} from "../types";

const SERVER_EVENTS: (keyof ServerToClientEvents)[] = [
  "presence:snapshot",
  "user:status",
  "notification:new",
  "notification:updated",
  "notification:deleted",
  "notification:allRead",
  "message:new",
  "message:updated",
  "message:deleted",
  "conversation:created",
  "conversation:updated",
  "conversation:removed",
  "message:typing",
];

const TYPING_TIMEOUT_MS = 5_000;

function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  useEffect(() => onAuthTokenChange(setToken), []);
  return token;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, number[]>
  >({});
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    // Captured once so the cleanup sees the same Map the handlers wrote to.
    const timers = typingTimers.current;

    if (!token) {
      disconnectSocket();
      setIsConnected(false);
      setOnlineUserIds(new Set());
      setTypingByConversation({});
      return;
    }

    const socket = connectSocket(token);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setIsConnected(socket.connected);

    // ---- Presence --------------------------------------------------------
    socket.on("presence:snapshot", (ids) => setOnlineUserIds(new Set(ids)));
    socket.on("user:status", ({ userId, status }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      }),
    );

    // ---- Notifications ---------------------------------------------------
    socket.on("notification:new", (notification) => {
      prependNotification(queryClient, notification);
      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(),
        (c) => (c ?? 0) + 1,
      );
    });
    socket.on("notification:updated", (notification) => {
      patchNotificationLists(queryClient, (list) =>
        list.map((n) => (n.id === notification.id ? notification : n)),
      );
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    });
    socket.on("notification:deleted", (notificationId) => {
      patchNotificationLists(queryClient, (list) =>
        list.filter((n) => n.id !== notificationId),
      );
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    });
    socket.on("notification:allRead", () => {
      patchNotificationLists(queryClient, (list) =>
        list.map((n) => ({ ...n, isRead: true })),
      );
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), 0);
    });

    // ---- Messaging -------------------------------------------------------
    const patchMessages = (
      conversationId: string,
      updater: (messages: Message[]) => Message[],
      firstPageOnly = false,
    ) =>
      queryClient.setQueryData<InfiniteData<MessagesResponse>>(
        messageKeys.list(conversationId),
        (old) => {
          const [first, ...rest] = old?.pages ?? [];
          if (!old || !first) return old;
          if (firstPageOnly) {
            return {
              ...old,
              pages: [{ ...first, messages: updater(first.messages) }, ...rest],
            };
          }
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: updater(p.messages),
            })),
          };
        },
      );

    socket.on("message:new", (message) => {
      patchMessages(
        message.conversationId,
        (messages) =>
          messages.some((m) => m.id === message.id)
            ? messages
            : [message, ...messages],
        true,
      );
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          const existing = old.find((c) => c.id === message.conversationId);
          if (!existing) {
            void queryClient.invalidateQueries({
              queryKey: conversationKeys.list(),
            });
            return old;
          }
          const mine = message.senderId === currentUserId;
          const updated: Conversation = {
            ...existing,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: mine
              ? (existing.unreadCount ?? 0)
              : (existing.unreadCount ?? 0) + 1,
          };
          return [updated, ...old.filter((c) => c.id !== existing.id)];
        },
      );
    });

    socket.on("message:updated", (message) =>
      patchMessages(message.conversationId, (messages) =>
        messages.map((m) => (m.id === message.id ? message : m)),
      ),
    );

    socket.on("message:deleted", ({ conversationId, messageId }) =>
      patchMessages(conversationId, (messages) =>
        messages.filter((m) => m.id !== messageId),
      ),
    );

    socket.on("conversation:created", (conversation) =>
      upsertConversation(queryClient, conversation),
    );
    socket.on("conversation:updated", (conversation) =>
      upsertConversation(queryClient, conversation),
    );
    socket.on("conversation:removed", (conversationId) =>
      removeConversationFromCache(queryClient, conversationId),
    );

    socket.on("message:typing", ({ conversationId, userId, isTyping }) => {
      if (userId === currentUserId) return;
      setTypingByConversation((prev) => {
        const current = new Set(prev[conversationId] ?? []);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return { ...prev, [conversationId]: [...current] };
      });

      const timerKey = `${conversationId}:${userId}`;
      const pending = timers.get(timerKey);
      if (pending) clearTimeout(pending);
      if (isTyping) {
        timers.set(
          timerKey,
          setTimeout(() => {
            setTypingByConversation((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] ?? []).filter(
                (id) => id !== userId,
              ),
            }));
            timers.delete(timerKey);
          }, TYPING_TIMEOUT_MS),
        );
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      SERVER_EVENTS.forEach((event) => socket.off(event));
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [token, currentUserId, queryClient]);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      getSocket()?.emit("message:typing", { conversationId, isTyping });
    },
    [],
  );

  const value = useMemo<WebSocketContextValue>(
    () => ({
      isConnected,
      onlineUserIds,
      isUserOnline: (userId: number) => onlineUserIds.has(userId),
      typingByConversation,
      sendTyping,
    }),
    [isConnected, onlineUserIds, typingByConversation, sendTyping],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
