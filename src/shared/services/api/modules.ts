// Client-side modules API functions
const API_BASE = 'http://localhost:5015/api';

interface Module {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sections?: Section[];
}

interface Section {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  moduleId: number;
}

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
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const getModules = async (): Promise<Module[]> => {
  return apiFetch('/Modules');
};

export const getModule = async (moduleId: number): Promise<Module> => {
  return apiFetch(`/Modules/${moduleId}`);
};

export const createModule = async (moduleData: Partial<Module>): Promise<Module> => {
  return apiFetch('/Modules', {
    method: 'POST',
    body: JSON.stringify(moduleData),
  });
};

export const updateModule = async (moduleId: number, moduleData: Partial<Module>): Promise<Module> => {
  return apiFetch(`/Modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(moduleData),
  });
};

export const toggleModuleStatus = async (moduleId: number, isActive: boolean): Promise<Module> => {
  return apiFetch(`/Modules/${moduleId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  });
};

export const getSectionsByModule = async (moduleId: number): Promise<Section[]> => {
  return apiFetch(`/Modules/${moduleId}/sections`);
};

export const createSection = async (sectionData: Partial<Section>): Promise<Section> => {
  return apiFetch('/Modules/sections', {
    method: 'POST',
    body: JSON.stringify(sectionData),
  });
};

export const updateSection = async (sectionId: number, sectionData: Partial<Section>): Promise<Section> => {
  return apiFetch(`/Modules/sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify(sectionData),
  });
};

export const deleteSection = async (sectionId: number): Promise<void> => {
  return apiFetch(`/Modules/sections/${sectionId}`, {
    method: 'DELETE',
  });
};

export const toggleSectionStatus = async (moduleId: number, sectionId: number, isActive: boolean): Promise<Section> => {
  return apiFetch(`/Modules/${moduleId}/sections/${sectionId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  });
};
