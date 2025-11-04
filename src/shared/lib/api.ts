// Client-side API functions
const API_BASE = 'http://localhost:5015/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiFetch(path: string, options: { [key: string]: any } = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Modules API
export const getModules = async () => {
  return apiFetch('/Modules');
};

export const toggleModuleStatus = async (moduleId: number, isActive: boolean) => {
  return apiFetch(`/Modules/${moduleId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  });
};

export const toggleSectionStatus = async (moduleId: number, sectionId: number, isActive: boolean) => {
  return apiFetch(`/Modules/${moduleId}/sections/${sectionId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  });
};

export const createModule = async (moduleData: any) => {
  return apiFetch('/Modules', {
    method: 'POST',
    body: JSON.stringify(moduleData),
  });
};

export const createSection = async (sectionData: any) => {
  return apiFetch('/Modules/sections', {
    method: 'POST',
    body: JSON.stringify(sectionData),
  });
};

export const getSectionsByModule = async (moduleId: number) => {
  return apiFetch(`/Modules/${moduleId}/sections`);
};

export const getModule = async (moduleId: number) => {
  return apiFetch(`/Modules/${moduleId}`);
};

export const deleteSection = async (sectionId: number) => {
  return apiFetch(`/Modules/sections/${sectionId}`, {
    method: 'DELETE',
  });
};

// Auth API
export const getCurrentUser = async () => {
  return apiFetch('/auth/me');
};

export const updateProfile = async (profileData: any) => {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Assessment API
export const getAssessments = async () => {
  return apiFetch('/assessments');
};

export const getAssessment = async (assessmentId: string) => {
  return apiFetch(`/assessments/${assessmentId}`);
};

export const createAssessment = async (assessmentData: any) => {
  return apiFetch('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessmentData),
  });
};

// Upload API
export const getUploadedContent = async () => {
  return apiFetch('/uploaded-content');
};

export const getUploadedContentByModule = async (moduleId: number) => {
  return apiFetch(`/uploaded-content/module/${moduleId}`);
};

// Direct API functions (for backward compatibility)
export const getModulesDirect = getModules;
export const getSectionsByModuleDirect = getSectionsByModule;

// Role API functions (basic implementations)
export const getRoles = async () => {
  return apiFetch('/roles');
};
