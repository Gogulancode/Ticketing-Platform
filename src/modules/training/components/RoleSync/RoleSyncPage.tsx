import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Shield, AlertCircle, Search, Filter } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sections: RoleSection[];
  syncedAt: string;
  lastModified: string;
  source: 'ERP' | 'Local';
}

interface RoleSection {
  id: string;
  sectionId: string;
  sectionName: string;
  moduleId: string;
  moduleName: string;
  permissions: string[];
  isActive: boolean;
  order: number;
}

interface SyncStatus {
  isConnected: boolean;
  lastSync: string;
  totalRoles: number;
  syncedRoles: number;
  pendingRoles: number;
  failedRoles: number;
  errors: string[];
  isRunning: boolean;
}

const RoleSyncPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'ERP' | 'Local'>('all');
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: '',
    totalRoles: 0,
    syncedRoles: 0,
    pendingRoles: 0,
    failedRoles: 0,
    errors: [],
    isRunning: false
  });

  // Load roles and sync status on component mount
  useEffect(() => {
    loadRoles();
    loadSyncStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!loading) {
        loadSyncStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5015/api/rolesync/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('http://localhost:5015/api/RoleSync/status');
      if (response.ok) {
        const status = await response.json();
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const performSync = async () => {
    try {
      setLoading(true);
      setSyncStatus(prev => ({ ...prev, isRunning: true }));
      
      const response = await fetch('http://localhost:5015/api/rolesync/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await loadRoles();
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
    }
  };

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const getModuleColor = (moduleId: string): string => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'red', 'teal'];
    const hash = moduleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && role.isActive) ||
                         (filterStatus === 'inactive' && !role.isActive);

    const matchesSource = filterSource === 'all' || role.source === filterSource;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Role Synchronization</h2>
            <p className="text-gray-600">Manage and synchronize roles with external ERP systems</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.syncedRoles}</div>
              <div className="text-sm text-blue-800">Synced Roles</div>
            </div>
          </div>
        </div>

        {/* Sync Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-700">Connection</span>
            </div>
            <div className={`text-sm font-semibold ${syncStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {syncStatus.isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Total Roles</div>
            <div className="text-lg font-bold text-gray-900">{syncStatus.totalRoles}</div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Synced</div>
            <div className="text-lg font-bold text-green-600">{syncStatus.syncedRoles}</div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Pending</div>
            <div className="text-lg font-bold text-yellow-600">{syncStatus.pendingRoles}</div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Failed</div>
            <div className="text-lg font-bold text-red-600">{syncStatus.failedRoles}</div>
          </div>
        </div>

        {/* Last Sync Info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
          </div>
          <button
            onClick={performSync}
            disabled={loading || syncStatus.isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || syncStatus.isRunning) ? 'animate-spin' : ''}`} />
            {syncStatus.isRunning ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Sources</option>
              <option value="ERP">ERP</option>
              <option value="Local">Local</option>
            </select>

            <div className="text-sm text-gray-600">
              {filteredRoles.length} of {roles.length} roles
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' || filterSource !== 'all'
                  ? 'No roles match your current filters.'
                  : 'No roles have been synced yet.'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterSource === 'all' && (
                <button
                  onClick={performSync}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mx-auto"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Start Sync
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredRoles.map(role => {
            const isExpanded = expandedRoles.has(role.id);
            const activeSections = role.sections.filter(s => s.isActive).length;
            
            return (
              <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Role Header - Primary */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleRoleExpansion(role.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Role Icon */}
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Role Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{role.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            role.source === 'ERP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {role.source}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{role.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {role.sections.length} sections • {activeSections} active
                        </span>
                        <span className="text-xs text-gray-500">
                          Synced: {new Date(role.syncedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="p-1">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Sections - Secondary */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-900">Role Sections</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {activeSections} of {role.sections.length} sections active
                          </span>
                        </div>
                      </div>

                      {role.sections.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <div className="h-4 w-4 bg-gray-400 rounded"></div>
                          </div>
                          <p className="text-sm text-gray-500">No sections assigned to this role</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {role.sections.map(section => (
                            <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
                              {/* Section Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">{section.sectionName}</h5>
                                  <p className="text-xs text-gray-500 truncate">Section ID: {section.sectionId}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${section.isActive ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              </div>

                              {/* Module Badge */}
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${getModuleColor(section.moduleId)}-100 text-${getModuleColor(section.moduleId)}-700`}>
                                  {section.moduleName}
                                </span>
                                <span className="text-xs text-gray-400">#{section.order}</span>
                              </div>

                              {/* Permissions */}
                              {section.permissions.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {section.permissions.map(permission => (
                                      <span key={permission} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                        {permission}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sync Errors */}
      {syncStatus.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h4 className="text-sm font-medium text-red-800">Sync Errors</h4>
          </div>
          <div className="space-y-1">
            {syncStatus.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">{error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSyncPage;
