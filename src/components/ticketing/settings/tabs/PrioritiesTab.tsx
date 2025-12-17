import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { settingsApi, PriorityLevel } from '@api/settingsApi';
import { toast } from 'react-hot-toast';

interface PriorityFormData {
  name: string;
  description: string;
  level: number;
  color: string;
  isActive: boolean;
}

interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  priority?: PriorityLevel | null;
  onSave: () => void;
}

const PriorityModal: React.FC<PriorityModalProps> = ({ isOpen, onClose, priority, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PriorityFormData>({
    defaultValues: {
      name: priority?.name || '',
      description: priority?.description || '',
      level: priority?.level || 1,
      color: priority?.color || '#3B82F6',
      isActive: priority?.isActive ?? true,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: priority?.name || '',
        description: priority?.description || '',
        level: priority?.level || 1,
        color: priority?.color || '#3B82F6',
        isActive: priority?.isActive ?? true,
      });
    }
  }, [isOpen, priority, reset]);

  const onSubmit = async (data: PriorityFormData) => {
    try {
      if (priority) {
        // Update existing priority
        await settingsApi.updatePriority(priority.id, {
          ...data,
          order: priority.order
        });
        toast.success('Priority updated successfully!');
      } else {
        // Create new priority
        await settingsApi.createPriority({
          ...data,
          order: 0 // Will be set by backend
        });
        toast.success('Priority created successfully!');
      }
      onSave(); // Refresh the list
      onClose();
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error saving priority. Please try again.';
      toast.error(errorMessage);
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
              {priority ? 'Edit Priority' : 'Create Priority'}
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
                Priority Name
              </label>
              <input
                {...register('name', { required: 'Priority name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., High, Medium, Low"
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Brief description of this priority level"
              />
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <input
                {...register('level', { 
                  required: 'Priority level is required',
                  min: { value: 1, message: 'Level must be at least 1' },
                  max: { value: 10, message: 'Level cannot exceed 10' }
                })}
                type="number"
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="1-10 (1 = highest priority)"
              />
              {errors.level && (
                <p className="mt-1 text-sm text-gray-600">{errors.level.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Lower numbers indicate higher priority (1 = highest)
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
                  className="h-10 w-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">
                  Choose a color to represent this priority level
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active priority</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Only active priorities are available for new tickets
              </p>
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
                {isSubmitting ? 'Saving...' : (priority ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PrioritiesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<PriorityLevel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Load priorities from API
  const loadPriorities = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getPriorityLevels(true);
      const sanitizedPriorities = data.filter((priority: PriorityLevel) => !priority.isDeleted);
      setPriorities(sanitizedPriorities);
    } catch (error) {
      toast.error('Error loading priorities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriorities();
  }, []);

  // Filter priorities by search term and active status
  const filteredPriorities = priorities.filter((priority: PriorityLevel) => {
    const matchesSearch = priority.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showInactive ? !priority.isActive : priority.isActive;
    return matchesSearch && matchesActiveFilter;
  });

  // Sort priorities by level (ascending - so highest priority first)
  const sortedPriorities = [...filteredPriorities].sort((a: PriorityLevel, b: PriorityLevel) => {
    const getSortValue = (priority: PriorityLevel) => priority.order ?? priority.displayOrder ?? priority.level;
    const sortComparison = getSortValue(a) - getSortValue(b);
    if (sortComparison !== 0) return sortComparison;
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });

  const handleEdit = (priority: PriorityLevel) => {
    setEditingPriority(priority);
    setIsModalOpen(true);
  };

  const handleDelete = async (priorityId: number) => {
    if (window.confirm('Are you sure you want to delete this priority? This action cannot be undone.')) {
      try {
        await settingsApi.deletePriority(priorityId);
        toast.success('Priority deleted successfully!');
        loadPriorities(); // Refresh the list
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error deleting priority. Please try again.';
        toast.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPriority(null);
  };

  const handleSave = () => {
    loadPriorities(); // Refresh the list after save
  };

  const getPriorityBadgeColor = (level: number) => {
    if (level === 1) return 'bg-red-100 text-gray-800';
    if (level === 2) return 'bg-orange-100 text-orange-800';
    if (level === 3) return 'bg-yellow-100 text-yellow-800';
    if (level === 4) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Priority
          </button>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span>Show inactive only</span>
          </label>
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
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
            placeholder="Search priorities..."
          />
        </div>
      </div>

      {/* Priorities List */}
      {loading ? (
        <div className="bg-white shadow rounded-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading priorities...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {sortedPriorities.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No priorities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No priorities match your search criteria.' 
                : 'Get started by creating your first priority level.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Priority
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedPriorities.map((priority) => (
              <li key={priority.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div 
                        className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: priority.color }}
                      >
                        {priority.level}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {priority.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(priority.level)}`}>
                          Level {priority.level}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priority.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-gray-800'
                        }`}>
                          {priority.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        {priority.description && (
                          <span className="text-sm text-gray-500">
                            {priority.description}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          <strong>Level:</strong> {priority.level}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: priority.color }}
                          ></div>
                          <span className="text-sm text-gray-500">{priority.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(priority)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit priority"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(priority.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Delete priority"
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

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{priorities.length}</div>
            <div className="text-sm text-gray-500">Total Priorities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {priorities.filter(p => p.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Priorities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {priorities.filter(p => p.level === 1).length}
            </div>
            <div className="text-sm text-gray-500">Critical Priorities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {priorities.length}
            </div>
            <div className="text-sm text-gray-500">Total Priorities</div>
          </div>
        </div>
      </div>

      {/* Priority Modal */}
      <PriorityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        priority={editingPriority}
        onSave={handleSave}
      />
    </div>
  );
};

export default PrioritiesTab;