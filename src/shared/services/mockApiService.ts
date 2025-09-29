// Mock API endpoints for missing services
// This handles the 404 errors we're seeing in the console

export interface EmailHistoryEntry {
  id: string;
  ticketId: string;
  type: 'sent' | 'received' | 'bounced' | 'delivered';
  to: string;
  from: string;
  subject: string;
  body: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

class MockApiService {
  
  /**
   * Handle ticket email history
   * Endpoint: /api/tickets-v2/{ticketId}/email
   */
  async getTicketEmailHistory(ticketId: string): Promise<EmailHistoryEntry[]> {
    console.log(`📧 Mock: Fetching email history for ticket ${ticketId}`);
    
    // Mock email history data
    return [
      {
        id: 'email_1',
        ticketId,
        type: 'sent',
        to: 'user@example.com',
        from: 'support@company.com',
        subject: `[Ticket #${ticketId.split('-')[0].toUpperCase()}] Welcome to Support`,
        body: 'Thank you for contacting support...',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'delivered'
      },
      {
        id: 'email_2',
        ticketId,
        type: 'received',
        to: 'support@company.com',
        from: 'user@example.com',
        subject: `Re: [Ticket #${ticketId.split('-')[0].toUpperCase()}] Welcome to Support`,
        body: 'Thank you for the quick response...',
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        status: 'delivered'
      }
    ];
  }

  /**
   * Handle forward history
   * Endpoint: /api/tickets/{ticketId}/forwards
   */
  async getForwardHistory(ticketId: string): Promise<any[]> {
    console.log(`🔄 Mock: Fetching forward history for ticket ${ticketId}`);
    
    // Mock forward history - empty for now
    return [];
  }

  /**
   * Send email notification
   * Endpoint: /api/tickets-v2/{ticketId}/email
   */
  async sendEmailNotification(ticketId: string, emailData: any): Promise<{ success: boolean; messageId: string }> {
    console.log(`📤 Mock: Sending email for ticket ${ticketId}`, emailData);
    
    // Simulate email sending
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Resolve ticket number to full UUID
   * Endpoint: /api/tickets/resolve/{shortNumber}
   */
  async resolveTicketNumber(shortNumber: string): Promise<{ ticketId: string } | null> {
    console.log(`🔍 Mock: Resolving ticket number ${shortNumber}`);
    
    // Mock resolution - in real implementation, this would query the database
    // For now, just return a mock UUID that starts with the short number
    const mockUuid = `${shortNumber.toLowerCase()}-5b56-4615-a195-2b66ca608495`;
    
    return {
      ticketId: mockUuid
    };
  }

  /**
   * Create email integration webhook
   * This would be called by your email service when emails are received
   */
  async processIncomingEmail(emailData: any): Promise<{ success: boolean; action: string }> {
    console.log('📨 Mock: Processing incoming email', emailData);
    
    // Mock processing logic
    const hasTicketId = emailData.subject && /\[Ticket\s*#?[A-Z0-9]+\]/i.test(emailData.subject);
    
    if (hasTicketId) {
      return {
        success: true,
        action: 'added_as_comment'
      };
    } else {
      return {
        success: true,
        action: 'created_new_ticket'
      };
    }
  }

  /**
   * Initialize mock API endpoints
   * This would set up the endpoints to handle the 404 errors
   */
  initializeMockEndpoints(): void {
    // In a real application, you would set up these endpoints in your backend
    // For now, we'll just log that they're initialized
    console.log('🚀 Mock API endpoints initialized for:');
    console.log('  - GET /api/tickets-v2/{ticketId}/email');
    console.log('  - POST /api/tickets-v2/{ticketId}/email');
    console.log('  - GET /api/tickets/{ticketId}/forwards');
    console.log('  - GET /api/tickets/resolve/{shortNumber}');
    console.log('  - POST /api/webhooks/email-received');
  }

  /**
   * Mock email templates
   */
  getEmailTemplates() {
    return {
      newTicket: {
        subject: '[Ticket #{ticketNumber}] {title}',
        body: `Dear {customerName},

Your support ticket #{ticketNumber} has been created.

Title: {title}
Priority: {priority}
Status: {status}

Description:
{description}

Our team will respond shortly. Please keep the ticket number in any replies.

Best regards,
Support Team`
      },
      
      reply: {
        subject: 'Re: [Ticket #{ticketNumber}] {title}',
        body: `Dear {customerName},

There's an update to your ticket #{ticketNumber}.

{latestComment}

Current Status: {status}

Reply to this email to continue the conversation.

Best regards,
Support Team`
      },
      
      forward: {
        subject: '[FORWARDED] [Ticket #{ticketNumber}] {title}',
        body: `Dear Colleague,

Ticket #{ticketNumber} has been forwarded to you.

Title: {title}
Customer: {customerName} ({customerEmail})
Priority: {priority}

{description}

{forwardMessage}

Please review and take appropriate action.

Best regards,
Support System`
      }
    };
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();

// Initialize mock endpoints
mockApiService.initializeMockEndpoints();