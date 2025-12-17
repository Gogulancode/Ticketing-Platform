import React from 'react';
import { Send, UserPlus, Edit3 } from 'lucide-react';
import { Ticket } from '../../../services/ticketsApi';
import { PriorityLevel, TicketStatusConfig } from '../../../../../shared/services/api/settingsApi';
import { getDisplayTicketNumber } from '../../../utils/ticketNumber';

interface TicketHeaderProps {
  ticket: Ticket;
  statusConfigs: TicketStatusConfig[];
  priorityLevels: PriorityLevel[];
  onEmailClick: () => void;
  onAssignClick: () => void;
  formatDate: (date: string) => string;
}

const TicketHeader: React.FC<TicketHeaderProps> = ({
  ticket,
  statusConfigs,
  priorityLevels,
  onEmailClick,
  onAssignClick,
  formatDate
}) => {
  const getStatusBadge = (status: number | string) => {
    const statusConfig = statusConfigs.find(config => config.workflowOrder === status || config.name === status);
    const statusText = typeof status === 'string' ? status : statusConfig?.name || 'Unknown';
    const statusColor = statusConfig?.color || '#6b7280';
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: statusColor }}
      >
        {statusText}
      </span>
    );
  };

  const getPriorityBadge = (priority: number | string) => {
    const priorityLevel = priorityLevels.find(level => level.level === priority);
    const priorityText = typeof priority === 'string' ? priority : priorityLevel?.level || 'Unknown';
    const priorityColor = priorityLevel?.color || '#6b7280';
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: priorityColor }}
      >
        {priorityText}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              #{getDisplayTicketNumber(ticket)} - {ticket.title}
            </h1>
            <div className="flex items-center space-x-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Created {formatDate(ticket.createdAt)} • Last updated {formatDate(ticket.updatedAt)}
          </p>
          
          {/* Ticket Description */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700">{ticket.description}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onEmailClick}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Email
          </button>
          <button
            onClick={onAssignClick}
            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </button>
          <button className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketHeader;