import type { Request } from "express";
import type { Socket } from "socket.io";

// User types
export interface User {
  id: number;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio?: string;
  fullName?: string;
  isProfileComplete?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface JWTPayload {
  userId: number;
  id?: string;
  username?: string;
  email?: string;
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  title?: string;
  isRead: boolean;
  relatedUserId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "connection_rejected"
  | "new_message"
  | "post_like"
  | "post_comment"
  | "post_share"
  | "user_mention"
  | "user_follow"
  | "system_announcement"
  | "account_update";

// Connection types
export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  id: number;
  requesterId: number;
  recipientId: number;
  status: ConnectionStatus;
  requester?: User;
  recipient?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType?: "text" | "image" | "file" | "system";
  attachmentUrl?: string;
  replyToId?: string;
  isEdited?: boolean;
  editedAt?: Date;
  readBy?: number[] | null; // Array of user IDs
  deletedAt?: Date | null;
  sender?: User;
  conversation?: Conversation;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  createdBy: number;
  lastMessageAt?: Date;
  participants?: ConversationParticipant[];
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: number;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  joinedAt?: Date;
  lastReadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Post types
export interface Post {
  id: string;
  userId: number;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPublished: boolean;
  author?: User;
  likes?: PostLike[];
  comments?: PostComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: number;
  user?: User;
  post?: Post;
  createdAt: Date;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: number;
  content: string;
  user?: User;
  post?: Post;
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket types
export interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface SocketMessage {
  type: "message" | "notification" | "typing" | "presence";
  payload: any;
  timestamp: Date;
}

// WebSocket Events
export interface ServerToClientEvents {
  // Notification events
  "notification:new": (notification: Notification) => void;
  "notification:updated": (notification: Notification) => void;
  "notification:deleted": (notificationId: string) => void;

  // Message events
  "message:new": (message: Message) => void;
  "message:updated": (message: Message) => void;
  "message:deleted": (messageId: string) => void;
  "message:typing": (data: {
    conversationId: string;
    userId: number;
    isTyping: boolean;
  }) => void;

  // Connection events
  "connection:request": (connection: Connection) => void;
  "connection:accepted": (connection: Connection) => void;
  "connection:rejected": (connection: Connection) => void;

  // User presence
  "user:online": (userId: number) => void;
  "user:offline": (userId: number) => void;
  "user:status": (data: {
    userId: number;
    status: "online" | "offline" | "away";
  }) => void;

  // System events
  error: (error: { message: string; code?: string }) => void;
  reconnect: () => void;
}

export interface ClientToServerEvents {
  // Authentication
  "auth:login": (
    token: string,
    callback: (response: { success: boolean; user?: User }) => void
  ) => void;

  // Notifications
  "notification:markRead": (notificationId: string) => void;
  "notification:markAllRead": () => void;

  // Messages
  "message:send": (data: { conversationId: string; content: string }) => void;
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

  // Conversation
  "conversation:join": (conversationId: string) => void;
  "conversation:leave": (conversationId: string) => void;
  "conversation:create": (data: {
    userIds: number[];
    type: "direct" | "group";
    name?: string;
  }) => void;

  // Presence
  "presence:update": (status: "online" | "away" | "offline") => void;

  // Subscription
  "subscribe:notifications": () => void;
  "unsubscribe:notifications": () => void;
  "subscribe:conversation": (conversationId: string) => void;
  "unsubscribe:conversation": (conversationId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: number;
  username: string;
  rooms: Set<string>;
}
