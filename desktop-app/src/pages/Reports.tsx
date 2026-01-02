import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BarChart3, Clock, Users, AlertTriangle, FileText, 
  Download, Calendar, Loader2, RefreshCw, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface ReportFilters {
  startDate: string;
  endDate: string;
  category?: string;
  priority?: string;
  status?: string;
  agent?: string;
  department?: string;
}

interface ResolutionReport {
  ticketId: string;
  publicId: number | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  responseTime?: number;
  resolutionTime?: number;
  assignedAgent?: string;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  email: string;
  department: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

interface UnresolvedTicket {
  ticketId: string;
  publicId: number | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedAgent?: string;
  daysSinceCreation: number;
}

interface AllTicket {
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
  createdBy: string;
}

type ReportTab = 'resolution' | 'performance' | 'unresolved' | 'allTickets';

const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatHours = (hours?: number) => {
  if (hours === undefined || hours === null) return '-';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
};

export default function Reports() {
  const navigate = useNavigate();
  const { serverUrl, token, user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<ReportTab>('resolution');
  const [filters, setFilters] = useState<ReportFilters>(getDefaultDateRange());
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Report data
  const [resolutionData, setResolutionData] = useState<ResolutionReport[]>([]);
  const [performanceData, setPerformanceData] = useState<AgentPerformance[]>([]);
  const [unresolvedData, setUnresolvedData] = useState<UnresolvedTicket[]>([]);
  const [allTicketsData, setAllTicketsData] = useState<AllTicket[]>([]);
  
  // Category admin state - to filter reports by assigned categories
  const [categoryAdminCategoryIds, setCategoryAdminCategoryIds] = useState<number[]>([]);
  const [isActualCategoryAdmin, setIsActualCategoryAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user has access (Admin, Agent, or Category Admin)
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = user?.role === 'Admin' || userRoles.includes('Admin');
  const isAgent = user?.role === 'Agent' || userRoles.includes('Agent');
  const isCategoryAdmin = user?.role === 'CategoryAdmin' || userRoles.includes('CategoryAdmin');
  const hasAccess = isAdmin || isAgent || isCategoryAdmin;

  const tabs = [
    { id: 'resolution' as const, name: 'Resolution & Response', icon: Clock },
    { id: 'performance' as const, name: 'Agent Performance', icon: Users },
    { id: 'unresolved' as const, name: 'Unresolved Tickets', icon: AlertTriangle },
    { id: 'allTickets' as const, name: 'All Tickets', icon: FileText },
  ];

  const buildQueryParams = (baseFilters: ReportFilters) => {
    const params = new URLSearchParams();
    if (baseFilters.startDate) params.append('startDate', baseFilters.startDate);
    if (baseFilters.endDate) params.append('endDate', baseFilters.endDate);
    
    // For category admins (non-admin), always filter by their assigned categories
    if (isActualCategoryAdmin && !isAdmin && categoryAdminCategoryIds.length > 0) {
      params.append('category', categoryAdminCategoryIds.join(','));
    } else if (baseFilters.category) {
      params.append('category', baseFilters.category);
    }
    
    if (baseFilters.priority) params.append('priority', baseFilters.priority);
    if (baseFilters.status) params.append('status', baseFilters.status);
    if (baseFilters.agent) params.append('agent', baseFilters.agent);
    if (baseFilters.department) params.append('department', baseFilters.department);
    return params.toString();
  };

  const loadReportData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;
    
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const queryString = buildQueryParams(filters);

      switch (activeTab) {
        case 'resolution': {
          const response = await fetch(`${serverUrl}/api/reports/resolution-response?${queryString}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setResolutionData(Array.isArray(data) ? data : []);
          }
          break;
        }
        case 'performance': {
          const response = await fetch(`${serverUrl}/api/reports/agent-performance?${queryString}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setPerformanceData(Array.isArray(data) ? data : []);
          }
          break;
        }
        case 'unresolved': {
          const response = await fetch(`${serverUrl}/api/reports/unresolved?${queryString}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setUnresolvedData(Array.isArray(data) ? data : []);
          }
          break;
        }
        case 'allTickets': {
          const response = await fetch(`${serverUrl}/api/reports/all-tickets?${queryString}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setAllTicketsData(Array.isArray(data) ? data : []);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filters, serverUrl, token, isActualCategoryAdmin, categoryAdminCategoryIds, isAdmin]);

  // Fetch category admin status on mount
  useEffect(() => {
    const checkCategoryAdminStatus = async () => {
      if (!user?.id || !token) {
        setIsInitialized(true);
        return;
      }
      
      try {
        const response = await fetch(`${serverUrl}/api/tickets/settings/category-admins/check/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsActualCategoryAdmin(data.isCategoryAdmin === true);
          setCategoryAdminCategoryIds(data.categoryIds || []);
        }
      } catch (error) {
        console.warn('Could not check category admin status:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkCategoryAdminStatus();
  }, [user?.id, serverUrl, token]);

  // Load report data after initialization
  useEffect(() => {
    if (hasAccess && isInitialized) {
      loadReportData();
    }
  }, [loadReportData, hasAccess, isInitialized]);

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('reportType', activeTab);
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // For category admins (non-admin), filter by their assigned categories
      if (isActualCategoryAdmin && !isAdmin && categoryAdminCategoryIds.length > 0) {
        params.append('category', categoryAdminCategoryIds.join(','));
      }

      const response = await fetch(`${serverUrl}/api/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-report.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Report exported successfully!');
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-4">Reports are only available for Admins and Agents.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Ticket Reports
              </h1>
              <p className="text-sm text-gray-500">Analyze ticket metrics and performance</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadReportData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="relative group">
              <button
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setFilters(getDefaultDateRange())}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 30);
              setFilters({
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              });
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Resolution & Response Report */}
            {activeTab === 'resolution' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Response Time</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Resolution Time</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resolutionData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            No data found for the selected period
                          </td>
                        </tr>
                      ) : (
                        resolutionData.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-blue-600">#{row.publicId || row.ticketId.slice(-6)}</td>
                            <td className="px-4 py-3 max-w-xs truncate">{row.title}</td>
                            <td className="px-4 py-3">{row.category}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.priority === 'High' || row.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                row.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {row.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.status === 'Resolved' || row.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">{formatHours(row.responseTime)}</td>
                            <td className="px-4 py-3">{formatHours(row.resolutionTime)}</td>
                            <td className="px-4 py-3">{row.assignedAgent || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  Showing {resolutionData.length} records
                </div>
              </div>
            )}

            {/* Agent Performance Report */}
            {activeTab === 'performance' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Agent</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Total Tickets</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Resolved</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Resolution Rate</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Avg Response</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Avg Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {performanceData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No agent performance data found
                          </td>
                        </tr>
                      ) : (
                        performanceData.map((agent, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">{agent.agentName}</div>
                                <div className="text-xs text-gray-500">{agent.email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{agent.department || '-'}</td>
                            <td className="px-4 py-3 text-center font-semibold">{agent.totalTickets}</td>
                            <td className="px-4 py-3 text-center text-green-600 font-medium">{agent.resolvedTickets}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                agent.resolutionRate >= 80 ? 'bg-green-100 text-green-700' :
                                agent.resolutionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {agent.resolutionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">{formatHours(agent.avgResponseTime)}</td>
                            <td className="px-4 py-3 text-center">{formatHours(agent.avgResolutionTime)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  Showing {performanceData.length} agents
                </div>
              </div>
            )}

            {/* Unresolved Tickets Report */}
            {activeTab === 'unresolved' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Days Open</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Assigned To</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {unresolvedData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            No unresolved tickets found
                          </td>
                        </tr>
                      ) : (
                        unresolvedData.map((ticket, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-blue-600">#{ticket.publicId || ticket.ticketId.slice(-6)}</td>
                            <td className="px-4 py-3 max-w-xs truncate">{ticket.title}</td>
                            <td className="px-4 py-3">{ticket.category}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${
                                ticket.daysSinceCreation > 7 ? 'text-red-600' :
                                ticket.daysSinceCreation > 3 ? 'text-orange-600' :
                                'text-gray-700'
                              }`}>
                                {ticket.daysSinceCreation}
                              </span>
                            </td>
                            <td className="px-4 py-3">{ticket.assignedAgent || 'Unassigned'}</td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  Showing {unresolvedData.length} unresolved tickets
                </div>
              </div>
            )}

            {/* All Tickets Report */}
            {activeTab === 'allTickets' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Ticket ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Source</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created By</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Assigned To</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allTicketsData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            No tickets found for the selected period
                          </td>
                        </tr>
                      ) : (
                        allTicketsData.map((ticket, i) => (
                          <tr 
                            key={i} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                          >
                            <td className="px-4 py-3 font-mono text-blue-600">#{ticket.publicId || ticket.ticketId.slice(-6)}</td>
                            <td className="px-4 py-3 max-w-xs truncate">{ticket.title}</td>
                            <td className="px-4 py-3">
                              <div>
                                <div>{ticket.category}</div>
                                {ticket.subcategory && <div className="text-xs text-gray-500">{ticket.subcategory}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{ticket.source}</td>
                            <td className="px-4 py-3">{ticket.createdBy}</td>
                            <td className="px-4 py-3">{ticket.assignedAgent || '-'}</td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  Showing {allTicketsData.length} tickets
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
