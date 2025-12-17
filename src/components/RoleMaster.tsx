import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Save, 
  Shield,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Role, Permission, RoleFilter, RoleStats, Module } from '../types';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  getRolePermissions,
  getRoleStats,
  exportRoles,
  importRoles,
  getAvailableModules
} from '../api/roles';
import PermissionManager from './PermissionManager';

interface RoleMasterProps {
  modules: Module[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const RoleMaster: React.FC<RoleMasterProps> = ({ modules, error: globalError, onRefresh }) => {
  // State Management
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RoleStats | null>(null);
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [managingPermissionsForRole, setManagingPermissionsForRole] = useState<Role | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState<RoleFilter>({
    search: '',
    isActive: undefined,
    hasModuleAccess: undefined,
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // Form State
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    isActive: true
  });
  
  const [rolePermissions, setRolePermissions] = useState<{ [roleId: string]: Permission[] }>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load data
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      
      const { roles: fetchedRoles, total } = await getRoles(filters);
      setRoles(fetchedRoles);
      setTotalRoles(total);
      setTotalPages(Math.ceil(total / filters.pageSize));
      
      // Apply client-side filtering for immediate response
      applyFilters(fetchedRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
      // Handle error silently for now
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const roleStats = await getRoleStats();
      setStats(roleStats);
    } catch (err) {
      console.error('Error loading role stats:', err);
    }
  }, []);

  const loadAvailableModules = useCallback(async () => {
    try {
      await getAvailableModules();
      // Store modules if needed in the future
    } catch (err) {
      console.error('Error loading available modules:', err);
    }
  }, []);

  // Filter roles based on search and filters
  const applyFilters = useCallback((rolesToFilter: Role[]) => {
    let filtered = [...rolesToFilter];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(role => 
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(role => role.isActive === filters.isActive);
    }
    
    if (filters.hasModuleAccess !== undefined) {
      filtered = filtered.filter(role => 
        filters.hasModuleAccess ? role.permissions.length > 0 : role.permissions.length === 0
      );
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'permissions':
          aValue = a.permissions.length;
          bValue = b.permissions.length;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setFilteredRoles(filtered);
  }, [filters]);

  // Load role permissions
  const loadRolePermissions = async (roleId: string) => {
    try {
      const permissions = await getRolePermissions(roleId);
      setRolePermissions(prev => ({ ...prev, [roleId]: permissions }));
    } catch (err) {
      console.error('Error loading role permissions:', err);
    }
  };

  // Effects
  useEffect(() => {
    loadRoles();
    loadStats();
    loadAvailableModules();
  }, [loadRoles, loadStats, loadAvailableModules]);

  useEffect(() => {
    applyFilters(roles);
  }, [roles, applyFilters]);

  // Event Handlers
  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      alert('Please enter a role name');
      return;
    }

