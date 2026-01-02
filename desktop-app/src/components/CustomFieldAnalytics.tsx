import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface CustomFieldAnalyticsProps {
  days?: number;
  className?: string;
  categoryIds?: number[];
}

interface CustomFieldValueStats {
  value: string;
  totalTickets: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  resolutionRate: number;
}

interface CustomFieldDetail {
  fieldName: string;
  values: CustomFieldValueStats[];
}

interface SubcategoryAnalytics {
  subcategoryName: string;
  totalTickets: number;
  customFields: CustomFieldDetail[];
}

interface CategoryAnalytics {
  categoryName: string;
  totalTickets: number;
  subcategories: SubcategoryAnalytics[];
}

interface CustomFieldAnalyticsResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCategories: number;
    totalTickets: number;
    totalRecords: number;
  };
  data: CategoryAnalytics[];
}

const CustomFieldAnalytics: React.FC<CustomFieldAnalyticsProps> = ({ 
  days = 7, 
  className = '',
  categoryIds = []
}) => {
  const { serverUrl, token } = useAuthStore();
  const [data, setData] = useState<CustomFieldAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Build URL with category filter if provided
        const params = new URLSearchParams({ days: days.toString() });
        if (categoryIds.length > 0) {
          params.append('categoryIds', categoryIds.join(','));
        }
        
        const response = await fetch(`${serverUrl}/api/tickets-v2/custom-fields/analytics?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        let result = await response.json();
        
        // Client-side filtering as fallback if API doesn't support categoryIds
        if (categoryIds.length > 0 && result.data) {
          // Get category names for the provided IDs (if not already filtered by API)
          const catResponse = await fetch(`${serverUrl}/api/tickets/settings/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (catResponse.ok) {
            const categories = await catResponse.json();
            const allowedCategoryNames = categories
              .filter((c: any) => categoryIds.includes(c.id))
              .map((c: any) => c.name.toLowerCase());
            
            // Filter data to only include allowed categories
            result.data = result.data.filter((cat: CategoryAnalytics) => 
              allowedCategoryNames.includes(cat.categoryName.toLowerCase())
            );
            
            // Recalculate summary
            const totalTickets = result.data.reduce((sum: number, cat: CategoryAnalytics) => sum + cat.totalTickets, 0);
            result.summary = {
              ...result.summary,
              totalCategories: result.data.length,
              totalTickets
            };
          }
        }
        
        setData(result);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days, serverUrl, token, categoryIds]);

  const getStatusBadge = (type: 'open' | 'inProgress' | 'resolved' | 'closed', count: number) => {
    const badges: Record<'open' | 'inProgress' | 'resolved' | 'closed', string> = {
      open: 'bg-red-100 text-gray-800',
      inProgress: 'bg-yellow-100 text-yellow-800', 
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[type]}`}>
        {count}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <BarChart3 className="h-5 w-5 text-gray-600" />
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <AlertCircle className="h-5 w-5 text-gray-600" />
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm">Analytics not available</p>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <BarChart3 className="h-5 w-5 text-gray-600" />
        </div>
        <div className="text-center py-6">
          <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No custom field data found for the last {days} days</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <p className="text-sm text-gray-500">
            {data.dateRange.startDate} to {data.dateRange.endDate} ({days} days)
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-gray-600" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{data.summary.totalCategories}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.summary.totalTickets}</div>
          <div className="text-sm text-green-600">Total Tickets</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.summary.totalRecords}</div>
          <div className="text-sm text-purple-600">Unique Values</div>
        </div>
      </div>

      {/* Data by Category */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {data.data.map((category, catIndex) => (
          <div key={catIndex} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">{category.categoryName}</h4>
                <span className="text-sm font-medium text-gray-600">{category.totalTickets} tickets</span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {category.subcategories.map((subcategory, subIndex) => (
                <div key={subIndex} className="bg-red-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-900">{subcategory.subcategoryName}</span>
                    <span className="text-sm text-gray-700">{subcategory.totalTickets} tickets</span>
                  </div>
                  
                  <div className="space-y-2">
                    {subcategory.customFields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="bg-white rounded border border-red-200 p-3">
                        <div className="font-medium text-gray-900 mb-2">{field.fieldName}</div>
                        
                        <div className="space-y-2">
                          {field.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800">{value.value}</span>
                                <span className="text-gray-500">({value.totalTickets} tickets)</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {getStatusBadge('open', value.openCount)}
                                {getStatusBadge('inProgress', value.inProgressCount)}
                                {getStatusBadge('resolved', value.resolvedCount)}
                                {getStatusBadge('closed', value.closedCount)}
                                <span className="text-xs font-medium text-green-600">
                                  {value.resolutionRate}% resolved
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomFieldAnalytics;
