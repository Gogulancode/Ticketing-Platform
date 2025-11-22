import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { settingsApi, SubCategory, TicketCategoryConfig } from '@api/settingsApi';

interface SubCategoryFormData {
  name: string;
  description?: string;
  categoryId: number;
  isActive: boolean;
  displayOrder?: number;
}

interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcategory?: SubCategory | null;
  onSave: (data: SubCategoryFormData, isEdit: boolean) => Promise<void>;
  categories: TicketCategoryConfig[];
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({ isOpen, onClose, subcategory, onSave, categories }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SubCategoryFormData>({
    defaultValues: {
      name: subcategory?.name || '',
      description: subcategory?.description || '',
      categoryId: subcategory?.categoryId || 0,
      isActive: subcategory?.isActive ?? true,
      displayOrder: subcategory?.displayOrder ?? subcategory?.order ?? 1,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: subcategory?.name || '',
        description: subcategory?.description || '',
        categoryId: subcategory?.categoryId || 0,
        isActive: subcategory?.isActive ?? true,
        displayOrder: subcategory?.displayOrder ?? subcategory?.order ?? 1,
      });
    }
  }, [isOpen, subcategory, reset]);

  const onSubmit = async (data: SubCategoryFormData) => {
    try {
      await onSave(data, !!subcategory);
      toast.success(subcategory ? 'Sub-category updated successfully!' : 'Sub-category created successfully!');
      onClose();
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save sub-category';
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
              <ListBulletIcon className="h-5 w-5 text-blue-600" />
              {subcategory ? 'Edit Sub-Category' : 'Create Sub-Category'}
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
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                {...register('categoryId', { 
                  required: 'Please select a category',
                  valueAsNumber: true 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select a category...</option>
                {categories.filter(cat => cat.isActive).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Category Name
              </label>
              <input
                {...register('name', { required: 'Sub-category name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Application Issues"
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
                placeholder="Brief description of this sub-category"
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
                <span className="ml-2 text-sm text-gray-700">Active sub-category</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Only active sub-categories are available for new tickets
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
                {isSubmitting ? 'Saving...' : (subcategory ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SubCategoriesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number>(0);
  const [showInactive, setShowInactive] = useState(false); // Default to active-only view
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<TicketCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subcategoriesData, categoriesData] = await Promise.all([
        settingsApi.getSubCategories(undefined, true), // includeInactive = true
        settingsApi.getTicketCategories(true) // includeInactive = true
      ]);
      setSubcategories(subcategoriesData);
      setCategories(categoriesData);
    } catch (error) {
      setError('Failed to load subcategories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: SubCategoryFormData, isEdit: boolean) => {
    try {
      if (isEdit && editingSubcategory) {
        // Update existing subcategory
        await settingsApi.updateSubCategory(editingSubcategory.id, {
          name: data.name,
          description: data.description || '',
          categoryId: data.categoryId,
          isActive: data.isActive,
          order: data.displayOrder ?? editingSubcategory.displayOrder ?? editingSubcategory.order,
          displayOrder: data.displayOrder ?? editingSubcategory.displayOrder ?? editingSubcategory.order,
        });
      } else {
        // Create new subcategory
        await settingsApi.createSubCategory({
          name: data.name,
          description: data.description || '',
          categoryId: data.categoryId,
          isActive: data.isActive,
          order: data.displayOrder ?? subcategories.length + 1,
          displayOrder: data.displayOrder ?? subcategories.length + 1,
        });
      }
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (subcategory: SubCategory) => {
    setEditingSubcategory(subcategory);
    setIsModalOpen(true);
  };

  const handleDelete = async (subcategoryId: number) => {
    if (window.confirm('Are you sure you want to delete this sub-category? This action cannot be undone.')) {
      try {
        await settingsApi.deleteSubCategory(subcategoryId);
        toast.success('Sub-category deleted successfully!');
        await loadData(); // Reload the list
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete sub-category';
        toast.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubcategory(null);
  };

  // Filter subcategories by search term, category, and active status
  const filteredSubcategories = subcategories.filter((subcategory: SubCategory) => {
    const matchesSearch = subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subcategory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = selectedCategoryFilter === 0 || subcategory.categoryId === selectedCategoryFilter;
    const matchesActiveFilter = showInactive ? !subcategory.isActive : subcategory.isActive;
    return matchesSearch && matchesCategory && matchesActiveFilter;
  });

  // Group by category for display
  const groupedSubcategories = filteredSubcategories.reduce((acc, subcategory) => {
    const category = categories.find(cat => cat.id === subcategory.categoryId);
    const categoryName = category?.name || 'Unknown Category';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(subcategory);
    return acc;
  }, {} as { [key: string]: SubCategory[] });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading sub-categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ListBulletIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-sm font-medium text-red-900 mb-2">Error Loading Sub-Categories</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={loadData}
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
            Add Sub-Category
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

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(Number(e.target.value))}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value={0}>All Categories</option>
              {categories.filter(cat => cat.isActive).map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search sub-categories..."
            />
          </div>
        </div>
      </div>

      {/* Sub-Categories List */}
      <div className="space-y-6">
        {Object.keys(groupedSubcategories).length === 0 ? (
          <div className="text-center py-12">
            <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sub-categories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategoryFilter 
                ? 'No sub-categories match your search criteria.' 
                : 'Get started by creating your first sub-category.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Sub-Category
            </button>
          </div>
        ) : (
          Object.entries(groupedSubcategories).map(([categoryName, categorySubcategories]) => {
            const subcategoryList = categorySubcategories as SubCategory[];
            return (
            <div key={categoryName} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{categoryName}</h3>
                <p className="text-sm text-gray-500">
                  {subcategoryList.length} sub-categories
                </p>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {subcategoryList
                  .sort((a, b) => (a.displayOrder ?? a.order) - (b.displayOrder ?? b.order))
                  .map((subcategory) => (
                    <li key={subcategory.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <ListBulletIcon className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {subcategory.name}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subcategory.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {subcategory.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {subcategory.description && (
                              <p className="text-sm text-gray-500 mt-1">{subcategory.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                <strong>Order:</strong> {subcategory.displayOrder ?? subcategory.order}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(subcategory)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit sub-category"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subcategory.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete sub-category"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          );
          })
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sub-Category Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{subcategories.length}</div>
            <div className="text-sm text-gray-500">Total Sub-Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {subcategories.filter(sc => sc.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Sub-Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {categories.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Parent Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {categories.length > 0 ? Math.round(subcategories.length / categories.length) : 0}
            </div>
            <div className="text-sm text-gray-500">Avg per Category</div>
          </div>
        </div>
      </div>

      {/* Sub-Category Modal */}
      <SubCategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        subcategory={editingSubcategory}
        onSave={handleSave}
        categories={categories}
      />
    </div>
  );
};

export default SubCategoriesTab;