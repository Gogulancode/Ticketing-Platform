import React, { useState, useEffect, useCallback } from 'react';
import { Building, TrendingUp } from 'lucide-react';
import { API_CONFIG } from '../../../config/api';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

interface DepartmentData {
  departmentName: string;
  totalTickets: number;
  openCount: number;
  resolvedCount: number;
  inProgressCount: number;
}

interface WeeklyDepartmentWidgetProps {
  department?: string | null;
  showAllDepartments?: boolean;
}

const WeeklyDepartmentWidget: React.FC<WeeklyDepartmentWidgetProps> = ({ department, showAllDepartments = false }) => {
  const [data, setData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/department-analytics?days=7`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch department data');
      const result = await response.json();
      
      // Filter by department if specified (non-admin user)
      let filteredData = result.data || [];
      if (!showAllDepartments && department) {
        filteredData = filteredData.filter((dept: DepartmentData) => 
          dept.departmentName.toLowerCase() === department.toLowerCase()
        );
      }
      
      setData(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [department, showAllDepartments]);

  useEffect(() => {
    fetchDepartmentData();
  }, [fetchDepartmentData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Department Analysis</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Department Analysis</h3>
        </div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  const totalTickets = data.reduce((sum, dept) => sum + dept.totalTickets, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Department Analysis</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>{totalTickets} total tickets</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No department data available for this week
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="relative">
              {/* Bar chart */}
              <div className="flex items-end justify-around h-64 gap-4 px-4 py-6">
                {data.map((dept, index) => {
                  const maxTickets = Math.max(...data.map(d => d.totalTickets));
                  const heightPercent = (dept.totalTickets / maxTickets) * 100;
                  
                  // Clean solid colors for each bar
                  const colors = [
                    'bg-blue-500',
                    'bg-emerald-500',
                    'bg-purple-500',
                    'bg-orange-500',
                    'bg-pink-500',
                    'bg-cyan-500',
                    'bg-amber-500',
                    'bg-rose-500'
                  ];
                  
                  const barColor = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 h-full max-w-[100px]">
                      <div className="flex flex-col justify-end items-center w-full h-full">
                        <div 
                          className={`w-full ${barColor} rounded-t transition-all duration-300 flex items-end justify-center pb-2`}
                          style={{ height: `${heightPercent}%`, minHeight: dept.totalTickets > 0 ? '30px' : '0' }}
                        >
                          <span className="text-white text-sm font-semibold">
                            {dept.totalTickets}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 text-center font-medium mt-3 w-full">
                        {dept.departmentName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {data.map((dept, index) => {
              // Match the legend dot color with the bar color
              const dotColors = [
                'bg-blue-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-cyan-500',
                'bg-amber-500',
                'bg-rose-500'
              ];
              
              const dotColor = dotColors[index % dotColors.length];
              
              return (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 ${dotColor} rounded-full shadow-sm`}></div>
                    <span className="font-medium text-gray-900">{dept.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-600">{dept.openCount} open</span>
                    <span className="text-amber-600">{dept.inProgressCount} in progress</span>
                    <span className="text-green-600">{dept.resolvedCount} resolved</span>
                    <span className="font-medium text-gray-900">{dept.totalTickets} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDepartmentWidget;