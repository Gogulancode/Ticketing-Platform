import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Search, GitMerge, Check, Calendar, User, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../../../../utils/apiFetch';

interface Ticket {
  id: string;
  publicId: number;
  title: string;
  status: number;
  priority: number;
  createdAt: string;
  createdByName: string;
  category?: number;
  categoryId?: number;
}

interface MergeModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
}

const MergeModal: React.FC<MergeModalProps> = ({ ticket, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [mergeReason, setMergeReason] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all tickets initially (for browsing)
  const { data: allTickets = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-tickets-for-merge', ticket?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/tickets-v2`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const results = await response.json();
      
      // Exclude current ticket and deleted tickets
      return results.filter((t: Ticket) => 
        t.id !== ticket?.id && t.status !== 99
      );
    },
    enabled: isOpen,
  });

  // Search tickets API call
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['ticket-search', debouncedSearch, ticket?.id],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return allTickets; // Return all if no search
      
      const token = localStorage.getItem('token');
      const response = await apiFetch(
        `/api/tickets-v2/search?query=${encodeURIComponent(debouncedSearch)}&excludeTicketId=${ticket?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to search tickets');
      const results = await response.json();
      
      // Exclude deleted tickets
      return results.filter((t: Ticket) => t.status !== 99);
    },
    enabled: isOpen,
  });

  // Merge tickets mutation
  const mergeMutation = useMutation({
    mutationFn: async (data: { ticketIds: string[]; reason: string }) => {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/tickets-v2/${ticket.id}/merge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          TicketIds: data.ticketIds,
          Reason: data.reason
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to merge tickets');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const mergedCount = selectedTickets.size;
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticket.id] });
      setSelectedTickets(new Set());
      setMergeReason('');
      setSearchQuery('');
      toast.dismiss(); // Dismiss loading toast
      toast.success(`Successfully merged ${mergedCount} ticket(s) into this ticket`);
      onClose();
    },
    onError: (error: Error) => {
      console.error('Failed to merge tickets:', error);
      toast.dismiss(); // Dismiss loading toast
      toast.error(`Failed to merge tickets: ${error.message}`);
    }
  });

  const handleTicketSelect = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleMerge = () => {
    if (selectedTickets.size === 0) return;
    if (!mergeReason.trim()) return;

    toast.loading('Merging tickets...');
    const ticketIds = [ticket.id, ...Array.from(selectedTickets)];
    mergeMutation.mutate({
      ticketIds,
      reason: mergeReason.trim()
    });
  };

  const getPriorityName = (priority: number) => {
    const priorities = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return priorities[priority as keyof typeof priorities] || 'Unknown';
  };

  const getStatusName = (status: number) => {
    const statuses = { 1: 'Open', 2: 'In Progress', 3: 'Resolved', 4: 'Closed' };
    return statuses[status as keyof typeof statuses] || 'Unknown';
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'text-green-600 bg-green-100',
      2: 'text-yellow-600 bg-yellow-100', 
      3: 'text-orange-600 bg-orange-100',
      4: 'text-red-600 bg-red-100'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <GitMerge className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Merge Tickets into #{ticket?.publicId}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Search and select tickets to merge. All selected tickets will be closed and merged into this ticket.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticket number (e.g., #123456) or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery ? 'Searching tickets...' : 'Loading tickets...'}
                </p>
              </div>
            )}

            {!isSearching && searchResults.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No tickets found matching your search.' : 'No tickets available to merge.'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? 'Try a different search term.' : 'All tickets are excluded or deleted.'}
                </p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {searchQuery 
                    ? `Found ${searchResults.length} ticket(s) matching "${searchQuery}".` 
                    : `Showing ${searchResults.length} available ticket(s).`
                  } Select tickets to merge:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((searchTicket: Ticket) => (
                    <div
                      key={searchTicket.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTickets.has(searchTicket.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTicketSelect(searchTicket.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">#{searchTicket.publicId}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(searchTicket.priority)}`}>
                              {getPriorityName(searchTicket.priority)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              {getStatusName(searchTicket.status)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {searchTicket.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(searchTicket.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {searchTicket.createdByName}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {selectedTickets.has(searchTicket.id) && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Tickets Summary */}
          {selectedTickets.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Selected {selectedTickets.size} ticket(s) for merge
              </h3>
              <p className="text-sm text-blue-700">
                These tickets will be closed and all their comments and attachments will be moved to this ticket.
              </p>
            </div>
          )}

          {/* Merge Reason */}
          {selectedTickets.size > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merge Reason *
              </label>
              <textarea
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                placeholder="Explain why these tickets are being merged..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedTickets.size > 0 ? (
              `${selectedTickets.size} ticket(s) selected`
            ) : (
              'Search and select tickets to merge'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={selectedTickets.size === 0 || !mergeReason.trim() || mergeMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {mergeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className="h-4 w-4" />
                  Merge {selectedTickets.size > 0 ? selectedTickets.size : ''} Ticket{selectedTickets.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeModal;