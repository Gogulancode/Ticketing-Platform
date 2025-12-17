import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { branchAnalyticsApi, type OverallAnalytics, type BranchTicketTrend, type AgentPerformance, type BranchSlaPerformance } from '../../api/branchAnalyticsApi';

// Date range options
const dateRangeOptions = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This Year', days: 365 },
];

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

function StatCard({ title, value, icon, change, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-red-50 text-gray-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {change >= 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Simple Bar Chart Component
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title: string;
  maxValue?: number;
}

function SimpleBarChart({ data, title, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 truncate">{item.label}</span>
              <span className="text-gray-900 font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${item.color || 'bg-red-500'}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Branch Performance Table
interface BranchTableProps {
  branches: OverallAnalytics['branchBreakdown'];
}

function BranchPerformanceTable({ branches }: BranchTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SLA %</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Resolution</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Agents</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {branches.map((branch) => (
              <tr key={branch.branchId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                      <div className="text-xs text-gray-500">{branch.branchCode}</div>
                    </div>
                    {branch.isHeadquarters && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-gray-700 rounded-full">HQ</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-gray-900">{branch.totalTickets}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    {branch.openTickets}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {branch.closedTickets}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-sm font-medium ${branch.slaComplianceRate >= 90 ? 'text-green-600' : branch.slaComplianceRate >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {branch.slaComplianceRate}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-gray-600">{branch.avgResolutionTimeHours}h</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-gray-600">
                    {branch.activeAgents}/{branch.totalAgents}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Agent Leaderboard
interface AgentLeaderboardProps {
  agents: AgentPerformance[];
}

function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const topAgents = agents.slice(0, 10);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Agents</h3>
      <div className="space-y-4">
        {topAgents.map((agent, index) => (
          <div key={agent.agentId} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{agent.agentName}</p>
                <p className="text-xs text-gray-500">{agent.branchName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{agent.resolvedTickets}</p>
              <p className="text-xs text-gray-500">resolved</p>
            </div>
          </div>
        ))}
        {topAgents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No agent data available</p>
        )}
      </div>
    </div>
  );
}

// SLA Performance Card
interface SlaPerformanceCardProps {
  data: BranchSlaPerformance[];
}

function SlaPerformanceCard({ data }: SlaPerformanceCardProps) {
  const sortedData = [...data].sort((a, b) => b.complianceRate - a.complianceRate);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance by Branch</h3>
      <div className="space-y-4">
        {sortedData.map((branch) => (
          <div key={branch.branchId}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">{branch.branchName}</span>
              <span className={`text-sm font-medium ${
                branch.complianceRate >= 90 ? 'text-green-600' : 
                branch.complianceRate >= 70 ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {branch.complianceRate}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  branch.complianceRate >= 90 ? 'bg-green-500' : 
                  branch.complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${branch.complianceRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{branch.ticketsMeetingSla} met</span>
              <span>{branch.ticketsBreachingSla} breached</span>
            </div>
          </div>
        ))}
        {sortedData.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No SLA data available</p>
        )}
      </div>
    </div>
  );
}

// Trend Mini Chart
interface TrendMiniChartProps {
  trend: BranchTicketTrend;
}

function TrendMiniChart({ trend }: TrendMiniChartProps) {
  const maxCreated = Math.max(...trend.created.map(d => d.value), 1);
  const lastWeek = trend.created.slice(-7);
  
  return (
    <div className="flex items-end h-16 space-x-1">
      {lastWeek.map((point, index) => (
        <div
          key={index}
          className="flex-1 bg-red-200 hover:bg-red-300 rounded-t transition-all"
          style={{ height: `${(point.value / maxCreated) * 100}%`, minHeight: '4px' }}
          title={`${point.label}: ${point.value} tickets`}
        />
      ))}
    </div>
  );
}

// Main Dashboard Component
export default function BranchAnalyticsDashboard() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>();

  // Calculate date range
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - selectedDays);
    return { startDate, endDate };
  }, [selectedDays]);

  // Fetch overall analytics
  const { data: overallData, isLoading: loadingOverall, refetch: refetchOverall } = useQuery({
    queryKey: ['branch-analytics-overall', selectedDays],
    queryFn: () => branchAnalyticsApi.getOverallAnalytics(dateRange.startDate, dateRange.endDate),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch ticket trends
  const { data: trendsData, isLoading: loadingTrends } = useQuery({
    queryKey: ['branch-analytics-trends', selectedDays, selectedBranchId],
    queryFn: () => branchAnalyticsApi.getTicketTrends(selectedBranchId, selectedDays),
  });

  // Fetch agent performance
  const { data: agentData, isLoading: loadingAgents } = useQuery({
    queryKey: ['branch-analytics-agents', selectedDays, selectedBranchId],
    queryFn: () => branchAnalyticsApi.getAgentPerformance(selectedBranchId, dateRange.startDate, dateRange.endDate),
  });

  // Fetch SLA performance
  const { data: slaData, isLoading: loadingSla } = useQuery({
    queryKey: ['branch-analytics-sla', selectedDays],
    queryFn: () => branchAnalyticsApi.getSlaPerformance(dateRange.startDate, dateRange.endDate),
  });

  // Fetch category distribution
  const { data: categoryData } = useQuery({
    queryKey: ['branch-analytics-categories', selectedDays, selectedBranchId],
    queryFn: () => branchAnalyticsApi.getCategoryDistribution(selectedBranchId, dateRange.startDate, dateRange.endDate),
  });

  // Fetch priority distribution
  const { data: priorityData } = useQuery({
    queryKey: ['branch-analytics-priorities', selectedDays, selectedBranchId],
    queryFn: () => branchAnalyticsApi.getPriorityDistribution(selectedBranchId, dateRange.startDate, dateRange.endDate),
  });

  const isLoading = loadingOverall || loadingTrends || loadingAgents || loadingSla;

  // Prepare chart data
  const categoryChartData = useMemo(() => {
    if (!categoryData) return [];
    const colors = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-red-500'];
    return categoryData.slice(0, 6).map((cat, i) => ({
      label: cat.categoryName,
      value: cat.count,
      color: colors[i % colors.length],
    }));
  }, [categoryData]);

  const priorityChartData = useMemo(() => {
    if (!priorityData) return [];
    const priorityColors: Record<string, string> = {
      'Critical': 'bg-red-500',
      'High': 'bg-orange-500',
      'Medium': 'bg-yellow-500',
      'Low': 'bg-green-500',
    };
    return priorityData.map(p => ({
      label: p.priority,
      value: p.count,
      color: priorityColors[p.priority] || 'bg-gray-500',
    }));
  }, [priorityData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor performance across all branches</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Branch Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedBranchId ?? ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Branches</option>
              {overallData?.branchBreakdown.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.days} value={option.days}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchOverall()}
            disabled={isLoading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !overallData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      )}

      {/* Main Stats Grid */}
      {overallData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Tickets"
              value={overallData.totalTickets}
              icon={<ChartBarIcon className="w-6 h-6" />}
              color="blue"
              subtitle={`Last ${selectedDays} days`}
            />
            <StatCard
              title="Open Tickets"
              value={overallData.openTickets}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              color="yellow"
              subtitle={`${overallData.overdueTickets} overdue`}
            />
            <StatCard
              title="SLA Compliance"
              value={`${overallData.overallSlaComplianceRate}%`}
              icon={<ShieldCheckIcon className="w-6 h-6" />}
              color={overallData.overallSlaComplianceRate >= 90 ? 'green' : overallData.overallSlaComplianceRate >= 70 ? 'yellow' : 'red'}
            />
            <StatCard
              title="Avg Resolution"
              value={`${overallData.avgResolutionTimeHours}h`}
              icon={<ClockIcon className="w-6 h-6" />}
              color="purple"
              subtitle={`${overallData.totalAgents} agents`}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Branches"
              value={overallData.totalBranches}
              icon={<BuildingOffice2Icon className="w-6 h-6" />}
              color="indigo"
            />
            <StatCard
              title="Total Agents"
              value={overallData.totalAgents}
              icon={<UserGroupIcon className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Closed Tickets"
              value={overallData.closedTickets}
              icon={<ChartBarIcon className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Overdue Tickets"
              value={overallData.overdueTickets}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              color="red"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleBarChart
              title="Tickets by Category"
              data={categoryChartData}
            />
            <SimpleBarChart
              title="Tickets by Priority"
              data={priorityChartData}
            />
          </div>

          {/* Branch Performance Table */}
          <BranchPerformanceTable branches={overallData.branchBreakdown} />

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agentData && <AgentLeaderboard agents={agentData} />}
            {slaData && <SlaPerformanceCard data={slaData} />}
          </div>

          {/* Ticket Trends by Branch */}
          {trendsData && trendsData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Trends by Branch (Last 7 Days)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendsData.map((trend) => (
                  <div key={trend.branchId} className="border border-gray-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">{trend.branchName}</p>
                    <TrendMiniChart trend={trend} />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>7 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
