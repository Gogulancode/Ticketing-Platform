import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { settingsApi } from '@api/settingsApi';

interface Department {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

interface DepartmentFormData {
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
}

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
  onSave: (data: DepartmentFormData, isEdit: boolean) => Promise<void>;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ isOpen, onClose, department, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DepartmentFormData>({
    defaultValues: {
      name: department?.name || '',
      description: department?.description || '',
      isActive: department?.isActive ?? true,
      displayOrder: department?.displayOrder || 1,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: department?.name || '',
        description: department?.description || '',
        isActive: department?.isActive ?? true,
        displayOrder: department?.displayOrder || 1,
      });
    }
  }, [isOpen, department, reset]);

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      await onSave(data, !!department);
      toast.success(department ? 'Department updated successfully!' : 'Department created successfully!');
      onClose();
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save department';
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
              <BuildingOfficeIcon className="h-5 w-5 text-secondary-600" />
              {department ? 'Edit Department' : 'Create Department'}
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
                Department Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                placeholder="e.g., IT Support"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                placeholder="Brief description of this department"
              />
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                {...register('displayOrder', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                placeholder="1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Lower numbers appear first in lists
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active department</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Only active departments are available for selection
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
                className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 border border-transparent rounded-md hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (department ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DepartmentsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getTicketDepartments(true);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: DepartmentFormData, isEdit: boolean) => {
    try {
      if (isEdit && editingDepartment) {
        await settingsApi.updateTicketDepartment(editingDepartment.id, {
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          displayOrder: data.displayOrder ?? editingDepartment.displayOrder,
        });
      } else {
        await settingsApi.createTicketDepartment({
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          displayOrder: data.displayOrder ?? departments.length + 1,
        });
      }
      await loadDepartments();
    } catch (error) {
      throw error;
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesActiveFilter = showInactive ? !dept.isActive : dept.isActive;
    return matchesSearch && matchesActiveFilter;
  });

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDelete = async (departmentId: number) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await settingsApi.deleteTicketDepartment(departmentId);
        toast.success('Department deleted successfully!');
        await loadDepartments();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
        toast.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">
          <BuildingOfficeIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Error Loading Departments</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDepartments}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Department
          </button>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show inactive</span>
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 text-sm"
            placeholder="Search departments..."
          />
        </div>
      </div>

      {/* Departments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No departments match your search criteria.' 
                : 'Get started by creating your first department.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Department
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredDepartments.map((department) => (
              <li key={department.id} className={`px-6 py-4 ${!department.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className={`h-8 w-8 ${department.isActive ? 'text-secondary-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-medium truncate ${department.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {department.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          department.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-gray-800'
                        }`}>
                          {department.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {department.description && (
                        <p className="text-sm text-gray-500 mt-1">{department.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Order:</strong> {department.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(department)}
                      className="text-secondary-600 hover:text-secondary-900"
                      title="Edit department"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Delete department"
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

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">{departments.length}</div>
            <div className="text-sm text-gray-500">Total Departments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {departments.filter(d => d.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Departments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {departments.filter(d => !d.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Inactive Departments</div>
          </div>
        </div>
      </div>

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        department={editingDepartment}
        onSave={handleSave}
      />
    </div>
  );
};

export default DepartmentsTab;
