import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, User, UserPlus, Search, CheckCircle } from 'lucide-react';
import { QueryClient } from '@tanstack/react-query';
import { Ticket } from '../../../services/ticketsApi';
import { ticketsApi } from '../../../services/ticketsApi';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  workload?: number;
}

interface Department {
  id: number;
  name: string;
}

interface AssignmentModalProps {
  ticket: Ticket;
  agents: Agent[];
  departments: Department[];
  onClose: () => void;
  queryClient: QueryClient;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  ticket,
  agents,
  departments,
  onClose,
  queryClient
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const assignTicketMutation = useMutation({
    mutationFn: (agentId: string) => ticketsApi.assignTicket(ticket.id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      toast.success('Ticket assigned successfully');
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to assign ticket: ${message}`);
    }
  });

  const unassignTicketMutation = useMutation({
    mutationFn: () => ticketsApi.unassignTicket(ticket.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      toast.success('Ticket unassigned successfully');
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to unassign ticket: ${message}`);
    }
  });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchQuery === '' || 
      `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === null || 
      agent.department === departments.find(d => d.id === selectedDepartment)?.name;
    
    return matchesSearch && matchesDepartment;
  });

  const handleAssign = () => {
    if (!selectedAgent) return;
    assignTicketMutation.mutate(selectedAgent);
  };

  const handleUnassign = () => {
    unassignTicketMutation.mutate();
  };

  const getAgentWorkloadColor = (workload?: number) => {
    if (!workload) return 'bg-green-100 text-green-800';
    if (workload < 5) return 'bg-green-100 text-green-800';
    if (workload < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            <UserPlus className="h-5 w-5 inline mr-2" />
            Assign Ticket
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Assignment */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Currently assigned to:</p>
            <p className="text-sm font-medium text-gray-900">
              {ticket.assignedToUser ? 
                `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}` : 
                'Unassigned'
              }
            </p>
            {ticket.assignedToUser && (
              <button
                onClick={handleUnassign}
                disabled={unassignTicketMutation.isPending}
                className="mt-2 inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Remove Assignment
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Agents List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {filteredAgents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No agents found matching your criteria
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredAgents.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedAgent === agent.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {agent.firstName} {agent.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                          {agent.department && (
                            <p className="text-xs text-gray-600">{agent.department}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {agent.workload !== undefined && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAgentWorkloadColor(agent.workload)}`}>
                            {agent.workload} tickets
                          </span>
                        )}
                        
                        {selectedAgent === agent.id && (
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedAgent || assignTicketMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {assignTicketMutation.isPending ? 'Assigning...' : 'Assign Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;