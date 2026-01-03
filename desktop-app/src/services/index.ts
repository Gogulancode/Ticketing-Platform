// Centralized API exports for the desktop app
// Use these instead of manual fetch() calls for consistency and error handling

export { authApi, chatApi } from './api';
export {
  // Settings APIs
  ticketSettingsApi,
  
  // Ticket CRUD APIs
  ticketsApi,
  
  // Collaborators API  
  collaboratorsApi,
  
  // Analytics & Reports APIs
  analyticsApi,
  reportsApi,
  
  // AI APIs
  aiApi,
  
  // Notifications APIs
  notificationsApi,
  
  // Types
  type Ticket,
  type Comment,
  type Attachment,
  type Category,
  type Subcategory,
  type Priority,
  type Status,
  type Department,
  type Agent,
  type QuickTemplate,
  type CustomField,
  type Collaborator,
} from './ticketApi';
