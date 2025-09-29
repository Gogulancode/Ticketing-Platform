import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Edit, UserPlus, CheckCircle, XCircle, Eye, X, 
  UserCheck, RefreshCw 
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  roles: string[];
  department?: string;
  position?: string;
  createdAt: string;
  lastLogin?: string;
  isAgent: boolean;
}

interface Agent {
  id: number;
  userId: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'agents' | 'create'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [convertingUser, setConvertingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(50);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  
  // User form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roles: [] as string[],
    department: '',
    position: '',
    isAgent: false,
  });

  // View user modal
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const availableRoles = ['Admin', 'Agent', 'User', 'Manager', 'Supervisor'];
  const availableDepartments = ['IT', 'Support', 'Sales', 'Operations', 'HR', 'Finance'];

  // Load data
  useEffect(() => {
    loadUsers(1, searchTerm);
    if (activeTab === 'agents') {
      loadAgents();
    }
  }, [activeTab]);

  // Debounced search effect
  useEffect(() => {
    if (activeTab !== 'users') return;
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when searching
      loadUsers(1, searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole, statusFilter, departmentFilter, activeTab]);

  const loadUsers = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      if (selectedRole) {
        params.append('role', selectedRole);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (departmentFilter) {
        params.append('department', departmentFilter);
      }

      // API call via proxy to backend server with pagination and search
      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const userData = await response.json();
        // Backend returns {users: [...], pagination: {...}} structure
        setUsers(userData.users || []);
        if (userData.pagination) {
          setCurrentPage(userData.pagination.currentPage);
          setTotalPages(userData.pagination.totalPages);
          setTotalUsers(userData.pagination.totalCount);
        }
      } else {
        // Mock data for development when backend is not available
        setUsers([
          {
            id: '1',
            username: 'admin',
            email: 'admin@company.com',
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+1234567890',
            isActive: true,
            roles: ['Admin'],
            department: 'IT',
            position: 'System Administrator',
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-01-15T10:30:00Z',
            isAgent: true,
          },
          {
            id: '2',
            username: 'agent1',
            email: 'agent1@company.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567891',
            isActive: true,
            roles: ['Agent'],
            department: 'Support',
            position: 'Support Agent',
            createdAt: '2024-01-02T00:00:00Z',
            lastLogin: '2024-01-15T09:15:00Z',
            isAgent: true,
          },
          {
            id: '3',
            username: 'user1',
            email: 'user1@company.com',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+1234567892',
            isActive: true,
            roles: ['User'],
            department: 'Sales',
            position: 'Sales Representative',
            createdAt: '2024-01-03T00:00:00Z',
            lastLogin: '2024-01-15T08:45:00Z',
            isAgent: false,
          },
        ]);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
      // Ensure users remains an empty array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      // API call via proxy to backend server
      const response = await fetch('/api/tickets/settings/agents');
      if (response.ok) {
        const agentData = await response.json();
        // Backend returns array directly for agents
        setAgents(Array.isArray(agentData) ? agentData : []);
      } else {
        // Mock data for development when backend is not available
        setAgents([
          {
            id: 1,
            userId: '1',
            name: 'System Administrator',
            email: 'admin@company.com',
            department: 'IT',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 2,
            userId: '2',
            name: 'John Doe',
            email: 'agent1@company.com',
            department: 'Support',
            isActive: true,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-14T09:15:00Z',
          },
        ]);
      }
    } catch (err) {
      setError('Failed to load agents');
      console.error('Error loading agents:', err);
      // Ensure agents remains an empty array on error
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // API call via proxy to backend server
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUser.username || newUser.email,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          password: newUser.password,
          roles: newUser.roles,
          department: newUser.department,
          position: newUser.position,
          isAgent: newUser.isAgent,
        }),
      });

      if (response.ok) {
        setSuccess('User created successfully!');
        setNewUser({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          password: '',
          confirmPassword: '',
          roles: [],
          department: '',
          position: '',
          isAgent: false,
        });
        loadUsers(currentPage, searchTerm);
      } else {
        setError('Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToAgent = async (userId: string) => {
    setLoading(true);
    try {
      // API call via proxy to backend server for agent conversion
      const response = await fetch(`/api/ticketing/acl/convert-to-agent/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSuccess('User converted to agent successfully!');
        loadUsers(currentPage, searchTerm);
        loadAgents();
      } else {
        setError('Failed to convert user to agent');
      }
    } catch (err) {
      setError('Failed to convert user to agent');
      console.error('Error converting to agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      // API call via proxy to backend server for user status toggle
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        loadUsers(currentPage, searchTerm);
      } else {
        setError('Failed to update user status');
      }
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: number) => {
    setLoading(true);
    try {
      // API call via proxy to backend server for agent status toggle
      const response = await fetch(`/api/tickets/settings/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSuccess('Agent status updated successfully!');
        loadAgents();
      } else {
        setError('Failed to update agent status');
      }
    } catch (err) {
      setError('Failed to update agent status');
      console.error('Error updating agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Users are now filtered server-side, so we just use the loaded users
  const filteredUsers = users || [];

  // Filter agents
  const filteredAgents = (agents || []).filter(agent => {
    const matchesSearch = searchTerm === '' || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && agent.isActive) ||
      (statusFilter === 'inactive' && !agent.isActive);
    const matchesDepartment = departmentFilter === '' || agent.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="text-sm leading-snug space-y-sm">
      {/* Header */}
      <div className="py-sm">
        <h1 className="text-xl font-semibold leading-tight">User Management</h1>
        <p className="text-sm leading-snug mt-xs text-gray-600">
          Manage users, agents, and permissions for the ticketing system
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            All Users ({totalUsers > 0 ? totalUsers : users.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4 inline mr-2" />
            Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Create User
          </button>
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === 'users' || activeTab === 'agents') && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter (Users only) */}
            {activeTab === 'users' && (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            )}

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('');
                  setStatusFilter('all');
                  setDepartmentFilter('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
            <button
              onClick={activeTab === 'users' ? () => loadUsers(currentPage, searchTerm) : loadAgents}
              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                role === 'Admin'
                                  ? 'bg-red-100 text-red-800'
                                  : role === 'Agent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                          {user.isAgent && !user.roles.includes('Agent') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ticketing Agent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!user.isAgent && (
                            <button
                              onClick={() => setConvertingUser(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Convert to Agent"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className={`${
                              user.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => {
                      if (currentPage > 1) {
                        loadUsers(currentPage - 1, searchTerm);
                      }
                    }}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (currentPage < totalPages) {
                        loadUsers(currentPage + 1, searchTerm);
                      }
                    }}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                      <span className="font-medium">{totalUsers}</span> users
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => {
                          if (currentPage > 1) {
                            loadUsers(currentPage - 1, searchTerm);
                          }
                        }}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, startPage + 4);
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }
                        const page = startPage + i;
                        
                        if (page > totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => loadUsers(page, searchTerm)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }).filter(Boolean)}
                      
                      <button
                        onClick={() => {
                          if (currentPage < totalPages) {
                            loadUsers(currentPage + 1, searchTerm);
                          }
                        }}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      Loading agents...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No agents found
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {agent.name.split(' ').map(n => n.charAt(0)).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{agent.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            agent.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleAgentStatus(agent.id)}
                            className={`text-sm px-3 py-1 rounded-md font-medium ${
                              agent.isActive
                                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                : 'text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                            title={agent.isActive ? 'Deactivate Agent' : 'Activate Agent'}
                          >
                            {agent.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold leading-tight mb-2">Create New User</h2>
            <p className="text-sm text-gray-600">Add a new user to the system</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Leave empty to use email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={newUser.position}
                  onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableRoles.map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewUser({ ...newUser, roles: [...newUser.roles, role] });
                        } else {
                          setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== role) });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAgent"
                checked={newUser.isAgent}
                onChange={(e) => setNewUser({ ...newUser, isAgent: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAgent" className="ml-2 text-sm text-gray-700">
                Make this user an agent (can be assigned tickets)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setNewUser({
                    username: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    roles: [],
                    department: '',
                    position: '',
                    isAgent: false,
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Details</h2>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-blue-600">
                      {viewingUser.firstName.charAt(0)}{viewingUser.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {viewingUser.firstName} {viewingUser.lastName}
                    </h3>
                    <p className="text-gray-600">{viewingUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          viewingUser.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {viewingUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {viewingUser.isAgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Agent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="text-sm text-gray-900">{viewingUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{viewingUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="text-sm text-gray-900">{viewingUser.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <p className="text-sm text-gray-900">{viewingUser.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-sm text-gray-900">
                      {viewingUser.lastLogin 
                        ? new Date(viewingUser.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {viewingUser.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          role === 'Admin'
                            ? 'bg-red-100 text-red-800'
                            : role === 'Agent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    console.log('Edit user:', viewingUser.id);
                    setViewingUser(null);
                  }}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Agent Confirmation Dialog */}
      {convertingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Convert User to Agent
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to convert <strong>{convertingUser.firstName} {convertingUser.lastName}</strong> ({convertingUser.email}) to an agent? 
              This will give them access to manage and respond to tickets.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConvertingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleConvertToAgent(convertingUser.id);
                  setConvertingUser(null);
                }}
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Converting...' : 'Convert to Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {editingUser.firstName} {editingUser.lastName}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              User editing functionality will be implemented in the next phase. For now, you can view user details and convert to agent.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Implement edit functionality
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;