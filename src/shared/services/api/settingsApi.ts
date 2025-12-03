// Settings API for ticket configurations
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
  subCategories: SubCategory[];
  customFields?: CustomField[];
}

export interface SubCategory {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  isActive: boolean;
  order: number;
  customFields?: CustomField[];
}

export interface CustomField {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime' | 'select' | 'radio' | 'checkbox' | 'file';
  categoryId?: number;
  subCategoryId?: number;
  options?: string[]; // For select/radio/checkbox type fields
  placeholder?: string;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    fileTypes?: string[]; // For file upload fields
    maxFileSize?: number; // In MB for file upload fields
  };
  createdAt: string;
  updatedAt: string;
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
  allowedTransitions: number[]; // Array of status IDs this status can transition to
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

export interface AgentGroup {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
  agentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Ticket Group (routing groups tied to categories/subcategories)
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

// Category Email Mapping for routing emails based on ticket category
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
  smtpUseSsl?: boolean; // Match backend naming
  smtpUsername?: string;
  smtpPassword?: string; // Will be encrypted on backend
  // IMAP Configuration for email-to-ticket
  imapServer?: string;
  imapPort?: number;
  imapUseSsl?: boolean; // Match backend naming
  imapUsername?: string;
  imapPassword?: string; // Will be encrypted on backend
  keywordMappings?: string; // JSON string for keyword mappings
}

export interface SubcategoryKeyword {
  id: number;
  subcategoryId: number;
  subcategoryName: string;
  keywords: string[]; // Array of keywords to match in email subject/content
  priority: number; // Higher priority keywords take precedence
}

export interface CreateCategoryEmailMappingRequest {
  categoryId: number;
  emailAddress: string;
  displayName?: string;
  isActive?: boolean;
  // SMTP Configuration
  smtpServer?: string;
  smtpPort?: number;
  smtpUseSsl?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  // IMAP Configuration
  imapServer?: string;
  imapPort?: number;
  imapUseSsl?: boolean;
  imapUsername?: string;
  imapPassword?: string;
  keywordMappings?: string; // JSON string
}

export interface UpdateCategoryEmailMappingRequest extends CreateCategoryEmailMappingRequest {
  isActive: boolean;
}

// New Microsoft Graph API Email Configuration
export interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  categories: string[];
  clientId: string;
  tenantId: string;
  clientSecret: string;
  department?: string;
  keywords?: string[];
  defaultPriority?: number;
  defaultAssignee?: string;
}

export interface AutoAssignmentRules {
  enableCategoryMapping: boolean;
  enableKeywordDetection: boolean;
  enablePriorityDetection: boolean;
  urgentKeywords: string[];
  highKeywords: string[];
  defaultPriority: number;
  defaultCategory: string;
}

export interface NotificationSettings {
  enableStatusNotifications: boolean;
  enableAutoReply: boolean;
  enableReopenOption: boolean;
  reopenWindowHours: number;
  autoReplyTemplate: string;
  sendToRequesterOnly: boolean;
  includeTicketHistory: boolean;
}

export interface EmailConfiguration {
  enableGraphApi: boolean;
  processedFolder: string;
  errorFolder: string;
  maxEmailsPerBatch: number;
  processingIntervalMinutes: number;
  defaultFromEmail: string;
  defaultFromName: string;
  emailAccounts: EmailAccount[];
  autoAssignmentRules: AutoAssignmentRules;
  notificationSettings: NotificationSettings;
}

class SettingsApiService {
  private baseUrl: string;
  private useMocks: boolean;
  constructor() {
    const envObj = (import.meta as any).env || {};
    const rawBase: string | undefined = envObj.VITE_API_BASE_URL;
    // Normalize and default to running backend port 5015
    const cleaned = (rawBase?.trim().replace(/\/$/, '')) || 'http://localhost:5015/api';
    this.baseUrl = cleaned;
    this.useMocks = envObj.VITE_USE_MOCKS === 'true';
    
    // Debug log to check the actual baseUrl being used (only in development)
    if (import.meta.env.DEV) {
      console.log('[SettingsApi] Using baseUrl:', this.baseUrl);
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && Number(contentLength) === 0) {
      return undefined as T;
    }

    const raw = await response.text();
    if (!raw) {
      return undefined as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  // Department configurations
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/departments`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any>(response);
      
      // Handle API response format: { value: [...], Count: n } 
      const departments = data.value || data || [];
      console.log('🔍 API response departments:', departments);
      
      // Normalize DisplayOrder -> order
      return (Array.isArray(departments) ? departments : []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description ?? undefined,
        isActive: d.isActive ?? true,
        order: (d.displayOrder ?? d.sortOrder ?? 0) as number,
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Departments API failed; using mock data:', error);
        return this.getMockDepartments();
      }
      throw error;
    }
  }

  async createDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
    const payload = {
      name: dept.name,
      description: dept.description,
      displayOrder: dept.order,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/departments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const d = await this.handleResponse<any>(response);
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.sortOrder ?? 0) as number,
    };
  }

  async updateDepartment(id: number, dept: Omit<Department, 'id'>): Promise<Department> {
    const payload = {
      name: dept.name,
      description: dept.description,
      displayOrder: dept.order,
      isActive: dept.isActive,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/departments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const d = await this.handleResponse<any>(response);
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.sortOrder ?? 0) as number,
    };
  }

  // Category configurations
  async getTicketCategories(): Promise<TicketCategoryConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/categories`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any>(response);
      
      // Handle API response format: { value: [...], Count: n } 
      const categories = data.value || data || [];
      console.log('🔍 API response categories:', categories);
      
      // Normalize backend DTO -> frontend shape
      return (Array.isArray(categories) ? categories : []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description ?? undefined,
        isActive: d.isActive ?? true,
        order: (d.displayOrder ?? d.order ?? 0) as number,
        // Backend currently does not include nested subCategories in categories endpoint
        subCategories: Array.isArray(d.subCategories)
          ? (d.subCategories as any[]).map((s: any) => ({
              id: s.id,
              name: s.name,
              description: s.description ?? undefined,
              categoryId: s.categoryId ?? d.id,
              isActive: s.isActive ?? true,
              order: (s.displayOrder ?? s.order ?? 0) as number,
            }))
          : [],
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Categories API failed; using mock data:', error);
        return this.getMockCategories();
      }
      throw error;
    }
  }

  async createTicketCategory(category: Omit<TicketCategoryConfig, 'id' | 'subCategories'>): Promise<TicketCategoryConfig> {
    const payload: any = {
      name: category.name,
      description: category.description,
      displayOrder: category.order,
      // Optional visual fields if UI includes them later
      color: (category as any).color,
      iconName: (category as any).iconName,
      // Backend defaults to true; include for clarity
      isActive: category.isActive ?? true,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const d = await this.handleResponse<any>(response);
    // Normalize response back to frontend shape
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.order ?? 0) as number,
      subCategories: [],
    };
  }

  async updateTicketCategory(id: number, category: Omit<TicketCategoryConfig, 'id' | 'subCategories'>): Promise<TicketCategoryConfig> {
    const payload: any = {
      name: category.name,
      description: category.description,
      displayOrder: category.order,
      isActive: category.isActive,
      color: (category as any).color,
      iconName: (category as any).iconName,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const d = await this.handleResponse<any>(response);
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.order ?? 0) as number,
      subCategories: [],
    };
  }

  async deleteTicketCategory(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tickets/settings/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }

  // Sub Category configurations
  async getSubCategories(categoryId?: number): Promise<SubCategory[]> {
    try {
      const url = categoryId
        ? `${this.baseUrl}/tickets/settings/subcategories?categoryId=${categoryId}`
        : `${this.baseUrl}/tickets/settings/subcategories`;
      const response = await fetch(url, { headers: this.getAuthHeaders() });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description ?? undefined,
        categoryId: d.categoryId,
        isActive: d.isActive ?? true,
        order: (d.displayOrder ?? d.order ?? 0) as number,
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Sub-categories API failed; using mock data:', error);
        const mockData = this.getMockSubCategories();
        return typeof categoryId === 'number' ? mockData.filter(sc => sc.categoryId === categoryId) : mockData;
      }
      throw error;
    }
  }

  async createSubCategory(sub: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    const payload: any = {
      categoryId: sub.categoryId,
      name: sub.name,
      description: sub.description,
      displayOrder: sub.order,
      isActive: sub.isActive ?? true,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const d = await this.handleResponse<any>(response);
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      categoryId: d.categoryId,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.order ?? 0) as number,
    };
  }

  async updateSubCategory(id: number, sub: Omit<SubCategory, 'id' | 'categoryId'>): Promise<SubCategory> {
    const payload: any = {
      name: sub.name,
      description: sub.description,
      displayOrder: sub.order,
      isActive: sub.isActive,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const d = await this.handleResponse<any>(response);
    return {
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      categoryId: d.categoryId,
      isActive: d.isActive ?? true,
      order: (d.displayOrder ?? d.order ?? 0) as number,
    };
  }

  // Issue Type configurations
  async getIssueTypes(): Promise<IssueType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/issuetypes`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((i: any, idx: number) => ({
        id: i.id ?? idx + 1,
        name: i.name,
        description: i.description ?? undefined,
        categoryId: i.categoryId,
        subCategoryId: i.subCategoryId,
        isActive: i.isActive ?? true,
        order: (i.displayOrder ?? i.order ?? idx) as number,
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Issue Types API failed; using mock data:', error);
        return this.getMockIssueTypes();
      }
      throw error;
    }
  }

  // Priority Level configurations
  async getPriorityLevels(): Promise<PriorityLevel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/priorities`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any>(response);
      
      // Handle API response format: { value: [...], Count: n } 
      const priorities = data.value || data || [];
      console.log('🔍 API response priorities:', priorities);

      const normalizedPriorities = (Array.isArray(priorities) ? priorities : []).map((p: any) => {
        const resolvedLevel = Number(p.level ?? p.Level ?? 0) || 0;
        const resolvedOrder = Number(p.displayOrder ?? p.sortOrder ?? resolvedLevel ?? 0) || 0;
        return {
          id: p.id,
          name: p.name,
          level: resolvedLevel,
          color: p.color ?? '#6b7280',
          isActive: p.isActive ?? true,
          order: resolvedOrder,
        };
      });

      return normalizedPriorities.sort((a: PriorityLevel, b: PriorityLevel) => {
        if (a.level !== b.level) return a.level - b.level;
        if (a.order !== b.order) return a.order - b.order;
        return (a.id ?? 0) - (b.id ?? 0);
      });
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Priorities API failed; using mock data:', error);
        return this.getMockPriorityLevels();
      }
      throw error;
    }
  }

  async createPriority(priority: Omit<PriorityLevel, 'id'>): Promise<PriorityLevel> {
    const payload: any = {
      name: priority.name,
      description: (priority as any).description,
      level: priority.level,
      color: priority.color,
      displayOrder: priority.order,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/priorities`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const p = await this.handleResponse<any>(response);
    return {
      id: p.id,
      name: p.name,
      level: (p.level ?? 3) as number,
      color: p.color ?? '#6b7280',
      isActive: p.isActive ?? true,
      order: (p.displayOrder ?? p.sortOrder ?? 0) as number,
    };
  }

  async updatePriority(id: number, priority: Omit<PriorityLevel, 'id'>): Promise<PriorityLevel> {
    const payload: any = {
      name: priority.name,
      description: (priority as any).description,
      level: priority.level,
      color: priority.color,
      displayOrder: priority.order,
      isActive: priority.isActive,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/priorities/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const p = await this.handleResponse<any>(response);
    return {
      id: p.id,
      name: p.name,
      level: (p.level ?? 3) as number,
      color: p.color ?? '#6b7280',
      isActive: p.isActive ?? true,
      order: (p.displayOrder ?? p.sortOrder ?? 0) as number,
    };
  }

  // Ticket Status configurations  
  async getTicketStatuses(): Promise<TicketStatusConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/statuses`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any>(response);
      
      // Handle API response format: { value: [...], Count: n } 
      const statuses = data.value || data || [];
      console.log('🔍 API response statuses:', statuses);
      
      return (Array.isArray(statuses) ? statuses : []).map((s: any) => ({
        id: s.id,
        name: s.name,
        workflowOrder: (s.workflowOrder ?? 0) as number,
        isActive: s.isActive ?? true,
        color: s.color ?? '#6b7280',
        isDefault: s.isDefault ?? false,
        allowedTransitions: Array.isArray(s.allowedTransitions)
          ? s.allowedTransitions as number[]
          : []
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Statuses API failed; using mock data:', error);
        return this.getMockTicketStatuses();
      }
      throw error;
    }
  }

  async createStatus(status: Omit<TicketStatusConfig, 'id' | 'allowedTransitions'> & { allowedTransitions?: number[] }): Promise<TicketStatusConfig> {
    const payload: any = {
      name: status.name,
      workflowOrder: status.workflowOrder,
      isActive: status.isActive ?? true,
      color: status.color,
      isDefault: status.isDefault ?? false,
      allowedTransitions: status.allowedTransitions ?? []
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/statuses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const s = await this.handleResponse<any>(response);
    return {
      id: s.id,
      name: s.name,
      workflowOrder: (s.workflowOrder ?? 0) as number,
      isActive: s.isActive ?? true,
      color: s.color ?? '#6b7280',
      isDefault: s.isDefault ?? false,
      allowedTransitions: Array.isArray(s.allowedTransitions) ? s.allowedTransitions : []
    };
  }

  async updateStatus(id: number, status: Omit<TicketStatusConfig, 'id' | 'allowedTransitions'> & { allowedTransitions?: number[] }): Promise<TicketStatusConfig> {
    const payload: any = {
      name: status.name,
      workflowOrder: status.workflowOrder,
      isActive: status.isActive,
      color: status.color,
      isDefault: status.isDefault,
      allowedTransitions: status.allowedTransitions ?? []
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/statuses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const s = await this.handleResponse<any>(response);
    return {
      id: s.id,
      name: s.name,
      workflowOrder: (s.workflowOrder ?? 0) as number,
      isActive: s.isActive ?? true,
      color: s.color ?? '#6b7280',
      isDefault: s.isDefault ?? false,
      allowedTransitions: Array.isArray(s.allowedTransitions) ? s.allowedTransitions : []
    };
  }

  // Agent configurations
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id,
        userId: a.userId,
        name: a.name,
        email: a.email,
        departmentId: undefined,
        departmentName: a.department ?? undefined,
        // Backend does not return single group; UI will enrich with joined names
        agentGroupId: undefined,
        agentGroupName: undefined,
        isActive: a.isActive ?? true,
        // Defaults until workload fields are implemented server-side
        maxTicketsCapacity: 0,
        currentTicketCount: 0,
        availabilityStatus: a.isActive ? 'Available' : 'Offline',
        createdAt: a.createdAt ?? new Date().toISOString(),
        updatedAt: a.updatedAt ?? new Date().toISOString(),
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Agents API failed; using mock data:', error);
        return this.getMockAgents();
      }
      throw error;
    }
  }

  async getUnassignedAgents(): Promise<Agent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agents/unassigned`, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id,
        userId: a.userId,
        name: a.name,
        email: a.email,
        departmentId: undefined,
        departmentName: a.department ?? undefined,
        agentGroupId: undefined,
        agentGroupName: undefined,
        isActive: a.isActive ?? true,
        maxTicketsCapacity: 0,
        currentTicketCount: 0,
        availabilityStatus: a.isActive ? 'Available' : 'Offline',
        createdAt: a.createdAt ?? new Date().toISOString(),
        updatedAt: a.updatedAt ?? new Date().toISOString(),
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Unassigned Agents API failed; using mock data:', error);
        // Return empty array for mocks since we want real unassigned agents
        return [];
      }
      throw error;
    }
  }

  async getAgentsForCategory(categoryId: number, subcategoryId?: number): Promise<Agent[]> {
    try {
      const url = `${this.baseUrl}/tickets/settings/agents/for-category/${categoryId}${subcategoryId ? `?subcategoryId=${subcategoryId}` : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id,
        userId: a.userId,
        name: a.name,
        email: a.email,
        departmentId: undefined,
        departmentName: a.department ?? undefined,
        agentGroupId: a.groupId,
        agentGroupName: a.groupName,
        isActive: a.isActive ?? true,
        maxTicketsCapacity: 0,
        currentTicketCount: 0,
        availabilityStatus: a.isActive ? 'Available' : 'Offline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Category Agents API failed; using mock data:', error);
        return this.getMockAgents();
      }
      throw error;
    }
  }
  
  // Per-agent groups
  async getGroupsForAgent(agentId: number, includeInactive = false): Promise<TicketGroup[]> {
    const url = `${this.baseUrl}/tickets/settings/agents/${agentId}/groups${includeInactive ? '?includeInactive=true' : ''}`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    const data = await this.handleResponse<any[]>(response);
    return (Array.isArray(data) ? data : []).map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? undefined,
      categoryId: g.categoryId,
      categoryName: g.categoryName ?? '',
      subCategoryId: g.subCategoryId ?? undefined,
      subCategoryName: g.subCategoryName ?? undefined,
      isActive: g.isActive ?? true,
      agentCount: g.agentCount ?? 0,
      createdAt: g.createdAt ?? new Date().toISOString(),
      updatedAt: g.updatedAt ?? undefined,
    }));
  }

  // Agent Group configurations
  async getAgentGroups(): Promise<AgentGroup[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/agent-groups`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? undefined,
        departmentId: g.departmentId,
        departmentName: g.departmentName,
        isActive: g.isActive ?? true,
        agentCount: g.agentCount ?? 0,
        createdAt: g.createdAt ?? new Date().toISOString(),
        updatedAt: g.updatedAt ?? new Date().toISOString(),
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Agent Groups API failed; using mock data:', error);
        return this.getMockAgentGroups();
      }
      // If API not implemented yet, return empty so UI doesn't show mock noise
      return [];
    }
  }

  // Ticket Groups
  async getTicketGroups(params?: { categoryId?: number; subCategoryId?: number; includeInactive?: boolean }): Promise<TicketGroup[]> {
    try {
      const qs: string[] = [];
      if (params?.categoryId) qs.push(`categoryId=${params.categoryId}`);
      if (params?.subCategoryId) qs.push(`subCategoryId=${params.subCategoryId}`);
      if (typeof params?.includeInactive === 'boolean') qs.push(`includeInactive=${params.includeInactive}`);
      const url = `${this.baseUrl}/tickets/settings/groups${qs.length ? `?${qs.join('&')}` : ''}`;
      const response = await fetch(url, { headers: this.getAuthHeaders() });
      const data = await this.handleResponse<any[]>(response);
      return (Array.isArray(data) ? data : []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? undefined,
        categoryId: g.categoryId,
        categoryName: g.categoryName ?? '',
        subCategoryId: g.subCategoryId ?? undefined,
        subCategoryName: g.subCategoryName ?? undefined,
        isActive: g.isActive ?? true,
        agentCount: g.agentCount ?? 0,
        createdAt: g.createdAt ?? new Date().toISOString(),
        updatedAt: g.updatedAt ?? undefined,
      }));
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Ticket Groups API failed; using mock data:', error);
        // Map mock AgentGroup to TicketGroup-like sample based on categories
        const mocks = this.getMockAgentGroups();
        return mocks.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          categoryId: 1,
          categoryName: 'Technical Issues',
          isActive: m.isActive,
          agentCount: m.agentCount,
          createdAt: m.createdAt,
          subCategoryId: undefined,
          subCategoryName: undefined,
        }));
      }
      throw error;
    }
  }

  async createTicketGroup(payload: CreateTicketGroupRequest): Promise<TicketGroup> {
    const body = {
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      isActive: payload.isActive ?? true,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/groups`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const g = await this.handleResponse<any>(response);
    return {
      id: g.id,
      name: g.name,
      description: g.description ?? undefined,
      categoryId: g.categoryId,
      categoryName: g.categoryName ?? '',
      subCategoryId: g.subCategoryId ?? undefined,
      subCategoryName: g.subCategoryName ?? undefined,
      isActive: g.isActive ?? true,
      agentCount: g.agentCount ?? 0,
      createdAt: g.createdAt ?? new Date().toISOString(),
      updatedAt: g.updatedAt ?? undefined,
    };
  }

  async updateTicketGroup(id: number, payload: UpdateTicketGroupRequest): Promise<TicketGroup> {
    const body = {
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      isActive: payload.isActive,
    };
    const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const g = await this.handleResponse<any>(response);
    return {
      id: g.id,
      name: g.name,
      description: g.description ?? undefined,
      categoryId: g.categoryId,
      categoryName: g.categoryName ?? '',
      subCategoryId: g.subCategoryId ?? undefined,
      subCategoryName: g.subCategoryName ?? undefined,
      isActive: g.isActive ?? true,
      agentCount: g.agentCount ?? 0,
      createdAt: g.createdAt ?? new Date().toISOString(),
      updatedAt: g.updatedAt ?? undefined,
    };
  }

  async deleteTicketGroup(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete ticket group via API:', error);
      return false;
    }
  }

  // Delete operations
  async deleteDepartment(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/departments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      if (this.useMocks) console.warn('Failed to delete department via API:', error);
      return false;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/categories/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok; // Expect 204 No Content
    } catch (error) {
      if (this.useMocks) console.warn('Failed to delete category via API:', error);
      return false;
    }
  }

  async deleteSubCategory(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/subcategories/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      if (this.useMocks) console.warn('Failed to delete subcategory via API:', error);
      return false;
    }
  }

  async deletePriority(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/priorities/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      if (this.useMocks) console.warn('Failed to delete priority via API:', error);
      return false;
    }
  }

  async deleteStatus(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/statuses/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      if (this.useMocks) console.warn('Failed to delete status via API:', error);
      return false;
    }
  }

  async deleteAgent(id: number): Promise<boolean> {
    console.log('🗑️ Mock delete agent:', id);
    return true; // Mock success
  }

  async deleteAgentGroup(id: number): Promise<boolean> {
    // Not implemented in API yet; keep mock
    console.log('🗑️ Mock delete agent group:', id);
    return true; // Mock success
  }

  // Group operations (aliases for ticket groups)
  async createGroup(data: any): Promise<any> {
    return this.createTicketGroup(data);
  }

  async updateGroup(id: number, data: any): Promise<any> {
    return this.updateTicketGroup(id, data);
  }

  async deleteGroup(id: number): Promise<boolean> {
    return this.deleteTicketGroup(id);
  }

  // Agent operations
  async createAgent(data: any): Promise<any> {
    console.log('🗑️ Mock create agent:', data);
    return { id: Math.random(), ...data }; // Mock success
  }

  async updateAgent(id: number, data: any): Promise<any> {
    console.log('🗑️ Mock update agent:', id, data);
    return { id, ...data }; // Mock success
  }

  // Category operations (aliases for ticket categories)
  async createCategory(data: any): Promise<any> {
    return this.createTicketCategory(data);
  }

  async updateCategory(id: number, data: any): Promise<any> {
    return this.updateTicketCategory(id, data);
  }

  // Add / remove agent membership endpoints
  async addAgentToGroup(groupId: number, agentId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${groupId}/members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ agentId })
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to add agent to group', e);
      return false;
    }
  }

  async removeAgentFromGroup(groupId: number, agentId: number): Promise<boolean> {
    try {
      // Assuming endpoint uses composite identification; if membership id needed adjust later
      const response = await fetch(`${this.baseUrl}/tickets/settings/groups/${groupId}/members/${agentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to remove agent from group', e);
      return false;
    }
  }

  // Mock data methods (fallback when APIs are not available)
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
    ];
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

  private getMockAgents(): Agent[] {
    return [
      {
        id: 1,
        userId: 'user1',
        name: 'John Smith',
        email: 'john.smith@babajishivram.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 1,
        agentGroupName: 'Level 1 Support',
        isActive: true,
        maxTicketsCapacity: 15,
        currentTicketCount: 8,
        availabilityStatus: 'Available',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 2,
        userId: 'user2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@babajishivram.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 2,
        agentGroupName: 'Level 2 Support',
        isActive: true,
        maxTicketsCapacity: 10,
        currentTicketCount: 5,
        availabilityStatus: 'Available',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 3,
        userId: 'user3',
        name: 'Mike Davis',
        email: 'mike.davis@babajishivram.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 1,
        agentGroupName: 'Level 1 Support',
        isActive: true,
        maxTicketsCapacity: 12,
        currentTicketCount: 10,
        availabilityStatus: 'Busy',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 4,
        userId: 'user4',
        name: 'Emily Chen',
        email: 'emily.chen@babajishivram.com',
        departmentId: 2,
        departmentName: 'HR Department',
        agentGroupId: 3,
        agentGroupName: 'HR Support',
        isActive: true,
        maxTicketsCapacity: 8,
        currentTicketCount: 3,
        availabilityStatus: 'Available',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 5,
        userId: 'user5',
        name: 'David Wilson',
        email: 'david.wilson@babajishivram.com',
        departmentId: 6,
        departmentName: 'Training Department',
        agentGroupId: 4,
        agentGroupName: 'Training Support',
        isActive: true,
        maxTicketsCapacity: 6,
        currentTicketCount: 2,
        availabilityStatus: 'Available',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 6,
        userId: 'user6',
        name: 'Lisa Brown',
        email: 'lisa.brown@babajishivram.com',
        departmentId: 1,
        departmentName: 'IT Department',
        agentGroupId: 2,
        agentGroupName: 'Level 2 Support',
        isActive: false,
        maxTicketsCapacity: 10,
        currentTicketCount: 0,
        availabilityStatus: 'Offline',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
      }
    ];
  }

  private getMockAgentGroups(): AgentGroup[] {
    return [
      {
        id: 1,
        name: 'Level 1 Support',
        description: 'First level technical support for basic issues',
        departmentId: 1,
        departmentName: 'IT Department',
        isActive: true,
        agentCount: 2,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 2,
        name: 'Level 2 Support',
        description: 'Advanced technical support for complex issues',
        departmentId: 1,
        departmentName: 'IT Department',
        isActive: true,
        agentCount: 1,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 3,
        name: 'HR Support',
        description: 'Human Resources support team',
        departmentId: 2,
        departmentName: 'HR Department',
        isActive: true,
        agentCount: 1,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 4,
        name: 'Training Support',
        description: 'Learning and training platform support',
        departmentId: 6,
        departmentName: 'Training Department',
        isActive: true,
        agentCount: 1,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 5,
        name: 'Finance Support',
        description: 'Financial system support team',
        departmentId: 3,
        departmentName: 'Finance Department',
        isActive: true,
        agentCount: 0,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
      }
    ];
  }

  // Batch: agents with groups to eliminate N+1 pattern
  async getAgentsWithGroups(includeInactive = false): Promise<Array<{ agent: Agent; groups: TicketGroup[] }>> {
    try {
      const url = `${this.baseUrl}/tickets/settings/agents-with-groups${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, { headers: this.getAuthHeaders() });
      const data = await this.handleResponse<any[]>(response);
      // Backend returns objects: { agent: {..}, groups: [...] }
      return (Array.isArray(data) ? data : []).map((item: any) => {
        const a = item.agent;
        const groups = Array.isArray(item.groups) ? item.groups : [];
        const agent: Agent = {
          id: a.id,
          userId: a.userId,
          name: a.name,
          email: a.email,
          departmentId: undefined,
          departmentName: a.department ?? undefined,
          agentGroupId: undefined,
          agentGroupName: groups.map((g: any) => g.name).join(', ') || undefined,
          isActive: a.isActive ?? true,
          maxTicketsCapacity: 0,
          currentTicketCount: 0,
          availabilityStatus: (a.isActive ? 'Available' : 'Offline'),
          createdAt: a.createdAt ?? new Date().toISOString(),
          updatedAt: a.updatedAt ?? new Date().toISOString(),
        };
        const mappedGroups: TicketGroup[] = groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description ?? undefined,
          categoryId: g.categoryId,
          categoryName: g.categoryName ?? '',
          subCategoryId: g.subCategoryId ?? undefined,
          subCategoryName: g.subCategoryName ?? undefined,
          isActive: g.isActive ?? true,
          agentCount: g.agentCount ?? 0,
          createdAt: g.createdAt ?? new Date().toISOString(),
          updatedAt: g.updatedAt ?? undefined,
        }));
        return { agent, groups: mappedGroups };
      });
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Agents-with-groups API failed; synthesizing from agent + group mocks:', error);
        // Combine mock agents with all mock groups for now (no membership logic in mock)
        const agents = this.getMockAgents();
        const groups = this.getMockAgentGroups().map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          categoryId: 1,
          categoryName: 'Technical Issues',
          subCategoryId: undefined,
          subCategoryName: undefined,
          isActive: g.isActive,
          agentCount: g.agentCount,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        }));
        return agents.map(a => ({ agent: a, groups }));
      }
      throw error;
    }
  }

  async convertUserToAgent(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/convert-to-agent`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convert failed ${response.status}: ${text}`);
    }
    return response.json();
  }

  // Category Email Mapping Methods
  async getCategoryEmailMappings(): Promise<CategoryEmailMapping[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings`, {
        headers: this.getAuthHeaders()
      });
      const result = await this.handleResponse<CategoryEmailMapping[]>(response);
      console.log('[API] Email mappings response:', result);
      
      // If API returns empty array, use mock data for demonstration
      if (!result || result.length === 0) {
        console.warn('[API] No email mappings found in database, using mock data');
        return this.getMockCategoryEmailMappings();
      }
      
      return result;
    } catch (error) {
      // Silent fallback to mock data
      return this.getMockCategoryEmailMappings();
    }
  }

  async updateCategoryEmailMapping(categoryId: number, request: UpdateCategoryEmailMappingRequest): Promise<CategoryEmailMapping> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings/${categoryId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });
      return await this.handleResponse<CategoryEmailMapping>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock update category email mapping');
        return {
          id: categoryId,
          categoryId: request.categoryId,
          categoryName: 'Mock Category',
          emailAddress: request.emailAddress,
          displayName: request.displayName,
          isActive: request.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  // Update email mapping by mapping ID (more intuitive for UI)
  async updateEmailMappingById(mappingId: number, request: UpdateCategoryEmailMappingRequest): Promise<CategoryEmailMapping> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings/${mappingId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });
      return await this.handleResponse<CategoryEmailMapping>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock update email mapping by ID');
        return {
          id: mappingId,
          categoryId: request.categoryId,
          categoryName: 'Mock Category',
          emailAddress: request.emailAddress,
          displayName: request.displayName,
          isActive: request.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  async createCategoryEmailMapping(request: CreateCategoryEmailMappingRequest): Promise<CategoryEmailMapping> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });
      return await this.handleResponse<CategoryEmailMapping>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock create category email mapping');
        return {
          id: Math.floor(Math.random() * 1000),
          categoryId: request.categoryId,
          categoryName: 'Mock Category',
          emailAddress: request.emailAddress,
          displayName: request.displayName,
          isActive: request.isActive ?? true,
          createdAt: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  async deleteCategoryEmailMapping(categoryId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings/${categoryId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      await this.handleResponse(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock delete category email mapping');
        return;
      }
      throw error;
    }
  }

  // Delete email mapping by mapping ID (more intuitive for UI)
  async deleteEmailMappingById(mappingId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings/${mappingId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      await this.handleResponse(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock delete email mapping by ID');
        return;
      }
      throw error;
    }
  }

  async testEmailConfiguration(categoryId: number, testType: 'smtp' | 'imap'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/category-email-mappings/${categoryId}/test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ testType })
      });
      return await this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock test email configuration');
        return {
          success: true,
          message: `Mock ${testType.toUpperCase()} test successful`
        };
      }
      throw error;
    }
  }

  async getSubcategoryKeywords(categoryId: number): Promise<SubcategoryKeyword[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/subcategory-keywords/${categoryId}`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<SubcategoryKeyword[]>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock subcategory keywords');
        return this.getMockSubcategoryKeywords(categoryId);
      }
      throw error;
    }
  }

  // Email-to-Ticket Conversion API
  async startEmailMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/email-to-ticket/start`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock start email monitoring');
        return {
          success: true,
          message: 'Mock email monitoring started for all configured email addresses'
        };
      }
      throw error;
    }
  }

  async stopEmailMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/email-to-ticket/stop`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock stop email monitoring');
        return {
          success: true,
          message: 'Mock email monitoring stopped'
        };
      }
      throw error;
    }
  }

  async getEmailMonitoringStatus(): Promise<{ 
    isRunning: boolean; 
    lastCheck: string; 
    monitoredEmails: string[]; 
    processedCount: number; 
    errorCount: number; 
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/email-to-ticket/status`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock email monitoring status');
        return {
          isRunning: true,
          lastCheck: new Date().toISOString(),
          monitoredEmails: ['techsupport@company.com', 'hardware@company.com', 'software@company.com'],
          processedCount: 47,
          errorCount: 2
        };
      }
      // Return default data if endpoint doesn't exist yet
      console.warn('[settingsApi] Email monitoring endpoint not available, returning default status');
      return {
        isRunning: false,
        lastCheck: new Date().toISOString(),
        monitoredEmails: [],
        processedCount: 0,
        errorCount: 0
      };
    }
  }

  async processEmailToTicket(emailData: {
    from: string;
    to: string;
    subject: string;
    body: string;
    receivedAt: string;
  }): Promise<{ success: boolean; ticketId?: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/email-to-ticket/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(emailData)
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock process email to ticket');
        return {
          success: true,
          ticketId: Math.floor(Math.random() * 1000) + 1000,
          message: 'Mock ticket created successfully from email'
        };
      }
      throw error;
    }
  }

  private getMockCategoryEmailMappings(): CategoryEmailMapping[] {
    return [
      {
        id: 1,
        categoryId: 1,
        categoryName: 'Technical Issues',
        emailAddress: 'techsupport@company.com',
        displayName: 'Technical Support Team',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        // SMTP Configuration (Outlook/Exchange)
        smtpServer: 'smtp.office365.com',
        smtpPort: 587,
        smtpUseSsl: false,
        smtpUsername: 'techsupport@company.com',
        smtpPassword: '***encrypted***',
        // IMAP Configuration
        imapServer: 'outlook.office365.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'techsupport@company.com',
        imapPassword: '***encrypted***',
        keywordMappings: JSON.stringify([
          { subcategoryId: 1, subcategoryName: 'Network Issues', keywords: ['network', 'connection', 'wifi', 'internet'], priority: 1 },
          { subcategoryId: 2, subcategoryName: 'VPN Issues', keywords: ['vpn', 'remote access', 'cisco'], priority: 2 }
        ])
      },
      {
        id: 2,
        categoryId: 2,
        categoryName: 'Hardware',
        emailAddress: 'hardware@company.com',
        displayName: 'Hardware Support',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        smtpServer: 'smtp.office365.com',
        smtpPort: 587,
        smtpUseSsl: false,
        smtpUsername: 'hardware@company.com',
        smtpPassword: '***encrypted***',
        imapServer: 'outlook.office365.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'hardware@company.com',
        imapPassword: '***encrypted***',
        keywordMappings: JSON.stringify([
          { subcategoryId: 3, subcategoryName: 'Laptop Issues', keywords: ['laptop', 'notebook', 'portable'], priority: 1 },
          { subcategoryId: 4, subcategoryName: 'Desktop Issues', keywords: ['desktop', 'pc', 'computer'], priority: 2 }
        ])
      },
      {
        id: 3,
        categoryId: 3,
        categoryName: 'Software',
        emailAddress: 'software@company.com',
        displayName: 'Software Support',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        smtpServer: 'smtp.office365.com',
        smtpPort: 587,
        smtpUseSsl: false,
        smtpUsername: 'software@company.com',
        smtpPassword: '***encrypted***',
        imapServer: 'outlook.office365.com',
        imapPort: 993,
        imapUseSsl: true,
        imapUsername: 'software@company.com',
        imapPassword: '***encrypted***',
        keywordMappings: JSON.stringify([
          { subcategoryId: 5, subcategoryName: 'Office 365', keywords: ['office 365', 'o365', 'outlook', 'teams', 'sharepoint', 'onedrive'], priority: 1 },
          { subcategoryId: 6, subcategoryName: 'Licensing', keywords: ['license', 'licensing', 'activation', 'key', 'subscription'], priority: 2 },
          { subcategoryId: 7, subcategoryName: 'LT Software', keywords: ['lt', 'learning tools', 'training software'], priority: 3 }
        ])
      }
    ];
  }

  private getMockSubcategoryKeywords(categoryId: number): SubcategoryKeyword[] {
    const mapping = this.getMockCategoryEmailMappings()
      .find(mapping => mapping.categoryId === categoryId);
    
    if (!mapping?.keywordMappings) return [];
    
    try {
      return JSON.parse(mapping.keywordMappings) || [];
    } catch {
      return [];
    }
  }

  // Microsoft Graph Email Configuration Methods
  async getEmailConfiguration(): Promise<EmailConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-configuration`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<EmailConfiguration>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock email configuration');
        return this.getMockEmailConfiguration();
      }
      throw error;
    }
  }

  async updateEmailConfiguration(config: EmailConfiguration): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-configuration`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });
      await this.handleResponse(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock update email configuration');
        return;
      }
      throw error;
    }
  }

  async getEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<EmailAccount[]>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock email accounts');
        return this.getMockEmailAccounts();
      }
      throw error;
    }
  }

  async getEmailAccountForCategory(categoryName: string): Promise<EmailAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts/category/${encodeURIComponent(categoryName)}`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<EmailAccount>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock email account for category');
        return this.getMockEmailAccounts()[0];
      }
      throw error;
    }
  }

  async testEmailConnection(accountId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/email-accounts/${encodeURIComponent(accountId)}/test-connection`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock test email connection');
        return { message: 'Connection test successful (mock)' };
      }
      throw error;
    }
  }

  async getAvailableCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/categories`, {
        headers: this.getAuthHeaders()
      });
      const categories = await this.handleResponse<any[]>(response);
      return categories.filter(cat => cat.isActive).map(cat => cat.name);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock available categories');
        return [
          'General', 'IT Support', 'Hardware', 'Software', 'Network', 'Security',
          'HR', 'Payroll', 'Leave Management', 'Employee Relations',
          'Finance', 'Accounting', 'Budget', 'Expenses',
          'Facilities', 'Maintenance', 'Office Equipment'
        ];
      }
      throw error;
    }
  }

  // Mock data for email configuration
  private getMockEmailConfiguration(): EmailConfiguration {
    return {
      enableGraphApi: true,
      processedFolder: 'Processed',
      errorFolder: 'EmailErrors',
      maxEmailsPerBatch: 10,
      processingIntervalMinutes: 5,
      defaultFromEmail: 'ithelpdesk@babajishivram.com',
      defaultFromName: 'IT Helpdesk',
      emailAccounts: this.getMockEmailAccounts(),
      autoAssignmentRules: {
        enableCategoryMapping: true,
        enableKeywordDetection: true,
        enablePriorityDetection: true,
        urgentKeywords: ['urgent', 'critical', 'emergency', 'asap', 'down', 'broken'],
        highKeywords: ['important', 'priority', 'issue', 'problem', 'error'],
        defaultPriority: 2,
        defaultCategory: 'General'
      },
      notificationSettings: {
        enableStatusNotifications: true,
        enableAutoReply: true,
        enableReopenOption: true,
        reopenWindowHours: 72,
        autoReplyTemplate: 'Thank you for contacting us. Your ticket #{TicketNumber} has been created and will be reviewed shortly.',
        sendToRequesterOnly: true,
        includeTicketHistory: false
      }
    };
  }

  private getMockEmailAccounts(): EmailAccount[] {
    return [
      {
        id: 'default-helpdesk',
        email: 'ithelpdesk@babajishivram.com',
        displayName: 'IT Helpdesk',
        isActive: true,
        isDefault: true,
        categories: ['General', 'IT Support', 'Hardware', 'Software'],
        clientId: '35426f76-0667-4347-a8fd-f961ce997bd3',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        clientSecret: '***CONFIGURED***',
        department: 'IT'
      },
      {
        id: 'hr-support',
        email: 'hr@babajishivram.com',
        displayName: 'HR Support',
        isActive: false,
        isDefault: false,
        categories: ['HR', 'Payroll', 'Leave Management', 'Employee Relations'],
        clientId: '',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        clientSecret: '',
        department: 'HR'
      },
      {
        id: 'finance-support',
        email: 'finance@babajishivram.com',
        displayName: 'Finance Support',
        isActive: false,
        isDefault: false,
        categories: ['Finance', 'Accounting', 'Budget', 'Expenses'],
        clientId: '',
        tenantId: '309806d5-10e6-4203-836f-3d6ae8fecf6a',
        clientSecret: '',
        department: 'Finance'
      }
    ];
  }

  // Custom Fields Methods
  async getCustomFields(categoryId?: number, subCategoryId?: number, includeInactive: boolean = false): Promise<CustomField[]> {
    try {
      let url = `${this.baseUrl}/tickets/settings/custom-fields`;
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (subCategoryId) params.append('subCategoryId', subCategoryId.toString());
      if (includeInactive) params.append('includeInactive', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, { headers: this.getAuthHeaders() });
      return await this.handleResponse<CustomField[]>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock custom fields');
        return this.getMockCustomFields(categoryId, subCategoryId);
      }
      throw error;
    }
  }

  async getCustomField(id: number): Promise<CustomField> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/custom-fields/${id}`, {
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse<CustomField>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Using mock custom field');
        const fields = this.getMockCustomFields();
        const field = fields.find(f => f.id === id);
        if (!field) throw new Error('Custom field not found');
        return field;
      }
      throw error;
    }
  }

  async createCustomField(customField: Omit<CustomField, 'id'>): Promise<CustomField> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/custom-fields`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(customField)
      });
      return await this.handleResponse<CustomField>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock create custom field');
        return {
          id: Math.floor(Math.random() * 1000) + 100,
          ...customField
        };
      }
      throw error;
    }
  }

  async updateCustomField(id: number, customField: Partial<CustomField>): Promise<CustomField> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/custom-fields/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(customField)
      });
      return await this.handleResponse<CustomField>(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock update custom field');
        const fields = this.getMockCustomFields();
        const field = fields.find(f => f.id === id);
        if (!field) throw new Error('Custom field not found');
        return { ...field, ...customField, id };
      }
      throw error;
    }
  }

  async deleteCustomField(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/settings/custom-fields/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      await this.handleResponse(response);
    } catch (error) {
      if (this.useMocks) {
        console.warn('[mocks] Mock delete custom field');
        return;
      }
      throw error;
    }
  }

  private getMockCustomFields(categoryId?: number, subCategoryId?: number): CustomField[] {
    const allFields: CustomField[] = [
      // Hardware Category (categoryId: 2) - Asset Tag field for all hardware subcategories
      {
        id: 1,
        name: 'hardware_asset_tag',
        label: 'Hardware Asset Tag',
        type: 'text',
        categoryId: 2, // Hardware category
        subCategoryId: undefined, // All hardware subcategories
        options: undefined,
        placeholder: 'Enter asset tag (e.g., HW-001)',
        isRequired: true,
        isActive: true,
        displayOrder: 1,
        validationRules: {
          pattern: '^HW-\\d{3}$'
        },
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Hardware - Laptop specific field
      {
        id: 2,
        name: 'laptop_serial_number',
        label: 'Laptop Serial Number',
        type: 'text',
        categoryId: 2, // Hardware category
        subCategoryId: 4, // Laptop subcategory
        options: undefined,
        placeholder: 'Enter laptop serial number',
        isRequired: false,
        isActive: true,
        displayOrder: 2,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Hardware - Desktop specific field
      {
        id: 3,
        name: 'desktop_location',
        label: 'Desktop Location',
        type: 'select',
        categoryId: 2, // Hardware category
        subCategoryId: 5, // Desktop subcategory
        options: ['Floor 1', 'Floor 2', 'Floor 3', 'Server Room'],
        placeholder: undefined,
        isRequired: false,
        isActive: true,
        displayOrder: 1,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Hardware - Printer specific field
      {
        id: 8,
        name: 'printer_model',
        label: 'Printer Model',
        type: 'select',
        categoryId: 2, // Hardware category
        subCategoryId: 6, // Printer subcategory
        options: ['HP LaserJet', 'Canon Pixma', 'Epson WorkForce', 'Brother MFC'],
        placeholder: undefined,
        isRequired: false,
        isActive: true,
        displayOrder: 1,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Hardware - Network Equipment specific field
      {
        id: 9,
        name: 'network_device_type',
        label: 'Network Device Type',
        type: 'select',
        categoryId: 2, // Hardware category
        subCategoryId: 7, // Network Equipment subcategory
        options: ['Router', 'Switch', 'Access Point', 'Firewall', 'Modem'],
        placeholder: undefined,
        isRequired: false,
        isActive: true,
        displayOrder: 1,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Software Category (categoryId: 1) - License Key field
      {
        id: 4,
        name: 'software_license_key',
        label: 'Software License Key',
        type: 'text',
        categoryId: 1, // Software category
        subCategoryId: undefined, // All software subcategories
        options: undefined,
        placeholder: 'Enter software license key',
        isRequired: false,
        isActive: true,
        displayOrder: 1,
        validationRules: {
          min: 10,
          max: 50
        },
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Software - ERP System specific field
      {
        id: 5,
        name: 'erp_module_name',
        label: 'ERP Module',
        type: 'select',
        categoryId: 1, // Software category
        subCategoryId: 3, // ERP System subcategory
        options: ['Finance', 'HR', 'Inventory', 'Sales', 'Procurement'],
        placeholder: undefined,
        isRequired: false,
        isActive: true,
        displayOrder: 2,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      // Global fields that apply to all categories
      {
        id: 6,
        name: 'urgency_level',
        label: 'Business Impact',
        type: 'select',
        categoryId: undefined, // Global field
        subCategoryId: undefined,
        options: ['Low', 'Medium', 'High', 'Critical'],
        placeholder: undefined,
        isRequired: true,
        isActive: true,
        displayOrder: 1,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      },
      {
        id: 7,
        name: 'preferred_contact',
        label: 'Preferred Contact Method',
        type: 'select',
        categoryId: undefined, // Global field
        subCategoryId: undefined,
        options: ['Email', 'Phone', 'Teams', 'In Person'],
        placeholder: undefined,
        isRequired: false,
        isActive: true,
        displayOrder: 2,
        validationRules: undefined,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z'
      }
    ];

    console.log('🔍 CustomFields Filter Debug:', {
      requestedCategoryId: categoryId,
      requestedSubCategoryId: subCategoryId,
      totalFields: allFields.length,
      allFields: allFields.map(f => ({ id: f.id, label: f.label, categoryId: f.categoryId, subCategoryId: f.subCategoryId }))
    });

    // Filter by category and subcategory if specified
    const filteredFields = allFields.filter(field => {
      // If field has no category (global field), always include it
      if (field.categoryId === undefined || field.categoryId === null) {
        return field.isActive;
      }
      
      // If categoryId is specified and doesn't match, exclude
      if (categoryId && field.categoryId !== categoryId) {
        return false;
      }
      
      // If field has no subcategory, include for any subcategory within the category
      if (field.subCategoryId === undefined || field.subCategoryId === null) {
        return field.isActive;
      }
      
      // If subCategoryId is specified and doesn't match, exclude
      if (subCategoryId && field.subCategoryId !== subCategoryId) {
        return false;
      }
      
      return field.isActive;
    });

    console.log('✅ Filtered Custom Fields:', {
      filteredCount: filteredFields.length,
      filteredFields: filteredFields.map(f => ({ id: f.id, label: f.label, categoryId: f.categoryId, subCategoryId: f.subCategoryId }))
    });

    return filteredFields;
  }
}

export const settingsApi = new SettingsApiService();
