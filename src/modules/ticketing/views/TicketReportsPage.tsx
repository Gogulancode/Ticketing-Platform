import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock, Users, AlertTriangle, FileText, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';
import ReportFiltersComponent from '../components/ReportFilters';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ReportsRouteGuard, { CategoryAdminInfo } from '../components/ReportsRouteGuard';
import AnalyticsSummaryTab from '../components/AnalyticsSummaryTab';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  ReportFilters, 
  ResolutionResponseReport, 
  AgentPerformanceReport, 
  UnresolvedTicket, 
  TicketSummary,
  reportsApi,
  reportUtils
} from '../services/reportsApi';
import { formatDateIST, formatTicketDateTime } from '../../../shared/utils/dateUtils';

type ReportTab = 'resolution' | 'performance' | 'unresolved' | 'allTickets' | 'analyticsSummary';

// Helper function to get default date range (last 7 days)
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

const getTicketDisplayId = (ticketId?: string, publicId?: number | null): string => {
  if (publicId != null && publicId !== 0) {
    return publicId.toString();
  }

  const baseId = ticketId ?? '';
  if (!baseId) {
    return '000000';
  }

  const hash = baseId.split('').reduce((acc, char) => {
    const next = ((acc << 5) - acc) + char.charCodeAt(0);
    return next & next;
  }, 0);

  return Math.abs(hash).toString().padStart(6, '0').slice(-6);
};

interface TicketReportsContentProps {
  userRole?: 'admin' | 'agent' | 'categoryAdmin' | null;
  categoryAdminInfo?: CategoryAdminInfo;
}

