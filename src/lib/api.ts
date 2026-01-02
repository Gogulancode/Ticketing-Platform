// Update profile
export const updateProfile = (data: any) => apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(data) });

import { API_CONFIG } from '../config/api';

// Use centralized API configuration
const API_BASE = API_CONFIG.BASE_URL;

function getToken(): string | null {
  return localStorage.getItem('token');
}

// Rate limit tracking to prevent retry storms
let rateLimitedUntil: number = 0;

async function apiFetch(path: string, options: { [key: string]: any } = {}): Promise<any> {
  // Check if we're currently rate limited
  if (Date.now() < rateLimitedUntil) {
    const waitTime = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
    throw new Error(`Rate limited. Please wait ${waitTime} seconds.`);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  // Handle rate limiting (429)
  if (res.status === 429) {
    // Get retry-after header or default to 60 seconds
    const retryAfter = res.headers.get('Retry-After');
    const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
    rateLimitedUntil = Date.now() + (waitSeconds * 1000);
    console.warn(`⚠️ Rate limited. Waiting ${waitSeconds} seconds before retry.`);
    throw new Error(`Too many requests. Please wait ${waitSeconds} seconds.`);
  }
  
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Auth
export const login = (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const getCurrentUser = () => apiFetch('/auth/me');
export const refreshToken = () => apiFetch('/auth/refresh', { method: 'POST' });

// Modules
export const getModules = () => apiFetch('/Modules');
export const getModule = (id: any) => apiFetch(`/Modules/${id}`);
export const createModule = (data: any) => apiFetch('/Modules', { method: 'POST', body: JSON.stringify(data) });
export const updateModule = (id: any, data: any) => apiFetch(`/Modules/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Sections
export const getSections = () => apiFetch('/Sections');
export const getSection = (id: any) => apiFetch(`/Sections/${id}`);
export const getSectionsByModule = (moduleId: any) => apiFetch(`/Sections/module/${moduleId}`);
export const createSection = (data: any) => apiFetch('/Sections', { method: 'POST', body: JSON.stringify(data) });
export const updateSection = (id: any, data: any) => apiFetch(`/Sections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSection = (id: any) => apiFetch(`/Sections/${id}`, { method: 'DELETE' });

// Assessments
export const getAssessments = () => apiFetch('/assessments');
export const getAssessment = (id: any) => apiFetch(`/assessments/${id}`);
export const getAssessmentsByModule = (moduleId: any) => apiFetch(`/assessments/module/${moduleId}`);
export const createAssessment = (data: any) => apiFetch('/assessments', { method: 'POST', body: JSON.stringify(data) });
export const updateAssessment = (id: any, data: any) => apiFetch(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) });


// Uploaded Content
export const uploadContent = async (formData: FormData) => {
  // formData: FormData instance
  const token = getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/uploadedcontent`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getUploadedContent = async () => {
  const token = getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/uploadedcontent`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Roles
export const getRoles = () => apiFetch('/Roles');
export const getRole = (id: any) => apiFetch(`/Roles/${id}`);
export const createRole = (data: any) => apiFetch('/Roles', { method: 'POST', body: JSON.stringify(data) });
export const updateRole = (id: any, data: any) => apiFetch(`/Roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRole = (id: any) => apiFetch(`/Roles/${id}`, { method: 'DELETE' });

// Role Access
export const getRoleAccess = () => apiFetch('/roleaccess');
export const getRoleAccessByRoleId = (roleId: string) => apiFetch(`/roleaccess/role/${roleId}`);
export const getRolesWithAccess = () => apiFetch('/roleaccess/roles-summary');
export const seedRoleData = () => apiFetch('/roleaccess/seed-data', { method: 'POST' });
export const updateRoleAccess = (roleId: string, data: any) => apiFetch(`/roleaccess/role/${roleId}`, { method: 'PUT', body: JSON.stringify(data) });
export const checkUserAccess = (userId: string, moduleId: number, sectionId: number) => 
  apiFetch(`/roleaccess/check-access?userId=${userId}&moduleId=${moduleId}&sectionId=${sectionId}`);
