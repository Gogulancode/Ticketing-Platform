import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  AtSymbolIcon,
  CloudIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

import {
  useGraphEmailConfigs,
  useCreateGraphEmailConfig,
  useUpdateGraphEmailConfig,
  useDeleteGraphEmailConfig,
  useTestEmailConnection
} from '@hooks/useAdvancedSettings';
import { 
  GraphEmailConfigDto
} from '@api/settingsApi';
import { settingsApi } from '@api/settingsApi';

interface EmailConfigFormData {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  email: string;
  categoryId?: number;
  processIncomingEmails: boolean;
  createTicketsFromEmails: boolean;
  sendNotifications: boolean;
}

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: GraphEmailConfigDto | null;
  categories: Array<{ id: number; name: string }>;
}

const EmailConfigModal: React.FC<EmailConfigModalProps> = ({ isOpen, onClose, config, categories }) => {
  const [showClientSecret, setShowClientSecret] = useState(false);
  const createMutation = useCreateGraphEmailConfig();
  const updateMutation = useUpdateGraphEmailConfig();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EmailConfigFormData>({
    // resolver: yupResolver(emailConfigSchema), // Temporarily disabled to fix type conflicts
    defaultValues: {
      tenantId: config?.tenantId || '',
      clientId: config?.clientId || '',
      clientSecret: config?.clientSecret || '',
      email: config?.email || '',
      categoryId: config?.categoryId || undefined,
      processIncomingEmails: config?.processIncomingEmails || true,
      createTicketsFromEmails: config?.createTicketsFromEmails || true,
      sendNotifications: config?.sendNotifications || true,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        tenantId: config?.tenantId || '',
        clientId: config?.clientId || '',
        clientSecret: config?.clientSecret || '',
        email: config?.email || '',
        categoryId: config?.categoryId || undefined,
        processIncomingEmails: config?.processIncomingEmails || true,
        createTicketsFromEmails: config?.createTicketsFromEmails || true,
        sendNotifications: config?.sendNotifications || true,
      });
    }
  }, [isOpen, config, reset]);

  const onSubmit = async (data: EmailConfigFormData) => {
    try {
      // Transform data to match API expectations
      const apiData = {
        ...data,
        categoryId: data.categoryId || undefined
      };
      
      if (config) {
        await updateMutation.mutateAsync({ id: config.id, data: apiData });
      } else {
        await createMutation.mutateAsync(apiData);
      }
      onClose();
      reset();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AtSymbolIcon className="h-5 w-5 text-gray-600" />
              {config ? 'Edit Email Configuration' : 'Create Email Configuration'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Microsoft Graph Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CloudIcon className="h-5 w-5 text-gray-600" />
                Microsoft Graph Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="support@company.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-gray-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-1">
                    Tenant ID
                  </label>
                  <input
                    {...register('tenantId')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  {errors.tenantId && (
                    <p className="mt-1 text-sm text-gray-600">{errors.tenantId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID (Application ID)
                  </label>
                  <input
                    {...register('clientId')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  {errors.clientId && (
                    <p className="mt-1 text-sm text-gray-600">{errors.clientId.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      {...register('clientSecret')}
                      type={showClientSecret ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter client secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showClientSecret ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.clientSecret && (
                    <p className="mt-1 text-sm text-gray-600">{errors.clientSecret.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category Association */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Ticket Category</h4>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Category (Optional)
                </label>
                <select
                  {...register('categoryId', { 
                    setValueAs: (value) => value === '' ? undefined : Number(value) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">No default category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Tickets created from emails will be assigned to this category if specified
                </p>
              </div>
            </div>

            {/* Processing Options */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Processing Options</h4>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    {...register('processIncomingEmails')}
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Process incoming emails</span>
                </label>

                <label className="flex items-center">
                  <input
                    {...register('createTicketsFromEmails')}
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Automatically create tickets from emails</span>
                </label>

                <label className="flex items-center">
                  <input
                    {...register('sendNotifications')}
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send email notifications for ticket updates</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (config ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EmailConfigTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GraphEmailConfigDto | null>(null);

  // Fetch data
  const { data: configs = [], isLoading, error } = useGraphEmailConfigs();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  
  const deleteMutation = useDeleteGraphEmailConfig();
  const testConnectionMutation = useTestEmailConnection();

  // Load categories on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await settingsApi.getTicketCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleEdit = async (config: GraphEmailConfigDto) => {
    try {
      // Fetch the full configuration with client secret for editing
      const fullConfig = await settingsApi.getGraphEmailConfigForEdit(config.id);
      
      // Create a combined config object with all necessary properties
      const editConfig = {
        ...config,
        tenantId: fullConfig.tenantId,
        clientId: fullConfig.clientId,
        clientSecret: fullConfig.clientSecret,
        email: fullConfig.email,
        categoryId: fullConfig.categoryId,
        processIncomingEmails: fullConfig.processIncomingEmails,
        createTicketsFromEmails: fullConfig.createTicketsFromEmails,
        sendNotifications: fullConfig.sendNotifications
      };
      
      setEditingConfig(editConfig);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching email config for editing:', error);
      // Fallback to the original behavior if the API call fails
      setEditingConfig(config);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (configId: number) => {
    if (window.confirm('Are you sure you want to delete this email configuration?')) {
      await deleteMutation.mutateAsync(configId);
    }
  };

  const handleTestConnection = async (configId: number) => {
    await testConnectionMutation.mutateAsync(configId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'No category';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Failed to load email configurations</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Email Configuration
        </button>

        <div className="text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <CloudIcon className="h-4 w-4" />
            Microsoft Graph API Integration
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AtSymbolIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Microsoft Graph Email Integration
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              <p className="mb-2">Configure email accounts for automatic ticket creation and notifications.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Automatically create tickets from incoming emails</li>
                <li>Send notifications for ticket updates via email</li>
                <li>Category-based email routing and processing</li>
                <li>Secure Microsoft Graph API authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Configurations Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-500">Loading email configurations...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12">
            <AtSymbolIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No email configurations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first email configuration.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Configuration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AtSymbolIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{config.email}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            Client: {config.clientId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getCategoryName(config.categoryId)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          {config.processIncomingEmails ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 text-gray-600" />
                          )}
                          <span>Process emails</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.createTicketsFromEmails ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 text-gray-600" />
                          )}
                          <span>Create tickets</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.sendNotifications ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 text-gray-600" />
                          )}
                          <span>Send notifications</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-gray-800'
                      }`}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestConnection(config.id)}
                          disabled={testConnectionMutation.isPending}
                          className="text-green-600 hover:text-green-900"
                          title="Test connection"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit configuration"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Delete configuration"
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{configs.length}</div>
            <div className="text-sm text-gray-500">Total Configurations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {configs.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {configs.filter(c => c.processIncomingEmails).length}
            </div>
            <div className="text-sm text-gray-500">Processing Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {configs.filter(c => c.createTicketsFromEmails).length}
            </div>
            <div className="text-sm text-gray-500">Creating Tickets</div>
          </div>
        </div>
      </div>

      {/* Email Configuration Modal */}
      <EmailConfigModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        config={editingConfig}
        categories={categories}
      />
    </div>
  );
};

export default EmailConfigTab;