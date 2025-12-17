import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, UserCog, Plus, Edit2, Trash2, Eye, EyeOff, User, Search } from 'lucide-react';
import { getCurrentUser } from '../../../shared/services/api/auth';
import { settingsApi, CategoryAdmin } from '../../../api/settingsApi';
import { API_CONFIG } from '../../../config/api';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  departmentIds: number[];
  userId?: string;
}

/**
 * Agent Management Page for Category Heads
 * This page allows Category Heads to manage agents for their categories
 */
const AgentSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Agent',
    isActive: true,
    departmentIds: [] as number[],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Check if user is admin - admins can access settings directly
        const adminRoles = ['Admin', 'SuperAdmin', 'Administrator'];
        const singleRole = (currentUser.role || '').toString().toLowerCase();
        const roles = Array.isArray(currentUser.roles)
          ? currentUser.roles.map((role: unknown) => {
              if (!role) return '';
              if (typeof role === 'string') return role;
              if (typeof role === 'object' && role !== null && 'name' in role) {
                return (role as { name: string }).name;
              }
              return String(role);
            }).filter(Boolean)
          : [];
        const normalizedRoles = roles.map((role: string) => role.toLowerCase());
        
        const isAdmin = adminRoles.some(role => 
          singleRole.includes(role.toLowerCase()) || 
          normalizedRoles.some((r: string) => r.includes(role.toLowerCase()))
        );
        
        if (isAdmin) {
          // Admins are always authorized, redirect to full settings
          navigate('/tickets/settings');
          return;
        }
        
        // Check if user is a Category Head with agent management permission
        if (currentUser.id) {
          const categoryAdmins = await settingsApi.getCategoryAdmins();
          const userCategoryAdmin = categoryAdmins.find(
            (ca: CategoryAdmin) => ca.userId === currentUser.id && ca.isActive && ca.canManageAgents
          );
          
          if (userCategoryAdmin) {
            setIsAuthorized(true);
            // Get all category IDs and names for this user
            const userCatAdmins = categoryAdmins.filter(
              (ca: CategoryAdmin) => ca.userId === currentUser.id && ca.isActive
            );
            setCategoryIds(userCatAdmins.map((ca: CategoryAdmin) => ca.categoryId));
            setCategoryNames(userCatAdmins.map((ca: CategoryAdmin) => ca.categoryName).filter(Boolean));
            
            // Load agents for this user's categories
            await loadAgents(userCatAdmins.map((ca: CategoryAdmin) => ca.categoryId));
          } else {
            // Not authorized - redirect to dashboard
            navigate('/tickets');
          }
        } else {
          navigate('/tickets');
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        navigate('/tickets');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [navigate]);

  const loadAgents = async (_catIds: number[]) => {
    try {
      // Load agents - for now we load all agents and filter by department/category
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('👥 Loaded agents:', data?.length || 0, 'agents');
        // TODO: Filter agents that belong to any of the user's categories
        // For now, show all agents
        setAgents(data);
      } else {
        console.error('Failed to load agents:', response.status, await response.text());
        setError('Failed to load agents');
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to load agents');
    }
  };

  const handleAddAgent = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          departmentIds: categoryIds, // Assign to category head's categories
        }),
      });
      
      if (response.ok) {
        await loadAgents(categoryIds);
        resetForm();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add agent');
      }
    } catch (err) {
      console.error('Failed to add agent:', err);
      setError('Failed to add agent');
    }
  };

  const handleUpdateAgent = async (agentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents/${agentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        await loadAgents(categoryIds);
        resetForm();
        setEditingAgentId(null);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update agent');
      }
    } catch (err) {
      console.error('Failed to update agent:', err);
      setError('Failed to update agent');
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await loadAgents(categoryIds);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete agent');
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
      setError('Failed to delete agent');
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...agent,
          isActive: !agent.isActive,
        }),
      });
      
      if (response.ok) {
        await loadAgents(categoryIds);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
      setError('Failed to update agent status');
    }
  };

  const startEditing = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setFormData({
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
      departmentIds: agent.departmentIds,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Agent',
      isActive: true,
      departmentIds: [],
    });
    setShowAddForm(false);
    setEditingAgentId(null);
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Head Banner */}
      <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">
            Category Head Agent Management
            {categoryNames.length > 0 && ` - ${categoryNames.join(', ')}`}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tickets')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <UserCog className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manage Agents</h1>
                <p className="text-sm text-gray-500">
                  Add and manage agents for your categories
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Add Agent Form */}
        {showAddForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Add New Agent</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Agent name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="agent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Agent">Agent</option>
                  <option value="Senior Agent">Senior Agent</option>
                  <option value="Team Lead">Team Lead</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Agent
              </button>
            </div>
          </div>
        )}

        {/* Agent List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No agents found</p>
                    <p className="text-sm">Add your first agent to get started</p>
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    {editingAgentId === agent.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Agent">Agent</option>
                            <option value="Senior Agent">Senior Agent</option>
                            <option value="Team Lead">Team Lead</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm">{formData.isActive ? 'Active' : 'Inactive'}</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleUpdateAgent(agent.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Save
                          </button>
                          <button
                            onClick={resetForm}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleToggleActive(agent)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                            title={agent.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {agent.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => startEditing(agent)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentSettingsPage;
