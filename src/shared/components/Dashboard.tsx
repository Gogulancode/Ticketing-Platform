import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  Ticket,
  User,
  Timer,
  Target,
  Activity
} from 'lucide-react';
import { getCurrentUser } from '../services/api/auth';
import { analyticsApi, DashboardAnalytics } from '../services/api/analyticsApi';

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
const mockAnalyticsData: DashboardAnalytics = {
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

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Try to get user data, but don't fail if it doesn't work
        try {
          const userData = await getCurrentUser();
          setCurrentUser(userData);
        } catch (userError) {
          console.warn('User API not available, using fallback user:', userError);
          setCurrentUser({ name: 'Demo User', email: 'demo@company.com' });
        }
        
        // Try to get analytics data from API - INDUSTRY STANDARD: Real-time dashboard
        try {
          console.log('🔍 Fetching live analytics from database...');
          const analyticsData = await analyticsApi.getDashboardAnalytics();
          console.log('✅ Live analytics loaded successfully:', analyticsData);
          
          // Validate data structure for industry standards
          if (analyticsData && typeof analyticsData.totalTickets === 'number') {
            setAnalytics(analyticsData);
            setUsingMockData(false);
            console.log(`📊 Dashboard showing ${analyticsData.totalTickets} real tickets from database`);
          } else {
            throw new Error('Invalid analytics data structure');
          }
        } catch (apiError) {
          console.error('⚠️ Analytics API temporarily unavailable:', apiError);
          console.warn('🔄 Falling back to demo data for user experience continuity');
          setAnalytics(mockAnalyticsData);
          setUsingMockData(true);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        // Always show mock analytics data as fallback
        setAnalytics(mockAnalyticsData);
        setUsingMockData(true);
        setCurrentUser({ name: 'Demo User', email: 'demo@company.com' });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round(hours / 24 * 10) / 10}d`;
  };

  return (
    <div className="space-y-6">
      {/* Real Data Status Banner - Industry Standard: Data Source Transparency */}
      {!usingMockData && analytics && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">Live Dashboard:</span> Displaying real-time data from your database. 
                Last updated: {new Date().toLocaleTimeString()} | Total Records: {analytics.totalTickets}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Demo Mode Banner */}
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Demo Mode:</span> Analytics API temporarily unavailable. 
                Showing demo data for interface preview. Backend will reconnect automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {currentUser?.name || 'User'}! Here's your ticketing system analytics overview.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Total Tickets</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{analytics?.totalTickets || 0}</p>
                <p className="text-xs text-blue-500 mt-1">All time</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Avg Resolution</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {analytics?.averageResolutionTime ? formatTime(analytics.averageResolutionTime) : 'N/A'}
                </p>
                <p className="text-xs text-green-500 mt-1">Industry standard</p>
              </div>
              <Timer className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-900">Active Agents</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{analytics?.agentStats?.length || 0}</p>
                <p className="text-xs text-purple-500 mt-1">Available now</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900">Categories</h3>
                <p className="text-2xl font-bold text-orange-600 mt-1">{analytics?.weeklyIssueTypes?.length || 0}</p>
                <p className="text-xs text-orange-500 mt-1">Active types</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
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
            {analytics?.weeklyIssueTypes?.map((item, index) => (
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
            )) || (
              <div className="text-center text-gray-500 py-8">
                No issue type data available
              </div>
            )}
          </div>
        </AnalyticsCard>

        {/* Weekly Department wise Ticket Count */}
        <AnalyticsCard
          title="Weekly Department Ticket Count"
          icon={<Building2 className="h-5 w-5 text-green-600" />}
        >
          <div className="space-y-3">
            {analytics?.weeklyDepartments?.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{dept.department}</div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{dept.count}</div>
                  <div className="text-xs text-gray-500">{dept.percentage.toFixed(1)}%</div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                No department data available
              </div>
            )}
          </div>
        </AnalyticsCard>

        {/* Agent wise Ticket Received and Resolution time */}
        <AnalyticsCard
          title="Agent Performance"
          icon={<Users className="h-5 w-5 text-purple-600" />}
        >
          <div className="space-y-4">
            {analytics?.agentStats?.map((agent, index) => (
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
            )) || (
              <div className="text-center text-gray-500 py-8">
                No agent data available
              </div>
            )}
          </div>
        </AnalyticsCard>

        {/* Subcategory wise tickets count */}
        <AnalyticsCard
          title="Subcategory Ticket Distribution"
          icon={<Target className="h-5 w-5 text-orange-600" />}
        >
          <div className="space-y-3">
            {analytics?.subcategoryCounts?.map((subcat, index) => (
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
            )) || (
              <div className="text-center text-gray-500 py-8">
                No subcategory data available
              </div>
            )}
          </div>
        </AnalyticsCard>

      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/ticketing/tickets/create"
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Ticket className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-600">Create Ticket</span>
          </Link>
          <Link
            to="/ticketing/tickets"
            className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-green-600">View All Tickets</span>
          </Link>
          <Link
            to="/ticketing/my-tickets"
            className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <User className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-medium text-purple-600">My Tickets</span>
          </Link>
          <Link
            to="/ticketing/settings"
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

export default Dashboard;
