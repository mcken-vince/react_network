import { useContext } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { MessagingContext } from "../context/MessagingContext";
import { messageAPI } from "../lib/api";
import { conversationKeys, messageKeys } from "../lib/queryKeys";
import type {
  Conversation,
  ConversationResponse,
  CreateGroupConversationData,
  Message,
  MessagesResponse,
  SendMessageData,
} from "../types";

type QueryClient = ReturnType<typeof useQueryClient>;

export const useActiveConversation = () => {
  const ctx = useContext(MessagingContext);
  if (!ctx) {
    throw new Error(
      "useActiveConversation must be used within a MessagingProvider",
    );
  }
  return ctx;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useConversations = () =>
  useQuery({
    queryKey: conversationKeys.list(),
    queryFn: () => messageAPI.getConversations().then((r) => r.conversations),
    staleTime: 30_000,
  });

export const useConversation = (conversationId: string | null) =>
  useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ""),
    queryFn: () =>
      messageAPI
        .getConversation(conversationId as string)
        .then((r) => r.conversation),
    enabled: Boolean(conversationId),
  });

const MESSAGE_PAGE = 30;

export const useMessages = (conversationId: string | null) =>
  useInfiniteQuery({
    queryKey: messageKeys.list(conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      messageAPI.getMessages(conversationId as string, {
        limit: MESSAGE_PAGE,
        beforeMessageId: pageParam ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: MessagesResponse) => last.nextCursor,
    enabled: Boolean(conversationId),
  });

/** Oldest-first flat list for rendering (pages arrive newest-first). */
export const flattenMessages = (
  data: InfiniteData<MessagesResponse> | undefined,
): Message[] =>
  data ? [...data.pages.flatMap((p) => p.messages)].reverse() : [];

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const byRecency = (a: Conversation, b: Conversation) =>
  new Date(b.lastMessageAt ?? b.createdAt).getTime() -
  new Date(a.lastMessageAt ?? a.createdAt).getTime();

/**
 * Insert or update a conversation in the list + detail caches. Enrichment
 * fields (lastMessage / unreadCount) are kept from the cached copy when the
 * incoming one lacks them — `conversation:updated` payloads don't carry them.
 */
export function upsertConversation(
  queryClient: QueryClient,
  conversation: Conversation,
): void {
  queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (old) => {
    const existing = (old ?? []).find((c) => c.id === conversation.id);
    const merged: Conversation = {
      ...existing,
      ...conversation,
      lastMessage: conversation.lastMessage ?? existing?.lastMessage ?? null,
      unreadCount: conversation.unreadCount ?? existing?.unreadCount ?? 0,
    };
    const without = (old ?? []).filter((c) => c.id !== conversation.id);
    return [merged, ...without].sort(byRecency);
  });
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(conversation.id),
    (old) => ({ ...old, ...conversation }),
  );
}

/** The user was removed from (or left) a conversation: forget it entirely. */
export function removeConversationFromCache(
  queryClient: QueryClient,
  conversationId: string,
): void {
  queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (old) =>
    old?.filter((c) => c.id !== conversationId),
  );
  queryClient.removeQueries({
    queryKey: conversationKeys.detail(conversationId),
  });
  queryClient.removeQueries({ queryKey: messageKeys.list(conversationId) });
}

const patchFirstPage = (
  queryClient: QueryClient,
  conversationId: string,
  updater: (messages: Message[]) => Message[],
): void => {
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    messageKeys.list(conversationId),
    (old) => {
      const [first, ...rest] = old?.pages ?? [];
      if (!old || !first) return old;
      return {
        ...old,
        pages: [{ ...first, messages: updater(first.messages) }, ...rest],
      };
    },
  );
};

const patchAllPages = (
  queryClient: QueryClient,
  conversationId: string,
  updater: (messages: Message[]) => Message[],
): void => {
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    messageKeys.list(conversationId),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: updater(p.messages),
            })),
          }
        : old,
  );
};

const touchConversation = (
  queryClient: QueryClient,
  conversationId: string,
  message: Message,
): void => {
  queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (old) => {
    if (!old) return old;
    const existing = old.find((c) => c.id === conversationId);
    if (!existing) return old;
    const updated: Conversation = {
      ...existing,
      lastMessage: message,
      lastMessageAt: message.createdAt,
    };
    return [updated, ...old.filter((c) => c.id !== conversationId)];
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageData) =>
      messageAPI.sendMessage(conversationId, data).then((r) => r.message),
    onSuccess: (message) => {
      patchFirstPage(queryClient, conversationId, (messages) =>
        messages.some((m) => m.id === message.id)
          ? messages
          : [message, ...messages],
      );
      touchConversation(queryClient, conversationId, message);
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { messageId: string; content: string }) =>
      messageAPI
        .editMessage(vars.messageId, vars.content)
        .then((r) => r.message),
    onSuccess: (message) =>
      patchAllPages(queryClient, message.conversationId, (messages) =>
        messages.map((m) => (m.id === message.id ? message : m)),
      ),
  });
};

export const useDeleteMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messageAPI.deleteMessage(messageId),
    onSuccess: (_res, messageId) =>
      patchAllPages(queryClient, conversationId, (messages) =>
        messages.filter((m) => m.id !== messageId),
      ),
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; messageIds?: string[] }) =>
      messageAPI.markConversationRead(vars.conversationId, vars.messageIds),
    onMutate: ({ conversationId }) => {
      queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (old) =>
        old?.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      );
    },
  });
};

export const useCreateDirectConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientId: number) =>
      messageAPI.createDirectConversation(recipientId),
    onSuccess: (res: ConversationResponse) =>
      upsertConversation(queryClient, res.conversation),
  });
};

export const useCreateGroupConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupConversationData) =>
      messageAPI.createGroupConversation(data),
    onSuccess: (res: ConversationResponse) =>
      upsertConversation(queryClient, res.conversation),
  });
};

// ---------------------------------------------------------------------------
// Group management (the server also pushes conversation:updated / :removed;
// the invalidations below cover a dropped socket)
// ---------------------------------------------------------------------------

export const useRenameConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; name: string }) =>
      messageAPI.renameConversation(vars.conversationId, vars.name),
    onSuccess: (res: ConversationResponse) =>
      upsertConversation(queryClient, res.conversation),
  });
};

export const useAddParticipants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; userIds: number[] }) =>
      messageAPI.addParticipants(vars.conversationId, vars.userIds),
    onSuccess: (res: ConversationResponse) =>
      upsertConversation(queryClient, res.conversation),
  });
};

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { conversationId: string; userId: number }) =>
      messageAPI.removeParticipant(vars.conversationId, vars.userId),
    onSuccess: (_res, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
};
