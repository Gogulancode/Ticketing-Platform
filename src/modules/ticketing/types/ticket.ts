// Import the enums and types from the API file
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
} from '../api/ticketsApi';

// Export the types from the API file for easier imports
export {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
  type CreateTicketDto,
  type TicketLinkDto,
  type UpdateTicketDto,
  type TicketDto,
  type CreateCommentDto,
  type CommentDto,
  type AttachmentDto,
  type TicketMetricsDto,
  type TicketQueryDto,
  type PagedResult,
} from '../api/ticketsApi';

// Additional types for the frontend components
export interface TicketComment {
  id: string;
  content: string;
  authorEmail?: string;
  createdAt: string;
}

// Map the API enums to string literals for easier use
export type TicketStatusString = 'Open' | 'InProgress' | 'Resolved' | 'Closed';
export type TicketPriorityString = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketCategoryString = 'Access' | 'Content' | 'Bug' | 'Other';

// Helper functions to convert between API enums and strings
export const ticketStatusToString = (status: TicketStatus): TicketStatusString => {
  switch (status) {
    case TicketStatus.New: return 'Open';
    case TicketStatus.InReview: return 'InProgress';
    case TicketStatus.WaitingUser: return 'InProgress';
    case TicketStatus.Resolved: return 'Resolved';
    case TicketStatus.Closed: return 'Closed';
    default: return 'Open';
  }
};

export const stringToTicketStatus = (status: TicketStatusString): TicketStatus => {
  switch (status) {
    case 'Open': return TicketStatus.New;
    case 'InProgress': return TicketStatus.InReview;
    case 'Resolved': return TicketStatus.Resolved;
    case 'Closed': return TicketStatus.Closed;
    default: return TicketStatus.New;
  }
};

export const ticketPriorityToString = (priority: TicketPriority): TicketPriorityString => {
  switch (priority) {
    case TicketPriority.Low: return 'Low';
    case TicketPriority.Medium: return 'Medium';
    case TicketPriority.High: return 'High';
    case TicketPriority.Urgent: return 'Critical';
    default: return 'Medium';
  }
};

export const stringToTicketPriority = (priority: TicketPriorityString): TicketPriority => {
  switch (priority) {
    case 'Low': return TicketPriority.Low;
    case 'Medium': return TicketPriority.Medium;
    case 'High': return TicketPriority.High;
    case 'Critical': return TicketPriority.Urgent;
    default: return TicketPriority.Medium;
  }
};

export const ticketCategoryToString = (category: TicketCategory): TicketCategoryString => {
  switch (category) {
    case TicketCategory.Access: return 'Access';
    case TicketCategory.Content: return 'Content';
    case TicketCategory.Bug: return 'Bug';
    case TicketCategory.Other: return 'Other';
    default: return 'Other';
  }
};

export const stringToTicketCategory = (category: TicketCategoryString): TicketCategory => {
  switch (category) {
    case 'Access': return TicketCategory.Access;
    case 'Content': return TicketCategory.Content;
    case 'Bug': return TicketCategory.Bug;
    case 'Other': return TicketCategory.Other;
    default: return TicketCategory.Other;
  }
};
