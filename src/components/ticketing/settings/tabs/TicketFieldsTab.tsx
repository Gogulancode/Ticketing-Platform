import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  Bars3Icon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import {
  useTicketFieldSettings,
  useFieldSettingsByCategory,
  useCreateTicketFieldSetting,
  useUpdateTicketFieldSetting,
  useDeleteTicketFieldSetting,
  useReorderTicketFields
} from '@hooks/useAdvancedSettings';
import { 
  TicketFieldSettingDto, 
  CreateTicketFieldSettingDto, 
  UpdateTicketFieldSettingDto 
} from '@api/settingsApi';
import { settingsApi } from '@api/settingsApi';

// Field type options
const FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Textarea', description: 'Multi-line text input' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'email', label: 'Email', description: 'Email address input' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'url', label: 'URL', description: 'Website URL input' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'select', label: 'Dropdown', description: 'Select from options' },
  { value: 'radio', label: 'Radio Buttons', description: 'Choose one option' },
  { value: 'checkbox', label: 'Checkboxes', description: 'Multiple selections' },
  { value: 'file', label: 'File Upload', description: 'File attachment' },
];

// Form validation schema
const fieldSettingSchema = yup.object({
  categoryId: yup
    .number()
    .positive('Please select a category')
    .required('Category is required'),
  fieldName: yup
    .string()
    .required('Field name is required')
    .min(2, 'Field name must be at least 2 characters')
    .max(100, 'Field name cannot exceed 100 characters'),
  fieldType: yup
    .string()
    .required('Field type is required'),
  isMandatory: yup.boolean(),
  options: yup
    .string()
    .when('fieldType', {
      is: (fieldType: string) => ['select', 'radio', 'checkbox'].includes(fieldType),
      then: schema => schema.required('Options are required for this field type'),
      otherwise: schema => schema.nullable(),
    }),
  placeholderText: yup
    .string()
    .max(200, 'Placeholder text cannot exceed 200 characters'),
  displayOrder: yup
    .number()
    .min(1, 'Display order must be at least 1')
    .required('Display order is required'),
});

interface FieldSettingFormData {
  categoryId: number;
  fieldName: string;
  fieldType: string;
  isMandatory: boolean;
  options?: string;
  placeholderText?: string;
  displayOrder: number;
}

interface FieldSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldSetting?: TicketFieldSettingDto | null;
  categories: Array<{ id: number; name: string }>;
  maxOrder: number;
}

