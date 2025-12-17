import React, { useState, useEffect } from 'react';
import { SparklesIcon, DocumentTextIcon, ArrowPathIcon, CalendarIcon, PrinterIcon, ArrowDownTrayIcon, ChartBarIcon, ChartPieIcon, UsersIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { generateAIReport, AIReportRequest, AIReportResponse } from '../../../api/aiApi';
import { branchAnalyticsApi, OverallAnalytics } from '../../../api/branchAnalyticsApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

const AIReportsPage: React.FC = () => {
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
  }, [reportType]);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('📊 Fetching analytics for:', reportType, startDate, endDate);
      const data = await branchAnalyticsApi.getOverallAnalytics(startDate, endDate);
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
    const endDate = new Date();
    const startDate = new Date();
    
    switch (reportType) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  };

  // Prepare chart data from analytics
  const getStatusDistributionData = () => {
    if (!analytics) return [];
    return [
      { name: 'Open', value: analytics.openTickets, color: STATUS_COLORS.open },
      { name: 'Closed', value: analytics.closedTickets, color: STATUS_COLORS.closed },
      { name: 'Overdue', value: analytics.overdueTickets, color: STATUS_COLORS.overdue },
    ].filter(d => d.value > 0);
  };

  const getBranchComparisonData = () => {
    if (!analytics?.branchBreakdown) return [];
    return analytics.branchBreakdown.slice(0, 8).map((branch) => ({
      name: branch.branchCode || branch.branchName.substring(0, 10),
      fullName: branch.branchName,
      tickets: branch.totalTickets,
      open: branch.openTickets,
      closed: branch.closedTickets,
      overdue: branch.overdueTickets,
      sla: Math.round(branch.slaComplianceRate),
      agents: branch.totalAgents,
    }));
  };

  const getBranchSlaData = () => {
    if (!analytics?.branchBreakdown) return [];
    return analytics.branchBreakdown.slice(0, 8).map((branch) => ({
      name: branch.branchCode || branch.branchName.substring(0, 10),
      fullName: branch.branchName,
      slaCompliance: Math.round(branch.slaComplianceRate),
      avgResolution: Math.round(branch.avgResolutionTimeHours * 10) / 10,
    }));
  };

  const getAgentWorkloadData = () => {
    if (!analytics?.branchBreakdown) return [];
    return analytics.branchBreakdown
      .filter(b => b.totalAgents > 0)
      .slice(0, 8)
      .map((branch) => ({
        name: branch.branchCode || branch.branchName.substring(0, 10),
        ticketsPerAgent: Math.round(branch.avgTicketsPerAgent * 10) / 10,
        agents: branch.activeAgents || branch.totalAgents,
      }));
  };

  // Get chart configuration based on report type
  const getChartsForReportType = () => {
    const statusPieChart = (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ChartPieIcon className="h-5 w-5 text-secondary-600" />
          Ticket Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={getStatusDistributionData()}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {getStatusDistributionData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );

    const branchTicketsChart = (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
          Tickets by Branch
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={getBranchComparisonData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-sm text-gray-600">Open: {data.open}</p>
                      <p className="text-sm text-green-600">Closed: {data.closed}</p>
                      <p className="text-sm text-gray-600">Overdue: {data.overdue}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="open" name="Open" fill={STATUS_COLORS.open} stackId="tickets" />
            <Bar dataKey="closed" name="Closed" fill={STATUS_COLORS.closed} stackId="tickets" />
            <Bar dataKey="overdue" name="Overdue" fill={STATUS_COLORS.overdue} stackId="tickets" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

    const slaComplianceChart = (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-secondary-600" />
          SLA Compliance by Branch
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={getBranchSlaData()} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={80} fontSize={12} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-sm text-green-600">SLA: {data.slaCompliance}%</p>
                      <p className="text-sm text-gray-600">Avg Resolution: {data.avgResolution}h</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="slaCompliance" 
              name="SLA %" 
              fill={THEME_COLORS.secondary}
              background={{ fill: '#f3f4f6' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

    const agentWorkloadChart = (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary-600" />
          Agent Workload by Branch
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={getAgentWorkloadData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ticketsPerAgent" name="Tickets/Agent" fill={THEME_COLORS.secondary} />
            <Bar dataKey="agents" name="Agent Count" fill={THEME_COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

    const performanceRadarChart = analytics?.branchBreakdown ? (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-secondary-600" />
          Performance Overview
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={[
            { metric: 'SLA Compliance', value: Math.round(analytics.overallSlaComplianceRate), fullMark: 100 },
            { metric: 'Closure Rate', value: analytics.totalTickets > 0 ? Math.round((analytics.closedTickets / analytics.totalTickets) * 100) : 0, fullMark: 100 },
            { metric: 'On-Time Rate', value: analytics.totalTickets > 0 ? Math.round(((analytics.totalTickets - analytics.overdueTickets) / analytics.totalTickets) * 100) : 0, fullMark: 100 },
            { metric: 'Agent Utilization', value: Math.min(Math.round((analytics.totalTickets / Math.max(analytics.totalAgents, 1)) * 5), 100), fullMark: 100 },
          ]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Performance" dataKey="value" stroke={THEME_COLORS.secondary} fill={THEME_COLORS.secondary} fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    ) : null;

    // Return different chart combinations based on report type
    switch (reportType) {
      case 'weekly':
      case 'monthly':
      case 'quarterly':
        return { charts: [statusPieChart, branchTicketsChart], title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Overview` };
      
      case 'branch':
        return { charts: [branchTicketsChart, slaComplianceChart, agentWorkloadChart], title: 'Branch Analysis' };
      
      case 'agent-performance':
        return { charts: [agentWorkloadChart, performanceRadarChart], title: 'Agent Performance Analysis' };
      
      case 'sla':
        return { charts: [slaComplianceChart, statusPieChart], title: 'SLA Compliance Analysis' };
      
      case 'category':
        return { charts: [statusPieChart, branchTicketsChart], title: 'Category Breakdown' };
      
      case 'executive':
        return { charts: [performanceRadarChart, statusPieChart, slaComplianceChart], title: 'Executive Dashboard' };
      
      default:
        return { charts: [statusPieChart, branchTicketsChart], title: 'Overview' };
    }
  };

  const { charts: relevantCharts, title: chartSectionTitle } = getChartsForReportType();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();
      
      const request: AIReportRequest = {
        reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        department: department || undefined,
        includeAgentAnalysis,
        includeTrends,
        includeRecommendations,
      };

      const result = await generateAIReport(request);
      
      if (result.success) {
        setReport(result);
      } else {
        setError(result.errorMessage || 'Failed to generate report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;
    
    // Create a text version of the report
    let content = `${report.reportTitle}\n${'='.repeat(50)}\n\n`;
    content += `Generated: ${new Date(report.generatedAt || '').toLocaleString()}\n\n`;
    content += `EXECUTIVE SUMMARY\n${'-'.repeat(30)}\n${report.executiveSummary}\n\n`;
    
    report.sections.forEach(section => {
      content += `${section.title.toUpperCase()}\n${'-'.repeat(30)}\n${section.content}\n`;
      if (section.highlights.length > 0) {
        content += `\nHighlights:\n${section.highlights.map(h => `  • ${h}`).join('\n')}\n`;
      }
      content += '\n';
    });
    
    if (report.keyMetrics.length > 0) {
      content += `KEY METRICS\n${'-'.repeat(30)}\n${report.keyMetrics.map(m => `  • ${m}`).join('\n')}\n\n`;
    }
    
    if (report.recommendations.length > 0) {
      content += `RECOMMENDATIONS\n${'-'.repeat(30)}\n${report.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}\n\n`;
    }
    
    if (report.conclusion) {
      content += `CONCLUSION\n${'-'.repeat(30)}\n${report.conclusion}\n`;
    }
    
    // Download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-support-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DocumentTextIcon className="h-8 w-8 text-secondary-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Reports</h1>
          <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
            Powered by DeepSeek
          </span>
        </div>
        <p className="text-gray-600">Generate comprehensive AI-powered support reports with dynamic charts</p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="branch">Branch Analysis</option>
              <option value="agent-performance">Agent Performance</option>
              <option value="sla">SLA Compliance</option>
              <option value="category">Category Breakdown</option>
              <option value="executive">Executive Summary</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="All Departments"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Date Range Display */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              {(() => {
                const { startDate, endDate } = getDateRange();
                return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
              })()}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showCharts}
              onChange={(e) => setShowCharts(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
            />
            Show Visual Charts
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeAgentAnalysis}
              onChange={(e) => setIncludeAgentAnalysis(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
            />
            Include Agent Analysis
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeTrends}
              onChange={(e) => setIncludeTrends(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
            />
            Include Trends
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeRecommendations}
              onChange={(e) => setIncludeRecommendations(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
            />
            Include Recommendations
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-600 text-white font-medium rounded-md hover:bg-secondary-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Generate AI Report
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          This uses the DeepSeek 8B model for comprehensive analysis (may take 30-60 seconds)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-gray-700">
          {error}
        </div>
      )}

      {/* Analytics Charts Section - Dynamic based on report type */}
      {showCharts && analytics && !isLoadingAnalytics && (
        <div className="mb-6 space-y-6">
          {/* Chart Section Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-secondary-600" />
              {chartSectionTitle}
            </h2>
            <span className="text-sm text-gray-500">
              Based on {reportType.replace('-', ' ')} selection
            </span>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTickets}</p>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <ChartPieIcon className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.overallSlaComplianceRate)}%</p>
                  <p className="text-sm text-gray-500">SLA Compliance</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAgents}</p>
                  <p className="text-sm text-gray-500">Active Agents</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overdueTickets}</p>
                  <p className="text-sm text-gray-500">Overdue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Charts Grid based on report type */}
          <div className={`grid gap-6 ${relevantCharts.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {relevantCharts.filter(Boolean).map((chart, index) => (
              <React.Fragment key={index}>{chart}</React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Loading Analytics */}
      {isLoadingAnalytics && showCharts && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="flex flex-col items-center justify-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-secondary-600 mb-2" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-secondary-600 mb-4" />
            <p className="text-lg text-gray-700 font-medium">Generating your {reportType} report...</p>
            <p className="text-sm text-gray-500 mt-2">This may take up to 60 seconds</p>
          </div>
        </div>
      )}

      {/* Report Display */}
      {report && report.success && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
          {/* Report Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary-700 to-secondary-600 text-white print:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{report.reportTitle}</h2>
                <p className="text-gray-100 text-sm mt-1">
                  Generated: {new Date(report.generatedAt || '').toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors text-sm"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {report.executiveSummary && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Executive Summary</h3>
              <p className="text-gray-700">{report.executiveSummary}</p>
            </div>
          )}

          {/* Report Body */}
          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            {report.keyMetrics.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {report.keyMetrics.map((metric, i) => (
                    <div key={i} className="bg-white rounded-md p-3 border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">{metric}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sections */}
            {report.sections.map((section, i) => (
              <div key={i} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{section.content}</p>
                
                {section.highlights.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">Highlights</h4>
                    <ul className="space-y-1">
                      {section.highlights.map((h, j) => (
                        <li key={j} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="text-amber-500">★</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3">Recommendations</h3>
                <ol className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700">{rec}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Conclusion */}
            {report.conclusion && (
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Conclusion</h3>
                <p className="text-gray-600">{report.conclusion}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportsPage;
