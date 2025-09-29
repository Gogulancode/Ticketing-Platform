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
}

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

const API_BASE = 'http://localhost:5015/api/tickets-v2';

export const ticketsV2Api = {
  // Get Single Ticket
  async getTicket(ticketId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}`);
    if (!response.ok) {
      throw new Error(`Failed to get ticket: ${response.statusText}`);
    }
    return response.json();
  },

  // Comments
  async getComments(ticketId: string): Promise<TicketV2Comment[]> {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`);
    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.statusText}`);
    }
    return response.json();
  },

  async addComment(ticketId: string, comment: CommentRequest): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
    return response.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) {
      throw new Error(`Failed to get categories: ${response.statusText}`);
    }
    return response.json();
  },

  // SubCategories
  async getSubCategories(categoryId: number): Promise<SubCategory[]> {
    const response = await fetch(`${API_BASE}/categories/${categoryId}/subcategories`);
    if (!response.ok) {
      throw new Error(`Failed to get subcategories: ${response.statusText}`);
    }
    return response.json();
  },

  // Agents
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }
    return response.json();
  },

  // Ticket Updates
  async updateTicket(ticketId: string, update: TicketUpdateRequest): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ticket: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete Ticket
  async deleteTicket(ticketId: string, reason: string): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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
    
    const response = await fetch(`${API_BASE}/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to search tickets: ${response.statusText}`);
    }
    return response.json();
  },

  // Merge Tickets
  async mergeTickets(primaryTicketId: string, mergeRequest: MergeRequest): Promise<any> {
    const response = await fetch(`${API_BASE}/${primaryTicketId}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mergeRequest),
    });
    if (!response.ok) {
      throw new Error(`Failed to merge tickets: ${response.statusText}`);
    }
    return response.json();
  },

  // Get Merged Tickets Info
  async getMergedInfo(ticketId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}/merged-info`);
    if (!response.ok) {
      throw new Error(`Failed to get merged info: ${response.statusText}`);
    }
    return response.json();
  },

  // Email Functions
  async replyEmail(ticketId: string, replyMessage: string, sentByUserId?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}/reply-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ replyMessage, sentByUserId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send email reply: ${response.statusText}`);
    }
    return response.json();
  },

  async forwardEmail(ticketId: string, recipientEmail: string, forwardMessage: string, recipientName?: string, sentByUserId?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/${ticketId}/forward-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipientEmail, recipientName, forwardMessage, sentByUserId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to forward email: ${response.statusText}`);
    }
    return response.json();
  },

  async processEmail(fromEmail: string, subject: string, body: string): Promise<any> {
    const response = await fetch(`${API_BASE}/process-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fromEmail, subject, body }),
    });
    if (!response.ok) {
      throw new Error(`Failed to process email: ${response.statusText}`);
    }
    return response.json();
  },
};