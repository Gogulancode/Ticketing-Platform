import React from 'react';
import { Mail, Plus, Edit2, Trash2, Eye, EyeOff, Server, Shield, Settings } from 'lucide-react';

export interface EmailConfiguration {
  id: number;
  name: string;
  emailAddress: string;
  isActive: boolean;
  server: {
    host: string;
    port: number;
    useSSL: boolean;
    username: string;
    password: string;
  };
  rules: EmailRule[];
}

export interface EmailRule {
  id: number;
  name: string;
  keywords: string[];
  assignToAgentId?: number;
  assignToGroupId?: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  isActive: boolean;
}

interface EmailIntegrationProps {
  configurations: EmailConfiguration[];
  agents: { id: number; name: string; email: string; isActive: boolean }[];
  groups: { id: number; name: string; isActive: boolean }[];
  onAddConfiguration: (config: Omit<EmailConfiguration, 'id'>) => void;
  onEditConfiguration: (config: EmailConfiguration) => void;
  onDeleteConfiguration: (id: number) => void;
  onToggleConfigurationActive: (id: number) => void;
}

const EmailIntegration: React.FC<EmailIntegrationProps> = ({
  configurations,
  agents,
  groups,
  onAddConfiguration,
  onEditConfiguration,
  onDeleteConfiguration,
  onToggleConfigurationActive,
}) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [activeTab, setActiveTab] = React.useState<'configs' | 'test'>('configs');
  
  const [formData, setFormData] = React.useState<Omit<EmailConfiguration, 'id'>>({
    name: '',
    emailAddress: '',
    isActive: true,
    server: {
      host: 'outlook.office365.com',
      port: 993,
      useSSL: true,
      username: '',
      password: '',
    },
    rules: [],
  });

  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      emailAddress: '',
      isActive: true,
      server: {
        host: 'outlook.office365.com',
        port: 993,
        useSSL: true,
        username: '',
        password: '',
      },
      rules: [],
    });
    setShowAddForm(false);
    setEditingId(undefined);
  };

  const handleSubmit = () => {
    if (formData.name.trim() && formData.emailAddress.trim() && formData.server.username.trim()) {
      if (editingId) {
        onEditConfiguration({ id: editingId, ...formData });
      } else {
        onAddConfiguration(formData);
      }
      resetForm();
    }
  };

  const startEditing = (config: EmailConfiguration) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      emailAddress: config.emailAddress,
      isActive: config.isActive,
      server: { ...config.server },
      rules: [...config.rules],
    });
  };

  const handleTestConnection = async (configId?: number) => {
    try {
      setTestResult({ success: false, message: 'Testing connection...' });
      
      // Simulate API call to test email configuration
      const testConfig = configId 
        ? configurations.find(c => c.id === configId)
        : formData;
      
      if (!testConfig) {
        setTestResult({ success: false, message: 'Configuration not found' });
        return;
      }

      // Simulate delay and response
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate for demo
        setTestResult({
          success,
          message: success 
            ? 'Connection successful! Email integration is working correctly.'
            : 'Connection failed. Please check your server settings and credentials.',
        });
      }, 2000);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed with error: ' + (error as Error).message,
      });
    }
  };

  const addRule = () => {
    const newRule: EmailRule = {
      id: Math.max(0, ...formData.rules.map(r => r.id)) + 1,
      name: '',
      keywords: [],
      priority: 'Medium',
      isActive: true,
    };
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const updateRule = (ruleId: number, updates: Partial<EmailRule>) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const deleteRule = (ruleId: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Mail className="text-indigo-600" size={24} />
        <h3 className="text-lg font-semibold">Email Integration</h3>
        <span className="text-sm text-gray-500">
          Office 365 & Exchange Server Support
        </span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('configs')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'configs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Configurations
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'test'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Server size={16} className="inline mr-2" />
          Test & Monitor
        </button>
      </div>

      {activeTab === 'configs' && (
        <>
          {/* Add button */}
          {!showAddForm && !editingId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Email Configuration
            </button>
          )}

          {/* Add/Edit form */}
          {(showAddForm || editingId) && (
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Settings size={18} />
                {editingId ? 'Edit Email Configuration' : 'Add New Email Configuration'}
              </h4>
              
              {/* Basic settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., IT Help Desk, Support Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="support@company.com"
                  />
                </div>
              </div>

              {/* Server settings */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Server size={16} />
                  Server Settings
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMAP Server *
                    </label>
                    <input
                      type="text"
                      value={formData.server.host}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        server: { ...prev.server, host: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="outlook.office365.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port *
                    </label>
                    <input
                      type="number"
                      value={formData.server.port}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        server: { ...prev.server, port: parseInt(e.target.value) || 993 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.server.username}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        server: { ...prev.server, username: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="username@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.server.password}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        server: { ...prev.server, password: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.server.useSSL}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        server: { ...prev.server, useSSL: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Shield size={14} />
                      Use SSL/TLS encryption (recommended)
                    </span>
                  </label>
                </div>
              </div>

              {/* Assignment Rules */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-700 flex items-center gap-2">
                    <Settings size={16} />
                    Assignment Rules ({formData.rules.length})
                  </h5>
                  <button
                    onClick={addRule}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Rule
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rules.map((rule) => (
                    <div key={rule.id} className="p-4 border border-gray-200 rounded-md bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rule Name
                          </label>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g., High Priority Issues"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={rule.priority}
                            onChange={(e) => updateRule(rule.id, { priority: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign to Agent
                          </label>
                          <select
                            value={rule.assignToAgentId || ''}
                            onChange={(e) => updateRule(rule.id, { 
                              assignToAgentId: e.target.value ? parseInt(e.target.value) : undefined,
                              assignToGroupId: undefined 
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select agent...</option>
                            {agents.filter(a => a.isActive).map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign to Group
                          </label>
                          <select
                            value={rule.assignToGroupId || ''}
                            onChange={(e) => updateRule(rule.id, { 
                              assignToGroupId: e.target.value ? parseInt(e.target.value) : undefined,
                              assignToAgentId: undefined 
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select group...</option>
                            {groups.filter(g => g.isActive).map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Keywords (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={rule.keywords.join(', ')}
                          onChange={(e) => updateRule(rule.id, { 
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="urgent, critical, server down, login issue"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={rule.isActive}
                            onChange={(e) => updateRule(rule.id, { isActive: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                        
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.rules.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No assignment rules configured. Add rules to automatically assign tickets based on email content.
                    </div>
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || !formData.emailAddress.trim() || !formData.server.username.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update' : 'Save'} Configuration
                </button>
                <button
                  onClick={() => handleTestConnection()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Test Connection
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Configurations list */}
          <div className="space-y-3">
            {configurations.map((config) => (
              <div
                key={config.id}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail size={20} className="text-blue-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${!config.isActive ? 'text-gray-500 line-through' : ''}`}>
                      {config.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      config.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-4">
                      <span><strong>Email:</strong> {config.emailAddress}</span>
                      <span><strong>Server:</strong> {config.server.host}:{config.server.port}</span>
                    </div>
                    <div>
                      <strong>Rules:</strong> {config.rules.filter(r => r.isActive).length} active out of {config.rules.length} total
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleTestConnection(config.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Test Connection"
                  >
                    <Server size={16} />
                  </button>
                  <button
                    onClick={() => onToggleConfigurationActive(config.id)}
                    className={`p-2 rounded ${
                      config.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    title={config.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {config.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => startEditing(config)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteConfiguration(config.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {configurations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No email configurations set up yet. Add one above to start receiving tickets via email.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'test' && (
        <div className="space-y-4">
          <h4 className="font-medium">Test Email Integration</h4>
          
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">✗</div>
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configurations.filter(c => c.isActive).map((config) => (
              <div key={config.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{config.name}</h5>
                  <button
                    onClick={() => handleTestConnection(config.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Test
                  </button>
                </div>
                <p className="text-sm text-gray-600">{config.emailAddress}</p>
              </div>
            ))}
          </div>

          {configurations.filter(c => c.isActive).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active email configurations to test.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailIntegration;
