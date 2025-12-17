import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { settingsApi, IssueType } from '@api/settingsApi';

interface IssueTypeFormData {
  name: string;
  description?: string;
  isActive: boolean;
  order?: number;
  color?: string;
}

interface IssueTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueType?: IssueType | null;
  onSave: (data: IssueTypeFormData, isEdit: boolean) => Promise<void>;
}

const IssueTypeModal: React.FC<IssueTypeModalProps> = ({ isOpen, onClose, issueType, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<IssueTypeFormData>({
    defaultValues: {
      name: issueType?.name || '',
      description: issueType?.description || '',
      isActive: issueType?.isActive ?? true,
      order: issueType?.order || 1,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: issueType?.name || '',
        description: issueType?.description || '',
        isActive: issueType?.isActive ?? true,
        order: issueType?.order || 1,
      });
    }
  }, [isOpen, issueType, reset]);

  const onSubmit = async (data: IssueTypeFormData) => {
    try {
      await onSave(data, !!issueType);
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving issue type:', error);
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
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
              {issueType ? 'Edit Issue Type' : 'Create Issue Type'}
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
                Issue Type Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Bug, Feature Request, User Issue"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-gray-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color (Optional)
              </label>
              <input
                {...register('color')}
                type="color"
                className="w-full h-10 px-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                {...register('order', { 
                  valueAsNumber: true,
                  min: { value: 1, message: 'Display order must be at least 1' }
                })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="1"
              />
              {errors.order && (
                <p className="mt-1 text-sm text-gray-600">{errors.order.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (issueType ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const IssueTypesTab: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadIssueTypes();
  }, []);

  const loadIssueTypes = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getIssueTypes();
      setIssueTypes(data);
    } catch (error) {
      console.error('Error loading issue types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedIssueType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (issueType: IssueType) => {
    setSelectedIssueType(issueType);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: IssueTypeFormData, isEdit: boolean) => {
    try {
      if (isEdit && selectedIssueType) {
        console.log('Updating issue type:', selectedIssueType.id, formData);
        // TODO: Implement update API call when backend is ready
        // await settingsApi.updateIssueType(selectedIssueType.id, formData);
      } else {
        console.log('Creating issue type:', formData);
        // TODO: Implement create API call when backend is ready
        // await settingsApi.createIssueType(formData);
      }
      await loadIssueTypes();
    } catch (error) {
      console.error('Error saving issue type:', error);
      throw error;
    }
  };

  const handleDelete = async (issueType: IssueType) => {
    if (!window.confirm(`Are you sure you want to delete "${issueType.name}"?`)) {
      return;
    }

    try {
      console.log('Deleting issue type:', issueType.id);
      // TODO: Implement delete API call when backend is ready
      // await settingsApi.deleteIssueType(issueType.id);
      await loadIssueTypes();
    } catch (error) {
      console.error('Error deleting issue type:', error);
    }
  };

  const filteredIssueTypes = issueTypes.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (it.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesActive = showInactive || it.isActive;
    return matchesSearch && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Issue Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage different types of issues that can be reported
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Issue Type
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search issue types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="showInactive" className="ml-2 text-sm text-gray-700">
            Show inactive
          </label>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredIssueTypes.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              {searchTerm ? 'No issue types match your search' : 'No issue types found'}
            </li>
          ) : (
            filteredIssueTypes.map((issueType) => (
              <li key={issueType.id} className={`${!issueType.isActive ? 'opacity-60' : ''}`}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {issueType.name}
                        {!issueType.isActive && (
                          <span className="ml-2 text-xs text-gray-500">(Inactive)</span>
                        )}
                      </h3>
                      {issueType.description && (
                        <p className="text-sm text-gray-500">{issueType.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Order: {issueType.order}</span>
                    <button
                      onClick={() => handleEdit(issueType)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(issueType)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <IssueTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issueType={selectedIssueType}
        onSave={handleSave}
      />
    </div>
  );
};

export default IssueTypesTab;