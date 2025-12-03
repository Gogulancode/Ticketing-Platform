import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import {
  settingsApi,
  type TicketCategoryConfig,
  type SubCategory,
  type PriorityLevel,
  type TicketStatusConfig,
  type CustomField,
  type Agent as SettingsAgent,
} from '../../../../../shared/services/api/settingsApi';
import { settingsApi as advancedSettingsApi } from '../../../../../api/settingsApi';
import { ticketsV2Api, TicketUpdateRequest } from '../../../services/ticketsV2Api';

type FormValue = string | number | undefined;

interface TicketFormData extends Record<string, FormValue> {
  categoryId: FormValue;
  subcategoryId: FormValue;
  priorityId: FormValue;
  statusId: FormValue;
  assignedAgentId: FormValue;
}

interface TicketReference {
  id: string;
  categoryId?: number | string | null;
  category?: { id?: number | null } | number | null;
  subcategoryId?: number | string | null;
  subCategory?: { id?: number | null } | number | null;
  priorityId?: number | string | null;
  priority?: { id?: number | null } | number | null;
  statusId?: number | string | null;
  status?: { id?: number | null } | number | null;
  assignedToUserId?: string;
  assignedAgentId?: string;
  assignedToUser?: { id?: string } | null;
  customFieldValues?: Array<{ customFieldId?: number; fieldId?: number; id?: number; value?: FormValue }> | Record<string, FormValue>;
}

interface TicketPropertiesProps {
  ticket: TicketReference;
  agents?: SettingsAgent[]; // Optional filtered agents from parent
  isAgent?: boolean; // Whether current user is admin/agent
}

const TicketProperties: React.FC<TicketPropertiesProps> = ({ ticket, agents, isAgent = false }) => {
  const queryClient = useQueryClient();

  const extractId = (
    entity: number | string | { id?: number | null } | null | undefined
  ): FormValue => {
    if (entity === null || entity === undefined) {
      return '';
    }
    if (typeof entity === 'number') {
      return entity; // Return number as-is for priority/status
    }
    if (typeof entity === 'string') {
      return entity;
    }
    if (typeof entity === 'object' && 'id' in entity && entity.id != null) {
      return entity.id;
    }
    return '';
  };

  // Convert priority enum value (0-3) to database ID (1-4)
  // Enum: Low=0, Medium=1, High=2, Critical=3
  // DB:   Low=1, Medium=2, High=3, Critical=4
  const convertPriorityEnumToDbId = (priority: number | string | { id?: number | null } | null | undefined): FormValue => {
    const value = extractId(priority);
    if (value === '' || value === null || value === undefined) return '';
    const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (isNaN(numValue)) return '';
    // If value is 0-3 (enum), convert to 1-4 (database ID)
    // If value is already 1-4, keep as-is
    if (numValue >= 0 && numValue <= 3) {
      return numValue + 1; // Convert enum to database ID
    }
    return numValue; // Already a database ID
  };

  const toNumericId = (value: FormValue): number | undefined => {
    if (value === undefined || value === '' || value === null) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const toInputValue = (value: FormValue): string =>
    value !== undefined && value !== null ? String(value) : '';

  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<TicketFormData>(() => ({
    categoryId: extractId(ticket?.categoryId ?? ticket?.category),
    subcategoryId: extractId(ticket?.subcategoryId ?? ticket?.subCategory),
    priorityId: convertPriorityEnumToDbId(ticket?.priorityId ?? ticket?.priority),
    statusId: extractId(ticket?.statusId ?? ticket?.status),
    assignedAgentId: ticket?.assignedToUserId || ticket?.assignedAgentId || ticket?.assignedToUser?.id || '',
  }));

  // Update form data when ticket changes - only on initial mount or when ticket ID changes
  useEffect(() => {
    if (ticket && !hasChanges) {
      
      const fallbackStatus = (() => {
        if (ticket?.statusId !== undefined && ticket?.statusId !== null) {
          return ticket.statusId;
        }
        const statusEntity = ticket?.status;
        if (typeof statusEntity === 'number') {
          return statusEntity;
        }
        if (statusEntity && typeof statusEntity === 'object' && statusEntity.id != null) {
          return statusEntity.id;
        }
        return 1;
      })();

      const newFormData: TicketFormData = {
        categoryId: extractId(ticket?.categoryId ?? ticket?.category),
        subcategoryId: extractId(ticket?.subcategoryId ?? ticket?.subCategory),
        priorityId: convertPriorityEnumToDbId(ticket?.priorityId ?? ticket?.priority),
        statusId: fallbackStatus,
        assignedAgentId: ticket?.assignedToUserId || ticket?.assignedAgentId || ticket?.assignedToUser?.id || '',
      };
      
      // Add existing custom field values if they exist
      if (ticket?.customFieldValues) {
        if (Array.isArray(ticket.customFieldValues)) {
          // Array format from V2 API
          ticket.customFieldValues.forEach((fieldValue) => {
            const fieldId = fieldValue.customFieldId || fieldValue.fieldId || fieldValue.id;
            if (fieldId) {
              newFormData[`customField_${fieldId}`] = fieldValue.value;
            }
          });
        } else if (typeof ticket.customFieldValues === 'object') {
          // Object format - handle both formats
          Object.entries(ticket.customFieldValues).forEach(([key, value]) => {
            const fieldKey = key.startsWith('customField_') ? key : `customField_${key}`;
            newFormData[fieldKey] = value as FormValue;
          });
        }
      }
      setFormData(newFormData);
    }
  }, [ticket, hasChanges]);

  const numericCategoryId = toNumericId(formData.categoryId);
  const numericSubcategoryId = toNumericId(formData.subcategoryId);

  const { data: customFields } = useQuery<CustomField[]>({
    queryKey: ['custom-fields', formData.categoryId, formData.subcategoryId],
    queryFn: async () => {
      const fields = await settingsApi.getCustomFields(
        numericCategoryId,
        numericSubcategoryId
      );
      return fields;
    },
    enabled: !!(numericCategoryId && numericSubcategoryId),
  });

  const { data: categories } = useQuery<TicketCategoryConfig[]>({
    queryKey: ['ticket-categories'],
    queryFn: () => settingsApi.getTicketCategories(),
  });

  const { data: subcategories } = useQuery<SubCategory[]>({
    queryKey: ['ticket-subcategories', formData.categoryId],
    queryFn: () => settingsApi.getSubCategories(numericCategoryId),
    enabled: !!numericCategoryId,
  });

  const { data: priorities } = useQuery<PriorityLevel[]>({
    queryKey: ['ticket-priorities'],
    queryFn: () => settingsApi.getPriorityLevels(),
  });

  const { data: statuses } = useQuery<TicketStatusConfig[]>({
    queryKey: ['ticket-statuses'],
    queryFn: () => settingsApi.getTicketStatuses(),
  });



  // Query all agents
  const { data: allAgents } = useQuery<SettingsAgent[]>({
    queryKey: ['agents'],
    queryFn: () => settingsApi.getAgents(),
  });

  // Query agent groups to filter agents by category/subcategory
  // Use the advanced API which includes categoryId, subcategoryId, and assignedAgentIds
  const { data: agentGroups } = useQuery({
    queryKey: ['advanced-ticket-groups'],
    queryFn: () => advancedSettingsApi.getAdvancedTicketGroups(),
  });

  // Filter agents based on category and subcategory using agent groups
  const filteredAgentsByCategory = React.useMemo(() => {
    if (!allAgents || allAgents.length === 0) return [];
    
    // If no category selected yet, don't show any agents
    if (!numericCategoryId) {
      return [];
    }
    
    // If agent groups haven't loaded yet, show empty (loading state)
    if (!agentGroups) {
      return [];
    }

    // Find matching agent groups based on selected category and subcategory
    const matchingGroups = agentGroups.filter(group => {
      const categoryMatch = group.categoryId === numericCategoryId;
      const subcategoryMatch = !numericSubcategoryId || // No subcategory selected
                              !group.subcategoryId || // Group applies to all subcategories
                              group.subcategoryId === numericSubcategoryId; // Exact match
      const isMatch = categoryMatch && subcategoryMatch && group.isActive;
      
      return isMatch;
    });

    if (matchingGroups.length === 0) {
      // No matching groups for this category - show empty list
      return [];
    }

    // Get all agent IDs from matching groups
    const allowedAgentIds = new Set<number>();
    matchingGroups.forEach(group => {
      group.assignedAgentIds?.forEach((agentId: number) => allowedAgentIds.add(agentId));
    });

    // Filter agents to only show those in matching groups
    const filtered = allAgents.filter(agent => {
      const agentIdNumber = typeof agent.id === 'number' ? agent.id : parseInt(String(agent.id));
      return allowedAgentIds.has(agentIdNumber);
    });

    return filtered;
  }, [allAgents, agentGroups, numericCategoryId, numericSubcategoryId]);

  // Always use locally filtered agents based on current form values
  const effectiveAgents = filteredAgentsByCategory;

  const handleInputChange = (field: string, value: FormValue) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'categoryId') {
        newData.subcategoryId = '';
        newData.assignedAgentId = '';
      } else if (field === 'subcategoryId') {
        newData.assignedAgentId = '';
      }

      return newData;
    });
    setHasChanges(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: TicketFormData) => {
      // Extract custom fields from form data - convert to proper types
      const customFields: Record<string, string | number | boolean | null> = {};
      Object.keys(updates).forEach(key => {
        if (key.startsWith('customField_')) {
          const fieldId = key.replace('customField_', '');
          const value = updates[key];
          // Convert undefined to null for the API
          customFields[fieldId] = value === undefined ? null : value;
        }
      });
      
      // Map form data to API format exactly as the backend expects
      const updateRequest: TicketUpdateRequest = {
        category: toNumericId(updates.categoryId),
        categoryId: toNumericId(updates.categoryId),
        subcategoryId: toNumericId(updates.subcategoryId),
        priority: toNumericId(updates.priorityId),
        status: toNumericId(updates.statusId),
        assignedToUserId:
          updates.assignedAgentId !== undefined && updates.assignedAgentId !== ''
            ? String(updates.assignedAgentId)
            : undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      // Remove undefined values
      Object.keys(updateRequest).forEach(key => {
        const typedKey = key as keyof TicketUpdateRequest;
        if (updateRequest[typedKey] === undefined) {
          delete updateRequest[typedKey];
        }
      });

      return await ticketsV2Api.updateTicket(ticket.id, updateRequest);
    },
    onSuccess: () => {
      setHasChanges(false);
      
      // Invalidate queries to refetch fresh data - this will reload the ticket with updated values
      // Don't manually update formData here, let the useEffect handle it when fresh data arrives
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => {
      console.error('❌ Failed to update ticket:', error);
    }
  });

  const handleUpdate = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-base font-semibold mb-3">Ticket Properties</h3>
      
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={toInputValue(formData.categoryId)}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
          <select
            value={toInputValue(formData.subcategoryId)}
            onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.categoryId}
          >
            <option value="">Select Sub Category</option>
            {subcategories?.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>
        </div>

        {formData.categoryId && formData.subcategoryId && customFields && customFields.length > 0 && (
          <>
            {customFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label || field.name}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={toInputValue(formData[`customField_${field.id}`])}
                    onChange={(e) => handleInputChange(`customField_${field.id}`, e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not set</option>
                    {field.options?.map((option: string, index: number) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={toInputValue(formData[`customField_${field.id}`])}
                    onChange={(e) => handleInputChange(`customField_${field.id}`, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={toInputValue(formData.priorityId)}
            onChange={(e) => handleInputChange('priorityId', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Priority</option>
            {priorities?.map((priority) => (
              <option key={priority.id} value={String(priority.id)}>{priority.name}</option>
            ))}
          </select>
        </div>

        {/* Status - Only visible to Admin/Agent */}
        {isAgent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={toInputValue(formData.statusId)}
              onChange={(e) => handleInputChange('statusId', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              {statuses?.map((status) => (
                <option key={status.id} value={String(status.id)}>{status.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Agent - Only visible to Admin/Agent */}
        {isAgent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
            <select
              value={toInputValue(formData.assignedAgentId)}
              onChange={(e) => handleInputChange('assignedAgentId', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.categoryId || !formData.subcategoryId || effectiveAgents.length === 0}
            >
              {effectiveAgents.length === 0 ? (
                <option value="">No agents configured for this category</option>
              ) : (
                <>
                  <option value="">Select Agent</option>
                  {effectiveAgents.map((agent) => (
                    <option key={agent.id} value={agent.userId}>{agent.name || agent.email || `Agent ${agent.id}`}</option>
                  ))}
                </>
              )}
            </select>
            {effectiveAgents.length === 0 && formData.categoryId && formData.subcategoryId && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Configure agent groups in Settings → Groups
              </p>
            )}
          </div>
        )}
      </div>

      {/* Only show update button if user has changes AND is an agent/admin */}
      {hasChanges && isAgent && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Update
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TicketProperties;
