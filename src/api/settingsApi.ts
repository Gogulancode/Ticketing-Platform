// Settings API for ticket configurations
import { API_CONFIG } from '../config/api';
export interface SettingsConfig {
  id: number;
  name: string;
  value: string;
  isActive: boolean;
  order: number;
  category: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export interface TicketCategoryConfig {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  displayOrder?: number;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  isActive: boolean;
  order: number;
  displayOrder?: number;
}

export interface IssueType {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  subCategoryId?: number;
  isActive: boolean;
  order: number;
}

export interface PriorityLevel {
  id: number;
  name: string;
  description?: string;
  level: number; // 1-5 where 1 is highest priority
  color: string;
  isActive: boolean;
  order: number;
  displayOrder?: number;
  isDeleted?: boolean;
}

export interface TicketStatusConfig {
  id: number;
  name: string;
  workflowOrder: number;
  isActive: boolean;
  color: string;
  isDefault?: boolean;
  isClosedStatus?: boolean;
  allowedTransitions: number[]; // Array of status IDs this status can transition to
}

// Category Admin - users who can manage specific categories
export interface CategoryAdmin {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  categoryId: number;
  categoryName: string;
  canViewTickets: boolean;
  canManageAgents: boolean;
  canViewReports: boolean;
  canManageSubcategories: boolean;
  canConfigureSettings: boolean;
  canManageSLA: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAdminCreateRequest {
  userId: string;
  categoryId: number;
  canViewTickets?: boolean;
  canManageAgents?: boolean;
  canViewReports?: boolean;
  canManageSubcategories?: boolean;
  canConfigureSettings?: boolean;
  canManageSLA?: boolean;
}

export interface CategoryAdminUpdateRequest {
  canViewTickets?: boolean;
  canManageAgents?: boolean;
  canViewReports?: boolean;
  canManageSubcategories?: boolean;
  canConfigureSettings?: boolean;
  canManageSLA?: boolean;
  isActive?: boolean;
}

export interface CategoryAdminPermissions {
  userId: string;
  isCategoryAdmin: boolean;
  categoryIds: number[];
  categories: CategoryPermission[];
}

export interface CategoryPermission {
  categoryId: number;
  categoryName: string;
  canViewTickets: boolean;
  canManageAgents: boolean;
  canViewReports: boolean;
  canManageSubcategories: boolean;
  canConfigureSettings: boolean;
  canManageSLA: boolean;
}

export interface AvailableUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  department: string;
  isAgent: boolean;
}

export interface Agent {
  id: number;
  userId: string;
  name: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  agentGroupId?: number;
  agentGroupName?: string;
  isActive: boolean;
  maxTicketsCapacity: number;
  currentTicketCount: number;
  availabilityStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketGroup {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  subCategoryId?: number;
  subCategoryName?: string;
  isActive: boolean;
  agentCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTicketGroupRequest {
  name: string;
  description?: string;
  categoryId: number;
  subCategoryId?: number;
  isActive?: boolean;
}

export interface UpdateTicketGroupRequest extends CreateTicketGroupRequest {
  isActive: boolean;
}

export interface CategoryEmailMapping {
  id: number;
  categoryId: number;
  categoryName: string;
  emailAddress: string;
  displayName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // SMTP Server Configuration
  smtpServer?: string;
  smtpPort?: number;
  smtpUseSsl?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  // IMAP Configuration for email-to-ticket
  imapServer?: string;
  imapPort?: number;
  imapUseSsl?: boolean;
  imapUsername?: string;
  imapPassword?: string;
  // Keyword mappings for auto-categorization
  keywordMappings?: string;
}

type NumericLike = number | string | null | undefined;

type RawTicketCategory = Partial<TicketCategoryConfig> & {
  id: number;
  name: string;
  subCategories?: RawSubCategory[];
};

type RawSubCategory = Partial<SubCategory> & {
  id: number;
  name: string;
  categoryId?: number;
};

type RawPriorityLevel = Partial<PriorityLevel> & {
  id: number;
  name: string;
  level?: NumericLike;
  order?: NumericLike;
  displayOrder?: NumericLike;
  sortOrder?: NumericLike;
};

type RawAdvancedTicketGroup = {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  subCategoryId?: number;
  groupAgents?: RawGroupAgent[];
  maxTicketsPerAgent?: number;
  autoAssignmentEnabled?: boolean;
  assignedAgentIds?: NumericLike[];
  totalTickets?: NumericLike;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
};

type RawGroupAgent = {
  agentId: number;
  isActive?: boolean;
};

type RawSlaEscalationLevel = {
  level: NumericLike;
  triggerAtMinutes?: NumericLike;
};

type RawSlaPolicy = {
  id: string | number;
  name: string;
  priority: NumericLike;
  firstResponseTime?: number;
  firstResponseMins?: number;
  resolutionTime?: number;
  resolutionMins?: number;
  escalationTime?: number | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  escalationContactsCount?: number;
  priorityName?: string;
  escalationLevels?: RawSlaEscalationLevel[];
};

type UpdateTicketCategoryInput = Partial<TicketCategoryConfig> & {
  color?: string | null;
  iconName?: string | null;
};

class SettingsApiService {
  protected baseUrl = import.meta.env.DEV ? 'http://localhost:5016/api' : API_CONFIG.BASE_URL;

  // Helper method to get auth headers
  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  // Department configurations (legacy - use getTicketDepartments for new code)
  async getDepartments(): Promise<Department[]> {
    return this.getTicketDepartments();
  }

  // Ticket Department CRUD - uses /api/tickets/settings/departments
  async getTicketDepartments(includeInactive: boolean = false): Promise<Department[]> {
    try {
      const url = `${this.baseUrl}/tickets/settings/departments${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Departments API not available, using mock data');
        return this.getMockDepartments();
      }
      const data = await response.json();
      // Map API response to Department interface
      return (Array.isArray(data) ? data : []).map((d: { id: number; name: string; description?: string; isActive: boolean; sortOrder?: number; displayOrder?: number }) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        isActive: d.isActive,
        displayOrder: d.sortOrder ?? d.displayOrder ?? 0,
        order: d.sortOrder ?? d.displayOrder ?? 0
      }));
    } catch (error) {
      console.warn('Departments API not available, using mock data:', error);
      return this.getMockDepartments();
    }
  }

  async createTicketDepartment(department: Omit<Department, 'id' | 'order'>): Promise<Department> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/departments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: department.name,
        description: department.description,
        displayOrder: department.displayOrder ?? 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to create department (HTTP ${response.status})`);
    }
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      displayOrder: data.sortOrder ?? data.displayOrder ?? 0,
      order: data.sortOrder ?? data.displayOrder ?? 0
    };
  }

