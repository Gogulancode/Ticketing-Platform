import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, EyeOff, User, Clock } from 'lucide-react';
import { ticketsV2Api, TicketV2Comment, CommentRequest } from '../services/ticketsV2Api';

interface TicketCommentsV2Props {
  ticketId: string;
  isAgent?: boolean;
  onCommentsCountChange?: (count: number) => void;
}

const TicketCommentsV2: React.FC<TicketCommentsV2Props> = ({ ticketId, isAgent = false, onCommentsCountChange }) => {
  const [comments, setComments] = useState<TicketV2Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const commentsData = await ticketsV2Api.getComments(ticketId);
      setComments(commentsData);
      setError(null);
      // Notify parent of the comments count
      onCommentsCountChange?.(commentsData.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [ticketId, onCommentsCountChange]);

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setAddingComment(true);
      const commentRequest: CommentRequest = {
        content: newComment,
        isInternal: isInternal,
      };
      
      await ticketsV2Api.addComment(ticketId, commentRequest);
      setNewComment('');
      setIsInternal(false);
      await loadComments(); // Reload comments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredComments = comments.filter(comment => 
    isAgent || !comment.isInternal
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({filteredComments.length})
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.isInternal 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {comment.authorName}
                  </span>
                  {comment.isInternal && isAgent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Internal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(comment.createdAt)}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t pt-4">
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          
          {isAgent && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal-comment"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="internal-comment" className="text-sm text-gray-700 flex items-center gap-1">
                <EyeOff className="h-4 w-4" />
                Internal comment (only visible to agents)
              </label>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addingComment}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingComment ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {addingComment ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCommentsV2;