import React, { useState } from 'react';
import { X, StickyNote, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticketsApi';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle
}) => {
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      ticketsApi.addComment(ticketId, { 
        body: content, 
        isInternal: true // This is an internal note, not visible to user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      setNoteContent('');
      onClose();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    await addNoteMutation.mutateAsync(noteContent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StickyNote className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Internal Note</h2>
              <p className="text-sm text-gray-600">Internal communication between agents</p>
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
            {/* Ticket Reference */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Ticket</h3>
              <p className="text-sm text-gray-900">{ticketTitle}</p>
              <p className="text-xs text-gray-500">#{ticketId}</p>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Note <span className="text-gray-500">*</span>
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your internal note here... This will only be visible to agents, not the ticket creator."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ This note will be internal and not visible to the ticket creator
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <StickyNote className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Internal Note</h4>
                  <p className="text-xs text-yellow-700">
                    This note will only be visible to support agents and will not be sent to the ticket creator.
                    Use this for internal communication, observations, or instructions for other agents.
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
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {addNoteMutation.isPending ? 'Adding Note...' : 'Add Internal Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
