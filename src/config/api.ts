/**
 * Centralized API configuration
 * Handles both local development (with Vite proxy) and production deployment
 */

// Get the base API URL from environment
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // In production/staging, use the full environment URL
  if (envUrl && envUrl !== 'http://localhost:5015/api') {
    return envUrl;
  }
  
  // In local development, use relative URLs that Vite will proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Fallback for local production builds
  return 'http://localhost:5015/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  
  // Helper methods for different API endpoints
  tickets: (path: string = '') => `${getApiBaseUrl()}/tickets${path}`,
  ticketsV2: (path: string = '') => `${getApiBaseUrl()}/tickets-v2${path}`,
  auth: (path: string = '') => `${getApiBaseUrl()}/auth${path}`,
  users: (path: string = '') => `${getApiBaseUrl()}/users${path}`,
  reports: (path: string = '') => `${getApiBaseUrl()}/reports${path}`,
  settings: (path: string = '') => `${getApiBaseUrl()}/settings${path}`,
  emails: (path: string = '') => `${getApiBaseUrl()}/emails${path}`,
  forwards: (path: string = '') => `${getApiBaseUrl()}/forwards${path}`,
  autoassignment: (path: string = '') => `${getApiBaseUrl()}/autoassignment${path}`,
  
  // Full URL helper
  url: (path: string) => {
    if (path.startsWith('/')) {
      return `${getApiBaseUrl()}${path}`;
    }
    return `${getApiBaseUrl()}/${path}`;
  }
};

// Export the base URL for backwards compatibility
export const API_BASE_URL = API_CONFIG.BASE_URL;