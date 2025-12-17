import { API_CONFIG } from '../config/api';

// Types
export interface BrandingSettingsDto {
  id: number;
  logoUrl: string | null;
  logoFileName: string | null;
  faviconUrl: string | null;
  loginTitle: string;
  loginSubtitle: string;
  appName: string;
  appTagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  updatedAt: string;
  updatedByName: string | null;
}

export interface UpdateBrandingSettingsRequest {
  loginTitle?: string;
  loginSubtitle?: string;
  appName?: string;
  appTagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
}

export interface LogoUploadResponse {
  logoUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

// Helper for authenticated requests
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

// API Functions
export const getBrandingSettings = async (): Promise<BrandingSettingsDto> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/branding`);
  if (!response.ok) {
    throw new Error('Failed to fetch branding settings');
  }
  return response.json();
};

export const updateBrandingSettings = async (data: UpdateBrandingSettingsRequest): Promise<BrandingSettingsDto> => {
  const response = await fetchWithAuth('/branding', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const uploadLogo = async (file: File): Promise<LogoUploadResponse> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_CONFIG.BASE_URL}/branding/logo`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload logo');
  }

  return response.json();
};

export const deleteLogo = async (): Promise<void> => {
  await fetchWithAuth('/branding/logo', {
    method: 'DELETE',
  });
};

export const uploadFavicon = async (file: File): Promise<LogoUploadResponse> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_CONFIG.BASE_URL}/branding/favicon`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload favicon');
  }

  return response.json();
};

// React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useBrandingSettings = () => {
  return useQuery({
    queryKey: ['branding'],
    queryFn: getBrandingSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useUpdateBrandingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBrandingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
};

export const useDeleteLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
};

export const useUploadFavicon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFavicon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
};
