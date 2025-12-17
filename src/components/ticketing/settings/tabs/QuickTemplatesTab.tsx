import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, QuickTemplate, CreateQuickTemplateRequest, TicketCategoryConfig } from '@/shared/services/api/settingsApi';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import * as LucideIcons from 'lucide-react';

// Available icon options
const iconOptions = [
  'Bug', 'Zap', 'HelpCircle', 'CheckCircle', 'Users', 'DollarSign', 'Megaphone', 
  'FileText', 'Settings', 'Mail', 'Phone', 'Calendar', 'Clock', 'Globe', 
  'Shield', 'Database', 'Server', 'Monitor', 'Printer', 'Headphones', 
  'MessageSquare', 'BookOpen', 'Award', 'Target', 'Heart', 'Star', 'Flag',
  'Bookmark', 'Tag', 'Folder', 'Package', 'Truck', 'MapPin', 'Home', 
  'Building', 'Store', 'ShoppingCart', 'CreditCard', 'Wallet', 'AlertCircle'
];

// Priority options
const priorityOptions = [
  { value: 0, label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 1, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 2, label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 3, label: 'Critical', color: 'bg-red-100 text-gray-800' },
];

const QuickTemplatesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickTemplate | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateQuickTemplateRequest>({
    name: '',
    label: '',
    titleTemplate: '',
    descriptionTemplate: '',
    iconName: 'FileText',
    category: 'general-inquiry',
    priority: 1,
    categoryId: undefined,
    displayOrder: 0,
    isActive: true,
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quickTemplates', showInactive],
    queryFn: () => settingsApi.getQuickTemplates(showInactive),
  });

  // Fetch categories for dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ['ticketCategories'],
    queryFn: () => settingsApi.getTicketCategories(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateQuickTemplateRequest) => settingsApi.createQuickTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickTemplates'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateQuickTemplateRequest> }) => 
      settingsApi.updateQuickTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickTemplates'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsApi.deleteQuickTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickTemplates'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      settingsApi.updateQuickTemplate(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickTemplates'] });
    },
  });

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      label: '',
      titleTemplate: '',
      descriptionTemplate: '',
      iconName: 'FileText',
      category: 'general-inquiry',
      priority: 1,
      categoryId: undefined,
      displayOrder: templates.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (template: QuickTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      label: template.label,
      titleTemplate: template.titleTemplate,
      descriptionTemplate: template.descriptionTemplate,
      iconName: template.iconName,
      category: template.category,
      priority: template.priority,
      categoryId: template.categoryId,
      displayOrder: template.displayOrder,
      isActive: template.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (template: QuickTemplate) => {
    toggleActiveMutation.mutate({ id: template.id, isActive: !template.isActive });
  };

  // Get icon component
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.FileText;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Start Templates</h2>
          <p className="text-sm text-gray-500">
            Create and manage quick templates for faster ticket creation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
            />
            Show inactive
          </label>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <LucideIcons.FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new quick template.</p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <PlusIcon className="h-5 w-5" />
              Add Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const IconComponent = getIcon(template.iconName);
            const priorityConfig = priorityOptions.find(p => p.value === template.priority) || priorityOptions[1];
            
            return (
              <div
                key={template.id}
                className={`relative bg-white border rounded-lg p-4 transition-all ${
                  template.isActive 
                    ? 'border-gray-200 hover:border-red-300 hover:shadow-md' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                  {!template.isActive && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Icon and Label */}
                <div className="flex items-start gap-3 mb-3 pr-24">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <IconComponent className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{template.label}</h3>
                    <p className="text-xs text-gray-500 truncate">{template.name}</p>
                  </div>
                </div>

                {/* Title Template Preview */}
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Title Template:</p>
                  <p className="text-sm text-gray-700 truncate">{template.titleTemplate || '(empty)'}</p>
                </div>

                {/* Description Preview */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Description:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.descriptionTemplate || '(empty)'}
                  </p>
                </div>

                {/* Category Mapping */}
                {template.categoryId && (() => {
                  const cat = categories.find(c => c.id === template.categoryId);
                  return cat ? (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        📁 {cat.name}
                      </span>
                    </div>
                  ) : null;
                })()}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        template.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={template.isActive ? 'Disable template' : 'Enable template'}
                    >
                      {template.isActive ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(template)}
                      className="p-1.5 text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1.5 text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={closeModal}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="px-6 py-4 space-y-4">
                  {/* Label & Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label <span className="text-gray-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., IT - Bug Report"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Internal Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Auto-generated from label if empty"
                      />
                    </div>
                  </div>

                  {/* Icon & Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon
                      </label>
                      <select
                        value={formData.iconName}
                        onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {iconOptions.map(icon => {
                          const IconComp = getIcon(icon);
                          return (
                            <option key={icon} value={icon}>{icon}</option>
                          );
                        })}
                      </select>
                      {/* Icon Preview */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Preview:</span>
                        {React.createElement(getIcon(formData.iconName || 'FileText'), { 
                          className: 'h-5 w-5 text-gray-600' 
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {priorityOptions.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title Template
                    </label>
                    <input
                      type="text"
                      value={formData.titleTemplate}
                      onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Bug Report: "
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will pre-fill the ticket title field
                    </p>
                  </div>

                  {/* Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Template
                    </label>
                    <textarea
                      value={formData.descriptionTemplate}
                      onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter template text with placeholders..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use bullet points (•) and newlines to structure the template
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Category
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        categoryId: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.filter(c => c.isActive).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      When user clicks this template, this category will be auto-selected
                    </p>
                  </div>

                  {/* Display Order & Active */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center pt-7">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Active (visible to users)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickTemplatesTab;
