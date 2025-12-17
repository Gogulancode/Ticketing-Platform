import React, { useState, useEffect } from 'react';
import { SparklesIcon, DocumentTextIcon, ArrowPathIcon, PrinterIcon, ArrowDownTrayIcon, ChartBarIcon, ChartPieIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { generateAIReport, AIReportRequest, AIReportResponse } from '../../../api/aiApi';
import { branchAnalyticsApi, OverallAnalytics } from '../../../api/branchAnalyticsApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Color palette for charts - Black & Red theme (Enrich branding)
const THEME_COLORS = {
  primary: '#18181B',
  secondary: '#DC2626',
  accent1: '#EF4444',
  accent2: '#F87171',
  accent3: '#71717A',
  accent4: '#A1A1AA',
  success: '#10B981',
  warning: '#F59E0B',
};

const STATUS_COLORS = {
  open: '#3B82F6',
  closed: '#10B981',
  pending: '#F59E0B',
  overdue: '#DC2626'
};

interface AIInsightsTabProps {
  startDate?: string;
  endDate?: string;
}

const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ startDate, endDate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [report, setReport] = useState<AIReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  
  // Form state
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly' | 'branch' | 'agent-performance' | 'sla' | 'category' | 'executive'>('weekly');
  const [department, setDepartment] = useState<string>('');
  const [includeAgentAnalysis, setIncludeAgentAnalysis] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  // Fetch analytics on mount and when report type changes
  useEffect(() => {
    fetchAnalytics();
  }, [reportType, startDate, endDate]);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const { start, end } = getDateRange();
      console.log('📊 Fetching analytics for:', reportType, start, end);
      const data = await branchAnalyticsApi.getOverallAnalytics(start, end);
      console.log('📊 Analytics data received:', data);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // Set mock data if API fails so charts still show
      setAnalytics({
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        overdueTickets: 0,
        overallSlaComplianceRate: 0,
        totalAgents: 0,
        totalBranches: 0,
        avgResolutionTimeHours: 0,
        branchBreakdown: []
      } as OverallAnalytics);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const getDateRange = () => {
    // Use props if provided, otherwise calculate based on report type
    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }
    
    const end = new Date();
    const start = new Date();
    
    switch (reportType) {
      case 'weekly':
        start.setDate(end.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(end.getMonth() - 3);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return { start, end };
  };

  // Prepare chart data from analytics
  const getStatusDistributionData = () => {
    if (!analytics) return [];
    return [
      { name: 'Open', value: analytics.openTickets, color: STATUS_COLORS.open },
      { name: 'Closed', value: analytics.closedTickets, color: STATUS_COLORS.closed },
      { name: 'Pending', value: Math.max(0, analytics.totalTickets - analytics.openTickets - analytics.closedTickets - analytics.overdueTickets), color: STATUS_COLORS.pending },
      { name: 'Overdue', value: analytics.overdueTickets, color: STATUS_COLORS.overdue }
    ].filter(item => item.value > 0);
  };

  const getBranchPerformanceData = () => {
    if (!analytics?.branchBreakdown) return [];
    return analytics.branchBreakdown.slice(0, 6).map(branch => ({
      name: branch.branchName?.substring(0, 12) || 'Unknown',
      tickets: branch.totalTickets || 0,
      resolved: branch.closedTickets || 0,
      sla: branch.slaComplianceRate || 0
    }));
  };

  const getPerformanceRadarData = () => {
    if (!analytics) return [];
    return [
      {
        metric: 'SLA Compliance',
        value: analytics.overallSlaComplianceRate || 0,
        fullMark: 100
      },
      {
        metric: 'Resolution Rate',
        value: analytics.totalTickets > 0 ? Math.round((analytics.closedTickets / analytics.totalTickets) * 100) : 0,
        fullMark: 100
      },
      {
        metric: 'Agent Utilization',
        value: analytics.totalAgents > 0 ? Math.min(100, Math.round((analytics.totalTickets / analytics.totalAgents) * 10)) : 0,
        fullMark: 100
      },
      {
        metric: 'On-Time Resolution',
        value: 100 - (analytics.totalTickets > 0 ? Math.round((analytics.overdueTickets / analytics.totalTickets) * 100) : 0),
        fullMark: 100
      },
      {
        metric: 'Workload Balance',
        value: analytics.branchBreakdown?.length > 0 ? 75 : 50,
        fullMark: 100
      }
    ];
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { start, end } = getDateRange();
      
      // Build analytics data from actual data to pass to AI
      const analyticsData = analytics ? {
        totalTickets: analytics.totalTickets || 0,
        openTickets: analytics.openTickets || 0,
        closedTickets: analytics.closedTickets || 0,
        overdueTickets: analytics.overdueTickets || 0,
        avgResolutionHours: analytics.avgResolutionTimeHours || 0,
        slaComplianceRate: analytics.overallSlaComplianceRate || 0,
        totalAgents: analytics.totalAgents || 0,
        branchBreakdown: (analytics.branchBreakdown || []).map(branch => ({
          branchId: branch.branchId,
          branchName: branch.branchName,
          branchCode: branch.branchCode || '',
          totalTickets: branch.totalTickets,
          openTickets: branch.openTickets,
          closedTickets: branch.closedTickets,
          overdueTickets: branch.overdueTickets,
          avgResolutionHours: branch.avgResolutionTimeHours,
          slaComplianceRate: branch.slaComplianceRate,
          agentCount: branch.totalAgents || 0,
          ticketsPerAgent: (branch.totalAgents || 0) > 0 ? branch.totalTickets / branch.totalAgents : 0
        })),
        categoryBreakdown: [],
        agentPerformance: []
      } : undefined;
      
      const request: AIReportRequest = {
        reportType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        department: department || undefined,
        includeAgentAnalysis,
        includeTrends,
        includeRecommendations,
        analyticsData
      };
      
      console.log('📊 Generating AI report with real data:', {
        totalTickets: analyticsData?.totalTickets,
        openTickets: analyticsData?.openTickets,
        closedTickets: analyticsData?.closedTickets,
        overdueTickets: analyticsData?.overdueTickets
      });
      
      const response = await generateAIReport(request);
      setReport(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;
    
    // Build content from sections
    const content = report.sections?.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n') || '';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-report-${reportType}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    { value: 'weekly', label: 'Weekly Summary' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'quarterly', label: 'Quarterly Analysis' },
    { value: 'branch', label: 'Branch Performance' },
    { value: 'agent-performance', label: 'Agent Performance' },
    { value: 'sla', label: 'SLA Compliance' },
    { value: 'category', label: 'Category Analysis' },
    { value: 'executive', label: 'Executive Summary' }
  ];

  return (
    <div className="space-y-6">
      {/* Report Configuration - At the top */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <SparklesIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI-Generated Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., IT Support"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          {/* Options */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Include in Report</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeAgentAnalysis}
                  onChange={(e) => setIncludeAgentAnalysis(e.target.checked)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                />
                Agent Analysis
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeTrends}
                  onChange={(e) => setIncludeTrends(e.target.checked)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                />
                Trends
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                />
                Recommendations
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                />
                Show Charts
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Generate AI Report
              </>
            )}
          </button>

          {report && (
            <>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-gray-700">{error}</p>
        </div>
      )}

      {/* Generated Report */}
      {report && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">{report.reportTitle || 'AI Report'}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'Just now'}</span>
            </div>
          </div>
          
          {/* Executive Summary */}
          {report.executiveSummary && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
              <p className="text-gray-800 text-sm">{report.executiveSummary}</p>
            </div>
          )}

          {/* Report Sections */}
          <div className="prose prose-sm max-w-none space-y-6">
            {report.sections?.map((section, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-700 mb-3">{section.content}</p>
                {section.highlights && section.highlights.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    {section.highlights.map((highlight, hIndex) => (
                      <li key={hIndex}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Key Metrics from Report */}
          {report.keyMetrics && report.keyMetrics.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Key Metrics</h4>
              <div className="flex flex-wrap gap-2">
                {report.keyMetrics.map((metric, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">AI Recommendations</h4>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-gray-900 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conclusion */}
          {report.conclusion && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Conclusion</h4>
              <p className="text-gray-700">{report.conclusion}</p>
            </div>
          )}
        </div>
      )}

      {/* Charts Section - After Report Configuration */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartPieIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Ticket Status Distribution</h3>
            </div>
            {isLoadingAnalytics ? (
              <div className="h-64 flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getStatusDistributionData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {getStatusDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Branch Performance Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Branch Performance</h3>
            </div>
            {isLoadingAnalytics ? (
              <div className="h-64 flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getBranchPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="tickets" name="Total Tickets" fill={THEME_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill={THEME_COLORS.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Performance Radar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
            </div>
            {isLoadingAnalytics ? (
              <div className="h-64 flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={getPerformanceRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke={THEME_COLORS.secondary}
                    fill={THEME_COLORS.secondary}
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsTab;
