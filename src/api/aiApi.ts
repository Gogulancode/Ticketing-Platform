import { API_CONFIG } from '../config/api';

// Helper function for API calls with auth
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

// Types
export interface AIStatusResponse {
  enabled: boolean;
  connected: boolean;
  provider: string;
  model: string;
  errorMessage?: string;
}

export interface CategorizationRequest {
  subject: string;
  description: string;
  availableCategories: string[];
  availablePriorities?: string[];
}

export interface CategorizationResponse {
  success: boolean;
  suggestedCategory?: string;
  suggestedPriority?: string;
  confidence: number;
  reasoning?: string;
  errorMessage?: string;
}

export interface TicketCommentSummary {
  author: string;
  isInternal: boolean;
  content: string;
  createdAt: string;
}

export interface ResponseSuggestionRequest {
  ticketSubject: string;
  ticketDescription: string;
  category?: string;
  priority?: string;
  recentComments?: TicketCommentSummary[];
  customerName?: string;
  suggestionCount?: number;
  tone?: 'professional' | 'friendly' | 'formal';
}

export interface SuggestedResponse {
  title: string;
  content: string;
  tone: string;
}

export interface ResponseSuggestionResponse {
  success: boolean;
  suggestions: SuggestedResponse[];
  errorMessage?: string;
}

export interface SummarizationRequest {
  ticketSubject: string;
  ticketDescription: string;
  category?: string;
  status?: string;
  comments?: TicketCommentSummary[];
  summaryType?: 'brief' | 'detailed' | 'action-items';
}

export interface SummarizationResponse {
  success: boolean;
  summary?: string;
  keyPoints: string[];
  actionItems: string[];
  customerSentiment?: string;
  errorMessage?: string;
}

export interface QuickCategorizeRequest {
  subject?: string;
  description?: string;
  categories?: string[];
}

// Dashboard Insights Types
export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
  avgResolutionHours: number;
}

export interface AgentPerformanceData {
  agentName: string;
  ticketsResolved: number;
  avgResolutionHours: number;
  satisfactionScore?: number;
}

export interface DashboardInsightsRequest {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  avgResolutionHours: number;
  categoryBreakdown: CategoryBreakdown[];
  departmentBreakdown: DepartmentBreakdown[];
  topAgents: AgentPerformanceData[];
  period?: 'week' | 'month' | 'quarter';
}

export interface DashboardInsightsResponse {
  success: boolean;
  summary?: string;
  keyInsights: string[];
  recommendations: string[];
  trends: string[];
  alerts: string[];
  errorMessage?: string;
}

export interface AIReportRequest {
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'branch' | 'agent-performance' | 'sla' | 'category' | 'executive';
  startDate: string;
  endDate: string;
  department?: string;
  branchId?: number;
  includeAgentAnalysis?: boolean;
  includeTrends?: boolean;
  includeRecommendations?: boolean;
  includeBranchComparison?: boolean;
  includeSlaAnalysis?: boolean;
  analyticsData?: ReportAnalyticsData;
}

export interface ReportAnalyticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  overdueTickets: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  totalAgents: number;
  branchBreakdown: BranchReportData[];
  categoryBreakdown: CategoryBreakdown[];
  agentPerformance: AgentPerformanceData[];
}

export interface BranchReportData {
  branchId: number;
  branchName: string;
  branchCode: string;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  overdueTickets: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  agentCount: number;
  ticketsPerAgent: number;
}

export interface ReportSection {
  title: string;
  content: string;
  highlights: string[];
}

export interface AIReportResponse {
  success: boolean;
  reportTitle?: string;
  executiveSummary?: string;
  sections: ReportSection[];
  keyMetrics: string[];
  recommendations: string[];
  conclusion?: string;
  generatedAt?: string;
  errorMessage?: string;
  branchData?: BranchReportData[];
}

export interface BranchOption {
  id: number;
  name: string;
  code: string;
}

export interface ReportTypeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// API Functions
export const getAIStatus = async (): Promise<AIStatusResponse> => {
  const response = await fetchWithAuth('/ai/status');
  return response.json();
};

export const categorizeTicket = async (request: CategorizationRequest): Promise<CategorizationResponse> => {
  const response = await fetchWithAuth('/ai/categorize', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const quickCategorize = async (request: QuickCategorizeRequest): Promise<CategorizationResponse> => {
  const response = await fetchWithAuth('/ai/quick-categorize', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const suggestResponses = async (request: ResponseSuggestionRequest): Promise<ResponseSuggestionResponse> => {
  const response = await fetchWithAuth('/ai/suggest-responses', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const summarizeTicket = async (request: SummarizationRequest): Promise<SummarizationResponse> => {
  const response = await fetchWithAuth('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const generateDashboardInsights = async (request: DashboardInsightsRequest): Promise<DashboardInsightsResponse> => {
  const response = await fetchWithAuth('/ai/dashboard-insights', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const generateAIReport = async (request: AIReportRequest): Promise<AIReportResponse> => {
  const response = await fetchWithAuth('/ai/generate-report', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export const getBranches = async (): Promise<BranchOption[]> => {
  const response = await fetchWithAuth('/ai/branches');
  return response.json();
};

export const getReportTypes = async (): Promise<ReportTypeOption[]> => {
  const response = await fetchWithAuth('/ai/report-types');
  return response.json();
};

export const getBranchAnalytics = async (startDate?: string, endDate?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetchWithAuth(`/ai/branch-analytics${queryString}`);
  return response.json();
};

// Enhance text request/response types
export interface EnhanceTextRequest {
  text: string;
  context?: 'ticket description' | 'reply' | 'title';
  tone?: 'professional' | 'formal' | 'friendly' | 'concise';
  fixGrammar?: boolean;
  improveClarity?: boolean;
  makeMoreConcise?: boolean;
}

export interface EnhanceTextResponse {
  success: boolean;
  enhancedText?: string;
  improvements: string[];
  errorMessage?: string;
}

/**
 * Enhance/improve text using AI (grammar, clarity, professionalism)
 */
export const enhanceText = async (request: EnhanceTextRequest): Promise<EnhanceTextResponse> => {
  const response = await fetchWithAuth('/ai/enhance-text', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.json();
};

export default {
  getAIStatus,
  categorizeTicket,
  quickCategorize,
  suggestResponses,
  summarizeTicket,
  generateDashboardInsights,
  generateAIReport,
  getBranches,
  getReportTypes,
  getBranchAnalytics,
  enhanceText
};
