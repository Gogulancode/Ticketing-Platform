import { useState, useEffect } from 'react';
import { 
  Search, Plus, Users, Hash, MessageCircle, 
  MoreVertical, Ticket
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore, Conversation } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { chatApi } from '../services/api';
import { signalRService } from '../services/signalRService';
import ConversationList from '../components/chat/ConversationList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import NewConversationModal from '../components/chat/NewConversationModal';
import ConvertToTicketModal from '../components/chat/ConvertToTicketModal';

export default function Chat() {
  const { user } = useAuthStore();
  const { 
    conversations, 
    activeConversation, 
    messages,
    typingUsers,
    setConversations, 
    setActiveConversation, 
    setMessages,
    markAsRead
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showConvertToTicket, setShowConvertToTicket] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      signalRService.joinConversation(activeConversation.id);
      markAsRead(activeConversation.id);
    }
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    // Leave previous conversation
    if (activeConversation) {
      await signalRService.leaveConversation(activeConversation.id);
    }
    setActiveConversation(conversation);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !content.trim()) return;

    try {
      await signalRService.sendMessage(activeConversation.id, content);
    } catch (error) {
      // Fallback to REST API
      try {
        await chatApi.sendMessage(activeConversation.id, content);
        loadMessages(activeConversation.id);
      } catch (err) {
        toast.error('Failed to send message');
      }
    }
  };

  const handleConvertToTicket = async (subject: string, priority: string) => {
    if (!activeConversation) return;

    try {
      await chatApi.convertToTicket(activeConversation.id, subject, priority);
      toast.success('Conversation converted to ticket!');
      setShowConvertToTicket(false);
    } catch (error) {
      toast.error('Failed to convert to ticket');
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.name?.toLowerCase().includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query) ||
      conv.participants.some(p => p.userName.toLowerCase().includes(query))
    );
  });

  const typingInActive = typingUsers.filter(
    t => t.conversationId === activeConversation?.id
  );

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Search and New */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              title="New Conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={filteredConversations}
          activeConversation={activeConversation}
          onSelect={handleConversationSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {activeConversation.type === 'Group' ? (
                    <Users className="w-5 h-5 text-primary-600" />
                  ) : activeConversation.type === 'Channel' ? (
                    <Hash className="w-5 h-5 text-primary-600" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {activeConversation.name || 
                      activeConversation.participants
                        .filter(p => p.userId !== user?.id)
                        .map(p => p.userName)
                        .join(', ')
                    }
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConvertToTicket(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Convert to Ticket"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Create Ticket</span>
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageList 
              messages={messages} 
              currentUserId={user?.id || 0}
            />

            {/* Typing Indicator */}
            {typingInActive.length > 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                  </span>
                  {typingInActive.map(t => t.userName).join(', ')} {typingInActive.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}

            {/* Message Input */}
            <MessageInput 
              onSend={handleSendMessage}
              conversationId={activeConversation.id}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-4">
                Choose from your existing conversations or start a new one
              </p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreated={(conv) => {
            setShowNewConversation(false);
            loadConversations();
            setActiveConversation(conv);
          }}
        />
      )}

      {showConvertToTicket && activeConversation && (
        <ConvertToTicketModal
          conversation={activeConversation}
          onClose={() => setShowConvertToTicket(false)}
          onConvert={handleConvertToTicket}
        />
      )}
    </div>
  );
}
