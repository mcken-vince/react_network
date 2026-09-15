import type { Optional } from "sequelize";
import type { NotificationType } from "../../shared/notificationTypes";
import type {
  ConnectionStatus,
  ConversationType,
  MessageType,
  PostVisibility,
  RelatedEntityType,
} from "../../shared/types";

/** Columns Sequelize fills in itself; never required on create. */
type AutoKeys = "id" | "createdAt" | "updatedAt";

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export interface UserAttributes {
  id: number;
  username: string;
  email?: string | null;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export type UserCreationAttributes = Optional<UserAttributes, AutoKeys>;

// ---------------------------------------------------------------------------
// connections
// ---------------------------------------------------------------------------
export interface ConnectionAttributes {
  id: number;
  requesterId: number;
  recipientId: number;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}
export type ConnectionCreationAttributes = Optional<
  ConnectionAttributes,
  AutoKeys | "status"
>;

// ---------------------------------------------------------------------------
// posts
// ---------------------------------------------------------------------------
export interface PostAttributes {
  id: string;
  userId: number;
  content: string;
  imageUrl?: string | null;
  visibility: PostVisibility;
  createdAt: Date;
  updatedAt: Date;
}
export type PostCreationAttributes = Optional<
  PostAttributes,
  AutoKeys | "visibility"
>;

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export interface NotificationAttributes {
  id: number;
  userId: number;
  type: NotificationType;
  title?: string | null;
  message: string;
  isRead: boolean;
  relatedUserId?: number | null;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  AutoKeys | "isRead"
>;

// ---------------------------------------------------------------------------
// conversations
// ---------------------------------------------------------------------------
export interface ConversationAttributes {
  id: string;
  type: ConversationType;
  name?: string | null;
  createdBy: number;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type ConversationCreationAttributes = Optional<
  ConversationAttributes,
  AutoKeys | "type"
>;

// ---------------------------------------------------------------------------
// conversationParticipants
// ---------------------------------------------------------------------------
export interface ConversationParticipantAttributes {
  id: string;
  conversationId: string;
  userId: number;
  role?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  joinedAt?: Date | null;
  lastReadAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type ConversationParticipantCreationAttributes = Optional<
  ConversationParticipantAttributes,
  AutoKeys | "isAdmin" | "isActive" | "joinedAt"
>;

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
export interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string | null;
  replyToId?: string | null;
  isEdited: boolean;
  editedAt?: Date | null;
  readBy?: number[] | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type MessageCreationAttributes = Optional<
  MessageAttributes,
  AutoKeys | "messageType" | "isEdited" | "readBy"
>;

// ---------------------------------------------------------------------------
// postLikes
// ---------------------------------------------------------------------------
export interface PostLikeAttributes {
  id: number;
  postId: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
export type PostLikeCreationAttributes = Optional<PostLikeAttributes, AutoKeys>;

// ---------------------------------------------------------------------------
// postComments
// ---------------------------------------------------------------------------
export interface PostCommentAttributes {
  id: string;
  postId: string;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
export type PostCommentCreationAttributes = Optional<
  PostCommentAttributes,
  AutoKeys
>;
