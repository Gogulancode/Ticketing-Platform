/**
 * Smart API fetch utility that works in both development and production
 * Uses centralized API configuration for consistent URL resolution
 */

import { API_CONFIG } from '../config/api';

// Get the correct API base URL from centralized config
const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
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