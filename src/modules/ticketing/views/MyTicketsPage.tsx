import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, AlertCircle, Clock, User } from 'lucide-react';
import { ticketsApi } from '../services/ticketsApi';
import { settingsApi } from '../../../shared/services/api/settingsApi';

const MyTicketsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      console.log(' Fetching tickets...');
      try {
        const result = await ticketsApi.getTickets();
        console.log(' Tickets loaded:', { count: result?.length, sample: result?.[0] });
        return result;
      } catch (err) {
        console.error(' Failed to load tickets:', err);
        throw err;
      }
    },
    refetchInterval: 30000,
  });

  // Fetch settings for display names
  const { data: categories } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => settingsApi.getTicketCategories(),
  });

  const { data: priorities } = useQuery({
    queryKey: ['ticket-priorities'],
    queryFn: () => settingsApi.getPriorityLevels(),
  });

  const { data: statuses } = useQuery({
    queryKey: ['ticket-statuses'],
    queryFn: () => settingsApi.getTicketStatuses(),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => settingsApi.getAgents(),
  });

  // Helper functions for display names
  const getCategoryName = (ticket: any) => {
    return ticket.category?.name || categories?.find((cat: any) => cat.id === ticket.categoryId)?.name || 'No Category';
  };

  const getPriorityName = (ticket: any) => {
    return ticket.priority?.name || priorities?.find((pri: any) => pri.id === ticket.priorityId)?.name || 'No Priority';
  };

  const getStatusName = (ticket: any) => {
    return ticket.status?.name || statuses?.find((status: any) => status.id === ticket.statusId)?.name || 'No Status';
  };

  const getAgentName = (ticket: any) => {
    return ticket.assignedAgent?.name || ticket.assignedAgent?.email || agents?.find((agent: any) => agent.userId === ticket.assignedToUserId)?.name || 'Unassigned';
  };

  const getStatusColor = (ticket: any) => {
    const statusName = getStatusName(ticket)?.toLowerCase();
    switch (statusName) {
      case 'open': case 'new': return 'bg-blue-100 text-blue-800';
      case 'in progress': case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (ticket: any) => {
    const priorityName = getPriorityName(ticket)?.toLowerCase();
    switch (priorityName) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket: any) => {
    const matchesSearch = !searchTerm || 
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.publicId?.toString().includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    
    const statusName = getStatusName(ticket)?.toLowerCase();
    const matchesStatus = 
      (statusFilter === 'open' && (statusName === 'open' || statusName === 'new')) ||
      (statusFilter === 'inprogress' && (statusName === 'in progress' || statusName === 'assigned')) ||
      (statusFilter === 'resolved' && statusName === 'resolved') ||
      (statusFilter === 'closed' && statusName === 'closed');
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate ticket counts for summary
  const ticketCounts = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => {
      const status = getStatusName(t)?.toLowerCase();
      return status === 'open' || status === 'new';
    }).length || 0,
    inProgress: tickets?.filter(t => {
      const status = getStatusName(t)?.toLowerCase();
      return status === 'in progress' || status === 'assigned';
    }).length || 0,
    resolved: tickets?.filter(t => getStatusName(t)?.toLowerCase() === 'resolved').length || 0,
    closed: tickets?.filter(t => getStatusName(t)?.toLowerCase() === 'closed').length || 0,
  };

  // Export function
  const handleExport = () => {
    if (!filteredTickets || filteredTickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const csvHeaders = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Agent', 'Created', 'Updated'];
    const csvData = filteredTickets.map(ticket => [
      ticket.publicId || ticket.id,
      `"${ticket.title?.replace(/"/g, '""') || ''}"`,
      getStatusName(ticket),
      getPriorityName(ticket),
      getCategoryName(ticket),
      getAgentName(ticket),
      new Date(ticket.createdAt).toLocaleDateString(),
      new Date(ticket.updatedAt).toLocaleDateString(),
    ]);

    const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="text-sm leading-snug min-h-screen bg-gray-50 p-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tickets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm leading-snug min-h-screen bg-gray-50 p-sm">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tickets</h3>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm leading-snug min-h-screen bg-gray-50 p-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-sm">
          <div className="px-sm py-sm border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold leading-tight">My Tickets</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredTickets.length} of {tickets?.length || 0} tickets
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
                <Link
                  to="/tickets/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </div>
            </div>
          </div>

          {/* Ticket Summary Cards */}
          <div className="px-sm py-sm border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{ticketCounts.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-900">{ticketCounts.open}</div>
                <div className="text-xs text-blue-600">Open</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-900">{ticketCounts.inProgress}</div>
                <div className="text-xs text-yellow-600">In Progress</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-900">{ticketCounts.resolved}</div>
                <div className="text-xs text-green-600">Resolved</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{ticketCounts.closed}</div>
                <div className="text-xs text-gray-600">Closed</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-sm py-sm">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="inprogress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No tickets found</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-sm py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Agent</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket: any, index: number) => (
                  <div 
                    key={ticket.id} 
                    className={`px-sm py-3 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-1">
                        <span className="font-mono text-xs text-gray-600">#{ticket.publicId}</span>
                      </div>
                      <div className="col-span-4">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {ticket.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket)}`}>
                          {getStatusName(ticket)}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs font-medium ${getPriorityColor(ticket)}`}>
                          {getPriorityName(ticket)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-900">{getCategoryName(ticket)}</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <User className="h-3 w-3" />
                          {getAgentName(ticket)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
