import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { ticketsApi, TicketPriority, TicketCategory } from '../services/ticketsApi';
import { settingsApi, Department, TicketCategoryConfig, SubCategory, PriorityLevel, TicketStatusConfig } from '../../../shared/services/api/settingsApi';

type SimpleTicketFormData = {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  departmentId: string;
  priority: TicketPriority;
  statusId: string;
};

// Helper function to map our new category system to the old enum
const mapCategoryToEnum = (categoryId: string): TicketCategory => {
  const categoryIdNum = parseInt(categoryId);
  switch (categoryIdNum) {
    case 1:
      return TicketCategory.TechnicalSupport;
    case 2:
      return TicketCategory.BugReport;
    case 3:
      return TicketCategory.GeneralInquiry;
    case 4:
      return TicketCategory.FeatureRequest;
    default:
      return TicketCategory.GeneralInquiry;
  }
};

// Helper function to map priority name to backend enum value
const mapPriorityNameToEnum = (priorityName: string): TicketPriority => {
  const normalizedName = priorityName.toLowerCase().trim();
  switch (normalizedName) {
    case 'low':
    case 'very low':
      return TicketPriority.Low;
    case 'medium':
    case 'normal':
      return TicketPriority.Medium;
    case 'high':
      return TicketPriority.High;
    case 'critical':
    case 'urgent':
      return TicketPriority.Critical;
    default:
      return TicketPriority.Medium;
  }
};

const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings data
  const [categories, setCategories] = useState<TicketCategoryConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [statuses, setStatuses] = useState<TicketStatusConfig[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<SubCategory[]>([]);
  
  const [formData, setFormData] = useState<SimpleTicketFormData>({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    departmentId: '',
    priority: TicketPriority.Medium,
    statusId: '',
  });

  // Load settings data on component mount
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setSettingsLoading(true);
        const [deptResponse, categoriesResponse, subCategoriesResponse, prioritiesResponse, statusesResponse] = await Promise.all([
          settingsApi.getDepartments(),
          settingsApi.getTicketCategories(),
          settingsApi.getSubCategories(),
          settingsApi.getPriorityLevels(),
          settingsApi.getTicketStatuses()
        ]);
        
        setDepartments(deptResponse);
        setCategories(categoriesResponse);
        setAvailableSubcategories(subCategoriesResponse);
        setPriorities(prioritiesResponse);
        
        // Set statuses and default to "New" status
        const statusData = statusesResponse.sort((a: TicketStatusConfig, b: TicketStatusConfig) => a.workflowOrder - b.workflowOrder);
        setStatuses(statusData);
        // Use the status marked as default, or fall back to the first status
        const defaultStatus = statusData.find((s: TicketStatusConfig) => s.isDefault) || statusData[0];
        if (defaultStatus) {
          setFormData(prev => ({ ...prev, statusId: defaultStatus.id.toString() }));
        }
      } catch (error) {
        setError('Failed to load form data');
        console.error('Error loading settings data:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettingsData();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const categoryIdNum = parseInt(formData.categoryId);
      const category = categories.find(c => c.id === categoryIdNum);
      if (category) {
        setAvailableSubcategories(category.subCategories || []);
        // Reset subcategory when category changes
        if (formData.subcategoryId && !category.subCategories?.find(s => s.id === parseInt(formData.subcategoryId))) {
          setFormData(prev => ({ ...prev, subcategoryId: '' }));
        }
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.categoryId, formData.subcategoryId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.subcategoryId || !formData.departmentId || !formData.statusId) {
      setError('Please fill in all required fields (title, description, category, subcategory, department, and status)');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await ticketsApi.createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: mapCategoryToEnum(formData.categoryId),
        priority: formData.priority,
        // TODO: Update API to support subcategoryId, departmentId
      });
      
      navigate('/tickets');
    } catch (err) {
      setError('Failed to create ticket. Please try again.');
      console.error('Error creating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof SimpleTicketFormData>(field: K, value: SimpleTicketFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tickets')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
              <p className="text-gray-600">Fill in the details below to create a support ticket</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-gray-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Help Text */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Settings Integration</h3>
          <p className="text-sm text-gray-700">
            All dropdown options below are automatically loaded from your Settings page configuration. 
            Visit <span className="font-mono">Settings → Ticket Settings</span> to manage departments, categories, priorities, and statuses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-gray-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter a brief title for your ticket"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical"
                placeholder="Provide a detailed description of your issue or request"
                disabled={loading}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
            </div>

            {/* Settings-based fields */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-gray-500">*</span>
                  {settingsLoading ? (
                    <span className="text-sm text-gray-500 ml-2">(Loading...)</span>
                  ) : (
                    <span className="text-sm text-gray-500 ml-2">({categories.length} available from Settings)</span>
                  )}
                </label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading || settingsLoading}
                  required
                >
                  <option value="">
                    {settingsLoading ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name} - {category.description || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {formData.categoryId && (
                <div>
                  <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory <span className="text-gray-500">*</span>
                    <span className="text-sm text-gray-500 ml-2">({availableSubcategories.length} available)</span>
                  </label>
                  <select
                    id="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={loading}
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department */}
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-gray-500">*</span>
                  {settingsLoading ? (
                    <span className="text-sm text-gray-500 ml-2">(Loading...)</span>
                  ) : (
                    <span className="text-sm text-gray-500 ml-2">({departments.length} available from Settings)</span>
                  )}
                </label>
                <select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => handleInputChange('departmentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading || settingsLoading}
                  required
                >
                  <option value="">
                    {settingsLoading ? 'Loading departments...' : 'Select your department'}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id.toString()}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                    {settingsLoading ? (
                      <span className="text-sm text-gray-500 ml-2">(Loading...)</span>
                    ) : (
                      <span className="text-sm text-gray-500 ml-2">({priorities.length} available from Settings)</span>
                    )}
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                  >
                    {settingsLoading ? (
                      <option>Loading priorities...</option>
                    ) : (
                      priorities.map((priority) => (
                        <option key={priority.id} value={mapPriorityNameToEnum(priority.name)}>
                          {priority.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Current priority: <span style={{ color: priorities.find(p => mapPriorityNameToEnum(p.name) === formData.priority)?.color || '#6b7280' }}>
                      {priorities.find(p => mapPriorityNameToEnum(p.name) === formData.priority)?.name || 'Medium'}
                    </span>
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-gray-500">*</span>
                    {settingsLoading ? (
                      <span className="text-sm text-gray-500 ml-2">(Loading...)</span>
                    ) : (
                      <span className="text-sm text-gray-500 ml-2">({statuses.length} available from Settings)</span>
                    )}
                  </label>
                  <select
                    id="statusId"
                    value={formData.statusId}
                    onChange={(e) => handleInputChange('statusId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                    required
                  >
                    <option value="">
                      {settingsLoading ? 'Loading statuses...' : 'Select a status'}
                    </option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id.toString()}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Current status: <span style={{ color: statuses.find(s => s.id.toString() === formData.statusId)?.color || '#6b7280' }}>
                      {statuses.find(s => s.id.toString() === formData.statusId)?.name || 'Not selected'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || settingsLoading || !formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.subcategoryId || !formData.departmentId || !formData.statusId}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketPage;