    try {
      setLoading(true);
      await createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        isActive: newRole.isActive
      });
      
      await loadRoles();
      setNewRole({ name: '', description: '', isActive: true });
      setShowAddForm(false);
      
      alert('Role created successfully!');
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Failed to create role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !editingRole.name.trim()) {
      alert('Please enter a role name');
      return;
    }

    try {
      setLoading(true);
      await updateRole(editingRole.id, {
        name: editingRole.name.trim(),
        description: editingRole.description?.trim(),
        isActive: editingRole.isActive
      });
      
      await loadRoles();
      setEditingRole(null);
      
      alert('Role updated successfully!');
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"? This will remove all associated permissions.`)) {
      try {
        setLoading(true);
        await deleteRole(roleId);
        await loadRoles();
        alert('Role deleted successfully!');
      } catch (err) {
        console.error('Error deleting role:', err);
        alert('Failed to delete role. This might be a system role that cannot be deleted.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportRoles = async () => {
    try {
      const blob = await exportRoles('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roles-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting roles:', err);
      alert('Failed to export roles. Please try again.');
    }
  };

  const handleImportRoles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await importRoles(file);
      await loadRoles();
      alert(`Import completed: ${result.success} roles imported, ${result.failed} failed.`);
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      }
    } catch (err) {
      console.error('Error importing roles:', err);
      alert('Failed to import roles. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const isExpanded = prev.includes(roleId);
      if (isExpanded) {
        return prev.filter(id => id !== roleId);
      } else {
        // Load permissions when expanding
        if (!rolePermissions[roleId]) {
          loadRolePermissions(roleId);
        }
        return [...prev, roleId];
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (globalError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-gray-500">❌</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">API Connection Error</h3>
            <p className="text-sm text-gray-700 mt-1">{globalError}</p>
            <button
              onClick={onRefresh}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-gray-600" />
            Role Master
          </h2>
          {stats && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="bg-red-100 text-gray-800 px-2 py-1 rounded">
                {stats.totalRoles} Total
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {stats.activeRoles} Active
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {stats.totalPermissions} Permissions
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-500 hover:text-gray-600 hover:bg-red-50 rounded transition-colors"
            title="Show Statistics"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-600 hover:bg-red-50 rounded transition-colors"
            title="Show Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportRoles}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Export Roles"
          >
            <Download className="h-4 w-4" />
          </button>
          <label className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" title="Import Roles">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleImportRoles}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.totalRoles}</div>
              <div className="text-sm text-gray-800">Total Roles</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeRoles}</div>
              <div className="text-sm text-green-800">Active Roles</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalPermissions}</div>
              <div className="text-sm text-purple-800">Total Permissions</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.rolesWithoutPermissions}</div>
              <div className="text-sm text-yellow-800">Without Permissions</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Search roles..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <select
                value={filters.hasModuleAccess === undefined ? '' : filters.hasModuleAccess.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  hasModuleAccess: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Roles</option>
                <option value="true">With Permissions</option>
                <option value="false">Without Permissions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="name">Name</option>
                  <option value="createdAt">Created Date</option>
                  <option value="permissions">Permissions Count</option>
                </select>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Role</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={newRole.isActive.toString()}
                onChange={(e) => setNewRole(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Role description (optional)"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleAddRole}
              disabled={loading || !newRole.name.trim()}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Roles ({filteredRoles.length} of {totalRoles})
            </h3>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-3 text-gray-600">Loading roles...</span>
          </div>
        ) : filteredRoles.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRoles.map(role => (
              <div key={role.id} className="p-4">
                {editingRole && editingRole.id === role.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input
                          type="text"
                          value={editingRole.name}
                          onChange={(e) => setEditingRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editingRole.isActive.toString()}
                          onChange={(e) => setEditingRole(prev => prev ? { ...prev, isActive: e.target.value === 'true' } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={editingRole.description || ''}
                          onChange={(e) => setEditingRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingRole(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateRole}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleRoleExpansion(role.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {expandedRoles.includes(role.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{role.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-gray-800'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {role.originalRoleId && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              ID: {role.originalRoleId}
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{(rolePermissions[role.id] || []).length} permissions</span>
                          {role.createdAt && (
                            <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="p-2 text-gray-500 hover:text-gray-600 hover:bg-red-50 rounded transition-colors"
                        title="Edit Role"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="p-2 text-gray-500 hover:text-gray-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Expanded Permissions View */}
                {expandedRoles.includes(role.id) && !editingRole && (
                  <div className="mt-4 pl-8 border-l-2 border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">
                        Module Permissions ({(rolePermissions[role.id] || []).length})
                      </h5>
                      <button
                        onClick={() => setManagingPermissionsForRole(role)}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Permissions
                      </button>
                    </div>
                    
                    {(rolePermissions[role.id] || []).length > 0 ? (
                      <div className="space-y-2">
                        {(rolePermissions[role.id] || []).map(permission => (
                          <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium text-sm">{permission.moduleName}</span>
                              {permission.sectionName && (
                                <span className="text-sm text-gray-600 ml-2">→ {permission.sectionName}</span>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              permission.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-gray-800'
                            }`}>
                              {permission.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No permissions assigned</p>
                        <button
                          onClick={() => setManagingPermissionsForRole(role)}
                          className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Assign Permissions
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No roles found</p>
            <p className="text-gray-400 text-sm mb-4">
              {filters.search || filters.isActive !== undefined || filters.hasModuleAccess !== undefined
                ? 'Try adjusting your filters or search criteria'
                : 'Get started by creating your first role'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Role
            </button>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * filters.pageSize + 1} to {Math.min(currentPage * filters.pageSize, totalRoles)} of {totalRoles} roles
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {(() => {
                const pagesToShow = Math.min(5, totalPages);
                const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - pagesToShow + 1));
                const pages = Array.from({ length: pagesToShow }, (_, i) => startPage + i);
                
                return pages.map((page, index) => (
                  <button
                    key={`page-${page}-${index}`}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === page
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permission Manager Modal */}
      {managingPermissionsForRole && (
        <PermissionManager
          role={managingPermissionsForRole}
          modules={modules}
          onClose={() => setManagingPermissionsForRole(null)}
          onSave={(updatedRole) => {
            // Update the role in the local state
            setRoles(prev => prev.map(role => 
              role.id === updatedRole.id ? updatedRole : role
            ));
            // Also update filtered roles
            setFilteredRoles(prev => prev.map(role => 
              role.id === updatedRole.id ? updatedRole : role
            ));
            // Refresh data from server to ensure consistency
            loadRoles();
          }}
        />
      )}
    </div>
  );
};

export default RoleMaster;
