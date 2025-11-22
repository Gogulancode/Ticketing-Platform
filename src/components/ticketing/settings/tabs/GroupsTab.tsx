import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  UsersIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {
  useAdvancedTicketGroups,
  useGroupsByCategory,
  useCreateAdvancedTicketGroup,
  useUpdateAdvancedTicketGroup,
  useDeleteAdvancedTicketGroup
} from '@hooks/useAdvancedSettings';
import { 
  AdvancedTicketGroupDto, 
  CreateAdvancedTicketGroupDto, 
  UpdateAdvancedTicketGroupDto 
} from '@api/settingsApi';
import { settingsApi } from '@api/settingsApi';

// Form validation schema
const groupSchema = yup.object({
  groupName: yup
    .string()
    .required('Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  categoryId: yup
    .number()
    .positive('Please select a category')
    .required('Category is required'),
  subcategoryId: yup
    .number()
    .nullable(),
  assignedAgentIds: yup
    .array()
    .of(yup.number())
    .min(1, 'At least one agent must be assigned')
    .required('Assigned agents are required'),
  maxTicketsPerAgent: yup
    .number()
    .min(1, 'Maximum tickets per agent must be at least 1')
    .max(100, 'Maximum tickets per agent cannot exceed 100')
    .required('Maximum tickets per agent is required'),
  autoAssignmentEnabled: yup.boolean(),
  isActive: yup.boolean(),
});

interface GroupFormData {
  groupName: string;
  description?: string;
  categoryId: number;
  subcategoryId?: number;
  assignedAgentIds: number[];
  maxTicketsPerAgent: number;
  autoAssignmentEnabled: boolean;
  isActive: boolean;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: AdvancedTicketGroupDto | null;
  categories: Array<{ id: number; name: string }>;
  subcategories: Array<{ id: number; name: string; categoryId: number }>;
  agents: Array<{ id: number; name: string; email: string; department?: string }>;
}

const GroupModal: React.FC<GroupModalProps> = ({ 
  isOpen, 
  onClose, 
  group, 
  categories,
  subcategories,
  agents 
}) => {
  const createMutation = useCreateAdvancedTicketGroup();
  const updateMutation = useUpdateAdvancedTicketGroup();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<GroupFormData>({
    resolver: yupResolver(groupSchema),
    defaultValues: {
      groupName: group?.name || '',
      description: group?.description || '',
      categoryId: group?.categoryId || 0,
      subcategoryId: group?.subcategoryId || undefined,
      assignedAgentIds: group?.assignedAgentIds || [],
      maxTicketsPerAgent: group?.maxTicketsPerAgent || 10,
      autoAssignmentEnabled: group?.autoAssignmentEnabled || false,
      isActive: group?.isActive ?? true,
    }
  });

  const [selectedAgents, setSelectedAgents] = useState<Set<number>>(
    new Set(group?.assignedAgentIds || [])
  );
  const [agentSearch, setAgentSearch] = useState('');

  const watchCategoryId = watch('categoryId');

  // Filter subcategories by selected category
  const filteredSubcategories = subcategories.filter(
    sub => sub.categoryId === watchCategoryId
  );

  // Filter agents by search
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    agent.email.toLowerCase().includes(agentSearch.toLowerCase()) ||
    (agent.department && agent.department.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  React.useEffect(() => {
    if (isOpen) {
      const agentIds = group?.assignedAgentIds || [];
      setSelectedAgents(new Set(agentIds));
      reset({
        groupName: group?.name || '',
        description: group?.description || '',
        categoryId: group?.categoryId || 0,
        subcategoryId: group?.subcategoryId || undefined,
        assignedAgentIds: agentIds,
        maxTicketsPerAgent: group?.maxTicketsPerAgent || 10,
        autoAssignmentEnabled: group?.autoAssignmentEnabled || false,
        isActive: group?.isActive ?? true,
      });
    }
  }, [isOpen, group, reset]);

  const handleAgentToggle = (agentId: number) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
    setValue('assignedAgentIds', Array.from(newSelected));
  };

  const onSubmit = async (data: GroupFormData) => {
    try {
      const formData = {
        name: data.groupName, // Transform groupName to name for API
        description: data.description,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        maxTicketsPerAgent: data.maxTicketsPerAgent,
        autoAssignmentEnabled: data.autoAssignmentEnabled,
        isActive: data.isActive,
        assignedAgentIds: Array.from(selectedAgents),
      };

      if (group) {
        await updateMutation.mutateAsync({ id: group.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
      reset();
      setSelectedAgents(new Set());
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getSubcategoryName = (subcategoryId: number) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name || 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
              {group ? 'Edit Agent Group' : 'Create Agent Group'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    {...register('groupName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Technical Support Team, Billing Specialists"
                  />
                  {errors.groupName && (
                    <p className="mt-1 text-sm text-red-600">{errors.groupName.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the group's responsibilities and scope"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

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
                  <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory (Optional)
                  </label>
                  <select
                    {...register('subcategoryId', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!watchCategoryId || filteredSubcategories.length === 0}
                  >
                    <option value={0}>No specific subcategory</option>
                    {filteredSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {errors.subcategoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.subcategoryId.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Configuration */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Assignment Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxTicketsPerAgent" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tickets per Agent
                  </label>
                  <input
                    {...register('maxTicketsPerAgent', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.maxTicketsPerAgent && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxTicketsPerAgent.message}</p>
                  )}
                </div>

                <div className="flex items-center space-y-2">
                  <div>
                    <label className="flex items-center">
                      <input
                        {...register('autoAssignmentEnabled')}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Auto-Assignment</span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Automatically assign new tickets to agents in this group
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        {...register('isActive')}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Group</span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Only active groups receive new ticket assignments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Assignment */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Assign Agents ({selectedAgents.size} selected)
              </h4>
              
              {/* Agent Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search agents by name, email, or department..."
                />
              </div>

              {/* Agent List */}
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredAgents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No agents found matching your search
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredAgents.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAgents.has(agent.id)}
                          onChange={() => handleAgentToggle(agent.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                              <div className="text-sm text-gray-500">{agent.email}</div>
                            </div>
                            {agent.department && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {agent.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {errors.assignedAgentIds && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedAgentIds.message}</p>
              )}
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
                {isSubmitting ? 'Saving...' : (group ? 'Update Group' : 'Create Group')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const GroupsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdvancedTicketGroupDto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Fetch data
  const { data: allGroups = [], isLoading, error } = useAdvancedTicketGroups(showInactive);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string; categoryId: number }>>([]);
  const [agents, setAgents] = useState<Array<{ id: number; name: string; email: string; department?: string }>>([]);
  
  const deleteMutation = useDeleteAdvancedTicketGroup();

  // Filter and search groups
  const visibleGroups = allGroups.filter((group: AdvancedTicketGroupDto) => !group.isDeleted);

  const filteredGroups = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return visibleGroups.filter((group: AdvancedTicketGroupDto) => {
      const matchesCategory = selectedCategory === 0 || group.categoryId === selectedCategory;
      const matchesActiveState = showInactive ? !group.isActive : group.isActive;

      if (!normalizedSearch) {
        return matchesCategory && matchesActiveState;
      }

      const groupName = (group.name || '').toLowerCase();
      const groupDescription = (group.description || '').toLowerCase();
      const categoryName = group.categoryId
        ? categories.find(cat => cat.id === group.categoryId)?.name?.toLowerCase() ?? ''
        : '';
      const subcategoryName = group.subcategoryId
        ? subcategories.find(sub => sub.id === group.subcategoryId)?.name?.toLowerCase() ?? ''
        : '';
      const agentNames = (group.assignedAgentIds || [])
        .map((id: number) => agents.find((agent) => agent.id === id)?.name?.toLowerCase())
        .filter(Boolean)
        .join(' ');

      const matchesSearch =
        groupName.includes(normalizedSearch) ||
        groupDescription.includes(normalizedSearch) ||
        (categoryName && categoryName.includes(normalizedSearch)) ||
        (subcategoryName && subcategoryName.includes(normalizedSearch)) ||
        (agentNames && agentNames.includes(normalizedSearch));

      return matchesCategory && matchesActiveState && matchesSearch;
    });
  }, [visibleGroups, selectedCategory, searchTerm, showInactive, categories, subcategories, agents]);

  // Load categories, subcategories, and agents on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, subs, agts] = await Promise.all([
          settingsApi.getTicketCategories(),
          settingsApi.getSubCategories(),
          settingsApi.getAgents()
        ]);
        setCategories(cats);
        setSubcategories(subs);
        setAgents(agts);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleEdit = (group: AdvancedTicketGroupDto) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = async (groupId: number) => {
    if (window.confirm('Are you sure you want to delete this agent group? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(groupId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId) return null;
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name || 'Unknown';
  };

  const getAgentNames = (agentIds: number[]) => {
    return agentIds
      .map(id => agents.find(agent => agent.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load agent groups</div>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Agent Group
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
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
              placeholder="Search groups..."
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
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

          {/* Show Inactive Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <span>Show inactive</span>
          </label>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <UserGroupIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Agent Group Management
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">Organize agents into specialized groups for efficient ticket handling and automatic assignment.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create category-specific agent groups with defined responsibilities</li>
                <li>Configure automatic ticket assignment rules and workload limits</li>
                <li>Track group performance and ticket distribution statistics</li>
                <li>Manage agent assignments across multiple groups and departments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading agent groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agent groups found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory 
                ? 'No groups match your current filters.' 
                : 'Get started by creating your first agent group.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Agent Group
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredGroups.map((group: AdvancedTicketGroupDto) => (
              <li key={group.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {group.autoAssignmentEnabled && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Auto-Assign
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Category:</strong> {group.categoryId ? getCategoryName(group.categoryId) : 'Unknown'}
                        </span>
                        {group.subcategoryId && (
                          <span className="text-sm text-gray-500">
                            <strong>Subcategory:</strong> {getSubcategoryName(group.subcategoryId)}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          <strong>Agents:</strong> {group.assignedAgentIds?.length || 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Max/Agent:</strong> {group.maxTicketsPerAgent}
                        </span>
                      </div>
                      {(group.assignedAgentIds?.length || 0) > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Assigned Agents:</p>
                          <p className="text-sm text-gray-600 truncate">
                            {getAgentNames(group.assignedAgentIds || [])}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Group Stats */}
                    <div className="hidden lg:flex items-center space-x-4 mr-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{group.assignedAgentIds?.length || 0}</div>
                        <div className="text-xs text-gray-500">Agents</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{group.totalTickets || 0}</div>
                        <div className="text-xs text-gray-500">Tickets</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit group"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete group"
                      disabled={deleteMutation.isPending}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          Group Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{visibleGroups.length}</div>
            <div className="text-sm text-gray-500">Total Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {visibleGroups.filter((g: AdvancedTicketGroupDto) => g.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {visibleGroups.filter((g: AdvancedTicketGroupDto) => g.autoAssignmentEnabled).length}
            </div>
            <div className="text-sm text-gray-500">Auto-Assign</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {visibleGroups.reduce((total: number, group: AdvancedTicketGroupDto) => total + (group.assignedAgentIds?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Agent Assignments</div>
          </div>
        </div>
      </div>

      {/* Group Modal */}
      <GroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        group={editingGroup}
        categories={categories}
        subcategories={subcategories}
        agents={agents}
      />
    </div>
  );
};

export default GroupsTab;