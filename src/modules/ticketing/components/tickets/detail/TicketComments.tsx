import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Lock, User, Clock, StickyNote, Reply, Forward, Mail, Paperclip, Download, X, FileText } from 'lucide-react';
import { commentsApi, type Comment, type AddCommentWithAttachmentsRequest } from '../../../../../shared/services/api/commentsApi';
import { ticketEmailUtility } from '../../../../../shared/services/ticketEmailUtility';
import { API_CONFIG } from '@/config/api';
import AIReplyGenerator from '../../../../../components/ticketing/ai/AIReplyGenerator';

interface TicketCommentsProps {
  ticketId: string;
  ticketTitle?: string; // Add ticket title for better context
  ticketNumber?: string; // Public/Display ticket number for subjects
  isAgent?: boolean; // If true, can see internal comments and add internal comments
  ticketDescription?: string; // Description for AI context
  ticketCategory?: string; // Category for AI context
  ticketPriority?: string; // Priority for AI context
  customerName?: string; // Customer name for AI personalization
  initialComment?: string; // Pre-populated comment from external AI generation
  onCommentChange?: (comment: string) => void; // Callback when comment changes
}

const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId, ticketTitle, ticketNumber, isAgent = false, ticketDescription, ticketCategory, ticketPriority, customerName, initialComment, onCommentChange }) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle external initial comment updates (e.g., from AI in description section)
  useEffect(() => {
    if (initialComment && initialComment !== newComment) {
      setNewComment(initialComment);
    }
  }, [initialComment]);
  
  // Wrapper to also notify parent of comment changes
  const handleCommentChange = (value: string) => {
    setNewComment(value);
    onCommentChange?.(value);
  };
  
  // Attachment state for main comment
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reply state with attachments
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Forward states
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardAttachments, setForwardAttachments] = useState<File[]>([]);
  const forwardFileInputRef = useRef<HTMLInputElement>(null);

  // Query to fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => commentsApi.getComments(ticketId),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation to add comment (with or without attachments)
  const addCommentMutation = useMutation({
    mutationFn: (request: AddCommentWithAttachmentsRequest) => 
      commentsApi.addCommentWithAttachments(ticketId, request),
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setNewComment('');
      setIsInternal(false);
      setCommentAttachments([]);
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
      content: newComment.trim(),
      isInternal: isInternal,
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined
    });
    
    // Log what email subject would be sent to user for tracking
    console.log(`📧 Email notification subject: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'} - Comment Update`);
    console.log(`📧 When user replies to this email, it becomes a comment (no duplicate tickets)`);
  };

  // Handle file selection for main comment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Validate file size (max 10MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setCommentAttachments(prev => [...prev, ...validFiles]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file selection for reply
  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setReplyAttachments(prev => [...prev, ...validFiles]);
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = '';
    }
  };

  // Remove reply attachment
  const removeReplyAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file selection for forward
  const handleForwardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setForwardAttachments(prev => [...prev, ...validFiles]);
    if (forwardFileInputRef.current) {
      forwardFileInputRef.current.value = '';
    }
  };

  // Remove forward attachment
  const removeForwardAttachment = (index: number) => {
    setForwardAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle reply to specific comment
  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const replyContent = `[Reply to Comment #${commentId}] ${replyText.trim()}`;
    
    addCommentMutation.mutate({
      content: replyContent,
      isInternal: isInternal,
      attachments: replyAttachments.length > 0 ? replyAttachments : undefined
    });
    setReplyingTo(null);
    setReplyText('');
    setReplyAttachments([]);
    
    // If configured, send email notification with proper subject
    console.log(`📧 Reply would have subject: Re: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'}`);
  };

  // Handle forward ticket with attachments
  const handleForward = async () => {
    if (!forwardEmail.trim()) return;

    setIsForwarding(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = localStorage.getItem('token');
      
      // Use FormData to support file attachments
      const formData = new FormData();
      formData.append('recipientEmail', forwardEmail);
      formData.append('forwardMessage', forwardMessage);
      
      // Add attachments if any
      if (forwardAttachments.length > 0) {
        forwardAttachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      
      const response = await fetch(`${baseUrl}/tickets-v2/${ticketId}/forward-email`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      
      if (response.ok) {
        // Refresh comments to show the forward action
        queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
        setShowForwardModal(false);
        setForwardEmail('');
        setForwardMessage('');
        setForwardAttachments([]);
        
        console.log(`✅ Ticket #${effectiveTicketNumber} forwarded successfully with subject: Fwd: [Ticket #${effectiveTicketNumber}] ${ticketTitle || 'Support Request'}`);
      } else {
        const errorData = await response.text();
        console.error('Failed to forward ticket:', errorData);
        alert('Failed to forward ticket: ' + (errorData || response.statusText));
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

  // Parse comment body and convert ticket references to clickable links
  // Supports two formats:
  // 1. New format: [#101912](ticket:guid-here) - links directly to ticket
  // 2. Old format: #101912 - fallback, searches for ticket
  const renderCommentBody = (body: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let keyIndex = 0;

    // First, handle new format: [#PublicId](ticket:GUID)
    const newFormatPattern = /\[#(\d+)\]\(ticket:([a-f0-9-]+)\)/gi;
    
    // Split by the new format pattern and process
    let lastIndex = 0;
    let match;
    
    while ((match = newFormatPattern.exec(body)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textBefore = body.slice(lastIndex, match.index);
        // Process this text for old format patterns
        parts.push(...processOldFormat(textBefore, keyIndex));
        keyIndex += 100; // Increment to avoid key collisions
      }
      
      // Add the clickable ticket link (new format - direct link)
      const ticketPublicId = match[1];
      const ticketGuid = match[2];
      parts.push(
        <Link
          key={`ticket-new-${keyIndex++}`}
          to={`/tickets/${ticketGuid}`}
          className="inline-flex items-center text-gray-600 hover:text-indigo-800 font-medium hover:underline"
          title={`View ticket #${ticketPublicId}`}
        >
          #{ticketPublicId}
        </Link>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Process remaining text after last match
    if (lastIndex < body.length) {
      const remainingText = body.slice(lastIndex);
      parts.push(...processOldFormat(remainingText, keyIndex));
    }
    
    // If no matches at all, just return the body
    if (parts.length === 0) {
      return body;
    }
    
    return parts;
  };

  // Process old format ticket references (#123456) - used for legacy comments
  const processOldFormat = (text: string, startKeyIndex: number): (string | React.ReactNode)[] => {
    const oldFormatPattern = /#(\d{4,})/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = startKeyIndex;

    while ((match = oldFormatPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // For old format, use the lookup endpoint to find by public ID
      const ticketPublicId = match[1];
      parts.push(
        <Link
          key={`ticket-old-${keyIndex++}`}
          to={`/tickets/by-public-id/${ticketPublicId}`}
          className="inline-flex items-center text-gray-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
          title={`View ticket #${ticketPublicId}`}
        >
          #{ticketPublicId}
        </Link>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    // If no matches, return original text as array
    if (parts.length === 0) {
      return [text];
    }
    
    return parts;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-gray-600">Failed to load comments. Please try again.</p>
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
                    ? 'bg-red-50 border-red-300 shadow-sm'
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
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
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
                {renderCommentBody(comment.body)}
              </div>

              {/* Comment Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-900">
                    <Paperclip className="h-4 w-4" />
                    {comment.attachments.length} Attachment{comment.attachments.length > 1 ? 's' : ''}
                  </div>
                  <div className="space-y-2">
                    {comment.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-600 flex-shrink-0" />
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
                          href={`${API_CONFIG.BASE_URL}/tickets-v2/attachments/${attachment.id}/download`}
                          download={attachment.fileName}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-red-100 rounded transition-colors"
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
          {/* AI Reply Suggestions - Agent only */}
          {isAgent && ticketTitle && (
            <div className="mb-3">
              <AIReplyGenerator
                ticketSubject={ticketTitle}
                ticketDescription={ticketDescription}
                category={ticketCategory}
                priority={ticketPriority}
                customerName={customerName}
                comments={comments?.map((c: Comment) => ({
                  author: c.authorName || 'Unknown',
                  isInternal: c.isInternal || false,
                  content: c.body || '',
                  createdAt: c.createdAt,
                })) || []}
                onInsertResponse={(content) => {
                  handleCommentChange(content);
                }}
              />
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            disabled={isSubmitting}
          />
          
          {/* Attachment Preview */}
          {commentAttachments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                <Paperclip className="h-4 w-4" />
                {commentAttachments.length} file(s) selected
              </div>
              <div className="space-y-2">
                {commentAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-gray-500 hover:bg-red-50 rounded"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Internal comment option (only for agents) */}
              {isAgent && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Lock className="h-3 w-3" />
                    Internal
                  </div>
                </label>
              )}
              
              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-600 hover:bg-red-50 rounded-lg border border-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                <Paperclip className="h-4 w-4" />
                Attach Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="border-t border-gray-200 pt-4 bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
            <Reply className="h-4 w-4" />
            Replying to comment
            <button
              onClick={() => { setReplyingTo(null); setReplyAttachments([]); }}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            
            {/* Reply Attachment Preview */}
            {replyAttachments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-2">
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                      <FileText className="h-3 w-3 text-gray-500" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReplyAttachment(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAgent && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-gray-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">Internal</span>
                  </label>
                )}
                
                {/* Reply Attachment button */}
                <button
                  type="button"
                  onClick={() => replyFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-600 hover:bg-white rounded border border-gray-300"
                >
                  <Paperclip className="h-3 w-3" />
                  Attach
                </button>
                <input
                  ref={replyFileInputRef}
                  type="file"
                  multiple
                  onChange={handleReplyFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip"
                />
              </div>
              
              <button
                onClick={() => handleReply(replyingTo)}
                disabled={!replyText.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
              <button className="px-4 py-2 text-gray-600 border-b-2 border-red-600 flex items-center gap-2">
                <Forward className="h-4 w-4" />
                Forward
              </button>
            </div>

            {/* Email Form */}
            <div className="p-4 space-y-4">
              {/* To Field - Most Important */}
              <div className="flex items-center gap-3 bg-red-50 p-3 rounded border">
                <label className="w-16 text-sm font-semibold text-gray-800">To:</label>
                <input
                  type="email"
                  value={forwardEmail}
                  onChange={(e) => setForwardEmail(e.target.value)}
                  placeholder="Enter recipient email address (required)"
                  className="flex-1 px-3 py-2 border-2 border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Attachments Field */}
              <div className="flex gap-3">
                <label className="w-16 text-sm font-medium text-gray-700 pt-2">Attach:</label>
                <div className="flex-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => forwardFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-600 hover:bg-red-50 rounded-lg border border-gray-300 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                    Add Attachments
                  </button>
                  <input
                    ref={forwardFileInputRef}
                    type="file"
                    multiple
                    onChange={handleForwardFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip"
                  />
                  
                  {forwardAttachments.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
                      {forwardAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeForwardAttachment(index)}
                            className="p-1 text-gray-500 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => { setShowForwardModal(false); setForwardAttachments([]); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForward}
                  disabled={!forwardEmail.trim() || isForwarding}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
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