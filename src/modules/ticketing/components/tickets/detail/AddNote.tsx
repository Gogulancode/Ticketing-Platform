import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Send, Lock } from 'lucide-react';
import { commentsApi, type AddCommentRequest } from '../../../../../shared/services/api/commentsApi';

interface AddNoteProps {
  ticketId: string;
  isAgent: boolean; // Only agents can see and use this component
}

const AddNote: React.FC<AddNoteProps> = ({ ticketId, isAgent }) => {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if user is not an agent
  if (!isAgent) {
    return null;
  }

  // Mutation to add internal note
  const addNoteMutation = useMutation({
    mutationFn: (request: AddCommentRequest) => commentsApi.addComment(ticketId, request),
    onSuccess: () => {
      // Invalidate and refetch comments to show the new note
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setNoteContent('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Failed to add note:', error);
      setIsSubmitting(false);
    },
  });

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const requestPayload = {
      Content: noteContent.trim(),  // Changed to PascalCase
      IsInternal: true // Changed to PascalCase - This makes it an internal note
    };

    console.log('🔥 AddNote: Starting to submit note...', {
      ticketId,
      requestPayload,
      apiEndpoint: `/api/tickets-v2/${ticketId}/comments`
    });

    setIsSubmitting(true);
    
    try {
      // Add note as internal comment (IsInternal = true)
      const result = await addNoteMutation.mutateAsync(requestPayload);
      console.log('✅ AddNote: Note added successfully', result);
    } catch (error) {
      console.error('❌ AddNote: Failed to add note:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-5 w-5 text-yellow-600" />
        <h3 className="text-sm font-semibold text-yellow-800">Add Internal Note</h3>
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
          <Lock className="h-3 w-3" />
          Agents Only
        </div>
      </div>

      {/* Note Form */}
      <form onSubmit={handleSubmitNote} className="space-y-3">
        <textarea
          value={noteContent}
          onChange={(e) => {
            console.log('📝 AddNote: Textarea value changing', e.target.value);
            setNoteContent(e.target.value);
          }}
          placeholder="Add an internal note that only agents can see..."
          rows={3}
          className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none text-sm"
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between">
          {/* Info text */}
          <div className="text-xs text-yellow-700">
            This note will be visible only to agents and will not send email notifications.
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!noteContent.trim() || isSubmitting}
            onClick={(e) => {
              console.log('🔘 AddNote: Button clicked', {
                noteContentTrimmed: noteContent.trim(),
                isSubmitting,
                buttonDisabled: !noteContent.trim() || isSubmitting,
                eventType: e.type
              });
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                Add Note
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error display */}
      {addNoteMutation.isError && (
        <div className="mt-2 text-xs text-red-600">
          Failed to add note. Please try again.
        </div>
      )}
    </div>
  );
};

export default AddNote;