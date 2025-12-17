import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, GitMerge, Calendar, User, MessageSquare, ExternalLink } from 'lucide-react';
import { settingsApi, TicketStatusConfig, PriorityLevel } from '../../../shared/services/api/settingsApi';
import { API_CONFIG } from '../../../config/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { formatTicketDateTime } from '../../../shared/utils/dateUtils';

interface MergedTicket {
  id: string;
  publicId: number;
  title: string;
  description: string;
  status: number;
  priority: number;
  createdAt: string;
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface MergedTicketsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mergedTickets: string[];
  currentTicketId: string;
  onNavigateToTicket: (ticketId: string) => void;
}

const MergedTicketsViewer: React.FC<MergedTicketsViewerProps> = ({
  isOpen,
  onClose,
  mergedTickets,
  currentTicketId,
  onNavigateToTicket
}) => {
  const [tickets, setTickets] = useState<MergedTicket[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<TicketStatusConfig[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);

  const loadSettingsData = useCallback(async () => {
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        settingsApi.getTicketStatuses(),
        settingsApi.getPriorityLevels()
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
    } catch (error) {
      console.error('Error loading settings data:', error);
      // Use fallback data
      setStatuses([
        { id: 0, name: "Open", color: "#ef4444", isDefault: false, workflowOrder: 1, isActive: true, allowedTransitions: [1] },
        { id: 1, name: "In Progress", color: "#f59e0b", isDefault: true, workflowOrder: 2, isActive: true, allowedTransitions: [2, 3] },
        { id: 2, name: "Resolved", color: "#10b981", isDefault: false, workflowOrder: 3, isActive: true, allowedTransitions: [3] },
        { id: 3, name: "Closed", color: "#6b7280", isDefault: false, workflowOrder: 4, isActive: true, allowedTransitions: [] }
      ]);
      setPriorities([
        { id: 0, name: "Low", color: "#10b981", level: 1, isActive: true, order: 1 },
        { id: 1, name: "Medium", color: "#f59e0b", level: 2, isActive: true, order: 2 },
        { id: 2, name: "High", color: "#ef4444", level: 3, isActive: true, order: 3 },
        { id: 3, name: "Critical", color: "#dc2626", level: 4, isActive: true, order: 4 }
      ]);
    }
  }, []);

  const loadTicketDetails = useCallback(async () => {
    setLoading(true);
    try {
      const ticketDetails = await Promise.all(
        mergedTickets.map(async (ticketId): Promise<MergedTicket | null> => {
          try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${ticketId}`);
            if (response.ok) {
              const data = (await response.json()) as MergedTicket;
              return data;
            }
            return null;
          } catch (error) {
            console.error(`Failed to load ticket ${ticketId}:`, error);
            return null;
          }
        })
      );

      const validTickets = ticketDetails.filter((ticket): ticket is MergedTicket => ticket !== null);
      setTickets(validTickets);
    } catch (error) {
      console.error('Failed to load merged tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [mergedTickets]);

  useEffect(() => {
    if (isOpen && mergedTickets.length > 0) {
      loadTicketDetails();
      loadSettingsData();
    }
  }, [isOpen, mergedTickets, loadTicketDetails, loadSettingsData]);

  useEffect(() => {
    // Set current index based on current ticket
    const index = tickets.findIndex(t => t.id === currentTicketId);
    if (index >= 0) {
      setCurrentIndex(index);
    }
  }, [tickets, currentTicketId]);

  const currentTicket = tickets[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < tickets.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getStatusConfig = (status: number) => {
    return statuses.find(s => s.id === status) || statuses.find(s => s.isDefault) || statuses[0];
  };

  const getPriorityConfig = (priority: number) => {
    return priorities.find(p => p.id === priority) || priorities[0];
  };

  const getPriorityColor = (priority: number) => {
    const priorityConfig = getPriorityConfig(priority);
    if (!priorityConfig) return 'bg-gray-100 text-gray-800';
    
    const color = priorityConfig.color?.toLowerCase();
    if (color?.includes('#dc2626') || color?.includes('#ef4444') || color?.includes('red')) {
      return 'bg-red-100 text-gray-800';
    } else if (color?.includes('#f59e0b') || color?.includes('orange')) {
      return 'bg-orange-100 text-orange-800';
    } else if (color?.includes('yellow')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (color?.includes('#10b981') || color?.includes('green')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityText = (priority: number) => {
    const priorityConfig = getPriorityConfig(priority);
    return priorityConfig?.name || 'Unknown';
  };

  const getStatusColor = (status: number) => {
    const statusConfig = getStatusConfig(status);
    if (!statusConfig) return 'bg-gray-100 text-gray-800';
    
    const color = statusConfig.color?.toLowerCase();
    if (color?.includes('#ef4444') || color?.includes('red')) {
      return 'bg-red-100 text-gray-800';
    } else if (color?.includes('#f59e0b') || color?.includes('yellow') || color?.includes('orange')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (color?.includes('#10b981') || color?.includes('green')) {
      return 'bg-green-100 text-green-800';
    } else if (color?.includes('#6b7280') || color?.includes('gray')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-red-100 text-gray-800';
  };

  const getStatusText = (status: number) => {
    const statusConfig = getStatusConfig(status);
    return statusConfig?.name || 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GitMerge className="h-6 w-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Merged Tickets Viewer</h2>
              <p className="text-sm text-gray-600">
                Viewing {tickets.length} related tickets in read-only mode
              </p>
            </div>
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
            <LoadingSpinner size="lg" message="Loading merged tickets..." />
          </div>
        ) : currentTicket ? (
          <>
            {/* Navigation */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    canGoPrevious 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} of {tickets.length}
                </span>
                
                <button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className={`flex items-center space-x-2 px-3 py-2 rounded ${
                    canGoNext 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigateToTicket(currentTicket.id)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open for Editing</span>
                </button>
              </div>
            </div>

            {/* Ticket Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Ticket Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        #{currentTicket.publicId}
                      </h1>
                      {currentTicket.id === currentTicketId && (
                        <span className="px-2 py-1 bg-red-100 text-gray-800 text-xs font-medium rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl text-gray-800 mb-3">{currentTicket.title}</h2>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {currentTicket.createdByUser?.firstName} {currentTicket.createdByUser?.lastName}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatTicketDateTime(currentTicket.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTicket.status)}`}>
                      {getStatusText(currentTicket.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentTicket.priority)}`}>
                      {getPriorityText(currentTicket.priority)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Description */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Description</span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-800">
                  {currentTicket.description || 'No description provided.'}
                </div>
              </div>

              {/* Quick Navigation to Other Tickets */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Quick Jump to Other Tickets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tickets.map((ticket, index) => (
                    <button
                      key={ticket.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`text-left p-3 rounded border transition-colors ${
                        index === currentIndex
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <div className="font-medium">#{ticket.publicId}</div>
                      <div className="text-xs truncate mt-1">
                        {ticket.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-gray-600">No tickets available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergedTicketsViewer;