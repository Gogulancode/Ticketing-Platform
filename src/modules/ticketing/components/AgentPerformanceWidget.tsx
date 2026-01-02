import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { API_CONFIG } from '../../../config/api';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

interface AgentPerformance {
  agentName: string;
  agentEmail: string;
  totalTickets: number;
  openCount: number;
  resolvedCount: number;
  inProgressCount: number;
  avgResolutionTime: string;
  resolutionRate: number;
  department?: string;
}

interface AgentPerformanceWidgetProps {
  department?: string | null;
  categoryIds?: number[];
}

const PLACEHOLDER_NAME_REGEX = /^agent\s+\d+$/i;

const getAgentDisplayName = (agent: AgentPerformance) => {
  const trimmedName = agent.agentName?.trim();
  if (trimmedName && !PLACEHOLDER_NAME_REGEX.test(trimmedName)) {
    return trimmedName;
  }

  if (agent.agentEmail) {
    const localPart = agent.agentEmail.split('@')[0];
    if (localPart) {
      return localPart.replace(/\./g, ' ');
    }
    return agent.agentEmail;
  }

  return 'Unassigned Agent';
};

// Empty array constant to avoid creating new references on each render
const EMPTY_CATEGORY_IDS: number[] = [];

const AgentPerformanceWidget: React.FC<AgentPerformanceWidgetProps> = ({ department, categoryIds }) => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use stable reference for categoryIds - fallback to constant empty array
  const stableCategoryIds = categoryIds ?? EMPTY_CATEGORY_IDS;
  
  // Use ref to track the categoryIds to avoid infinite re-renders on array comparison
  const categoryIdsRef = useRef<string>(JSON.stringify(stableCategoryIds));
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchAgentPerformance = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      
      // Parse categoryIds from the stable ref
      const currentCategoryIds = JSON.parse(categoryIdsRef.current) as number[];
      
      // Build URL with category filter if provided (for Category Admins)
      const params = new URLSearchParams({ days: '7' });
      if (currentCategoryIds.length > 0) {
        params.append('categoryIds', currentCategoryIds.join(','));
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/agent-performance?${params}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        // If API fails, show a message instead of mock data
        throw new Error('Agent performance data unavailable');
      }
      const result = await response.json();
      
      // Filter by department if specified (non-admin user)
      let filteredAgents = result.data || [];
      if (department) {
        const hasDepartmentInfo = filteredAgents.some((agent: AgentPerformance) => agent.department);
        if (hasDepartmentInfo) {
          filteredAgents = filteredAgents.filter((agent: AgentPerformance) => 
            agent.department?.toLowerCase() === department.toLowerCase()
          );
        }
      }
      
      setAgents(filteredAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Set empty array instead of mock data
      setAgents([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [department]);

  // Update the ref when categoryIds actually change (by value) and fetch
  useEffect(() => {
    const newCategoryIdsString = JSON.stringify(stableCategoryIds);
    const categoryIdsChanged = categoryIdsRef.current !== newCategoryIdsString;
    
    // Update ref if changed
    if (categoryIdsChanged) {
      categoryIdsRef.current = newCategoryIdsString;
    }
    
    // Only fetch if: first mount OR categoryIds actually changed by value
    if (!hasFetchedRef.current || categoryIdsChanged) {
      hasFetchedRef.current = true;
      fetchAgentPerformance();
    }
  }, [stableCategoryIds, fetchAgentPerformance]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance (7 days)</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance (7 days)</h3>
        </div>
        <div className="text-gray-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance (7 days)</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>{agents.length} active agents</span>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No agent performance data available
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {agents.map((agent, index) => {
            const displayName = getAgentDisplayName(agent);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                      <h4 className="font-medium text-gray-900">{displayName}</h4>
                      <p className="text-sm text-gray-600">{agent.agentEmail}</p>
                      {agent.department && (
                        <p className="text-xs text-gray-500">{agent.department}</p>
                      )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(agent.resolutionRate)}`}>
                  {agent.resolutionRate}% resolved
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.totalTickets}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Total Tickets
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{agent.openCount}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Open
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{agent.resolvedCount}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{agent.avgResolutionTime}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Avg Time
                  </div>
                </div>
              </div>

              {/* Progress bar for resolution rate */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${agent.resolutionRate}%` }}
                  ></div>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentPerformanceWidget;