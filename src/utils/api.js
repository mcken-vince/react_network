const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management
const tokenManager = {
  getToken: () => localStorage.getItem('auth-token'),
  setToken: (token) => localStorage.setItem('auth-token', token),
  removeToken: () => localStorage.removeItem('auth-token'),
};

// Base API request handler
async function apiRequest(endpoint, options = {}) {
  const token = tokenManager.getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
        data
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred', 0, null);
  }
}

// Auth API functions
export const authAPI = {
  async signup(userData) {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    return response;
  },
  
  async signin(credentials) {
    const response = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    return response;
  },
  
  signout() {
    tokenManager.removeToken();
  }
};

// User API functions
export const userAPI = {
  async getCurrentUser() {
    return apiRequest('/users/me');
  },
  
  async updateProfile(userId, updateData) {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },
  
  async getAllUsers() {
    return apiRequest('/users');
  },
  
  async getUser(userId) {
    return apiRequest(`/users/${userId}`);
  },
};

// Connection API functions
export const connectionAPI = {
  async sendConnectionRequest(recipientId) {
    return apiRequest('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ recipientId })
    });
  },

  async acceptConnectionRequest(connectionId) {
    return apiRequest(`/connections/${connectionId}/accept`, {
      method: 'PUT'
    });
  },

  async rejectConnectionRequest(connectionId) {
    return apiRequest(`/connections/${connectionId}/reject`, {
      method: 'PUT'
    });
  },

  async getPendingRequests() {
    return apiRequest('/connections/pending');
  },

  async getSentRequests() {
    return apiRequest('/connections/sent');
  },

  async getUserConnections() {
    return apiRequest('/connections/connections');
  },

  async getConnectionStatus(userId) {
    return apiRequest(`/connections/status/${userId}`);
  },

  async removeConnection(connectionId) {
    return apiRequest(`/connections/${connectionId}`, {
      method: 'DELETE'
    });
  },
};

// Notification API functions
export const notificationAPI = {
  async getNotifications(options = {}) {
    const queryParams = new URLSearchParams();
    
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);
    if (options.unreadOnly) queryParams.append('unreadOnly', options.unreadOnly);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return apiRequest(url);
  },

  async getUnreadCount() {
    return apiRequest('/notifications/unread-count');
  },

  async markAsRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  async markAllAsRead() {
    return apiRequest('/notifications/read-all', {
      method: 'PUT'
    });
  },

  async deleteNotification(notificationId) {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
};
