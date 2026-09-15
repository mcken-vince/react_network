import type { Conversation, Message, Notification } from "./types";

export type PresenceStatus = "online" | "offline";

/**
 * Server → client. The socket is a push channel: every mutation happens over
 * REST and the server broadcasts the resulting state change to everyone it
 * concerns — including the originating user's other tabs. Clients must treat
 * `*:new` / `*:created` as upserts, since the originating tab also receives
 * the REST response.
 */
export interface ServerToClientEvents {
  // Notifications
  "notification:new": (notification: Notification) => void;
  "notification:updated": (notification: Notification) => void;
  "notification:deleted": (notificationId: number) => void;
  "notification:allRead": () => void;

  // Messaging
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
  "conversation:created": (conversation: Conversation) => void;
  /** Name / membership changed. Sent to every remaining active participant. */
  "conversation:updated": (conversation: Conversation) => void;
  /** Sent only to a user who was removed from (or left) a conversation. */
  "conversation:removed": (conversationId: string) => void;

  // Presence — derived purely from open sockets.
  /** Sent once to a socket right after it connects: every user currently online. */
  "presence:snapshot": (onlineUserIds: number[]) => void;
  "user:status": (data: { userId: number; status: PresenceStatus }) => void;
}

/** Client → server. Only ephemeral signals that have no REST equivalent. */
export interface ClientToServerEvents {
  "message:typing": (data: {
    conversationId: string;
    isTyping: boolean;
  }) => void;
}

/** No server-to-server events (single instance). */
export type InterServerEvents = Record<string, never>;

export interface SocketData {
  userId: number;
  username: string;
}

/** Room naming — the one place this string is defined. */
export const rooms = {
  user: (userId: number) => `user:${userId}` as const,
};
