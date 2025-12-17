import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Clock, Users, AlertTriangle, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Timer, ArrowRight, ChevronDown, ChevronUp,
  Building2, Tag, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { API_CONFIG } from '../../../config/api';

// Color palette
const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  gray: '#6B7280'
};

// Category chart colors (rainbow palette)
const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

const STATUS_COLORS: Record<string, string> = {
  'Open': '#3B82F6',
  'New': '#3B82F6',
  'In Progress': '#F59E0B',
  'Waiting on User': '#8B5CF6',
  'Resolved': '#10B981',
  'Closed': '#6B7280'
};

const PRIORITY_COLORS: Record<string, string> = {
  'Low': '#10B981',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Critical': '#DC2626'
};

interface AnalyticsSummaryTabProps {
  startDate?: string;
  endDate?: string;
}

interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  overdueTickets: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
  firstResponseSlaRate: number;
}

interface CategoryBreakdown {
  categoryName: string;
  count: number;
  percentage: number;
}

interface DepartmentBreakdown {
  departmentName: string;
  count: number;
  openCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

interface TrendData {
  date: string;
  created: number;
  resolved: number;
  open: number;
}

const AnalyticsSummaryTab: React.FC<AnalyticsSummaryTabProps> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentBreakdown[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [drilldownCategory, setDrilldownCategory] = useState<string | null>(null);
  const [drilldownDepartment, setDrilldownDepartment] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Fetch all tickets for analysis
      const ticketsResponse = await fetch(
        `${API_CONFIG.BASE_URL}/reports/all-tickets?${params}`,
        { headers: getAuthHeaders() }
      );

      if (!ticketsResponse.ok) throw new Error('Failed to fetch tickets');
      
      const tickets = await ticketsResponse.json();

      // Calculate metrics from tickets
      const totalTickets = tickets.length;
      const openTickets = tickets.filter((t: any) => t.status === 'Open' || t.status === 'New').length;
      const inProgressTickets = tickets.filter((t: any) => t.status === 'In Progress').length;
      const resolvedTickets = tickets.filter((t: any) => t.status === 'Resolved').length;
      const closedTickets = tickets.filter((t: any) => t.status === 'Closed').length;
      
      // Calculate SLA and timing metrics
      const ticketsWithResolution = tickets.filter((t: any) => t.resolutionTime > 0);
      const ticketsWithResponse = tickets.filter((t: any) => t.responseTime > 0);
      
      const avgResolutionTimeHours = ticketsWithResolution.length > 0
        ? ticketsWithResolution.reduce((sum: number, t: any) => sum + (t.resolutionTime || 0), 0) / ticketsWithResolution.length
        : 0;
      
      const avgResponseTimeHours = ticketsWithResponse.length > 0
        ? ticketsWithResponse.reduce((sum: number, t: any) => sum + (t.responseTime || 0), 0) / ticketsWithResponse.length
        : 0;

      // Calculate overdue (tickets open for more than 48 hours)
      const now = new Date();
      const overdueTickets = tickets.filter((t: any) => {
        if (t.status === 'Resolved' || t.status === 'Closed') return false;
        const createdAt = new Date(t.createdAt);
        const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursOpen > 48;
      }).length;

      // SLA compliance (resolved within 24 hours for now)
      const resolvedWithinSla = ticketsWithResolution.filter((t: any) => t.resolutionTime <= 24).length;
      const slaComplianceRate = ticketsWithResolution.length > 0
        ? (resolvedWithinSla / ticketsWithResolution.length) * 100
        : 100;

      const respondedWithinSla = ticketsWithResponse.filter((t: any) => t.responseTime <= 4).length;
      const firstResponseSlaRate = ticketsWithResponse.length > 0
        ? (respondedWithinSla / ticketsWithResponse.length) * 100
        : 100;

      setMetrics({
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        overdueTickets,
        avgResponseTimeHours,
        avgResolutionTimeHours,
        slaComplianceRate,
        firstResponseSlaRate
      });

      // Category breakdown
      const categoryMap = new Map<string, number>();
      tickets.forEach((t: any) => {
        const cat = t.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const categories = Array.from(categoryMap.entries())
        .map(([name, count]) => ({
          categoryName: name,
          count,
          percentage: (count / totalTickets) * 100
        }))
        .sort((a, b) => b.count - a.count);
      setCategoryBreakdown(categories);

      // Department breakdown
      const deptMap = new Map<string, { total: number; open: number; resolved: number; resolutionTimes: number[] }>();
      tickets.forEach((t: any) => {
        const dept = t.department || 'Unassigned';
        const current = deptMap.get(dept) || { total: 0, open: 0, resolved: 0, resolutionTimes: [] };
        current.total += 1;
        if (t.status === 'Open' || t.status === 'New' || t.status === 'In Progress') {
          current.open += 1;
        }
        if (t.status === 'Resolved' || t.status === 'Closed') {
          current.resolved += 1;
          if (t.resolutionTime > 0) {
            current.resolutionTimes.push(t.resolutionTime);
          }
        }
        deptMap.set(dept, current);
      });
      const departments = Array.from(deptMap.entries())
        .map(([name, data]) => ({
          departmentName: name,
          count: data.total,
          openCount: data.open,
          resolvedCount: data.resolved,
          avgResolutionHours: data.resolutionTimes.length > 0
            ? data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length
            : 0
        }))
        .sort((a, b) => b.count - a.count);
      setDepartmentBreakdown(departments);

      // Agent metrics
      const agentMap = new Map<string, { name: string; total: number; resolved: number; resolutionTimes: number[] }>();
      tickets.forEach((t: any) => {
        if (!t.assignedAgent) return;
        const current = agentMap.get(t.assignedAgent) || { name: t.assignedAgent, total: 0, resolved: 0, resolutionTimes: [] };
        current.total += 1;
        if (t.status === 'Resolved' || t.status === 'Closed') {
          current.resolved += 1;
          if (t.resolutionTime > 0) {
            current.resolutionTimes.push(t.resolutionTime);
          }
        }
        agentMap.set(t.assignedAgent, current);
      });
      const agents = Array.from(agentMap.entries())
        .map(([id, data]) => ({
          agentId: id,
          agentName: data.name,
          totalTickets: data.total,
          resolvedTickets: data.resolved,
          avgResolutionTime: data.resolutionTimes.length > 0
            ? data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length
            : 0,
          resolutionRate: data.total > 0 ? (data.resolved / data.total) * 100 : 0
        }))
        .sort((a, b) => b.totalTickets - a.totalTickets)
        .slice(0, 10);
      setAgentMetrics(agents);

      // Trend data (last 7 days)
      const trendMap = new Map<string, { created: number; resolved: number }>();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        trendMap.set(dateStr, { created: 0, resolved: 0 });
      }
      
      tickets.forEach((t: any) => {
        const createdDate = t.createdAt?.split('T')[0];
        const resolvedDate = t.resolvedAt?.split('T')[0];
        
        if (createdDate && trendMap.has(createdDate)) {
          const data = trendMap.get(createdDate)!;
          data.created += 1;
        }
        if (resolvedDate && trendMap.has(resolvedDate)) {
          const data = trendMap.get(resolvedDate)!;
          data.resolved += 1;
        }
      });

      let runningOpen = openTickets + inProgressTickets;
      const trends = last7Days.map(date => {
        const data = trendMap.get(date)!;
        runningOpen = runningOpen - data.resolved + data.created;
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          created: data.created,
          resolved: data.resolved,
          open: Math.max(0, runningOpen)
        };
      });
      setTrendData(trends);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  const statusData = metrics ? [
    { name: 'Open', value: metrics.openTickets, color: STATUS_COLORS['Open'] },
    { name: 'In Progress', value: metrics.inProgressTickets, color: STATUS_COLORS['In Progress'] },
    { name: 'Resolved', value: metrics.resolvedTickets, color: STATUS_COLORS['Resolved'] },
    { name: 'Closed', value: metrics.closedTickets, color: STATUS_COLORS['Closed'] }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.totalTickets || 0}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{metrics?.openTickets || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            + {metrics?.inProgressTickets || 0} in progress
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics?.resolvedTickets || 0}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            + {metrics?.closedTickets || 0} closed
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SLA Compliance</p>
              <p className={`text-2xl font-bold mt-1 ${
                (metrics?.slaComplianceRate || 0) >= 90 ? 'text-green-600' : 
                (metrics?.slaComplianceRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(metrics?.slaComplianceRate || 0)}%
              </p>
            </div>
            <div className={`p-2 rounded-lg ${
              (metrics?.slaComplianceRate || 0) >= 90 ? 'bg-green-100' : 
              (metrics?.slaComplianceRate || 0) >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <TrendingUp className={`h-5 w-5 ${
                (metrics?.slaComplianceRate || 0) >= 90 ? 'text-green-600' : 
                (metrics?.slaComplianceRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Resolution within 24h</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Resolution</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatTime(metrics?.avgResolutionTimeHours || 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Timer className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Response: {formatTime(metrics?.avgResponseTimeHours || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overdue</p>
              <p className={`text-2xl font-bold mt-1 ${
                (metrics?.overdueTickets || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {metrics?.overdueTickets || 0}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${
              (metrics?.overdueTickets || 0) > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <XCircle className={`h-5 w-5 ${
                (metrics?.overdueTickets || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Open &gt; 48 hours</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  name="Created"
                  stroke={COLORS.info} 
                  fill={COLORS.info} 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  name="Resolved"
                  stroke={COLORS.success} 
                  fill={COLORS.success} 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {statusData.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-gray-600">{status.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown with Drill-down */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Tag className="h-5 w-5 text-gray-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
            <span className="ml-3 text-sm text-gray-500">({categoryBreakdown.length} categories)</span>
          </div>
          {expandedSection === 'categories' ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'categories' && (
          <div className="px-6 pb-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis 
                    type="category" 
                    dataKey="categoryName" 
                    width={120}
                    tick={{ fontSize: 12 }} 
                    stroke="#6B7280" 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [value, 'Tickets']}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                    onClick={(data) => setDrilldownCategory(data.categoryName)}
                    cursor="pointer"
                  >
                    {categoryBreakdown.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tickets</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryBreakdown.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDrilldownCategory(cat.categoryName)}>
                      <td className="px-4 py-3 text-sm text-gray-900">{cat.categoryName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{cat.count}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{cat.percentage.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ width: `${cat.percentage}%`, backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Department Performance with Drill-down */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('departments')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-gray-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
            <span className="ml-3 text-sm text-gray-500">({departmentBreakdown.length} departments)</span>
          </div>
          {expandedSection === 'departments' ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'departments' && (
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Open</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Resolved</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Resolution Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departmentBreakdown.map((dept, idx) => {
                    const resolutionRate = dept.count > 0 ? (dept.resolvedCount / dept.count) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDrilldownDepartment(dept.departmentName)}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.departmentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{dept.count}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 text-right font-medium">{dept.openCount}</td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">{dept.resolvedCount}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            resolutionRate >= 80 ? 'bg-green-100 text-green-800' :
                            resolutionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {resolutionRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatTime(dept.avgResolutionHours)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Agent Performance with Drill-down */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('agents')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Top Agent Performance</h3>
            <span className="ml-3 text-sm text-gray-500">({agentMetrics.length} agents)</span>
          </div>
          {expandedSection === 'agents' ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSection === 'agents' && (
          <div className="px-6 pb-6">
            {agentMetrics.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No agent data available for the selected period</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentMetrics.map((agent, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.agentName}</p>
                        <p className="text-xs text-gray-500">{agent.totalTickets} tickets assigned</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-lg font-bold text-gray-900">{agent.resolvedTickets}</p>
                        <p className="text-xs text-gray-500">Resolved</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className={`text-lg font-bold ${
                          agent.resolutionRate >= 80 ? 'text-green-600' : 
                          agent.resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {agent.resolutionRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Rate</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-lg font-bold text-purple-600">{formatTime(agent.avgResolutionTime)}</p>
                        <p className="text-xs text-gray-500">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSummaryTab;