const TicketReportsContent: React.FC<TicketReportsContentProps> = ({ 
  userRole,
  categoryAdminInfo 
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('resolution');
  const [filters, setFilters] = useState<ReportFilters>(getDefaultDateRange());
  const [loading, setLoading] = useState(false);
  
  // Report data state
  const [resolutionData, setResolutionData] = useState<ResolutionResponseReport[]>([]);
  const [performanceData, setPerformanceData] = useState<AgentPerformanceReport[]>([]);
  const [unresolvedData, setUnresolvedData] = useState<UnresolvedTicket[]>([]);
  const [allTicketsData, setAllTicketsData] = useState<TicketSummary[]>([]);

  const tabs = [
    {
      id: 'resolution' as const,
      name: 'Resolution & Response Time',
      icon: Clock,
      description: 'Track response and resolution times with SLA metrics'
    },
    {
      id: 'performance' as const,
      name: 'Agent Performance',
      icon: Users,
      description: 'Monitor agent productivity and performance metrics'
    },
    {
      id: 'unresolved' as const,
      name: 'Unresolved Tickets',
      icon: AlertTriangle,
      description: 'View overdue and pending tickets requiring attention'
    },
    {
      id: 'allTickets' as const,
      name: 'All Tickets',
      icon: FileText,
      description: 'Comprehensive ticket overview with full details'
    },
    // Analytics Summary tab - only for admins
    ...(isAdmin() ? [{
      id: 'analyticsSummary' as const,
      name: 'Analytics Summary',
      icon: TrendingUp,
      description: 'Key metrics, interactive charts, and drill-down analytics'
    }] : [])
  ];

  const loadReportData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;
    
    setLoading(true);
    try {
      // For Category Admins, apply category filter to all reports
      const effectiveFilters = { ...filters };
      if (userRole === 'categoryAdmin' && categoryAdminInfo?.categoryIds.length) {
        // Join category IDs for API filter (comma-separated)
        effectiveFilters.category = categoryAdminInfo.categoryIds.join(',');
      }
      
      switch (activeTab) {
        case 'resolution': {
          let resData = await reportsApi.getResolutionResponseReport(effectiveFilters);
          // Client-side filter as backup for Category Admins
          if (userRole === 'categoryAdmin' && categoryAdminInfo?.categoryNames.length) {
            resData = resData.filter(item => 
              categoryAdminInfo.categoryNames.some(cat => 
                item.category?.toLowerCase().includes(cat.toLowerCase())
              )
            );
          }
          setResolutionData(resData);
          break;
        }
        case 'performance': {
          const perfData = await reportsApi.getAgentPerformanceReport(effectiveFilters);
          setPerformanceData(perfData);
          break;
        }
        case 'unresolved': {
          let unresData = await reportsApi.getUnresolvedTicketsReport(effectiveFilters);
          // Client-side filter as backup for Category Admins
          if (userRole === 'categoryAdmin' && categoryAdminInfo?.categoryNames.length) {
            unresData = unresData.filter(item => 
              categoryAdminInfo.categoryNames.some(cat => 
                item.category?.toLowerCase().includes(cat.toLowerCase())
              )
            );
          }
          setUnresolvedData(unresData);
          break;
        }
        case 'allTickets': {
          let allData = await reportsApi.getAllTicketsReport(effectiveFilters);
          // Client-side filter as backup for Category Admins
          if (userRole === 'categoryAdmin' && categoryAdminInfo?.categoryNames.length) {
            allData = allData.filter(item => 
              categoryAdminInfo.categoryNames.some(cat => 
                item.category?.toLowerCase().includes(cat.toLowerCase())
              )
            );
          }
          setAllTicketsData(allData);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, userRole, categoryAdminInfo]);

  // Load data based on active tab and filters
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const reportType = activeTab === 'allTickets' ? 'all-tickets' : 
                      activeTab === 'unresolved' ? 'unresolved-tickets' : 
                      activeTab === 'performance' ? 'agent-performance' : 'resolution-response';
    
    try {
      await reportsApi.exportReport(reportType, filters, { format });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'resolution': return resolutionData;
      case 'performance': return performanceData;
      case 'unresolved': return unresolvedData;
      case 'allTickets': return allTicketsData;
      default: return [];
    }
  };

  return (
    <div className="text-sm leading-snug p-6 bg-gray-50 min-h-screen">
      {/* Category Head Banner */}
      {userRole === 'categoryAdmin' && categoryAdminInfo && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">
              Category Admin View - Reports for: {categoryAdminInfo.categoryNames.join(', ')}
            </span>
          </div>
          <p className="text-xs text-indigo-600 mt-1">
            You are viewing reports filtered to your assigned categories only.
          </p>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold leading-tight mt-sm mb-sm">Ticket Reports</h1>
        <p className="text-gray-600">
          Comprehensive reporting and analytics for ticket management and performance tracking.
        </p>
      </div>

      {/* Report Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <Icon className={`mr-2 h-4 w-4 ${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Description */}
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Analytics Summary Tab - Show separate component */}
      {activeTab === 'analyticsSummary' ? (
        <AnalyticsSummaryTab startDate={filters.startDate} endDate={filters.endDate} />
      ) : (
        <>
          {/* Filters */}
          <ReportFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
            onRefresh={loadReportData}
            loading={loading}
            showStatusFilter={activeTab !== 'unresolved'}
          />

          {/* Report Content */}
          <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading report data..." />
          </div>
        ) : (
          <>
            {/* Report Header with Summary Stats */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {filters.startDate && filters.endDate ? (
                    <span>
                      {formatDateIST(filters.startDate)} - {formatDateIST(filters.endDate)}
                    </span>
                  ) : (
                    <span>Select date range to view data</span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Records</p>
                      <p className="text-lg font-bold text-gray-900">{getCurrentData().length}</p>
                    </div>
                  </div>
                </div>
                
                {activeTab === 'resolution' && resolutionData.length > 0 && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Avg Response Time</p>
                          <p className="text-lg font-bold text-green-900">
                            {Math.round(resolutionData.reduce((sum, item) => sum + (item.responseTime || 0), 0) / resolutionData.length)}h
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">Avg Resolution Time</p>
                          <p className="text-lg font-bold text-yellow-900">
                            {Math.round(resolutionData.reduce((sum, item) => sum + (item.resolutionTime || 0), 0) / resolutionData.length)}h
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Total Tickets</p>
                          <p className="text-lg font-bold text-purple-900">
                            {resolutionData.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === 'performance' && performanceData.length > 0 && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Active Agents</p>
                          <p className="text-lg font-bold text-green-900">{performanceData.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Total Resolved</p>
                          <p className="text-lg font-bold text-gray-900">
                            {performanceData.reduce((sum, item) => sum + item.resolvedTickets, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">Avg Resolution Rate</p>
                          <p className="text-lg font-bold text-yellow-900">
                            {Math.round((performanceData.reduce((sum, item) => sum + item.resolutionRate, 0) / performanceData.length))}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Report Table */}
            <div className="p-6">
              {getCurrentData().length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-500">
                    {!filters.startDate || !filters.endDate ? 
                      'Please select a date range to view report data.' : 
                      'No data found for the selected criteria. Try adjusting your filters.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {activeTab === 'resolution' && (
                    <ResolutionResponseTable data={resolutionData} />
                  )}
                  {activeTab === 'performance' && (
                    <AgentPerformanceTable data={performanceData} />
                  )}
                  {activeTab === 'unresolved' && (
                    <UnresolvedTicketsTable data={unresolvedData} />
                  )}
                  {activeTab === 'allTickets' && (
                    <AllTicketsTable data={allTicketsData} />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
};

// Wrapper component that uses ReportsRouteGuard to pass props
const TicketReportsPage: React.FC = () => {
  return (
    <ReportsRouteGuard>
      <TicketReportsContent />
    </ReportsRouteGuard>
  );
};

// Resolution & Response Time Table Component
const ResolutionResponseTable: React.FC<{ data: ResolutionResponseReport[] }> = ({ data }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Ticket ID
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Title
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Response Time
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Resolution Time
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((item) => (
        <tr key={item.ticketId} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
            #{getTicketDisplayId(item.ticketId, item.publicId)}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
            {item.title}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.category}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              item.priority === 'Critical' ? 'bg-red-100 text-gray-800' :
              item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
              item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {item.priority}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.responseTime ? reportUtils.formatTime(item.responseTime) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.resolutionTime ? reportUtils.formatTime(item.resolutionTime) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportUtils.getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Agent Performance Table Component
const AgentPerformanceTable: React.FC<{ data: AgentPerformanceReport[] }> = ({ data }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Agent
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Department
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Total Tickets
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Resolved
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Resolution Rate
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Avg Resolution Time
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Satisfaction
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((agent, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-800">
                    {agent.agentName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                <div className="text-sm text-gray-500">{agent.email}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {agent.department}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {agent.totalTickets}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {agent.resolvedTickets}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <div className="flex items-center">
              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className={`h-2 rounded-full ${
                    agent.resolutionRate >= 80 ? 'bg-green-500' :
                    agent.resolutionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${agent.resolutionRate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{agent.resolutionRate.toFixed(1)}%</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {reportUtils.formatTime(agent.avgResolutionTime)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (agent.satisfactionRating || 0) >= 4 ? 'bg-green-100 text-green-800' :
              (agent.satisfactionRating || 0) >= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-gray-800'
            }`}>
              {agent.satisfactionRating ? agent.satisfactionRating.toFixed(1) : 'N/A'}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Unresolved Tickets Table Component
const UnresolvedTicketsTable: React.FC<{ data: UnresolvedTicket[] }> = ({ data }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Ticket ID
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Title
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Assigned To
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Age (Days)
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Last Updated
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((ticket) => (
        <tr key={ticket.ticketId} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
            #{getTicketDisplayId(ticket.ticketId, ticket.publicId)}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
            {ticket.title}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              ticket.priority === 'Critical' ? 'bg-red-100 text-gray-800' :
              ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ticket.priority}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportUtils.getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {ticket.assignedAgent || 'Unassigned'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <span className={ticket.daysSinceCreation > 7 ? 'text-gray-600 font-semibold' : 'text-gray-900'}>
              {ticket.daysSinceCreation} days
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatTicketDateTime(ticket.lastUpdated)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// All Tickets Table Component
const AllTicketsTable: React.FC<{ data: TicketSummary[] }> = ({ data }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Ticket ID
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Title
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Created Date
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Assigned Agent
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((ticket) => (
        <tr key={ticket.ticketId} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
            #{getTicketDisplayId(ticket.ticketId, ticket.publicId)}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
            {ticket.title}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {ticket.category}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              ticket.priority === 'Critical' ? 'bg-red-100 text-gray-800' :
              ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ticket.priority}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportUtils.getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatTicketDateTime(ticket.createdAt)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {ticket.assignedAgent || 'Unassigned'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default TicketReportsPage;

