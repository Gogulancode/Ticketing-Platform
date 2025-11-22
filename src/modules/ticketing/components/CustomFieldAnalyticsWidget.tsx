import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, Circle, Folder, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { customFieldAnalyticsApi, CustomFieldAnalytics, Category, Subcategory, CustomField, CustomFieldValue } from '../services/customFieldAnalyticsApi';

interface CustomFieldAnalyticsWidgetProps {
  days?: number;
  className?: string;
}

const CustomFieldAnalyticsWidget: React.FC<CustomFieldAnalyticsWidgetProps> = ({ 
  days = 7, 
  className = '' 
}) => {
  const [analytics, setAnalytics] = useState<CustomFieldAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`📊 Loading custom field analytics for ${days} days...`);
        
        const data = await customFieldAnalyticsApi.getCustomFieldAnalytics(days);
        console.log('✅ Custom field analytics loaded:', data);
        setAnalytics(data);
        
        // Auto-expand first category and subcategory for better UX
        if (data.categorizedResults.length > 0) {
          const firstCategory = data.categorizedResults[0];
          setExpandedCategories(new Set([firstCategory.categoryName]));
          if (firstCategory.subcategories.length > 0) {
            setExpandedSubcategories(new Set([`${firstCategory.categoryName}-${firstCategory.subcategories[0].subcategoryName}`]));
          }
        }
      } catch (err) {
        console.error('❌ Failed to load custom field analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [days]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (categoryName: string, subcategoryName: string) => {
    const key = `${categoryName}-${subcategoryName}`;
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubcategories(newExpanded);
  };

  const getStatusIcon = (type: 'resolved' | 'open' | 'inProgress' | 'closed') => {
    switch (type) {
      case 'resolved':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'open':
        return <Circle className="h-3 w-3 text-blue-500" />;
      case 'inProgress':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (type: 'resolved' | 'open' | 'inProgress' | 'closed') => {
    switch (type) {
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'open':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'inProgress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderCustomFieldValue = (value: CustomFieldValue, fieldName: string) => (
    <div key={`${fieldName}-${value.value}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{value.value}</span>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{value.totalTickets}</div>
          <div className="text-xs text-gray-500">tickets</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
        <div className={`px-2 py-1 rounded border text-center ${getStatusColor('open')}`}>
          <div className="flex items-center justify-center space-x-1">
            {getStatusIcon('open')}
            <span>{value.openCount}</span>
          </div>
          <div className="text-xs opacity-75">Open</div>
        </div>
        <div className={`px-2 py-1 rounded border text-center ${getStatusColor('inProgress')}`}>
          <div className="flex items-center justify-center space-x-1">
            {getStatusIcon('inProgress')}
            <span>{value.inProgressCount}</span>
          </div>
          <div className="text-xs opacity-75">Progress</div>
        </div>
        <div className={`px-2 py-1 rounded border text-center ${getStatusColor('resolved')}`}>
          <div className="flex items-center justify-center space-x-1">
            {getStatusIcon('resolved')}
            <span>{value.resolvedCount}</span>
          </div>
          <div className="text-xs opacity-75">Resolved</div>
        </div>
        <div className={`px-2 py-1 rounded border text-center ${getStatusColor('closed')}`}>
          <div className="flex items-center justify-center space-x-1">
            {getStatusIcon('closed')}
            <span>{value.closedCount}</span>
          </div>
          <div className="text-xs opacity-75">Closed</div>
        </div>
      </div>
      
      {/* Resolution rate bar */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Resolution Rate</span>
          <span className="font-semibold">{value.resolutionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${value.resolutionRate}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderCustomField = (field: CustomField) => (
    <div key={field.customFieldId} className="bg-white rounded-lg border border-gray-300 p-4 ml-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h5 className="font-semibold text-gray-900">{field.customFieldLabel}</h5>
          <p className="text-sm text-gray-500">{field.customFieldName}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-purple-600">{field.totalTickets}</div>
          <div className="text-xs text-gray-500">total tickets</div>
        </div>
      </div>

      <div className="space-y-3">
        {field.values.map((value) => renderCustomFieldValue(value, field.customFieldName))}
      </div>
    </div>
  );

  const renderSubcategory = (subcategory: Subcategory, categoryName: string) => {
    const subcategoryKey = `${categoryName}-${subcategory.subcategoryName}`;
    const isExpanded = expandedSubcategories.has(subcategoryKey);

    return (
      <div key={subcategoryKey} className="ml-6">
        <div 
          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => toggleSubcategory(categoryName, subcategory.subcategoryName)}
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
            <FolderOpen className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">{subcategory.subcategoryName}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{subcategory.totalTickets}</div>
            <div className="text-xs text-blue-500">{subcategory.customFields.length} custom fields</div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {subcategory.customFields.map(renderCustomField)}
          </div>
        )}
      </div>
    );
  };

  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories.has(category.categoryName);

    return (
      <div key={category.categoryName} className="border border-gray-300 rounded-lg overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => toggleCategory(category.categoryName)}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-600" /> : <ChevronRight className="h-5 w-5 text-gray-600" />}
            <Folder className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900 text-lg">{category.categoryName}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-700">{category.totalTickets}</div>
            <div className="text-sm text-gray-500">{category.subcategories.length} subcategories</div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4 bg-white">
            {category.subcategories.map(subcategory => renderSubcategory(subcategory, category.categoryName))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Custom Field Analytics</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Custom Field Analytics</h3>
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Failed to load custom field analytics</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.categorizedResults.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Custom Field Analytics</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No custom field data available</p>
          <p className="text-sm text-gray-500">
            No tickets with custom fields found for the last {days} days
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Custom Field Analytics</h3>
          <p className="text-sm text-gray-500">
            {analytics.dateRange.startDate} to {analytics.dateRange.endDate} ({days} days)
          </p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{analytics.summary.totalCategories}</div>
          <div className="text-xs text-blue-600">Categories</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{analytics.summary.totalCustomFields}</div>
          <div className="text-xs text-purple-600">Custom Fields</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{analytics.summary.totalUniqueValues}</div>
          <div className="text-xs text-green-600">Unique Values</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-orange-600">{analytics.summary.totalTicketsWithCustomFields}</div>
          <div className="text-xs text-orange-600">Total Tickets</div>
        </div>
      </div>

      {/* Hierarchical Display */}
      <div className="space-y-4">
        {analytics.categorizedResults.map(renderCategory)}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">How to Read This Data:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Categories</strong> (e.g., Software, Hardware) contain subcategories</li>
          <li>• <strong>Subcategories</strong> (e.g., Software Issues, Hardware Problems) have specific custom fields</li>
          <li>• <strong>Custom Fields</strong> (e.g., Software Name, Issue Type) show their different values</li>
          <li>• <strong>Values</strong> (e.g., FA, LT) show ticket counts and status breakdown</li>
          <li>• Click on categories/subcategories to expand and see details</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomFieldAnalyticsWidget;