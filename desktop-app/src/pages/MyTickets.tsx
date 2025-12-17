import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Clock, AlertCircle, CheckCircle, XCircle, 
  Loader2, User, MessageSquare, RefreshCw, Plus, GitMerge, Pause
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Ticket {
  id: string;
  publicId: number | null;
  title: string;
  description: string;
  status: number;
  priority: number;
  category: number | null;
  categoryId: number | null;

  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  createdByName: string;
  assignedToName?: string;
}

const statusMap: Record<number, string> = {
  1: 'Open',
  2: 'In Progress',
  3: 'Pending',
  4: 'Resolved',
  5: 'Closed',
  6: 'Waiting for Third Party',
  1009: 'Merged',
};

const priorityMap: Record<number, string> = {
  0: 'Unset',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical',
};

const statusColors: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Pending': 'bg-orange-100 text-orange-700',
  'Resolved': 'bg-green-100 text-green-700',
  'Closed': 'bg-gray-100 text-gray-700',
  'Waiting for Third Party': 'bg-indigo-100 text-indigo-700',
  'Merged': 'bg-purple-100 text-purple-700',
};

const priorityColors: Record<string, string> = {
  'Unset': 'bg-gray-50 text-gray-400',
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-600',
  'Urgent': 'bg-red-100 text-red-600',
  'Critical': 'bg-red-200 text-red-700',
};

export default function MyTickets() {
  const navigate = useNavigate();
  const { serverUrl, token } = useAuthStore();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/tickets/my?pageSize=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // API returns { data: [...], pagination: {...} }
        const ticketList = Array.isArray(data) ? data : (data.data || data.items || []);
        setTickets(ticketList);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusName = (status: number) => statusMap[status] || 'Unknown';
  const getPriorityName = (priority: number) => priorityMap[priority] || 'Unknown';

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter && ticket.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const statusName = getStatusName(ticket.status);
    return (
      ticket.title.toLowerCase().includes(query) ||
      String(ticket.publicId || '').includes(query) ||
      statusName.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: number) => {
    const statusName = getStatusName(status);
    switch (statusName) {
      case 'Open': return <AlertCircle className="w-4 h-4" />;
      case 'In Progress': return <Loader2 className="w-4 h-4" />;
      case 'Pending': return <Pause className="w-4 h-4" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4" />;
      case 'Closed': return <XCircle className="w-4 h-4" />;
      case 'Waiting for Third Party': return <Clock className="w-4 h-4" />;
      case 'Merged': return <GitMerge className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Stats
  const openCount = tickets.filter(t => t.status === 1).length;
  const inProgressCount = tickets.filter(t => t.status === 2).length;
  const resolvedCount = tickets.filter(t => t.status === 4 || t.status === 5).length;
  const mergedCount = tickets.filter(t => t.status === 1009).length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">My Tickets</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadTickets}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/tickets/new')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div 
            onClick={() => setStatusFilter(statusFilter === 1 ? null : 1)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${statusFilter === 1 ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-blue-50 hover:bg-blue-100'}`}
          >
            <div className="text-2xl font-bold text-blue-700">{openCount}</div>
            <div className="text-sm text-blue-600">Open</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 2 ? null : 2)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${statusFilter === 2 ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-yellow-50 hover:bg-yellow-100'}`}
          >
            <div className="text-2xl font-bold text-yellow-700">{inProgressCount}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 4 ? null : 4)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${statusFilter === 4 ? 'bg-green-100 ring-2 ring-green-500' : 'bg-green-50 hover:bg-green-100'}`}
          >
            <div className="text-2xl font-bold text-green-700">{resolvedCount}</div>
            <div className="text-sm text-green-600">Resolved/Closed</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 1009 ? null : 1009)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${statusFilter === 1009 ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-purple-50 hover:bg-purple-100'}`}
          >
            <div className="text-2xl font-bold text-purple-700">{mergedCount}</div>
            <div className="text-sm text-purple-600">Merged</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter(null)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter ? 'Try a different search or filter' : 'Create your first ticket to get started'}
            </p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const statusName = getStatusName(ticket.status);
              const priorityName = getPriorityName(ticket.priority);
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-red-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          #{ticket.publicId}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[statusName] || 'bg-gray-100 text-gray-700'}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="text-[10px] text-gray-400 mr-0.5">Status:</span>
                          {statusName}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[priorityName] || 'bg-gray-100 text-gray-600'}`}>
                          <span className="text-[10px] text-gray-400">Priority:</span>
                          {priorityName}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-gray-400 ml-4" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      {ticket.assignedToName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Assigned: {ticket.assignedToName}</span>
                        </div>
                      )}
                    </div>
                    <span>
                      {ticket.createdAt ? format(parseISO(ticket.createdAt), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
