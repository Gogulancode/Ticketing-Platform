import React, { useState } from 'react';
import { SparklesIcon, LightBulbIcon, ArrowPathIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { generateDashboardInsights, DashboardInsightsRequest, DashboardInsightsResponse } from '../../../api/aiApi';

interface AIInsightsWidgetProps {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  avgResolutionHours: number;
  categoryBreakdown?: Array<{ category: string; count: number; percentage: number }>;
  departmentBreakdown?: Array<{ department: string; count: number; avgResolutionHours: number }>;
  topAgents?: Array<{ agentName: string; ticketsResolved: number; avgResolutionHours: number }>;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
  totalTickets,
  openTickets,
  resolvedTickets,
  overdueTickets,
  avgResolutionHours,
  categoryBreakdown = [],
  departmentBreakdown = [],
  topAgents = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: DashboardInsightsRequest = {
        totalTickets,
        openTickets,
        resolvedTickets,
        overdueTickets,
        avgResolutionHours,
        categoryBreakdown,
        departmentBreakdown,
        topAgents,
        period: 'week',
      };

      const result = await generateDashboardInsights(request);
      
      if (result.success) {
        setInsights(result);
        setIsExpanded(true);
      } else {
        setError(result.errorMessage || 'Failed to generate insights');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-gray-700 rounded-full">
              Powered by DeepSeek
            </span>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <LightBulbIcon className="h-4 w-4" />
                Generate Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-gray-700 text-sm">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-3 text-gray-600">Analyzing your ticket data with AI...</span>
          </div>
        )}

        {!isLoading && !insights && !error && (
          <div className="text-center py-8 text-gray-500">
            <LightBulbIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Click "Generate Insights" to get AI-powered analysis of your ticket data</p>
            <p className="text-xs mt-2 text-gray-400">Uses advanced reasoning for comprehensive analysis</p>
          </div>
        )}

        {insights && insights.success && (
          <div className="space-y-4">
            {/* Summary */}
            {insights.summary && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-gray-700">{insights.summary}</p>
              </div>
            )}

            {/* Expandable Sections */}
            <div className={`space-y-3 ${!isExpanded ? 'hidden' : ''}`}>
              {/* Key Insights */}
              {insights.keyInsights.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <LightBulbIcon className="h-4 w-4 text-amber-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {insights.keyInsights.map((insight, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trends */}
              {insights.trends.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    Trends
                  </h4>
                  <ul className="space-y-1">
                    {insights.trends.map((trend, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">↗</span>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-500 mt-1">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alerts */}
              {insights.alerts.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
                    Alerts
                  </h4>
                  <ul className="space-y-1">
                    {insights.alerts.map((alert, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-red-50 p-2 rounded">
                        <span className="text-gray-500 mt-1">⚠</span>
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsWidget;
