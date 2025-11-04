import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Forward, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { mockApiService } from '../../../../../shared/services/mockApiService';

interface ForwardHistoryProps {
  ticketId: string;
}

const ForwardHistoryComponent: React.FC<ForwardHistoryProps> = ({ ticketId }) => {
  // Query to fetch forward history
  const { data: forwardHistory, isLoading } = useQuery({
    queryKey: ['forward-history', ticketId],
    queryFn: () => mockApiService.getForwardHistory(ticketId),
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sent':
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'acknowledged':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'sent':
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!forwardHistory || forwardHistory.length === 0) {
    return null; // Don't show anything if no forwards
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Forward className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Forward History</h3>
        <span className="text-xs text-gray-500">({forwardHistory.length} forwards)</span>
      </div>

      <div className="space-y-3">
        {forwardHistory.map((forward: any) => (
          <div key={forward.id} className={`p-3 rounded-lg border ${getStatusColor(forward.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(forward.status)}
                  <span className="text-sm font-medium">
                    Forwarded to: {forward.forwardedTo}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {forward.forwardType}
                  </span>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(forward.createdAt)} by {forward.forwardedBy}
                </div>
                {forward.message && (
                  <div className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                    <strong>Message:</strong> {forward.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForwardHistoryComponent;