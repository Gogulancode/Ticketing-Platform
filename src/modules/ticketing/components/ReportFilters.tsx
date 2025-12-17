import React, { useState } from 'react';
import { Calendar, Search, Filter, RefreshCw } from 'lucide-react';
import { ReportFilters } from '../services/reportsApi';

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onRefresh?: () => void;
  loading?: boolean;
  showExport?: boolean;
  showDateRange?: boolean;
  showSearch?: boolean;
  showStatusFilter?: boolean;
  customFilters?: React.ReactNode;
}

const ReportFiltersComponent: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  loading = false,
  showExport = true,
  showDateRange = true,
  showSearch = true,
  showStatusFilter = true,
  customFilters
}) => {
  const [localFilters, setLocalFilters] = useState<ReportFilters>(filters);
  const [showFilters, setShowFilters] = useState(false);

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thismonth' },
    { label: 'Last Month', value: 'lastmonth' },
    { label: 'Last 90 Days', value: 'last90days' },
    { label: 'Custom Range', value: 'custom' }
  ];

  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const categories = ['Technical', 'Hardware', 'Software', 'Network', 'General'];
  const departments = ['IT', 'Support', 'Development', 'Operations'];

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    const dates = { startDate: '', endDate: '' };

    switch (range) {
      case 'today':
        dates.startDate = today.toISOString().split('T')[0];
        dates.endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        dates.startDate = yesterday.toISOString().split('T')[0];
        dates.endDate = yesterday.toISOString().split('T')[0];
        break;
      }
      case 'last7days': {
        const week = new Date(today);
        week.setDate(today.getDate() - 7);
        dates.startDate = week.toISOString().split('T')[0];
        dates.endDate = today.toISOString().split('T')[0];
        break;
      }
      case 'last30days': {
        const month = new Date(today);
        month.setDate(today.getDate() - 30);
        dates.startDate = month.toISOString().split('T')[0];
        dates.endDate = today.toISOString().split('T')[0];
        break;
      }
      case 'thismonth':
        dates.startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dates.endDate = today.toISOString().split('T')[0];
        break;
      case 'lastmonth': {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        dates.startDate = lastMonth.toISOString().split('T')[0];
        dates.endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
      }
      case 'last90days': {
        const quarter = new Date(today);
        quarter.setDate(today.getDate() - 90);
        dates.startDate = quarter.toISOString().split('T')[0];
        dates.endDate = today.toISOString().split('T')[0];
        break;
      }
      default:
        break;
    }

    if (range !== 'custom') {
      const newFilters = { ...localFilters, ...dates };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ReportFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Quick Date Ranges */}
        {showDateRange && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select Date Range</option>
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'border-red-500 bg-red-50 text-gray-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {Object.values(localFilters).filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}

        {/* Export Dropdown */}
        {showExport && onExport && (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onExport(e.target.value as 'csv' | 'excel' | 'pdf');
                  e.target.value = '';
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Export Report</option>
              <option value="csv">Export as CSV</option>
              <option value="excel">Export as Excel</option>
              <option value="pdf">Export as PDF</option>
            </select>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          {/* Date Range Inputs */}
          {showDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={localFilters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            {showStatusFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={localFilters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Filters */}
          {customFilters && (
            <div className="border-t pt-4">
              {customFilters}
            </div>
          )}

          {/* Filter Actions */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFiltersComponent;