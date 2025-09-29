import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { settingsApi, TicketStatusConfig } from '@api/settingsApi';

interface StatusFormData {
  name: string;
  color: string;
  workflowOrder: number;
  isDefault?: boolean;
  isClosedStatus?: boolean;
  isActive: boolean;
  allowedTransitions?: number[];
}

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: TicketStatusConfig | null;
  onSave: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, status, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StatusFormData>({
    defaultValues: {
      name: status?.name || '',
      color: status?.color || '#3B82F6',
      workflowOrder: status?.workflowOrder || 1,
      isDefault: status?.isDefault || false,
      isClosedStatus: status?.isClosedStatus || false,
      isActive: status?.isActive ?? true,
      allowedTransitions: status?.allowedTransitions || [],
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: status?.name || '',
        color: status?.color || '#3B82F6',
        workflowOrder: status?.workflowOrder || 1,
        isDefault: status?.isDefault || false,
        isClosedStatus: status?.isClosedStatus || false,
        isActive: status?.isActive ?? true,
        allowedTransitions: status?.allowedTransitions || [],
      });
    }
  }, [isOpen, status, reset]);

  const onSubmit = async (data: StatusFormData) => {
    try {
      const statusData = {
        ...data,
        allowedTransitions: data.allowedTransitions || []
      };
      
      if (status) {
        // Update existing status
        await settingsApi.updateStatus(status.id, statusData);
        console.log('✅ Status updated successfully');
      } else {
        // Create new status
        await settingsApi.createStatus(statusData);
        console.log('✅ Status created successfully');
      }
      onSave(); // Refresh the list
      onClose();
      reset();
    } catch (error) {
      console.error('❌ Error saving status:', error);
      alert('Error saving status. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              {status ? 'Edit Status' : 'Create Status'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Status Name
              </label>
              <input
                {...register('name', { required: 'Status name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Open, In Progress, Closed"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="workflowOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Order
              </label>
              <input
                {...register('workflowOrder', { 
                  required: 'Workflow order is required',
                  min: { value: 1, message: 'Order must be at least 1' }
                })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1, 2, 3..."
              />
              {errors.workflowOrder && (
                <p className="mt-1 text-sm text-red-600">{errors.workflowOrder.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Order in which statuses appear in workflow (1 = first)
              </p>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  {...register('color')}
                  type="color"
                  className="h-10 w-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">
                  Choose a color to represent this status
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input
                    {...register('isClosedStatus')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Closed status</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Closed statuses indicate the ticket is completed and cannot be modified
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    {...register('isDefault')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Default status</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Default status for new tickets
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active status</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Only active statuses are available for tickets
                </p>
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (status ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StatusesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TicketStatusConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statuses, setStatuses] = useState<TicketStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Load statuses from API
  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getTicketStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Error loading statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  // Filter statuses by search term
  const filteredStatuses = statuses.filter((status: TicketStatusConfig) =>
    status.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort statuses by workflow order
  const sortedStatuses = filteredStatuses.sort((a: TicketStatusConfig, b: TicketStatusConfig) => a.workflowOrder - b.workflowOrder);

  const handleEdit = (status: TicketStatusConfig) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleDelete = async (statusId: number) => {
    if (window.confirm('Are you sure you want to delete this status? This action cannot be undone.')) {
      try {
        await settingsApi.deleteStatus(statusId);
        console.log('✅ Status deleted successfully');
        loadStatuses(); // Refresh the list
      } catch (error) {
        console.error('❌ Error deleting status:', error);
        alert('Error deleting status. Please try again.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStatus(null);
  };

  const handleSave = () => {
    loadStatuses(); // Refresh the list after save
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Status
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search statuses..."
          />
        </div>
      </div>

      {/* Statuses List */}
      {loading ? (
        <div className="bg-white shadow rounded-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading statuses...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {sortedStatuses.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No statuses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No statuses match your search criteria.' 
                : 'Get started by creating your first status.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Status
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedStatuses.map((status) => (
              <li key={status.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div 
                        className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: status.color }}
                      >
                        {status.workflowOrder}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {status.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Order {status.workflowOrder}
                        </span>
                        {(status as any).isClosedStatus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Closed
                          </span>
                        )}
                        {status.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Default
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Workflow Order:</strong> {status.workflowOrder}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <span className="text-sm text-gray-500">{status.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(status)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit status"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(status.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete status"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {/* Status Workflow Visualization */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Visualization</h3>
        <div className="flex flex-wrap items-center gap-2">
          {sortedStatuses.map((status, index) => (
            <div key={status.id} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div 
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: status.color }}
                >
                  {status.name}
                </div>
              </div>
              {index < sortedStatuses.length - 1 && (
                <div className="mx-2 text-gray-400">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statuses.length}</div>
            <div className="text-sm text-gray-500">Total Statuses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {statuses.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Statuses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statuses.filter(s => s.isDefault).length}
            </div>
            <div className="text-sm text-gray-500">Default Statuses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {statuses.length}
            </div>
            <div className="text-sm text-gray-500">Total Statuses</div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        status={editingStatus}
        onSave={handleSave}
      />
    </div>
  );
};

export default StatusesTab;