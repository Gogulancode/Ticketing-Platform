/**
 * Centralized API configuration
 * Handles both local development (with Vite proxy) and production deployment
 */

const DEFAULT_LOCAL_API = 'http://localhost:5016/api';

// Normalize a port so default ports are omitted
const normalizePort = (protocol: string, rawPort?: string) => {
  if (!rawPort) return '';
  const trimmed = `${rawPort}`.trim();
  if ((protocol === 'https:' && trimmed === '443') || (protocol === 'http:' && trimmed === '80')) {
    return '';
  }
  return `:${trimmed}`;
};

// Get the base API URL with dynamic environment detection
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;

    // Local development detection (localhost or 127.0.0.1 with any port)
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return DEFAULT_LOCAL_API; // Always use local backend for development
    }

    // Production domain - ALWAYS use HTTP port 81 (no SSL configured)
    if (currentHost === 'businesshub.babajishivram.com') {
      return 'http://businesshub.babajishivram.com:81/api';
    }

    // If we are on an unknown host but running in the browser, respect explicit env override
    const browserEnvUrl = import.meta.env.VITE_API_BASE_URL;
    if (browserEnvUrl) {
      return browserEnvUrl;
    }
  }

  // If explicit URL is set (e.g., during SSR/build), use it
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback for development or unknown environments
  return DEFAULT_LOCAL_API;
};

// Create the API URL once and log it for debugging
const dynamicApiBaseUrl = getApiBaseUrl();

// Debug logging (always show in console for troubleshooting)
console.log('🔧 API Configuration:', {
  baseUrl: dynamicApiBaseUrl,
  environment: import.meta.env.MODE,
  explicitUrl: import.meta.env.VITE_API_BASE_URL,
  apiHttpPort: import.meta.env.VITE_API_HTTP_PORT || 'default',
  apiHttpsPort: import.meta.env.VITE_API_HTTPS_PORT || 'default',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  port: typeof window !== 'undefined' ? window.location.port : 'N/A',
  fullLocation: typeof window !== 'undefined' ? window.location.href : 'server-side',
  detectedEnvironment: typeof window !== 'undefined' ? 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'LOCAL_DEV' :
     window.location.hostname === 'businesshub.babajishivram.com' ? 'PRODUCTION_DOMAIN' : 'UNKNOWN') : 'SERVER_SIDE'
});

export const API_CONFIG = {
  BASE_URL: dynamicApiBaseUrl,
  
  // Helper methods for different API endpoints
  tickets: (path: string = '') => `${dynamicApiBaseUrl}/tickets${path}`,
  ticketsV2: (path: string = '') => `${dynamicApiBaseUrl}/tickets-v2${path}`,
  auth: (path: string = '') => `${dynamicApiBaseUrl}/auth${path}`,
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