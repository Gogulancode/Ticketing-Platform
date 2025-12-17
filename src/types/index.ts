// Type definitions for the Ticketing Platform

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Agent' | 'User';
  email: string;
  avatar?: string;
  department?: string;
  isAgent?: boolean;
  isActive?: boolean;
}

// Ticketing Types
export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: number;
  category?: TicketCategory;
  assignedAgentId?: number;
  assignedAgent?: Agent;
  requesterId: string;
  requester?: User;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  branchId?: number;
  branch?: Branch;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TicketCategory {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  isActive: boolean;
  order: number;
}

export interface Agent {
  id: number;
  userId: string;
  name: string;
  email: string;
  department?: string;
  isActive: boolean;
  ticketGroupId?: number;
  ticketGroup?: TicketGroup;
}

export interface TicketGroup {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  agents?: Agent[];
}

export interface TicketComment {
  id: number;
  ticketId: number;
  content: string;
  isInternal: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
  uploadedAt: string;
}

// SLA Types
export interface SlaPolicy {
  id: number;
  name: string;
  description?: string;
  priority: TicketPriority;
  firstResponseTime: number; // in minutes
  resolutionTime: number; // in minutes
  escalationEnabled: boolean;
  isActive: boolean;
}

// Branch Types (for on-prem multi-branch tracking)
export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard/Analytics Types
export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
}

export interface BranchStats {
  branchId: number;
  branchName: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
}

// Filter/Search Types
export interface TicketFilter {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  categoryId?: number;
  assignedAgentId?: number;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Role Management Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string; // e.g., 'tickets', 'agents', 'settings'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  isActive: boolean;
}

// AI Feature Types (for future DeepSeek integration)
export interface AISuggestedReply {
  id: string;
  ticketId: number;
  suggestion: string;
  confidence: number;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  branchId?: number;
  insightType: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface AIAutoCloseCandidate {
  ticketId: number;
  ticketNumber: string;
  subject: string;
  daysSinceLastActivity: number;
  confidence: number;
  reason: string;
}
