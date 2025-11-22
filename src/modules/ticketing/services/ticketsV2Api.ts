// V2 API Service - Uses the working direct SQL endpoints
export interface TicketV2Comment {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface SubCategory {
  id: number;
  name: string;
  description: string;
}

export interface Agent {
  id: number;
  userId: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
}

export interface TicketUpdateRequest {
  title?: string;
  description?: string;
  category?: number;
  priority?: number;
  status?: number;
  categoryId?: number;
  subcategoryId?: number;
  departmentId?: number;
  assignedToUserId?: string;
  customFields?: Record<string, CustomFieldValue | CustomFieldValue[]>; // Add support for custom fields
}

type CustomFieldValue = string | number | boolean | null;

export interface CommentRequest {
  content: string;
  isInternal: boolean;
}

export interface SearchTicket {
  id: string;
  publicId: number | null;
  title: string;
  status: number;
  priority: number;
  createdAt: string;
  createdByName: string;
}

export interface MergeRequest {
  ticketIds: string[];
  reason: string;
}

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/tickets-v2`;

type ApiJson = Record<string, unknown>;

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const ticketsV2Api = {
  // Get single ticket
  async getTicket(ticketId: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get ticket: ${response.statusText}`);
    }
    return response.json();
  },

  // Comments
  async getComments(ticketId: string): Promise<TicketV2Comment[]> {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.statusText}`);
    }
    return response.json();
  },

  async addComment(ticketId: string, comment: { content: string; isInternal: boolean }): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(comment),
    });
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
    return response.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get categories: ${response.statusText}`);
    }
    return response.json();
  },

  // SubCategories
  async getSubCategories(categoryId: number): Promise<SubCategory[]> {
    const response = await fetch(`${API_BASE}/categories/${categoryId}/subcategories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get subcategories: ${response.statusText}`);
    }
    return response.json();
  },

  // Agents
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE}/agents`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }
    return response.json();
  },

  // Ticket Updates
  async updateTicket(ticketId: string, update: TicketUpdateRequest): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ticket: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete Ticket
  async deleteTicket(ticketId: string, reason: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ticket: ${response.statusText}`);
    }
    return response.json();
  },

  // Search Tickets
  async searchTickets(query: string, excludeTicketId?: string): Promise<SearchTicket[]> {
    const params = new URLSearchParams({ query });
    if (excludeTicketId) {
      params.append('excludeTicketId', excludeTicketId);
    }
    
    const response = await fetch(`${API_BASE}/search?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to search tickets: ${response.statusText}`);
    }
    return response.json();
  },

  // Merge Tickets
  async mergeTickets(primaryTicketId: string, mergeRequest: MergeRequest): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${primaryTicketId}/merge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(mergeRequest),
    });
    if (!response.ok) {
      throw new Error(`Failed to merge tickets: ${response.statusText}`);
    }
    return response.json();
  },

  // Get Merged Tickets Info
  async getMergedInfo(ticketId: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}/merged-info`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get merged info: ${response.statusText}`);
    }
    return response.json();
  },

  // Email Functions
  async replyEmail(ticketId: string, replyMessage: string, sentByUserId?: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}/reply-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ replyMessage, sentByUserId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send email reply: ${response.statusText}`);
    }
    return response.json();
  },

  async forwardEmail(ticketId: string, recipientEmail: string, forwardMessage: string, recipientName?: string, sentByUserId?: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/${ticketId}/forward-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientEmail, recipientName, forwardMessage, sentByUserId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to forward email: ${response.statusText}`);
    }
    return response.json();
  },

  async processEmail(fromEmail: string, subject: string, body: string): Promise<ApiJson> {
    const response = await fetch(`${API_BASE}/process-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fromEmail, subject, body }),
    });
    if (!response.ok) {
      throw new Error(`Failed to process email: ${response.statusText}`);
    }
    return response.json();
  },
};