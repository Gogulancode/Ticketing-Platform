import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  Ticket,
  User,
  Timer,
  Target,
  Activity,
  Plus,
  Shield
} from 'lucide-react';
import { analyticsApi, DashboardAnalytics } from '../../../shared/services/api/analyticsApi';
import { getCurrentUser } from '../../../shared/services/api/auth';
import QuickCustomFieldAnalytics from '../components/QuickCustomFieldAnalytics';
import WeeklyDepartmentWidget from '../components/WeeklyDepartmentWidget';
import AgentPerformanceWidget from '../components/AgentPerformanceWidget';
import QuickActionsWidget from '../components/QuickActionsWidget';

interface AnalyticsCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="p-2 bg-blue-100 rounded-lg">
        {icon}
      </div>
    </div>
    {children}
  </div>
);

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

const TicketDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'live' | 'mock'>('mock');
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
          const userRole = currentUser.role || '';
          const userIsAdmin = adminRoles.some(role => 
            userRole.toLowerCase().includes(role.toLowerCase())
          );
          setIsAdmin(userIsAdmin);
          
          console.log(`👤 User department: ${department}, Is Admin: ${userIsAdmin}`);
        } catch (userError) {
          console.warn('⚠️ Could not fetch user info, defaulting to admin view');
          setIsAdmin(true); // Default to admin view if user fetch fails
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
  }, []);

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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
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

      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Ticketing Analytics Dashboard - All Departments' : `${userDepartment || 'Department'} Dashboard`}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin 
                ? 'Complete business intelligence overview for all departments' 
                : `Analytics and insights for ${userDepartment || 'your department'}`
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
          <WeeklyDepartmentWidget department={isAdmin ? undefined : userDepartment} />
        </div>

        {/* Agent Performance Widget */}
        <div className="lg:col-span-1">
          <AgentPerformanceWidget department={isAdmin ? undefined : userDepartment} />
        </div>

      </div>
    </div>
  );
};

export default TicketDashboard;
