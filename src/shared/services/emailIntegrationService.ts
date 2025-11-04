// Email Integration Service for handling email replies
// This service processes incoming emails and converts them to ticket comments

import { ticketEmailUtility } from './ticketEmailUtility';

export interface EmailReply {
  ticketId: string;
  fromEmail: string;
  subject: string;
  body: string;
  messageId: string;
  inReplyTo?: string;
  receivedAt: string;
  toEmail?: string;
}

export interface EmailIntegrationConfig {
  processReplies: boolean;
  preventDuplicates: boolean;
  autoAcknowledge: boolean;
  extractTicketIdFromSubject: boolean;
  replyEmailDomain: string;
}

class EmailIntegrationService {
  private config: EmailIntegrationConfig = {
    processReplies: true,
    preventDuplicates: true,
    autoAcknowledge: true,
    extractTicketIdFromSubject: true,
    replyEmailDomain: 'support.company.com'
  };

  /**
   * Process incoming email reply and convert to ticket comment
   */
  async processIncomingEmail(email: EmailReply): Promise<boolean> {
    try {
      console.log('Processing incoming email:', email);

      // Extract ticket ID from email address or subject
      const ticketId = this.extractTicketId(email);
      if (!ticketId) {
        console.log('No ticket ID found in email, treating as new ticket');
        return false;
      }

      // Check if ticket exists and is active
      const ticketExists = await this.verifyTicket(ticketId);
      if (!ticketExists) {
        console.log(`Ticket ${ticketId} not found or inactive`);
        return false;
      }

      // Add email content as comment
      const success = await this.addEmailAsComment(ticketId, email);
      
      if (success) {
        console.log(`✅ Email successfully added as comment to ticket ${ticketId}`);
        // Send acknowledgment email to user with proper ticket tracking
        await this.sendAcknowledgmentEmail(email, ticketId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error processing email:', error);
      return false;
    }
  }

  /**
   * Extract ticket ID from email address or subject line
   */
  private extractTicketId(email: EmailReply): string | null {
    // Try to extract from subject line first (e.g., "Re: [Ticket #TKT123] Issue with...")
    const subjectPatterns = [
      /\[Ticket\s*#?([A-Z0-9]+)\]/i,     // [Ticket #TKT123] or [Ticket TKT123]
      /Ticket\s*ID:?\s*#?([A-Z0-9]+)/i, // Ticket ID: TKT123 or Ticket ID #TKT123
      /Re:.*#([A-Z0-9]+)/i,             // Re: anything #TKT123
      /Fwd:.*#([A-Z0-9]+)/i,            // Fwd: anything #TKT123
      /#([A-Z0-9]+)/                    // Simple #TKT123
    ];

    for (const pattern of subjectPatterns) {
      const match = email.subject.match(pattern);
      if (match) {
        const ticketNumber = match[1];
        console.log(`📧 Found ticket number: ${ticketNumber} - resolving to ticket ID for processing`);
        // Use the utility to resolve ticket number back to UUID
        return ticketEmailUtility.resolveTicketNumber(ticketNumber);
      }
    }

    // Try to extract from reply-to email pattern (UUID format)
    const emailPatterns = [
      /ticket-([a-f0-9-]+)-reply@/i,    // ticket-uuid-reply@domain.com
      /noreply\+ticket([a-f0-9-]+)@/i,  // noreply+ticketuuid@domain.com  
      /support\+([a-f0-9-]+)@/i         // support+uuid@domain.com
    ];

    for (const pattern of emailPatterns) {
      const match = email.toEmail?.match(pattern);
      if (match) {
        return match[1]; // Return the UUID directly
      }
    }

    // Check if ticketId is explicitly provided
    if (email.ticketId) {
      return email.ticketId;
    }

    return null;
  }

  /**
   * Verify if ticket exists and is active
   */
  private async verifyTicket(ticketId: string): Promise<boolean> {
    try {
      // Mock verification for now - in production this would call the API
      const response = await fetch(`/api/tickets/${ticketId}/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error verifying ticket:', error);
      return false;
    }
  }

  /**
   * Add email content as a comment to the ticket
   */
  private async addEmailAsComment(ticketId: string, email: EmailReply): Promise<boolean> {
    try {
      const commentData = {
        ticketId: ticketId,
        content: this.formatEmailAsComment(email),
        isInternal: false,
        source: 'email',
        authorEmail: email.fromEmail,
        createdAt: email.receivedAt
      };

      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding email as comment:', error);
      return false;
    }
  }

  /**
   * Format email content as a comment
   */
  private formatEmailAsComment(email: EmailReply): string {
    return `📧 **Email Reply from ${email.fromEmail}**\n\n${email.body}`;
  }

  /**
   * Send acknowledgment email to user with proper ticket number tracking
   */
  private async sendAcknowledgmentEmail(email: EmailReply, ticketId: string): Promise<void> {
    try {
      const ticketNumber = ticketEmailUtility.generateTicketNumber(ticketId);
      const subject = ticketEmailUtility.formatEmailSubject(ticketNumber, 'Your reply has been received', 'reply');
      
      const acknowledgmentData = {
        to: email.fromEmail,
        subject: subject,
        body: `Thank you for your reply. Your message has been added to ticket #${ticketNumber} and our support team will respond shortly.`,
        replyTo: this.generateReplyToEmail(ticketId)
      };

      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/emails/send-acknowledgment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(acknowledgmentData)
      });
      
      console.log(`📧 Acknowledgment sent with subject: ${subject}`);
    } catch (error) {
      console.error('Error sending acknowledgment:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EmailIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): EmailIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Generate reply-to email address for a ticket
   */
  generateReplyToEmail(ticketId: string): string {
    return `ticket-${ticketId}-reply@${this.config.replyEmailDomain}`;
  }
}

export const emailIntegrationService = new EmailIntegrationService();