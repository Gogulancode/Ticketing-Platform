import React from "react";
import { TagIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { settingsApi } from "@api/settingsApi";
import { toast } from 'react-hot-toast';

interface TicketTag {
  id: number;
  name: string;
  subCategoryId: number;
  subCategoryName?: string;
  categoryName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

interface TagFormData {
  name: string;
  subCategoryId: number;
  isActive: boolean;
}

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: TicketTag | null;
  subcategories: SubCategory[];
  onSave: () => void;
}

const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, tag, subcategories, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TagFormData>({
    defaultValues: {
      name: tag?.name || "",
      subCategoryId: tag?.subCategoryId || 0,
      isActive: tag?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: tag?.name || "",
        subCategoryId: tag?.subCategoryId || 0,
        isActive: tag?.isActive ?? true,
      });
    }
  }, [isOpen, tag, reset]);

  const onSubmit = async (data: TagFormData) => {
    try {
      if (tag) {
        // Update existing tag
        await settingsApi.updateTicketTag(tag.id, data);
        toast.success('Tag updated successfully!');
      } else {
        // Create new tag
        await settingsApi.createTicketTag(data);
        toast.success('Tag created successfully!');
      }

      onSave(); 
      onClose();
      reset();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error saving tag";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-blue-600" />
              {tag ? "Edit Tag" : "Create New Tag"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name / Keyword
              </label>
              <input
                {...register("name", {
                  required: "Tag name is required",
                  minLength: { value: 2, message: "Tag name must be at least 2 characters" },
                  maxLength: { value: 100, message: "Tag name cannot exceed 100 characters" },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., password, login, reset, hardware"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Assign to Subcategory
              </label>
              <select
                {...register("subCategoryId", {
                  valueAsNumber: true,
                  validate: (value) => value > 0 || "Please select a subcategory",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {errors.subCategoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.subCategoryId.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  {...register("isActive")}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active tag</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : tag ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TagModal;
