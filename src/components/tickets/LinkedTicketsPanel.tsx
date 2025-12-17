import React, { useState } from 'react';
import { Link2, Plus, X, ArrowRight, ExternalLink, Trash2 } from 'lucide-react';
import {
  useLinkedTickets,
  useLinkTickets,
  useUnlinkTickets,
  LinkedTicketDto,
  CreateLinkedTicketDto,
  LinkType,
  linkTypeLabels
} from '../../services/ticketEnhancementsApi';

interface LinkedTicketsPanelProps {
  ticketId: number;
  readOnly?: boolean;
}

export function LinkedTicketsPanel({ ticketId, readOnly = false }: LinkedTicketsPanelProps) {
  const { data: linkedTickets, isLoading } = useLinkedTickets(ticketId);
  const linkMutation = useLinkTickets();
  const unlinkMutation = useUnlinkTickets();

  const [showLinkForm, setShowLinkForm] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Linked Tickets ({linkedTickets?.length || 0})
        </h3>
        {!readOnly && (
          <button
            onClick={() => setShowLinkForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Link Ticket
          </button>
        )}
      </div>

      <div className="p-4">
        {linkedTickets && linkedTickets.length > 0 ? (
          <div className="space-y-2">
            {linkedTickets.map((link) => (
              <LinkedTicketItem
                key={link.id}
                link={link}
                currentTicketId={ticketId}
                onUnlink={() => unlinkMutation.mutateAsync(link.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No linked tickets
          </p>
        )}
      </div>

      {/* Link Ticket Modal */}
      {showLinkForm && (
        <LinkTicketModal
          sourceTicketId={ticketId}
          onClose={() => setShowLinkForm(false)}
          onLink={async (data) => {
            await linkMutation.mutateAsync(data);
            setShowLinkForm(false);
          }}
          isLoading={linkMutation.isPending}
        />
      )}
    </div>
  );
}

interface LinkedTicketItemProps {
  link: LinkedTicketDto;
  currentTicketId: number;
  onUnlink: () => void;
  readOnly?: boolean;
}

function LinkedTicketItem({ link, currentTicketId, onUnlink, readOnly }: LinkedTicketItemProps) {
  const isSource = link.sourceTicketId === currentTicketId;
  const otherTicketId = isSource ? link.targetTicketId : link.sourceTicketId;
  const otherTicketTitle = isSource ? link.targetTicketTitle : link.sourceTicketTitle;

  const getLinkTypeColor = (type: LinkType): string => {
    switch (type) {
      case LinkType.DuplicateOf:
        return 'bg-purple-100 text-purple-700';
      case LinkType.BlockedBy:
      case LinkType.Blocks:
        return 'bg-red-100 text-gray-700';
      case LinkType.ParentOf:
      case LinkType.ChildOf:
        return 'bg-red-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getLinkTypeColor(link.linkType)}`}>
          {link.linkTypeDisplay || linkTypeLabels[link.linkType]}
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <a
          href={`/tickets/${otherTicketId}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 truncate"
        >
          <span>#{otherTicketId}</span>
          <span className="truncate text-gray-700">{otherTicketTitle}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      </div>
      {!readOnly && (
        <button
          onClick={onUnlink}
          className="p-1 text-gray-400 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove link"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface LinkTicketModalProps {
  sourceTicketId: number;
  onClose: () => void;
  onLink: (data: CreateLinkedTicketDto) => Promise<void>;
  isLoading: boolean;
}

function LinkTicketModal({ sourceTicketId, onClose, onLink, isLoading }: LinkTicketModalProps) {
  const [targetTicketId, setTargetTicketId] = useState('');
  const [linkType, setLinkType] = useState<LinkType>(LinkType.RelatedTo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticketIdNum = parseInt(targetTicketId);
    if (isNaN(ticketIdNum) || ticketIdNum === sourceTicketId) return;

    await onLink({
      sourceTicketId,
      targetTicketId: ticketIdNum,
      linkType,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Link Ticket</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Ticket ID
            </label>
            <input
              type="number"
              min="1"
              value={targetTicketId}
              onChange={(e) => setTargetTicketId(e.target.value)}
              placeholder="Enter ticket ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Type
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(parseInt(e.target.value) as LinkType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              {Object.entries(linkTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              This will create a link: <br />
              <span className="font-medium">Ticket #{sourceTicketId}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{linkTypeLabels[linkType]}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">Ticket #{targetTicketId || '?'}</span>
            </p>
          </div>

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
              disabled={isLoading || !targetTicketId}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Linking...' : 'Link Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LinkedTicketsPanel;
