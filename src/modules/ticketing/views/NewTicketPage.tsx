import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Paperclip, X, Zap, Bug, HelpCircle, Sparkles, CheckCircle } from 'lucide-react';
import { ticketsApi, TicketPriority, TicketCategory } from '../services/ticketsApi';
import { settingsApi, Department, TicketCategoryConfig, SubCategory, PriorityLevel, TicketStatusConfig } from '../../../shared/services/api/settingsApi';

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
  const [allSubcategories, setAllSubcategories] = useState<SubCategory[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<SubCategory[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    departmentId: '',
    priority: TicketPriority.Medium,
    statusId: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  // Quick action templates
  const quickActions = [
    { 
      icon: Bug, 
      label: 'Bug Report', 
      title: 'Bug Report: ',
      description: 'I encountered a bug with the following:\n\n• What happened:\n• Expected behavior:\n• Steps to reproduce:\n1. \n2. \n3. \n\n• Browser/System info:',
      category: 'bug-report',
      priority: TicketPriority.High
    },
    { 
      icon: Zap, 
      label: 'Technical Issue', 
      title: 'Technical Support: ',
      description: 'I need technical assistance with:\n\n• Issue description:\n• Error messages (if any):\n• When did this start:\n• What I\'ve tried:',
      category: 'technical-support',
      priority: TicketPriority.Medium
    },
    { 
      icon: Sparkles, 
      label: 'Feature Request', 
      title: 'Feature Request: ',
      description: 'I would like to request the following feature:\n\n• Feature description:\n• Business justification:\n• Expected benefit:\n• Priority level:',
      category: 'feature-request',
      priority: TicketPriority.Low
    },
    { 
      icon: HelpCircle, 
      label: 'General Question', 
      title: 'Question: ',
      description: 'I have a question about:\n\n• Topic:\n• Specific question:\n• Context or background:\n• What I\'ve already tried:',
      category: 'general-inquiry',
      priority: TicketPriority.Medium
    }
  ];

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
        setAllSubcategories(subCategoriesResponse);
        setPriorities(prioritiesResponse);
        
        // Set statuses and default to "New" status
        const statusData = statusesResponse.sort((a: TicketStatusConfig, b: TicketStatusConfig) => a.workflowOrder - b.workflowOrder);
        setStatuses(statusData);
        const defaultStatus = statusData.find((s: TicketStatusConfig) => s.name === 'New') || statusData[0];
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
      // Filter subcategories by categoryId from all available subcategories
      const filteredSubcategories = allSubcategories.filter(s => s.categoryId === categoryIdNum);
      setAvailableSubcategories(filteredSubcategories);
      
      // Reset subcategory when category changes and current subcategory is not valid
      if (formData.subcategoryId && !filteredSubcategories.find(s => s.id === parseInt(formData.subcategoryId))) {
        setFormData(prev => ({ ...prev, subcategoryId: '' }));
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
  }, [formData.categoryId, allSubcategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.subcategoryId || !formData.departmentId || !formData.statusId) {
      setError('Please fill in all required fields');
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
        categoryId: parseInt(formData.categoryId),
        subcategoryId: parseInt(formData.subcategoryId),
        departmentId: parseInt(formData.departmentId),
        statusId: parseInt(formData.statusId),
        attachments: attachments.length > 0 ? attachments : undefined
      });
      
      navigate('/tickets');
    } catch (err) {
      setError('Failed to create ticket. Please try again.');
      console.error('Error creating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      // Validate file size (max 10MB per file)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        setError(`Some files are too large. Maximum file size is 10MB. Oversized files: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      // Check total attachments limit (max 5 files)
      if (attachments.length + newFiles.length > 5) {
        setError('Maximum 5 files allowed per ticket.');
        return;
      }
      
      setAttachments(prev => [...prev, ...newFiles]);
      setError(null); // Clear any previous error
    }
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setFormData(prev => ({
      ...prev,
      title: action.title,
      description: action.description,
      priority: action.priority,
    }));
    
    // Try to find matching category by name pattern
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(action.category) ||
      action.category.includes(cat.name.toLowerCase())
    );
    
    if (matchingCategory) {
      setFormData(prev => ({
        ...prev,
        categoryId: matchingCategory.id.toString(),
      }));
    }
  };

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const requiredFields = ['title', 'description', 'categoryId', 'subcategoryId', 'departmentId', 'statusId'];
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && value.toString().trim() !== '';
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [formData]);

  return (
    <div className="text-sm leading-snug space-y-sm">
      <div className="max-w-4xl mx-auto p-sm">
        <div className="bg-white rounded-lg shadow-md p-sm">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-sm">
            <button
              onClick={() => navigate('/tickets')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold leading-tight text-gray-900">Create Ticket</h1>
                  <p className="text-sm text-gray-600 mt-xs">Submit a new support request</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Progress:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${formProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{formProgress}%</span>
                    {formProgress === 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-sm p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-sm">
            {/* Quick Actions */}
            <div className="bg-blue-50 rounded-lg p-sm space-y-sm">
              <h2 className="text-lg font-semibold leading-tight text-gray-900">Quick Start Templates</h2>
              <p className="text-sm text-gray-600">Choose a template to get started quickly, or create from scratch below.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center space-x-2 p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  >
                    <action.icon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-sm space-y-sm">
              <h2 className="text-lg font-semibold leading-tight text-gray-900">Basic Information</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-xs">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your issue"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-xs">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Describe your issue in detail..."
                  disabled={loading}
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-xs">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Include error messages, steps to reproduce, and expected vs actual behavior
                  </p>
                  <p className="text-xs text-gray-500">{formData.description.length}/2000 characters</p>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="bg-gray-50 rounded-lg p-sm space-y-sm">
              <h2 className="text-lg font-semibold leading-tight text-gray-900">Attachments</h2>
              <div className="space-y-3">
                {/* File Input */}
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    attachments.length >= 5 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex flex-col items-center justify-center py-3">
                      <Paperclip className={`w-6 h-6 mb-2 ${attachments.length >= 5 ? 'text-gray-300' : 'text-gray-500'}`} />
                      <p className={`text-sm ${attachments.length >= 5 ? 'text-gray-400' : 'text-gray-600'}`}>
                        {attachments.length >= 5 ? (
                          <span>Maximum files reached ({attachments.length}/5)</span>
                        ) : (
                          <span><span className="font-medium">Click to upload</span> or drag files here</span>
                        )}
                      </p>
                      <p className={`text-xs ${attachments.length >= 5 ? 'text-gray-400' : 'text-gray-500'}`}>
                        PNG, JPG, PDF, DOC up to 10MB each
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip"
                      disabled={loading || attachments.length >= 5}
                    />
                  </label>
                </div>

                {/* Selected Files List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected files ({attachments.length}):</p>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-blue-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          disabled={loading}
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Categorization & Assignment */}
            <div className="bg-gray-50 rounded-lg p-sm space-y-sm">
              <h2 className="text-lg font-semibold leading-tight text-gray-900">Categorization & Assignment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-xs">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                    required
                  >
                    <option value="">
                      {settingsLoading ? 'Loading...' : 'Select category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-xs">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                    required
                  >
                    <option value="">
                      {settingsLoading ? 'Loading...' : 'Select department'}
                    </option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id.toString()}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subcategory - Full width when visible */}
              {formData.categoryId && (
                <div>
                  <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 mb-xs">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    required
                  >
                    <option value="">Select subcategory</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-xs">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                  >
                    {settingsLoading ? (
                      <option>Loading...</option>
                    ) : (
                      priorities.map((priority) => (
                        <option key={priority.id} value={priority.level}>
                          {priority.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-xs">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="statusId"
                    value={formData.statusId}
                    onChange={(e) => handleInputChange('statusId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || settingsLoading}
                    required
                  >
                    <option value="">
                      {settingsLoading ? 'Loading...' : 'Select status'}
                    </option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id.toString()}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || settingsLoading || !formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.subcategoryId || !formData.departmentId || !formData.statusId}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {attachments.length > 0 ? 'Creating & Uploading...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Ticket {attachments.length > 0 && `(${attachments.length} files)`}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTicketPage;

