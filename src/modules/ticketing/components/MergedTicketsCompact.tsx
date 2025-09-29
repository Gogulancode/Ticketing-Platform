import React, { useState } from 'react';
import { GitMerge, ChevronDown, ChevronRight, ExternalLink, Calendar, MessageSquare, Eye } from 'lucide-react';
import MergedTicketsViewer from './MergedTicketsViewer';

interface MergedTicketInfo {
  hasMergedTickets: boolean;
  mergedTickets?: Array<{
    mergeId: string;
    mergedTicketIds: string[];
    mergeReason: string;
    mergedAt: string;
  }>;
  wasMergedInto?: {
    mergeId: string;
    primaryTicketId: string;
    primaryTicketPublicId: number;
    primaryTicketTitle: string;
    mergeReason: string;
    mergedAt: string;
  };
}

interface MergedTicketsCompactProps {
  mergedInfo: MergedTicketInfo;
  currentTicketId?: string;
  onNavigateToTicket?: (ticketId: string) => void;
}

const MergedTicketsCompact: React.FC<MergedTicketsCompactProps> = ({ 
  mergedInfo, 
  currentTicketId, 
  onNavigateToTicket 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  if (!mergedInfo || (!mergedInfo.hasMergedTickets && !mergedInfo.wasMergedInto)) {
    return null;
  }

  const hasMergedInfo = mergedInfo.hasMergedTickets || mergedInfo.wasMergedInto;
  
  // Get all ticket IDs for the viewer
  const getAllTicketIds = () => {
    const allIds: string[] = [];
    if (currentTicketId) allIds.push(currentTicketId);
    
    if (mergedInfo.hasMergedTickets) {
      mergedInfo.mergedTickets?.forEach(merge => {
        merge.mergedTicketIds.forEach(id => {
          if (!allIds.includes(id)) allIds.push(id);
        });
      });
    }
    
    return allIds;
  };
  
  return (
    <>
      <div className="bg-blue-50 border-l-4 border-blue-500">
        {/* Compact Header - Always Visible */}
        <div 
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <GitMerge className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {mergedInfo.wasMergedInto 
                ? `Merged into Ticket #${mergedInfo.wasMergedInto.primaryTicketPublicId}`
                : `Contains ${mergedInfo.mergedTickets?.length} merged ticket(s)`
              }
            </span>
            {mergedInfo.wasMergedInto && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTicket?.(mergedInfo.wasMergedInto!.primaryTicketId);
                }}
                className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              >
                View Primary
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {hasMergedInfo ? 'Merged' : 'Normal'}
            </span>
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-blue-600" /> : 
              <ChevronRight className="h-4 w-4 text-blue-600" />
            }
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-white border-t border-blue-200">
            {/* This ticket has merged other tickets */}
            {mergedInfo.hasMergedTickets && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                    <GitMerge className="h-4 w-4 mr-2 text-green-600" />
                    Primary Ticket Details
                  </h4>
                  <button
                    onClick={() => setShowViewer(true)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View All Tickets
                  </button>
                </div>
                
                <div className="space-y-3">
                  {mergedInfo.mergedTickets?.map((merge, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Merged Tickets:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {merge.mergedTicketIds.map((ticketId) => (
                              <button
                                key={ticketId}
                                onClick={() => onNavigateToTicket?.(ticketId)}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                              >
                                #{ticketId}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {new Date(merge.mergedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Reason:</span>
                          <div className="flex items-start mt-1">
                            <MessageSquare className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                            <span className="text-xs text-gray-600 leading-relaxed">
                              {merge.mergeReason || 'No reason provided'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This ticket was merged into another */}
            {mergedInfo.wasMergedInto && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">
                  ⚠️ Merged Ticket Notice
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Primary Ticket:</span>
                    <div className="mt-1">
                      <button
                        onClick={() => onNavigateToTicket?.(mergedInfo.wasMergedInto!.primaryTicketId)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        #{mergedInfo.wasMergedInto.primaryTicketPublicId}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1">
                        {mergedInfo.wasMergedInto.primaryTicketTitle}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Merge Date:</span>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {new Date(mergedInfo.wasMergedInto.mergedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="font-medium text-gray-700">Reason:</span>
                  <div className="flex items-start mt-1">
                    <MessageSquare className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      {mergedInfo.wasMergedInto.mergeReason || 'No reason provided'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-800">
                  <strong>Note:</strong> This ticket has been merged. All new updates should be made on the primary ticket.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Merged Tickets Viewer Modal */}
      <MergedTicketsViewer
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        mergedTickets={getAllTicketIds()}
        currentTicketId={currentTicketId || ''}
        onNavigateToTicket={(ticketId) => {
          setShowViewer(false);
          onNavigateToTicket?.(ticketId);
        }}
      />
    </>
  );
};

export default MergedTicketsCompact;