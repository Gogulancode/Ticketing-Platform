// Auto Assignment API service
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5015/api';
const API_ENDPOINT = API_BASE;

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
  
  const url = path.startsWith('http') ? path : `${API_ENDPOINT}${path}`;
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export interface EmailTicketRequest {
  subject: string;
  content: string;
  fromEmail: string;
  priority?: string;
  receivedAt?: string;
}

export interface AutoAssignmentResult {
  success: boolean;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignmentReason?: string;
  confidence?: number;
  appliedRules?: string[];
  error?: string;
}

export interface AssignmentRecommendation {
  agentId: string;
  agentName: string;
  confidence: number;
  reasoning: string;
  currentWorkload: number;
  skills: string[];
}

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  currentTickets: number;
  maxCapacity: number;
  utilization: number;
  availabilityStatus: string;
  department: string;
}

export interface KeywordTestResult {
  keyword: string;
  category: string;
  subcategoryId?: number;
  confidence: number;
  matches: number;
  matchedKeywords?: string[];
}

export interface CategoryDeterminationRequest {
  subject: string;
  content: string;
}

export interface CategoryDeterminationResult {
  subcategoryId: number;
  categoryName: string;
  confidence: number;
  matchedKeywords: string[];
}

export interface SubcategoryKeyword {
  id?: number;
  subcategoryId: number;
  keyword: string;
  weight: number;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class AutoAssignmentApiService {
  private static instance: AutoAssignmentApiService;
  
  public static getInstance(): AutoAssignmentApiService {
    if (!AutoAssignmentApiService.instance) {
      AutoAssignmentApiService.instance = new AutoAssignmentApiService();
    }
    return AutoAssignmentApiService.instance;
  }

  /**
   * Auto-assign a ticket using standard rules
   */
  async autoAssignTicket(ticketId: string): Promise<AutoAssignmentResult> {
    try {
      const response = await apiFetch(
        `/tickets/auto-assignment/assign/${ticketId}`,
        { method: 'POST' }
      );
      return typeof response === 'string' ? { success: true, assignmentReason: response } : response;
    } catch (error: any) {
      console.error('Auto assignment failed:', error);
      return {
        success: false,
        error: error.message || 'Auto assignment failed'
      };
    }
  }

  /**
   * Auto-assign a ticket based on email content analysis
   */
  async autoAssignFromEmail(emailData: EmailTicketRequest): Promise<AutoAssignmentResult> {
    try {
      const response = await apiFetch(
        '/tickets/auto-assignment/assign-from-email',
        {
          method: 'POST',
          body: JSON.stringify(emailData)
        }
      );
      return typeof response === 'string' ? { success: true, assignmentReason: response } : response;
    } catch (error: any) {
      console.error('Email auto assignment failed:', error);
      return {
        success: false,
        error: error.message || 'Email auto assignment failed'
      };
    }
  }

  /**
   * Get assignment recommendations for a ticket
   */
  async getRecommendations(ticketId: string): Promise<AssignmentRecommendation[]> {
    try {
      const response = await apiFetch(
        `/tickets/auto-assignment/recommendations/${ticketId}`
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get current agent workloads
   */
  async getAgentWorkloads(): Promise<AgentWorkload[]> {
    try {
      const response = await apiFetch(
        '/tickets/auto-assignment/workloads'
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to get agent workloads:', error);
      return [];
    }
  }

  /**
   * Test keywords for category determination
   */
  async testKeywords(keywords: string[]): Promise<KeywordTestResult[]> {
    try {
      const results: KeywordTestResult[] = [];
      
      // Test each keyword individually using our flexible system
      for (const keyword of keywords) {
        const response = await apiFetch(
          '/autoassignment/determine-category',
          {
            method: 'POST',
            body: JSON.stringify({
              subject: keyword,
              content: `Testing keyword: ${keyword}`
            })
          }
        );
        
        if (response && response.subcategoryId) {
          results.push({
            keyword: keyword,
            category: response.categoryName || 'Unknown',
            subcategoryId: response.subcategoryId,
            confidence: response.confidence || 0,
            matches: response.matchedKeywords ? response.matchedKeywords.length : 0,
            matchedKeywords: response.matchedKeywords || []
          });
        } else {
          results.push({
            keyword: keyword,
            category: 'No Match',
            confidence: 0,
            matches: 0,
            matchedKeywords: []
          });
        }
      }
      
      return results;
    } catch (error: any) {
      console.error('Failed to test keywords:', error);
      return [];
    }
  }

  /**
   * Determine category for email content using flexible keyword system
   */
  async determineCategoryFromContent(request: CategoryDeterminationRequest): Promise<CategoryDeterminationResult | null> {
    try {
      const response = await apiFetch(
        '/autoassignment/determine-category',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );
      return response;
    } catch (error: any) {
      console.error('Failed to determine category:', error);
      return null;
    }
  }

  /**
   * Get all keywords for a specific subcategory
   */
  async getSubcategoryKeywords(subcategoryId: number): Promise<SubcategoryKeyword[]> {
    try {
      const response = await apiFetch(`/autoassignment/subcategory-keywords/${subcategoryId}`);
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to get subcategory keywords:', error);
      return [];
    }
  }

  /**
   * Add a new keyword to a subcategory
   */
  async addSubcategoryKeyword(keyword: Omit<SubcategoryKeyword, 'id'>): Promise<SubcategoryKeyword | null> {
    try {
      const response = await apiFetch('/autoassignment/subcategory-keywords', {
        method: 'POST',
        body: JSON.stringify(keyword)
      });
      return response;
    } catch (error: any) {
      console.error('Failed to add keyword:', error);
      return null;
    }
  }

  /**
   * Update an existing keyword
   */
  async updateSubcategoryKeyword(id: number, keyword: Partial<SubcategoryKeyword>): Promise<SubcategoryKeyword | null> {
    try {
      const response = await apiFetch(`/autoassignment/subcategory-keywords/${id}`, {
        method: 'PUT',
        body: JSON.stringify(keyword)
      });
      return response;
    } catch (error: any) {
      console.error('Failed to update keyword:', error);
      return null;
    }
  }

  /**
   * Delete a keyword
   */
  async deleteSubcategoryKeyword(id: number): Promise<boolean> {
    try {
      await apiFetch(`/autoassignment/subcategory-keywords/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error: any) {
      console.error('Failed to delete keyword:', error);
      return false;
    }
  }
}

// Export singleton instance
export const autoAssignmentApi = AutoAssignmentApiService.getInstance();