import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Shield, ShieldCheck, Building2, RefreshCw, 
  Ticket, Clock, Users, BarChart3, AlertCircle, CheckCircle,
  Loader2, XCircle, PauseCircle, Search, GitMerge
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CustomFieldAnalytics from '../components/CustomFieldAnalytics';
import toast from 'react-hot-toast';

interface DashboardAnalytics {
  totalTickets: number;
  averageResolutionTime: number;
  agentStats: { agentId: string; agentName: string; ticketsReceived: number; averageResolutionTime: number }[];
  subcategoryCounts: { subcategoryId: number; subcategoryName: string; categoryName: string; count: number }[];
  weeklyDepartments: { department: string; count: number; percentage: number }[];
  weeklyIssueTypes: { issueType: string; count: number; department: string }[];
}

interface MyTicketSummary {
  total: number;
  statusCounts: {
    new: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    merged: number;
  };
}

type StatusKey = keyof MyTicketSummary['statusCounts'];

const PERSONAL_STATUS_CONFIG: Array<{
  key: StatusKey;
  label: string;
  accent: string;
  bg: string;
  icon: typeof AlertCircle;
  description: string;
}> = [
  { key: 'new', label: 'New / Open', accent: 'text-blue-600', bg: 'bg-blue-50', icon: AlertCircle, description: 'Awaiting triage' },
  { key: 'inProgress', label: 'In Progress', accent: 'text-amber-600', bg: 'bg-amber-50', icon: Loader2, description: 'Being worked on' },
  { key: 'waiting', label: 'Waiting', accent: 'text-purple-600', bg: 'bg-purple-50', icon: PauseCircle, description: 'On hold / blocked' },
  { key: 'resolved', label: 'Resolved', accent: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, description: 'Completed but open' },
  { key: 'closed', label: 'Closed', accent: 'text-slate-600', bg: 'bg-slate-100', icon: XCircle, description: 'Fully completed' },
  { key: 'merged', label: 'Merged', accent: 'text-indigo-600', bg: 'bg-indigo-50', icon: GitMerge, description: 'Combined tickets' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { serverUrl, token, user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [myTicketSummary, setMyTicketSummary] = useState<MyTicketSummary | null>(null);
  const [apiStatus, setApiStatus] = useState<'live' | 'mock'>('mock');
  
  // User role states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isCategoryAdmin, setIsCategoryAdmin] = useState(false);
  const [categoryAdminCategoryIds, setCategoryAdminCategoryIds] = useState<number[]>([]);
  const [categoryAdminCategoryNames, setCategoryAdminCategoryNames] = useState<string[]>([]);

  const showAnalytics = isAdmin || isAgent || isCategoryAdmin;

  const loadMyTicketSummary = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/api/tickets/my?pageSize=500`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load tickets');
      
      const data = await response.json();
      const tickets = Array.isArray(data) ? data : (data.data || []);
      
      const statusCounts: MyTicketSummary['statusCounts'] = {
        new: 0,
        inProgress: 0,
        waiting: 0,
        resolved: 0,
        closed: 0,
        merged: 0
      };

      tickets.forEach((ticket: any) => {
        switch (ticket.status) {
          case 2: statusCounts.inProgress += 1; break;
          case 4: statusCounts.resolved += 1; break;
          case 5: statusCounts.closed += 1; break;
          case 3: statusCounts.waiting += 1; break;
          case 1009: statusCounts.merged += 1; break;
          default: statusCounts.new += 1; break;
        }
      });

      setMyTicketSummary({ total: tickets.length, statusCounts });
      setApiStatus('live'); // API call succeeded
    } catch (error) {
      console.error('Failed to load ticket summary:', error);
      setMyTicketSummary(null);
      setApiStatus('mock');
    }
  }, [serverUrl, token]);

  const loadAnalytics = useCallback(async (categoryIds?: number[]) => {
    try {
      // Build query params for category filtering
      const params = new URLSearchParams();
      if (categoryIds && categoryIds.length > 0) {
        params.append('categoryIds', categoryIds.join(','));
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Try analytics endpoint first
      let response = await fetch(`${serverUrl}/api/analytics/dashboard${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setApiStatus('live');
        return;
      }
      
      // Fallback: Build from Reports endpoint
      response = await fetch(`${serverUrl}/api/Reports/all-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        let allTickets = await response.json();
        
        // Filter by category IDs if provided
        if (categoryIds && categoryIds.length > 0) {
          allTickets = allTickets.filter((ticket: any) => {
            const ticketCategoryId = ticket.categoryId || ticket.category?.id;
            return categoryIds.includes(ticketCategoryId);
          });
        }
        
        // Calculate basic analytics
        const totalTickets = allTickets.length;
        
        // Count by status
        const categoryCount: Record<string, number> = {};
        allTickets.forEach((ticket: any) => {
          const category = ticket.category || 'Uncategorized';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        setAnalytics({
          totalTickets,
          averageResolutionTime: 24, // Default estimate
          agentStats: [],
          subcategoryCounts: Object.entries(categoryCount).map(([name, count], i) => ({
            subcategoryId: i,
            subcategoryName: name,
            categoryName: name,
            count,
            percentage: (count / totalTickets) * 100
          })),
          weeklyDepartments: [],
          weeklyIssueTypes: Object.entries(categoryCount).map(([category, count]) => ({
            issueType: category,
            count,
            department: 'General'
          }))
        });
        setApiStatus('live');
      }
    } catch (error) {
      console.warn('Analytics not available:', error);
      setApiStatus('mock');
    }
  }, [serverUrl, token]);

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        setLoading(true);
        
        let localIsAdmin = false;
        let localIsAgent = false;
        let localIsCategoryAdmin = false;
        let localCategoryIds: number[] = [];
        
        // Check user role from stored user info
        if (user) {
          // Handle both 'role' (string) and 'roles' (array) formats - use array for proper matching
          const userRolesArray: string[] = Array.isArray((user as any).roles) 
            ? (user as any).roles.map((r: string) => r.toLowerCase())
            : [(user.role || '').toLowerCase()];
          
          // Exact role matching to avoid "categoryadmin" matching "admin"
          localIsAdmin = userRolesArray.some((r: string) => r === 'admin' || r === 'superadmin' || r === 'administrator');
          localIsAgent = userRolesArray.some((r: string) => r === 'agent' || r === 'team lead' || r === 'teamlead');
          localIsCategoryAdmin = userRolesArray.includes('categoryadmin');
          
          setIsAdmin(localIsAdmin);
          setIsAgent(localIsAgent);
          setIsCategoryAdmin(localIsCategoryAdmin);
        }
        
        // Check category admin status
        try {
          const response = await fetch(`${serverUrl}/api/tickets/settings/category-admins/check/${user?.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const categoryAdminStatus = await response.json();
            localIsCategoryAdmin = categoryAdminStatus.isCategoryAdmin;
            localCategoryIds = categoryAdminStatus.categoryIds || [];
            setIsCategoryAdmin(localIsCategoryAdmin);
            setCategoryAdminCategoryIds(localCategoryIds);
            
            // Get category names
            if (localIsCategoryAdmin && localCategoryIds.length > 0) {
              const catResponse = await fetch(`${serverUrl}/api/tickets/settings/categories`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (catResponse.ok) {
                const categories = await catResponse.json();
                const names = categories
                  .filter((c: any) => localCategoryIds.includes(c.id))
                  .map((c: any) => c.name);
                setCategoryAdminCategoryNames(names);
              }
            }
          }
        } catch (error) {
          console.warn('Could not check category admin status:', error);
        }
        
        // Load appropriate data
        if (localIsAdmin || localIsAgent || localIsCategoryAdmin) {
          await loadAnalytics(localIsCategoryAdmin && !localIsAdmin ? localCategoryIds : undefined);
        } else {
          await loadMyTicketSummary();
        }
        
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndData();
  }, [user, serverUrl, token, loadAnalytics, loadMyTicketSummary]);

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round(hours / 24 * 10) / 10}d`;
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (showAnalytics) {
      await loadAnalytics(isCategoryAdmin && !isAdmin ? categoryAdminCategoryIds : undefined);
    } else {
      await loadMyTicketSummary();
    }
    setLoading(false);
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-auto h-full">
      {/* Role Banner */}
      {isAdmin && (
        <div className="bg-purple-50 text-purple-700 border border-purple-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Admin View - All Departments</span>
        </div>
      )}
      
      {isCategoryAdmin && !isAdmin && (
        <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Category Admin - {categoryAdminCategoryNames.length > 0 ? categoryAdminCategoryNames.join(', ') : 'Your Categories'}</span>
        </div>
      )}
      
      {isAgent && !isAdmin && !isCategoryAdmin && (
        <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>Agent Dashboard</span>
        </div>
      )}
      
      {/* API Status - Matching Web Design */}
      <div className={`rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 ${
        apiStatus === 'live' 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}>
        {apiStatus === 'live' ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Live Data Connected - Real-time analytics from database</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Using Mock Data</span>
          </>
        )}
      </div>

      {showAnalytics ? (
        <>
          {/* Admin/Agent/Category Admin View */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isAdmin 
                    ? 'Ticketing Analytics Dashboard - All Departments' 
                    : isCategoryAdmin 
                      ? `Category Admin Dashboard - ${categoryAdminCategoryNames.join(', ')}`
                      : 'Agent Ticketing Dashboard'
                  }
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {isAdmin 
                    ? 'Complete business intelligence overview for all departments' 
                    : isCategoryAdmin
                      ? 'Analytics and insights for your assigned categories'
                      : 'Analytics and insights across every department'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="inline-flex items-center px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Ticket
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-900">
                  <Ticket className="w-4 h-4" />
                  <h3 className="font-medium text-sm">Total Tickets</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">{analytics?.totalTickets || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-900">
                  <Clock className="w-4 h-4" />
                  <h3 className="font-medium text-sm">Avg Resolution</h3>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatTime(analytics?.averageResolutionTime || 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-900">
                  <Users className="w-4 h-4" />
                  <h3 className="font-medium text-sm">Active Agents</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-2">{analytics?.agentStats?.length || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-900">
                  <BarChart3 className="w-4 h-4" />
                  <h3 className="font-medium text-sm">Categories</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600 mt-2">{analytics?.subcategoryCounts?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Issue Types / Categories */}
          {analytics?.weeklyIssueTypes && analytics.weeklyIssueTypes.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h2>
              <div className="space-y-3">
                {analytics.weeklyIssueTypes.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.issueType}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min((item.count / (analytics?.totalTickets || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Performance */}
          {analytics?.agentStats && analytics.agentStats.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h2>
              <div className="space-y-3">
                {analytics.agentStats.slice(0, 5).map((agent, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{agent.agentName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{agent.ticketsReceived} tickets</span>
                      <span className="text-green-600">{formatTime(agent.averageResolutionTime)} avg</span>
                    </div>
                  </div>
                ))}n              </div>
            </div>
          )}

          {/* Custom Field Analytics - Category Admin Feature */}
          {(isAdmin || isCategoryAdmin) && (
            <CustomFieldAnalytics 
              days={7} 
              categoryIds={isCategoryAdmin && !isAdmin ? categoryAdminCategoryIds : undefined}
            />
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/my-tickets')}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Ticket className="w-4 h-4" />
                View All Tickets
              </button>
              <button 
                onClick={() => navigate('/tickets/new')}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Ticket
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Regular User View - Matching Web Dashboard */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Ticket Summary</h2>
                <p className="text-gray-500 text-sm mt-1">Only your ticket counts are displayed here.</p>
              </div>
              <div className="flex items-center gap-4">
                {myTicketSummary && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total tickets</p>
                    <p className="text-4xl font-bold text-gray-400">{myTicketSummary.total}</p>
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {myTicketSummary ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {PERSONAL_STATUS_CONFIG.map((statusConfig) => (
                  <button 
                    key={statusConfig.key} 
                    onClick={() => navigate('/my-tickets')}
                    className={`${statusConfig.bg} rounded-xl p-4 text-left hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all`}
                  >
                    <p className="text-sm font-medium text-gray-700 mb-2">{statusConfig.label}</p>
                    <p className={`text-3xl font-bold ${statusConfig.accent}`}>
                      {myTicketSummary.statusCounts[statusConfig.key] || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{statusConfig.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Unable to load ticket summary</p>
                <button
                  onClick={loadMyTicketSummary}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions for Users - Matching Web Design */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-800 rounded" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Quick access to common tasks</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/tickets/new')}
                className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-900 hover:bg-gray-800 rounded-xl text-white transition-colors"
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">New Ticket</span>
              </button>
              <button 
                onClick={() => navigate('/my-tickets')}
                className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-colors"
              >
                <Search className="w-6 h-6" />
                <span className="font-medium">Search Tickets</span>
              </button>
            </div>
          </div>

          {/* System Status - Matching Web Design */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
