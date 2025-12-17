import React, { useState } from 'react';
import { Merge, Split, X, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  useMergeTickets,
  useSplitTicket,
  useTicketMergeHistory,
  useTicketSplitHistory,
  MergeTicketsRequestDto,
  SplitTicketRequestDto,
  TicketMergeDto,
  TicketSplitDto
} from '../../services/ticketEnhancementsApi';

// ==================== Merge Ticket Modal ====================

interface MergeTicketModalProps {
  sourceTicketId: number;
  sourceTicketTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MergeTicketModal({ sourceTicketId, sourceTicketTitle, onClose, onSuccess }: MergeTicketModalProps) {
  const mergeMutation = useMergeTickets();
  const [targetTicketId, setTargetTicketId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = parseInt(targetTicketId);
    if (isNaN(targetId) || targetId === sourceTicketId) return;

    await mergeMutation.mutateAsync({
      sourceTicketId,
      targetTicketId: targetId,
      reason: reason || undefined,
    });

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Merge Ticket
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Warning: This action cannot be undone</p>
                <p className="text-sm text-amber-700 mt-1">
                  Merging will close the source ticket and move all comments and attachments to the target ticket.
                </p>
              </div>
            </div>
          </div>

          {/* Source Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Source Ticket (will be closed)</p>
            <p className="text-sm font-medium text-gray-900">
              #{sourceTicketId}: {sourceTicketTitle}
            </p>
          </div>

          {/* Target Ticket */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Ticket ID
            </label>
            <input
              type="number"
              min="1"
              value={targetTicketId}
              onChange={(e) => setTargetTicketId(e.target.value)}
              placeholder="Enter ticket ID to merge into"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              All data from this ticket will be merged into the target ticket
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Merge (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why are these tickets being merged?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Preview */}
          {targetTicketId && parseInt(targetTicketId) !== sourceTicketId && (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">#{sourceTicketId}</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <Merge className="h-4 w-4 text-gray-500" />
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">#{targetTicketId}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mergeMutation.isPending || !targetTicketId || parseInt(targetTicketId) === sourceTicketId}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {mergeMutation.isPending ? 'Merging...' : 'Merge Tickets'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Split Ticket Modal ====================

interface SplitTicketModalProps {
  originalTicketId: number;
  originalTicketTitle: string;
  onClose: () => void;
  onSuccess?: (newTicketId: number) => void;
}

export function SplitTicketModal({ originalTicketId, originalTicketTitle, onClose, onSuccess }: SplitTicketModalProps) {
  const splitMutation = useSplitTicket();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const result = await splitMutation.mutateAsync({
      originalTicketId,
      newTicketTitle: newTitle,
      newTicketDescription: newDescription,
      reason: reason || undefined,
    });

    onSuccess?.(result.newTicketId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Ticket
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-gray-800">
              Create a new ticket from this one. The original ticket will remain open, and
              both tickets will be linked together.
            </p>
          </div>

          {/* Original Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Splitting from</p>
            <p className="text-sm font-medium text-gray-900">
              #{originalTicketId}: {originalTicketTitle}
            </p>
          </div>

          {/* New Ticket Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Ticket Title <span className="text-gray-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter title for the new ticket"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* New Ticket Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Ticket Description <span className="text-gray-500">*</span>
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue for the new ticket"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Split (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this ticket being split?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">#{originalTicketId}</span>
            <Split className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">+ New Ticket</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={splitMutation.isPending || !newTitle.trim() || !newDescription.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {splitMutation.isPending ? 'Creating...' : 'Split & Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Merge/Split History Panel ====================

interface MergeSplitHistoryPanelProps {
  ticketId: number;
}

export function MergeSplitHistoryPanel({ ticketId }: MergeSplitHistoryPanelProps) {
  const { data: mergeHistory, isLoading: mergeLoading } = useTicketMergeHistory(ticketId);
  const { data: splitHistory, isLoading: splitLoading } = useTicketSplitHistory(ticketId);

  const isLoading = mergeLoading || splitLoading;
  const hasMergeHistory = mergeHistory && mergeHistory.length > 0;
  const hasSplitHistory = splitHistory && splitHistory.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!hasMergeHistory && !hasSplitHistory) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Merge/Split History</h3>
      </div>

      <div className="p-4 space-y-4">
        {hasMergeHistory && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Merges</h4>
            <div className="space-y-2">
              {mergeHistory!.map((merge) => (
                <MergeHistoryItem key={merge.id} merge={merge} currentTicketId={ticketId} />
              ))}
            </div>
          </div>
        )}

        {hasSplitHistory && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Splits</h4>
            <div className="space-y-2">
              {splitHistory!.map((split) => (
                <SplitHistoryItem key={split.id} split={split} currentTicketId={ticketId} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MergeHistoryItem({ merge, currentTicketId }: { merge: TicketMergeDto; currentTicketId: number }) {
  const isSource = merge.sourceTicketId === currentTicketId;

  return (
    <div className="p-3 bg-amber-50 rounded-lg text-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <Merge className="h-4 w-4" />
        {isSource ? (
          <span>
            This ticket was merged into{' '}
            <a href={`/tickets/${merge.targetTicketId}`} className="font-medium text-gray-600 hover:underline">
              #{merge.targetTicketId}
            </a>
          </span>
        ) : (
          <span>
            Ticket{' '}
            <a href={`/tickets/${merge.sourceTicketId}`} className="font-medium text-gray-600 hover:underline">
              #{merge.sourceTicketId}
            </a>
            {' '}was merged into this ticket
          </span>
        )}
      </div>
      {merge.reason && (
        <p className="mt-1 text-amber-700">Reason: {merge.reason}</p>
      )}
      <p className="mt-1 text-xs text-amber-600">
        By {merge.mergedByName} on {new Date(merge.mergedAt).toLocaleString()}
      </p>
    </div>
  );
}

function SplitHistoryItem({ split, currentTicketId }: { split: TicketSplitDto; currentTicketId: number }) {
  const isOriginal = split.originalTicketId === currentTicketId;

  return (
    <div className="p-3 bg-green-50 rounded-lg text-sm">
      <div className="flex items-center gap-2 text-green-800">
        <Split className="h-4 w-4" />
        {isOriginal ? (
          <span>
            Ticket{' '}
            <a href={`/tickets/${split.newTicketId}`} className="font-medium text-gray-600 hover:underline">
              #{split.newTicketId}
            </a>
            {' '}was split from this ticket
          </span>
        ) : (
          <span>
            This ticket was split from{' '}
            <a href={`/tickets/${split.originalTicketId}`} className="font-medium text-gray-600 hover:underline">
              #{split.originalTicketId}
            </a>
          </span>
        )}
      </div>
      {split.reason && (
        <p className="mt-1 text-green-700">Reason: {split.reason}</p>
      )}
      <p className="mt-1 text-xs text-green-600">
        By {split.splitByName} on {new Date(split.splitAt).toLocaleString()}
      </p>
    </div>
  );
}

export default MergeTicketModal;
