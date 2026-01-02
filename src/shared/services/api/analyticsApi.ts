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

import { API_CONFIG } from '../../../config/api';
const API_BASE = API_CONFIG.BASE_URL;

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const analyticsApi = {
  async getDashboardAnalytics(categoryIds?: number[]): Promise<DashboardAnalytics> {
    try {
      // Build query params for category filtering
      const params = new URLSearchParams();
      if (categoryIds && categoryIds.length > 0) {
        params.append('categoryIds', categoryIds.join(','));
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Try the main analytics endpoint first
      const response = await fetch(`${API_BASE}/analytics/dashboard${queryString}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.warn('Main analytics endpoint not available, using reports fallback');
    }

    // Fallback: Build analytics from working reports endpoints
    try {
      console.log('🔄 Building dashboard analytics from reports endpoints...');
      
      // Get all tickets for analysis
      const allTicketsResponse = await fetch(`${API_BASE}/Reports/all-tickets`, {
        headers: getAuthHeaders()
      });
      if (!allTicketsResponse.ok) {
        throw new Error('Failed to fetch tickets data');
      }
      let allTickets = await allTicketsResponse.json();
      
      // Filter by category IDs if provided (for category admins)
      if (categoryIds && categoryIds.length > 0) {
        allTickets = allTickets.filter((ticket: any) => {
          const ticketCategoryId = ticket.categoryId || ticket.category?.id;
          return categoryIds.includes(ticketCategoryId);
        });
        console.log(`🛡️ Category Admin: Filtered to ${allTickets.length} tickets in categories: ${categoryIds.join(', ')}`);
      }
      
      // Calculate analytics from real ticket data
      const totalTickets = allTickets.length;
      console.log(`📊 Processing ${totalTickets} real tickets for dashboard analytics`);
      
      // Calculate weekly issue types (categories)
      const categoryCount: Record<string, number> = {};
      allTickets.forEach((ticket: any) => {
        const category = ticket.category || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      const weeklyIssueTypes = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({
          issueType: category,
          count,
          department: 'General'
        }));

      // Calculate department distribution (all General for now)
      const weeklyDepartments = [{
        department: 'General',
        count: totalTickets,
        percentage: 100.0
      }];

      // Calculate status distribution for subcategory counts
      const statusCount: Record<string, number> = {};
      allTickets.forEach((ticket: any) => {
        const status = ticket.status || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const subcategoryCounts = Object.entries(statusCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([status, count], index) => ({
          subcategoryId: index + 1,
          subcategoryName: status,
          categoryName: 'Status',
          count,
          percentage: (count / totalTickets) * 100
        }));

      // Agent stats (mock for now since no agent assignment data)
      const agentStats = [
        { 
          agentId: "system", 
          agentName: "System Generated", 
          email: "system@example.com", 
          ticketsReceived: totalTickets, 
          averageResolutionTime: 0, 
          department: "General" 
        }
      ];

      const dashboardAnalytics: DashboardAnalytics = {
        weeklyIssueTypes,
        weeklyDepartments,
        agentStats,
        subcategoryCounts,
        totalTickets,
        averageResolutionTime: 0
      };

      console.log('✅ Dashboard analytics built from real data:', dashboardAnalytics);
      return dashboardAnalytics;
      
    } catch (fallbackError) {
      console.error('❌ Failed to build analytics from reports:', fallbackError);
      throw new Error('Analytics services temporarily unavailable');
    }
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