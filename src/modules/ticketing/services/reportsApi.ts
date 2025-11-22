// Reports API Service for Ticketing System

export interface ResolutionResponseReport {
  ticketId: string;
  publicId: number | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
  assignedAgent?: string;
  department?: string;
}

export interface AgentPerformanceReport {
  agentId: string;
  agentName: string;
  email: string;
  department: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number; // in hours
  avgResolutionTime: number; // in hours
  resolutionRate: number; // percentage
  satisfactionRating?: number;
}

export interface UnresolvedTicket {
  ticketId: string;
  publicId: number | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedAgent?: string;
  department?: string;
  daysSinceCreation: number;
  lastUpdated: string;
}

export interface TicketSummary {
  ticketId: string;
  publicId: number | null;
  title: string;
  category: string;
  subcategory?: string;
  priority: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  assignedAgent?: string;
  department?: string;
  createdBy: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  priority?: string;
  status?: string;
  agent?: string;
  department?: string;
  searchTerm?: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts?: boolean;
}

export type ReportStatistics = Record<string, unknown>;

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/reports`;

export const reportsApi = {
  // Resolution & Response Time Report
  async getResolutionResponseReport(filters?: ReportFilters): Promise<ResolutionResponseReport[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.agent) params.append('agent', filters.agent);
    if (filters?.department) params.append('department', filters.department);
    
    const response = await fetch(`${API_BASE}/resolution-response?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get resolution response report: ${response.statusText}`);
    }
    return response.json();
  },

  // Agent Performance Report
  async getAgentPerformanceReport(filters?: ReportFilters): Promise<AgentPerformanceReport[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.department) params.append('department', filters.department);
    
    const response = await fetch(`${API_BASE}/agent-performance?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get agent performance report: ${response.statusText}`);
    }
    return response.json();
  },

  // Unresolved Tickets Report
  async getUnresolvedTicketsReport(filters?: ReportFilters): Promise<UnresolvedTicket[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.agent) params.append('agent', filters.agent);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    
    const response = await fetch(`${API_BASE}/unresolved?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get unresolved tickets report: ${response.statusText}`);
    }
    return response.json();
  },

  // All Tickets Report
  async getAllTicketsReport(filters?: ReportFilters): Promise<TicketSummary[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.agent) params.append('agent', filters.agent);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    
    const response = await fetch(`${API_BASE}/all-tickets?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get all tickets report: ${response.statusText}`);
    }
    return response.json();
  },

  // Export Report
  async exportReport(reportType: string, filters?: ReportFilters, options?: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('reportType', reportType);
    params.append('format', options?.format || 'csv');
    
    if (options?.includeCharts) params.append('includeCharts', 'true');
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.agent) params.append('agent', filters.agent);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    
    const response = await fetch(`${API_BASE}/export?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }
    return response.blob();
  },

  // Get Report Statistics
  async getReportStatistics(filters?: ReportFilters): Promise<ReportStatistics> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.department) params.append('department', filters.department);
    
    const response = await fetch(`${API_BASE}/statistics?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get report statistics: ${response.statusText}`);
    }
    const stats = (await response.json()) as ReportStatistics;
    return stats;
  }
};

// Utility functions for reports
export const reportUtils = {
  formatTime: (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round(hours / 24 * 10) / 10}d`;
  },

  calculateSLA: (responseTime: number, resolutionTime: number, priority: string): string => {
    const slaThresholds = {
      'Critical': { response: 1, resolution: 4 }, // 1h response, 4h resolution
      'High': { response: 2, resolution: 8 },     // 2h response, 8h resolution
      'Medium': { response: 4, resolution: 24 },  // 4h response, 24h resolution
      'Low': { response: 8, resolution: 72 }      // 8h response, 72h resolution
    };

    const threshold = slaThresholds[priority as keyof typeof slaThresholds];
    if (!threshold) return 'Unknown';

    const responseWithinSLA = responseTime <= threshold.response;
    const resolutionWithinSLA = resolutionTime <= threshold.resolution;

    if (responseWithinSLA && resolutionWithinSLA) return 'Met';
    if (responseWithinSLA && !resolutionWithinSLA) return 'Response Met';
    if (!responseWithinSLA && resolutionWithinSLA) return 'Resolution Met';
    return 'Breached';
  },

  downloadFile: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getPriorityColor: (priority: string): string => {
    const colors = {
      'Critical': 'text-red-600 bg-red-50',
      'High': 'text-orange-600 bg-orange-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-green-600 bg-green-50'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  },

  getStatusColor: (status: string): string => {
    const colors = {
      'New': 'text-blue-600 bg-blue-50',
      'Open': 'text-blue-600 bg-blue-50',
      'In Progress': 'text-purple-600 bg-purple-50',
      'In Review': 'text-purple-600 bg-purple-50',
      'Waiting for User': 'text-amber-600 bg-amber-50',
      'Resolved': 'text-green-600 bg-green-50',
      'Closed': 'text-gray-600 bg-gray-50',
      'Merged': 'text-indigo-600 bg-indigo-50',
      'Deleted': 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  }
};