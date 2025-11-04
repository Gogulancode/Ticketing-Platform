import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, Circle } from 'lucide-react';
import { API_CONFIG } from '../../../config/api';

interface CustomFieldAnalyticsProps {
  days?: number;
  className?: string;
}

const QuickCustomFieldAnalytics: React.FC<CustomFieldAnalyticsProps> = ({ 
  days = 7, 
  className = '' 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📊 Loading custom field analytics...');
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/custom-fields/analytics?days=${days}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Analytics loaded:', result);
        setData(result);
      } catch (err) {
        console.error('❌ Failed to load analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  const getStatusBadge = (type: string, count: number) => {
    const badges = {
      open: 'bg-blue-100 text-blue-800',
      inProgress: 'bg-yellow-100 text-yellow-800', 
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[type as keyof typeof badges]}`}>
        {count}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <BarChart3 className="h-5 w-5 text-blue-600" />
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
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="text-center py-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Field Analytics</h3>
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No custom field data found for the last {days} days</p>
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
        <TrendingUp className="h-5 w-5 text-blue-600" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.summary.totalCategories}</div>
          <div className="text-sm text-blue-600">Categories</div>
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
      <div className="space-y-4">
        {data.data.map((category: any, catIndex: number) => (
          <div key={catIndex} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">{category.categoryName}</h4>
                <span className="text-sm font-medium text-gray-600">{category.totalTickets} tickets</span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {category.subcategories.map((subcategory: any, subIndex: number) => (
                <div key={subIndex} className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-blue-900">{subcategory.subcategoryName}</span>
                    <span className="text-sm text-blue-700">{subcategory.totalTickets} tickets</span>
                  </div>
                  
                  <div className="space-y-2">
                    {subcategory.customFields.map((field: any, fieldIndex: number) => (
                      <div key={fieldIndex} className="bg-white rounded border border-blue-200 p-3">
                        <div className="font-medium text-gray-900 mb-2">{field.fieldName}</div>
                        
                        <div className="space-y-2">
                          {field.values.map((value: any, valueIndex: number) => (
                            <div key={valueIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <span className="font-semibold text-gray-800">{value.value}</span>
                                <span className="text-sm text-gray-500">({value.totalTickets} tickets)</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {getStatusBadge('open', value.openCount)}
                                {getStatusBadge('inProgress', value.inProgressCount)}
                                {getStatusBadge('resolved', value.resolvedCount)}
                                {getStatusBadge('closed', value.closedCount)}
                                <span className="text-sm font-medium text-green-600">
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

export default QuickCustomFieldAnalytics;