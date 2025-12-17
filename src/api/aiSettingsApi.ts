import { API_CONFIG } from '../config/api';

// Helper function for API calls with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  
  return response;
};

// Types
export interface AISettingsResponse {
  enabled: boolean;
  provider: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutSeconds: number;
  azureApiVersion?: string;
}

export interface UpdateAISettingsRequest {
  enabled?: boolean;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutSeconds?: number;
  azureApiVersion?: string;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  defaultBaseUrl: string;
  suggestedModels: string[];
}

export interface AIProvidersResponse {
  providers: AIProviderInfo[];
}

export interface TestAIConnectionRequest {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface TestAIConnectionResponse {
  success: boolean;
  message: string;
  responseTimeMs?: number;
}

// API Functions
export const getAISettings = async (): Promise<AISettingsResponse> => {
  const response = await fetchWithAuth('/ai/settings');
  return response.json();
};

export const updateAISettings = async (request: UpdateAISettingsRequest): Promise<AISettingsResponse> => {
  const response = await fetchWithAuth('/ai/settings', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const getAIProviders = async (): Promise<AIProvidersResponse> => {
  const response = await fetchWithAuth('/ai/settings/providers');
  return response.json();
};

export const testAIConnection = async (request: TestAIConnectionRequest): Promise<TestAIConnectionResponse> => {
  const response = await fetchWithAuth('/ai/settings/test', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export default {
  getAISettings,
  updateAISettings,
  getAIProviders,
  testAIConnection
};
