import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Lock, User, Clock, StickyNote, Reply, Forward, Mail, Paperclip, Download } from 'lucide-react';
import { commentsApi, type Comment, type AddCommentRequest } from '../../../../../shared/services/api/commentsApi';
import { ticketForwardService, type ForwardRequest } from '../../../../../shared/services/ticketForwardService';
import { ticketEmailUtility } from '../../../../../shared/services/ticketEmailUtility';

interface TicketCommentsProps {
  ticketId: string;
  ticketTitle?: string; // Add ticket title for better context
  ticketNumber?: string; // Public/Display ticket number for subjects
  isAgent?: boolean; // If true, can see internal comments and add internal comments
}

const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId, ticketTitle, ticketNumber, isAgent = false }) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reply and Forward states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Query to fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => commentsApi.getComments(ticketId),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation to add comment
  const addCommentMutation = useMutation({
    mutationFn: (request: AddCommentRequest) => commentsApi.addComment(ticketId, request),
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setNewComment('');
      setIsInternal(false);
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
      setIsSubmitting(false);
    },
  });

  const effectiveTicketNumber = ticketNumber || ticketEmailUtility.generateTicketNumber(ticketId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    addCommentMutation.mutate({
      Content: newComment.trim(),  // Changed to PascalCase
      IsInternal: isInternal       // Changed to PascalCase
    });
    
    // Log what email subject would be sent to user for tracking
    console.log(`📧 Email notification subject: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'} - Comment Update`);
    console.log(`📧 When user replies to this email, it becomes a comment (no duplicate tickets)`);
  };

  // Handle reply to specific comment
  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const replyContent = `[Reply to Comment #${commentId}] ${replyText.trim()}`;
    
    addCommentMutation.mutate({
      Content: replyContent,
      IsInternal: isInternal
    });
    setReplyingTo(null);
    setReplyText('');
    
    // If configured, send email notification with proper subject
    console.log(`📧 Reply would have subject: Re: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'}`);
  };

  // Handle forward ticket
  const handleForward = async () => {
    if (!forwardEmail.trim()) return;

    setIsForwarding(true);
    try {
      // Generate ticket number for tracking
      const forwardRequest: ForwardRequest = {
        ticketId,
        toEmail: forwardEmail,
        message: forwardMessage,
        includeHistory: true,
        forwardType: 'agent', // Assume internal forwarding for now
        ticketNumber: effectiveTicketNumber,
        ticketTitle: ticketTitle || 'Support Request'
      };
      
      const result = await ticketForwardService.forwardTicket(forwardRequest);
      
      if (result.success) {
        // Refresh comments to show the forward action
        queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
        setShowForwardModal(false);
        setForwardEmail('');
        setForwardMessage('');
        
        console.log(`✅ Ticket #${effectiveTicketNumber} forwarded successfully with subject: Fwd: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'}`);
      } else {
        console.error('Failed to forward ticket:', result.message);
        alert('Failed to forward ticket: ' + result.message);
      }
    } catch (error) {
      console.error('Error forwarding ticket:', error);
      alert('Error forwarding ticket. Please try again.');
    } finally {
      setIsForwarding(false);
    }
  };

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
  };

  // Filter comments based on user role
  const visibleComments = comments?.filter(comment => 
    isAgent ? true : !comment.isInternal
  ) || [];

  // Separate comments and notes for display
  const publicComments = visibleComments.filter(comment => !comment.isInternal);
  const internalNotes = visibleComments.filter(comment => comment.isInternal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load comments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <MessageCircle className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments & Notes 
          {isAgent && internalNotes.length > 0 ? (
            <span className="text-sm font-normal text-gray-600">
              ({publicComments.length} comments, {internalNotes.length} notes)
            </span>
          ) : (
            <span className="text-sm font-normal text-gray-600">
              ({publicComments.length})
            </span>
          )}
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {visibleComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet. Be the first to add one!</p>
          </div>
        ) : (
          visibleComments.map((comment: Comment) => {
            const hasAttachments = comment.attachments && comment.attachments.length > 0;
            return (
              <div key={comment.id} className={`p-4 rounded-lg border ${
                comment.isInternal 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : hasAttachments
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {comment.isInternal ? (
                    <StickyNote className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">
                    {comment.authorName}
                  </span>
                  {comment.isInternal && isAgent && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(comment.createdAt)}
                  </div>
                  {/* Agent Actions */}
                  {isAgent && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Reply to this comment"
                      >
                        <Reply className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowForwardModal(true)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                        title="Forward ticket"
                      >
                        <Forward className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Body */}
              <div className="text-gray-700 whitespace-pre-wrap">
                {comment.body}
              </div>

              {/* Comment Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-900">
                    <Paperclip className="h-4 w-4" />
                    {comment.attachments.length} Attachment{comment.attachments.length > 1 ? 's' : ''}
                  </div>
                  <div className="space-y-2">
                    {comment.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(attachment.sizeBytes / 1024).toFixed(2)} KB • {new Date(attachment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015'}/api/tickets-v2/attachments/${attachment.id}/download`}
                          download={attachment.fileName}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                          title="Download attachment"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="border-t border-gray-200 pt-4">
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between">
            {/* Internal comment option (only for agents) */}
            {isAgent && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Lock className="h-3 w-3" />
                  Internal comment (only visible to agents)
                </div>
              </label>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Add Comment
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Reply Input (when replying to a comment) */}
      {replyingTo && (
        <div className="border-t border-gray-200 pt-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-sm text-blue-700">
            <Reply className="h-4 w-4" />
            Replying to comment
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between">
              {isAgent && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Internal reply</span>
                </label>
              )}
              <button
                onClick={() => handleReply(replyingTo)}
                disabled={!replyText.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Send Email</h3>
              <button
                onClick={() => setShowForwardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
              <button className="px-4 py-2 text-gray-500 border-b-2 border-transparent hover:text-gray-700 flex items-center gap-2">
                <Reply className="h-4 w-4" />
                Reply
              </button>
              <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
                <Forward className="h-4 w-4" />
                Forward
              </button>
            </div>

            {/* Email Form */}
            <div className="p-4 space-y-4">
              {/* To Field - Most Important */}
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded border">
                <label className="w-16 text-sm font-semibold text-gray-800">To:</label>
                <input
                  type="email"
                  value={forwardEmail}
                  onChange={(e) => setForwardEmail(e.target.value)}
                  placeholder="Enter recipient email address (required)"
                  className="flex-1 px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              {/* Subject Field */}
              <div className="flex items-center gap-3">
                <label className="w-16 text-sm font-medium text-gray-700">Subject:</label>
                <input
                  type="text"
                  value={`Fwd: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600"
                />
              </div>

              {/* Message Field */}
              <div className="flex gap-3">
                <label className="w-16 text-sm font-medium text-gray-700 pt-2">Message:</label>
                <textarea
                  value={forwardMessage}
                  onChange={(e) => setForwardMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForward}
                  disabled={!forwardEmail.trim() || isForwarding}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isForwarding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketComments;