import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

// Mock data - replace with actual API calls
const mockAgents = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john.doe@company.com', 
    department: 'Technical Support',
    isActive: true, 
    currentTickets: 12, 
    maxCapacity: 20,
    availabilityStatus: 'Available',
    joinedAt: '2024-01-15'
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane.smith@company.com', 
    department: 'Customer Service',
    isActive: true, 
    currentTickets: 8, 
    maxCapacity: 15,
    availabilityStatus: 'Busy',
    joinedAt: '2024-02-20'
  },
  { 
    id: 3, 
    name: 'Mike Johnson', 
    email: 'mike.johnson@company.com', 
    department: 'Technical Support',
    isActive: true, 
    currentTickets: 15, 
    maxCapacity: 25,
    availabilityStatus: 'Available',
    joinedAt: '2023-11-10'
  },
  { 
    id: 4, 
    name: 'Sarah Wilson', 
    email: 'sarah.wilson@company.com', 
    department: 'Billing',
    isActive: false, 
    currentTickets: 0, 
    maxCapacity: 10,
    availabilityStatus: 'Offline',
    joinedAt: '2024-03-05'
  },
];

const mockDepartments = [
  { id: 1, name: 'Technical Support' },
  { id: 2, name: 'Customer Service' },
  { id: 3, name: 'Billing' },
  { id: 4, name: 'Sales' },
];

interface AgentFormData {
  name: string;
  email: string;
  department: string;
  maxCapacity: number;
  isActive: boolean;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: any | null;
}

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, agent }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AgentFormData>({
    defaultValues: {
      name: agent?.name || '',
      email: agent?.email || '',
      department: agent?.department || '',
      maxCapacity: agent?.maxCapacity || 15,
      isActive: agent?.isActive ?? true,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: agent?.name || '',
        email: agent?.email || '',
        department: agent?.department || '',
        maxCapacity: agent?.maxCapacity || 15,
        isActive: agent?.isActive ?? true,
      });
    }
  }, [isOpen, agent, reset]);

  const onSubmit = async (data: AgentFormData) => {
    try {
      // TODO: Implement actual API call
      console.log('Saving agent:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving agent:', error);
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
              <UserIcon className="h-5 w-5 text-gray-600" />
              {agent ? 'Edit Agent' : 'Create Agent'}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-gray-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="john.doe@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-gray-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                {...register('department', { required: 'Department is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {mockDepartments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-gray-600">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Ticket Capacity
              </label>
              <input
                {...register('maxCapacity', { 
                  required: 'Maximum capacity is required',
                  min: { value: 1, message: 'Capacity must be at least 1' },
                  max: { value: 100, message: 'Capacity cannot exceed 100' }
                })}
                type="number"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="15"
              />
              {errors.maxCapacity && (
                <p className="mt-1 text-sm text-gray-600">{errors.maxCapacity.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Maximum number of tickets this agent can handle simultaneously
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active agent</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Only active agents can receive new ticket assignments
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (agent ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AgentsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Mock data - replace with actual API calls
  const [agents] = useState(mockAgents);

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchTerm || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || agent.department === selectedDepartment;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && agent.isActive) ||
      (statusFilter === 'inactive' && !agent.isActive) ||
      (statusFilter === 'available' && agent.availabilityStatus === 'Available') ||
      (statusFilter === 'busy' && agent.availabilityStatus === 'Busy');

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleDelete = async (agentId: number) => {
    if (window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      // TODO: Implement actual API call
      console.log('Deleting agent:', agentId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-yellow-100 text-yellow-800';
      case 'Offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-gray-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Agent
          </button>
        </div>

        {/* Filters */}
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
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Search agents..."
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Departments</option>
              {mockDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedDepartment || statusFilter
                ? 'No agents match your current filters.' 
                : 'Get started by adding your first agent.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Agent
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAgents.map((agent) => (
              <li key={agent.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {agent.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(agent.availabilityStatus)}`}>
                          {agent.availabilityStatus}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          agent.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-gray-800'
                        }`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{agent.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Department:</strong> {agent.department}
                        </span>
                        <span className={`text-sm font-medium ${getCapacityColor(agent.currentTickets, agent.maxCapacity)}`}>
                          <strong>Workload:</strong> {agent.currentTickets}/{agent.maxCapacity}
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Joined:</strong> {new Date(agent.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Capacity Bar */}
                      <div className="mt-2">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Capacity:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                            <div 
                              className={`h-2 rounded-full ${
                                (agent.currentTickets / agent.maxCapacity) >= 0.9 
                                  ? 'bg-red-500' 
                                  : (agent.currentTickets / agent.maxCapacity) >= 0.7 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((agent.currentTickets / agent.maxCapacity) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {Math.round((agent.currentTickets / agent.maxCapacity) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit agent"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Delete agent"
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{agents.length}</div>
            <div className="text-sm text-gray-500">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {agents.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-gray-500">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {agents.filter(a => a.availabilityStatus === 'Available').length}
            </div>
            <div className="text-sm text-gray-500">Available Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {agents.reduce((total, agent) => total + agent.currentTickets, 0)}
            </div>
            <div className="text-sm text-gray-500">Active Tickets</div>
          </div>
        </div>
      </div>

      {/* Agent Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        agent={editingAgent}
      />
    </div>
  );
};

export default AgentsTab;