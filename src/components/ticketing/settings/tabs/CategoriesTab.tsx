import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { settingsApi } from '@api/settingsApi';

interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  color?: string;
  iconName?: string;
  ticketCount?: number; // Optional for displaying ticket counts
}

interface CategoryFormData {
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSave: (data: CategoryFormData, isEdit: boolean) => Promise<void>;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      isActive: category?.isActive ?? true,
      displayOrder: category?.displayOrder || 1,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: category?.name || '',
        description: category?.description || '',
        isActive: category?.isActive ?? true,
        displayOrder: category?.displayOrder || 1,
      });
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await onSave(data, !!category);
      toast.success(category ? 'Category updated successfully!' : 'Category created successfully!');
      onClose();
      reset();
    } catch (error) {
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save category';
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
              <Squares2X2Icon className="h-5 w-5 text-blue-600" />
              {category ? 'Edit Category' : 'Create Category'}
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
                Category Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Technical Issues"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this category"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                {...register('displayOrder', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active category</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Only active categories are available for new tickets
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (category ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CategoriesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false); // Default to active-only view
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories from API
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      // Always fetch all categories including inactive ones
      const data = await settingsApi.getTicketCategories(true); // includeInactive = true
      // Transform the API response to match our Category interface
      const transformedCategories: Category[] = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        isActive: cat.isActive,
        displayOrder: cat.order ?? cat.displayOrder ?? 0,
        color: undefined, // API doesn't provide these yet
        iconName: undefined,
        ticketCount: 0 // We'll need another API call for this
      }));
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: CategoryFormData, isEdit: boolean) => {
    try {
      if (isEdit && editingCategory) {
        // Update existing category
        await settingsApi.updateTicketCategory(editingCategory.id, {
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          order: data.displayOrder ?? editingCategory.displayOrder,
        });
      } else {
        // Create new category
        await settingsApi.createTicketCategory({
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          order: data.displayOrder ?? categories.length + 1,
          displayOrder: data.displayOrder ?? categories.length + 1,
        });
      }
      
      // Reload categories to reflect changes
      await loadCategories();
    } catch (error) {
      throw error;
    }
  };

  // Filter categories by search term and active status
  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesActiveFilter = showInactive ? !category.isActive : category.isActive;
    return matchesSearch && matchesActiveFilter;
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await settingsApi.deleteCategory(categoryId);
        toast.success('Category deleted successfully!');
        await loadCategories(); // Reload the list
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
        toast.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Squares2X2Icon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-sm font-medium text-red-900 mb-2">Error Loading Categories</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCategories}
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Category
          </button>
          
          {/* Show/Hide Inactive Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show inactive</span>
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
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search categories..."
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No categories match your search criteria.' 
                : 'Get started by creating your first category.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Category
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <li key={category.id} className={`px-6 py-4 ${!category.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Squares2X2Icon className={`h-8 w-8 ${category.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-medium truncate ${category.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {category.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Order:</strong> {category.displayOrder}
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Tickets:</strong> {category.ticketCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit category"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete category"
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div className="text-sm text-gray-500">Total Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {categories.reduce((total, cat) => total + (cat.ticketCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {categories.length > 0 ? Math.round(categories.reduce((total, cat) => total + (cat.ticketCount || 0), 0) / categories.length) : 0}
            </div>
            <div className="text-sm text-gray-500">Avg per Category</div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
        onSave={handleSave}
      />
    </div>
  );
};

export default CategoriesTab;