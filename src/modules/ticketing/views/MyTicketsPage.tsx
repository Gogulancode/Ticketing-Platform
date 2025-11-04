import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, AlertCircle, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { ticketsApi } from '../services/ticketsApi';
import { settingsApi } from '../../../shared/services/api/settingsApi';

// IST Date formatting utility
const formatDateIST = (dateString: string, includeTime: boolean = false) => {
  try {
    console.log('📅 formatDateIST input:', dateString, 'Type:', typeof dateString);
    const date = new Date(dateString);
    console.log('📅 Parsed Date object:', date, 'IsValid:', !isNaN(date.getTime()));
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    
    const formatted = date.toLocaleString('en-IN', options);
    console.log('📅 Formatted result:', formatted);
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error, 'Input was:', dateString);
    return 'Invalid date';
  }
};

const MyTicketsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Generate public ticket ID
  const getPublicTicketId = (ticket: any) => {
    if (ticket.publicId) return ticket.publicId;
    // Generate a consistent 6-digit public ID from ticket ID
    const hash = ticket.id.toString().split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString().padStart(6, '0').slice(-6);
  };

  // Fetch tickets (includes assigned tickets AND tickets where user is a collaborator)
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      console.log('🎫 Fetching my tickets (assigned + collaborator)...');
      try {
        const result = await ticketsApi.getMyTickets();
        console.log('✅ My tickets loaded:', { count: result?.length, sample: result?.[0] });
        return result;
      } catch (err) {
        console.error('❌ Failed to load my tickets:', err);
        throw err;
      }
    },
    refetchInterval: 15000, // More frequent refresh to get updates
    staleTime: 0, // Always refetch to get latest data
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
    // Handle both nested object and direct ID lookup
    if (ticket.category?.name) return ticket.category.name;
    if (ticket.categoryName) return ticket.categoryName;
    
    // Map backend enum values to category names  
    switch (ticket.category) {
      case 0: return 'General Inquiry';
      case 1: return 'Technical Support';
      case 2: return 'Bug Report';
      case 3: return 'Feature Request';
      default:
        // Fallback to settings lookup
        const category = categories?.find((cat: any) => 
          cat.id === ticket.categoryId || cat.id === ticket.category
        );
        return category?.name || 'No Category';
    }
  };

  const getPriorityName = (ticket: any) => {
    // Handle both nested object and direct ID lookup
    if (ticket.priority?.name) return ticket.priority.name;
    if (ticket.priorityName) return ticket.priorityName;
    
    // Map backend enum values to priority names
    switch (ticket.priority) {
      case 0: return 'Low';
      case 1: return 'Medium'; 
      case 2: return 'High';
      case 3: return 'Critical';
      default:
        // Fallback to settings lookup
        const priority = priorities?.find((pri: any) => 
          pri.id === ticket.priorityId || pri.id === ticket.priority || pri.level === ticket.priority
        );
        return priority?.name || 'No Priority';
    }
  };

  const getStatusName = (ticket: any) => {
    // Handle both nested object and direct ID lookup
    if (ticket.status?.name) return ticket.status.name;
    if (ticket.statusName) return ticket.statusName;
    
    // Map backend enum values to status names
    switch (ticket.status) {
      case 0: return 'New';
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'Resolved';
      case 4: return 'Closed';
      default:
        // Fallback to settings lookup
        const status = statuses?.find((s: any) => 
          s.id === ticket.statusId || s.id === ticket.status
        );
        return status?.name || 'No Status';
    }
  };

  const getAgentName = (ticket: any) => {
    // Handle both nested object and direct ID lookup
    if (ticket.assignedAgent?.name) return ticket.assignedAgent.name;
    if (ticket.assignedAgent?.email) return ticket.assignedAgent.email;
    if (ticket.agentName) return ticket.agentName;
    
    // If no user is assigned, return unassigned
    if (!ticket.assignedToUserId) return 'Unassigned';
    
    // Look up agent by userId
    const agent = agents?.find((a: any) => 
      a.userId === ticket.assignedToUserId || 
      a.id === ticket.assignedAgentId ||
      a.email === ticket.assignedAgent?.email
    );
    return agent?.name || agent?.email || 'Unassigned';
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
  const filteredTickets = useMemo(() => {
    const filtered = tickets?.filter((ticket: any) => {
      // Exclude deleted tickets (status 99)
      if (ticket.status === 99) return false;
      
      const matchesSearch = !searchTerm || 
        ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPublicTicketId(ticket).includes(searchTerm);
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        ticket.categoryId?.toString() === categoryFilter ||
        ticket.category?.toString() === categoryFilter;
      
      // Agent filter
      const matchesAgent = agentFilter === 'all' || 
        (agentFilter === 'unassigned' && !ticket.assignedToUserId && !ticket.assignedAgentId) ||
        ticket.assignedToUserId?.toString() === agentFilter ||
        ticket.assignedAgentId?.toString() === agentFilter;
      
      if (statusFilter === 'all') return matchesSearch && matchesCategory && matchesAgent;
      
      const statusName = getStatusName(ticket)?.toLowerCase() || '';
      const statusId = ticket.statusId || ticket.status;
      
      // More flexible status matching
      const matchesStatus = 
        (statusFilter === 'open' && (
          statusName.includes('open') || 
          statusName.includes('new') || 
          statusName.includes('pending') ||
          statusId === 1
        )) ||
        (statusFilter === 'inprogress' && (
          statusName.includes('progress') || 
          statusName.includes('assigned') || 
          statusName.includes('working') ||
          statusId === 2
        )) ||
        (statusFilter === 'resolved' && (
          statusName.includes('resolved') || 
          statusName.includes('completed') ||
          statusId === 3
        )) ||
        (statusFilter === 'closed' && (
          statusName.includes('closed') || 
          statusName.includes('done') ||
          statusId === 4
        ));
      
      return matchesSearch && matchesStatus && matchesCategory && matchesAgent;
    }) || [];

    return filtered;
  }, [tickets, searchTerm, statusFilter, categoryFilter, agentFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, agentFilter]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

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
      formatDateIST(ticket.createdAt, true),
      formatDateIST(ticket.updatedAt, true),
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
    <div className="text-sm leading-snug min-h-screen bg-gray-50">
      <div className="max-w-full">
        {/* Header */}
        <div className="bg-white shadow-sm mb-sm">
          <div className="px-sm py-sm border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold leading-tight">My Tickets</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length} tickets
                  {tickets?.length !== filteredTickets.length && ` (${tickets?.length} total)`}
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
            <div className="flex flex-wrap gap-4 items-center">
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
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Agents</option>
                  <option value="unassigned">Unassigned</option>
                  {agents?.map((agent: any) => (
                    <option key={agent.userId || agent.id} value={(agent.userId || agent.id)?.toString()}>
                      {agent.name || agent.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
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
                {currentTickets.map((ticket: any, index: number) => (
                  <div 
                    key={ticket.id} 
                    className={`px-sm py-3 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-1">
                        <span className="font-mono text-xs text-gray-600">#{getPublicTicketId(ticket)}</span>
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
                          {formatDateIST(ticket.createdAt, true)}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white border-t border-gray-200 px-sm py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
