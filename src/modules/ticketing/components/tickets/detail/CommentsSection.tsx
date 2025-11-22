import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, MessageCircle, User, Send } from 'lucide-react';
import { QueryClient } from '@tanstack/react-query';
import { Ticket } from '../../../services/ticketsApi';
import { ticketsApi } from '../../../services/ticketsApi';

interface CommentsSectionProps {
  ticket: Ticket;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
  queryClient: QueryClient;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  ticket,
  expanded,
  onToggle,
  formatDate,
  queryClient
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'note'>('comment');

  const addCommentMutation = useMutation({
    mutationFn: (data: { Content: string; IsInternal: boolean }) =>  // Changed to PascalCase
      ticketsApi.addComment(ticket.id, data.Content, data.IsInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      setNewComment('');
      toast.success('Comment added successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add comment: ${message}`);
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      Content: newComment,          // Changed to PascalCase
      IsInternal: commentType === 'note'  // Changed to PascalCase
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          <MessageCircle className="h-5 w-5 inline mr-2" />
          Comments & Activities ({ticket.comments?.length || 0})
        </h2>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {expanded && (
        <div className="border-t p-4 space-y-4">
          {/* Comments List */}
          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4">
              {ticket.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-3 border-l-4 border-indigo-200 bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.createdBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </p>
                      {comment.isInternal && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No comments yet</p>
            </div>
          )}

          {/* Add Comment Form */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={() => setCommentType('comment')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  commentType === 'comment'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Public Comment
              </button>
              <button
                onClick={() => setCommentType('note')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  commentType === 'note'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Internal Note
              </button>
            </div>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                commentType === 'note' 
                  ? 'Add internal note (only visible to agents)...' 
                  : 'Add public comment (visible to customer)...'
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">
                {commentType === 'note' 
                  ? 'This note will only be visible to agents'
                  : 'This comment will be visible to the customer'}
              </p>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                {addCommentMutation.isPending 
                  ? 'Adding...' 
                  : commentType === 'note' 
                    ? 'Add Note' 
                    : 'Add Comment'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;