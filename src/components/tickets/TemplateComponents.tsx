import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, X, Search, CheckCircle } from 'lucide-react';
import {
  useTemplates,
  useActiveTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  TicketTemplateDto,
  CreateTicketTemplateDto,
  UpdateTicketTemplateDto
} from '../../services/ticketEnhancementsApi';

// ==================== Template Selector ====================

interface TemplateSelectorProps {
  onSelect: (template: TicketTemplateDto) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const { data: templates, isLoading } = useActiveTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = templates?.reduce((acc, t) => {
    if (!acc.includes(t.category)) acc.push(t.category);
    return acc;
  }, [] as number[]);

  const getCategoryLabel = (category: number): string => {
    // Map to your category enum/labels
    const categoryMap: Record<number, string> = {
      0: 'General',
      1: 'Technical',
      2: 'Billing',
      3: 'Feature Request',
      4: 'Bug Report',
      5: 'Account',
    };
    return categoryMap[category] || `Category ${category}`;
  };

  const getPriorityLabel = (priority: number): string => {
    const priorityMap: Record<number, string> = {
      0: 'Low',
      1: 'Medium',
      2: 'High',
      3: 'Critical',
    };
    return priorityMap[priority] || `Priority ${priority}`;
  };

  const getPriorityColor = (priority: number): string => {
    const colors: Record<number, string> = {
      0: 'bg-gray-100 text-gray-700',
      1: 'bg-red-100 text-gray-700',
      2: 'bg-orange-100 text-orange-700',
      3: 'bg-red-100 text-gray-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Template
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-4 py-3 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {categories && categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === null
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {template.name}
                      </h4>
                      {template.description && (
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {getCategoryLabel(template.category)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(template.priority)}`}>
                          {getPriorityLabel(template.priority)}
                        </span>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-gray-300 group-hover:text-gray-500" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== null
                ? 'No templates match your search'
                : 'No templates available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Template Management ====================

interface TemplateManagerProps {
  readOnly?: boolean;
}

export function TemplateManager({ readOnly = false }: TemplateManagerProps) {
  const { data: templates, isLoading } = useTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplateDto | null>(null);

  const handleSave = async (data: CreateTicketTemplateDto | UpdateTicketTemplateDto) => {
    if (editingTemplate) {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        data: data as UpdateTicketTemplateDto,
      });
    } else {
      await createMutation.mutateAsync(data as CreateTicketTemplateDto);
    }
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Ticket Templates
        </h3>
        {!readOnly && (
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Template
          </button>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onEdit={() => {
                  setEditingTemplate(template);
                  setShowForm(true);
                }}
                onDelete={() => deleteMutation.mutateAsync(template.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No templates created yet
          </p>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface TemplateItemProps {
  template: TicketTemplateDto;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

function TemplateItem({ template, onEdit, onDelete, readOnly }: TemplateItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
          {!template.isActive && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
              Inactive
            </span>
          )}
          {template.isGlobal && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-gray-700 rounded">
              Global
            </span>
          )}
        </div>
        {template.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{template.description}</p>
        )}
      </div>
      {!readOnly && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface TemplateFormModalProps {
  template?: TicketTemplateDto | null;
  onClose: () => void;
  onSave: (data: CreateTicketTemplateDto | UpdateTicketTemplateDto) => Promise<void>;
  isLoading: boolean;
}

function TemplateFormModal({ template, onClose, onSave, isLoading }: TemplateFormModalProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 0,
    priority: template?.priority || 1,
    subject: template?.subject || '',
    body: template?.body || '',
    tags: template?.tags || '',
    defaultAssigneeId: template?.defaultAssigneeId || undefined,
    isActive: template?.isActive ?? true,
    isGlobal: template?.isGlobal ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...formData,
      description: formData.description || undefined,
      tags: formData.tags || undefined,
      defaultAssigneeId: formData.defaultAssigneeId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-medium text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name <span className="text-gray-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Password Reset Request"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of when to use this template"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value={0}>General</option>
                <option value={1}>Technical</option>
                <option value={2}>Billing</option>
                <option value={3}>Feature Request</option>
                <option value={4}>Bug Report</option>
                <option value={5}>Account</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
                <option value={3}>Critical</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Subject <span className="text-gray-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Default ticket subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Body <span className="text-gray-500">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={6}
              placeholder="Default ticket body content"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags (e.g., urgent, billing, support)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isGlobal}
                onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Global (visible to all users)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.subject || !formData.body}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateSelector;
