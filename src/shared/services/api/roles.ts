import { Role, Permission, RoleFilter, RoleStats } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api';

// Use the existing API structure from lib/api.ts
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

// Role Management APIs
export const getRoles = async (filters?: Partial<RoleFilter>): Promise<{ roles: Role[], total: number }> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters.hasModuleAccess !== undefined) queryParams.append('hasModuleAccess', filters.hasModuleAccess.toString());
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.pageSize) queryParams.append('pageSize', filters.pageSize.toString());
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
  }

  try {
    const response = await apiFetch(`/roles?${queryParams}`);
    
    // Handle the new API response format that includes pagination
    if (response && typeof response === 'object' && 'roles' in response) {
      return {
        roles: Array.isArray(response.roles) ? response.roles.map((role: any) => ({
          id: role.id,
          name: role.name || '',
          description: role.description || '',
          originalRoleId: role.originalRoleId,
          isActive: role.isActive !== false,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: role.permissions || []
        })) : [],
        total: response.total || 0
      };
    }
    
    // Fallback for old API format (array)
    return {
      roles: Array.isArray(response) ? response.map((role: any) => ({
        id: role.id,
        name: role.name || '',
        description: role.description || '',
        originalRoleId: role.originalRoleId,
        isActive: role.isActive !== false,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.permissions || []
      })) : [],
      total: Array.isArray(response) ? response.length : 0
    };
  } catch (error) {
    console.error('Error fetching roles:', error);
    return { roles: [], total: 0 };
  }
};

export const getRoleById = async (roleId: string): Promise<Role> => {
  const role = await apiFetch(`/roles/${roleId}`);
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    originalRoleId: role.originalRoleId,
    isActive: role.isActive !== false,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions || []
  };
};

export const createRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'permissions'>): Promise<Role> => {
  const role = await apiFetch('/roles', {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
  
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    originalRoleId: role.originalRoleId,
    isActive: role.isActive !== false,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions || []
  };
};

export const updateRole = async (roleId: string, roleData: Partial<Role>): Promise<Role> => {
  const role = await apiFetch(`/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
  
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    originalRoleId: role.originalRoleId,
    isActive: role.isActive !== false,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions || []
  };
};

export const deleteRole = async (roleId: string): Promise<void> => {
  await apiFetch(`/roles/${roleId}`, {
    method: 'DELETE',
  });
};

// Permission Management APIs
export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  try {
    const modulesWithSections = await apiFetch(`/roleaccess/role/${roleId}/modules-sections`);
    const permissions: Permission[] = [];
    
    if (Array.isArray(modulesWithSections)) {
      modulesWithSections.forEach((module: any) => {
        // Add module permission if any sections have access
        const hasAnySectionAccess = module.sections?.some((section: any) => section.hasAccess);
        if (hasAnySectionAccess) {
          permissions.push({
            id: `${roleId}-${module.moduleId}`,
            roleId,
            moduleId: module.moduleId.toString(),
            moduleName: module.moduleName || '',
            isActive: true,
            erpModuleId: module.erpModuleId,
          });
        }
        
        // Add section permissions
        if (module.sections && Array.isArray(module.sections)) {
          module.sections.forEach((section: any) => {
            if (section.hasAccess) {
              permissions.push({
                id: `${roleId}-${module.moduleId}-${section.sectionId}`,
                roleId,
                moduleId: module.moduleId.toString(),
                sectionId: section.sectionId.toString(),
                moduleName: module.moduleName || '',
                sectionName: section.sectionName || '',
                isActive: section.hasAccess,
                erpModuleId: module.erpModuleId,
                erpSectionId: section.erpSectionId,
              });
            }
          });
        }
      });
    }
    
    return permissions;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
};

export const updateRolePermissions = async (roleId: string, permissions: Omit<Permission, 'id' | 'roleId'>[]): Promise<void> => {
  // Convert permissions to backend format
  const moduleAccess: { moduleId: number; sectionIds: number[] }[] = [];
  
  // Group permissions by module
  const moduleMap = new Map<string, number[]>();
  
  permissions.forEach(permission => {
    if (permission.sectionId) {
      const sectionId = parseInt(permission.sectionId);
      
      if (!moduleMap.has(permission.moduleId)) {
        moduleMap.set(permission.moduleId, []);
      }
      moduleMap.get(permission.moduleId)!.push(sectionId);
    }
  });
  
  // Convert to array format
  moduleMap.forEach((sectionIds, moduleId) => {
    moduleAccess.push({
      moduleId: parseInt(moduleId),
      sectionIds
    });
  });
  
  await apiFetch(`/roleaccess/role/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify({ ModuleAccess: moduleAccess }),
  });
};

export const bulkUpdatePermissions = async (updates: { roleId: string; permissions: Omit<Permission, 'id' | 'roleId'>[] }[]): Promise<void> => {
  await apiFetch('/roles/bulk-permissions', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Statistics and Analytics
export const getRoleStats = async (): Promise<RoleStats> => {
  try {
    const stats = await apiFetch('/roles/stats');
    return {
      totalRoles: stats.totalRoles || 0,
      activeRoles: stats.activeRoles || 0,
      totalPermissions: stats.totalPermissions || 0,
      rolesWithoutPermissions: stats.rolesWithoutPermissions || 0
    };
  } catch (error) {
    console.error('Error fetching role stats:', error);
    return {
      totalRoles: 0,
      activeRoles: 0,
      totalPermissions: 0,
      rolesWithoutPermissions: 0
    };
  }
};

// Export/Import
export const exportRoles = async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/roles/export?format=${format}`, {
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to export roles');
  }
  return response.blob();
};

export const importRoles = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/roles/import`, {
    method: 'POST',
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to import roles');
  }
  return response.json();
};

// Get available modules for permission assignment
export const getAvailableModules = async (): Promise<{ id: string; title: string; sections: { id: string; title: string }[] }[]> => {
  try {
    const modules = await apiFetch('/modules/for-permissions');
    return Array.isArray(modules) ? modules.map(module => ({
      id: module.id,
      title: module.title,
      sections: Array.isArray(module.sections) ? module.sections.map((section: any) => ({
        id: section.id,
        title: section.title
      })) : []
    })) : [];
  } catch (error) {
    console.error('Error fetching available modules:', error);
    return [];
  }
};
