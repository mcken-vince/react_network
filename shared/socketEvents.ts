import type {
  Conversation,
  ConversationType,
  Message,
  Notification,
} from "./types";

export type PresenceStatus = "online" | "away" | "offline";

export interface ServerToClientEvents {
  // Notifications
  "notification:new": (notification: Notification) => void;
  "notification:updated": (notification: Notification) => void;
  "notification:deleted": (notificationId: number) => void;
  "notification:allRead": () => void;

  // Messages
  "message:new": (message: Message) => void;
  "message:updated": (message: Message) => void;
  "message:deleted": (data: {
    conversationId: string;
    messageId: string;
  }) => void;
  "message:typing": (data: {
    conversationId: string;
    userId: number;
    isTyping: boolean;
  }) => void;

  // Conversations
  "conversation:created": (conversation: Conversation) => void;

  // Presence
  "user:status": (data: { userId: number; status: PresenceStatus }) => void;

  // System
  error: (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Notifications
  "notification:markRead": (notificationId: number) => void;
  "notification:markAllRead": () => void;

  // Messages
  "message:send": (data: {
    conversationId: string;
    content: string;
    replyToId?: string | null;
  }) => void;
  "message:edit": (data: { messageId: string; content: string }) => void;
  "message:delete": (messageId: string) => void;
  "message:markRead": (data: {
    conversationId: string;
    messageIds: string[];
  }) => void;
  "message:typing": (data: {
    conversationId: string;
    isTyping: boolean;
  }) => void;

  // Conversations
  "conversation:join": (conversationId: string) => void;
  "conversation:leave": (conversationId: string) => void;
  "conversation:create": (data: {
    userIds: number[];
    type: ConversationType;
    name?: string;
  }) => void;

  // Presence
  "presence:update": (status: PresenceStatus) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: number;
  username: string;
  rooms: Set<string>;
}

/** Room naming — the one place these strings are defined. */
export const rooms = {
  user: (userId: number) => `user:${userId}` as const,
  conversation: (conversationId: string) =>
    `conversation:${conversationId}` as const,
};
