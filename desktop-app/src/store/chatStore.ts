import { create } from 'zustand';

export interface Conversation {
  id: number;
  name?: string;
  type: 'Direct' | 'Group' | 'Channel';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: Participant[];
  createdAt: string;
}

export interface Participant {
  userId: number;
  userName: string;
  role: 'Owner' | 'Admin' | 'Member';
  joinedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'Text' | 'Image' | 'File' | 'System';
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  parentMessageId?: number;
  reactions: Reaction[];
  attachments: Attachment[];
  isRead: boolean;
}

export interface Reaction {
  id: number;
  userId: number;
  userName: string;
  emoji: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileUrl: string;
}

export interface UserPresence {
  userId: number;
  status: 'Online' | 'Away' | 'Busy' | 'Offline';
  statusMessage?: string;
  lastSeen?: string;
}

export interface TypingUser {
  conversationId: number;
  userId: number;
  userName: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  presences: Map<number, UserPresence>;
  typingUsers: TypingUser[];
  isConnected: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (messageId: number) => void;
  setPresence: (userId: number, presence: UserPresence) => void;
  addTypingUser: (typing: TypingUser) => void;
  removeTypingUser: (conversationId: number, userId: number) => void;
  setConnected: (connected: boolean) => void;
  markAsRead: (conversationId: number) => void;
  incrementUnread: (conversationId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  presences: new Map(),
  typingUsers: [],
  isConnected: false,
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations]
  })),
  
  setActiveConversation: (conversation) => set({ 
    activeConversation: conversation,
    messages: []
  }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // Update conversation's last message
    const updatedConversations = state.conversations.map((conv) => {
      if (conv.id === message.conversationId) {
        return {
          ...conv,
          lastMessage: message.content,
          lastMessageAt: message.createdAt
        };
      }
      return conv;
    });
    
    // Sort by last message time
    updatedConversations.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    
    return {
      messages: [...state.messages, message],
      conversations: updatedConversations
    };
  }),
  
  updateMessage: (message) => set((state) => ({
    messages: state.messages.map((m) => 
      m.id === message.id ? message : m
    )
  })),
  
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== messageId)
  })),
  
  setPresence: (userId, presence) => set((state) => {
    const newPresences = new Map(state.presences);
    newPresences.set(userId, presence);
    return { presences: newPresences };
  }),
  
  addTypingUser: (typing) => set((state) => {
    const exists = state.typingUsers.some(
      (t) => t.conversationId === typing.conversationId && t.userId === typing.userId
    );
    if (exists) return state;
    return { typingUsers: [...state.typingUsers, typing] };
  }),
  
  removeTypingUser: (conversationId, userId) => set((state) => ({
    typingUsers: state.typingUsers.filter(
      (t) => !(t.conversationId === conversationId && t.userId === userId)
    )
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  markAsRead: (conversationId) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    )
  })),
  
  incrementUnread: (conversationId) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId 
        ? { ...conv, unreadCount: conv.unreadCount + 1 } 
        : conv
    )
  }))
}));
