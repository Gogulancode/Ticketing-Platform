import React from 'react';
import { 
  BarChart3, 
  Building, 
  TrendingUp,
  Clock,
  Ticket
} from 'lucide-react';
import { useTicketAnalytics, type DepartmentAnalytics } from '../hooks/useTicketAnalytics';

const DepartmentAnalyticsComponent: React.FC = () => {
  const { analytics, loading, error } = useTicketAnalytics();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200">
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <BarChart3 className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Total Tickets</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Active Departments</p>
              <p className="text-2xl font-bold text-green-600">{analytics.departmentBreakdown.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Top Department</p>
              <p className="text-lg font-bold text-orange-600">{analytics.topDepartments[0]?.department}</p>
              <p className="text-xs text-gray-500">{analytics.topDepartments[0]?.ticketCount} tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Tickets by Department
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Breakdown of ticket volume across all departments
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {analytics.departmentBreakdown.map((dept: DepartmentAnalytics) => (
              <div key={dept.department} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{dept.department}</h4>
                    <p className="text-sm text-gray-500">
                      {dept.ticketCount} tickets • {dept.percentage}% of total
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {dept.avgResolutionTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {dept.avgResolutionTime}d avg
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <span className="font-semibold text-gray-900 min-w-[3rem] text-right">
                    {dept.ticketCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Departments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Performing Departments
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Departments ranked by ticket volume
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topDepartments.slice(0, 6).map((dept: DepartmentAnalytics, index) => (
              <div 
                key={dept.department} 
                className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-200 bg-yellow-50' :
                  index === 1 ? 'border-gray-200 bg-gray-50' :
                  index === 2 ? 'border-orange-200 bg-orange-50' :
                  'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    index === 0 ? 'bg-yellow-200 text-yellow-800' :
                    index === 1 ? 'bg-gray-200 text-gray-800' :
                    index === 2 ? 'bg-orange-200 text-orange-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    #{index + 1}
                  </span>
                  <Building className="w-4 h-4 text-gray-400" />
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-1">{dept.department}</h4>
                <p className="text-2xl font-bold text-gray-900 mb-1">{dept.ticketCount}</p>
                <p className="text-xs text-gray-500">
                  {dept.percentage}% of total tickets
                </p>
                
                {dept.avgResolutionTime && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {dept.avgResolutionTime} days avg resolution
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalyticsComponent;
