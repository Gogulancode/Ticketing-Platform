import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { settingsApi } from "@api/settingsApi";
import TagModal from "./TagModal";

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

const TagsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TicketTag | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<TicketTag[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const subs = await settingsApi.getSubCategories();
      setSubcategories(subs);

      const tagsData = await settingsApi.getTicketTags();
      setTags(tagsData || []);
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tag: TicketTag) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleDelete = async (tagId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this tag? This will affect email auto-assignment rules."
      )
    ) {
      try {
        await settingsApi.deleteTicketTag(tagId);
        console.log("✅ Tag deleted:", tagId);
        loadData();
      } catch (error) {
        console.error("❌ Error deleting tag:", error);
        alert("Error deleting tag. Please try again.");
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTags.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTags.length} selected tags?`
      )
    ) {
      try {
        await Promise.all(selectedTags.map((id) => settingsApi.deleteTicketTag(id)));
        console.log("✅ Tags deleted:", selectedTags);
        setSelectedTags([]);
        loadData();
      } catch (error) {
        console.error("❌ Error deleting tags:", error);
        alert("Error deleting tags. Please try again.");
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTags.length === filteredTags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(filteredTags.map((tag) => tag.id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleSave = () => {
    loadData();
  };

  const getSubcategoryName = (subCategoryId: number) => {
    const subcategory = subcategories.find((sub) => sub.id === subCategoryId);
    return subcategory?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TagIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Email Auto-Assignment Tags
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Create keyword tags that automatically assign incoming emails to
              specific subcategories.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Tag
          </button>

          {selectedTags.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
              Delete Selected ({selectedTags.length})
            </button>
          )}
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Search tags..."
          />
        </div>
      </div>

      {/* Tags Table */}
      {loading ? (
        <div className="bg-white shadow rounded-md p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tags...</p>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-md overflow-hidden">
          {filteredTags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tags found
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedTags.length === filteredTags.length &&
                          filteredTags.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subcategory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTags.map((tag) => (
                    <tr key={tag.id}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={(e) =>
                            setSelectedTags(
                              e.target.checked
                                ? [...selectedTags, tag.id]
                                : selectedTags.filter((id) => id !== tag.id)
                            )
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">{tag.name}</td>
                      <td className="px-6 py-4">{getSubcategoryName(tag.subCategoryId)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tag.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tag.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(tag.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <TagModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tag={editingTag}
        subcategories={subcategories}
        onSave={handleSave}
      />
    </div>
  );
};

export default TagsTab;
