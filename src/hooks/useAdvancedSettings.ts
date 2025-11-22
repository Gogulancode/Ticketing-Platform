import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { settingsApi } from '../api/settingsApi';
import type { 
  CreateTicketTagDto, 
  UpdateTicketTagDto,
  CreateGraphEmailConfigDto,
  UpdateGraphEmailConfigDto,
  CreateTicketFieldSettingDto,
  UpdateTicketFieldSettingDto,
  CreateAdvancedTicketGroupDto,
  UpdateAdvancedTicketGroupDto,
  ReorderFieldsRequest,
  CreateSlaPolicyDto,
  UpdateSlaPolicyDto,
  CreateSlaEscalationContactDto,
  UpdateSlaEscalationContactDto
} from '../api/settingsApi';

// =============================================================================
// TICKET TAGS HOOKS
// =============================================================================

export const useTicketTags = () => {
  return useQuery({
    queryKey: ['ticket-tags'],
    queryFn: () => settingsApi.getTicketTags(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTicketTagById = (id: number) => {
  return useQuery({
    queryKey: ['ticket-tag', id],
    queryFn: () => settingsApi.getTicketTagById(id),
    enabled: !!id,
  });
};

export const useTagsBySubcategory = (subcategoryId: number) => {
  return useQuery({
    queryKey: ['ticket-tags', 'subcategory', subcategoryId],
    queryFn: () => settingsApi.getTagsBySubcategory(subcategoryId),
    enabled: !!subcategoryId,
  });
};

export const useCreateTicketTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTicketTagDto) => settingsApi.createTicketTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags'] });
      toast.success('Tag created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });
};

export const useUpdateTicketTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketTagDto }) => 
      settingsApi.updateTicketTag(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-tag', id] });
      toast.success('Tag updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tag: ${error.message}`);
    },
  });
};

export const useDeleteTicketTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteTicketTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags'] });
      toast.success('Tag deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });
};

// =============================================================================
// GRAPH EMAIL CONFIG HOOKS
// =============================================================================

export const useGraphEmailConfigs = () => {
  return useQuery({
    queryKey: ['graph-email-configs'],
    queryFn: () => settingsApi.getGraphEmailConfigs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateGraphEmailConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGraphEmailConfigDto) => settingsApi.createGraphEmailConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph-email-configs'] });
      toast.success('Email configuration created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create email configuration: ${error.message}`);
    },
  });
};

export const useUpdateGraphEmailConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGraphEmailConfigDto }) => 
      settingsApi.updateGraphEmailConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph-email-configs'] });
      toast.success('Email configuration updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update email configuration: ${error.message}`);
    },
  });
};

export const useDeleteGraphEmailConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteGraphEmailConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph-email-configs'] });
      toast.success('Email configuration deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete email configuration: ${error.message}`);
    },
  });
};

export const useTestEmailConnection = () => {
  return useMutation({
    mutationFn: (id: number) => settingsApi.testEmailConnection(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Email connection test successful!');
      } else {
        toast.error(`Connection test failed: ${result.message}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Connection test failed: ${error.message}`);
    },
  });
};

// =============================================================================
// TICKET FIELD SETTINGS HOOKS
// =============================================================================

export const useTicketFieldSettings = () => {
  return useQuery({
    queryKey: ['ticket-field-settings'],
    queryFn: () => settingsApi.getTicketFieldSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFieldSettingsByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['ticket-field-settings', 'category', categoryId],
    queryFn: () => settingsApi.getFieldSettingsByCategory(categoryId),
    enabled: !!categoryId,
  });
};

export const useCreateTicketFieldSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTicketFieldSettingDto) => settingsApi.createTicketFieldSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-field-settings'] });
      toast.success('Field setting created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create field setting: ${error.message}`);
    },
  });
};

export const useUpdateTicketFieldSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketFieldSettingDto }) => 
      settingsApi.updateTicketFieldSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-field-settings'] });
      toast.success('Field setting updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update field setting: ${error.message}`);
    },
  });
};

export const useDeleteTicketFieldSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteTicketFieldSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-field-settings'] });
      toast.success('Field setting deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete field setting: ${error.message}`);
    },
  });
};

export const useReorderTicketFields = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ReorderFieldsRequest) => settingsApi.reorderTicketFields(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-field-settings'] });
      toast.success('Field order updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder fields: ${error.message}`);
    },
  });
};

// =============================================================================
// ADVANCED TICKET GROUPS HOOKS
// =============================================================================

