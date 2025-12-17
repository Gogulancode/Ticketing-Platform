import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Save, 
  ChevronDown, 
  ChevronRight,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { Role, Permission, Module } from '../types';
import { updateRolePermissions } from '../api/roles';

interface PermissionManagerProps {
  role: Role;
  modules: Module[];
  onClose: () => void;
  onSave: (updatedRole: Role) => void;
}

interface ModulePermission {
  moduleId: string;
  moduleName: string;
  hasAccess: boolean;
  sections: SectionPermission[];
}

interface SectionPermission {
  sectionId: string;
  sectionName: string;
  hasAccess: boolean;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ 
  role, 
  modules, 
  onClose, 
  onSave 
}) => {
  const [loading, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyGranted, setShowOnlyGranted] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  // Initialize permissions from role and modules
  useEffect(() => {
    const modulePermissions: ModulePermission[] = modules.map(module => {
      const existingModulePermission = role.permissions.find(p => p.moduleId === module.id && !p.sectionId);
      const sectionPermissions: SectionPermission[] = (module.sections || []).map(section => {
        const existingSectionPermission = role.permissions.find(p => p.sectionId === section.id);
        return {
          sectionId: section.id,
          sectionName: section.title,
          hasAccess: existingSectionPermission?.isActive || false
        };
      });

      return {
        moduleId: module.id,
        moduleName: module.title,
        hasAccess: existingModulePermission?.isActive || false,
        sections: sectionPermissions
      };
    });

    setPermissions(modulePermissions);
  }, [role, modules]);

  const handleModuleToggle = (moduleId: string) => {
    setPermissions(prev => prev.map(module => {
      if (module.moduleId === moduleId) {
        const newHasAccess = !module.hasAccess;
        return {
          ...module,
          hasAccess: newHasAccess,
          // If granting module access, grant all sections; if removing, remove all sections
          sections: module.sections.map(section => ({
            ...section,
            hasAccess: newHasAccess
          }))
        };
      }
      return module;
    }));
  };

  const handleSectionToggle = (moduleId: string, sectionId: string) => {
    setPermissions(prev => prev.map(module => {
      if (module.moduleId === moduleId) {
        const updatedSections = module.sections.map(section => {
          if (section.sectionId === sectionId) {
            return { ...section, hasAccess: !section.hasAccess };
          }
          return section;
        });

        // Auto-grant module access if any section is granted
        const hasAnySectionAccess = updatedSections.some(s => s.hasAccess);
        
        return {
          ...module,
          hasAccess: module.hasAccess || hasAnySectionAccess,
          sections: updatedSections
        };
      }
      return module;
    }));
  };

  const handleSelectAll = () => {
    setPermissions(prev => prev.map(module => ({
      ...module,
      hasAccess: true,
      sections: module.sections.map(section => ({
        ...section,
        hasAccess: true
      }))
    })));
  };

  const handleDeselectAll = () => {
    setPermissions(prev => prev.map(module => ({
      ...module,
      hasAccess: false,
      sections: module.sections.map(section => ({
        ...section,
        hasAccess: false
      }))
    })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert permissions to API format
      const permissionsToSave: Omit<Permission, 'id' | 'roleId'>[] = [];

      permissions.forEach(module => {
        // Add module permission
        if (module.hasAccess) {
          permissionsToSave.push({
            moduleId: module.moduleId,
            moduleName: module.moduleName,
            isActive: true,
            erpModuleId: modules.find(m => m.id === module.moduleId)?.erpModuleId,
          });
        }

        // Add section permissions
        module.sections.forEach(section => {
          if (section.hasAccess) {
            permissionsToSave.push({
              moduleId: module.moduleId,
              sectionId: section.sectionId,
              moduleName: module.moduleName,
              sectionName: section.sectionName,
              isActive: true,
              erpModuleId: modules.find(m => m.id === module.moduleId)?.erpModuleId,
              erpSectionId: modules
                .find(m => m.id === module.moduleId)
                ?.sections?.find(s => s.id === section.sectionId)?.erpSectionId,
            });
          }
        });
      });

      await updateRolePermissions(role.id, permissionsToSave);

      // Update the role object with new permissions
      const updatedRole: Role = {
        ...role,
        permissions: permissionsToSave.map((perm, index) => ({
          id: `${role.id}-${index}`,
          roleId: role.id,
          ...perm
        }))
      };

      onSave(updatedRole);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = permissions.filter(module => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const moduleMatches = module.moduleName.toLowerCase().includes(searchLower);
      const sectionMatches = module.sections.some(section => 
        section.sectionName.toLowerCase().includes(searchLower)
      );
      if (!moduleMatches && !sectionMatches) return false;
    }

    if (showOnlyGranted) {
      const hasModuleAccess = module.hasAccess;
      const hasSectionAccess = module.sections.some(s => s.hasAccess);
      if (!hasModuleAccess && !hasSectionAccess) return false;
    }

    return true;
  });

  const totalPermissions = permissions.reduce((count, module) => {
    return count + (module.hasAccess ? 1 : 0) + module.sections.filter(s => s.hasAccess).length;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Permissions for "{role.name}"
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure module and section access permissions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-600">{totalPermissions}</span> permissions granted
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{modules.length}</span> modules available
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Deselect All
              </button>
              <button
                onClick={handleSelectAll}
                className="text-sm text-green-600 hover:text-green-800 flex items-center"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Select All
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search modules or sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyGranted}
                onChange={(e) => setShowOnlyGranted(e.target.checked)}
                className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
              />
              <span>Show only granted</span>
            </label>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredPermissions.map(module => {
              const isExpanded = expandedModules.includes(module.moduleId);
              const grantedSections = module.sections.filter(s => s.hasAccess).length;
              
              return (
                <div key={module.moduleId} className="border border-gray-200 rounded-lg">
                  {/* Module Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setExpandedModules(prev => 
                          isExpanded 
                            ? prev.filter(id => id !== module.moduleId)
                            : [...prev, module.moduleId]
                        )}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleModuleToggle(module.moduleId)}
                        className="flex items-center space-x-2 hover:bg-gray-100 p-1 rounded transition-colors"
                      >
                        {module.hasAccess ? (
                          <CheckSquare className="h-4 w-4 text-green-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">{module.moduleName}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        {grantedSections}/{module.sections.length} sections
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        module.hasAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {module.hasAccess ? 'Module Access' : 'No Access'}
                      </span>
                    </div>
                  </div>

                  {/* Sections */}
                  {isExpanded && module.sections.length > 0 && (
                    <div className="border-t border-gray-200">
                      {module.sections.map(section => (
                        <div key={section.sectionId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <button
                            onClick={() => handleSectionToggle(module.moduleId, section.sectionId)}
                            className="flex items-center space-x-3 flex-1 text-left hover:bg-gray-100 p-1 rounded transition-colors"
                          >
                            {section.hasAccess ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700">{section.sectionName}</span>
                          </button>
                          
                          <span className={`text-xs px-2 py-1 rounded ${
                            section.hasAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {section.hasAccess ? 'Granted' : 'Denied'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && module.sections.length === 0 && (
                    <div className="border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
                      No sections available in this module
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredPermissions.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No modules found</p>
              <p className="text-gray-400 text-sm">
                {searchTerm || showOnlyGranted 
                  ? 'Try adjusting your filters or search criteria'
                  : 'No modules are available for permission assignment'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalPermissions}</span> permissions will be saved
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
