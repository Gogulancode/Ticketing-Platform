import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Edit, UserPlus, CheckCircle, XCircle, Eye, X, 
  UserCheck, RefreshCw, Upload, Download, FileSpreadsheet, AlertCircle, Key
} from 'lucide-react';
import AdminRouteGuard from '../components/AdminRouteGuard';
import { API_CONFIG } from '@/config/api';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

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
  branchId?: number;
  branchName?: string;
  branchCode?: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  city?: string;
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
  const [activeTab, setActiveTab] = useState<'users' | 'agents' | 'create' | 'bulk'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [convertingUser, setConvertingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // Bulk upload states
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{current: number; total: number; success: number; failed: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Branch state for dropdown
  const [branches, setBranches] = useState<Branch[]>([]);
  
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
    branchId: '' as string | number,
  });

  // Edit user form state
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    roles: [] as string[],
    department: '',
    position: '',
    isActive: true,
    isAgent: false,
    branchId: '' as string | number,
  });

  // View user modal - store ID only and compute user from users array
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  
  // Compute the actual viewing user from users array
  const viewingUser = viewingUserId ? users.find(u => u.id === viewingUserId) || null : null;

  const availableRoles = ['Admin', 'User'];
  const availableDepartments = ['IT', 'Support', 'Sales', 'Operations', 'HR', 'Finance'];

  const loadUsers = useCallback(async (page: number = 1, search: string = searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        _t: Date.now().toString(),
      });

      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        params.append('search', trimmedSearch);
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

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users?${params.toString()}`,
        {
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache'
          }
        }
      );

      if (response.ok) {
        const userData = await response.json();
        console.log('📥 Loaded users from server:', userData.users);
        setUsers(userData.users || []);
        if (userData.pagination) {
          setCurrentPage(userData.pagination.currentPage);
          setTotalPages(userData.pagination.totalPages);
          setTotalUsers(userData.pagination.totalCount);
        }
      } else {
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
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, pageSize, searchTerm, selectedRole, statusFilter]);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const agentData = await response.json();
        setAgents(Array.isArray(agentData) ? agentData : []);
      } else {
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
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load branches for dropdown
  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/branches/lookup`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  }, []);

  // Load data
  useEffect(() => {
    loadUsers(1);
    loadBranches();
    if (activeTab === 'agents') {
      loadAgents();
    }
  }, [activeTab, loadAgents, loadUsers, loadBranches]);

  // Debounced search effect
  useEffect(() => {
    if (activeTab !== 'users') return;
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when searching
      loadUsers(1);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [activeTab, departmentFilter, loadUsers, searchTerm, selectedRole, statusFilter]);


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
      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
          branchId: newUser.branchId ? Number(newUser.branchId) : null,
        }),
      });

      if (response.ok) {
        setSuccess('User created successfully!');
        setTimeout(() => setSuccess(null), 3000);
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
          branchId: '',
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
      // API call to backend server for agent conversion
      const response = await fetch(`${API_CONFIG.BASE_URL}/ticketing/acl/convert-to-agent/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSuccess('User converted to agent successfully!');
        loadUsers(currentPage, searchTerm);
        loadAgents();
      } else {
        const errorData = await response.json();
        setError(errorData.Message || 'Failed to convert user to agent');
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
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

  // Handle editing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roles: user.roles || [],
      department: user.department || '',
      position: user.position || '',
      isActive: user.isActive,
      isAgent: user.isAgent || false,
      branchId: user.branchId || '',
    });
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Updating user:', editingUser.id);
      console.log('📝 Update data:', editUserForm);
      
      const apiUrl = `${API_CONFIG.BASE_URL}/users/${editingUser.id}`;
      console.log('🌐 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(editUserForm),
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Update successful:', responseData);
        
        // Extract user data from response (backend returns {success, message, user})
        const updatedUserData = responseData.user || responseData;
        console.log('📦 Updated user data from server:', updatedUserData);
        console.log('📋 Fields in response:', Object.keys(updatedUserData));
        console.log('🔍 Position:', updatedUserData.position);
        console.log('🔍 IsAgent:', updatedUserData.isAgent);
        console.log('🔍 Roles:', updatedUserData.roles);
        console.log('🔍 IsActive:', updatedUserData.isActive);
        
        setSuccess('User updated successfully');
        
        // Reload users immediately from server to get fresh data
        console.log('🔃 Reloading users from server...');
        await loadUsers(currentPage, searchTerm);
        console.log('✅ Users reloaded');
        
        // Close modal after reload
        setTimeout(() => {
          setEditingUser(null);
          setEditUserForm({
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            roles: [],
            department: '',
            position: '',
            isActive: true,
            isAgent: false,
            branchId: '',
          });
        }, 800);
        
        // Auto-dismiss success message
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        setError(errorData.message || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle admin reset password
  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    // Validate passwords
    if (!newPasswordForm.password) {
      setError('Please enter a new password');
      return;
    }

    if (newPasswordForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setResetPasswordLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword: newPasswordForm.password }),
      });

      if (response.ok) {
        setSuccess(`Password reset successfully for ${resetPasswordUser.firstName} ${resetPasswordUser.lastName}`);
        setResetPasswordUser(null);
        setNewPasswordForm({ password: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error('Error resetting password:', err);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      // API call via proxy to backend server for agent status toggle
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/settings/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setSuccess('Agent status updated successfully!');
        loadAgents();
        // Also refresh users list since isAgent status changes
        loadUsers(currentPage, searchTerm);
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
    <AdminRouteGuard>
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
        <div className="bg-red-50 border border-red-200 text-gray-700 px-4 py-3 rounded-md">
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
                ? 'border-red-500 text-gray-600'
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
                ? 'border-red-500 text-gray-600'
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
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Create User
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Bulk Upload
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
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Role Filter (Users only) */}
            {activeTab === 'users' && (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
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
                    Branch
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
                    <td colSpan={7} className="px-6 py-4 text-center">
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
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
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
                          {user.roles
                            .filter(role => role !== 'Agent' || user.isAgent) // Hide Agent role if user is no longer an agent
                            .map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                role === 'Admin'
                                  ? 'bg-red-100 text-gray-800'
                                  : role === 'Agent'
                                  ? 'bg-red-100 text-gray-800'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.branchName ? (
                          <span className="inline-flex items-center">
                            <span className="font-medium">{user.branchCode}</span>
                            <span className="ml-1 text-gray-500">- {user.branchName}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-gray-800'
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
                            onClick={() => {
                              console.log('👁️ Opening view modal for user:', user.id, user);
                              setViewingUserId(user.id);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResetPasswordUser(user);
                              setNewPasswordForm({ password: '', confirmPassword: '' });
                            }}
                            className="text-orange-600 hover:text-orange-900"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
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
                                ? 'text-gray-600 hover:text-gray-900'
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
                                ? 'z-10 bg-red-50 border-red-500 text-gray-600'
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
                              : 'bg-red-100 text-gray-800'
                          }`}
                        >
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleAgentStatus(agent.id, agent.isActive)}
                            className={`text-sm px-3 py-1 rounded-md font-medium ${
                              agent.isActive
                                ? 'text-gray-700 bg-red-50 hover:bg-red-100'
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  value={newUser.branchId}
                  onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code}){branch.city ? ` - ${branch.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
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
                      className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
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
                    branchId: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-900 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload Users</h2>
            <p className="text-sm text-gray-600">
              Upload a CSV or Excel file to create multiple users at once. Download the template to see the required format.
            </p>
          </div>

          {/* Download Template */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Download Template</h3>
                  <p className="text-sm text-gray-500">Use this template to prepare your user data</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Create CSV template
                  const headers = ['username', 'email', 'firstName', 'lastName', 'phone', 'password', 'department', 'position', 'roles', 'isAgent'];
                  const exampleRow = ['john.doe', 'john.doe@company.com', 'John', 'Doe', '+1234567890', 'SecurePassword123!', 'IT', 'Developer', 'User', 'false'];
                  const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'user_upload_template.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setBulkUploadFile(file);
                  setBulkUploadErrors([]);
                  setBulkUploadProgress(null);
                  
                  // Parse CSV file
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    
                    const users = lines.slice(1).map((line, index) => {
                      const values = line.split(',').map(v => v.trim());
                      const user: Record<string, string> = {};
                      headers.forEach((header, i) => {
                        user[header] = values[i] || '';
                      });
                      user._rowNum = (index + 2).toString();
                      return user;
                    });
                    
                    setBulkUploadPreview(users);
                  };
                  reader.readAsText(file);
                }
              }}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-1">
                {bulkUploadFile ? bulkUploadFile.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">CSV files supported (max 1000 users)</p>
            </div>
          </div>

          {/* Preview Table */}
          {bulkUploadPreview.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Preview ({bulkUploadPreview.length} users)</h3>
                <button
                  onClick={() => {
                    setBulkUploadFile(null);
                    setBulkUploadPreview([]);
                    setBulkUploadErrors([]);
                    setBulkUploadProgress(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              
              <div className="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Username</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">First Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Last Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Department</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkUploadPreview.slice(0, 10).map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{user._rowNum}</td>
                        <td className="px-3 py-2">{user.username}</td>
                        <td className="px-3 py-2">{user.email}</td>
                        <td className="px-3 py-2">{user.firstname || user.firstName}</td>
                        <td className="px-3 py-2">{user.lastname || user.lastName}</td>
                        <td className="px-3 py-2">{user.department}</td>
                        <td className="px-3 py-2">{user.roles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bulkUploadPreview.length > 10 && (
                  <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                    ... and {bulkUploadPreview.length - 10} more users
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {bulkUploadErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-800">Upload Errors</h3>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {bulkUploadErrors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              {bulkUploadErrors.length > 10 && (
                <p className="mt-2 text-sm text-red-600">... and {bulkUploadErrors.length - 10} more errors</p>
              )}
            </div>
          )}

          {/* Progress */}
          {bulkUploadProgress && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-800">Uploading Users...</span>
                <span className="text-sm text-blue-600">
                  {bulkUploadProgress.current} / {bulkUploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">✓ {bulkUploadProgress.success} successful</span>
                <span className="text-red-600">✗ {bulkUploadProgress.failed} failed</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {bulkUploadPreview.length > 0 && !bulkUploadProgress && (
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (bulkUploadPreview.length === 0) return;
                  
                  setBulkUploadErrors([]);
                  setBulkUploadProgress({ current: 0, total: bulkUploadPreview.length, success: 0, failed: 0 });
                  
                  const errors: string[] = [];
                  let successCount = 0;
                  let failedCount = 0;
                  
                  for (let i = 0; i < bulkUploadPreview.length; i++) {
                    const user = bulkUploadPreview[i];
                    
                    try {
                      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          username: user.username,
                          email: user.email,
                          firstName: user.firstname || user.firstName,
                          lastName: user.lastname || user.lastName,
                          phone: user.phone || '',
                          password: user.password || 'DefaultPassword123!',
                          department: user.department || '',
                          position: user.position || '',
                          roles: user.roles ? user.roles.split(';').map((r: string) => r.trim()) : ['User'],
                          isAgent: user.isagent === 'true' || user.isAgent === 'true',
                        }),
                      });
                      
                      if (response.ok) {
                        successCount++;
                      } else {
                        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                        errors.push(`Row ${user._rowNum}: ${errorData.message || response.statusText}`);
                        failedCount++;
                      }
                    } catch (err) {
                      errors.push(`Row ${user._rowNum}: Network error`);
                      failedCount++;
                    }
                    
                    setBulkUploadProgress({ current: i + 1, total: bulkUploadPreview.length, success: successCount, failed: failedCount });
                  }
                  
                  setBulkUploadErrors(errors);
                  
                  if (successCount > 0) {
                    setSuccess(`Successfully created ${successCount} user(s)`);
                    loadUsers(1);
                  }
                }}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload {bulkUploadPreview.length} Users
              </button>
            </div>
          )}
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
                  onClick={() => {
                    console.log('❌ Closing view modal');
                    setViewingUserId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {(() => {
                console.log('📺 Rendering modal with viewingUser:', {
                  id: viewingUser.id,
                  position: viewingUser.position,
                  isAgent: viewingUser.isAgent,
                  roles: viewingUser.roles
                });
                return null;
              })()}

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-600">
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
                            : 'bg-red-100 text-gray-800'
                        }`}
                      >
                        {viewingUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {viewingUser.isAgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-gray-800">
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
                      {new Date(viewingUser.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
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
                            ? 'bg-red-100 text-gray-800'
                            : role === 'Agent'
                            ? 'bg-red-100 text-gray-800'
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
                  onClick={() => setViewingUserId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    console.log('Edit user:', viewingUser?.id);
                    setViewingUserId(null);
                  }}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {editingUser.firstName} {editingUser.lastName}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm({...editUserForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({...editUserForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({...editUserForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({...editUserForm, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={editUserForm.position}
                  onChange={(e) => setEditUserForm({...editUserForm, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={editUserForm.branchId}
                  onChange={(e) => setEditUserForm({...editUserForm, branchId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code}){branch.city ? ` - ${branch.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableRoles.map(role => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editUserForm.roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditUserForm({...editUserForm, roles: [...editUserForm.roles, role]});
                          } else {
                            setEditUserForm({...editUserForm, roles: editUserForm.roles.filter(r => r !== role)});
                          }
                        }}
                        className="mr-2"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editUserForm.isActive}
                    onChange={(e) => setEditUserForm({...editUserForm, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  Active User
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editUserForm.isAgent}
                    onChange={(e) => setEditUserForm({...editUserForm, isAgent: e.target.checked})}
                    className="mr-2"
                  />
                  Ticketing Agent
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Key className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Reset Password
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Set a new password for <strong>{resetPasswordUser.firstName} {resetPasswordUser.lastName}</strong> ({resetPasswordUser.email})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPasswordForm.password}
                  onChange={(e) => setNewPasswordForm({...newPasswordForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newPasswordForm.confirmPassword}
                  onChange={(e) => setNewPasswordForm({...newPasswordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {newPasswordForm.password && newPasswordForm.confirmPassword && 
                newPasswordForm.password !== newPasswordForm.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPasswordForm({ password: '', confirmPassword: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordLoading || !newPasswordForm.password || newPasswordForm.password !== newPasswordForm.confirmPassword}
                className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminRouteGuard>
  );
};

export default UserManagementPage;