export const useAdvancedTicketGroups = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: ['advanced-ticket-groups', includeInactive],
    queryFn: () => settingsApi.getAdvancedTicketGroups(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAdvancedTicketGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAdvancedTicketGroupDto) => settingsApi.createAdvancedTicketGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-ticket-groups'] });
      toast.success('Group created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
};

export const useUpdateAdvancedTicketGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAdvancedTicketGroupDto }) => 
      settingsApi.updateAdvancedTicketGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-ticket-groups'] });
      toast.success('Group updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update group: ${error.message}`);
    },
  });
};

export const useDeleteAdvancedTicketGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteAdvancedTicketGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-ticket-groups'] });
      toast.success('Group deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete group: ${error.message}`);
    },
  });
};

export const useGroupAgents = (groupId: number) => {
  return useQuery({
    queryKey: ['group-agents', groupId],
    queryFn: () => settingsApi.getGroupAgents(groupId),
    enabled: !!groupId,
  });
};

export const useAssignAgentToGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, agentId }: { groupId: number; agentId: number }) => 
      settingsApi.assignAgentToGroup(groupId, agentId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-agents', groupId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-ticket-groups'] });
      toast.success('Agent assigned to group successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign agent: ${error.message}`);
    },
  });
};

export const useRemoveAgentFromGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, agentId }: { groupId: number; agentId: number }) => 
      settingsApi.removeAgentFromGroup(groupId, agentId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-agents', groupId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-ticket-groups'] });
      toast.success('Agent removed from group successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove agent: ${error.message}`);
    },
  });
};

// =============================================================================
// SLA HOOKS
// =============================================================================

export const useSlaPolicies = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: ['sla-policies', includeInactive],
    queryFn: () => settingsApi.getSlaPolicies(includeInactive),
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
  });
};

export const useEscalationContacts = (policyId?: string) => {
  return useQuery({
    queryKey: policyId ? ['escalation-contacts', policyId] : ['escalation-contacts'],
    queryFn: () => settingsApi.getEscalationContacts(policyId),
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (new name for cacheTime)
  });
};

export const useCreateSlaPolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSlaPolicyDto) => settingsApi.createSlaPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create SLA policy: ${error.message}`);
    },
  });
};

export const useUpdateSlaPolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSlaPolicyDto }) => 
      settingsApi.updateSlaPolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update SLA policy: ${error.message}`);
    },
  });
};

export const useDeleteSlaPolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteSlaPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      queryClient.invalidateQueries({ queryKey: ['escalation-contacts'] });
      toast.success('SLA policy deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete SLA policy: ${error.message}`);
    },
  });
};

export const useCreateEscalationContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ policyId, data }: { policyId: string; data: Omit<CreateSlaEscalationContactDto, 'slaPolicyId'> }) => 
      settingsApi.createEscalationContact(policyId, data),
    onSuccess: (_, { policyId }) => {
      queryClient.invalidateQueries({ queryKey: ['escalation-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['escalation-contacts', policyId] });
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('Escalation contact created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create escalation contact: ${error.message}`);
    },
  });
};

export const useUpdateEscalationContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: number; data: UpdateSlaEscalationContactDto }) => 
      settingsApi.updateEscalationContact(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('Escalation contact updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update escalation contact: ${error.message}`);
    },
  });
};

export const useDeleteEscalationContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contactId: number) => settingsApi.deleteEscalationContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('Escalation contact deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete escalation contact: ${error.message}`);
    },
  });
};

// =============================================================================
// OPTIMISTIC UPDATES HELPER
// =============================================================================

/**
 * Helper function for optimistic updates
 * Use this when you want to update the UI immediately before the API call completes
 */
export const useOptimisticUpdate = <T>(queryKey: string[], updateFn: (oldData: T[], newItem: T) => T[]) => {
  const queryClient = useQueryClient();
  
  return (newItem: T) => {
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return [newItem];
      return updateFn(oldData, newItem);
    });
  };
};

// =============================================================================
// BATCH OPERATIONS HOOKS
// =============================================================================

export const useBatchDeleteTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagIds: number[]) => {
      const results = await Promise.allSettled(
        tagIds.map(id => settingsApi.deleteTicketTag(id))
      );
      
      const failedCount = results.filter(r => r.status === 'rejected').length;
      return {
        successCount: results.length - failedCount,
        failedCount,
        totalCount: results.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags'] });
      if (result.failedCount === 0) {
        toast.success(`Successfully deleted ${result.successCount} tags`);
      } else {
        toast.error(`Deleted ${result.successCount}/${result.totalCount} tags. ${result.failedCount} failed.`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Batch delete failed: ${error.message}`);
    },
  });
};