const FieldSettingModal: React.FC<FieldSettingModalProps> = ({ 
  isOpen, 
  onClose, 
  fieldSetting, 
  categories,
  maxOrder 
}) => {
  const createMutation = useCreateTicketFieldSetting();
  const updateMutation = useUpdateTicketFieldSetting();
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FieldSettingFormData>({
    resolver: yupResolver(fieldSettingSchema),
    defaultValues: {
      categoryId: fieldSetting?.categoryId || 0,
      fieldName: fieldSetting?.fieldName || '',
      fieldType: fieldSetting?.fieldType || 'text',
      isMandatory: fieldSetting?.isMandatory || false,
      options: fieldSetting?.options || '',
      placeholderText: fieldSetting?.placeholderText || '',
      displayOrder: fieldSetting?.displayOrder || maxOrder + 1,
    }
  });

  const watchFieldType = watch('fieldType');
  const needsOptions = ['select', 'radio', 'checkbox'].includes(watchFieldType);

  React.useEffect(() => {
    if (isOpen) {
      reset({
        categoryId: fieldSetting?.categoryId || 0,
        fieldName: fieldSetting?.fieldName || '',
        fieldType: fieldSetting?.fieldType || 'text',
        isMandatory: fieldSetting?.isMandatory || false,
        options: fieldSetting?.options || '',
        placeholderText: fieldSetting?.placeholderText || '',
        displayOrder: fieldSetting?.displayOrder || maxOrder + 1,
      });
    }
  }, [isOpen, fieldSetting, maxOrder, reset]);

  const onSubmit = async (data: FieldSettingFormData) => {
    try {
      if (fieldSetting) {
        await updateMutation.mutateAsync({ id: fieldSetting.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
      reset();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const selectedFieldType = FIELD_TYPES.find(type => type.value === watchFieldType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DocumentIcon className="h-5 w-5 text-blue-600" />
              {fieldSetting ? 'Edit Field Setting' : 'Create Field Setting'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    {...register('categoryId', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Select category</option>
                    {categories.map((category) => (
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
                  <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    {...register('fieldName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Issue Priority, Affected System"
                  />
                  {errors.fieldName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fieldName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type
                  </label>
                  <select
                    {...register('fieldType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {selectedFieldType && (
                    <p className="mt-1 text-sm text-gray-500">{selectedFieldType.description}</p>
                  )}
                  {errors.fieldType && (
                    <p className="mt-1 text-sm text-red-600">{errors.fieldType.message}</p>
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
                  />
                  {errors.displayOrder && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Field Configuration */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Field Configuration</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="placeholderText" className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder Text
                  </label>
                  <input
                    {...register('placeholderText')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter placeholder text for the field"
                  />
                  {errors.placeholderText && (
                    <p className="mt-1 text-sm text-red-600">{errors.placeholderText.message}</p>
                  )}
                </div>

                {needsOptions && (
                  <div>
                    <label htmlFor="options" className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated)
                    </label>
                    <textarea
                      {...register('options')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Low,Medium,High,Critical"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter options separated by commas. These will appear as selectable choices.
                    </p>
                    {errors.options && (
                      <p className="mt-1 text-sm text-red-600">{errors.options.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      {...register('isMandatory')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required field</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Users must provide a value for this field when creating tickets
                  </p>
                </div>
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
                {isSubmitting ? 'Saving...' : (fieldSetting ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const TicketFieldsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFieldSetting, setEditingFieldSetting] = useState<TicketFieldSettingDto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  // Fetch data
  const { data: allFieldSettings = [], isLoading, error } = useTicketFieldSettings();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  
  const deleteMutation = useDeleteTicketFieldSetting();
  const reorderMutation = useReorderTicketFields();

  // Filter fields by selected category
  const filteredFieldSettings = selectedCategory 
    ? allFieldSettings.filter(field => field.categoryId === selectedCategory)
    : allFieldSettings;

  // Sort by display order
  const sortedFieldSettings = [...filteredFieldSettings].sort((a, b) => a.displayOrder - b.displayOrder);

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

  const handleEdit = (fieldSetting: TicketFieldSettingDto) => {
    setEditingFieldSetting(fieldSetting);
    setIsModalOpen(true);
  };

  const handleDelete = async (fieldId: number) => {
    if (window.confirm('Are you sure you want to delete this field setting?')) {
      await deleteMutation.mutateAsync(fieldId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFieldSetting(null);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getFieldTypeLabel = (fieldType: string) => {
    const type = FIELD_TYPES.find(t => t.value === fieldType);
    return type?.label || fieldType;
  };

  const getMaxOrder = () => {
    if (filteredFieldSettings.length === 0) return 0;
    return Math.max(...filteredFieldSettings.map(field => field.displayOrder));
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder the items
    const reorderedFields = Array.from(sortedFieldSettings);
    const [removed] = reorderedFields.splice(sourceIndex, 1);
    reorderedFields.splice(destinationIndex, 0, removed);

    // Create new order mapping
    const fieldIds = reorderedFields.map(field => field.id);
    
    if (selectedCategory) {
      await reorderMutation.mutateAsync({
        categoryId: selectedCategory,
        fieldIds
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load field settings</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Field Setting
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700">
            Filter by Category:
          </label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value={0}>All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <DocumentIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dynamic Ticket Fields
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">Create custom form fields that will appear when creating tickets in specific categories.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag and drop to reorder fields within a category</li>
                <li>Support for various input types: text, dropdowns, dates, file uploads, etc.</li>
                <li>Configure required fields and validation rules</li>
                <li>Category-specific field configurations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Field Settings Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading field settings...</p>
          </div>
        ) : sortedFieldSettings.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No field settings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory 
                ? `No fields configured for the selected category.` 
                : 'Get started by creating your first field setting.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Field Setting
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="field-settings">
                {(provided) => (
                  <table className="min-w-full divide-y divide-gray-200" {...provided.droppableProps} ref={provided.innerRef}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Field Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Required
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
                      {sortedFieldSettings.map((fieldSetting, index) => (
                        <Draggable key={fieldSetting.id} draggableId={fieldSetting.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${snapshot.isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'} ${selectedCategory ? 'cursor-move' : ''}`}
                            >
                              <td className="px-2 py-4 whitespace-nowrap">
                                {selectedCategory && (
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <Bars3Icon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <span className="text-sm text-gray-500 ml-1">{fieldSetting.displayOrder}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{fieldSetting.fieldName}</div>
                                    {fieldSetting.placeholderText && (
                                      <div className="text-xs text-gray-500">{fieldSetting.placeholderText}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getFieldTypeLabel(fieldSetting.fieldType)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{getCategoryName(fieldSetting.categoryId)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {fieldSetting.isMandatory ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  fieldSetting.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {fieldSetting.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(fieldSetting)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit field setting"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(fieldSetting.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete field setting"
                                    disabled={deleteMutation.isPending}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{allFieldSettings.length}</div>
            <div className="text-sm text-gray-500">Total Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {allFieldSettings.filter(f => f.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {allFieldSettings.filter(f => f.isMandatory).length}
            </div>
            <div className="text-sm text-gray-500">Required Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{categories.length}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
        </div>
      </div>

      {/* Field Setting Modal */}
      <FieldSettingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fieldSetting={editingFieldSetting}
        categories={categories}
        maxOrder={getMaxOrder()}
      />
    </div>
  );
};

export default TicketFieldsTab;