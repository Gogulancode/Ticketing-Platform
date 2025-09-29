import React, { useState, useEffect } from 'react';
import { X, Users, User, Check, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, Agent, TicketGroup } from '../../../shared/services/api/settingsApi';

interface AgentGroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
  group?: TicketGroup | null;
  mode: 'agent' | 'group'; // Whether we're managing groups for an agent or agents for a group
  onUpdate: () => void;
}

const AgentGroupManager: React.FC<AgentGroupManagerProps> = ({
  isOpen,
  onClose,
  agent,
  group,
  mode,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [assignedGroups, setAssignedGroups] = useState<TicketGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<TicketGroup[]>([]);
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, agent, group, mode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (mode === 'agent' && agent) {
        // Load groups for agent
        const agentGroups = await settingsApi.getGroupsForAgent(agent.id, true);
        const allGroups = await settingsApi.getTicketGroups({ includeInactive: false });
        
        setAssignedGroups(agentGroups);
        setAvailableGroups(allGroups.filter(g => !agentGroups.find(ag => ag.id === g.id)));
      } else if (mode === 'group' && group) {
        // Load agents for group  
        const agentsWithGroups = await settingsApi.getAgentsWithGroups(true);
        const groupAgents = agentsWithGroups
          .filter(item => item.groups.find(g => g.id === group.id))
          .map(item => item.agent);
        const availableAgentList = agentsWithGroups
          .filter(item => !item.groups.find(g => g.id === group.id))
          .map(item => item.agent);
        
        setAssignedAgents(groupAgents);
        setAvailableAgents(availableAgentList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (targetId: number) => {
    if (!agent && !group) return;
    
    try {
      if (mode === 'agent' && agent) {
        await settingsApi.addAgentToGroup(targetId, agent.id);
        toast.success('Agent assigned to group successfully');
      } else if (mode === 'group' && group) {
        await settingsApi.addAgentToGroup(group.id, targetId);
        toast.success('Agent added to group successfully');
      }
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error assigning:', error);
      toast.error('Failed to assign');
    }
  };

  const handleUnassign = async (targetId: number) => {
    if (!agent && !group) return;
    
    try {
      if (mode === 'agent' && agent) {
        await settingsApi.removeAgentFromGroup(targetId, agent.id);
        toast.success('Agent removed from group successfully');
      } else if (mode === 'group' && group) {
        await settingsApi.removeAgentFromGroup(group.id, targetId);
        toast.success('Agent removed from group successfully');
      }
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error unassigning:', error);
      toast.error('Failed to unassign');
    }
  };

  if (!isOpen) return null;

  const title = mode === 'agent' 
    ? `Manage Groups for Agent: ${agent?.name}`
    : `Manage Agents for Group: ${group?.name}`;

  const assignedItems = mode === 'agent' ? assignedGroups : assignedAgents;
  const availableItems = mode === 'agent' ? availableGroups : availableAgents;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  {mode === 'agent' ? 'Assigned Groups' : 'Assigned Agents'} ({assignedItems.length})
                </h3>
                <div className="space-y-2">
                  {assignedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No {mode === 'agent' ? 'groups' : 'agents'} assigned</p>
                    </div>
                  ) : (
                    assignedItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">{item.name}</p>
                          {mode === 'agent' ? (
                            <p className="text-sm text-green-700">Category: {(item as TicketGroup).categoryName}</p>
                          ) : (
                            <p className="text-sm text-green-700">Email: {(item as Agent).email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnassign(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                          title="Remove assignment"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-2" />
                  Available {mode === 'agent' ? 'Groups' : 'Agents'} ({availableItems.length})
                </h3>
                <div className="space-y-2">
                  {availableItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>All {mode === 'agent' ? 'groups' : 'agents'} are assigned</p>
                    </div>
                  ) : (
                    availableItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {mode === 'agent' ? (
                            <p className="text-sm text-gray-600">Category: {(item as TicketGroup).categoryName}</p>
                          ) : (
                            <p className="text-sm text-gray-600">Email: {(item as Agent).email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssign(item.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                          title="Add assignment"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {mode === 'agent' 
                ? `${assignedItems.length} groups assigned to ${agent?.name}`
                : `${assignedItems.length} agents assigned to ${group?.name}`
              }
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentGroupManager;