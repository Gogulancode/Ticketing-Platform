/**
 * Smart API fetch utility that works in both development and production
 * Automatically handles URL resolution for relative API paths
 * Dynamically detects API URL based on current domain
 */

// Get the correct API base URL
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If explicit env URL is set and not localhost, use it
  if (envUrl && envUrl !== 'http://localhost:5015/api') {
    return envUrl;
  }
  
  // In local development, use relative URLs that Vite will proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, dynamically construct API URL based on current domain
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol; // 'http:' or 'https:'
    
    // If running on localhost, use localhost API
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:5015/api';
    }
    
    // For production domains, construct API URL
    // Pattern: If frontend is "support.domain.com", API is "api.domain.com"
    // Or if frontend is "domain.com", API is "api.domain.com"
    let apiHost = currentHost;
    
    // If hostname starts with "support.", replace with "api."
    if (currentHost.startsWith('support.')) {
      apiHost = currentHost.replace('support.', 'api.');
    } 
    // Otherwise, prepend "api." to the domain
    else if (!currentHost.startsWith('api.')) {
      apiHost = `api.${currentHost}`;
    }
    
    return `${protocol}//${apiHost}/api`;
  }
  
  // Fallback for SSR or other edge cases
  return 'http://localhost:5015/api';
};

/**
 * Smart fetch that automatically resolves API URLs correctly for both dev and production
 * @param input - URL or relative path (e.g., '/api/tickets' or 'tickets-v2/123')
 * @param init - Fetch options
 */
export const apiFetch = (input: string, init?: RequestInit): Promise<Response> => {
  let url: string;
  
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Already a full URL, use as-is
    url = input;
  } else if (input.startsWith('/api/')) {
    // Relative API path - convert to correct base
    const apiBase = getApiBaseUrl();
    url = input.replace('/api', apiBase);
  } else if (input.startsWith('/')) {
    // Other relative path - assume it's API related
    url = `${getApiBaseUrl()}${input}`;
  } else {
    // No leading slash - add API base
    url = `${getApiBaseUrl()}/${input}`;
  }
  
  return fetch(url, init);
};

// Export the base URL for components that need it
export const API_BASE_URL = getApiBaseUrl();