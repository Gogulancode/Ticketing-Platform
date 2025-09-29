import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Users, Tag } from 'lucide-react';
import { AgentGroup, TicketCategory } from '../types/ticketGroups';

interface GroupEditModalProps {
  group: AgentGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedGroup: AgentGroup) => void;
  availableCategories: TicketCategory[];
}

const GroupEditModal: React.FC<GroupEditModalProps> = ({
  group,
  isOpen,
  onClose,
  onSave,
  availableCategories
}) => {
  const [formData, setFormData] = useState<Partial<AgentGroup>>({
    name: '',
    description: '',
    categories: [],
    departments: [],
    isActive: true,
    priority: 1
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        categories: [...group.categories],
        departments: [...group.departments],
        isActive: group.isActive,
        priority: group.priority
      });
    }
  }, [group]);

  const handleSave = () => {
    if (group && formData.name && formData.description) {
      const updatedGroup: AgentGroup = {
        ...group,
        name: formData.name,
        description: formData.description,
        categories: formData.categories || [],
        departments: formData.departments || [],
        isActive: formData.isActive || true,
        priority: formData.priority || 1
      };
      onSave(updatedGroup);
      onClose();
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = formData.categories || [];
    const isSelected = currentCategories.includes(categoryId);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        categories: currentCategories.filter(id => id !== categoryId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: [...currentCategories, categoryId]
      }));
    }
  };

  const handleSubcategoryToggle = (categoryId: string, subcategoryId: string) => {
    // In a real app, this would update the subcategory's assignedGroups
    console.log(`Toggling subcategory ${subcategoryId} for group ${group?.id}`);
  };

  const handleDepartmentAdd = (department: string) => {
    if (department && !formData.departments?.includes(department)) {
      setFormData(prev => ({
        ...prev,
        departments: [...(prev.departments || []), department]
      }));
    }
  };

  const handleDepartmentRemove = (department: string) => {
    setFormData(prev => ({
      ...prev,
      departments: (prev.departments || []).filter(d => d !== department)
    }));
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Agent Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this group handles"
            />
          </div>

          {/* Department Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Departments
            </label>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {(formData.departments || []).map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {dept}
                    <button
                      onClick={() => handleDepartmentRemove(dept)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                {['IT', 'HR', 'Finance', 'Operations', 'Training', 'Quality'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => handleDepartmentAdd(dept)}
                    disabled={(formData.departments || []).includes(dept)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category & Subcategory Mapping */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Tag className="w-4 h-4 inline mr-1" />
              Category & Subcategory Assignment
            </label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              {availableCategories.map((category) => {
                const isCategorySelected = formData.categories?.includes(category.id);
                
                return (
                  <div key={category.id} className="border border-gray-100 rounded-lg p-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCategorySelected}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </label>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {category.subcategories.length} subcategories
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {category.estimatedResolutionTime}h avg resolution
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    
                    {/* Subcategories */}
                    {isCategorySelected && category.subcategories.length > 0 && (
                      <div className="ml-6 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Subcategories:</h4>
                        {category.subcategories.map((subcategory) => {
                          const isSubcategoryAssigned = subcategory.assignedGroups.includes(group.id);
                          
                          return (
                            <div key={subcategory.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSubcategoryAssigned}
                                    onChange={() => handleSubcategoryToggle(category.id, subcategory.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-900">{subcategory.name}</span>
                                </label>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  subcategory.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  subcategory.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  subcategory.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {subcategory.priority}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Tags: {subcategory.tags.join(', ')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Group
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name || !formData.description}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupEditModal;
