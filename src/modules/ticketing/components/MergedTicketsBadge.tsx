import React from 'react';
import { GitMerge, ExternalLink } from 'lucide-react';

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

interface MergedTicketsBadgeProps {
  mergedInfo: MergedTicketInfo;
  onNavigateToTicket?: (ticketId: string) => void;
}

const MergedTicketsBadge: React.FC<MergedTicketsBadgeProps> = ({ mergedInfo, onNavigateToTicket }) => {
  if (!mergedInfo || (!mergedInfo.hasMergedTickets && !mergedInfo.wasMergedInto)) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Primary ticket with merged tickets */}
      {mergedInfo.hasMergedTickets && (
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-300">
          <GitMerge className="h-4 w-4" />
          <span className="font-medium">
            Primary (+{mergedInfo.mergedTickets?.length} merged)
          </span>
        </div>
      )}

      {/* Merged into another ticket */}
      {mergedInfo.wasMergedInto && (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-300">
            <GitMerge className="h-4 w-4" />
            <span className="font-medium">Merged Ticket</span>
          </div>
          <button
            onClick={() => onNavigateToTicket?.(mergedInfo.wasMergedInto!.primaryTicketId)}
            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors"
            title={`Go to primary ticket: ${mergedInfo.wasMergedInto.primaryTicketTitle}`}
          >
            <span>Go to #{mergedInfo.wasMergedInto.primaryTicketPublicId}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MergedTicketsBadge;