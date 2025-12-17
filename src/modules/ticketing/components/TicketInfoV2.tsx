import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Tag, Users } from 'lucide-react';
import { ticketsV2Api, Category, SubCategory, Agent, TicketUpdateRequest } from '../services/ticketsV2Api';

interface TicketInfoV2Props {
  ticketId: string;
  currentCategoryId?: number;
  currentSubcategoryId?: number;
  currentAssignedToUserId?: string;
  onUpdate?: () => void;
}

const TicketInfoV2: React.FC<TicketInfoV2Props> = ({ 
  ticketId, 
  currentCategoryId, 
  currentSubcategoryId, 
  currentAssignedToUserId,
  onUpdate 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(currentCategoryId);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>(currentSubcategoryId);
  const [selectedAgentUserId, setSelectedAgentUserId] = useState<string | undefined>(currentAssignedToUserId);
  const [saving, setSaving] = useState(false);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, agentsData] = await Promise.all([
        ticketsV2Api.getCategories(),
        ticketsV2Api.getAgents(),
      ]);
      
      setCategories(categoriesData);
      setAgents(agentsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load subcategories when category changes
  const loadSubcategories = async (categoryId: number) => {
    try {
      const subcategoriesData = await ticketsV2Api.getSubCategories(categoryId);
      setSubcategories(subcategoriesData);
    } catch (err) {
      console.error('Failed to load subcategories:', err);
      setSubcategories([]);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(undefined); // Reset subcategory
    loadSubcategories(categoryId);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData: TicketUpdateRequest = {
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId,
        assignedToUserId: selectedAgentUserId,
      };
      
      await ticketsV2Api.updateTicket(ticketId, updateData);
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setSelectedCategoryId(currentCategoryId);
    setSelectedSubcategoryId(currentSubcategoryId);
    setSelectedAgentUserId(currentAssignedToUserId);
    setIsEditing(false);
    if (currentCategoryId) {
      loadSubcategories(currentCategoryId);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentCategoryId && categories.length > 0) {
      loadSubcategories(currentCategoryId);
    }
  }, [currentCategoryId, categories]);

  const getCurrentCategoryName = () => {
    const category = categories.find(c => c.id === currentCategoryId);
    return category?.name || 'Not assigned';
  };

  const getCurrentSubcategoryName = () => {
    const subcategory = subcategories.find(s => s.id === currentSubcategoryId);
    return subcategory?.name || 'Not assigned';
  };

  const getCurrentAgentName = () => {
    const agent = agents.find(a => a.userId === currentAssignedToUserId);
    return agent?.name || 'Not assigned';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ticket Information</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-gray-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="h-4 w-4" />
            Category
          </label>
          {isEditing ? (
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => handleCategoryChange(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900">{getCurrentCategoryName()}</p>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="h-4 w-4" />
            Subcategory
          </label>
          {isEditing ? (
            <select
              value={selectedSubcategoryId || ''}
              onChange={(e) => setSelectedSubcategoryId(Number(e.target.value))}
              disabled={!selectedCategoryId}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900">{getCurrentSubcategoryName()}</p>
          )}
        </div>

        {/* Assigned Agent */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4" />
            Assigned Agent
          </label>
          {isEditing ? (
            <select
              value={selectedAgentUserId || ''}
              onChange={(e) => setSelectedAgentUserId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent.userId} value={agent.userId}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900">{getCurrentAgentName()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketInfoV2;