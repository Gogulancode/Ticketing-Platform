// Ticketing API service
import { API_CONFIG } from '../../../config/api';

const API_ENDPOINT = API_CONFIG.BASE_URL;

export interface Ticket {
  id: string;
  publicId?: number; // Public facing ticket number like #105445
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: number;
  createdByUserId: string;
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  isOverdue: boolean;
  
  // Extended fields for relational database support
  subCategory?: number; // Maps to database SubCategory column
  categoryId?: number; // Maps to relational category tables
  subcategoryId?: number; // Maps to relational subcategory tables  
  departmentId?: number; // Maps to department assignment
  
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attachments?: any[];
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isInternal: boolean;
}

export enum TicketStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3,
  OnHold = 4
}

export enum TicketPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum TicketCategory {
  TechnicalSupport = 0,
  GeneralInquiry = 1,
  BugReport = 2,
  FeatureRequest = 3
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  categoryId?: number;
  subcategoryId?: number;
  departmentId?: number;
  statusId?: number;
  customFieldValues?: Record<string, any>;
  attachments?: File[];
}

export interface AttachmentRequest {
  fileName: string;
  contentType: string;
  base64Content: string;
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:type;base64, prefix
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = error => reject(error);
  });
};

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiFetch(path: string, options: { [key: string]: any } = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  
  const res = await fetch(`${API_ENDPOINT}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const ticketsApi = {
  // Get all tickets
  async getTickets(params?: { status?: TicketStatus; priority?: TicketPriority; category?: TicketCategory }): Promise<Ticket[]> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : '';
    return apiFetch(`/tickets${query}`);
  },

  // Get tickets assigned to current user
  async getMyTickets(): Promise<Ticket[]> {
    return apiFetch('/tickets/my');
  },

  // Get single ticket
  async getTicket(id: string): Promise<Ticket> {
    return apiFetch(`/tickets/${id}`);
  },

  // Create new ticket
  async createTicket(ticket: CreateTicketRequest): Promise<Ticket> {
    // Process attachments if any
    let attachments: AttachmentRequest[] = [];
    if (ticket.attachments && ticket.attachments.length > 0) {
      attachments = await Promise.all(
        ticket.attachments.map(async (file) => ({
          fileName: file.name,
          contentType: file.type,
          base64Content: await fileToBase64(file)
        }))
      );
    }

    const requestData = {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      categoryId: ticket.categoryId,
      subcategoryId: ticket.subcategoryId,
      departmentId: ticket.departmentId,
      statusId: ticket.statusId,
      customFieldValues: ticket.customFieldValues,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    return apiFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  // Update ticket
  async updateTicket(id: string, ticket: Partial<Ticket>): Promise<Ticket> {
    console.log('🔄 UpdateTicket API call:', { id, ticket });
    return apiFetch(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticket),
    });
  },

  // Add comment to ticket
  async addComment(ticketId: string, content: string, isInternal: boolean = false): Promise<TicketComment> {
    return apiFetch(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    });
  },

  // Get ticket statistics
  async getStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    return apiFetch('/tickets/statistics');
  },

  // Assign ticket to agent
  async assignTicket(ticketId: string, agentId: string): Promise<Ticket> {
    return apiFetch(`/tickets/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ AgentId: agentId }),
    });
  },

  // Unassign ticket from agent
  async unassignTicket(ticketId: string): Promise<Ticket> {
    return apiFetch(`/tickets/${ticketId}/unassign`, {
      method: 'POST',
    });
  },

  // Delete ticket
  async deleteTicket(ticketId: string): Promise<void> {
    return apiFetch(`/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  // Get ticket collaborators
  async getCollaborators(ticketId: string): Promise<TicketCollaborator[]> {
    return apiFetch(`/tickets/${ticketId}/collaborators`);
  },

  // Add collaborator to ticket
  async addCollaborator(ticketId: string, userId: string, role: string = 'Collaborator'): Promise<TicketCollaborator> {
    return apiFetch(`/tickets/${ticketId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  // Remove collaborator from ticket
  async removeCollaborator(ticketId: string, userId: string): Promise<void> {
    return apiFetch(`/tickets/${ticketId}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  }
};

export interface TicketCollaborator {
  id: number;
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  addedByUserId: string;
  addedByUserName: string;
  addedAt: string;
}
