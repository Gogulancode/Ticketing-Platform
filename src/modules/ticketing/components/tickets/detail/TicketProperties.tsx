import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { settingsApi } from '../../../../../shared/services/api/settingsApi';
import { ticketsV2Api, TicketUpdateRequest } from '../../../services/ticketsV2Api';

interface TicketPropertiesProps {
  ticket: any;
  agents?: any[]; // Optional filtered agents from parent
}

const TicketProperties: React.FC<TicketPropertiesProps> = ({ ticket, agents }) => {
  const queryClient = useQueryClient();
  
  // Debug: Log the ticket data structure
  console.log('🎫 TicketProperties received ticket:', {
    ticket,
    category: ticket?.category,
    categoryId: ticket?.categoryId,
    subCategory: ticket?.subCategory,
    subcategoryId: ticket?.subcategoryId,
    priority: ticket?.priority,
    status: ticket?.status,
    assignedToUserId: ticket?.assignedToUserId
  });

  const [formData, setFormData] = useState<{
    categoryId: any;
    subcategoryId: any;
    issueType: any;
    priorityId: any;
    statusId: any;
    assignedAgentId: any;
    [key: string]: any;
  }>({
    categoryId: ticket?.categoryId || ticket?.category?.id || '',
    subcategoryId: ticket?.subcategoryId || ticket?.subCategory?.id || '',
    issueType: ticket?.issueType || '',
    priorityId: ticket?.priorityId || ticket?.priority?.id || '',
    statusId: ticket?.statusId || ticket?.status?.id || '',
    assignedAgentId: ticket?.assignedToUserId || '',
  });

  // Update form data when ticket changes
  useEffect(() => {
    if (ticket) {
      console.log('🔄 Updating formData with new ticket:', ticket);
      setFormData({
        categoryId: ticket?.categoryId || ticket?.category?.id || '',
        subcategoryId: ticket?.subcategoryId || ticket?.subCategory?.id || '',
        issueType: ticket?.issueType || '',
        priorityId: ticket?.priorityId || ticket?.priority?.id || '',
        statusId: ticket?.statusId || ticket?.status?.id || '',
        assignedAgentId: ticket?.assignedToUserId || '',
      });
    }
  }, [ticket]);

  const { data: customFields } = useQuery({
    queryKey: ['custom-fields', formData.categoryId, formData.subcategoryId],
    queryFn: async () => {
      console.log('🔧 Custom Fields Query:', {
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        categoryType: typeof formData.categoryId,
        subcategoryType: typeof formData.subcategoryId
      });

      const fields = await settingsApi.getCustomFields(
        formData.categoryId ? Number(formData.categoryId) : undefined,
        formData.subcategoryId ? Number(formData.subcategoryId) : undefined
      );

      console.log('📋 Custom Fields Result:', {
        count: fields.length,
        fields: fields.map(f => ({
          id: f.id,
          name: f.name,
          label: f.label,
          type: f.type,
          categoryId: f.categoryId,
          subCategoryId: f.subCategoryId,
          isActive: f.isActive
        }))
      });

      return fields;
    },
    enabled: !!(formData.categoryId && formData.subcategoryId),
  });

  const { data: categories } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => settingsApi.getTicketCategories(),
  });

  const { data: subcategories } = useQuery({
    queryKey: ['ticket-subcategories', formData.categoryId],
    queryFn: () => settingsApi.getSubCategories(formData.categoryId),
    enabled: !!formData.categoryId,
  });

  const { data: issueTypes } = useQuery({
    queryKey: ['issue-types'],
    queryFn: () => settingsApi.getIssueTypes(),
  });

  const { data: priorities } = useQuery({
    queryKey: ['ticket-priorities'],
    queryFn: () => settingsApi.getPriorityLevels(),
  });

  const { data: statuses } = useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: () => settingsApi.getTicketStatuses(),
  });

  // Use agents from props if provided (filtered), otherwise query all agents
  const { data: queriedAgents } = useQuery({
    queryKey: ['agents', formData.categoryId, formData.subcategoryId],
    queryFn: () => settingsApi.getAgents(),
    enabled: !!(formData.categoryId && formData.subcategoryId) && !agents,
  });
  
  const effectiveAgents = agents || queriedAgents;

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: string, value: any) => {
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
    mutationFn: async (updates: any) => {
      console.log('🚀 Updating ticket with data:', updates);
      
      // Map form data to API format
      const updateRequest: TicketUpdateRequest = {
        categoryId: updates.categoryId ? Number(updates.categoryId) : undefined,
        subcategoryId: updates.subcategoryId ? Number(updates.subcategoryId) : undefined,
        priority: updates.priorityId ? Number(updates.priorityId) : undefined,
        status: updates.statusId ? Number(updates.statusId) : undefined,
        assignedToUserId: updates.assignedAgentId || undefined,
      };

      // Remove undefined values
      Object.keys(updateRequest).forEach(key => {
        if (updateRequest[key as keyof TicketUpdateRequest] === undefined) {
          delete updateRequest[key as keyof TicketUpdateRequest];
        }
      });

      console.log('📤 Sending update request:', updateRequest);
      
      return await ticketsV2Api.updateTicket(ticket.id, updateRequest);
    },
    onSuccess: (result) => {
      console.log('✅ Ticket updated successfully:', result);
      setHasChanges(false);
      
      // Invalidate and refetch the ticket data
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Ticket Properties</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            {categories?.map((category: any) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
          <select
            value={formData.subcategoryId}
            onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.categoryId}
          >
            <option value="">Select Sub Category</option>
            {subcategories?.map((subcategory: any) => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>
        </div>

        {formData.categoryId && formData.subcategoryId && customFields && customFields.length > 0 && (
          <>
            {customFields.map((field: any) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label || field.name}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={formData[`customField_${field.id}`] || ''}
                    onChange={(e) => handleInputChange(`customField_${field.id}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not set</option>
                    {field.options?.map((option: string, index: number) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[`customField_${field.id}`] || ''}
                    onChange={(e) => handleInputChange(`customField_${field.id}`, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={formData.issueType}
            onChange={(e) => handleInputChange('issueType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {issueTypes?.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={formData.priorityId}
            onChange={(e) => handleInputChange('priorityId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Priority</option>
            {priorities?.map((priority: any) => (
              <option key={priority.id} value={priority.id}>{priority.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={formData.statusId}
            onChange={(e) => handleInputChange('statusId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            {statuses?.map((status: any) => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
          <select
            value={formData.assignedAgentId}
            onChange={(e) => handleInputChange('assignedAgentId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.categoryId || !formData.subcategoryId}
          >
            <option value="">Select Agent</option>
            {effectiveAgents?.map((agent: any) => (
              <option key={agent.id} value={agent.id}>{agent.name || agent.email || `Agent ${agent.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      {hasChanges && (
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