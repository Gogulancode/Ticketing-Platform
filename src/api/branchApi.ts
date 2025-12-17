// Branch API for managing branches/locations
import { API_CONFIG } from '../config/api';

export interface Branch {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  isActive: boolean;
  isHeadquarters: boolean;
  sortOrder: number;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department?: string;
  isAgent: boolean;
}

export interface BranchWithUsers extends Branch {
  users: BranchUser[];
}

export interface CreateBranchRequest {
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  sortOrder?: number;
  isHeadquarters?: boolean;
}

export interface UpdateBranchRequest extends Partial<CreateBranchRequest> {
  isActive?: boolean;
}

export interface BranchListResponse {
  branches: Branch[];
  total: number;
}

// Branch API functions
export const branchApi = {
  // Get all branches
  async getAll(includeInactive = false, search = ''): Promise<BranchListResponse> {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch branches' }));
      throw new Error(error.message || 'Failed to fetch branches');
    }
    return response.json();
  },

  // Get branch by ID with users
  async getById(id: number): Promise<BranchWithUsers> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches/${id}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Branch not found' }));
      throw new Error(error.message || 'Branch not found');
    }
    return response.json();
  },

  // Create a new branch
  async create(data: CreateBranchRequest): Promise<{ success: boolean; message: string; branch: Branch }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create branch' }));
      throw new Error(error.message || 'Failed to create branch');
    }
    return response.json();
  },

  // Update a branch
  async update(id: number, data: UpdateBranchRequest): Promise<{ success: boolean; message: string; branch: Branch }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update branch' }));
      throw new Error(error.message || 'Failed to update branch');
    }
    return response.json();
  },

  // Delete (deactivate) a branch
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete branch' }));
      throw new Error(error.message || 'Failed to delete branch');
    }
    return response.json();
  },

  // Get users in a branch
  async getBranchUsers(id: number): Promise<BranchUser[]> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches/${id}/users`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch branch users' }));
      throw new Error(error.message || 'Failed to fetch branch users');
    }
    return response.json();
  },

  // Get branches for dropdown/lookup
  async getLookup(): Promise<Array<{ id: number; name: string; code: string; city?: string }>> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/branches/lookup`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch branches' }));
      throw new Error(error.message || 'Failed to fetch branches');
    }
    return response.json();
  },
};

export default branchApi;
