import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Shield } from 'lucide-react';
import { analyticsApi, DashboardAnalytics } from '../../../shared/services/api/analyticsApi';
import { getCurrentUser } from '../../../shared/services/api/auth';
import QuickCustomFieldAnalytics from '../components/QuickCustomFieldAnalytics';
import WeeklyDepartmentWidget from '../components/WeeklyDepartmentWidget';
import AgentPerformanceWidget from '../components/AgentPerformanceWidget';
import QuickActionsWidget from '../components/QuickActionsWidget';
import { ticketsApi, Ticket, TicketStatus } from '../services/ticketsApi';

// Mock data for fallback when API is not available
const mockTicketingAnalyticsData = {
  weeklyIssueTypes: [
    { issueType: "Network Issues", count: 12, department: "IT" },
    { issueType: "Software Bugs", count: 8, department: "Development" },
    { issueType: "Hardware Problems", count: 6, department: "IT" },
    { issueType: "User Access", count: 4, department: "Security" }
  ],
  weeklyDepartments: [
    { department: "IT", count: 18, percentage: 45.0 },
    { department: "Development", count: 12, percentage: 30.0 },
    { department: "Security", count: 6, percentage: 15.0 },
    { department: "Operations", count: 4, percentage: 10.0 }
  ],
  agentStats: [
    { agentId: "agent1", agentName: "John Smith", email: "john@company.com", ticketsReceived: 15, averageResolutionTime: 18.5, department: "IT" },
    { agentId: "agent2", agentName: "Sarah Johnson", email: "sarah@company.com", ticketsReceived: 12, averageResolutionTime: 24.2, department: "Development" },
    { agentId: "agent3", agentName: "Mike Wilson", email: "mike@company.com", ticketsReceived: 8, averageResolutionTime: 16.8, department: "Security" }
  ],
  subcategoryCounts: [
    { subcategoryId: 1, subcategoryName: "Network Connectivity", categoryName: "Network", count: 8, percentage: 20.0 },
    { subcategoryId: 2, subcategoryName: "Application Error", categoryName: "Software", count: 6, percentage: 15.0 },
    { subcategoryId: 3, subcategoryName: "Hardware Failure", categoryName: "Hardware", count: 5, percentage: 12.5 },
    { subcategoryId: 4, subcategoryName: "Login Issues", categoryName: "Access", count: 4, percentage: 10.0 }
  ],
  totalTickets: 40,
  averageResolutionTime: 19.8
};

interface MyTicketSummary {
  total: number;
  statusCounts: {
    new: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
  };
}

type StatusKey = keyof MyTicketSummary['statusCounts'];

const PERSONAL_STATUS_CONFIG: Array<{
  key: StatusKey;
  label: string;
  accent: string;
  bg: string;
  description: string;
}> = [
  { key: 'new', label: 'New / Open', accent: 'text-blue-600', bg: 'bg-blue-50', description: 'Awaiting triage' },
  { key: 'inProgress', label: 'In Progress', accent: 'text-amber-600', bg: 'bg-amber-50', description: 'Being worked on' },
  { key: 'waiting', label: 'Waiting', accent: 'text-purple-600', bg: 'bg-purple-50', description: 'On hold / blocked' },
  { key: 'resolved', label: 'Resolved', accent: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Completed but open' },
  { key: 'closed', label: 'Closed', accent: 'text-slate-600', bg: 'bg-slate-100', description: 'Fully completed' }
];

const TicketDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'live' | 'mock'>('mock');
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [myTicketSummary, setMyTicketSummary] = useState<MyTicketSummary | null>(null);
  const [myTicketsError, setMyTicketsError] = useState<string | null>(null);
  const showAnalytics = isAdmin || isAgent;

  const loadMyTicketSummary = useCallback(async () => {
    try {
      setMyTicketsError(null);
      const tickets = await ticketsApi.getMyTickets();
      const statusCounts: MyTicketSummary['statusCounts'] = {
        new: 0,
        inProgress: 0,
        waiting: 0,
        resolved: 0,
        closed: 0
      };

      tickets.forEach((ticket: Ticket) => {
        switch (ticket.status) {
          case TicketStatus.InProgress:
            statusCounts.inProgress += 1;
            break;
          case TicketStatus.Resolved:
            statusCounts.resolved += 1;
            break;
          case TicketStatus.Closed:
            statusCounts.closed += 1;
            break;
          case TicketStatus.OnHold:
            statusCounts.waiting += 1;
            break;
          default:
            statusCounts.new += 1;
            break;
        }
      });

      setMyTicketSummary({
        total: tickets.length,
        statusCounts
      });
    } catch (error) {
      console.error('Failed to load personal ticket summary', error);
      setMyTicketsError('Unable to load your tickets right now.');
      setMyTicketSummary(null);
    }
  }, []);

  useEffect(() => {
    const loadUserAndAnalytics = async () => {
      try {
        setLoading(true);
        console.log('🎫 Loading user info and ticketing analytics...');
        
        // Get current user to check department and role
        try {
          const currentUser = await getCurrentUser();
          const department = currentUser.department || null;
          setUserDepartment(department);
          
          // Check if user is admin (you can adjust this logic based on your role structure)
          const adminRoles = ['Admin', 'SuperAdmin', 'Administrator'];
          const singleRole = (currentUser.role || '').toString().toLowerCase();
          const roles = Array.isArray(currentUser.roles)
            ? currentUser.roles
                .map(role => {
                  if (!role) return '';
                  if (typeof role === 'string') return role;
                  if (typeof role === 'object' && 'name' in role && typeof role.name === 'string') {
                    return role.name;
                  }
                  return role.toString();
                })
                .filter(Boolean)
            : [];
          const normalizedRoles = roles.map(role => role.toLowerCase());
          const userIsAdmin = adminRoles.some(role => 
            singleRole.includes(role.toLowerCase()) || normalizedRoles.some(r => r.includes(role.toLowerCase()))
          );
          setIsAdmin(userIsAdmin);

          const userIsAgent = Boolean(
            currentUser.isAgent ||
            singleRole.includes('agent') ||
            normalizedRoles.some(role => role.includes('agent'))
          );
          setIsAgent(userIsAgent);

          if (!userIsAdmin && !userIsAgent) {
            await loadMyTicketSummary();
          } else {
            setMyTicketSummary(null);
            setMyTicketsError(null);
          }
          
          console.log(`👤 User department: ${department}, Is Admin: ${userIsAdmin}, Is Agent: ${userIsAgent}`);
        } catch {
          console.warn('⚠️ Could not fetch user info, defaulting to admin view');
          setIsAdmin(true); // Default to admin view if user fetch fails
          setIsAgent(true);
        }
        
        // Try to get live analytics data from API
        const analyticsData = await analyticsApi.getDashboardAnalytics();
        console.log('✅ Ticketing analytics loaded:', analyticsData);
        setAnalytics(analyticsData);
        setApiStatus('live');
      } catch (error) {
        console.warn('⚠️ Failed to load live ticketing analytics, using mock data:', error);
        setAnalytics(mockTicketingAnalyticsData);
        setApiStatus('mock');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndAnalytics();
  }, [loadMyTicketSummary]);

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round(hours / 24 * 10) / 10}d`;
  };

  // Show skeleton UI while loading
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department/Admin View Banner */}
      {!isAdmin && userDepartment && (
        <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>Viewing {userDepartment} Department Dashboard</span>
        </div>
      )}
      
      {isAdmin && (
        <div className="bg-purple-50 text-purple-700 border border-purple-200 rounded-lg p-3 text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Admin View - All Departments</span>
        </div>
      )}
      
      {/* API Status Banner */}
      <div className={`rounded-lg p-3 text-sm font-medium ${
        apiStatus === 'live' 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}>
        {apiStatus === 'live' 
          ? '✅ Live Data Connected - Real-time analytics from database'
          : '⚠️ Using Mock Data - API connection unavailable'
        }
      </div>

      {showAnalytics ? (
        <>
          {/* Welcome Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAdmin ? 'Ticketing Analytics Dashboard - All Departments' : 'Agent Ticketing Dashboard'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {isAdmin 
                    ? 'Complete business intelligence overview for all departments' 
                    : 'Analytics and insights across every department'
                  }
                </p>
              </div>
              <Link
                to="/tickets/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900">Total Tickets</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{analytics?.totalTickets || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900">Avg Resolution Time</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatTime(analytics?.averageResolutionTime || 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900">Active Agents</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{analytics?.agentStats?.length || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-medium text-orange-900">Issue Categories</h3>
                <p className="text-2xl font-bold text-orange-600 mt-1">{analytics?.subcategoryCounts?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Custom Field Analytics Widget */}
            <div className="lg:col-span-2">
              <QuickCustomFieldAnalytics days={7} />
            </div>

            {/* Quick Actions Widget */}
            <div className="lg:col-span-2">
              <QuickActionsWidget />
            </div>
            
            {/* Weekly Department Widget */}
            <div className="lg:col-span-1">
              <WeeklyDepartmentWidget department={userDepartment} showAllDepartments={showAnalytics} />
            </div>

            {/* Agent Performance Widget */}
            <div className="lg:col-span-1">
              <AgentPerformanceWidget department={showAnalytics ? undefined : userDepartment} />
            </div>

          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Ticket Summary</h2>
                <p className="text-gray-600">Only your ticket counts are displayed here.</p>
              </div>
              {myTicketSummary && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total tickets</p>
                  <p className="text-4xl font-bold text-blue-600">{myTicketSummary.total}</p>
                </div>
              )}
            </div>

            {myTicketsError ? (
              <div className="mt-6 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 text-sm md:flex-row md:items-center md:justify-between">
                <span>{myTicketsError}</span>
                <button
                  type="button"
                  onClick={loadMyTicketSummary}
                  className="inline-flex items-center justify-center rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : myTicketSummary ? (
              <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3 lg:grid-cols-5">
                {PERSONAL_STATUS_CONFIG.map((statusConfig) => (
                  <div key={statusConfig.key} className={`${statusConfig.bg} rounded-lg p-4`}>
                    <p className="text-sm font-medium text-gray-700">{statusConfig.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${statusConfig.accent}`}>
                      {myTicketSummary.statusCounts[statusConfig.key] || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{statusConfig.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: PERSONAL_STATUS_CONFIG.length }).map((_, index) => (
                  <div key={index} className="rounded-lg bg-gray-100 p-4 animate-pulse">
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-3"></div>
                    <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <QuickActionsWidget />
        </>
      )}
    </div>
  );
};

export default TicketDashboard;
