import React from 'react';
import { Plus, ChevronUp, ChevronDown, Edit2, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { CategoryConfiguration, SubCategoryConfiguration } from '../utils/settingsUtils';

interface CategoryListProps {
  data: CategoryConfiguration[];
  onAdd: (name: string) => void;
  onEdit: (item: CategoryConfiguration, name: string) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
  onReorder: (id: number, direction: 'up' | 'down') => void;
  onAddSubcategory: (parentId: number, name: string) => void;
  onEditSubcategory: (parentId: number, subcategory: SubCategoryConfiguration, name: string) => void;
  onDeleteSubcategory: (parentId: number, subcategoryId: number) => void;
  onToggleSubcategoryActive: (parentId: number, subcategoryId: number) => void;
  onReorderSubcategory: (parentId: number, subcategoryId: number, direction: 'up' | 'down') => void;
  editingId?: number;
  editingSubcategoryId?: number;
  onEditingChange: (id: number | undefined, subcategoryId?: number) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  data,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onToggleSubcategoryActive,
  onReorderSubcategory,
  editingId,
  editingSubcategoryId,
  onEditingChange,
}) => {
  const [newItemName, setNewItemName] = React.useState('');
  const [editName, setEditName] = React.useState('');
  const [expandedCategories, setExpandedCategories] = React.useState<Set<number>>(new Set());
  const [newSubcategoryName, setNewSubcategoryName] = React.useState<{ [key: number]: string }>({});

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleEdit = (item: CategoryConfiguration) => {
    onEdit(item, editName);
    setEditName('');
    onEditingChange(undefined);
  };

  const handleEditSubcategory = (parentId: number, subcategory: SubCategoryConfiguration) => {
    onEditSubcategory(parentId, subcategory, editName);
    setEditName('');
    onEditingChange(undefined);
  };

  const startEditing = (item: CategoryConfiguration) => {
    onEditingChange(item.id);
    setEditName(item.name);
  };

  const startEditingSubcategory = (parentId: number, subcategory: SubCategoryConfiguration) => {
    onEditingChange(parentId, subcategory.id);
    setEditName(subcategory.name);
  };

  const cancelEditing = () => {
    onEditingChange(undefined);
    setEditName('');
  };

  const handleAddSubcategory = (parentId: number) => {
    const name = newSubcategoryName[parentId];
    if (name?.trim()) {
      onAddSubcategory(parentId, name.trim());
      setNewSubcategoryName(prev => ({ ...prev, [parentId]: '' }));
    }
  };

  const sortedData = [...data].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Add new category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New category"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Categories list */}
      <div className="space-y-2">
        {sortedData.map((category, index) => (
          <div key={category.id} className="border border-gray-200 rounded-md bg-white">
            {/* Category header */}
            <div className="flex items-center gap-2 p-3">
              {/* Expand button */}
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight
                  size={16}
                  className={`transform transition-transform ${
                    expandedCategories.has(category.id) ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Reorder buttons */}
              <div className="flex flex-col">
                <button
                  onClick={() => onReorder(category.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => onReorder(category.id, 'down')}
                  disabled={index === sortedData.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Category content */}
              <div className="flex-1">
                {editingId === category.id && !editingSubcategoryId ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded"
                      onKeyPress={(e) => e.key === 'Enter' && handleEdit(category)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${!category.isActive ? 'text-gray-500 line-through' : ''}`}>
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({category.subcategories.length} subcategories)
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!(editingId === category.id && !editingSubcategoryId) && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onToggleActive(category.id)}
                    className={`p-2 rounded ${
                      category.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-600 hover:bg-red-50'
                    }`}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {category.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => startEditing(category)}
                    className="p-2 text-gray-600 hover:bg-red-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="p-2 text-gray-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Subcategories (when expanded) */}
            {expandedCategories.has(category.id) && (
              <div className="border-t border-gray-100 p-3 bg-gray-50">
                {/* Add subcategory */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubcategoryName[category.id] || ''}
                    onChange={(e) => setNewSubcategoryName(prev => ({ ...prev, [category.id]: e.target.value }))}
                    placeholder="New subcategory"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                  />
                  <button
                    onClick={() => handleAddSubcategory(category.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>

                {/* Subcategories list */}
                <div className="space-y-2">
                  {category.subcategories
                    .sort((a, b) => a.order - b.order)
                    .map((subcategory, subIndex) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col">
                          <button
                            onClick={() => onReorderSubcategory(category.id, subcategory.id, 'up')}
                            disabled={subIndex === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => onReorderSubcategory(category.id, subcategory.id, 'down')}
                            disabled={subIndex === category.subcategories.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Subcategory content */}
                        <div className="flex-1">
                          {editingId === category.id && editingSubcategoryId === subcategory.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && handleEditSubcategory(category.id, subcategory)}
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditSubcategory(category.id, subcategory)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className={`text-sm ${!subcategory.isActive ? 'text-gray-500 line-through' : ''}`}>
                              {subcategory.name}
                            </span>
                          )}
                        </div>

                        {/* Subcategory action buttons */}
                        {!(editingId === category.id && editingSubcategoryId === subcategory.id) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => onToggleSubcategoryActive(category.id, subcategory.id)}
                              className={`p-1 rounded ${
                                subcategory.isActive
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-600 hover:bg-red-50'
                              }`}
                              title={subcategory.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {subcategory.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => startEditingSubcategory(category.id, subcategory)}
                              className="p-1 text-gray-600 hover:bg-red-50 rounded"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteSubcategory(category.id, subcategory.id)}
                              className="p-1 text-gray-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                  {category.subcategories.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No subcategories yet. Add one above.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories configured. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
