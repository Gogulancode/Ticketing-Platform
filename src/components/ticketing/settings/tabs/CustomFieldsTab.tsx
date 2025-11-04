import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { settingsApi } from '../../../../shared/services/api/settingsApi';
import type { CustomField, TicketCategoryConfig } from '../../../../shared/services/api/settingsApi';

interface CustomFieldFormData {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime' | 'select' | 'radio' | 'checkbox' | 'file';
  categoryId?: number;
  subCategoryId?: number;
  options?: string[];
  placeholder?: string;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
  };
}

interface CustomFieldFilter {
  categoryId?: number;
  subCategoryId?: number;
  search?: string;
}

const CustomFieldsTab: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [filters, setFilters] = useState<CustomFieldFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<CustomFieldFormData>({
    name: '',
    label: '',
    type: 'text',
    isRequired: false,
    isActive: true,
    displayOrder: 0,
    options: []
  });

  // Queries
  const { data: customFields = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customFields', filters],
    queryFn: async () => {
      console.log('[CustomFields] Fetching with filters:', filters);
      const result = await settingsApi.getCustomFields(filters.categoryId, filters.subCategoryId);
      console.log('[CustomFields] API response:', result);
      return result;
    },
    enabled: true
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => settingsApi.getTicketCategories(),
    enabled: true
  });

  const { data: subCategoriesData = [] } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: () => formData.categoryId ? settingsApi.getSubCategories(formData.categoryId) : Promise.resolve([]),
    enabled: !!formData.categoryId
  });



  // Helper functions for options management
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  // Initialize options array when field type changes to select/radio/checkbox
  React.useEffect(() => {
    if (['select', 'radio', 'checkbox'].includes(formData.type) && (!formData.options || formData.options.length === 0)) {
      setFormData(prev => ({
        ...prev,
        options: ['Option 1', 'Option 2']
      }));
    }
  }, [formData.type]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (customField: Omit<CustomField, 'id'>) => {
      console.log('[CustomFields] Creating field:', customField);
      const result = await settingsApi.createCustomField(customField);
      console.log('[CustomFields] Create result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[CustomFields] Create success:', data);
      toast.success('Custom field created successfully');
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('[CustomFields] Create error:', error);
      toast.error(`Failed to create custom field: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...customField }: CustomField) => settingsApi.updateCustomField(id, customField),
    onSuccess: () => {
      toast.success('Custom field updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      setShowModal(false);
      setEditingField(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update custom field: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsApi.deleteCustomField(id),
    onSuccess: () => {
      toast.success('Custom field deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete custom field: ${error.message}`);
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: 'text',
      isRequired: false,
      isActive: true,
      displayOrder: 0,
      options: []
    });
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type as any,
      categoryId: field.categoryId || undefined,
      subCategoryId: field.subCategoryId || undefined,
      options: field.options || [],
      placeholder: field.placeholder || '',
      isRequired: field.isRequired,
      isActive: field.isActive,
      displayOrder: field.displayOrder,
      validationRules: field.validationRules || {}
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customFieldData: Omit<CustomField, 'id'> = {
      name: formData.name,
      label: formData.label,
      type: formData.type,
      categoryId: formData.categoryId || undefined,
      subCategoryId: formData.subCategoryId || undefined,
      options: formData.options,
      placeholder: formData.placeholder || undefined,
      isRequired: formData.isRequired,
      isActive: formData.isActive,
      displayOrder: formData.displayOrder,
      validationRules: formData.validationRules || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingField) {
      updateMutation.mutate({ ...customFieldData, id: editingField.id });
    } else {
      createMutation.mutate(customFieldData);
    }
  };

  const filteredFields = customFields.filter((field: CustomField) => {
    if (searchTerm && !field.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !field.label.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Custom Fields</h2>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              setEditingField(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Field
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Custom Fields List */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading custom fields...</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No custom fields found. Create your first custom field to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFields.map((field: CustomField) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{field.label}</div>
                        <div className="text-sm text-gray-500">{field.name}</div>
                        {field.placeholder && (
                          <div className="text-xs text-gray-400">Placeholder: {field.placeholder}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {field.type}
                      </span>
                      {field.isRequired && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        field.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {field.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(field)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingField ? 'Edit Custom Field' : 'Add Custom Field'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingField(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="field_name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Field Label"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Field Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <optgroup label="Text Fields">
                      <option value="text">Single Line Text</option>
                      <option value="textarea">Multi-line Text</option>
                      <option value="email">Email Address</option>
                      <option value="phone">Phone Number</option>
                      <option value="url">Website URL</option>
                    </optgroup>
                    <optgroup label="Number & Date">
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="datetime">Date & Time</option>
                    </optgroup>
                    <optgroup label="Selection Fields">
                      <option value="select">Dropdown Select</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkboxes</option>
                    </optgroup>
                    <optgroup label="File Upload">
                      <option value="file">File Upload</option>
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === 'select' && 'Users can choose one option from a dropdown list'}
                    {formData.type === 'radio' && 'Users can choose one option from radio buttons'}
                    {formData.type === 'checkbox' && 'Users can select multiple options'}
                    {formData.type === 'file' && 'Users can upload files'}
                    {formData.type === 'text' && 'Single line text input field'}
                    {formData.type === 'textarea' && 'Multi-line text area'}
                    {formData.type === 'number' && 'Numeric input with validation'}
                    {formData.type === 'date' && 'Date picker field'}
                    {formData.type === 'datetime' && 'Date and time picker'}
                    {formData.type === 'email' && 'Email address with validation'}
                    {formData.type === 'phone' && 'Phone number input'}
                    {formData.type === 'url' && 'Website URL input'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      categoryId: e.target.value ? parseInt(e.target.value) : undefined,
                      subCategoryId: undefined
                    }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categoriesData.map((category: TicketCategoryConfig) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Field will appear for all tickets in this category
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <select
                    value={formData.subCategoryId || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      subCategoryId: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    disabled={!formData.categoryId}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">All Subcategories</option>
                    {subCategoriesData.map((subCategory: any) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.categoryId ? 'Leave empty to show for all subcategories' : 'Select a category first'}
                  </p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required Field</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Options Management for Select/Radio/Checkbox Fields */}
              {['select', 'radio', 'checkbox'].includes(formData.type) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Options <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      {formData.type === 'select' && '(Dropdown options)'}
                      {formData.type === 'radio' && '(Radio button options)'}
                      {formData.type === 'checkbox' && '(Checkbox options)'}
                    </span>
                  </label>
                  
                  <div className="space-y-2">
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-sm text-gray-400 w-8">#{index + 1}</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={(formData.options?.length || 0) <= 1}
                          title={`Remove option ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )) || []}
                    
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-3 px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </button>
                  </div>
                  
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.type === 'select' && 'Users will see these options in a dropdown menu. At least one option is required.'}
                    {formData.type === 'radio' && 'Users can select one option from these radio buttons.'}
                    {formData.type === 'checkbox' && 'Users can select multiple options from these checkboxes.'}
                  </p>
                </div>
              )}

              {/* Placeholder Text */}
              {!['checkbox', 'radio', 'file'].includes(formData.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.type === 'select' ? 'Select an option...' : 'Enter placeholder text...'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === 'select' ? 'Text shown when no option is selected' : 'Help text shown inside the field'}
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingField(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingField ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 inline mr-2" />
                      {editingField ? 'Update Field' : 'Create Field'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsTab;