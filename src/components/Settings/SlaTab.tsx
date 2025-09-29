import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  useSlaPolicies,
  useEscalationContacts,
  useCreateSlaPolicy,
  useUpdateSlaPolicy,
  useDeleteSlaPolicy,
  // useCreateEscalationContact, // for future use
  // useUpdateEscalationContact, // for future use 
  useDeleteEscalationContact
} from '../../hooks/useAdvancedSettings';
import { settingsApi } from '../../api/settingsApi';

// Form validation schema
const slaPolicySchema = yup.object({
  name: yup.string().required('Policy name is required').min(3, 'Name must be at least 3 characters'),
  priorityId: yup.number().required('Priority is required').positive('Please select a priority'),
  responseTimeMinutes: yup.number().required('Response time is required').positive('Response time must be greater than 0'),
  resolutionTimeMinutes: yup.number().required('Resolution time is required').positive('Resolution time must be greater than 0'),
  escalationLevel1Minutes: yup.number().nullable().optional().positive('Escalation time must be greater than 0'),
  escalationLevel2Minutes: yup.number().nullable().optional().positive('Escalation time must be greater than 0'),
  escalationLevel3Minutes: yup.number().nullable().optional().positive('Escalation time must be greater than 0'),
  isActive: yup.boolean().optional()
});

// Interfaces
interface SlaPolicy {
  id: number;
  name: string;
  priorityId: number;
  priorityName?: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel1Minutes?: number | null;
  escalationLevel2Minutes?: number | null;
  escalationLevel3Minutes?: number | null;
  isActive: boolean;
  createdAt: string;
}

interface SlaFormData {
  name: string;
  priorityId: number;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel1Minutes?: number | null | undefined;
  escalationLevel2Minutes?: number | null | undefined;
  escalationLevel3Minutes?: number | null | undefined;
  isActive?: boolean | undefined;
}

interface EscalationContact {
  id: number;
  slaPolicyId: number;
  level: number;
  name: string;
  email: string;
  notifyByEmail: boolean;
  notifyBySystem: boolean;
}

// Utility
const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const SlaTab: React.FC = () => {
  const [priorities, setPriorities] = useState<Array<{id: number, name: string, color: string}>>([]);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);
  
  // Contact management state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EscalationContact | null>(null);

  // React Query hooks
  const { data: slaPolicies = [], isLoading: loadingPolicies } = useSlaPolicies();
  const { data: contacts = [] } = useEscalationContacts();
  const createPolicyMutation = useCreateSlaPolicy();
  const updatePolicyMutation = useUpdateSlaPolicy();
  const deletePolicyMutation = useDeleteSlaPolicy();
  // Contact management mutations (for future use)
  // const createContactMutation = useCreateEscalationContact();
  // const updateContactMutation = useUpdateEscalationContact();
  const deleteContactMutation = useDeleteEscalationContact();

  // Load priorities from API
  const loadPriorities = async () => {
    try {
      const data = await settingsApi.getPriorityLevels();
      setPriorities(data.map(p => ({ id: p.id, name: p.name, color: p.color })));
    } catch (err) {
      console.error('Error loading priorities:', err);
    }
  };

  useEffect(() => {
    loadPriorities();
  }, []);

  // Forms with validation
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SlaFormData>({
    defaultValues: {
      isActive: true
    }
  });

  const openCreate = () => {
    setEditingPolicy(null);
    reset({
      name: '',
      priorityId: 0,
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 240,
      escalationLevel1Minutes: null,
      escalationLevel2Minutes: null,
      escalationLevel3Minutes: null,
      isActive: true,
    });
    setIsPolicyModalOpen(true);
  };

  const openEdit = (policy: SlaPolicy) => {
    setEditingPolicy(policy);
    reset({
      name: policy.name,
      priorityId: policy.priorityId,
      responseTimeMinutes: policy.responseTimeMinutes,
      resolutionTimeMinutes: policy.resolutionTimeMinutes,
      escalationLevel1Minutes: policy.escalationLevel1Minutes,
      escalationLevel2Minutes: policy.escalationLevel2Minutes,
      escalationLevel3Minutes: policy.escalationLevel3Minutes,
      isActive: policy.isActive,
    });
    setIsPolicyModalOpen(true);
  };

  const onSubmit = async (data: SlaFormData) => {
    try {
      // Convert empty strings to null for escalation fields
      const payload = {
        ...data,
        escalationLevel1Minutes: data.escalationLevel1Minutes || null,
        escalationLevel2Minutes: data.escalationLevel2Minutes || null,
        escalationLevel3Minutes: data.escalationLevel3Minutes || null,
      };

      if (editingPolicy) {
        await updatePolicyMutation.mutateAsync({ id: editingPolicy.id, data: payload });
      } else {
        await createPolicyMutation.mutateAsync(payload);
      }
      setIsPolicyModalOpen(false);
      reset();
    } catch (err) {
      console.error('❌ Error saving SLA policy:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this SLA policy? This will also delete all associated escalation contacts.')) return;
    try {
      await deletePolicyMutation.mutateAsync(id);
    } catch (err) {
      console.error('❌ Error deleting SLA policy:', err);
    }
  };

  // Contact management functions
  const openEditContact = (contact: EscalationContact) => {
    setEditingContact(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    if (window.confirm('Are you sure you want to delete this escalation contact? This action cannot be undone.')) {
      try {
        await deleteContactMutation.mutateAsync(contactId);
        // Contacts will be refetched automatically due to React Query
      } catch (error) {
        console.error('Failed to delete escalation contact:', error);
      }
    }
  };

  return (
    <div className="max-w-full overflow-hidden">
      <div className="space-y-6 p-2 sm:p-4">
        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                SLA Policies & Escalations
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Configure SLA targets and escalation rules. Notifications will be
                sent automatically if SLAs are breached.
              </p>
            </div>
          </div>
        </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-medium text-gray-900">SLA Policies</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Add SLA Policy
        </button>
      </div>

      {/* Table */}
      {loadingPolicies ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Response</span>
                  <span className="sm:hidden">Resp.</span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Resolution</span>
                  <span className="sm:hidden">Resol.</span>
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Escalations
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-3 sm:px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slaPolicies.map((p) => {
                const priority = priorities.find(pr => pr.id === p.priorityId);
                return (
                  <tr key={p.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {priority ? (
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: priority.color }}
                        >
                          {priority.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(p.responseTimeMinutes)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(p.resolutionTimeMinutes)}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-x-1 sm:space-x-2">
                        {p.escalationLevel1Minutes && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            L1: {formatDuration(p.escalationLevel1Minutes)}
                          </span>
                        )}
                        {p.escalationLevel2Minutes && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            L2: {formatDuration(p.escalationLevel2Minutes)}
                          </span>
                        )}
                        {p.escalationLevel3Minutes && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            L3: {formatDuration(p.escalationLevel3Minutes)}
                          </span>
                        )}
                        {!p.escalationLevel1Minutes && !p.escalationLevel2Minutes && !p.escalationLevel3Minutes && (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          p.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          disabled={updatePolicyMutation.isPending}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          disabled={deletePolicyMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slaPolicies.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No SLA policies configured. Create your first SLA policy to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Escalation Contacts Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Escalation Contacts</h2>
            <p className="text-sm text-gray-500">Configure who gets notified when SLAs are breached</p>
          </div>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserGroupIcon className="h-4 w-4 mr-1.5" />
            Add Contact
          </button>
        </div>

        {/* Contacts Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SLA Policy
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notifications
                  </th>
                  <th className="relative px-3 sm:px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => {
                  const policy = slaPolicies.find(p => p.id === contact.slaPolicyId);
                  return (
                    <tr key={contact.id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {policy?.name || 'Unknown Policy'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          contact.level === 1 ? 'bg-yellow-100 text-yellow-800' :
                          contact.level === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Level {contact.level}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.email}</div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="space-x-2">
                          {contact.notifyByEmail && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Email
                            </span>
                          )}
                          {contact.notifyBySystem && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              System
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditContact(contact)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {contacts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm"
                    >
                      No escalation contacts configured. Add contacts to receive SLA breach notifications.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPolicy ? 'Edit SLA Policy' : 'Create SLA Policy'}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Name *
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Standard Support SLA"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level *
                </label>
                <Controller
                  name="priorityId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Priority</option>
                      {priorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.priorityId && (
                  <p className="mt-1 text-sm text-red-600">{errors.priorityId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Time (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('responseTimeMinutes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="60"
                  />
                  {errors.responseTimeMinutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.responseTimeMinutes.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Time (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('resolutionTimeMinutes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="240"
                  />
                  {errors.resolutionTimeMinutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.resolutionTimeMinutes.message}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Escalation Levels (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Level 1 (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('escalationLevel1Minutes', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? null : Number(value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="480"
                    />
                    {errors.escalationLevel1Minutes && (
                      <p className="mt-1 text-sm text-red-600">{errors.escalationLevel1Minutes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Level 2 (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('escalationLevel2Minutes', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? null : Number(value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="720"
                    />
                    {errors.escalationLevel2Minutes && (
                      <p className="mt-1 text-sm text-red-600">{errors.escalationLevel2Minutes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Level 3 (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('escalationLevel3Minutes', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? null : Number(value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="960"
                    />
                    {errors.escalationLevel3Minutes && (
                      <p className="mt-1 text-sm text-red-600">{errors.escalationLevel3Minutes.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field: { value, onChange, onBlur, name, ref } }) => (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      name={name}
                      ref={ref}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createPolicyMutation.isPending || updatePolicyMutation.isPending}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || createPolicyMutation.isPending || updatePolicyMutation.isPending) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    editingPolicy ? 'Update Policy' : 'Create Policy'
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingContact ? 'Edit Escalation Contact' : 'Add Escalation Contact'}
                </h3>
                <button
                  onClick={() => {
                    setIsContactModalOpen(false);
                    setEditingContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SLA Policy
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select SLA Policy</option>
                    {slaPolicies.map(policy => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escalation Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Level</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-gray-700">Notification Preferences</span>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">System Notifications</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsContactModalOpen(false);
                      setEditingContact(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingContact ? 'Update Contact' : 'Add Contact'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SlaTab;
