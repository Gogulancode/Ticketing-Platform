import React from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, User } from 'lucide-react';

export interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  departmentIds: number[];
}

interface AgentListProps {
  data: Agent[];
  departments: { id: number; name: string; isActive: boolean }[];
  onAdd: (agent: Omit<Agent, 'id'>) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
  editingId?: number;
  onEditingChange: (id: number | undefined) => void;
}

const AgentList: React.FC<AgentListProps> = ({
  data,
  departments,
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
    email: '',
    role: 'Agent',
    isActive: true,
    departmentIds: [] as number[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Agent',
      isActive: true,
      departmentIds: [],
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (formData.name.trim() && formData.email.trim()) {
      onAdd(formData);
      resetForm();
    }
  };

  const handleEdit = (agent: Agent) => {
    onEdit({
      ...agent,
      ...formData,
    });
    resetForm();
    onEditingChange(undefined);
  };

  const startEditing = (agent: Agent) => {
    onEditingChange(agent.id);
    setFormData({
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
      departmentIds: [...agent.departmentIds],
    });
  };

  const cancelEditing = () => {
    onEditingChange(undefined);
    resetForm();
  };

  const handleDepartmentToggle = (departmentId: number) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter(id => id !== departmentId)
        : [...prev.departmentIds, departmentId],
    }));
  };

  const activeDepartments = departments.filter(dept => dept.isActive);

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showAddForm && editingId === undefined && (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Agent
        </button>
      )}

      {/* Add/Edit form */}
      {(showAddForm || editingId !== undefined) && (
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="font-medium mb-3">
            {editingId ? 'Edit Agent' : 'Add New Agent'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Agent name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="agent@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Agent">Agent</option>
                <option value="Senior Agent">Senior Agent</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
              </select>
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
          </div>

          {/* Department selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departments
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activeDepartments.map((department) => (
                <label key={department.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.departmentIds.includes(department.id)}
                    onChange={() => handleDepartmentToggle(department.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{department.name}</span>
                </label>
              ))}
            </div>
            {activeDepartments.length === 0 && (
              <p className="text-sm text-gray-500">No active departments available</p>
            )}
          </div>

          {/* Form buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingId ? () => handleEdit(data.find(a => a.id === editingId)!) : handleAdd}
              disabled={!formData.name.trim() || !formData.email.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Update' : 'Add'} Agent
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

      {/* Agents list */}
      <div className="space-y-2">
        {data.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-md bg-white"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-indigo-600" />
              </div>
            </div>

            {/* Agent info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${!agent.isActive ? 'text-gray-500 line-through' : ''}`}>
                  {agent.name}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  agent.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{agent.email}</p>
              <p className="text-sm text-gray-500">{agent.role}</p>
              
              {/* Departments */}
              {agent.departmentIds.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {agent.departmentIds
                    .map(id => departments.find(d => d.id === id))
                    .filter(Boolean)
                    .map(department => (
                      <span
                        key={department!.id}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {department!.name}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {editingId !== agent.id && (
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleActive(agent.id)}
                  className={`p-2 rounded ${
                    agent.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={agent.isActive ? 'Deactivate' : 'Activate'}
                >
                  {agent.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => startEditing(agent)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(agent.id)}
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
            No agents configured. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentList;
