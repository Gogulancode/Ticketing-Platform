// Analytics API for Dashboard
export interface WeeklyIssueTypeCount {
  issueType: string;
  count: number;
  department: string;
}

export interface WeeklyDepartmentCount {
  department: string;
  count: number;
  percentage: number;
}

export interface AgentTicketStats {
  agentId: string;
  agentName: string;
  email: string;
  ticketsReceived: number;
  averageResolutionTime: number; // in hours
  department: string;
}

export interface SubcategoryTicketCount {
  subcategoryId: number;
  subcategoryName: string;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface DashboardAnalytics {
  weeklyIssueTypes: WeeklyIssueTypeCount[];
  weeklyDepartments: WeeklyDepartmentCount[];
  agentStats: AgentTicketStats[];
  subcategoryCounts: SubcategoryTicketCount[];
  totalTickets: number;
  averageResolutionTime: number;
}

const API_BASE = 'http://localhost:5015/api';

export const analyticsApi = {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const response = await fetch(`${API_BASE}/analytics/dashboard`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard analytics');
    }
    return response.json();
  },

  async getWeeklyIssueTypeCounts(): Promise<WeeklyIssueTypeCount[]> {
    const response = await fetch(`${API_BASE}/analytics/weekly-issue-types`);
    if (!response.ok) {
      throw new Error('Failed to fetch weekly issue type counts');
    }
    return response.json();
  },

  async getWeeklyDepartmentCounts(): Promise<WeeklyDepartmentCount[]> {
    const response = await fetch(`${API_BASE}/analytics/weekly-departments`);
    if (!response.ok) {
      throw new Error('Failed to fetch weekly department counts');
    }
    return response.json();
  },

  async getAgentTicketStats(): Promise<AgentTicketStats[]> {
    const response = await fetch(`${API_BASE}/analytics/agent-stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch agent ticket stats');
    }
    return response.json();
  },

  async getSubcategoryTicketCounts(): Promise<SubcategoryTicketCount[]> {
    const response = await fetch(`${API_BASE}/analytics/subcategory-counts`);
    if (!response.ok) {
      throw new Error('Failed to fetch subcategory ticket counts');
    }
    return response.json();
  }
};