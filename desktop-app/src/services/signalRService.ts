import * as signalR from '@microsoft/signalr';
import { useChatStore, Message, UserPresence } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private maxReconnectAttempts = 10;

  async connect(): Promise<void> {
    const { serverUrl, token } = useAuthStore.getState();
    
    if (!token) {
      console.error('No auth token available');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${serverUrl}/hubs/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();

    try {
      await this.connection.start();
      console.log('SignalR Connected');
      useChatStore.getState().setConnected(true);
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      useChatStore.getState().setConnected(false);
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection state changes
    this.connection.onreconnecting(() => {
      console.log('SignalR Reconnecting...');
      useChatStore.getState().setConnected(false);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR Reconnected');
      useChatStore.getState().setConnected(true);
    });

    this.connection.onclose(() => {
      console.log('SignalR Connection Closed');
      useChatStore.getState().setConnected(false);
    });

    // Message handlers
    this.connection.on('ReceiveMessage', (message: Message) => {
      const { activeConversation, addMessage, incrementUnread } = useChatStore.getState();
      const { user } = useAuthStore.getState();
      
      // Add message to store
      addMessage(message);
      
      // If not the active conversation, increment unread
      if (activeConversation?.id !== message.conversationId) {
        incrementUnread(message.conversationId);
        
        // Show desktop notification
        if (message.senderId !== user?.id && window.electronAPI) {
          window.electronAPI.showNotification({
            title: message.senderName,
            body: message.content
          });
        }
      }
    });

    this.connection.on('MessageUpdated', (message: Message) => {
      useChatStore.getState().updateMessage(message);
    });

    this.connection.on('MessageDeleted', (messageId: number) => {
      useChatStore.getState().deleteMessage(messageId);
    });

    // Typing indicators
    this.connection.on('UserTyping', (conversationId: number, userId: number, userName: string) => {
      const { user } = useAuthStore.getState();
      if (userId !== user?.id) {
        useChatStore.getState().addTypingUser({ conversationId, userId, userName });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          useChatStore.getState().removeTypingUser(conversationId, userId);
        }, 3000);
      }
    });

    this.connection.on('UserStoppedTyping', (conversationId: number, userId: number) => {
      useChatStore.getState().removeTypingUser(conversationId, userId);
    });

    // Presence updates
    this.connection.on('UserPresenceChanged', (presence: UserPresence) => {
      useChatStore.getState().setPresence(presence.userId, presence);
    });

    // Read receipts
    this.connection.on('MessagesRead', (conversationId: number, userId: number) => {
      // Update read status if needed
      console.log(`User ${userId} read messages in conversation ${conversationId}`);
    });

    // Reactions
    this.connection.on('ReactionAdded', (messageId: number, reaction: { userId: number; userName: string; emoji: string }) => {
      const { messages, updateMessage } = useChatStore.getState();
      const message = messages.find(m => m.id === messageId);
      if (message) {
        updateMessage({
          ...message,
          reactions: [...message.reactions, { id: Date.now(), ...reaction }]
        });
      }
    });

    this.connection.on('ReactionRemoved', (messageId: number, userId: number, emoji: string) => {
      const { messages, updateMessage } = useChatStore.getState();
      const message = messages.find(m => m.id === messageId);
      if (message) {
        updateMessage({
          ...message,
          reactions: message.reactions.filter(r => !(r.userId === userId && r.emoji === emoji))
        });
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      useChatStore.getState().setConnected(false);
    }
  }

  async joinConversation(conversationId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinConversation', conversationId);
    }
  }

  async leaveConversation(conversationId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveConversation', conversationId);
    }
  }

  async sendMessage(conversationId: number, content: string, messageType = 'Text'): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SendMessage', conversationId, content, messageType);
    }
  }

  async editMessage(messageId: number, content: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('EditMessage', messageId, content);
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('DeleteMessage', messageId);
    }
  }

  async sendTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StartTyping', conversationId);
    }
  }

  async stopTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StopTyping', conversationId);
    }
  }

  async markAsRead(conversationId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('MarkAsRead', conversationId);
    }
  }

  async addReaction(messageId: number, emoji: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('AddReaction', messageId, emoji);
    }
  }

  async removeReaction(messageId: number, emoji: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('RemoveReaction', messageId, emoji);
    }
  }

  async updatePresence(status: string, statusMessage?: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('UpdatePresence', status, statusMessage);
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