  async updateTicketDepartment(id: number, department: Partial<Omit<Department, 'id' | 'order'>>): Promise<Department> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/departments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: department.name,
        description: department.description,
        displayOrder: department.displayOrder,
        isActive: department.isActive
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update department (HTTP ${response.status})`);
    }
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      displayOrder: data.sortOrder ?? data.displayOrder ?? 0,
      order: data.sortOrder ?? data.displayOrder ?? 0
    };
  }

  async deleteTicketDepartment(id: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/departments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return response.ok;
  }

  // ========================================
  // Category Admin Management
  // ========================================

  async getCategoryAdmins(): Promise<CategoryAdmin[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Category admins API not available');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.warn('Error fetching category admins:', error);
      return [];
    }
  }

  async getCategoryAdminsByCategory(categoryId: number): Promise<CategoryAdmin[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/category/${categoryId}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.warn('Error fetching category admins for category:', error);
      return [];
    }
  }

  async getCategoryAdminsByUser(userId: string): Promise<CategoryAdmin[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/user/${userId}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.warn('Error fetching category admins for user:', error);
      return [];
    }
  }

  async getMyPermissions(): Promise<CategoryAdminPermissions | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/my-permissions`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('Error fetching my permissions:', error);
      return null;
    }
  }

  async checkIsCategoryAdmin(userId: string): Promise<{ isCategoryAdmin: boolean; categoryIds: number[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/check/${userId}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return { isCategoryAdmin: false, categoryIds: [] };
      return await response.json();
    } catch (error) {
      console.warn('Error checking category admin status:', error);
      return { isCategoryAdmin: false, categoryIds: [] };
    }
  }

  async getAvailableUsersForCategoryAdmin(): Promise<AvailableUser[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/available-users`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.warn('Error fetching available users:', error);
      return [];
    }
  }

  async createCategoryAdmin(request: CategoryAdminCreateRequest): Promise<CategoryAdmin> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create category admin');
    }
    return await response.json();
  }

  async updateCategoryAdmin(id: number, request: CategoryAdminUpdateRequest): Promise<CategoryAdmin> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update category admin');
    }
    return await response.json();
  }

  async deleteCategoryAdmin(id: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/category-admins/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return response.ok;
  }

  // Category configurations
  async getTicketCategories(includeInactive: boolean = false): Promise<TicketCategoryConfig[]> {
    try {
      const url = `${this.baseUrl}/tickets/settings/categories${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Categories API not available, using mock data');
        return this.getMockCategories();
      }
        const data = await response.json();
        console.log('✅ Successfully fetched categories from API:', data);
        const items = (Array.isArray(data) ? data : data.categories || []) as RawTicketCategory[];
        return items.map((cat) => this.normalizeCategory(cat));
    } catch (error) {
      console.warn('Categories API not available, using mock data:', error);
      return this.getMockCategories();
    }
  }

  // Sub Category configurations
  async getSubCategories(categoryId?: number, includeInactive: boolean = false): Promise<SubCategory[]> {
    try {
      let url = `${this.baseUrl}/tickets/settings/subcategories`;
      const params = new URLSearchParams();
      
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (includeInactive) params.append('includeInactive', 'true');
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Sub-categories API not available, using mock data');
        return this.getMockSubCategories().filter(sc => !categoryId || sc.categoryId === categoryId);
      }
        const data = await response.json();
        const items = (Array.isArray(data) ? data : data.subCategories || []) as RawSubCategory[];
        return items
          .filter(sc => !categoryId || sc.categoryId === categoryId)
          .map((sc) => this.normalizeSubCategory(sc));
    } catch (error) {
      console.warn('Sub-categories API not available, using mock data:', error);
      const mockData = this.getMockSubCategories();
      const filtered = categoryId ? mockData.filter(sc => sc.categoryId === categoryId) : mockData;
      return filtered.map((sc) => ({
        ...sc,
        order: sc.order ?? sc.displayOrder ?? 0,
        displayOrder: sc.displayOrder ?? sc.order ?? 0,
      }));
    }
  }

  // Issue Type configurations
  async getIssueTypes(): Promise<IssueType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/issuetypes`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Issue Types API not available, using mock data');
        return this.getMockIssueTypes();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched issue types from API:', data);
      return Array.isArray(data) ? data : data.issueTypes || [];
    } catch (error) {
      console.warn('Issue Types API not available, using mock data:', error);
      return this.getMockIssueTypes();
    }
  }

  // Priority Level configurations
  async getPriorityLevels(includeInactive: boolean = false): Promise<PriorityLevel[]> {
    try {
      const url = `${this.baseUrl}/tickets/settings/priorities${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Priorities API not available, using mock data');
        return this.getMockPriorityLevels();
      }
      const data = await response.json();
        const rawPriorities = (Array.isArray(data) ? data : data.priorities || data.value || []) as RawPriorityLevel[];
        const normalizedPriorities = rawPriorities.map((priority) => this.normalizePriorityLevel(priority));
      return normalizedPriorities.sort((a: PriorityLevel, b: PriorityLevel) => {
        if (a.level !== b.level) return a.level - b.level;
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return (a.id ?? 0) - (b.id ?? 0);
      });
    } catch (error) {
      console.warn('Priorities API not available, using mock data:', error);
      return this.getMockPriorityLevels();
    }
  }

  // Ticket Status configurations  
  async getTicketStatuses(includeInactive: boolean = false): Promise<TicketStatusConfig[]> {
    try {
      const url = `${this.baseUrl}/tickets/settings/statuses${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Statuses API not available, using mock data');
        return this.getMockTicketStatuses();
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.statuses || [];
    } catch (error) {
      console.warn('Statuses API not available, using mock data:', error);
      return this.getMockTicketStatuses();
    }
  }

  // Delete operations
  async deleteDepartment(id: number): Promise<boolean> {
    console.log('🗑️ Mock delete department:', id);
    return true; // Mock success
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/categories/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async deleteSubCategory(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      return false;
    }
  }

  async deletePriority(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/priorities/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting priority:', error);
      return false;
    }
  }

  async deleteStatus(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/statuses/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting status:', error);
      return false;
    }
  }

  // Create operations
  async createTicketCategory(category: Omit<TicketCategoryConfig, 'id' | 'subCategories'>): Promise<TicketCategoryConfig> {
    const request = {
      name: category.name,
      description: category.description,
      displayOrder: category.order ?? category.displayOrder ?? 0,
      color: null,
      iconName: null
    };

    const response = await fetch(`${this.baseUrl}/tickets/settings/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        // Try to parse as JSON first (if backend returns structured error)
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          // If not JSON, use the text as-is
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to create category (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  }

  async updateTicketCategory(id: number, category: UpdateTicketCategoryInput): Promise<TicketCategoryConfig> {
    try {
      const payload: Record<string, unknown> = {};
      if (category.name !== undefined) payload.name = category.name;
        if (category.description !== undefined) payload.description = category.description;
        const displayOrderValue = category.order ?? category.displayOrder;
      if (displayOrderValue !== undefined) payload.displayOrder = displayOrderValue;
      if (category.isActive !== undefined) payload.isActive = category.isActive;
        if (category.color !== undefined) payload.color = category.color;
        if (category.iconName !== undefined) payload.iconName = category.iconName;

      const response = await fetch(`${this.baseUrl}/tickets/settings/categories/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated category:', data);
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Email Configuration Methods
  async getEmailConfiguration(): Promise<EmailConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-configuration`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Email config API not available, using mock data');
        return this.getMockEmailConfiguration();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched email configuration from API:', data);
      return data;
    } catch (error) {
      console.warn('Email config API not available, using mock data:', error);
      return this.getMockEmailConfiguration();
    }
  }

  async updateEmailConfiguration(config: EmailConfiguration): Promise<EmailConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-configuration`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated email configuration:', data);
      return data;
    } catch (error) {
      console.error('Error updating email configuration:', error);
      throw error;
    }
  }

  async getEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Email accounts API not available, using mock data');
        return this.getMockEmailAccounts();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched email accounts from API:', data);
      return Array.isArray(data) ? data : data.accounts || [];
    } catch (error) {
      console.warn('Email accounts API not available, using mock data:', error);
      return this.getMockEmailAccounts();
    }
  }

  async createEmailAccount(account: Omit<EmailAccount, 'id'>): Promise<EmailAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(account)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully created email account:', data);
      return data;
    } catch (error) {
      console.error('Error creating email account:', error);
      throw error;
    }
  }

  async updateEmailAccount(id: string, account: EmailAccount): Promise<EmailAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(account)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated email account:', data);
      return data;
    } catch (error) {
      console.error('Error updating email account:', error);
      throw error;
    }
  }

  async deleteEmailAccount(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Successfully deleted email account');
      return true;
    } catch (error) {
      console.error('Error deleting email account:', error);
      throw error;
    }
  }

  async getAvailableCategories(): Promise<string[]> {
    try {
      const categories = await this.getTicketCategories();
      return categories.filter(cat => cat.isActive).map(cat => cat.name);
    } catch (error) {
      console.warn('Error getting available categories, using mock data:', error);
      return this.getMockAvailableCategories();
    }
  }

  private getMockAvailableCategories(): string[] {
    return [
      'Software Support',
      'Hardware Support',
      'Access Management',
      'Training & Documentation',
      'General Inquiry',
      'Network Issues',
      'Email Support',
      'Database Issues',
      'System Maintenance'
    ];
  }

  // Ticket Groups API methods
  async getTicketGroups(): Promise<TicketGroup[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Ticket groups API not available, using mock data');
        return this.getMockTicketGroups();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched ticket groups from API:', data);
      return Array.isArray(data) ? data : data.groups || [];
    } catch (error) {
      console.warn('Ticket groups API not available, using mock data:', error);
      return this.getMockTicketGroups();
    }
  }

  async createGroup(group: CreateTicketGroupRequest): Promise<TicketGroup> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(group)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully created ticket group:', data);
      return data;
    } catch (error) {
      console.error('Error creating ticket group:', error);
      throw error;
    }
  }

  async updateGroup(id: number, group: UpdateTicketGroupRequest): Promise<TicketGroup> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ...group, id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated ticket group:', data);
      return data;
    } catch (error) {
      console.error('Error updating ticket group:', error);
      throw error;
    }
  }

  async deleteTicketGroup(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Successfully deleted ticket group');
      return true;
    } catch (error) {
      console.error('Error deleting ticket group:', error);
      return false;
    }
  }

  // Agents API methods
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Agents API not available, using mock data');
        return this.getMockAgents();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched agents from API:', data);
      return Array.isArray(data) ? data : data.agents || [];
    } catch (error) {
      console.warn('Agents API not available, using mock data:', error);
      return this.getMockAgents();
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'userId' | 'agentGroupName' | 'departmentName' | 'currentTicketCount' | 'availabilityStatus' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(agent)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully created agent:', data);
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ...agent, id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated agent:', data);
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Successfully deleted agent');
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  }

  // Category Email Mappings API methods
  async getCategoryEmailMappings(): Promise<CategoryEmailMapping[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-mappings`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        console.warn('Email mappings API not available, using mock data');
        return this.getMockCategoryEmailMappings();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched email mappings from API:', data);
      return Array.isArray(data) ? data : data.mappings || [];
    } catch (error) {
      console.warn('Email mappings API not available, using mock data:', error);
      return this.getMockCategoryEmailMappings();
    }
  }

  async createCategoryEmailMapping(mapping: Omit<CategoryEmailMapping, 'id' | 'categoryName' | 'createdAt' | 'updatedAt'>): Promise<CategoryEmailMapping> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-mappings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(mapping)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully created email mapping:', data);
      return data;
    } catch (error) {
      console.error('Error creating email mapping:', error);
      throw error;
    }
  }

  async updateCategoryEmailMapping(id: number, mapping: Partial<CategoryEmailMapping>): Promise<CategoryEmailMapping> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-mappings/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ...mapping, id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated email mapping:', data);
      return data;
    } catch (error) {
      console.error('Error updating email mapping:', error);
      throw error;
    }
  }

  async deleteCategoryEmailMapping(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-mappings/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Successfully deleted email mapping');
      return true;
    } catch (error) {
      console.error('Error deleting email mapping:', error);
      return false;
    }
  }

  // Additional CRUD methods
  async createSubCategory(subCategory: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    const request = {
      categoryId: subCategory.categoryId,
      name: subCategory.name,
      description: subCategory.description,
      displayOrder: subCategory.order ?? subCategory.displayOrder ?? 0,
      isActive: subCategory.isActive ?? true
    };

    const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        // Try to parse as JSON first (if backend returns structured error)
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          // If not JSON, use the text as-is
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to create sub-category (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created subcategory:', data);
    return {
      ...data,
      order: data.order ?? data.displayOrder ?? request.displayOrder,
      displayOrder: data.displayOrder ?? data.order ?? request.displayOrder,
    };
  }

  async updateSubCategory(id: number, subCategory: Partial<SubCategory>): Promise<SubCategory> {
    try {
      const request: Record<string, unknown> = {};
      if (subCategory.name !== undefined) request.name = subCategory.name;
      if (subCategory.description !== undefined) request.description = subCategory.description;
      const displayOrderValue = subCategory.order ?? subCategory.displayOrder;
      if (displayOrderValue !== undefined) request.displayOrder = displayOrderValue;
      if (subCategory.categoryId !== undefined) request.categoryId = subCategory.categoryId;
      if (subCategory.isActive !== undefined) request.isActive = subCategory.isActive;

      const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated subcategory:', data);
      return {
        ...data,
        order: data.order ?? data.displayOrder ?? displayOrderValue ?? 0,
        displayOrder: data.displayOrder ?? data.order ?? displayOrderValue ?? 0,
      };
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  }

  async createDepartment(department: Omit<Department, 'id'>): Promise<Department> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/departments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(department)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully created department:', data);
      return data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id: number, department: Partial<Department>): Promise<Department> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/departments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ ...department, id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully updated department:', data);
      return data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async createPriority(priority: Omit<PriorityLevel, 'id'>): Promise<PriorityLevel> {
    const resolvedOrder = priority.order ?? priority.displayOrder ?? 0;
    const payload = {
      name: priority.name,
      description: priority.description,
      level: priority.level,
      color: priority.color,
      displayOrder: resolvedOrder,
      isActive: priority.isActive ?? true,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/priorities`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to create priority (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return this.normalizePriorityLevel(data);
  }

  async updatePriority(id: number, priority: Partial<PriorityLevel>): Promise<PriorityLevel> {
    const resolvedOrder = priority.order ?? priority.displayOrder;
    const payload: Record<string, unknown> = {
      name: priority.name,
      description: priority.description,
      level: priority.level,
      color: priority.color,
      isActive: priority.isActive,
    };
    if (resolvedOrder !== undefined) {
      payload.displayOrder = resolvedOrder;
    }
    const response = await fetch(`${this.baseUrl}/tickets/settings/priorities/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to update priority (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return this.normalizePriorityLevel(data);
  }

  async createStatus(status: Omit<TicketStatusConfig, 'id'>): Promise<TicketStatusConfig> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/statuses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(status)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to create status (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  }

  async updateStatus(id: number, status: Partial<TicketStatusConfig>): Promise<TicketStatusConfig> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/statuses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ...status, id })
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.title || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `Failed to update status (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  }

  private normalizePriorityLevel(priority: RawPriorityLevel): PriorityLevel {
    const normalizedLevel = this.toNumber(priority.level, 1);
    const normalizedOrder = this.toNumber(
      priority.order ?? priority.displayOrder ?? priority.sortOrder ?? normalizedLevel,
      0
    );
    const normalizedDisplayOrder =
      priority.displayOrder !== undefined
        ? this.toNumber(priority.displayOrder, normalizedOrder)
        : normalizedOrder;

    return {
      id: priority.id,
      name: priority.name ?? 'Priority',
      description: priority.description ?? undefined,
      level: normalizedLevel,
      color: priority.color ?? '#6b7280',
      isActive: priority.isActive ?? true,
      order: normalizedOrder,
      displayOrder: normalizedDisplayOrder,
      isDeleted: priority.isDeleted ?? false,
    };
  }

  private normalizeCategory(category: RawTicketCategory): TicketCategoryConfig {
    const normalizedOrder = this.toNumber(category.order ?? category.displayOrder, 0);
    const normalizedDisplayOrder =
      category.displayOrder !== undefined
        ? this.toNumber(category.displayOrder, normalizedOrder)
        : normalizedOrder;

    return {
      id: category.id,
      name: category.name ?? 'Category',
      description: category.description,
      isActive: category.isActive ?? true,
      order: normalizedOrder,
      displayOrder: normalizedDisplayOrder,
      subCategories: (category.subCategories ?? []).map((subCategory) =>
        this.normalizeSubCategory(subCategory, category.id)
      ),
    };
  }

  private normalizeSubCategory(subCategory: RawSubCategory, fallbackCategoryId?: number): SubCategory {
    const normalizedOrder = this.toNumber(subCategory.order ?? subCategory.displayOrder, 0);
    const normalizedDisplayOrder =
      subCategory.displayOrder !== undefined
        ? this.toNumber(subCategory.displayOrder, normalizedOrder)
        : normalizedOrder;

    return {
      id: subCategory.id,
      name: subCategory.name ?? 'Sub Category',
      description: subCategory.description,
      categoryId: subCategory.categoryId ?? fallbackCategoryId ?? 0,
      isActive: subCategory.isActive ?? true,
      order: normalizedOrder,
      displayOrder: normalizedDisplayOrder,
    };
  }

  protected normalizeAdvancedTicketGroup(group: RawAdvancedTicketGroup): AdvancedTicketGroupDto {
    const idsFromPayload = Array.isArray(group.assignedAgentIds)
      ? group.assignedAgentIds
          .map((id) => this.toNumber(id, 0))
          .filter((id) => id > 0)
      : undefined;

    const fallbackAgentIds = (group.groupAgents ?? [])
      .filter((agent) => agent && (agent.isActive ?? true))
      .map((agent) => this.toNumber(agent.agentId, 0))
      .filter((id) => id > 0);

    const assignedAgentIds = idsFromPayload ?? fallbackAgentIds;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      categoryId: group.categoryId,
      subcategoryId: group.subCategoryId,
      assignedAgentIds,
      maxTicketsPerAgent: this.toNumber(group.maxTicketsPerAgent, 10) || 10,
      autoAssignmentEnabled: group.autoAssignmentEnabled ?? false,
      totalTickets: this.toNumber(group.totalTickets, 0),
      isActive: group.isActive ?? true,
      isDeleted: group.isDeleted ?? false,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt ?? group.createdAt,
    };
  }

  protected normalizeSlaPolicy(policy: RawSlaPolicy): SlaPolicyDto {
    const normalizedPriority = this.toNumber(policy.priority, 0);
    const escalationLevels = Array.isArray(policy.escalationLevels) ? policy.escalationLevels : [];

    const findLevelMinutes = (level: number): number | null => {
      const levelEntry = escalationLevels.find((entry) => this.toNumber(entry.level, 0) === level);
      if (!levelEntry || levelEntry.triggerAtMinutes === undefined || levelEntry.triggerAtMinutes === null) {
        return null;
      }
      return this.toNumber(levelEntry.triggerAtMinutes, 0) || null;
    };

    return {
      id: String(policy.id ?? ''),
      name: policy.name ?? 'SLA Policy',
      priorityId: normalizedPriority + 1,
      priorityName: policy.priorityName,
      responseTimeMinutes: policy.firstResponseTime ?? policy.firstResponseMins ?? 0,
      resolutionTimeMinutes: policy.resolutionTime ?? policy.resolutionMins ?? 0,
      escalationLevel1Minutes: findLevelMinutes(1) ?? (policy.escalationTime ?? null),
      escalationLevel2Minutes: findLevelMinutes(2),
      escalationLevel3Minutes: findLevelMinutes(3),
      isActive: policy.isActive ?? true,
      isDeleted: policy.isDeleted ?? false,
      createdAt: this.ensureDateString(policy.createdAt),
      updatedAt: this.ensureDateString(policy.updatedAt),
      escalationContactsCount: policy.escalationContactsCount ?? 0,
    };
  }

  private toNumber(value: NumericLike, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  private ensureDateString(value?: string): string {
    return value ?? new Date().toISOString();
  }

  private getMockDepartments(): Department[] {
    return [
      { id: 1, name: 'IT Department', description: 'Information Technology', isActive: true, order: 1 },
      { id: 2, name: 'HR Department', description: 'Human Resources', isActive: true, order: 2 },
      { id: 3, name: 'Finance Department', description: 'Finance and Accounting', isActive: true, order: 3 },
      { id: 4, name: 'Operations Department', description: 'Operations Management', isActive: true, order: 4 },
      { id: 5, name: 'Quality Department', description: 'Quality Assurance', isActive: true, order: 5 },
      { id: 6, name: 'Training Department', description: 'Training and Development', isActive: true, order: 6 },
    ];
  }

  private getMockCategories(): TicketCategoryConfig[] {
    return [
      { 
        id: 1, 
        name: 'Software', 
        description: 'Software related issues', 
        isActive: true, 
        order: 1,
        subCategories: [
          { id: 1, name: 'LT Application', description: 'Learning & Training Application', categoryId: 1, isActive: true, order: 1 },
          { id: 2, name: 'Office Applications', description: 'MS Office, Email, etc.', categoryId: 1, isActive: true, order: 2 },
          { id: 3, name: 'ERP System', description: 'Enterprise Resource Planning', categoryId: 1, isActive: true, order: 3 },
        ]
      },
      {
        id: 2,
        name: 'Hardware', 
        description: 'Hardware related issues', 
        isActive: true, 
        order: 2,
        subCategories: [
          { id: 4, name: 'Laptop', description: 'Laptop hardware issues', categoryId: 2, isActive: true, order: 1 },
          { id: 5, name: 'Desktop', description: 'Desktop computer issues', categoryId: 2, isActive: true, order: 2 },
          { id: 6, name: 'Printer', description: 'Printer and scanner issues', categoryId: 2, isActive: true, order: 3 },
          { id: 7, name: 'Network Equipment', description: 'Network devices', categoryId: 2, isActive: true, order: 4 },
        ]
      },
      { 
        id: 3, 
        name: 'Access & Permissions', 
        description: 'Access and permission requests', 
        isActive: true, 
        order: 3,
        subCategories: [
          { id: 8, name: 'System Access', description: 'Access to systems and applications', categoryId: 3, isActive: true, order: 1 },
          { id: 9, name: 'File Access', description: 'File and folder permissions', categoryId: 3, isActive: true, order: 2 },
          { id: 10, name: 'Role Changes', description: 'User role modifications', categoryId: 3, isActive: true, order: 3 },
        ]
      },
      { 
        id: 4, 
        name: 'Training & Support', 
        description: 'Training and support requests', 
        isActive: true, 
        order: 4,
        subCategories: [
          { id: 11, name: 'Training Request', description: 'Training session requests', categoryId: 4, isActive: true, order: 1 },
          { id: 12, name: 'Documentation', description: 'Documentation requests', categoryId: 4, isActive: true, order: 2 },
          { id: 13, name: 'User Guide', description: 'User guide and manual requests', categoryId: 4, isActive: true, order: 3 },
        ]
      },
    ];
  }

  private getMockSubCategories(): SubCategory[] {
    return [
      { id: 1, name: 'LT Application', description: 'Learning & Training Application', categoryId: 1, isActive: true, order: 1 },
      { id: 2, name: 'Office Applications', description: 'MS Office, Email, etc.', categoryId: 1, isActive: true, order: 2 },
      { id: 3, name: 'ERP System', description: 'Enterprise Resource Planning', categoryId: 1, isActive: true, order: 3 },
      { id: 4, name: 'Laptop', description: 'Laptop hardware issues', categoryId: 2, isActive: true, order: 1 },
      { id: 5, name: 'Desktop', description: 'Desktop computer issues', categoryId: 2, isActive: true, order: 2 },
      { id: 6, name: 'Printer', description: 'Printer and scanner issues', categoryId: 2, isActive: true, order: 3 },
      { id: 7, name: 'Network Equipment', description: 'Network devices', categoryId: 2, isActive: true, order: 4 },
      { id: 8, name: 'System Access', description: 'Access to systems and applications', categoryId: 3, isActive: true, order: 1 },
      { id: 9, name: 'File Access', description: 'File and folder permissions', categoryId: 3, isActive: true, order: 2 },
      { id: 10, name: 'Role Changes', description: 'User role modifications', categoryId: 3, isActive: true, order: 3 },
      { id: 11, name: 'Training Request', description: 'Training session requests', categoryId: 4, isActive: true, order: 1 },
      { id: 12, name: 'Documentation', description: 'Documentation requests', categoryId: 4, isActive: true, order: 2 },
      { id: 13, name: 'User Guide', description: 'User guide and manual requests', categoryId: 4, isActive: true, order: 3 },
    ];
  }

  private getMockIssueTypes(): IssueType[] {
    return [
      { id: 1, name: 'Bug Report', description: 'Software defects and bugs', isActive: true, order: 1 },
      { id: 2, name: 'Feature Request', description: 'New feature requests', isActive: true, order: 2 },
      { id: 3, name: 'Technical Support', description: 'Technical assistance', isActive: true, order: 3 },
      { id: 4, name: 'Installation', description: 'Software/Hardware installation', isActive: true, order: 4 },
      { id: 5, name: 'Configuration', description: 'System configuration', isActive: true, order: 5 },
      { id: 6, name: 'Performance Issue', description: 'Performance related problems', isActive: true, order: 6 },
      { id: 7, name: 'Security Issue', description: 'Security concerns', isActive: true, order: 7 },
      { id: 8, name: 'Data Recovery', description: 'Data recovery requests', isActive: true, order: 8 },
      { id: 9, name: 'User Training', description: 'User training needs', isActive: true, order: 9 },
      { id: 10, name: 'General Inquiry', description: 'General questions', isActive: true, order: 10 },
    ];
  }

  private getMockPriorityLevels(): PriorityLevel[] {
    return [
      { id: 1, name: 'Critical', level: 1, color: '#dc2626', isActive: true, order: 1 },
      { id: 2, name: 'High', level: 2, color: '#ea580c', isActive: true, order: 2 },
      { id: 3, name: 'Medium', level: 3, color: '#ca8a04', isActive: true, order: 3 },
      { id: 4, name: 'Low', level: 4, color: '#16a34a', isActive: true, order: 4 },
      { id: 5, name: 'Very Low', level: 5, color: '#6b7280', isActive: true, order: 5 },
    ].map((priority) => ({
      ...priority,
      displayOrder: priority.order,
      isDeleted: false,
    }));
  }

  private getMockTicketStatuses(): TicketStatusConfig[] {
    return [
      { 
        id: 1, 
        name: 'Open', 
        workflowOrder: 1, 
        isActive: true, 
        color: '#3b82f6', 
        isDefault: true,
        allowedTransitions: [2, 5] // Can go to In Progress or Closed
      },
      { 
        id: 2, 
        name: 'In Progress', 
        workflowOrder: 2, 
        isActive: true, 
        color: '#f59e0b',
        allowedTransitions: [3, 4, 5] // Can go to On Hold, Resolved, or Closed
      },
      { 
        id: 3, 
        name: 'On Hold', 
        workflowOrder: 3, 
        isActive: true, 
        color: '#8b5cf6',
        allowedTransitions: [2, 4, 5] // Can go to In Progress, Resolved, or Closed
      },
      { 
        id: 4, 
        name: 'Resolved', 
        workflowOrder: 4, 
        isActive: true, 
        color: '#10b981',
        allowedTransitions: [5, 6] // Can go to Closed or Reopen
      },
      { 
        id: 5, 
        name: 'Closed', 
        workflowOrder: 5, 
        isActive: true, 
        color: '#6b7280',
        allowedTransitions: [6] // Can only Reopen
      },
      { 
        id: 6, 
        name: 'Reopen', 
        workflowOrder: 6, 
        isActive: true, 
        color: '#f97316',
        allowedTransitions: [2] // Goes back to In Progress
      },
    ];
  }

  private getMockEmailConfiguration(): EmailConfiguration {
    return {
      enableGraphApi: true,
      processingIntervalMinutes: 5,
      maxEmailsPerBatch: 50,
      autoAssignmentRules: {
        enableCategoryMapping: true,
        defaultCategory: 'General Inquiry',
        keywordMappings: {
          'password': 'Access Management',
          'hardware': 'Hardware Support',
          'software': 'Software Support',
          'training': 'Training & Documentation'
        },
        priorityKeywords: {
          'urgent': 'urgent',
          'asap': 'high',
          'critical': 'urgent',
          'soon': 'medium'
        },
        departmentRouting: {
          'IT': 'it-support@company.com',
          'HR': 'hr-support@company.com',
          'Finance': 'finance-support@company.com'
        }
      }
    };
  }

  private getMockEmailAccounts(): EmailAccount[] {
    return [
      {
        id: '1',
        displayName: 'IT Helpdesk',
        email: 'support@example.com',
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        clientSecret: '***CONFIGURED***',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        isActive: true,
        isDefault: true,
        categories: ['Hardware Support', 'Software Support', 'Access Management'],
        departmentId: '1',
        autoAssignPriority: 'medium'
      },
      {
        id: '2',
        displayName: 'HR Support',
        email: 'hr-support@example.com',
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        clientSecret: '***CONFIGURED***',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        isActive: true,
        isDefault: false,
        categories: ['Training & Documentation', 'General Inquiry'],
        departmentId: '2',
        autoAssignPriority: 'low'
      },
      {
        id: '3',
        displayName: 'Finance Helpdesk',
        email: 'finance-support@example.com',
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        clientSecret: '***CONFIGURED***',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        isActive: false,
        isDefault: false,
        categories: ['General Inquiry'],
        departmentId: '3',
        autoAssignPriority: 'medium'
      }
    ];
  }

  private getMockTicketGroups(): TicketGroup[] {
    return [
      {
        id: 1,
        name: 'Software Support Group',
        description: 'Group for software-related tickets',
        categoryId: 1,
        categoryName: 'Software',
        subCategoryId: 1,
        subCategoryName: 'LT Application',
        isActive: true,
        agentCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Hardware Support Group',
        description: 'Group for hardware-related tickets',
        categoryId: 2,
        categoryName: 'Hardware',
        subCategoryId: 4,
        subCategoryName: 'Laptop',
        isActive: true,
        agentCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Access Management Group',
        description: 'Group for access and permission tickets',
        categoryId: 3,
        categoryName: 'Access & Permissions',
        isActive: true,
        agentCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockAgents(): Agent[] {
    return [
      {
        id: 1,
        userId: 'user-001',
        name: 'John Doe',
        email: 'john.doe@company.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 1,
        agentGroupName: 'Software Support Group',
        isActive: true,
        maxTicketsCapacity: 20,
        currentTicketCount: 8,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 'user-002',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 2,
        agentGroupName: 'Hardware Support Group',
        isActive: true,
        maxTicketsCapacity: 15,
        currentTicketCount: 5,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        userId: 'user-003',
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        departmentId: 2,
        departmentName: 'HR Department',
        isActive: true,
        maxTicketsCapacity: 10,
        currentTicketCount: 3,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockCategoryEmailMappings(): CategoryEmailMapping[] {
    return [
      {
        id: 1,
        categoryId: 1,
        categoryName: 'Software',
        emailAddress: 'software-support@company.com',
        displayName: 'Software Support',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUseSsl: true,
        smtpUsername: 'software-support@company.com',
        imapServer: 'imap.gmail.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'software-support@company.com',
        keywordMappings: 'application,software,bug,error'
      },
      {
        id: 2,
        categoryId: 2,
        categoryName: 'Hardware',
        emailAddress: 'hardware-support@company.com',
        displayName: 'Hardware Support',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUseSsl: true,
        smtpUsername: 'hardware-support@company.com',
        imapServer: 'imap.gmail.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'hardware-support@company.com',
        keywordMappings: 'laptop,desktop,printer,hardware'
      },
      {
        id: 3,
        categoryId: 3,
        categoryName: 'Access & Permissions',
        emailAddress: 'access-support@company.com',
        displayName: 'Access Support',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUseSsl: true,
        smtpUsername: 'access-support@company.com',
        imapServer: 'imap.gmail.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'access-support@company.com',
        keywordMappings: 'access,permission,login,password'
      }
    ];
  }
}

// Email Configuration Interfaces
export interface EmailConfiguration {
  enableGraphApi: boolean;
  processingIntervalMinutes: number;
  maxEmailsPerBatch: number;
  autoAssignmentRules: AutoAssignmentRules;
}

export interface EmailAccount {
  id: string;
  displayName: string;
  email: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  isActive: boolean;
  isDefault: boolean;
  categories: string[];
  departmentId?: string;
  autoAssignPriority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AutoAssignmentRules {
  enableCategoryMapping: boolean;
  defaultCategory: string;
  keywordMappings: { [key: string]: string };
  priorityKeywords: { [key: string]: string };
  departmentRouting: { [key: string]: string };
}

// =============================================================================
// ADVANCED TICKETING SETTINGS - NEW APIS
// =============================================================================

// TypeScript interfaces matching backend DTOs
export interface TicketTagDto {
  id: number;
  name: string;
  subCategoryId: number;
  categoryName?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketTagDto {
  name: string;
  subCategoryId: number;
  isActive?: boolean;
}

export interface UpdateTicketTagDto {
  name: string;
  subCategoryId: number;
  isActive?: boolean;
}

export interface GraphEmailConfigDto {
  id: number;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  email: string;
  categoryId?: number;
  isActive: boolean;
  processIncomingEmails: boolean;
  createTicketsFromEmails: boolean;
  sendNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGraphEmailConfigDto {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  email: string;
  categoryId?: number;
  processIncomingEmails: boolean;
  createTicketsFromEmails: boolean;
  sendNotifications: boolean;
}

export interface UpdateGraphEmailConfigDto {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  email: string;
  categoryId?: number;
  processIncomingEmails: boolean;
  createTicketsFromEmails: boolean;
  sendNotifications: boolean;
}

export interface TicketFieldSettingDto {
  id: number;
  categoryId: number;
  fieldName: string;
  fieldType: string;
  isMandatory: boolean;
  isActive: boolean;
  options?: string;
  placeholderText?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketFieldSettingDto {
  categoryId: number;
  fieldName: string;
  fieldType: string;
  isMandatory: boolean;
  options?: string;
  placeholderText?: string;
  displayOrder: number;
}

export interface UpdateTicketFieldSettingDto {
  categoryId: number;
  fieldName: string;
  fieldType: string;
  isMandatory: boolean;
  options?: string;
  placeholderText?: string;
  displayOrder: number;
}

export interface AdvancedTicketGroupDto {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  assignedAgentIds: number[];
  maxTicketsPerAgent: number;
  autoAssignmentEnabled: boolean;
  totalTickets: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvancedTicketGroupDto {
  name: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  assignedAgentIds: number[];
  maxTicketsPerAgent: number;
  autoAssignmentEnabled?: boolean;
  isActive?: boolean;
}

export interface UpdateAdvancedTicketGroupDto {
  name: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  assignedAgentIds?: number[];
  maxTicketsPerAgent?: number;
  autoAssignmentEnabled?: boolean;
  isActive?: boolean;
}

export interface TicketGroupAgentDto {
  id: number;
  ticketGroupId: number;
  agentId: number;
  isActive: boolean;
  assignedAt: string;
}

export interface ReorderFieldsRequest {
  categoryId: number;
  fieldIds: number[];
}

// =============================================================================
// SLA INTERFACES
// =============================================================================

export interface SlaPolicyDto {
  id: string;
  name: string;
  priorityId: number;
  priorityName?: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel1Minutes?: number | null;
  escalationLevel2Minutes?: number | null;
  escalationLevel3Minutes?: number | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  escalationContactsCount?: number;
}

export interface CreateSlaPolicyDto {
  name: string;
  description?: string;
  priorityId: number;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel1Minutes?: number | null;
  escalationLevel2Minutes?: number | null;
  escalationLevel3Minutes?: number | null;
  isActive?: boolean;
}

export type UpdateSlaPolicyDto = CreateSlaPolicyDto;

export interface SlaEscalationContactDto {
  id: number;
  slaPolicyId: string;
  level: number;
  name: string;
  email: string;
  notifyByEmail: boolean;
  notifyBySystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlaEscalationContactDto {
  slaPolicyId: string;
  level: number;
  name: string;
  email: string;
  notifyByEmail?: boolean;
  notifyBySystem?: boolean;
}

export interface UpdateSlaEscalationContactDto {
  level: number;
  name: string;
  email: string;
  notifyByEmail?: boolean;
  notifyBySystem?: boolean;
}

// Enhanced Settings API Service
class EnhancedSettingsApiService extends SettingsApiService {

  // =============================================================================
  // TICKET TAGS API
  // =============================================================================

  async getTicketTags(includeInactive: boolean = false): Promise<TicketTagDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${this.baseUrl}/tickets/settings/tags${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn('Tags API not available, using mock data');
        return this.getMockTicketTags();
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Tags API not available, using mock data:', error);
      return this.getMockTicketTags();
    }
  }

  async getTicketTagById(id: number): Promise<TicketTagDto | null> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/tags/${id}`, { headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching tag:', error);
      return null;
    }
  }

  async getTagsBySubcategory(subcategoryId: number): Promise<TicketTagDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/tags/subcategory/${subcategoryId}`, { headers });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching tags by subcategory:', error);
      return [];
    }
  }

  async createTicketTag(data: CreateTicketTagDto): Promise<TicketTagDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP ${response.status} response body:`, errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created tag:', result);
      return result;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  async updateTicketTag(id: number, data: UpdateTicketTagDto): Promise<TicketTagDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/tags/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated tag:', result);
      return result;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  async deleteTicketTag(id: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/tags/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted tag');
      return response.ok;
    } catch (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
  }

  // =============================================================================
  // GRAPH EMAIL CONFIG API
  // =============================================================================

  async getGraphEmailConfigs(): Promise<GraphEmailConfigDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/email-config/graph-configs`, { headers });
      if (!response.ok) {
        console.warn('Graph email configs API not available, using mock data');
        return this.getMockGraphEmailConfigs();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched graph email configs from API:', data);
      
      // Extract configurations array from the response
      const configurations = data.configurations || data;
      return Array.isArray(configurations) ? configurations : [];
    } catch (error) {
      console.warn('Graph email configs API not available, using mock data:', error);
      return this.getMockGraphEmailConfigs();
    }
  }

  async getGraphEmailConfigForEdit(id: number): Promise<CreateGraphEmailConfigDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/email-config/graph-config/${id}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully retrieved email config for editing:', result);
      
      // Map to CreateGraphEmailConfigDto structure for the edit form
      return {
        tenantId: result.tenantId || '',
        clientId: result.clientId || '',
        clientSecret: result.clientSecret || '',
        email: result.email || '',
        categoryId: result.categoryId || null,
        processIncomingEmails: result.processIncomingEmails !== false,
        createTicketsFromEmails: result.createTicketsFromEmails !== false,
        sendNotifications: result.sendNotifications !== false
      };
    } catch (error) {
      console.error('Error retrieving email config for editing:', error);
      throw error;
    }
  }

  async createGraphEmailConfig(data: CreateGraphEmailConfigDto): Promise<GraphEmailConfigDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/email-config`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created email config:', result);
      return result;
    } catch (error) {
      console.error('Error creating email config:', error);
      throw error;
    }
  }

  async updateGraphEmailConfig(id: number, data: UpdateGraphEmailConfigDto): Promise<GraphEmailConfigDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Sending email config update:', { id, data, categoryId: data.categoryId });
      
      const response = await fetch(`${this.baseUrl}/email-config/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated email config:', result);
      return result;
    } catch (error) {
      console.error('Error updating email config:', error);
      throw error;
    }
  }

  async deleteGraphEmailConfig(id: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/email-config/graph-config/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted email config');
      return response.ok;
    } catch (error) {
      console.error('Error deleting email config:', error);
      return false;
    }
  }

  async testEmailConnection(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/email-config/${id}/test-connection`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        return { success: false, message: 'Connection test failed' };
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error testing email connection:', error);
      return { success: false, message: 'Connection test failed' };
    }
  }

  // =============================================================================
  // TICKET FIELD SETTINGS API
  // =============================================================================

  async getTicketFieldSettings(): Promise<TicketFieldSettingDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields`, { headers });
      if (!response.ok) {
        console.warn('Field settings API not available, using mock data');
        return this.getMockTicketFieldSettings();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched field settings from API:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Field settings API not available, using mock data:', error);
      return this.getMockTicketFieldSettings();
    }
  }

  async getFieldSettingsByCategory(categoryId: number): Promise<TicketFieldSettingDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields/category/${categoryId}`, { headers });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching field settings by category:', error);
      return [];
    }
  }

  async createTicketFieldSetting(data: CreateTicketFieldSettingDto): Promise<TicketFieldSettingDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created field setting:', result);
      return result;
    } catch (error) {
      console.error('Error creating field setting:', error);
      throw error;
    }
  }

  async updateTicketFieldSetting(id: number, data: UpdateTicketFieldSettingDto): Promise<TicketFieldSettingDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated field setting:', result);
      return result;
    } catch (error) {
      console.error('Error updating field setting:', error);
      throw error;
    }
  }

  async deleteTicketFieldSetting(id: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted field setting');
      return response.ok;
    } catch (error) {
      console.error('Error deleting field setting:', error);
      return false;
    }
  }

  async reorderTicketFields(data: ReorderFieldsRequest): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/ticket-fields/reorder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      console.log('✅ Successfully reordered fields');
      return response.ok;
    } catch (error) {
      console.error('Error reordering fields:', error);
      return false;
    }
  }

  // =============================================================================
  // ADVANCED TICKET GROUPS API
  // =============================================================================

  async getAdvancedTicketGroups(includeInactive: boolean = false): Promise<AdvancedTicketGroupDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }

      const url = `${this.baseUrl}/tickets/settings/groups${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn('Advanced groups API not available, using mock data');
        return this.getMockAdvancedTicketGroups();
      }
      const rawData = await response.json();
      console.log('✅ Successfully fetched advanced groups from API:', rawData);
      const groups = Array.isArray(rawData) ? (rawData as RawAdvancedTicketGroup[]) : [];
      return groups.map((group) => this.normalizeAdvancedTicketGroup(group));
    } catch (error) {
      console.warn('Advanced groups API not available, using mock data:', error);
      return this.getMockAdvancedTicketGroups();
    }
  }

  async createAdvancedTicketGroup(data: CreateAdvancedTicketGroupDto): Promise<AdvancedTicketGroupDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        ...data,
        subcategoryId: data.subcategoryId && data.subcategoryId > 0 ? data.subcategoryId : undefined,
        autoAssignmentEnabled: data.autoAssignmentEnabled ?? false,
        isActive: data.isActive ?? true,
      };

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created advanced group:', result);
      return result;
    } catch (error) {
      console.error('Error creating advanced group:', error);
      throw error;
    }
  }

  async updateAdvancedTicketGroup(id: number, data: UpdateAdvancedTicketGroupDto): Promise<AdvancedTicketGroupDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        ...data,
        subcategoryId: data.subcategoryId && data.subcategoryId > 0 ? data.subcategoryId : undefined,
      };

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated advanced group:', result);
      return result;
    } catch (error) {
      console.error('Error updating advanced group:', error);
      throw error;
    }
  }

  async deleteAdvancedTicketGroup(id: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted advanced group');
      return response.ok;
    } catch (error) {
      console.error('Error deleting advanced group:', error);
      return false;
    }
  }

  async getGroupAgents(groupId: number): Promise<TicketGroupAgentDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${groupId}/agents`, { headers });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching group agents:', error);
      return [];
    }
  }

  async assignAgentToGroup(groupId: number, agentId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${groupId}/agents/${agentId}`, {
        method: 'POST',
        headers
      });
      
      console.log('✅ Successfully assigned agent to group');
      return response.ok;
    } catch (error) {
      console.error('Error assigning agent to group:', error);
      return false;
    }
  }

  async removeAgentFromGroup(groupId: number, agentId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${groupId}/agents/${agentId}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully removed agent from group');
      return response.ok;
    } catch (error) {
      console.error('Error removing agent from group:', error);
      return false;
    }
  }

  // =============================================================================
  // SLA API
  // =============================================================================

  async getSlaPolicies(includeInactive: boolean = false): Promise<SlaPolicyDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${this.baseUrl}/tickets/settings/sla${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn('SLA policies API not available, using mock data');
        return this.getMockSlaPolicies();
      }
      const data = await response.json();
      console.log('✅ Successfully fetched SLA policies from API:', data);
      
      // Map API response to expected frontend format
      const policies = Array.isArray(data) ? (data as RawSlaPolicy[]) : [];
      return policies.map((policy) => this.normalizeSlaPolicy(policy));
    } catch (error) {
      console.warn('SLA policies API not available, using mock data:', error);
      return this.getMockSlaPolicies();
    }
  }

  async createSlaPolicy(data: CreateSlaPolicyDto): Promise<SlaPolicyDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const normalizedPriority = data.priorityId > 0 ? data.priorityId - 1 : 0;
      const createLevel = (level: number, minutes?: number | null) =>
        minutes != null ? { level, triggerAtMinutes: minutes } : undefined;
      const escalationLevels = [
        createLevel(1, data.escalationLevel1Minutes ?? undefined),
        createLevel(2, data.escalationLevel2Minutes ?? undefined),
        createLevel(3, data.escalationLevel3Minutes ?? undefined),
      ].filter((level): level is { level: number; triggerAtMinutes: number } => level !== undefined);

      // Map frontend format to backend format
      const backendPayload = {
        name: data.name,
        description: data.description || '',
        category: 0, // Default category
        priority: normalizedPriority,
        firstResponseMins: data.responseTimeMinutes,
        resolutionMins: data.resolutionTimeMinutes,
        escalationLevels: escalationLevels.length ? escalationLevels : undefined
      };

      console.log('📤 Creating SLA policy:', backendPayload);

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla`, {
        method: 'POST',
        headers,
        body: JSON.stringify(backendPayload)
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created SLA policy:', result);

      return this.normalizeSlaPolicy(result as RawSlaPolicy);
    } catch (error) {
      console.error('Error creating SLA policy:', error);
      throw error;
    }
  }

  async updateSlaPolicy(id: string, data: UpdateSlaPolicyDto): Promise<SlaPolicyDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const normalizedPriority = data.priorityId > 0 ? data.priorityId - 1 : 0;
      const createLevel = (level: number, minutes?: number | null) =>
        minutes != null ? { level, triggerAtMinutes: minutes } : undefined;
      const escalationLevels = [
        createLevel(1, data.escalationLevel1Minutes ?? undefined),
        createLevel(2, data.escalationLevel2Minutes ?? undefined),
        createLevel(3, data.escalationLevel3Minutes ?? undefined),
      ].filter((level): level is { level: number; triggerAtMinutes: number } => level !== undefined);

      // Map frontend format to backend format
      const backendPayload = {
        name: data.name,
        description: data.description || '',
        isActive: data.isActive ?? true,
        category: 0, // Default category
        priority: normalizedPriority,
        firstResponseMins: data.responseTimeMinutes,
        resolutionMins: data.resolutionTimeMinutes,
        escalationLevels: escalationLevels.length ? escalationLevels : undefined
      };

      console.log('📤 Sending update request:', { id, backendPayload });

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(backendPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update failed:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated SLA policy:', result);

      return this.normalizeSlaPolicy(result as RawSlaPolicy);
    } catch (error) {
      console.error('Error updating SLA policy:', error);
      throw error;
    }
  }

  async deleteSlaPolicy(id: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla/${id}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted SLA policy');
      return response.ok;
    } catch (error) {
      console.error('Error deleting SLA policy:', error);
      return false;
    }
  }

  async getEscalationContacts(policyId?: string): Promise<SlaEscalationContactDto[]> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = policyId
        ? `${this.baseUrl}/tickets/settings/sla/contacts?policyId=${encodeURIComponent(policyId)}`
        : `${this.baseUrl}/tickets/settings/sla/contacts`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn('SLA escalation contacts API not available, using mock data');
        return this.getMockEscalationContacts().filter(c => !policyId || c.slaPolicyId === policyId);
      }
      const data = await response.json();
      console.log('✅ Successfully fetched escalation contacts from API:', data);
      return Array.isArray(data)
        ? data.map(contact => ({
            ...contact,
            slaPolicyId: String(contact.slaPolicyId ?? ''),
            notifyByEmail: contact.notifyByEmail ?? true,
            notifyBySystem: contact.notifyBySystem ?? true,
            isActive: contact.isActive ?? true,
          }))
        : [];
    } catch (error) {
      console.warn('SLA escalation contacts API not available, using mock data:', error);
      const mockData = this.getMockEscalationContacts();
      if (policyId) {
        return mockData.filter(c => c.slaPolicyId === policyId);
      }
      return mockData;
    }
  }

  async createEscalationContact(policyId: string, data: Omit<CreateSlaEscalationContactDto, 'slaPolicyId'>): Promise<SlaEscalationContactDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Creating escalation contact:', { policyId, data });

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla/${policyId}/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully created escalation contact:', result);
      return {
        ...result,
        slaPolicyId: String(result.slaPolicyId ?? policyId),
        notifyByEmail: result.notifyByEmail ?? true,
        notifyBySystem: result.notifyBySystem ?? true,
        isActive: result.isActive ?? true,
      };
    } catch (error) {
      console.error('Error creating escalation contact:', error);
      throw error;
    }
  }

  async updateEscalationContact(contactId: number, data: UpdateSlaEscalationContactDto): Promise<SlaEscalationContactDto> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla/contacts/${contactId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Successfully updated escalation contact:', result);
      return {
        ...result,
        slaPolicyId: String(result.slaPolicyId ?? ''),
        notifyByEmail: result.notifyByEmail ?? true,
        notifyBySystem: result.notifyBySystem ?? true,
        isActive: result.isActive ?? true,
      };
    } catch (error) {
      console.error('Error updating escalation contact:', error);
      throw error;
    }
  }

  async deleteEscalationContact(contactId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/settings/sla/contacts/${contactId}`, {
        method: 'DELETE',
        headers
      });
      
      console.log('✅ Successfully deleted escalation contact');
      return response.ok;
    } catch (error) {
      console.error('Error deleting escalation contact:', error);
      return false;
    }
  }

  // =============================================================================
  // MOCK DATA FOR ADVANCED SETTINGS
  // =============================================================================

  private getMockTicketTags(): TicketTagDto[] {
    return [
      {
        id: 1,
        name: 'Urgent',
        subCategoryId: 1,
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Bug',
        subCategoryId: 1,
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Enhancement',
        subCategoryId: 1,
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockGraphEmailConfigs(): GraphEmailConfigDto[] {
    return [
      {
        id: 1,
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        clientSecret: '***CONFIGURED***',
        email: 'support@example.com',
        categoryId: 1,
        isActive: true,
        processIncomingEmails: true,
        createTicketsFromEmails: true,
        sendNotifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        clientSecret: '***CONFIGURED***',
        email: 'hr-support@example.com',
        categoryId: 4,
        isActive: true,
        processIncomingEmails: true,
        createTicketsFromEmails: true,
        sendNotifications: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockTicketFieldSettings(): TicketFieldSettingDto[] {
    return [
      {
        id: 1,
        categoryId: 1,
        fieldName: 'Issue Severity',
        fieldType: 'select',
        isMandatory: true,
        isActive: true,
        options: 'Low,Medium,High,Critical',
        placeholderText: 'Select severity level',
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        categoryId: 1,
        fieldName: 'Affected System',
        fieldType: 'text',
        isMandatory: false,
        isActive: true,
        placeholderText: 'Enter affected system name',
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        categoryId: 2,
        fieldName: 'Device Model',
        fieldType: 'text',
        isMandatory: true,
        isActive: true,
        placeholderText: 'Enter device model',
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockAdvancedTicketGroups(): AdvancedTicketGroupDto[] {
    return [
      {
        id: 1,
        name: 'Software Support Team',
        description: 'General software support for all software categories',
        categoryId: 1, // Software category
        subcategoryId: undefined, // Applies to all software subcategories
        assignedAgentIds: [3297],
        maxTicketsPerAgent: 10,
        autoAssignmentEnabled: true,
        totalTickets: 0,
        isActive: true, // Now active
        isDeleted: false,
        createdAt: '2025-09-18T13:06:30.4825709',
        updatedAt: '2025-09-18T13:14:05.4933658'
      },
      {
        id: 2,
        name: 'Level 1 Support Group',
        description: 'Specialized support for LT Application',
        categoryId: 1, // Software category
        subcategoryId: 1, // LT Application subcategory
        assignedAgentIds: [4002],
        maxTicketsPerAgent: 10,
        autoAssignmentEnabled: true,
        totalTickets: 0,
        isActive: true,
        isDeleted: false,
        createdAt: '2025-09-18T13:13:56.5368673',
        updatedAt: '2025-09-18T13:13:56.5368673'
      }
    ];
  }

  private getMockSlaPolicies(): SlaPolicyDto[] {
    return [
      {
        id: '1',
        name: 'Standard Support SLA',
        priorityId: 3,
        priorityName: 'Medium',
        responseTimeMinutes: 240, // 4 hours
        resolutionTimeMinutes: 1440, // 24 hours
        escalationLevel1Minutes: 480, // 8 hours
        escalationLevel2Minutes: 720, // 12 hours
        escalationLevel3Minutes: 960, // 16 hours
        isActive: true,
        isDeleted: false,
        escalationContactsCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Critical Support SLA',
        priorityId: 1,
        priorityName: 'Critical',
        responseTimeMinutes: 60, // 1 hour
        resolutionTimeMinutes: 240, // 4 hours
        escalationLevel1Minutes: 120, // 2 hours
        escalationLevel2Minutes: 180, // 3 hours
        escalationLevel3Minutes: null,
        isActive: true,
        isDeleted: false,
        escalationContactsCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockEscalationContacts(): SlaEscalationContactDto[] {
    return [
      {
        id: 1,
        slaPolicyId: '1',
        level: 1,
        name: 'Team Lead',
        email: 'team.lead@company.com',
        notifyByEmail: true,
        notifyBySystem: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        slaPolicyId: '1',
        level: 2,
        name: 'Department Manager',
        email: 'dept.manager@company.com',
        notifyByEmail: true,
        notifyBySystem: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        slaPolicyId: '1',
        level: 3,
        name: 'Director',
        email: 'director@company.com',
        notifyByEmail: true,
        notifyBySystem: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        slaPolicyId: '2',
        level: 1,
        name: 'Senior Engineer',
        email: 'senior.engineer@company.com',
        notifyByEmail: true,
        notifyBySystem: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        slaPolicyId: '2',
        level: 2,
        name: 'Engineering Manager',
        email: 'eng.manager@company.com',
        notifyByEmail: true,
        notifyBySystem: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const settingsApi = new EnhancedSettingsApiService();
