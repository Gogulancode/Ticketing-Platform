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
  
  // Merge information
  hasMergedTickets?: boolean;
  wasMergedIntoAnother?: boolean;
  mergedTicketsCount?: number;
  
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
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
}

export interface TicketAttachment {
  id?: string | number;
  fileName?: string;
  url?: string;
  contentType?: string;
  sizeBytes?: number;
  [key: string]: unknown;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isInternal: boolean;
}

// Status IDs match the database TicketStatuses table
export enum TicketStatus {
  Open = 1,           // Database ID 1 = "Open"
  InProgress = 2,     // Database ID 2 = "In Progress"
  OnHold = 3,         // Database ID 3 = "On Hold"
  Resolved = 4,       // Database ID 4 = "Resolved"
  Closed = 5          // Database ID 5 = "Closed"
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
  customFieldValues?: TicketCustomFieldValues;
  attachments?: File[];
}

export type CustomFieldPrimitive = string | number | boolean | null;
export type TicketCustomFieldValues = Record<string, CustomFieldPrimitive | CustomFieldPrimitive[]>;

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

async function apiFetch<TResponse = unknown>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const token = getToken();
  const mergedHeaders = new Headers({ 'Content-Type': 'application/json' });
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const optionHeaders = options.headers;
  if (optionHeaders instanceof Headers) {
    optionHeaders.forEach((value, key) => mergedHeaders.set(key, value));
  } else if (Array.isArray(optionHeaders)) {
    optionHeaders.forEach(([key, value]) => mergedHeaders.set(key, value));
  } else if (optionHeaders && typeof optionHeaders === 'object') {
    Object.entries(optionHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        mergedHeaders.set(key, value);
      }
    });
  }

  const res = await fetch(`${API_ENDPOINT}${path}`, { ...options, headers: mergedHeaders });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as TResponse;
  }

  const text = await res.text();
  if (!text) {
    return undefined as TResponse;
  }
  try {
    return JSON.parse(text) as TResponse;
  } catch {
    return text as unknown as TResponse;
  }
}

type TicketIdentifier = {
  id?: string | number;
  ticketId?: string | number;
  Id?: string | number;
};

type MyTicketsResponse = Ticket[] | ({
  items?: Ticket[];
  tickets?: Ticket[];
  data?: Ticket[];
  assignedTickets?: Ticket[];
  collaboratorTickets?: Ticket[];
  assigned?: Ticket[];
  collaborations?: Ticket[];
} & Record<string, unknown>) | null | undefined;

export const ticketsApi = {
  // Get all tickets
  async getTickets(params?: { status?: TicketStatus; priority?: TicketPriority; category?: TicketCategory }): Promise<Ticket[]> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])).toString() : '';
    return apiFetch(`/tickets${query}`);
  },

  // Get tickets filtered by category IDs (for Category Heads)
  async getTicketsByCategories(categoryIds: number[]): Promise<Ticket[]> {
    if (!categoryIds.length) return [];
    const query = `?categoryIds=${categoryIds.join(',')}`;
    const response = await apiFetch<Ticket[] | { tickets?: Ticket[]; items?: Ticket[] }>(`/tickets/by-categories${query}`);
    if (Array.isArray(response)) return response;
    return response?.tickets || response?.items || [];
  },

  // Get tickets assigned to current user
  async getMyTickets(): Promise<Ticket[]> {
    // Request larger page size to get all tickets (API limits to 100 per page, but we request 500)
    // For large ticket volumes, consider implementing proper server-side pagination
    const raw = await apiFetch<MyTicketsResponse>('/tickets/my?pageSize=500');

    // If backend already returns an array, just pass it through
    if (Array.isArray(raw)) {
      return raw;
    }

    const bucket: Ticket[] = [];

    if (raw) {
      const potentialCollections = [
        raw.items,
        raw.tickets,
        raw.data,
        raw.assignedTickets,
        raw.collaboratorTickets,
        raw.assigned,
        raw.collaborations,
      ];

      for (const collection of potentialCollections) {
        if (Array.isArray(collection)) {
          bucket.push(...collection);
        }
      }
    }

    if (bucket.length === 0 && raw) {
      console.warn('⚠️ Unexpected my tickets response shape', raw);
    }

    // De-duplicate tickets (a user may be both assigned and collaborator)
    const uniqueTickets = new Map<string | number, Ticket>();
    for (const ticket of bucket) {
      const candidate = ticket as Ticket & TicketIdentifier;
      const ticketKey = candidate.id ?? candidate.ticketId ?? candidate.Id;
      if (ticketKey != null) {
        uniqueTickets.set(ticketKey, ticket as Ticket);
      }
    }

    if (uniqueTickets.size > 0) {
      return Array.from(uniqueTickets.values());
    }

    return bucket;
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
