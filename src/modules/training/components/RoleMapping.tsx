import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5015/api'; // Backend API base URL

interface RoleModuleSection {
  id: number;
  roleId: string;
  roleName: string;
  moduleId: number;
  moduleName: string;
  sectionId: number;
  sectionName: string;
  erpRoleId?: string;
  erpModuleId?: string;
  erpSectionId?: string;
}

interface ModuleAccess {
  moduleId: number;
  moduleName: string;
  totalSections: number;
  accessibleSections: number;
  accessibleSectionNames: string[];
}

interface RoleWithAccess {
  roleId: string;
  roleName: string;
  originalRoleId?: number;
  moduleAccess: ModuleAccess[];
}

const RoleMapping: React.FC = () => {
  const [roleAccess, setRoleAccess] = useState<RoleModuleSection[]>([]);
  const [rolesWithAccess, setRolesWithAccess] = useState<RoleWithAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [seedMessage, setSeedMessage] = useState('');

  const fetchRoleAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/roleaccess`);
      if (response.ok) {
        const data = await response.json();
        setRoleAccess(data);
      } else {
        console.error('Failed to fetch role access:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching role access:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesWithAccess = async () => {
    try {
      const response = await fetch(`${API_BASE}/roleaccess/roles-summary`);
      if (response.ok) {
        const data = await response.json();
        setRolesWithAccess(data);
      } else {
        console.error('Failed to fetch roles with access:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching roles with access:', error);
    }
  };

  const seedRoleData = async () => {
    setSeedStatus('loading');
    setSeedMessage('');
    try {
      const response = await fetch(`${API_BASE}/roleaccess/seed-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSeedStatus('success');
        setSeedMessage(data.message);
        // Refresh data after successful seeding
        await fetchRoleAccess();
        await fetchRolesWithAccess();
      } else {
        setSeedStatus('error');
        setSeedMessage(data.message || 'Failed to seed role data');
      }
    } catch (error) {
      setSeedStatus('error');
      setSeedMessage(`Error seeding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchRoleAccess();
    fetchRolesWithAccess();
  }, []);

  const getSectionsByCategory = (sections: RoleModuleSection[]) => {
    const categories = {
      'User Setup (100-199)': sections.filter(s => s.sectionId >= 100 && s.sectionId < 200),
      'Customer Setup (200-299)': sections.filter(s => s.sectionId >= 200 && s.sectionId < 300),
      'Operations (300-399)': sections.filter(s => s.sectionId >= 300 && s.sectionId < 400),
      'General/Administration (400-499)': sections.filter(s => s.sectionId >= 400 && s.sectionId < 500),
      'Reports (500-599)': sections.filter(s => s.sectionId >= 500 && s.sectionId < 600),
      'Post Clearance (600-699)': sections.filter(s => s.sectionId >= 600 && s.sectionId < 700),
      'HR & Admin Module 4 (3000+)': sections.filter(s => s.sectionId >= 3000),
      'Manpower Module 4 (7000+)': sections.filter(s => s.sectionId >= 7000),
    };
    return categories;
  };

  const categories = getSectionsByCategory(roleAccess);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Role Module Section Mapping
            </h1>
            <p className="text-gray-600">
              Manage role-based access control for ERP training modules and sections
            </p>
          </div>
          <button 
            onClick={seedRoleData} 
            disabled={seedStatus === 'loading'}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              seedStatus === 'loading' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {seedStatus === 'loading' ? 'Seeding Data...' : 'Seed Role Data'}
          </button>
        </div>

        {/* Seed Status */}
        {seedStatus !== 'idle' && (
          <div className={`p-4 rounded-lg border ${
            seedStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            seedStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <span className="font-medium mr-2">
                {seedStatus === 'success' ? '✅' : seedStatus === 'error' ? '❌' : '⏳'}
              </span>
              {seedMessage}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              👥
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{rolesWithAccess.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              📋
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{roleAccess.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              ⚙️
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(categories).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              🔗
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Mappings</p>
              <p className="text-2xl font-bold text-gray-900">{roleAccess.filter(r => r.roleId).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Access by Category */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Role Access by Functional Area</h2>
        
        {Object.entries(categories).map(([category, sections]) => (
          sections.length > 0 && (
            <div key={category} className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {sections.length} sections
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{section.sectionName}</p>
                        <p className="text-sm text-gray-600">
                          Section ID: {section.sectionId} | Role: {section.roleName || 'Admin'}
                        </p>
                      </div>
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Roles Summary */}
      {rolesWithAccess.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Roles Access Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rolesWithAccess.slice(0, 6).map((role) => (
              <div key={role.roleId} className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{role.roleName}</h3>
                    {role.originalRoleId && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        ID: {role.originalRoleId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {role.moduleAccess.map((module) => (
                      <div key={module.moduleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{module.moduleName}</p>
                          <p className="text-xs text-gray-600">
                            {module.accessibleSections}/{module.totalSections} sections accessible
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-800">
                              {module.totalSections > 0 ? Math.round((module.accessibleSections / module.totalSections) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
          <span>Loading role access data...</span>
        </div>
      )}
    </div>
  );
};

export default RoleMapping;
