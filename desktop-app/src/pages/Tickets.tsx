import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, Clock, AlertCircle,
  CheckCircle, XCircle, Loader2, User, MessageSquare,
  Send, ArrowLeft, RefreshCw, Paperclip, RotateCcw,
  Forward, Download, X, Mail
} from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { actionEventBus } from '../App';

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
  createdByName?: string;
  createdByUser?: { id: string; firstName: string; lastName: string; email: string };
  assignedToName?: string;
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  createdByName: string;
  isInternal: boolean;
  attachments?: { id: number; fileName: string; fileSize: number }[];
}

// Status mapping (from API integers)
const statusMap: Record<number, string> = {
  1: 'Open',
  2: 'In Progress',
  3: 'Pending',
  4: 'Resolved',
  5: 'Closed',
};

// Priority mapping (from API integers - matches backend TicketPriority enum)
const priorityMap: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Critical',
};

const statusColors: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Pending': 'bg-orange-100 text-orange-700',
  'Resolved': 'bg-green-100 text-green-700',
  'Closed': 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-600',
  'Critical': 'bg-red-100 text-red-600',
};

export default function Tickets() {
  const { serverUrl, token } = useAuthStore();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
    
    // Listen for tray action to open new ticket modal
    const unsubscribe = actionEventBus.subscribe((action) => {
      if (action === 'new-ticket') {
        setShowNewTicket(true);
      }
    });
    
    return () => { unsubscribe(); };
  }, []);

  const loadTickets = async () => {
    try {
      // Use my-tickets endpoint to show only user's own tickets
      const response = await fetch(`${serverUrl}/api/tickets/my?pageSize=500`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      case 'Open':
        return <AlertCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Loader2 className="w-4 h-4" />;
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleTicketUpdated = () => {
    loadTickets();
    if (selectedTicket) {
      // Refresh the selected ticket
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    }
  };

  // Show ticket detail view
  if (selectedTicket) {
    return (
      <TicketDetailView
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onUpdated={handleTicketUpdated}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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
              onClick={() => setShowNewTicket(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first ticket to get started'}
            </p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          #{ticket.publicId}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[statusName] || 'bg-gray-100 text-gray-700'}`}>
                          {getStatusIcon(ticket.status)}
                          {statusName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[priorityName] || 'bg-gray-100 text-gray-600'}`}>
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
                      {(ticket.createdByUser || ticket.createdByName) && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>
                            {ticket.createdByUser 
                              ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`.trim() || ticket.createdByUser.email
                              : ticket.createdByName}
                          </span>
                        </div>
                      )}
                      {(ticket.assignedToUser || ticket.assignedToName) && (
                        <div className="flex items-center gap-1 text-primary-600">
                          <User className="w-3 h-3" />
                          <span>
                            Assigned: {ticket.assignedToUser 
                              ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`.trim() || ticket.assignedToUser.email
                              : ticket.assignedToName}
                          </span>
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

      {/* New Ticket Modal */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onCreated={() => {
            setShowNewTicket(false);
            loadTickets();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Ticket Detail View Component
// ============================================

interface TicketDetailViewProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdated: () => void;
}

function TicketDetailView({ ticket, onBack, onUpdated }: TicketDetailViewProps) {
  const { serverUrl, token } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState<Ticket>(ticket);
  
  // Comment attachments
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Forward modal state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  const statusName = statusMap[ticketData.status] || 'Unknown';
  const priorityName = priorityMap[ticketData.priority] || 'Unknown';

  // Check if ticket can be reopened (only for closed tickets, within 48 hours)
  const canReopen = () => {
    // Only allow reopen for Closed status (5)
    if (ticketData.status !== 5) return false;
    if (!ticketData.closedAt && !ticketData.updatedAt) return false;
    
    const closedDate = ticketData.closedAt 
      ? parseISO(ticketData.closedAt) 
      : parseISO(ticketData.updatedAt!);
    const hoursSinceClosure = differenceInHours(new Date(), closedDate);
    return hoursSinceClosure <= 48;
  };

  const hoursRemaining = () => {
    if (!ticketData.closedAt && !ticketData.updatedAt) return 0;
    const closedDate = ticketData.closedAt 
      ? parseISO(ticketData.closedAt) 
      : parseISO(ticketData.updatedAt!);
    return Math.max(0, 48 - differenceInHours(new Date(), closedDate));
  };

  useEffect(() => {
    loadTicketDetails();
    loadComments();
  }, [ticket.id]);

  const loadTicketDetails = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/tickets-v2/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTicketData(data);
      }
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/tickets-v2/${ticket.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : data.items || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // Use FormData to support file attachments
      const formData = new FormData();
      formData.append('content', newComment.trim());
      formData.append('isInternal', 'false');
      
      // Add attachments
      commentAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${serverUrl}/api/tickets-v2/${ticket.id}/comments-with-attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setNewComment('');
        setCommentAttachments([]);
        loadComments();
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file selection for comment attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    
    if (commentAttachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    
    setCommentAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Forward ticket to email
  const handleForward = async () => {
    if (!forwardEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsForwarding(true);
    try {
      const formData = new FormData();
      formData.append('recipientEmail', forwardEmail.trim());
      formData.append('forwardMessage', forwardMessage.trim());

      const response = await fetch(`${serverUrl}/api/tickets-v2/${ticket.id}/forward-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Ticket forwarded successfully!');
        setShowForwardModal(false);
        setForwardEmail('');
        setForwardMessage('');
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || 'Failed to forward ticket');
      }
    } catch (error) {
      toast.error('Failed to forward ticket');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!canReopen()) {
      toast.error('This ticket can no longer be reopened');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${serverUrl}/api/tickets-v2/${ticket.id}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: 'Reopened from desktop application',
        }),
      });

      if (response.ok) {
        toast.success('Ticket reopened successfully');
        loadTicketDetails();
        onUpdated();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reopen ticket');
      }
    } catch (error) {
      toast.error('Failed to reopen ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-gray-500">#{ticketData.publicId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[statusName]}`}>
                {statusName}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[priorityName]}`}>
                {priorityName}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{ticketData.title}</h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Forward Button */}
            <button
              onClick={() => setShowForwardModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Forward ticket"
            >
              <Forward className="w-4 h-4" />
              Forward
            </button>
            
            {/* Reopen Button - only for closed tickets */}
            {canReopen() && (
              <button
                onClick={handleReopenTicket}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reopen ({hoursRemaining()}h left)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Ticket Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
          <p className="text-gray-900 whitespace-pre-wrap">{ticketData.description}</p>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Created by {
                ticketData.createdByUser 
                  ? `${ticketData.createdByUser.firstName} ${ticketData.createdByUser.lastName}`.trim() || ticketData.createdByUser.email
                  : ticketData.createdByName || 'Unknown'
              }</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{ticketData.createdAt ? format(parseISO(ticketData.createdAt), 'MMM d, yyyy h:mm a') : ''}</span>
            </div>
            {(ticketData.assignedToName || ticketData.assignedToUser) && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Assigned to {
                  ticketData.assignedToUser 
                    ? `${ticketData.assignedToUser.firstName} ${ticketData.assignedToUser.lastName}`.trim() || ticketData.assignedToUser.email
                    : ticketData.assignedToName
                }</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </h2>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No comments yet</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.createdByName}</span>
                        <span className="text-sm text-gray-500">
                          {comment.createdAt ? format(parseISO(comment.createdAt), 'MMM d, h:mm a') : ''}
                        </span>
                        {comment.isInternal && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={`${serverUrl}/api/attachments/${att.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{att.fileName}</span>
                              <Download className="w-3 h-3 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          {(ticketData.status !== 5) && ( // Don't allow comments on closed tickets
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-200">
              {/* Attachment preview */}
              {commentAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {commentAttachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 px-2 py-1 bg-primary-50 border border-primary-200 rounded-lg">
                      <Paperclip className="w-3 h-3 text-primary-600" />
                      <span className="text-sm text-primary-700">{file.name}</span>
                      <span className="text-xs text-primary-500">({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-0.5 text-primary-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2 self-end">
                  {/* Attachment button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {ticketData.status === 5 && canReopen() && (
            <div className="p-4 border-t border-gray-200 bg-amber-50">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This ticket is closed. You can reopen it within {hoursRemaining()} hours.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Forward className="w-5 h-5" />
                Forward Ticket
              </h2>
              <button
                onClick={() => setShowForwardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={forwardEmail}
                    onChange={(e) => setForwardEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={forwardMessage}
                  onChange={(e) => setForwardMessage(e.target.value)}
                  placeholder="Add a message for the recipient..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ticket:</span> #{ticketData.publicId} - {ticketData.title}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={isForwarding || !forwardEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isForwarding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Forward className="w-4 h-4" />
                )}
                {isForwarding ? 'Forwarding...' : 'Forward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Types for Settings Data
// ============================================

interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  order?: number;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
  isActive: boolean;
  order?: number;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

interface PriorityLevel {
  id: number;
  name: string;
  level: number;
  color: string;
  isActive: boolean;
}

interface QuickTemplate {
  id: number;
  label: string;
  titleTemplate: string;
  descriptionTemplate: string;
  category: string;
  categoryId?: number;
  priority: number;
  iconName: string;
  isActive: boolean;
}

interface CustomField {
  id: number;
  label: string;
  type: string;
  isRequired: boolean;
  placeholder?: string;
  options?: string[];
  displayOrder?: number;
  isActive?: boolean;
}

// ============================================
// New Ticket Modal Component (Full Featured)
// ============================================

interface NewTicketModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewTicketModal({ onClose, onCreated }: NewTicketModalProps) {
  const { serverUrl, token } = useAuthStore();
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState(2); // Medium = 2
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number | string[]>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Settings data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<SubCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings data on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const catIdNum = parseInt(categoryId);
      const filtered = subcategories.filter(s => s.categoryId === catIdNum && s.isActive !== false);
      setFilteredSubcategories(filtered);
      // Reset subcategory if current one is not valid
      if (subcategoryId && !filtered.some(s => s.id === parseInt(subcategoryId))) {
        setSubcategoryId('');
      }
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId('');
    }
  }, [categoryId, subcategories]);

  // Load custom fields when category and subcategory are selected
  useEffect(() => {
    if (categoryId && subcategoryId) {
      loadCustomFields(parseInt(categoryId), parseInt(subcategoryId));
    } else {
      setCustomFields([]);
      setCustomFieldValues({});
    }
  }, [categoryId, subcategoryId]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [catRes, subRes, deptRes, prioRes, templatesRes] = await Promise.all([
        fetch(`${serverUrl}/api/tickets/settings/categories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/subcategories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/departments`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/priorities`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/quick-templates`, { headers }),
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories((data || []).filter((c: Category) => c.isActive !== false));
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubcategories((data || []).filter((s: SubCategory) => s.isActive !== false));
      }
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments((data || []).filter((d: Department) => d.isActive !== false));
      }
      if (prioRes.ok) {
        const data = await prioRes.json();
        const activePriorities = (data || []).filter((p: PriorityLevel) => p.isActive !== false);
        setPriorities(activePriorities.sort((a: PriorityLevel, b: PriorityLevel) => a.level - b.level));
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setQuickTemplates((data || []).filter((t: QuickTemplate) => t.isActive !== false));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadCustomFields = async (catId: number, subId: number) => {
    try {
      const response = await fetch(
        `${serverUrl}/api/tickets/settings/custom-fields?categoryId=${catId}&subcategoryId=${subId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const activeFields = (data || [])
          .filter((f: CustomField) => f.isActive !== false)
          .sort((a: CustomField, b: CustomField) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCustomFields(activeFields);
      }
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    }
  };

  const handleQuickTemplate = (template: QuickTemplate) => {
    setTitle(template.titleTemplate);
    setDescription(template.descriptionTemplate);
    setPriority(template.priority);
    if (template.categoryId) {
      setCategoryId(template.categoryId.toString());
    }
  };

  const handleEnhanceDescription = async () => {
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please write at least 10 characters before enhancing');
      return;
    }

    setIsEnhancingDescription(true);
    try {
      const response = await fetch(`${serverUrl}/api/ai/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: description,
          context: 'ticket description',
          tone: 'professional',
          fixGrammar: true,
          improveClarity: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.enhancedText) {
          setDescription(result.enhancedText);
          toast.success('✨ Description enhanced!');
        }
      }
    } catch (err) {
      console.error('Failed to enhance description:', err);
      toast.error('Failed to enhance description');
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversized = newFiles.filter(f => f.size > maxSize);

    if (oversized.length > 0) {
      toast.error(`Files too large (max 10MB): ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    if (attachments.length + newFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setAttachments(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCustomFieldChange = (fieldId: number, value: string | number | string[]) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId.toString()]: value
    }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id.toString()];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      case 'date':
      case 'datetime':
        return (
          <input
            type={field.type === 'datetime' ? 'datetime-local' : 'date'}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      case 'select':
        return (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select an option</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxValues.includes(opt)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkboxValues, opt]
                      : checkboxValues.filter(v => v !== opt);
                    handleCustomFieldChange(field.id, newValues);
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  required={field.isRequired}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please fill in title and description');
      return;
    }

    if (!categoryId || !subcategoryId || !departmentId) {
      setError('Please select category, subcategory, and department');
      return;
    }

    // Validate required custom fields
    const requiredFields = customFields.filter(f => f.isRequired);
    const missingFields = requiredFields.filter(f => {
      const value = customFieldValues[f.id.toString()];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      setError(`Please fill required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert attachments to Base64
      const attachmentPromises = attachments.map(async (file) => {
        return new Promise<{ fileName: string; contentType: string; base64Content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:...;base64, prefix
            resolve({
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              base64Content: base64,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const attachmentData = await Promise.all(attachmentPromises);

      // Send JSON request (API expects [FromBody] JSON)
      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        category: 0, // General category enum
        categoryId: parseInt(categoryId),
        subcategoryId: parseInt(subcategoryId),
        departmentId: parseInt(departmentId),
        customFieldValues: customFieldValues,
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      };

      const response = await fetch(`${serverUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success('Ticket created successfully!');
        onCreated();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `Failed to create ticket (${response.status})`);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form progress
  const formProgress = (() => {
    const requiredFields = ['title', 'description', 'categoryId', 'subcategoryId', 'departmentId'];
    const values = { title, description, categoryId, subcategoryId, departmentId };
    const completed = requiredFields.filter(f => (values as Record<string, string>)[f]?.trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  })();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create New Ticket</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${formProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{formProgress}%</span>
              {formProgress === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Quick Templates */}
              {quickTemplates.length > 0 && (
                <div className="bg-primary-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Templates</h3>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.slice(0, 4).map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleQuickTemplate(template)}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  autoFocus
                />
              </div>

              {/* Description with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhanceDescription}
                    disabled={isEnhancingDescription || description.trim().length < 10}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnhancingDescription ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>✨</span>
                    )}
                    AI Enhance
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about your issue..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  required
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    disabled={!categoryId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select subcategory</option>
                    {filteredSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  {priorities.length > 0 ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {priorities.map(p => (
                        <option key={p.id} value={p.level}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                      <option value={4}>Critical</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h3>
                  <div className="space-y-4">
                    {customFields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                        </label>
                        {renderCustomField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" />
                    Add Files
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </label>
                  <span className="text-xs text-gray-500">Max 5 files, 10MB each</span>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">{formatFileSize(file.size)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as React.MouseEventHandler}
            disabled={isSubmitting || formProgress < 100}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
