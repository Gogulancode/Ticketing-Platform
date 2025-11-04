/**
 * Application-wide constants
 * Use this file to define constants used across the application
 */

// API Configuration
export const API_CONSTANTS = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TICKETING: '/tickets',
  TRAINING: '/training',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
} as const;

// Status Colors (for tickets, etc.)
export const STATUS_COLORS = {
  OPEN: '#3b82f6', // blue
  IN_PROGRESS: '#f59e0b', // amber
  RESOLVED: '#10b981', // green
  CLOSED: '#6b7280', // gray
  CANCELLED: '#ef4444', // red
} as const;
