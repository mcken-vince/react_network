import { Model } from "sequelize";

// Define interfaces for model attributes
export interface UserAttributes {
  id: number;
  username: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConnectionAttributes {
  id: number;
  requesterId: number;
  recipientId: number;
  status: "pending" | "accepted" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PostAttributes {
  id: string;
  userId: number;
  content: string;
  imageUrl?: string;
  visibility: "public" | "friends" | "private";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationAttributes {
  id?: number;
  userId: number;
  type: string;
  message: string;
  title?: string;
  isRead: boolean;
  relatedUserId?: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationAttributes {
  id: string;
  type: "direct" | "group";
  name?: string;
  createdBy: number;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationParticipantAttributes {
  id: string;
  conversationId: string;
  userId: number;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  joinedAt?: Date;
  lastReadAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType?: "text" | "image" | "file" | "system";
  attachmentUrl?: string;
  replyToId?: string;
  isEdited?: boolean;
  editedAt?: Date;
  readBy?: number[];
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend Sequelize Model with proper typing
export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  isProfileComplete(): boolean;
}

export interface ConnectionInstance
  extends Model<ConnectionAttributes>,
    ConnectionAttributes {}

export interface PostInstance extends Model<PostAttributes>, PostAttributes {}

export interface NotificationInstance
  extends Model<NotificationAttributes>,
    NotificationAttributes {}

export interface ConversationInstance
  extends Model<ConversationAttributes>,
    ConversationAttributes {
  hasParticipant(userId: number): Promise<boolean>;
  getActiveParticipants(): Promise<any>;
  getLastMessage(): Promise<any>;
  getUnreadCount(userId: number): Promise<number>;
}

export interface ConversationParticipantInstance
  extends Model<ConversationParticipantAttributes>,
    ConversationParticipantAttributes {}

export interface MessageInstance
  extends Model<MessageAttributes>,
    MessageAttributes {}
