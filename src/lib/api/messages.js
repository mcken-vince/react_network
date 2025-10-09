// API utilities for messaging functionality
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Conversation APIs
export async function getConversations(limit = 50, offset = 0) {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  const result = await apiRequest(`/api/conversations?${params}`);
  return result.data;
}

export async function createDirectConversation(participantId) {
  const result = await apiRequest('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ participantId }),
  });
  return result.data;
}

export async function createGroupConversation(name, participantIds) {
  const result = await apiRequest('/api/conversations/group', {
    method: 'POST',
    body: JSON.stringify({ name, participantIds }),
  });
  return result.data;
}

export async function getConversationDetails(conversationId) {
  const result = await apiRequest(`/api/conversations/${conversationId}`);
  return result.data;
}

export async function addParticipants(conversationId, userIds) {
  const result = await apiRequest(`/api/conversations/${conversationId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
  return result.data;
}

export async function removeParticipant(conversationId, userId) {
  await apiRequest(`/api/conversations/${conversationId}/participants/${userId}`, {
    method: 'DELETE',
  });
}

export async function leaveConversation(conversationId) {
  await apiRequest(`/api/conversations/${conversationId}/leave`, {
    method: 'DELETE',
  });
}

// Message APIs
export async function getMessages(conversationId, limit = 50, offset = 0) {
  const params = new URLSearchParams({ 
    limit: limit.toString(), 
    offset: offset.toString() 
  });
  const result = await apiRequest(`/api/conversations/${conversationId}/messages?${params}`);
  return result.data;
}

export async function sendMessage(conversationId, content, replyToId = null) {
  const body = { content };
  if (replyToId) {
    body.replyToId = replyToId;
  }

  const result = await apiRequest(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return result.data;
}

export async function editMessage(messageId, content) {
  const result = await apiRequest(`/api/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
  return result.data;
}

export async function deleteMessage(messageId) {
  await apiRequest(`/api/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function markAsRead(conversationId) {
  await apiRequest(`/api/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}

// Search and utility functions
export async function searchConversations(query) {
  const params = new URLSearchParams({ q: query });
  const result = await apiRequest(`/api/conversations/search?${params}`);
  return result.data;
}