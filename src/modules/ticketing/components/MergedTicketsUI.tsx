import React from 'react';
import { GitMerge, ExternalLink, Calendar, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';

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

interface MergedTicketsUIProps {
  mergedInfo: MergedTicketInfo;
  onNavigateToTicket?: (ticketId: string) => void;
}

const MergedTicketsUI: React.FC<MergedTicketsUIProps> = ({ mergedInfo, onNavigateToTicket }) => {
  if (!mergedInfo || (!mergedInfo.hasMergedTickets && !mergedInfo.wasMergedInto)) {
    return null;
  }

  return (
    <div className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 mx-6 my-4 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <GitMerge className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Ticket Merge Information</h3>
        </div>

        {/* This ticket has merged other tickets */}
        {mergedInfo.hasMergedTickets && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <ArrowLeft className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800 bg-green-100 px-3 py-1 rounded-full">
                Primary Ticket - Contains {mergedInfo.mergedTickets?.length} merged ticket(s)
              </span>
            </div>
            
            <div className="space-y-3">
              {mergedInfo.mergedTickets?.map((merge, index) => (
                <div key={index} className="bg-white border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <GitMerge className="h-4 w-4 text-green-600 mr-2" />
                        <span className="font-medium text-gray-900">Merge #{index + 1}</span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          ID: {merge.mergeId.slice(0, 8)}...
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Merged Tickets
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {merge.mergedTicketIds.map((ticketId) => (
                              <button
                                key={ticketId}
                                onClick={() => onNavigateToTicket?.(ticketId)}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full hover:bg-blue-200 transition-colors"
                              >
                                #{ticketId}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Merge Date
                          </label>
                          <div className="mt-1 flex items-center text-sm text-gray-700">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(merge.mergedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Merge Reason
                        </label>
                        <div className="mt-1 flex items-start">
                          <MessageSquare className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {merge.mergeReason || 'No reason provided'}
                          </p>
                        </div>
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ArrowRight className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
                Merged Ticket - This ticket is now part of another
              </span>
            </div>
            
            <div className="bg-white border border-orange-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Primary Ticket
                  </label>
                  <div className="mt-1">
                    <button
                      onClick={() => onNavigateToTicket?.(mergedInfo.wasMergedInto!.primaryTicketId)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      #{mergedInfo.wasMergedInto.primaryTicketPublicId}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </button>
                    <p className="mt-2 text-sm text-gray-700 font-medium">
                      {mergedInfo.wasMergedInto.primaryTicketTitle}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Merge Date
                  </label>
                  <div className="mt-1 flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(mergedInfo.wasMergedInto.mergedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Merge Reason
                </label>
                <div className="mt-1 flex items-start">
                  <MessageSquare className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {mergedInfo.wasMergedInto.mergeReason || 'No reason provided'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> This ticket has been merged into the primary ticket above. 
                All new updates and communications should be directed to the primary ticket.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergedTicketsUI;