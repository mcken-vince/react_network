import type {
  User,
  Notification,
  Connection,
  Post,
  NotificationFilters,
  PostFilters,
  LoginCredentials,
  RegisterData,
  AuthUser,
  ConversationResponse,
  Conversation,
  ConversationsResponse,
  MessageResponse,
  Message,
  MessagesResponse,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Token management
const tokenManager = {
  getToken: (): string | null => localStorage.getItem("auth-token"),
  setToken: (token: string): void => localStorage.setItem("auth-token", token),
  removeToken: (): void => localStorage.removeItem("auth-token"),
};

// Base API request handler
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenManager.getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.error || `Request failed with status ${response.status}`,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Network error occurred", 0, null);
  }
}

// Auth API functions
export const authAPI = {
  async signup(userData: RegisterData): Promise<AuthUser> {
    const response = await apiRequest<AuthUser>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    return response;
  },

  async signin(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiRequest<AuthUser>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    return response;
  },

  signout(): void {
    tokenManager.removeToken();
  },
};

// User API functions
export const userAPI = {
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>("/users/me");
  },

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User> {
    return apiRequest<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getAllUsers(): Promise<User[]> {
    return apiRequest<User[]>("/users");
  },

  async getAllUsersWithConnectionStatus(): Promise<
    (User & { connectionStatus?: string })[]
  > {
    return apiRequest<(User & { connectionStatus?: string })[]>(
      "/users?includeConnectionStatus=true",
    );
  },

  async getUser(userId: string): Promise<User> {
    return apiRequest<User>(`/users/${userId}`);
  },
};

// Connection API functions
export const connectionAPI = {
  async sendConnectionRequest(recipientId: string): Promise<Connection> {
    return apiRequest<Connection>("/connections/request", {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    });
  },

  async acceptConnectionRequest(connectionId: string): Promise<Connection> {
    return apiRequest<Connection>(`/connections/${connectionId}/accept`, {
      method: "PUT",
    });
  },

  async rejectConnectionRequest(connectionId: string): Promise<Connection> {
    return apiRequest<Connection>(`/connections/${connectionId}/reject`, {
      method: "PUT",
    });
  },

  async getPendingRequests(): Promise<Connection[]> {
    return apiRequest<Connection[]>("/connections/pending");
  },

  async getSentRequests(): Promise<Connection[]> {
    return apiRequest<Connection[]>("/connections/sent");
  },

  async getUserConnections(): Promise<Connection[]> {
    return apiRequest<Connection[]>("/connections/connections");
  },

  async removeConnection(connectionId: string): Promise<void> {
    return apiRequest<void>(`/connections/${connectionId}`, {
      method: "DELETE",
    });
  },
};

// Notification API functions
interface NotificationsResponse {
  notifications: Notification[];
}

interface UnreadCountResponse {
  count: number;
}

export const notificationAPI = {
  async getNotifications(
    options: NotificationFilters = {},
  ): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();

    if (options.limit !== undefined)
      queryParams.append("limit", options.limit.toString());
    if (options.offset !== undefined)
      queryParams.append("offset", options.offset.toString());
    if (options.unreadOnly !== undefined)
      queryParams.append("unreadOnly", options.unreadOnly.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `/notifications?${queryString}`
      : "/notifications";

    return apiRequest<NotificationsResponse>(url);
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiRequest<UnreadCountResponse>("/notifications/unread-count");
  },

  async markAsRead(notificationId: string): Promise<void> {
    return apiRequest<void>(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  async markAllAsRead(): Promise<void> {
    return apiRequest<void>("/notifications/read-all", {
      method: "PUT",
    });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    return apiRequest<void>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

// Post API functions
interface PostsResponse {
  posts: Post[];
  hasMore?: boolean;
  total?: number;
}

export const postAPI = {
  async getFeed(options: PostFilters = {}): Promise<PostsResponse> {
    const queryParams = new URLSearchParams();

    if (options.limit !== undefined)
      queryParams.append("limit", options.limit.toString());
    if (options.offset !== undefined)
      queryParams.append("offset", options.offset.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/posts/feed?${queryString}` : "/posts/feed";

    return apiRequest<PostsResponse>(url);
  },

  async getUserPosts(
    userId: string,
    options: PostFilters = {},
  ): Promise<PostsResponse> {
    const queryParams = new URLSearchParams();

    if (options.limit !== undefined)
      queryParams.append("limit", options.limit.toString());
    if (options.offset !== undefined)
      queryParams.append("offset", options.offset.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `/posts/user/${userId}?${queryString}`
      : `/posts/user/${userId}`;

    return apiRequest<PostsResponse>(url);
  },

  async getPost(postId: string): Promise<Post> {
    return apiRequest<Post>(`/posts/${postId}`);
  },

  async createPost(postData: Partial<Post>): Promise<Post> {
    return apiRequest<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  },

  async updatePost(postId: string, updateData: Partial<Post>): Promise<Post> {
    return apiRequest<Post>(`/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  async deletePost(postId: string): Promise<void> {
    return apiRequest<void>(`/posts/${postId}`, {
      method: "DELETE",
    });
  },
};

// Message API functions
export const messageAPI = {
  // Conversation methods
  async getConversations(limit = 50, offset = 0): Promise<Conversation[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const result = await apiRequest<ConversationsResponse>(
      `/conversations?${params}`,
    );
    return result.data;
  },

  async createDirectConversation(participantId: string): Promise<Conversation> {
    const result = await apiRequest<ConversationResponse>("/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId }),
    });
    return result.data;
  },

  async createGroupConversation(
    name: string,
    participantIds: string[],
  ): Promise<Conversation> {
    const result = await apiRequest<ConversationResponse>(
      "/conversations/group",
      {
        method: "POST",
        body: JSON.stringify({ name, participantIds }),
      },
    );
    return result.data;
  },

  async getConversationDetails(conversationId: string): Promise<Conversation> {
    const result = await apiRequest<ConversationResponse>(
      `/conversations/${conversationId}`,
    );
    return result.data;
  },

  async addParticipants(
    conversationId: string,
    userIds: string[],
  ): Promise<Conversation> {
    const result = await apiRequest<ConversationResponse>(
      `/conversations/${conversationId}/participants`,
      {
        method: "POST",
        body: JSON.stringify({ userIds }),
      },
    );
    return result.data;
  },

  async removeParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await apiRequest<void>(
      `/conversations/${conversationId}/participants/${userId}`,
      {
        method: "DELETE",
      },
    );
  },

  async leaveConversation(conversationId: string): Promise<void> {
    await apiRequest<void>(`/conversations/${conversationId}/leave`, {
      method: "DELETE",
    });
  },

  // Message methods
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const result = await apiRequest<MessagesResponse>(
      `/conversations/${conversationId}/messages?${params}`,
    );
    return result.data;
  },

  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
  ): Promise<Message> {
    const body: any = { content };
    if (replyToId) {
      body.replyToId = replyToId;
    }

    const result = await apiRequest<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return result.data;
  },

  async editMessage(messageId: string, content: string): Promise<Message> {
    const result = await apiRequest<MessageResponse>(`/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    return result.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiRequest<void>(`/messages/${messageId}`, {
      method: "DELETE",
    });
  },

  async markAsRead(conversationId: string): Promise<void> {
    await apiRequest<void>(`/conversations/${conversationId}/read`, {
      method: "PUT",
    });
  },

  // Search and utility methods
  async searchConversations(query: string): Promise<Conversation[]> {
    const params = new URLSearchParams({ q: query });
    const result = await apiRequest<ConversationsResponse>(
      `/conversations/search?${params}`,
    );
    return result.data;
  },
};
