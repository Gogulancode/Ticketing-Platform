import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => useAuthStore.getState().serverUrl;
const getToken = () => useAuthStore.getState().token;

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return fetchApi<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  getCurrentUser: async () => {
    return fetchApi<any>('/api/auth/me');
  },
};

// Chat API
export const chatApi = {
  // Conversations
  getConversations: async () => {
    return fetchApi<any[]>('/api/chat/conversations');
  },
  
  getConversation: async (id: number) => {
    return fetchApi<any>(`/api/chat/conversations/${id}`);
  },
  
  createConversation: async (data: { name?: string; type: string; participantIds: number[] }) => {
    return fetchApi<any>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  createDirectConversation: async (userId: number) => {
    return fetchApi<any>(`/api/chat/conversations/direct/${userId}`, {
      method: 'POST',
    });
  },
  
  // Messages
  getMessages: async (conversationId: number, page = 1, pageSize = 50) => {
    return fetchApi<any[]>(`/api/chat/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`);
  },
  
  sendMessage: async (conversationId: number, content: string, type = 'Text') => {
    return fetchApi<any>(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  },
  
  editMessage: async (messageId: number, content: string) => {
    return fetchApi<any>(`/api/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },
  
  deleteMessage: async (messageId: number) => {
    return fetchApi<void>(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },
  
  // Participants
  addParticipant: async (conversationId: number, userId: number, role = 'Member') => {
    return fetchApi<any>(`/api/chat/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },
  
  removeParticipant: async (conversationId: number, userId: number) => {
    return fetchApi<void>(`/api/chat/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE',
    });
  },
  
  // Reactions
  addReaction: async (messageId: number, emoji: string) => {
    return fetchApi<any>(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },
  
  removeReaction: async (messageId: number, emoji: string) => {
    return fetchApi<void>(`/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  },
  
  // Presence
  updatePresence: async (status: string, statusMessage?: string) => {
    return fetchApi<any>('/api/chat/presence', {
      method: 'PUT',
      body: JSON.stringify({ status, statusMessage }),
    });
  },
  
  // Convert to Ticket
  convertToTicket: async (conversationId: number, subject: string, priority = 'Medium') => {
    return fetchApi<any>(`/api/chat/conversations/${conversationId}/convert-to-ticket`, {
      method: 'POST',
      body: JSON.stringify({ subject, priority }),
    });
  },
  
  // Users search
  searchUsers: async (query: string) => {
    return fetchApi<any[]>(`/api/chat/users/search?q=${encodeURIComponent(query)}`);
  },
  
  // Canned responses
  getCannedResponses: async () => {
    return fetchApi<any[]>('/api/chat/canned-responses');
  },
};
