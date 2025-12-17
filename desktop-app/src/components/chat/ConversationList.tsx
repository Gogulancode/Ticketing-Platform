import { Users, Hash, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Conversation } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelect: (conversation: Conversation) => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  isLoading
}: ConversationListProps) {
  const { user } = useAuthStore();

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    // For direct messages, show the other person's name
    const otherParticipants = conv.participants.filter(p => p.userId !== user?.id);
    return otherParticipants.map(p => p.userName).join(', ') || 'Unknown';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Group':
        return <Users className="w-5 h-5 text-primary-600" />;
      case 'Channel':
        return <Hash className="w-5 h-5 text-primary-600" />;
      default:
        return <MessageCircle className="w-5 h-5 text-primary-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No conversations yet</p>
          <p className="text-gray-400 text-xs mt-1">Start a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`w-full p-4 flex gap-3 hover:bg-gray-100 transition-colors text-left ${
            activeConversation?.id === conv.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            {getIcon(conv.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 truncate">
                {getConversationName(conv)}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatTime(conv.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 truncate pr-2">
                {conv.lastMessage || 'No messages yet'}
              </p>
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
