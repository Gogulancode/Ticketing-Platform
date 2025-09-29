import React from 'react';
import { ChevronDown, ChevronUp, User, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { Ticket } from '../../../services/ticketsApi';

interface CustomerInfoSectionProps {
  ticket: Ticket;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  ticket,
  expanded,
  onToggle,
  formatDate
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-sm font-semibold text-gray-900">
          <User className="h-4 w-4 inline mr-2" />
          Customer Information
        </h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
      
      {expanded && (
        <div className="border-t p-4 space-y-3">
          {/* Customer Name */}
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.createdByUser ? 
                  `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}` : 
                  'Unknown Customer'
                }
              </p>
            </div>
          </div>

          {/* Email */}
          {ticket.createdByUser?.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <a 
                  href={`mailto:${ticket.createdByUser.email}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {ticket.createdByUser.email}
                </a>
              </div>
            </div>
          )}

          {/* Phone - if available in extended user data */}
          {ticket.createdByUser && 'phone' in ticket.createdByUser && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <a 
                  href={`tel:${(ticket.createdByUser as any).phone}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {(ticket.createdByUser as any).phone}
                </a>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-900">
                {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>

          {/* First Response Time */}
          {ticket.firstResponseAt && (
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">First Response</p>
                <p className="text-sm text-gray-900">
                  {formatDate(ticket.firstResponseAt)}
                </p>
              </div>
            </div>
          )}

          {/* Ticket Source */}
          <div className="flex items-center space-x-3">
            <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Source</p>
              <p className="text-sm text-gray-900">
                {ticket.source === 1 ? 'Email' : 
                 ticket.source === 2 ? 'Web Portal' : 
                 ticket.source === 3 ? 'Phone' : 
                 'Unknown'}
              </p>
            </div>
          </div>

          {/* Customer Contact Actions */}
          <div className="pt-3 border-t">
            <div className="flex space-x-2">
              {ticket.createdByUser?.email && (
                <button
                  onClick={() => window.open(`mailto:${ticket.createdByUser!.email}`)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </button>
              )}
              
              {ticket.createdByUser && 'phone' in ticket.createdByUser && (
                <button
                  onClick={() => window.open(`tel:${(ticket.createdByUser as any).phone}`)}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInfoSection;