import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react';

interface RoleModuleAccess {
  id: number;
  roleId: string;
  moduleName: string;
  sectionName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

const RoleModuleImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [roleModuleAccess, setRoleModuleAccess] = useState<RoleModuleAccess[]>([]);
  const [showAccessList, setShowAccessList] = useState(false);

  const handleFileUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5015/api/rolemoduleimport/import-json', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setFile(null);
        // Refresh the access list
        loadRoleModuleAccess();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error uploading file' });
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async () => {
    if (!jsonContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter JSON content' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5015/api/rolemoduleimport/import-json-string', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonContent: jsonContent }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setJsonContent('');
        // Refresh the access list
        loadRoleModuleAccess();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error submitting JSON' });
    } finally {
      setLoading(false);
    }
  };

  const validateJson = async () => {
    if (!jsonContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter JSON content to validate' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5015/api/rolemoduleimport/validate-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonContent),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'JSON structure is valid!' });
      } else {
        setMessage({ type: 'error', text: `Validation errors: ${result.errors?.join(', ')}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error validating JSON' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoleModuleAccess = async () => {
    try {
      const response = await fetch('http://localhost:5015/api/rolemoduleimport');
      if (response.ok) {
        const data = await response.json();
        setRoleModuleAccess(data);
        setShowAccessList(true);
      }
    } catch (error) {
      console.error('Error loading role module access:', error);
    }
  };

  const downloadSampleJson = () => {
    const sampleData = [
      {
        roleName: "Admin",
        erpRoleId: "ADMIN_001",
        modules: [
          {
            moduleName: "Financial Management",
            erpModuleId: "FIN_001",
            canView: true,
            canEdit: true,
            canDelete: true,
            sections: [
              {
                sectionName: "Accounts Payable",
                erpSectionId: "AP_001",
                canView: true,
                canEdit: true,
                canDelete: true
              }
            ]
          }
        ]
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-role-module-access.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadUserRoleSampleJson = () => {
    const sampleData = [
      {
        "lRoleId": 1,
        "lModuleId": 1,
        "lTaskId": 100,
        "sTaskId": "User Setup"
      },
      {
        "lRoleId": 1,
        "lModuleId": 1,
        "lTaskId": 101,
        "sTaskId": "System Configuration"
      },
      {
        "lRoleId": 2,
        "lModuleId": 2,
        "lTaskId": 200,
        "sTaskId": "Financial Reports"
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-user-role-module-section.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-blue-600" />
          Import Role Module Access
        </h2>

        {/* Format Information */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Supported JSON Formats:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>• Flat Array Format:</strong> [{"{"}"lRoleId": 1, "lModuleId": 1, "lTaskId": 100, "sTaskId": "Section Name"{"}"}]</li>
            <li><strong>• Hierarchical Format:</strong> [{"{"}"roleName": "Admin", "modules": [...]{"}"}</li>
            <li><strong>• Auto-Detection:</strong> The system will automatically detect your JSON format</li>
          </ul>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
             message.type === 'error' ? <AlertCircle className="h-5 w-5 mr-2" /> :
             <FileText className="h-5 w-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* File Upload Method */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Method 1: Upload JSON File</h3>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* JSON Text Method */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Method 2: Paste JSON Content</h3>
          <textarea
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            placeholder="Paste your JSON content here..."
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex space-x-2 mt-3">
            <button
              onClick={validateJson}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              Validate JSON
            </button>
            <button
              onClick={handleJsonSubmit}
              disabled={loading || !jsonContent.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>

        {/* Helper Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={downloadSampleJson}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Hierarchical Sample
            </button>
            
            <button
              onClick={downloadUserRoleSampleJson}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Flat Array Sample
            </button>
          </div>
          
          <button
            onClick={loadRoleModuleAccess}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Current Access
          </button>
        </div>
      </div>

      {/* Current Role Module Access */}
      {showAccessList && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Role Module Access</h2>
          
          {roleModuleAccess.length === 0 ? (
            <p className="text-gray-500">No role module access configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleModuleAccess.map((access) => (
                    <tr key={access.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {access.roleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {access.moduleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {access.sectionName || 'All Sections'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          {access.canView && <span title="Can View"><Eye className="h-4 w-4 text-green-600" /></span>}
                          {access.canEdit && <span title="Can Edit"><Edit className="h-4 w-4 text-blue-600" /></span>}
                          {access.canDelete && <span title="Can Delete"><Trash2 className="h-4 w-4 text-red-600" /></span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          access.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {access.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleModuleImport;
