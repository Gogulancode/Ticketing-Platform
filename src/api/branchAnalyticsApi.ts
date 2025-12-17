import { API_CONFIG } from '../config/api';

// Types for Branch Analytics
export interface BranchAnalytics {
  branchId: number;
  branchName: string;
  branchCode: string;
  isHeadquarters: boolean;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  pendingTickets: number;
  overdueTickets: number;
  totalAgents: number;
  activeAgents: number;
  avgTicketsPerAgent: number;
  avgResolutionTimeHours: number;
  avgFirstResponseTimeHours: number;
  slaComplianceRate: number;
  customerSatisfactionScore: number;
  ticketsCreatedLast30Days: number;
  ticketsResolvedLast30Days: number;
  resolutionRate: number;
}

export interface OverallAnalytics {
  totalBranches: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  overdueTickets: number;
  totalAgents: number;
  avgResolutionTimeHours: number;
  overallSlaComplianceRate: number;
  branchBreakdown: BranchAnalytics[];
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface BranchTicketTrend {
  branchId: number;
  branchName: string;
  created: TimeSeriesDataPoint[];
  resolved: TimeSeriesDataPoint[];
  open: TimeSeriesDataPoint[];
}

export interface CategoryDistribution {
  categoryName: string;
  count: number;
  percentage: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  email: string;
  branchId: number;
  branchName: string;
  assignedTickets: number;
  resolvedTickets: number;
  openTickets: number;
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
  customerSatisfactionScore: number;
}

export interface BranchSlaPerformance {
  branchId: number;
  branchName: string;
  totalTicketsWithSla: number;
  ticketsMeetingSla: number;
  ticketsBreachingSla: number;
  complianceRate: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
}

export interface BranchMetricValue {
  branchId: number;
  branchName: string;
  value: number;
}

export interface BranchMetricComparison {
  metricName: string;
  values: BranchMetricValue[];
}

export interface BranchComparison {
  metrics: BranchMetricComparison[];
}

// Helper function for API requests
async function apiRequest<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_CONFIG.baseUrl}/api/analytics/branches${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Build query string from params
function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const validParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  return validParams.length > 0 ? `?${validParams.join('&')}` : '';
}

// API Functions
export const branchAnalyticsApi = {
  /**
   * Get overall analytics across all branches
   */
  getOverallAnalytics: async (
    startDate?: Date,
    endDate?: Date
  ): Promise<OverallAnalytics> => {
    const query = buildQuery({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<OverallAnalytics>(`/overall${query}`);
  },

  /**
   * Get analytics for a specific branch
   */
  getBranchAnalytics: async (
    branchId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<BranchAnalytics> => {
    const query = buildQuery({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<BranchAnalytics>(`/${branchId}${query}`);
  },

  /**
   * Get ticket trends over time
   */
  getTicketTrends: async (
    branchId?: number,
    days: number = 30
  ): Promise<BranchTicketTrend[]> => {
    const query = buildQuery({ branchId, days });
    return apiRequest<BranchTicketTrend[]>(`/trends${query}`);
  },

  /**
   * Get category distribution
   */
  getCategoryDistribution: async (
    branchId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<CategoryDistribution[]> => {
    const query = buildQuery({
      branchId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<CategoryDistribution[]>(`/categories${query}`);
  },

  /**
   * Get priority distribution
   */
  getPriorityDistribution: async (
    branchId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<PriorityDistribution[]> => {
    const query = buildQuery({
      branchId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<PriorityDistribution[]>(`/priorities${query}`);
  },

  /**
   * Get agent performance metrics
   */
  getAgentPerformance: async (
    branchId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentPerformance[]> => {
    const query = buildQuery({
      branchId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<AgentPerformance[]>(`/agents${query}`);
  },

  /**
   * Get SLA performance by branch
   */
  getSlaPerformance: async (
    startDate?: Date,
    endDate?: Date
  ): Promise<BranchSlaPerformance[]> => {
    const query = buildQuery({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<BranchSlaPerformance[]>(`/sla${query}`);
  },

  /**
   * Get branch comparison metrics
   */
  getBranchComparison: async (
    startDate?: Date,
    endDate?: Date
  ): Promise<BranchComparison> => {
    const query = buildQuery({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    return apiRequest<BranchComparison>(`/comparison${query}`);
  },
};

export default branchAnalyticsApi;
