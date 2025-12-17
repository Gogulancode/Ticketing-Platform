import { useAuthStore } from '../store/authStore';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getBaseUrl = () => useAuthStore.getState().serverUrl;

// Tickets API
export const ticketsApi = {
  getMyTickets: async (page = 1, pageSize = 20) => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/my?page=${page}&pageSize=${pageSize}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
  },

  getAllTickets: async (page = 1, pageSize = 20, filters?: Record<string, string>) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(
      `${getBaseUrl()}/api/tickets?${params}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
  },

  getTicket: async (id: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/${id}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch ticket');
    return response.json();
  },

  createTicket: async (data: {
    title: string;
    description: string;
    categoryId?: number;
    priority?: string;
  }) => {
    const response = await fetch(`${getBaseUrl()}/api/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    return response.json();
  },

  updateTicket: async (id: string, data: Partial<{
    status: string;
    priority: string;
    assignedToUserId: string;
    categoryId: number;
  }>) => {
    const response = await fetch(`${getBaseUrl()}/api/tickets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update ticket');
    return response.json();
  },

  getComments: async (ticketId: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/${ticketId}/comments`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  addComment: async (ticketId: string, content: string, isInternal = false) => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/${ticketId}/comments`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, isInternal }),
      }
    );
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (unreadOnly = false, page = 1, pageSize = 20) => {
    const response = await fetch(
      `${getBaseUrl()}/api/notifications?unreadOnly=${unreadOnly}&page=${page}&pageSize=${pageSize}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markAsRead: async (id: number) => {
    const response = await fetch(
      `${getBaseUrl()}/api/notifications/${id}/read`,
      { method: 'PUT', headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
  },

  markAllAsRead: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/notifications/read-all`,
      { method: 'PUT', headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to mark all as read');
    return response.json();
  },
};

// Settings API
export const settingsApi = {
  getCategories: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/settings/categories`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  getPriorities: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/settings/priorities`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch priorities');
    return response.json();
  },

  getStatuses: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/settings/statuses`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch statuses');
    return response.json();
  },

  getAgents: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/settings/agents`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  },
};

// Dashboard/Stats API
export const dashboardApi = {
  getStats: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/stats`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
