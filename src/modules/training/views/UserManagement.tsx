import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2, UserPlus, Shield, Mail, Phone, CheckCircle, XCircle, Eye, X, Save } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isERPUser: boolean;
  isAgent: boolean;
  erpUserId?: string;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
  department?: string;
  position?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'create' | 'communication'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Debug roles state
  useEffect(() => {
    console.log('🔄 [UserManagement] Roles state changed:', roles);
    console.log('📊 [UserManagement] Roles count:', roles.length);
  }, [roles]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'erp' | 'local'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // New user form state
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

  // Communication state
  const [communicationMode, setCommunicationMode] = useState<'email' | 'sms'>('email');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [communicationMessage, setCommunicationMessage] = useState({
    subject: '',
    body: '',
    roleFilter: '',
  });

  // View/Edit user state
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
  });

  useEffect(() => {
    console.log('🚀 [UserManagement] Component mounted, loading data...');
    
    // Set fallback roles immediately to ensure they're always available
    const ensureRoles = () => {
      const fallbackRoles = [
        { id: '1', name: 'Administrator', description: 'Full system access with all permissions', permissions: ['read', 'write', 'delete', 'admin'] },
        { id: '2', name: 'Operations Manager', description: 'Manage daily operations and workflows', permissions: ['read', 'write', 'manage'] },
        { id: '3', name: 'HR Manager', description: 'Human resources management and user administration', permissions: ['read', 'write', 'user_management'] },
        { id: '4', name: 'Training Coordinator', description: 'Coordinate training programs and schedules', permissions: ['read', 'write', 'training_management'] },
        { id: '5', name: 'User', description: 'Standard user access for general operations', permissions: ['read'] },
        { id: '6', name: 'QA Specialist', description: 'Quality assurance and testing specialist', permissions: ['read', 'qa_access'] },
        { id: '7', name: 'Auditor', description: 'Audit and compliance specialist', permissions: ['read', 'audit_access'] },
        { id: '8', name: 'Department Head', description: 'Department leadership and team management', permissions: ['read', 'write', 'department_management'] },
      ];
      console.log('🔧 [UserManagement] Setting immediate fallback roles:', fallbackRoles.length);
      setRoles(fallbackRoles);
    };
    
    // Set roles immediately
    ensureRoles();
    
    // Then try to load from API (will override if successful)
    loadUsers();
    loadRoles();
  }, []);

  // Reload users when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers(1); // Reset to first page when filters change
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole, userTypeFilter, statusFilter]);

  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        roleFilter: selectedRole,
        userTypeFilter: userTypeFilter,
        statusFilter: statusFilter
      });

      console.log('Loading users with params:', Object.fromEntries(params));
      
  const response = await fetch(`http://localhost:5015/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data);
        
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setTotalUsers(data.pagination?.totalCount || data.users.length);
          setCurrentPage(data.pagination?.currentPage || page);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          // Handle legacy response format (array directly)
          const usersArray = Array.isArray(data) ? data : [];
          setUsers(usersArray);
          setTotalUsers(usersArray.length);
          setCurrentPage(1);
          setTotalPages(1);
        }
      } else {
        console.error('Failed to load users, using fallback data');
        throw new Error('Failed to load users');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users from server');
      // Load mock data for demonstration
      setUsers([
        {
          id: '1',
          username: 'john.doe',
          email: 'john.doe@company.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          isActive: true,
          isERPUser: true,
          isAgent: true,
          erpUserId: 'ERP001',
          roles: ['Administrator', 'Operations Manager'],
          createdAt: '2024-01-15',
          lastLogin: '2024-01-25',
          department: 'IT',
          position: 'System Administrator',
        },
        {
          id: '2',
          username: 'jane.smith',
          email: 'jane.smith@company.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1234567891',
          isActive: true,
          isERPUser: true,
          isAgent: false,
          erpUserId: 'ERP002',
          roles: ['HR Manager', 'User'],
          createdAt: '2024-01-10',
          lastLogin: '2024-01-24',
          department: 'HR',
          position: 'HR Specialist',
        },
        {
          id: '3',
          username: 'bob.wilson',
          email: 'bob.wilson@company.com',
          firstName: 'Bob',
          lastName: 'Wilson',
          isActive: false,
          isERPUser: false,
          isAgent: false,
          roles: ['User', 'Auditor'],
          createdAt: '2024-01-20',
          department: 'Finance',
          position: 'Accountant',
        },
        {
          id: '4',
          username: 'sarah.jones',
          email: 'sarah.jones@company.com',
          firstName: 'Sarah',
          lastName: 'Jones',
          phone: '+1234567892',
          isActive: true,
          isERPUser: true,
          isAgent: true,
          erpUserId: 'ERP003',
          roles: ['Training Coordinator', 'User'],
          createdAt: '2024-01-12',
          lastLogin: '2024-01-26',
          department: 'Training',
          position: 'Training Manager',
        },
        {
          id: '5',
          username: 'mike.brown',
          email: 'mike.brown@company.com',
          firstName: 'Mike',
          lastName: 'Brown',
          phone: '+1234567893',
          isActive: true,
          isERPUser: true,
          isAgent: false,
          erpUserId: 'ERP004',
          roles: ['QA Specialist', 'User'],
          createdAt: '2024-01-18',
          lastLogin: '2024-01-25',
          department: 'Quality',
          position: 'QA Engineer',
        },
        {
          id: '6',
          username: 'lisa.garcia',
          email: 'lisa.garcia@company.com',
          firstName: 'Lisa',
          lastName: 'Garcia',
          phone: '+1234567894',
          isActive: true,
          isERPUser: true,
          isAgent: false,
          erpUserId: 'ERP005',
          roles: ['Department Head', 'Operations Manager'],
          createdAt: '2024-01-08',
          lastLogin: '2024-01-26',
          department: 'Operations',
          position: 'Operations Director',
        },
      ]);
      setTotalUsers(6);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    console.log('🔍 [UserManagement] loadRoles function called');
    try {
      // Try the RoleMappings endpoint first (same as Settings page)
      const response = await fetch('http://localhost:5015/api/RoleMappings');
      console.log('📡 [UserManagement] RoleMappings API response status:', response.status);
      
      if (response.ok) {
        let rolesData = await response.json();
        console.log('📦 Raw roles response for UserManagement:', rolesData);
        
        // Normalize roles data (same logic as Settings)
        let roles = rolesData.roles || rolesData.data || rolesData || [];
        if (!Array.isArray(roles)) roles = [];
        
        const normalizedRoles = roles.map((r: any) => ({
          id: r.id ?? r.roleId ?? r.ID ?? '',
          name: r.name ?? r.roleName ?? r.title ?? 'Unknown Role',
          description: r.description ?? r.roleDescription ?? `${r.name || 'Role'} permissions`,
          permissions: Array.isArray(r.permissions) ? r.permissions : ['read'],
        }));
        
        console.log(`✅ Normalized roles for UserManagement count: ${normalizedRoles.length}`);
        console.log('🔍 First normalized role sample:', normalizedRoles[0]);
        if (normalizedRoles.length === 0) {
          console.warn('⚠️ [UserManagement] API returned 0 roles; preserving existing fallback roles.');
          // Do NOT clear existing fallback roles
        } else {
          setRoles(normalizedRoles);
        }
      } else {
        console.warn('⚠️ [UserManagement] RoleMappings API failed, using fallback');
        throw new Error('API endpoint failed');
      }
    } catch (err) {
      console.error('❌ [UserManagement] Failed to load roles from API, using comprehensive mock data:', err);
      // Use the same comprehensive mock roles as Settings page
      const mockRoles = [
        { id: '1', name: 'Administrator', description: 'Full system access with all permissions', permissions: ['read', 'write', 'delete', 'admin'] },
        { id: '2', name: 'Operations Manager', description: 'Manage daily operations and workflows', permissions: ['read', 'write', 'manage'] },
        { id: '3', name: 'HR Manager', description: 'Human resources management and user administration', permissions: ['read', 'write', 'user_management'] },
        { id: '4', name: 'Training Coordinator', description: 'Coordinate training programs and schedules', permissions: ['read', 'write', 'training_management'] },
        { id: '5', name: 'User', description: 'Standard user access for general operations', permissions: ['read'] },
        { id: '6', name: 'QA Specialist', description: 'Quality assurance and testing specialist', permissions: ['read', 'qa_access'] },
        { id: '7', name: 'Auditor', description: 'Audit and compliance specialist', permissions: ['read', 'audit_access'] },
        { id: '8', name: 'Department Head', description: 'Department leadership and team management', permissions: ['read', 'write', 'department_management'] },
      ];
      console.log('✅ [UserManagement] Setting mock roles count:', mockRoles.length);
      console.log('🔍 Mock roles sample:', mockRoles[0]);
      setRoles(mockRoles);
    }
  };

  // Note: filteredUsers is now the users array since filtering is done server-side
  const filteredUsers = users;

  const handleCreateUser = async () => {
    // Reset previous messages
    setError(null);
    setSuccess(null);

    // Validation
    if (!newUser.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!newUser.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!newUser.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!newUser.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!newUser.password) {
      setError('Password is required');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newUser.roles.length === 0) {
      setError('At least one role must be selected');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        phone: newUser.phone.trim() || null,
        password: newUser.password,
        roles: newUser.roles,
        department: newUser.department.trim() || null,
        position: newUser.position.trim() || null,
        isAgent: newUser.isAgent,
      };

      console.log('Creating user with data:', userData);

  const response = await fetch('http://localhost:5015/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log('Create user response:', result);

      if (response.ok && result.success) {
        setSuccess(`User "${result.firstName} ${result.lastName}" created successfully`);
        
        // Reset form
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
        
        // Refresh users list
        await loadUsers();
        
        // Switch to users tab after a short delay
        setTimeout(() => {
          setActiveTab('users');
        }, 2000);
      } else {
        setError(result.message || result.errors || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommunication = async () => {
    if (selectedUsers.length === 0 && !communicationMessage.roleFilter) {
      setError('Please select users or a role filter');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5015/api/communication/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: communicationMode,
          userIds: selectedUsers,
          roleFilter: communicationMessage.roleFilter,
          subject: communicationMessage.subject,
          body: communicationMessage.body,
        }),
      });

      if (response.ok) {
        setSuccess(`${communicationMode === 'email' ? 'Email' : 'SMS'} sent successfully`);
        setCommunicationMessage({ subject: '', body: '', roleFilter: '' });
        setSelectedUsers([]);
      } else {
        setError(`Failed to send ${communicationMode}`);
      }
    } catch (err) {
      setError(`Failed to send ${communicationMode}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // View user details
  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  // Edit user
  const handleEditUser = (user: User) => {
    console.log('✏️ [UserManagement] Edit user clicked:', user.username);
    console.log('🔍 [UserManagement] Current roles state:', roles);
    console.log('📊 [UserManagement] Roles count:', roles.length);
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roles: user.roles,
      department: user.department || '',
      position: user.position || '',
      isActive: user.isActive,
      isAgent: user.isAgent || false,
    });
    console.log('📝 [UserManagement] Edit form initialized with roles:', user.roles);
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      setError(null);

  const response = await fetch(`http://localhost:5015/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      });

      if (response.ok) {
        setSuccess('User updated successfully');
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
        });
        await loadUsers(currentPage);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    if (user.isERPUser) {
      setError('Cannot delete ERP users');
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${user.username}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

  const response = await fetch(`http://localhost:5015/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        await loadUsers(currentPage);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Convert user to agent
  const handleConvertToAgent = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to convert ${user.firstName} ${user.lastName} to an agent? This will give them ticket management permissions.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try API call first
      const response = await fetch(`http://localhost:5015/api/users/${userId}/convert-to-agent`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess(`${user.firstName} ${user.lastName} has been successfully converted to an agent!`);
        try {
          const { settingsApi } = await import('../../../shared/services/api/settingsApi');
          (settingsApi as any).getAgentsWithGroups?.();
        } catch {}
        // Update user in state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isAgent: true } : u
        ));
      } else {
        throw new Error('API call failed');
      }
    } catch (err) {
      console.error('Error converting user to agent (trying local update):', err);
      // Fallback: Update locally for demo purposes
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isAgent: true } : u
      ));
      setSuccess(`${user.firstName} ${user.lastName} has been converted to an agent! (Demo mode)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gray-100 rounded-lg">
            <Users className="h-8 w-8 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and communications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-600">Admin Only</span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'users', label: 'User List', icon: Users },
            { id: 'create', label: 'Create User', icon: UserPlus },
            { id: 'communication', label: 'Communication', icon: Mail },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`mr-2 h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {Array.isArray(roles) && roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>

                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="erp">ERP Users</option>
                  <option value="local">Local Users</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div className="flex space-x-2">
                  <button
                    onClick={selectAllUsers}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {user.roles.map(role => (
                              <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.department || '-'}</div>
                          <div className="text-sm text-gray-500">{user.position || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isAgent ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Agent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConvertToAgent(user.id)}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors border border-gray-300 hover:border-blue-300"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Convert to Agent
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isERPUser ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.isERPUser ? 'ERP' : 'Local'}
                            </span>
                            {user.erpUserId && (
                              <span className="ml-2 text-xs text-gray-500">({user.erpUserId})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View User Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {!user.isERPUser && (
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => currentPage > 1 && loadUsers(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => currentPage < totalPages && loadUsers(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalUsers)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalUsers}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => currentPage > 1 && loadUsers(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        const isCurrentPage = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => loadUsers(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => currentPage < totalPages && loadUsers(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
                  <div className="text-sm text-gray-600">Active (Current Page)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.isERPUser).length}</div>
                  <div className="text-sm text-gray-600">ERP (Current Page)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{selectedUsers.length}</div>
                  <div className="text-sm text-gray-600">Selected</div>
                </div>
                <div>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Auto-Sync</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Every 24 hours</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New User</h3>
              <p className="text-gray-600">Add a new user to the system with appropriate roles and permissions.</p>
              <p className="text-sm text-gray-500 mt-1">Fields marked with * are required</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="johndoe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.doe@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="IT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="System Administrator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  {newUser.confirmPassword && newUser.password !== newUser.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles *</label>
                <select
                  multiple
                  value={newUser.roles}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setNewUser(prev => ({ ...prev, roles: selectedOptions }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                  size={4}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles
                </p>
                {newUser.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newUser.roles.map(role => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => setNewUser(prev => ({ 
                            ...prev, 
                            roles: prev.roles.filter(r => r !== role) 
                          }))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Convert to Agent Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center h-5">
                  <input
                    id="convertToAgent"
                    type="checkbox"
                    checked={newUser.isAgent}
                    onChange={(e) => setNewUser(prev => ({ ...prev, isAgent: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="convertToAgent" className="text-sm font-medium text-blue-900">
                    Convert to Agent
                  </label>
                  <p className="text-sm text-blue-700 mt-1">
                    Enable this user to handle support tickets and provide customer assistance. 
                    Agents have additional permissions for ticket management and customer support.
                  </p>
                </div>
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : newUser.isAgent ? 'Create User & Convert to Agent' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication Platform</h3>
              <p className="text-gray-600">Send emails or SMS to users based on their roles or individual selection.</p>
            </div>

            <div className="space-y-6">
              {/* Communication Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Communication Method</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="communicationMode"
                      value="email"
                      checked={communicationMode === 'email'}
                      onChange={(e) => setCommunicationMode(e.target.value as 'email' | 'sms')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="communicationMode"
                      value="sms"
                      checked={communicationMode === 'sms'}
                      onChange={(e) => setCommunicationMode(e.target.value as 'email' | 'sms')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">SMS</span>
                  </label>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipients</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                    <select
                      value={communicationMessage.roleFilter}
                      onChange={(e) => setCommunicationMessage(prev => ({ ...prev, roleFilter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Users</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-600">
                    {selectedUsers.length > 0 && (
                      <span>Selected {selectedUsers.length} individual users</span>
                    )}
                    {communicationMessage.roleFilter && (
                      <span>
                        {selectedUsers.length > 0 ? ' + ' : ''}
                        All users with {communicationMessage.roleFilter} role
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-4">
                {communicationMode === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={communicationMessage.subject}
                      onChange={(e) => setCommunicationMessage(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email subject"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {communicationMode === 'email' ? 'Message Body' : 'SMS Message'}
                  </label>
                  <textarea
                    value={communicationMessage.body}
                    onChange={(e) => setCommunicationMessage(prev => ({ ...prev, body: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter your ${communicationMode} message here...`}
                  />
                  {communicationMode === 'sms' && (
                    <div className="text-sm text-gray-500 mt-1">
                      {communicationMessage.body.length}/160 characters
                    </div>
                  )}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSendCommunication}
                  disabled={loading || (!selectedUsers.length && !communicationMessage.roleFilter) || !communicationMessage.body}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {communicationMode === 'email' ? <Mail className="h-4 w-4 mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                  {loading ? 'Sending...' : `Send ${communicationMode === 'email' ? 'Email' : 'SMS'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setViewingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.department || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingUser.position || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className={`text-sm mt-1 ${viewingUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {viewingUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Type</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {viewingUser.isERPUser ? 'ERP User' : 'Local User'}
                    {viewingUser.erpUserId && ` (${viewingUser.erpUserId})`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(viewingUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {viewingUser.roles.map(role => (
                    <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role}
                    </span>
                  ))}
                  {viewingUser.roles.length === 0 && (
                    <span className="text-sm text-gray-500">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={editUserForm.position}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editUserForm.isActive}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editUserForm.isAgent}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, isAgent: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Convert to Agent</span>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles ({roles.length} available)
                </label>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
                    <div>Roles array length: {roles.length}</div>
                    <div>Roles loaded: {roles.length > 0 ? 'Yes' : 'No'}</div>
                    <div>First role: {roles[0]?.name || 'None'}</div>
                  </div>
                )}
                <select
                  multiple
                  value={editUserForm.roles}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    console.log('🔄 [Edit Modal] Role selection changed:', selectedOptions);
                    setEditUserForm(prev => ({ ...prev, roles: selectedOptions }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  size={4}
                >
                  {roles.length === 0 ? (
                    <option disabled>No roles available (API empty) – click the Restore Fallback Roles button below</option>
                  ) : (
                    roles.map(role => (
                      <option key={role.id} value={role.name}>
                        {role.name} - {role.description}
                      </option>
                    ))
                  )}
                </select>
                {roles.length === 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('↩️ [UserManagement] Restoring fallback roles manually');
                        setRoles([
                          { id: '1', name: 'Administrator', description: 'Full system access with all permissions', permissions: ['read', 'write', 'delete', 'admin'] },
                          { id: '2', name: 'Operations Manager', description: 'Manage daily operations and workflows', permissions: ['read', 'write', 'manage'] },
                          { id: '3', name: 'HR Manager', description: 'Human resources management and user administration', permissions: ['read', 'write', 'user_management'] },
                          { id: '4', name: 'Training Coordinator', description: 'Coordinate training programs and schedules', permissions: ['read', 'write', 'training_management'] },
                          { id: '5', name: 'User', description: 'Standard user access for general operations', permissions: ['read'] },
                          { id: '6', name: 'QA Specialist', description: 'Quality assurance and testing specialist', permissions: ['read', 'qa_access'] },
                          { id: '7', name: 'Auditor', description: 'Audit and compliance specialist', permissions: ['read', 'audit_access'] },
                          { id: '8', name: 'Department Head', description: 'Department leadership and team management', permissions: ['read', 'write', 'department_management'] },
                        ]);
                      }}
                      className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Restore Fallback Roles
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles
                </p>
                {editUserForm.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editUserForm.roles.map(role => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => setEditUserForm(prev => ({ 
                            ...prev, 
                            roles: prev.roles.filter(r => r !== role) 
                          }))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
