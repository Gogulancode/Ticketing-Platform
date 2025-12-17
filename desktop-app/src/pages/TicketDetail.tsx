import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, AlertCircle, 
  Loader2, User, MessageSquare, Send, Paperclip, Download,
  X, RotateCcw, Forward, Reply, Mail, Timer
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
  resolvedAt?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdByUser?: { id: string; firstName: string; lastName: string; email: string };
  assignedToName?: string;
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string };
  attachments?: { id: number; fileName: string; fileSize: number }[];
}

interface Comment {
  id: string;
  ticketId: string;
  body: string;
  authorUserId: string;
  authorName?: string;
  createdAt: string;
  isInternal: boolean;
  attachments?: { id: number; fileName: string; sizeBytes: number; createdAt: string }[];
}

const statusMap: Record<number, string> = {
  1: 'Open',
  2: 'In Progress',
  3: 'Pending',
  4: 'Resolved',
  5: 'Closed',
};

const priorityMap: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
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

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { serverUrl, token } = useAuthStore();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Attachments
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email modals
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  
  // Reopen countdown timer state
  const [reopenCountdown, setReopenCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, canReopen: false });

  // Live countdown timer effect for resolved tickets
  useEffect(() => {
    if (!ticket || ticket.status !== 4) {
      setReopenCountdown({ hours: 0, minutes: 0, seconds: 0, canReopen: false });
      return;
    }

    const resolvedDate = ticket.resolvedAt ? parseISO(ticket.resolvedAt) : 
                         ticket.updatedAt ? parseISO(ticket.updatedAt) : null;
    
    if (!resolvedDate) {
      setReopenCountdown({ hours: 0, minutes: 0, seconds: 0, canReopen: false });
      return;
    }

    const expiresAt = new Date(resolvedDate.getTime() + 48 * 60 * 60 * 1000); // 48 hours from resolved

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setReopenCountdown({ hours: 0, minutes: 0, seconds: 0, canReopen: false });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setReopenCountdown({ hours, minutes, seconds, canReopen: true });
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [ticket?.status, ticket?.resolvedAt, ticket?.updatedAt]);

  useEffect(() => {
    if (id) {
      loadTicket();
      loadComments();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        toast.error('Ticket not found');
        navigate('/my-tickets');
      }
    } catch (error) {
      console.error('Failed to load ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/tickets/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : data.items || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  // Check if ticket can be reopened (status 4 = Resolved, within 48 hours)
  const canReopen = useCallback(() => {
    if (!ticket || ticket.status !== 4) return false;
    return reopenCountdown.canReopen;
  }, [ticket?.status, reopenCountdown.canReopen]);

  // Format countdown for display
  const formatCountdown = () => {
    const { hours, minutes, seconds } = reopenCountdown;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Get countdown urgency color
  const getCountdownColor = () => {
    const { hours, minutes } = reopenCountdown;
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 60) return 'text-red-600 bg-red-50 border-red-200'; // Less than 1 hour - urgent
    if (totalMinutes < 360) return 'text-amber-600 bg-amber-50 border-amber-200'; // Less than 6 hours - warning
    return 'text-green-600 bg-green-50 border-green-200'; // More than 6 hours - ok
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', newComment.trim());
      formData.append('isInternal', 'false');
      
      commentAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${serverUrl}/api/tickets-v2/${id}/comments-with-attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success('Comment added');
        setNewComment('');
        setCommentAttachments([]);
        loadComments();
        
        // Show desktop notification
        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification({
            title: 'Comment Added',
            body: `Your comment on ticket #${ticket?.publicId} was added successfully.`
          });
        }
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024;
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setIsEmailSending(true);
    try {
      const formData = new FormData();
      if (replyTo.trim()) {
        formData.append('recipientEmails', replyTo.trim());
      }
      formData.append('replyMessage', replyContent.trim());
      
      const response = await fetch(`${serverUrl}/api/tickets-v2/${id}/reply-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success('Reply sent successfully!');
        setShowReplyModal(false);
        setReplyTo('');
        setReplyContent('');
        loadComments();
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleForward = async () => {
    if (!forwardEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsEmailSending(true);
    try {
      const formData = new FormData();
      formData.append('recipientEmail', forwardEmail.trim());
      formData.append('forwardMessage', forwardMessage.trim());

      const response = await fetch(`${serverUrl}/api/tickets-v2/${id}/forward-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success('Ticket forwarded successfully!');
        setShowForwardModal(false);
        setForwardEmail('');
        setForwardMessage('');
      } else {
        toast.error('Failed to forward ticket');
      }
    } catch (error) {
      toast.error('Failed to forward ticket');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleReopen = async () => {
    if (!canReopen()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${serverUrl}/api/tickets/${id}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Reopened from desktop application' }),
      });

      if (response.ok) {
        toast.success('Ticket reopened successfully!');
        loadTicket();
      } else {
        const errorData = await response.text();
        console.error('Reopen error:', errorData);
        toast.error(errorData || 'Failed to reopen ticket');
      }
    } catch (error) {
      console.error('Reopen exception:', error);
      toast.error('Failed to reopen ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Ticket not found</p>
      </div>
    );
  }

  const statusName = statusMap[ticket.status] || 'Unknown';
  const priorityName = priorityMap[ticket.priority] || 'Unknown';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-gray-500">#{ticket.publicId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[statusName]}`}>
                {statusName}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[priorityName]}`}>
                {priorityName}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{ticket.title}</h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setReplyTo(ticket.createdByUser?.email || ticket.createdByEmail || ''); setShowReplyModal(true); }}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button
              onClick={() => setShowForwardModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Forward"
            >
              <Forward className="w-4 h-4" />
              Forward
            </button>
            
            {canReopen() && (
              <button
                onClick={handleReopen}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reopen
              </button>
            )}
          </div>
        </div>
        
        {/* Reopen Countdown Timer Banner for Resolved Tickets */}
        {ticket.status === 4 && reopenCountdown.canReopen && (
          <div className={`mx-6 mt-2 mb-0 flex items-center justify-between px-4 py-3 rounded-lg border ${getCountdownColor()}`}>
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5" />
              <div>
                <p className="font-medium">Ticket Resolved - Reopen Window Active</p>
                <p className="text-sm opacity-80">
                  If you haven't received a satisfactory resolution, you can reopen this ticket.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs opacity-80">Time remaining to reopen</p>
                <p className="text-xl font-mono font-bold">{formatCountdown()}</p>
              </div>
              <button
                onClick={handleReopen}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-current rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reopen Ticket
              </button>
            </div>
          </div>
        )}
        
        {/* Auto-close notice for tickets past the 48-hour window */}
        {ticket.status === 4 && !reopenCountdown.canReopen && ticket.resolvedAt && (
          <div className="mx-6 mt-2 mb-0 flex items-center gap-3 px-4 py-3 rounded-lg border bg-gray-50 border-gray-200 text-gray-600">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Reopen Window Expired</p>
              <p className="text-sm opacity-80">
                The 48-hour window to reopen this ticket has passed. This ticket will be automatically closed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Ticket Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
          <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          
          {/* Ticket Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${serverUrl}/api/tickets-v2/attachments/${att.id}/download`}
                    download={att.fileName}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>{att.fileName}</span>
                    <Download className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Created by {
                ticket.createdByUser 
                  ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`.trim() || ticket.createdByUser.email
                  : ticket.createdByName || 'Unknown'
              }</span>
            </div>
            {ticket.createdByUser?.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{ticket.createdByUser.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{format(parseISO(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {(ticket.assignedToName || ticket.assignedToUser) && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Assigned to {
                  ticket.assignedToUser
                    ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`.trim() || ticket.assignedToUser.email
                    : ticket.assignedToName
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
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No comments yet</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.authorName || 'User'}</span>
                        <span className="text-sm text-gray-500">
                          {format(parseISO(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                        {comment.isInternal && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                      
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={`${serverUrl}/api/tickets-v2/attachments/${att.id}/download`}
                              download={att.fileName}
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
          {ticket.status !== 5 && (
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-200">
              {commentAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {commentAttachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                      <Paperclip className="w-3 h-3 text-red-600" />
                      <span className="text-sm text-red-700">{file.name}</span>
                      <span className="text-xs text-red-500">({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-0.5 text-red-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2 self-end">
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
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </form>
          )}

          {ticket.status === 5 && (
            <div className="p-4 border-t border-gray-200 bg-amber-50">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This ticket is closed and cannot be reopened.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Reply className="w-5 h-5" />
                Reply to Ticket
              </h2>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Subject:</span> Re: #{ticket.publicId} - {ticket.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="email@example.com (add more with comma)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add multiple recipients by separating with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Reply <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={isEmailSending || !replyContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isEmailSending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <X className="w-5 h-5" />
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ticket:</span> #{ticket.publicId} - {ticket.title}
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
                disabled={isEmailSending || !forwardEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Forward className="w-4 h-4" />}
                {isEmailSending ? 'Forwarding...' : 'Forward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
