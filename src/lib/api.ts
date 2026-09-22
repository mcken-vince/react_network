import { API_BASE_URL } from "./env";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";
import type { ReactionTargetRef } from "./reactions";
import type {
  AuthResponse,
  ConnectionRequestsResponse,
  ConnectionResponse,
  ConnectionsListResponse,
  ConversationResponse,
  ConversationsResponse,
  CreateGroupConversationData,
  CreatePostData,
  LoginCredentials,
  MessageResponse,
  MessagesQuery,
  MessagesResponse,
  NotificationFilters,
  NotificationResponse,
  NotificationsResponse,
  PaginationParams,
  PasswordChangeData,
  PostResponse,
  PostsResponse,
  ProfileUpdateData,
  ReactionResponse,
  ReactionType,
  ReactorsQuery,
  ReactorsResponse,
  SendMessageData,
  SetReactionData,
  SignupData,
  SuccessMessageResponse,
  UnreadCountResponse,
  UpdatePostData,
  UserResponse,
  UsersResponse,
  UsersWithConnectionStatusResponse,
  CommentResponse,
  CommentsQuery,
  CommentsResponse,
  CreateCommentData,
} from "../types";

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/** Thrown for every non-2xx response. `errors` carries field-level messages. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string> | undefined;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

interface ErrorBody {
  error?: string;
  errors?: Record<string, string>;
}

type QueryValue = string | number | boolean | undefined;

function query(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.append(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  let response: globalThis.Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Network error — is the server reachable?");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const { error, errors } = (body ?? {}) as ErrorBody;
    if (response.status === 401) clearAuthToken();
    throw new ApiError(
      response.status,
      error ?? `Request failed (${response.status})`,
      errors,
    );
  }
  return body as T;
}

const getJson = <T>(path: string): Promise<T> => request<T>(path);
const del = <T>(path: string): Promise<T> =>
  request<T>(path, { method: "DELETE" });
const postJson = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const putJson = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authAPI = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const res = await postJson<AuthResponse>("/auth/signup", data);
    setAuthToken(res.token);
    return res;
  },

  async signin(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await postJson<AuthResponse>("/auth/signin", credentials);
    setAuthToken(res.token);
    return res;
  },

  signout(): void {
    clearAuthToken();
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const userAPI = {
  getCurrentUser: () => getJson<UserResponse>("/users/me"),

  getUser: (userId: number) => getJson<UserResponse>(`/users/${userId}`),

  getAllUsers: (params: PaginationParams = {}) =>
    getJson<UsersResponse>(`/users${query({ ...params })}`),

  getAllUsersWithConnectionStatus: (params: PaginationParams = {}) =>
    getJson<UsersWithConnectionStatusResponse>(
      `/users${query({ ...params, includeConnectionStatus: true })}`,
    ),

  searchUsers: (q: string, params: PaginationParams = {}) =>
    getJson<UsersResponse>(`/users/search${query({ q, ...params })}`),

  searchUsersWithConnectionStatus: (q: string, params: PaginationParams = {}) =>
    getJson<UsersWithConnectionStatusResponse>(
      `/users/search${query({ q, ...params, includeConnectionStatus: true })}`,
    ),

  updateProfile: (userId: number, data: ProfileUpdateData) =>
    putJson<UserResponse>(`/users/${userId}`, data),

  changePassword: (data: PasswordChangeData) =>
    putJson<SuccessMessageResponse>("/users/me/password", data),
};

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export const connectionAPI = {
  sendRequest: (recipientId: number) =>
    postJson<ConnectionResponse>("/connections/request", { recipientId }),

  accept: (connectionId: number) =>
    putJson<ConnectionResponse>(`/connections/${connectionId}/accept`),

  reject: (connectionId: number) =>
    putJson<ConnectionResponse>(`/connections/${connectionId}/reject`),

  /** Removes an accepted connection or cancels a sent request. */
  remove: (connectionId: number) =>
    del<SuccessMessageResponse>(`/connections/${connectionId}`),

  getPending: () => getJson<ConnectionRequestsResponse>("/connections/pending"),

  getSent: () => getJson<ConnectionRequestsResponse>("/connections/sent"),

  getConnections: () =>
    getJson<ConnectionsListResponse>("/connections/connections"),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationAPI = {
  list: (filters: NotificationFilters = {}) =>
    getJson<NotificationsResponse>(`/notifications${query({ ...filters })}`),

  unreadCount: () =>
    getJson<UnreadCountResponse>("/notifications/unread-count"),

  markRead: (notificationId: number) =>
    putJson<NotificationResponse>(`/notifications/${notificationId}/read`),

  markAllRead: () => putJson<SuccessMessageResponse>("/notifications/read-all"),

  remove: (notificationId: number) =>
    del<SuccessMessageResponse>(`/notifications/${notificationId}`),
};

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const postAPI = {
  getFeed: (params: PaginationParams = {}) =>
    getJson<PostsResponse>(`/posts/feed${query({ ...params })}`),

  getUserPosts: (userId: number, params: PaginationParams = {}) =>
    getJson<PostsResponse>(`/posts/user/${userId}${query({ ...params })}`),

  getPost: (postId: string) => getJson<PostResponse>(`/posts/${postId}`),

  createPost: (data: CreatePostData) => postJson<PostResponse>("/posts", data),

  updatePost: (postId: string, data: UpdatePostData) =>
    putJson<PostResponse>(`/posts/${postId}`, data),

  deletePost: (postId: string) =>
    del<SuccessMessageResponse>(`/posts/${postId}`),

  getComments: (postId: string, q: CommentsQuery = {}) =>
    getJson<CommentsResponse>(`/posts/${postId}/comments${query({ ...q })}`),

  addComment: (postId: string, data: CreateCommentData) =>
    postJson<CommentResponse>(`/posts/${postId}/comments`, data),

  deleteComment: (postId: string, commentId: string) =>
    del<SuccessMessageResponse>(`/posts/${postId}/comments/${commentId}`),
};

