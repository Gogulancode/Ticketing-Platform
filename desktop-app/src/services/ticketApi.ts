import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const getBaseUrl = () => useAuthStore.getState().serverUrl;
const getToken = () => useAuthStore.getState().token;

// ============ Base Fetch Helper ============

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  showErrorToast = true
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
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    
    if (showErrorToast) {
      toast.error(errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text);
}

// For FormData uploads (attachments)
async function fetchFormData<T>(
  endpoint: string,
  formData: FormData,
  showErrorToast = true
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    
    if (showErrorToast) {
      toast.error(errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text);
}

// ============ Types ============

export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  subcategory?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedTo?: number;
  assignedToName?: string;
  creatorName?: string;
  attachments?: Attachment[];
  customFieldValues?: any[];
}

export interface Comment {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  createdBy: number;
  creatorName?: string;
  isInternal: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  sizeBytes?: number;
  contentType: string;
  uploadedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
}

export interface Priority {
  id: number;
  name: string;
  level: number;
  color?: string;
}

export interface Status {
  id: number;
  name: string;
  color?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  departmentId?: number;
}

export interface QuickTemplate {
  id: number;
  name: string;
  content: string;
}

export interface CustomField {
  id: number;
  name: string;
  fieldType: string;
  isRequired: boolean;
  options?: string[];
}

export interface Collaborator {
  id: number;
  userId: number;
  userName: string;
  email: string;
  addedAt: string;
}

// ============ Ticket Settings API ============

export const ticketSettingsApi = {
  getCategories: async (): Promise<Category[]> => {
    return fetchApi<Category[]>('/api/tickets/settings/categories');
  },

  getSubcategories: async (): Promise<Subcategory[]> => {
    return fetchApi<Subcategory[]>('/api/tickets/settings/subcategories');
  },

  getPriorities: async (): Promise<Priority[]> => {
    return fetchApi<Priority[]>('/api/tickets/settings/priorities');
  },

  getStatuses: async (): Promise<Status[]> => {
    return fetchApi<Status[]>('/api/tickets/settings/statuses');
  },

  getDepartments: async (): Promise<Department[]> => {
    return fetchApi<Department[]>('/api/tickets/settings/departments');
  },

  getAgents: async (): Promise<Agent[]> => {
    return fetchApi<Agent[]>('/api/tickets/settings/agents');
  },

  getQuickTemplates: async (): Promise<QuickTemplate[]> => {
    return fetchApi<QuickTemplate[]>('/api/tickets/settings/quick-templates');
  },

  getCustomFields: async (categoryId: number, subcategoryId?: number): Promise<CustomField[]> => {
    const params = new URLSearchParams({ categoryId: categoryId.toString() });
    if (subcategoryId) params.append('subcategoryId', subcategoryId.toString());
    return fetchApi<CustomField[]>(`/api/tickets/settings/custom-fields?${params}`);
  },

  checkCategoryAdmin: async (userId: number): Promise<{ isAdmin: boolean; categoryIds?: number[] }> => {
    return fetchApi<{ isAdmin: boolean; categoryIds?: number[] }>(
      `/api/tickets/settings/category-admins/check/${userId}`,
      {},
      false // Don't show error toast for this check
    );
  },

  // Load all settings at once (useful for forms)
  loadAllSettings: async () => {
    const [categories, subcategories, departments, priorities, quickTemplates] = await Promise.all([
      ticketSettingsApi.getCategories(),
      ticketSettingsApi.getSubcategories(),
      ticketSettingsApi.getDepartments(),
      ticketSettingsApi.getPriorities(),
      ticketSettingsApi.getQuickTemplates(),
    ]);
    return { categories, subcategories, departments, priorities, quickTemplates };
  },

  // Load all settings including statuses and agents (for ticket detail)
  loadDetailSettings: async () => {
    const [categories, subcategories, priorities, statuses, agents] = await Promise.all([
      ticketSettingsApi.getCategories(),
      ticketSettingsApi.getSubcategories(),
      ticketSettingsApi.getPriorities(),
      ticketSettingsApi.getStatuses(),
      ticketSettingsApi.getAgents(),
    ]);
    return { categories, subcategories, priorities, statuses, agents };
  },
};

// ============ Tickets API (v2) ============

