// Auto Assignment API service
import { API_CONFIG } from '../../../config/api';
const API_BASE = API_CONFIG.BASE_URL;
const API_ENDPOINT = API_BASE;

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => headers.set(key, value));
  }
  
  const url = path.startsWith('http') ? path : `${API_ENDPOINT}${path}`;
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'toString' in error) {
    return String(error);
  }
  return 'Unknown error';
};

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
      const response = await apiFetch<AutoAssignmentResult | string>(
        `/tickets/auto-assignment/assign/${ticketId}`,
        { method: 'POST' }
      );
      return typeof response === 'string' ? { success: true, assignmentReason: response } : response;
    } catch (error: unknown) {
      console.error('Auto assignment failed:', error);
      return {
        success: false,
        error: getErrorMessage(error) || 'Auto assignment failed'
      };
    }
  }

  /**
   * Auto-assign a ticket based on email content analysis
   */
  async autoAssignFromEmail(emailData: EmailTicketRequest): Promise<AutoAssignmentResult> {
    try {
      const response = await apiFetch<AutoAssignmentResult | string>(
        '/tickets/auto-assignment/assign-from-email',
        {
          method: 'POST',
          body: JSON.stringify(emailData)
        }
      );
      return typeof response === 'string' ? { success: true, assignmentReason: response } : response;
    } catch (error: unknown) {
      console.error('Email auto assignment failed:', error);
      return {
        success: false,
        error: getErrorMessage(error) || 'Email auto assignment failed'
      };
    }
  }

  /**
   * Get assignment recommendations for a ticket
   */
  async getRecommendations(ticketId: string): Promise<AssignmentRecommendation[]> {
    try {
      const response = await apiFetch<AssignmentRecommendation[] | AssignmentRecommendation>(
        `/tickets/auto-assignment/recommendations/${ticketId}`
      );
      return Array.isArray(response) ? response : [];
    } catch (error: unknown) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get current agent workloads
   */
  async getAgentWorkloads(): Promise<AgentWorkload[]> {
    try {
      const response = await apiFetch<AgentWorkload[] | AgentWorkload>(
        '/tickets/auto-assignment/workloads'
      );
      return Array.isArray(response) ? response : [];
    } catch (error: unknown) {
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
        const response = await apiFetch<CategoryDeterminationResult | null>(
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
    } catch (error: unknown) {
      console.error('Failed to test keywords:', error);
      return [];
    }
  }

  /**
   * Determine category for email content using flexible keyword system
   */
  async determineCategoryFromContent(request: CategoryDeterminationRequest): Promise<CategoryDeterminationResult | null> {
    try {
      const response = await apiFetch<CategoryDeterminationResult | null>(
        '/autoassignment/determine-category',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );
      return response;
    } catch (error: unknown) {
      console.error('Failed to determine category:', error);
      return null;
    }
  }

  /**
   * Get all keywords for a specific subcategory
   */
  async getSubcategoryKeywords(subcategoryId: number): Promise<SubcategoryKeyword[]> {
    try {
      const response = await apiFetch<SubcategoryKeyword[] | SubcategoryKeyword>(`/autoassignment/subcategory-keywords/${subcategoryId}`);
      return Array.isArray(response) ? response : [];
    } catch (error: unknown) {
      console.error('Failed to get subcategory keywords:', error);
      return [];
    }
  }

  /**
   * Add a new keyword to a subcategory
   */
  async addSubcategoryKeyword(keyword: Omit<SubcategoryKeyword, 'id'>): Promise<SubcategoryKeyword | null> {
    try {
      const response = await apiFetch<SubcategoryKeyword>('/autoassignment/subcategory-keywords', {
        method: 'POST',
        body: JSON.stringify(keyword)
      });
      return response;
    } catch (error: unknown) {
      console.error('Failed to add keyword:', error);
      return null;
    }
  }

  /**
   * Update an existing keyword
   */
  async updateSubcategoryKeyword(id: number, keyword: Partial<SubcategoryKeyword>): Promise<SubcategoryKeyword | null> {
    try {
      const response = await apiFetch<SubcategoryKeyword>(`/autoassignment/subcategory-keywords/${id}`, {
        method: 'PUT',
        body: JSON.stringify(keyword)
      });
      return response;
    } catch (error: unknown) {
      console.error('Failed to update keyword:', error);
      return null;
    }
  }

  /**
   * Delete a keyword
   */
  async deleteSubcategoryKeyword(id: number): Promise<boolean> {
    try {
      await apiFetch<void>(`/autoassignment/subcategory-keywords/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error: unknown) {
      console.error('Failed to delete keyword:', error);
      return false;
    }
  }
}

// Export singleton instance
export const autoAssignmentApi = AutoAssignmentApiService.getInstance();