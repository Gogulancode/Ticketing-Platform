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

  getTicketById: async (id: string) => {
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

// Dashboard/Stats API - Uses same endpoints as web frontend
export const dashboardApi = {
  getStats: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/tickets/stats`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Same API as web frontend Dashboard (analyticsApi.getDashboardAnalytics)
  getDashboardAnalytics: async (categoryIds?: number[]) => {
    const params = new URLSearchParams();
    if (categoryIds && categoryIds.length > 0) {
      params.append('categoryIds', categoryIds.join(','));
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Try the main analytics endpoint first (same as web)
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/analytics/dashboard${queryString}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('Main analytics endpoint not available, using reports fallback');
    }
    
    // Fallback: Build analytics from reports (same as web frontend)
    const allTicketsResponse = await fetch(
      `${getBaseUrl()}/api/Reports/all-tickets`,
      { headers: getHeaders() }
    );
    if (!allTicketsResponse.ok) throw new Error('Failed to fetch tickets data');
    
    let allTickets = await allTicketsResponse.json();
    
    // Filter by category IDs if provided (for category admins)
    if (categoryIds && categoryIds.length > 0) {
      allTickets = allTickets.filter((ticket: any) => {
        const ticketCategoryId = ticket.categoryId || ticket.category?.id;
        return categoryIds.includes(ticketCategoryId);
      });
    }
    
    const totalTickets = allTickets.length;
    
    // Calculate weekly issue types (categories) - same as web
    const categoryCount: Record<string, number> = {};
    allTickets.forEach((ticket: any) => {
      const category = ticket.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    const weeklyIssueTypes = Object.entries(categoryCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([category, count]) => ({
        issueType: category,
        count,
        department: 'General'
      }));

    // Calculate status distribution
    const statusCount: Record<string, number> = {};
    allTickets.forEach((ticket: any) => {
      const status = ticket.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const subcategoryCounts = Object.entries(statusCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([status, count], index) => ({
        subcategoryId: index + 1,
        subcategoryName: status,
        categoryName: 'Status',
        count,
        percentage: (count as number / totalTickets) * 100
      }));

    return {
      weeklyIssueTypes,
      weeklyDepartments: [{ department: 'General', count: totalTickets, percentage: 100 }],
      agentStats: [],
      subcategoryCounts,
      totalTickets,
      averageResolutionTime: 0
    };
  },

  getAllTicketsForAnalytics: async () => {
    const response = await fetch(
      `${getBaseUrl()}/api/Reports/all-tickets`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch all tickets');
    return response.json();
  },

  // V2 Analytics APIs - Same as Web Frontend widgets
  getCustomFieldAnalytics: async (days = 7, categoryIds?: number[]) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (categoryIds && categoryIds.length > 0) {
      params.append('categoryIds', categoryIds.join(','));
    }
    const response = await fetch(
      `${getBaseUrl()}/api/tickets-v2/custom-fields/analytics?${params}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch custom field analytics');
    return response.json();
  },

  getAgentPerformance: async (days = 7, categoryIds?: number[]) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (categoryIds && categoryIds.length > 0) {
      params.append('categoryIds', categoryIds.join(','));
    }
    const response = await fetch(
      `${getBaseUrl()}/api/tickets-v2/agent-performance?${params}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch agent performance');
    return response.json();
  },

  getDepartmentAnalytics: async (days = 7, categoryIds?: number[]) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (categoryIds && categoryIds.length > 0) {
      params.append('categoryIds', categoryIds.join(','));
    }
    const response = await fetch(
      `${getBaseUrl()}/api/tickets-v2/department-analytics?${params}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch department analytics');
    return response.json();
  },
};