export const ticketsApi = {
  // Get user's tickets
  getMyTickets: async (pageSize = 500): Promise<Ticket[]> => {
    return fetchApi<Ticket[]>(`/api/tickets/my?pageSize=${pageSize}`);
  },

  // Get single ticket
  getTicket: async (id: string): Promise<Ticket> => {
    return fetchApi<Ticket>(`/api/tickets-v2/${id}`);
  },

  // Create ticket
  createTicket: async (formData: FormData): Promise<Ticket> => {
    return fetchFormData<Ticket>('/api/tickets', formData);
  },

  // Update ticket
  updateTicket: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    return fetchApi<Ticket>(`/api/tickets-v2/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Reopen ticket
  reopenTicket: async (id: string, reason: string): Promise<void> => {
    return fetchApi<void>(`/api/tickets-v2/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Get comments
  getComments: async (ticketId: string): Promise<Comment[]> => {
    return fetchApi<Comment[]>(`/api/tickets-v2/${ticketId}/comments`);
  },

  // Get comments with attachments
  getCommentsWithAttachments: async (ticketId: string): Promise<Comment[]> => {
    return fetchApi<Comment[]>(`/api/tickets-v2/${ticketId}/comments-with-attachments`);
  },

  // Add comment
  addComment: async (ticketId: string, formData: FormData): Promise<Comment> => {
    return fetchFormData<Comment>(`/api/tickets-v2/${ticketId}/comments`, formData);
  },

  // Forward ticket via email
  forwardTicket: async (ticketId: string, data: { toEmail: string; message?: string }): Promise<void> => {
    return fetchApi<void>(`/api/tickets-v2/${ticketId}/forward-email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reply to ticket via email
  replyEmail: async (ticketId: string, data: { toEmail: string; message: string }): Promise<void> => {
    return fetchApi<void>(`/api/tickets-v2/${ticketId}/reply-email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get attachment download URL
  getAttachmentUrl: (attachmentId: number): string => {
    return `${getBaseUrl()}/api/tickets-v2/attachments/${attachmentId}/download`;
  },
};

// ============ Collaborators API (uses v1 endpoint - no v2 equivalent) ============

export const collaboratorsApi = {
  getCollaborators: async (ticketId: string): Promise<Collaborator[]> => {
    return fetchApi<Collaborator[]>(`/api/tickets/${ticketId}/collaborators`);
  },

  addCollaborator: async (ticketId: string, email: string): Promise<Collaborator> => {
    return fetchApi<Collaborator>(`/api/tickets/${ticketId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  removeCollaborator: async (ticketId: string, collaboratorId: number): Promise<void> => {
    return fetchApi<void>(`/api/tickets/${ticketId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    });
  },
};

// ============ Analytics API ============

export const analyticsApi = {
  getDashboard: async (departmentId?: number): Promise<any> => {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return fetchApi<any>(`/api/analytics/dashboard${params}`, {}, false);
  },

  // Fallback endpoint
  getDashboardFallback: async (): Promise<any> => {
    return fetchApi<any>('/api/Reports/all-tickets', {}, false);
  },
};

// ============ Reports API ============

export const reportsApi = {
  getResolutionResponse: async (params: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/reports/resolution-response?${query}`);
  },

  getAgentPerformance: async (params: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/reports/agent-performance?${query}`);
  },

  getUnresolved: async (params: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/reports/unresolved?${query}`);
  },

  getAllTickets: async (params: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/reports/all-tickets?${query}`);
  },

  exportReport: async (type: string, params: Record<string, string>): Promise<Blob> => {
    const query = new URLSearchParams(params).toString();
    const token = getToken();
    
    const response = await fetch(`${getBaseUrl()}/api/reports/${type}/export?${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    
    return response.blob();
  },
};

// ============ AI API ============

export const aiApi = {
  enhanceText: async (text: string): Promise<{ enhancedText: string }> => {
    return fetchApi<{ enhancedText: string }>('/api/ai/enhance-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

// ============ Notifications API ============

export const notificationsApi = {
  getNotifications: async (): Promise<any[]> => {
    return fetchApi<any[]>('/api/notifications');
  },

  markAsRead: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return fetchApi<void>('/api/notifications/read-all', {
      method: 'PUT',
    });
  },
};
