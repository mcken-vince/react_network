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

// Connection types
export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  id: number;
  requesterId: number;
  recipientId: number;
  status: ConnectionStatus;
  requester?: User;
  recipient?: User;
  isRequester?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Post types
export type PostVisibility = "public" | "friends" | "private";

export interface Post {
  id: string;
  userId: number;
  content: string;
  imageUrl?: string;
  visibility: PostVisibility;
  author?: User;
  createdAt: Date;
  updatedAt: Date;
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
  relatedEntityId?: string | number;
  metadata?: any;
  relatedUser?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export type MessageType = "text" | "image" | "file" | "system";

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  replyToId?: string;
  isEdited?: boolean;
  editedAt?: Date;
  readBy?: number[] | null;
  deletedAt?: Date | null;
  sender?: User;
  conversation?: Conversation;
  replyTo?: Message;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation types
export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  createdBy: number;
  lastMessageAt?: Date;
  participants?: ConversationParticipant[];
  messages?: Message[];
  creator?: User;
  lastMessage?: Message;
  unreadCount?: number;
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
  user?: User;
  conversation?: Conversation;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// WebSocket Event types (matching server)
export interface ServerToClientEvents {
  message: (message: Message) => void;
  notification: (notification: Notification) => void;
  userOnline: (userId: number) => void;
  userOffline: (userId: number) => void;
  error: (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  sendMessage: (data: {
    conversationId: string;
    content: string;
    messageType?: MessageType;
    replyToId?: string;
  }) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markAsRead: (data: { conversationId: string; messageId: string }) => void;
}
