import { useState } from 'react';
import { X, Ticket, AlertCircle } from 'lucide-react';
import { Conversation } from '../../store/chatStore';

interface ConvertToTicketModalProps {
  conversation: Conversation;
  onClose: () => void;
  onConvert: (subject: string, priority: string) => void;
}

export default function ConvertToTicketModal({ 
  conversation, 
  onClose, 
  onConvert 
}: ConvertToTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isConverting, setIsConverting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsConverting(true);
    await onConvert(subject.trim(), priority);
    setIsConverting(false);
  };

  const priorities = [
    { value: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'Critical', color: 'bg-red-100 text-red-700' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Ticket className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Create Ticket</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              This will create a new support ticket from this conversation. 
              All messages will be attached to the ticket for reference.
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter a brief description of the issue..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              autoFocus
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map(({ value, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                    priority === value
                      ? `${color} border-current`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Conversation</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {conversation.name || 
                conversation.participants.map(p => p.userName).join(', ')
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={isConverting || !subject.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Ticket className="w-4 h-4" />
            {isConverting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
