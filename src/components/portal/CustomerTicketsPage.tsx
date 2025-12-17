import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Ticket, 
  Clock, 
  MessageSquare,
  Filter,
  Search,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useCustomerTickets, useCustomerTicketSummary } from '../../api/customerPortalApi';

const CustomerTicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || undefined;
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: summary, isLoading: loadingSummary } = useCustomerTicketSummary();
  const { data: tickets, isLoading: loadingTickets } = useCustomerTickets(page, 10, status);

  const statusFilters = [
    { value: '', label: 'All Tickets', color: 'gray' },
    { value: 'open', label: 'Open', color: 'blue' },
    { value: 'in progress', label: 'In Progress', color: 'yellow' },
    { value: 'pending', label: 'Pending', color: 'orange' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' },
  ];

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const getStatusColor = (statusName: string) => {
    const lower = statusName.toLowerCase();
    if (['open', 'new'].includes(lower)) return 'bg-red-100 text-gray-700';
    if (lower.includes('progress')) return 'bg-yellow-100 text-yellow-700';
    if (['pending', 'waiting', 'on hold'].includes(lower)) return 'bg-orange-100 text-orange-700';
    if (['resolved', 'completed'].includes(lower)) return 'bg-green-100 text-green-700';
    if (lower === 'closed') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const lower = priority.toLowerCase();
    if (lower === 'high' || lower === 'urgent') return 'text-gray-600';
    if (lower === 'medium' || lower === 'normal') return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Filter tickets by search query
  const filteredTickets = React.useMemo(() => {
    if (!tickets || !searchQuery.trim()) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.status.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-7 w-7 text-gray-600" />
            My Tickets
          </h1>
          <p className="text-gray-600 mt-1">Track and manage your support requests</p>
        </div>
        <Link
          to="/portal/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Total"
            value={summary.totalTickets}
            color="gray"
          />
          <SummaryCard
            label="Open"
            value={summary.openTickets}
            color="blue"
          />
          <SummaryCard
            label="Pending"
            value={summary.pendingTickets}
            color="orange"
          />
          <SummaryCard
            label="Resolved"
            value={summary.resolvedTickets}
            color="green"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loadingTickets ? (
          <div className="p-8 text-center">
            <Loader className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        ) : filteredTickets && filteredTickets.length > 0 ? (
          <div className="divide-y">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/portal/tickets/${ticket.id}`}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority} Priority
                    </span>
                    {ticket.hasUnreadUpdates && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <AlertCircle className="h-3 w-3" />
                        New update
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {ticket.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {ticket.commentCount} comment{ticket.commentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 mt-2" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {status ? `No ${status} tickets found` : 'No tickets yet'}
            </p>
            {!status && (
              <Link
                to="/portal/tickets/new"
                className="text-gray-600 hover:underline text-sm"
              >
                Create your first ticket
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTickets && filteredTickets.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {page}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(Math.max(1, page - 1)));
                setSearchParams(params);
              }}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(page + 1));
                setSearchParams(params);
              }}
              disabled={filteredTickets.length < 10}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'orange' | 'green';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-700',
    blue: 'bg-red-50 text-gray-700',
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
  };

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default CustomerTicketsPage;
