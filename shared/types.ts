import type { NotificationType } from "./notificationTypes";

export type ISODateString = string;

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  username: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio?: string | null;
  // computed in User.toJSON()
  fullName?: string;
  isProfileComplete?: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** The subset of User that gets embedded in other entities (author, sender, ...). */
export type UserSummary = Pick<
  User,
  "id" | "firstName" | "lastName" | "username"
> & {
  location?: string;
};

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  id: number;
  requesterId: number;
  recipientId: number;
  status: ConnectionStatus;
  requester?: UserSummary;
  recipient?: UserSummary;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Connection as seen from one user's perspective (GET /users?includeConnectionStatus=true). */
export interface ConnectionStatusInfo extends Connection {
  isRequester: boolean;
}

export type UserWithConnectionStatus = User & {
  connectionStatus: ConnectionStatusInfo | null;
};

export type PostVisibility = "public" | "friends" | "private";

export interface Post {
  id: string;
  userId: number;
  content: string;
  imageUrl?: string | null;
  visibility: PostVisibility;
  author?: UserSummary;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type RelatedEntityType =
  | "connection"
  | "conversation"
  | "message"
  | "post"
  | "user";

export interface Notification {
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
  relatedUser?: UserSummary | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type MessageType = "text" | "image" | "file" | "system";

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string | null;
  replyToId?: string | null;
  replyTo?: Message | null;
  isEdited: boolean;
  editedAt?: ISODateString | null;
  readBy?: number[] | null;
  sender?: UserSummary;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type ConversationType = "direct" | "group";

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: number;
  role?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  joinedAt?: ISODateString | null;
  lastReadAt?: ISODateString | null;
  user?: UserSummary;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  createdBy: number;
  lastMessageAt?: ISODateString | null;
  participants?: ConversationParticipant[];
  creator?: UserSummary;
  // enrichment added by GET /conversations
  lastMessage?: Message | null;
  unreadCount?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Request bodies / query params
// ---------------------------------------------------------------------------

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface Pagination {
  limit: number;
  offset: number;
  count: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  email?: string;
  bio?: string;
}

export type ProfileUpdateData = Partial<
  Pick<
    User,
    "firstName" | "lastName" | "age" | "location" | "username" | "email" | "bio"
  >
>;

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface CreatePostData {
  content: string;
  imageUrl?: string | null;
  visibility?: PostVisibility;
}

export type UpdatePostData = Partial<CreatePostData>;

export interface NotificationFilters extends PaginationParams {
  unreadOnly?: boolean;
}

export interface CreateDirectConversationData {
  recipientId: number;
}

export interface CreateGroupConversationData {
  name: string;
  participantIds: number[];
}

export interface SendMessageData {
  content: string;
  replyToId?: string | null;
}

export interface MessagesQuery {
  limit?: number;
  /** Cursor: return messages created before this message id. */
  beforeMessageId?: string;
}

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

/** Every non-2xx response. `errors` carries field-level messages when available. */
export interface ErrorResponse {
  error: string;
  errors?: Record<string, string>;
}

export interface SuccessMessageResponse {
  message: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface UserResponse {
  message?: string;
  user: User;
}
export interface UsersResponse {
  users: User[];
}
export interface UsersWithConnectionStatusResponse {
  users: UserWithConnectionStatus[];
}

export interface ConnectionResponse {
  message: string;
  connection: Connection;
}
export interface ConnectionRequestsResponse {
  requests: Connection[];
}
export interface ConnectionsListResponse {
  connections: Connection[];
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
}
export interface UnreadCountResponse {
  count: number;
}
export interface NotificationResponse {
  message: string;
  notification: Notification;
}

export interface PostResponse {
  message?: string;
  post: Post;
}
export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

// Target shapes for the messaging routes (implemented in step 1.8; the
// routes currently return { success, data } and will be changed to these).
export interface ConversationsResponse {
  conversations: Conversation[];
}
export interface ConversationResponse {
  conversation: Conversation;
  /** Only on POST /conversations: whether a new conversation was created. */
  created?: boolean;
}
export interface MessagesResponse {
  messages: Message[];
  /** Cursor for the next (older) page; undefined when there are no more. */
  nextCursor?: string;
}
export interface MessageResponse {
  message: Message;
}