// ---------------------------------------------------------------------------
// Reactions  (posts, comments, messages share one shape)
// ---------------------------------------------------------------------------

function reactionPath(ref: ReactionTargetRef): string {
  switch (ref.targetType) {
    case "post":
      return `/posts/${ref.postId}/reactions`;
    case "comment":
      return `/posts/${ref.postId}/comments/${ref.commentId}/reactions`;
    case "message":
      return `/messages/${ref.messageId}/reactions`;
  }
}

export const reactionAPI = {
  /** Add (multi) or set (single) my reaction. */
  set: (ref: ReactionTargetRef, type: ReactionType) =>
    putJson<ReactionResponse>(reactionPath(ref), {
      type,
    } satisfies SetReactionData),

  /** Remove my reaction; `type` only matters under a "multi" policy. */
  clear: (ref: ReactionTargetRef, type?: ReactionType) =>
    del<ReactionResponse>(`${reactionPath(ref)}${query({ type })}`),

  listReactors: (ref: ReactionTargetRef, q: ReactorsQuery = {}) =>
    getJson<ReactorsResponse>(`${reactionPath(ref)}${query({ ...q })}`),
};

// ---------------------------------------------------------------------------
// Messaging  (routes mounted at /api: /conversations/*, /messages/*)
// ---------------------------------------------------------------------------

export const messageAPI = {
  getConversations: (params: PaginationParams = {}) =>
    getJson<ConversationsResponse>(`/conversations${query({ ...params })}`),

  getConversation: (conversationId: string) =>
    getJson<ConversationResponse>(`/conversations/${conversationId}`),

  /** Find-or-create the direct conversation with `recipientId`. */
  createDirectConversation: (recipientId: number) =>
    postJson<ConversationResponse>("/conversations", { recipientId }),

  createGroupConversation: (data: CreateGroupConversationData) =>
    postJson<ConversationResponse>("/conversations/group", data),

  markConversationRead: (conversationId: string, messageIds: string[] = []) =>
    putJson<SuccessMessageResponse>(`/conversations/${conversationId}/read`, {
      messageIds,
    }),

  getMessages: (conversationId: string, q: MessagesQuery = {}) =>
    getJson<MessagesResponse>(
      `/conversations/${conversationId}/messages${query({ ...q })}`,
    ),

  sendMessage: (conversationId: string, data: SendMessageData) =>
    postJson<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      data,
    ),

  editMessage: (messageId: string, content: string) =>
    putJson<MessageResponse>(`/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string) =>
    del<SuccessMessageResponse>(`/messages/${messageId}`),

  renameConversation: (conversationId: string, name: string) =>
    putJson<ConversationResponse>(`/conversations/${conversationId}`, { name }),

  addParticipants: (conversationId: string, userIds: number[]) =>
    postJson<ConversationResponse>(
      `/conversations/${conversationId}/participants`,
      { userIds },
    ),

  /** Admins remove others; pass your own id to leave. */
  removeParticipant: (conversationId: string, userId: number) =>
    del<SuccessMessageResponse>(
      `/conversations/${conversationId}/participants/${userId}`,
    ),
};
