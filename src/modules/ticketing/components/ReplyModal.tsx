import React, { useState } from 'react';
import { X, Reply, Send, Mail } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticketsApi';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  customerEmail: string;
  customerName: string;
}

const ReplyModal: React.FC<ReplyModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle,
  customerEmail,
  customerName
}) => {
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const addReplyMutation = useMutation({
    mutationFn: (content: string) =>
      ticketsApi.addComment(ticketId, { 
        body: content, 
        isInternal: false // This is a public reply, visible to user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      setReplyContent('');
      onClose();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    await addReplyMutation.mutateAsync(replyContent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Reply className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reply to Customer</h2>
              <p className="text-sm text-gray-600">Send response to ticket creator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Email Header Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-900">Email Details</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-16">To:</span>
                  <span className="text-gray-900">{customerName} ({customerEmail})</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-16">Subject:</span>
                  <span className="text-gray-900">Re: {ticketTitle}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-16">Ticket:</span>
                  <span className="text-gray-900">#{ticketId}</span>
                </div>
              </div>
            </div>

            {/* Reply Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Hi ${customerName},\n\nThank you for contacting support regarding your ticket.\n\nI'm writing to provide you with an update...\n\nBest regards,\nSupport Team`}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be sent to the customer and added to the ticket
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Reply className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Customer Reply</h4>
                  <p className="text-xs text-blue-700">
                    This reply will be sent to the customer via email and will be visible in the ticket history.
                    The customer will receive an email notification with your response.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim() || addReplyMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {addReplyMutation.isPending ? 'Sending Reply...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplyModal;
