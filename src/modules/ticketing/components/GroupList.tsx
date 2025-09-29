import React from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Users } from 'lucide-react';

export interface Group {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  agentIds: number[];
}

interface GroupListProps {
  data: Group[];
  agents: { id: number; name: string; email: string; isActive: boolean }[];
  onAdd: (group: Omit<Group, 'id'>) => void;
  onEdit: (group: Group) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
  editingId?: number;
  onEditingChange: (id: number | undefined) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  data,
  agents,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  editingId,
  onEditingChange,
}) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    isActive: true,
    agentIds: [] as number[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      agentIds: [],
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (formData.name.trim()) {
      onAdd(formData);
      resetForm();
    }
  };

  const handleEdit = (group: Group) => {
    onEdit({
      ...group,
      ...formData,
    });
    resetForm();
    onEditingChange(undefined);
  };

  const startEditing = (group: Group) => {
    onEditingChange(group.id);
    setFormData({
      name: group.name,
      description: group.description,
      isActive: group.isActive,
      agentIds: [...group.agentIds],
    });
  };

  const cancelEditing = () => {
    onEditingChange(undefined);
    resetForm();
  };

  const handleAgentToggle = (agentId: number) => {
    setFormData(prev => ({
      ...prev,
      agentIds: prev.agentIds.includes(agentId)
        ? prev.agentIds.filter(id => id !== agentId)
        : [...prev.agentIds, agentId],
    }));
  };

  const activeAgents = agents.filter(agent => agent.isActive);

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showAddForm && editingId === undefined && (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Group
        </button>
      )}

      {/* Add/Edit form */}
      {(showAddForm || editingId !== undefined) && (
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="font-medium mb-3">
            {editingId ? 'Edit Group' : 'Add New Group'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Level 1 Support, Technical Team"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of the group's role and responsibilities"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Agent selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agents ({formData.agentIds.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                {activeAgents.map((agent) => (
                  <label key={agent.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.agentIds.includes(agent.id)}
                      onChange={() => handleAgentToggle(agent.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{agent.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{agent.email}</span>
                    </div>
                  </label>
                ))}
                {activeAgents.length === 0 && (
                  <p className="text-sm text-gray-500">No active agents available</p>
                )}
              </div>
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingId ? () => handleEdit(data.find(g => g.id === editingId)!) : handleAdd}
              disabled={!formData.name.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Update' : 'Add'} Group
            </button>
            <button
              onClick={editingId ? cancelEditing : () => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      <div className="space-y-2">
        {data.map((group) => (
          <div
            key={group.id}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-md bg-white"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>

            {/* Group info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium ${!group.isActive ? 'text-gray-500 line-through' : ''}`}>
                  {group.name}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  group.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {group.description && (
                <p className="text-sm text-gray-600 mb-2">{group.description}</p>
              )}

              {/* Group agents */}
              {group.agentIds.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Agents ({group.agentIds.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.agentIds
                      .map(id => agents.find(a => a.id === id))
                      .filter(Boolean)
                      .map(agent => (
                        <span
                          key={agent!.id}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {agent!.name}
                        </span>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No agents assigned</p>
              )}
            </div>

            {/* Action buttons */}
            {editingId !== group.id && (
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleActive(group.id)}
                  className={`p-2 rounded ${
                    group.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={group.isActive ? 'Deactivate' : 'Activate'}
                >
                  {group.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => startEditing(group)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No groups configured. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupList;
