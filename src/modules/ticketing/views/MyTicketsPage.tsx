import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, AlertCircle, Clock, User, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { ticketsApi, Ticket, TicketCategory, TicketPriority, TicketStatus } from '../services/ticketsApi';
import { settingsApi, TicketCategoryConfig, PriorityLevel, TicketStatusConfig, Agent } from '../../../shared/services/api/settingsApi';
import { formatTicketDateTime } from '../../../shared/utils/dateUtils';
import { getCurrentUser } from '../../../shared/services/api/auth';

type CategoryReference = { id?: number; name?: string };
type PriorityReference = { id?: number; name?: string; level?: number };
type StatusReference = { id?: number; name?: string };
type AssignedAgentReference = { id?: number; userId?: string; name?: string; email?: string };

type TicketListItem = Omit<Ticket, 'category' | 'priority' | 'status'> & {
  category?: TicketCategory | CategoryReference | null;
  categoryId?: number;
  categoryName?: string;
  priority?: TicketPriority | PriorityReference | null;
  priorityId?: number;
  priorityName?: string;
  status?: TicketStatus | StatusReference | null;
  statusId?: number;
  statusName?: string;
  assignedAgent?: AssignedAgentReference;
  assignedAgentId?: string | number;
  assignedToUserId?: string | number;
  agentName?: string;
  // Merge information
  hasMergedTickets?: boolean;
  wasMergedIntoAnother?: boolean;
  mergedTicketsCount?: number;
};

const MyTicketsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Category Head state
  const [isCategoryHead, setIsCategoryHead] = useState(false);
  const [categoryHeadCategoryIds, setCategoryHeadCategoryIds] = useState<number[]>([]);
  const [categoryHeadCategoryNames, setCategoryHeadCategoryNames] = useState<string[]>([]);
  const [categoryHeadCheckComplete, setCategoryHeadCheckComplete] = useState(false);

  // Check if user is a Category Head on mount
  useEffect(() => {
    const checkCategoryHead = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('🔍 Checking category head status for user:', currentUser.id);
        const status = await settingsApi.checkIsCategoryAdmin(currentUser.id);
        console.log('🔍 Category admin check result:', status);
        setIsCategoryHead(status.isCategoryAdmin);
        setCategoryHeadCategoryIds(status.categoryIds);
        
        if (status.isCategoryAdmin && status.categoryIds.length > 0) {
          const allCategories = await settingsApi.getTicketCategories();
          const names = allCategories
            .filter(c => status.categoryIds.includes(c.id))
            .map(c => c.name);
          setCategoryHeadCategoryNames(names);
          console.log('🛡️ Category Head mode enabled for:', names.join(', '), 'IDs:', status.categoryIds);
        }
      } catch (error) {
        console.warn('Could not check category head status:', error);
      } finally {
        setCategoryHeadCheckComplete(true);
      }
    };
    checkCategoryHead();
  }, []);

  const toStringValue = (value?: string | number | null): string | undefined => {
    if (value == null) {
      return undefined;
    }
    return value.toString();
  };

  const toNumericValue = (value?: string | number | null): number | undefined => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  // Generate public ticket ID
  const getPublicTicketId = (ticket: TicketListItem): string => {
    if (ticket.publicId != null) {
      return ticket.publicId.toString();
    }

    const baseId = ticket.id?.toString() || '';
    if (!baseId) {
      return '000000';
    }

    const hash = baseId.split('').reduce((acc, char) => {
      const next = ((acc << 5) - acc) + char.charCodeAt(0);
      return next & next;
    }, 0);
    return Math.abs(hash).toString().padStart(6, '0').slice(-6);
  };

  // Fetch tickets - Category Heads see all tickets in their categories + their own, others see assigned/collaborator tickets
  const { data: tickets, isLoading, error } = useQuery<TicketListItem[]>({
    queryKey: ['my-tickets', isCategoryHead, categoryHeadCategoryIds],
    queryFn: async (): Promise<TicketListItem[]> => {
      // Both Category Heads and regular users now use the same endpoint
      // The backend /tickets/my handles the logic:
      // - Admins see all tickets
      // - Category Heads see their own tickets + tickets from their managed categories
      // - Regular users see only tickets they created or are assigned to
      console.log('📋 Fetching my tickets...', { isCategoryHead, categoryHeadCategoryIds });
      try {
        const result = await ticketsApi.getMyTickets();
        console.log('✅ Tickets loaded:', { count: result?.length, sample: result?.[0] });
        return result as TicketListItem[];
      } catch (err) {
        console.error('❌ Failed to load tickets:', err);
        throw err;
      }
    },
    // Wait for category head check to complete before running query
    enabled: categoryHeadCheckComplete,
    // Enterprise: Optimized caching strategy
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchInterval: 30000, // Refresh every 30 seconds (not 5s to reduce API load)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Fetch settings for display names - Enterprise: Cache static data longer
  const { data: categories } = useQuery<TicketCategoryConfig[]>({
    queryKey: ['ticket-categories'],
    queryFn: () => settingsApi.getTicketCategories(),
    staleTime: 5 * 60 * 1000, // Categories don't change often - cache 5 min
  });

  const { data: priorities } = useQuery<PriorityLevel[]>({
    queryKey: ['ticket-priorities'],
    queryFn: () => settingsApi.getPriorityLevels(),
    staleTime: 5 * 60 * 1000, // Priorities don't change often - cache 5 min
  });

  const { data: statuses } = useQuery<TicketStatusConfig[]>({
    queryKey: ['ticket-statuses'],
    queryFn: () => settingsApi.getTicketStatuses(),
    staleTime: 5 * 60 * 1000, // Statuses don't change often - cache 5 min
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () => settingsApi.getAgents(),
    staleTime: 2 * 60 * 1000, // Agents may change more often - cache 2 min
  });

  // Enterprise: Memoized helper functions to prevent unnecessary recalculations
  const getCategoryName = useCallback((ticket: TicketListItem) => {
    // First check for direct name from API
    if (ticket.categoryName) return ticket.categoryName;
    if (typeof ticket.category === 'object' && ticket.category?.name) return ticket.category.name;
    
    // Priority: Use categoryId for lookup from settings
    const categoryId = ticket.categoryId ?? (typeof ticket.category === 'object' ? ticket.category?.id : undefined);
    if (categoryId != null && categories?.length) {
      const category = categories.find((cat) => cat.id === categoryId);
      if (category?.name) return category.name;
    }
    
    // Fallback: Map backend enum values to category names  
    const categoryValue = typeof ticket.category === 'number' ? Number(ticket.category) : undefined;
    switch (categoryValue) {
      case 0: return 'General Inquiry';
      case 1: return 'Technical Support';
      case 2: return 'Bug Report';
      case 3: return 'Feature Request';
      default:
        return 'No Category';
    }
  }, [categories]);

  const getPriorityName = useCallback((ticket: TicketListItem) => {
    // First check for direct name from API
    if (ticket.priorityName) return ticket.priorityName;
    if (typeof ticket.priority === 'object' && ticket.priority?.name) return ticket.priority.name;
    
    // Get the priority value - this is the enum value (0-3) from backend
    // Handle both number and potential string values
    let priorityValue: number | undefined;
    if (typeof ticket.priority === 'number') {
      priorityValue = ticket.priority;
    } else if (typeof ticket.priority === 'string' && ticket.priority !== '') {
      priorityValue = parseInt(ticket.priority, 10);
      if (isNaN(priorityValue)) priorityValue = undefined;
    }
    
    const priorityId = ticket.priorityId ?? (typeof ticket.priority === 'object' ? ticket.priority?.id : undefined);
    
    // If we have a priorityId that's >= 1, try to look it up directly (database ID)
    if (priorityId != null && priorityId >= 1 && priorities?.length) {
      const priority = priorities.find((pri) => pri.id === priorityId);
      if (priority?.name) return priority.name;
    }
    
    // Map backend enum values (0-3) to priority names using hardcoded mapping
    // The backend stores: Low=0, Medium=1, High=2, Critical=3
    const enumNameMap: Record<number, string> = {
      0: 'Low',
      1: 'Medium',
      2: 'High',
      3: 'Critical'
    };
    
    // If we have a valid priority value, use the hardcoded map directly
    // This ensures correct display even before settings API loads
    if (priorityValue !== undefined && priorityValue >= 0 && priorityValue <= 3) {
      return enumNameMap[priorityValue];
    }
    
    // If priority value is still undefined, return empty or loading indicator
    return '';
  }, [priorities]);

  const getStatusName = useCallback((ticket: TicketListItem) => {
    // First check for direct name from API
    if (ticket.statusName) return ticket.statusName;
    if (typeof ticket.status === 'object' && ticket.status?.name) return ticket.status.name;
    
    // Priority: Use statusId for lookup from settings  
    const statusId = ticket.statusId ?? (typeof ticket.status === 'object' ? ticket.status?.id : undefined);
    const statusValue = typeof ticket.status === 'number' ? Number(ticket.status) : undefined;
    
    // Try settings lookup first
    if (statuses?.length) {
      const status = statuses.find((s) => s.id === (statusId ?? statusValue));
      if (status?.name) return status.name;
    }
    
    // Fallback: Map database status IDs to status names (matches TicketStatuses table)
    switch (statusValue) {
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'On Hold';
      case 4: return 'Resolved';
      case 5: return 'Closed';
      default:
        return 'Open';
    }
  }, [statuses]);

  const getAgentName = useCallback((ticket: TicketListItem) => {
    // Handle both nested object and direct ID lookup
    if (ticket.assignedAgent?.name) return ticket.assignedAgent.name;
    if (ticket.assignedAgent?.email) return ticket.assignedAgent.email;
    if (ticket.agentName) return ticket.agentName;
    
    // Check for empty/null/undefined assignedToUserId - must handle all falsy cases
    const hasAssignedUserId = ticket.assignedToUserId != null && 
                               ticket.assignedToUserId !== '' && 
                               ticket.assignedToUserId !== 'null' &&
                               ticket.assignedToUserId !== 'undefined';
    const hasAssignedAgentId = ticket.assignedAgentId != null && 
                                ticket.assignedAgentId !== '' && 
                                ticket.assignedAgentId !== 0;
    
    // If no user is assigned, return unassigned
    if (!hasAssignedUserId && !hasAssignedAgentId) return 'Unassigned';
    
    // Look up agent by userId - only if we have agents loaded
    if (!agents?.length) return 'Loading...';
    
    const agent = agents.find((a) => 
      (hasAssignedUserId && a.userId === toStringValue(ticket.assignedToUserId)) || 
      (hasAssignedAgentId && a.id === toNumericValue(ticket.assignedAgentId)) ||
      (ticket.assignedAgent?.email && a.email === ticket.assignedAgent.email)
    );
    return agent?.name || agent?.email || 'Unassigned';
  }, [agents]);

  const getStatusColor = useCallback((ticket: TicketListItem) => {
    const statusName = getStatusName(ticket)?.toLowerCase();
    switch (statusName) {
      case 'open': case 'new': return 'bg-red-100 text-gray-800';
      case 'in progress': case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'on hold': return 'bg-orange-100 text-orange-800';
      case 'waiting for user': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'reopen': return 'bg-amber-100 text-amber-800';
      default: 
        // Check if status contains waiting
        if (statusName?.includes('waiting')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    }
  }, [getStatusName]);

  const getPriorityColor = useCallback((ticket: TicketListItem) => {
    const priorityName = getPriorityName(ticket)?.toLowerCase();
    switch (priorityName) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': case 'critical': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  }, [getPriorityName]);

  // Filter tickets
  const filteredTickets = useMemo<TicketListItem[]>(() => {
    if (!tickets) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const numericStatus = typeof ticket.status === 'number' ? Number(ticket.status) : undefined;
      if (numericStatus === 99) return false;
      
      const matchesSearch = !normalizedSearch || 
        ticket.title?.toLowerCase().includes(normalizedSearch) ||
        ticket.description?.toLowerCase().includes(normalizedSearch) ||
        getPublicTicketId(ticket).includes(normalizedSearch);
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        toStringValue(ticket.categoryId) === categoryFilter ||
        (typeof ticket.category === 'number' && ticket.category.toString() === categoryFilter);
      
      // Agent filter
      const matchesAgent = agentFilter === 'all' || 
        (agentFilter === 'unassigned' && !ticket.assignedToUserId && !ticket.assignedAgentId) ||
        (ticket.assignedToUserId != null && toStringValue(ticket.assignedToUserId) === agentFilter) ||
        (ticket.assignedAgentId != null && toStringValue(ticket.assignedAgentId) === agentFilter);
      
      if (statusFilter === 'all') return matchesSearch && matchesCategory && matchesAgent;
      
      const statusName = getStatusName(ticket)?.toLowerCase() || '';
      const statusId = ticket.statusId ?? numericStatus;
      
      // More flexible status matching - handles all status types properly
      const matchesStatus = 
        (statusFilter === 'open' && (
          statusName.includes('open') || 
          statusName.includes('new') || 
          statusName.includes('pending') ||
          statusId === TicketStatus.Open
        )) ||
        (statusFilter === 'inprogress' && (
          statusName.includes('progress') || 
          statusName.includes('assigned') || 
          statusName.includes('working') ||
          statusName.includes('waiting') ||  // Include "Waiting for User" in progress
          statusName.includes('on hold') ||  // Include "On Hold" in progress
          statusId === TicketStatus.InProgress ||
          statusId === TicketStatus.OnHold  // Status ID 3 = On Hold / Waiting for User
        )) ||
        (statusFilter === 'resolved' && (
          statusName.includes('resolved') || 
          statusName.includes('completed') ||
          statusId === TicketStatus.Resolved  // Status ID 4 = Resolved
        )) ||
        (statusFilter === 'closed' && (
          statusName.includes('closed') || 
          statusName.includes('done') ||
          statusId === TicketStatus.Closed  // Status ID 5 = Closed
        ));
      
      return matchesSearch && matchesStatus && matchesCategory && matchesAgent;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter, agentFilter, getStatusName]);

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

  // Enterprise: Memoize ticket counts to prevent recalculation on every render
  const ticketCounts = useMemo(() => {
    const allTickets = tickets ?? [];
    // Filter out deleted tickets (status 99) for all counts
    const activeTickets = allTickets.filter((ticket) => {
      const statusId = getStatusIdFromTicket(ticket);
      return statusId !== 99;
    });
    const countWhere = (predicate: (ticket: TicketListItem) => boolean) =>
      activeTickets.filter(predicate).length;

    // Helper to get status ID from ticket, handling various formats
    function getStatusIdFromTicket(ticket: TicketListItem): number | undefined {
      // First try statusId (most reliable)
      if (ticket.statusId !== undefined && ticket.statusId !== null) {
        return typeof ticket.statusId === 'number' ? ticket.statusId : parseInt(String(ticket.statusId), 10);
      }
      // Try status as number (enum value)
      if (typeof ticket.status === 'number') {
        return ticket.status;
      }
      // Try status as object with id
      if (ticket.status && typeof ticket.status === 'object' && 'id' in ticket.status) {
        return (ticket.status as StatusReference).id;
      }
      // Check statusName field - map name to ID
      if (ticket.statusName) {
        const statusName = ticket.statusName.toLowerCase();
        if (statusName === 'new' || statusName === 'open') return 1;
        if (statusName === 'in progress' || statusName === 'inprogress') return 2;
        if (statusName === 'waiting for user' || statusName === 'on hold' || statusName === 'onhold') return 3;
        if (statusName === 'resolved') return 4;
        if (statusName === 'closed') return 5;
        if (statusName === '3rd party dependencies') return 6;
        if (statusName === 'reopened') return 1007;
        if (statusName === 'merged') return 1009;
      }
      return undefined;
    }

    // Status IDs: 1=New, 2=In Progress, 3=Waiting, 4=Resolved, 5=Closed, 6=3rd party, 1007=Reopened, 1009=Merged
    return {
      total: activeTickets.length,
      // Open bucket: New (1), Reopened (1007)
      open: countWhere((ticket) => {
        const statusId = getStatusIdFromTicket(ticket);
        return statusId === 1 || statusId === 1007;
      }),
      // In Progress bucket: In Progress (2), Waiting for User (3), 3rd party Dependencies (6)
      inProgress: countWhere((ticket) => {
        const statusId = getStatusIdFromTicket(ticket);
        return statusId === 2 || statusId === 3 || statusId === 6;
      }),
      // Resolved bucket: Only Resolved (4)
      resolved: countWhere((ticket) => {
        const statusId = getStatusIdFromTicket(ticket);
        return statusId === 4;
      }),
      // Closed bucket: Only Closed (5)
      closed: countWhere((ticket) => {
        const statusId = getStatusIdFromTicket(ticket);
        return statusId === 5;
      }),
      // Merged bucket: Only Merged (1009)
      merged: countWhere((ticket) => {
        const statusId = getStatusIdFromTicket(ticket);
        return statusId === 1009;
      }),
    };
  }, [tickets]);

  // Export function
  const handleExport = () => {
    if (!filteredTickets || filteredTickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const csvHeaders = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Agent', 'Created', 'Updated'];
    const csvData = filteredTickets.map(ticket => [
      getPublicTicketId(ticket),
      `"${ticket.title?.replace(/"/g, '""') || ''}"`,
      getStatusName(ticket),
      getPriorityName(ticket),
      getCategoryName(ticket),
      getAgentName(ticket),
      formatTicketDateTime(ticket.createdAt),
      formatTicketDateTime(ticket.updatedAt),
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Tickets</h3>
          <p className="text-gray-700">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm leading-snug min-h-screen bg-gray-50">
      <div className="max-w-full">
        {/* Category Head Banner */}
        {isCategoryHead && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-sm py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-800">
                Category Head View - Managing: {categoryHeadCategoryNames.join(', ')}
              </span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="bg-white shadow-sm mb-sm">
          <div className="px-sm py-sm border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold leading-tight">
                  {isCategoryHead ? 'Category Tickets' : 'My Tickets'}
                </h1>
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
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </div>
            </div>
          </div>

          {/* Ticket Summary Cards */}
          <div className="px-sm py-sm border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{ticketCounts.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{ticketCounts.open}</div>
                <div className="text-xs text-gray-600">Open</div>
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
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-900">{ticketCounts.merged}</div>
                <div className="text-xs text-purple-600">Merged</div>
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
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
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
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="all">All Categories</option>
                  {categories?.map((cat) => (
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
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="all">All Agents</option>
                  <option value="unassigned">Unassigned</option>
                  {agents?.map((agent) => (
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
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
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
                  <div className="col-span-2">Title</div>
                  <div className="col-span-1">Merged</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-2">Agent</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {currentTickets.map((ticket, index) => (
                  <div 
                    key={ticket.id} 
                    className={`px-sm py-3 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-1">
                        <span className="font-mono text-xs text-gray-600">#{getPublicTicketId(ticket)}</span>
                      </div>
                      <div className="col-span-2">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          state={{ from: '/tickets/my' }}
                          className="font-medium text-gray-600 hover:text-gray-800 hover:underline line-clamp-2"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </Link>
                      </div>
                      <div className="col-span-1 relative group">
                        {ticket.hasMergedTickets ? (
                          <div className="relative">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-indigo-800 cursor-help">
                              <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                              </svg>
                              +{ticket.mergedTicketsCount || 0}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                                <div className="font-semibold mb-1">Primary Ticket</div>
                                <div className="text-gray-300">{ticket.mergedTicketsCount || 0} ticket(s) have been merged into this one. All conversations are consolidated here.</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        ) : ticket.wasMergedIntoAnother ? (
                          <div className="relative">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 cursor-help">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                            {/* Tooltip */}
                            <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                                <div className="font-semibold mb-1">Merged Ticket</div>
                                <div className="text-gray-300">This ticket was merged into another ticket. Check the primary ticket for updates.</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">�</span>
                        )}
                      </div>
                      <div className="col-span-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${getStatusColor(ticket)}`}>
                          {getStatusName(ticket)}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs font-medium ${getPriorityColor(ticket)}`}>
                          {getPriorityName(ticket)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-900" title={getCategoryName(ticket)}>
                          {getCategoryName(ticket)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span title={new Date(ticket.createdAt).toLocaleString()}>
                            {formatTicketDateTime(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 text-xs text-gray-900">
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
                        className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className={`px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
                                pageNum === currentPage
                                  ? 'bg-red-600 text-white border-red-600'
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
                        className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
