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
  Plus
} from 'lucide-react';
import { analyticsApi, DashboardAnalytics } from '../../../shared/services/api/analyticsApi';

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

  useEffect(() => {
    const loadTicketingAnalytics = async () => {
      try {
        setLoading(true);
        console.log('🎫 Loading ticketing analytics...');
        
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

    loadTicketingAnalytics();
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
              Ticketing Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Complete business intelligence overview for your ticketing system
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
        
        {/* Weekly Issue Type Count */}
        <AnalyticsCard
          title="Weekly Issue Type Count"
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
        >
          <div className="space-y-3">
            {(analytics?.weeklyIssueTypes || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.issueType}</div>
                  <div className="text-sm text-gray-500">{item.department}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{item.count}</div>
                  <div className="text-xs text-gray-500">tickets</div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Weekly Department wise Ticket Count */}
        <AnalyticsCard
          title="Weekly Department Ticket Count"
          icon={<Building2 className="h-5 w-5 text-green-600" />}
        >
          <div className="space-y-3">
            {(analytics?.weeklyDepartments || []).map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{dept.department}</div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{dept.count}</div>
                  <div className="text-xs text-gray-500">{dept.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Agent wise Ticket Received and Resolution time */}
        <AnalyticsCard
          title="Agent Performance"
          icon={<Users className="h-5 w-5 text-purple-600" />}
        >
          <div className="space-y-4">
            {(analytics?.agentStats || []).map((agent, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{agent.agentName}</div>
                    <div className="text-xs text-gray-500">{agent.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-purple-600">{agent.ticketsReceived}</div>
                    <div className="text-xs text-gray-500">tickets</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Timer className="h-4 w-4 mr-1" />
                    Avg Resolution: {formatTime(agent.averageResolutionTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Subcategory wise tickets count */}
        <AnalyticsCard
          title="Subcategory Ticket Distribution"
          icon={<Target className="h-5 w-5 text-orange-600" />}
        >
          <div className="space-y-3">
            {(analytics?.subcategoryCounts || []).map((subcat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{subcat.subcategoryName}</div>
                  <div className="text-sm text-gray-500">{subcat.categoryName}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">{subcat.count}</div>
                  <div className="text-xs text-gray-500">{subcat.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tickets/new"
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Ticket className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-600">Create Ticket</span>
          </Link>
          <Link
            to="/tickets/my"
            className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <User className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-medium text-purple-600">My Tickets</span>
          </Link>
          <Link
            to="/tickets/settings"
            className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <Activity className="h-5 w-5 text-orange-600 mr-2" />
            <span className="font-medium text-orange-600">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TicketDashboard;
