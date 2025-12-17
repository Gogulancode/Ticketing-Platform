import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { 
  settingsApi, 
  CategoryAdmin, 
  CategoryAdminCreateRequest,
  AvailableUser,
  TicketCategoryConfig 
} from '@api/settingsApi';

interface CategoryAdminsTabProps {
  categoryId?: number; // Optional - if provided, only show admins for this category
  categoryName?: string;
}

const CategoryAdminsTab: React.FC<CategoryAdminsTabProps> = ({ categoryId, categoryName }) => {
  const [categoryAdmins, setCategoryAdmins] = useState<CategoryAdmin[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [categories, setCategories] = useState<TicketCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(categoryId || '');
  const [permissions, setPermissions] = useState({
    canViewTickets: true,
    canManageAgents: true,
    canViewReports: true,
    canManageSubcategories: true,
    canConfigureSettings: false
  });

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, usersData, categoriesData] = await Promise.all([
        categoryId 
          ? settingsApi.getCategoryAdminsByCategory(categoryId)
          : settingsApi.getCategoryAdmins(),
        settingsApi.getAvailableUsersForCategoryAdmin(),
        settingsApi.getTicketCategories()
      ]);
      setCategoryAdmins(adminsData);
      setAvailableUsers(usersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading category admin data:', error);
      toast.error('Failed to load category admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedUserId || !selectedCategoryId) {
      toast.error('Please select both user and category');
      return;
    }

    try {
      const request: CategoryAdminCreateRequest = {
        userId: selectedUserId,
        categoryId: selectedCategoryId as number,
        ...permissions
      };
      
      await settingsApi.createCategoryAdmin(request);
      toast.success('Category admin created successfully!');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category admin';
      toast.error(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this category admin?')) return;
    
    try {
      await settingsApi.deleteCategoryAdmin(id);
      toast.success('Category admin removed successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to remove category admin');
    }
  };

  const handleTogglePermission = async (admin: CategoryAdmin, permission: keyof typeof permissions) => {
    try {
      await settingsApi.updateCategoryAdmin(admin.id, {
        [permission]: !admin[permission]
      });
      toast.success('Permission updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update permission');
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedCategoryId(categoryId || '');
    setPermissions({
      canViewTickets: true,
      canManageAgents: true,
      canViewReports: true,
      canManageSubcategories: true,
      canConfigureSettings: false
    });
  };

  const filteredAdmins = categoryAdmins.filter(admin => 
    admin.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get users who aren't already admins for the selected category
  const availableUsersForCategory = availableUsers.filter(user => {
    if (!selectedCategoryId) return true;
    return !categoryAdmins.some(
      admin => admin.userId === user.id && admin.categoryId === selectedCategoryId
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading category admins...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
            Category Admins
            {categoryName && <span className="text-gray-500">- {categoryName}</span>}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign users to manage specific categories, their agents, and tickets.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Category Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Category Admins List */}
      {filteredAdmins.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Admins</h3>
          <p className="text-gray-500 mb-4">
            {categoryId 
              ? 'No admins assigned to this category yet.'
              : 'No category admins have been created yet.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Category Admin
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                {!categoryId && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Tickets
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manage Agents
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Reports
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manage Subcategories
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configure
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {admin.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.userName}</div>
                        <div className="text-sm text-gray-500">{admin.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  {!categoryId && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-gray-800">
                        {admin.categoryName}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PermissionToggle
                      enabled={admin.canViewTickets}
                      onChange={() => handleTogglePermission(admin, 'canViewTickets')}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PermissionToggle
                      enabled={admin.canManageAgents}
                      onChange={() => handleTogglePermission(admin, 'canManageAgents')}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PermissionToggle
                      enabled={admin.canViewReports}
                      onChange={() => handleTogglePermission(admin, 'canViewReports')}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PermissionToggle
                      enabled={admin.canManageSubcategories}
                      onChange={() => handleTogglePermission(admin, 'canManageSubcategories')}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PermissionToggle
                      enabled={admin.canConfigureSettings}
                      onChange={() => handleTogglePermission(admin, 'canConfigureSettings')}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Remove category admin"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{categoryAdmins.length}</div>
            <div className="text-sm text-gray-500">Total Assignments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(categoryAdmins.map(a => a.userId)).size}
            </div>
            <div className="text-sm text-gray-500">Unique Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(categoryAdmins.map(a => a.categoryId)).size}
            </div>
            <div className="text-sm text-gray-500">Categories Covered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {categoryAdmins.filter(a => a.canConfigureSettings).length}
            </div>
            <div className="text-sm text-gray-500">Full Config Access</div>
          </div>
        </div>
      </div>

      {/* Add Category Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                  Add Category Admin
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User <span className="text-gray-500">*</span>
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select a user...</option>
                    {availableUsersForCategory.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                {!categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Category <span className="text-gray-500">*</span>
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    <PermissionCheckbox
                      label="View Tickets"
                      description="Can see tickets in this category"
                      checked={permissions.canViewTickets}
                      onChange={(checked) => setPermissions(p => ({ ...p, canViewTickets: checked }))}
                    />
                    <PermissionCheckbox
                      label="Manage Agents"
                      description="Can assign/reassign agents in this category"
                      checked={permissions.canManageAgents}
                      onChange={(checked) => setPermissions(p => ({ ...p, canManageAgents: checked }))}
                    />
                    <PermissionCheckbox
                      label="View Reports"
                      description="Can access analytics and reports for this category"
                      checked={permissions.canViewReports}
                      onChange={(checked) => setPermissions(p => ({ ...p, canViewReports: checked }))}
                    />
                    <PermissionCheckbox
                      label="Manage Subcategories"
                      description="Can create/edit subcategories under this category"
                      checked={permissions.canManageSubcategories}
                      onChange={(checked) => setPermissions(p => ({ ...p, canManageSubcategories: checked }))}
                    />
                    <PermissionCheckbox
                      label="Configure Settings"
                      description="Can modify SLA, auto-assignment rules, etc."
                      checked={permissions.canConfigureSettings}
                      onChange={(checked) => setPermissions(p => ({ ...p, canConfigureSettings: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!selectedUserId || !selectedCategoryId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Category Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Permission Toggle Button
const PermissionToggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-red-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Permission Checkbox for Modal
const PermissionCheckbox: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-red-500"
    />
    <div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  </label>
);

export default CategoryAdminsTab;
