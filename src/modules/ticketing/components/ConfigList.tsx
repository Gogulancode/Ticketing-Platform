import React from 'react';
import { Plus, ChevronUp, ChevronDown, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Configuration } from '../utils/settingsUtils';

interface ConfigListProps {
  title: string;
  data: Configuration[];
  onAdd: (name: string) => void;
  onEdit: (item: Configuration, name: string) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
  onReorder: (id: number, direction: 'up' | 'down') => void;
  editingId?: number;
  onEditingChange: (id: number | undefined) => void;
  canDelete?: boolean;
}

const ConfigList: React.FC<ConfigListProps> = ({
  title,
  data,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  editingId,
  onEditingChange,
  canDelete = true,
}) => {
  const [newItemName, setNewItemName] = React.useState('');
  const [editName, setEditName] = React.useState('');

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleEdit = (item: Configuration) => {
    onEdit(item, editName);
    setEditName('');
    onEditingChange(undefined);
  };

  const startEditing = (item: Configuration) => {
    onEditingChange(item.id);
    setEditName(item.name);
  };

  const cancelEditing = () => {
    onEditingChange(undefined);
    setEditName('');
  };

  const sortedData = [...data].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`New ${title.toLowerCase()}`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {sortedData.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-md bg-white"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col">
              <button
                onClick={() => onReorder(item.id, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onReorder(item.id, 'down')}
                disabled={index === sortedData.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Item content */}
            <div className="flex-1">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    onKeyPress={(e) => e.key === 'Enter' && handleEdit(item)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleEdit(item)}
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
                <span className={`${!item.isActive ? 'text-gray-500 line-through' : ''}`}>
                  {item.name}
                </span>
              )}
            </div>

            {/* Action buttons */}
            {editingId !== item.id && (
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleActive(item.id)}
                  className={`p-2 rounded ${
                    item.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                >
                  {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => startEditing(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {title.toLowerCase()} configured. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigList;
