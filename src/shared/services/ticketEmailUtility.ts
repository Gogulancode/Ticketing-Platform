// Ticket Email Utility Service
// Handles email subject formatting and ticket ID tracking

import { formatTicketDateTime, getCurrentIST } from '../utils/dateUtils';

export interface TicketEmailConfig {
  replyToTemplate: string; // Template for reply-to email address
  subjectTemplate: string; // Template for email subject lines
  ticketNumberFormat: 'short' | 'full' | 'numeric'; // How to format ticket numbers
}

class TicketEmailUtilityService {
  private config: TicketEmailConfig = {
    replyToTemplate: 'noreply+ticket{ticketNumber}@company.com',
    subjectTemplate: '[Ticket #{ticketNumber}] {title}',
    ticketNumberFormat: 'short'
  };

  /**
   * Generate a readable ticket number from UUID
   */
  generateTicketNumber(ticketId: string, format: 'short' | 'full' | 'numeric' = 'short'): string {
    switch (format) {
      case 'full':
        return ticketId; // Full UUID
      case 'numeric':
        // Convert first 8 characters to a numeric-like format
        return parseInt(ticketId.replace(/-/g, '').substring(0, 8), 16).toString();
      case 'short':
      default:
        // Use first 8 characters of UUID (more readable)
        return ticketId.split('-')[0].toUpperCase();
    }
  }

  /**
   * Format email subject with ticket tracking
   */
  formatEmailSubject(ticketId: string, title: string, prefix?: string): string {
    const ticketNumber = this.generateTicketNumber(ticketId, this.config.ticketNumberFormat);
    const subjectPrefix = prefix ? `${prefix} ` : '';
    
    return `${subjectPrefix}[Ticket #${ticketNumber}] ${title}`;
  }

  /**
   * Format reply-to email address
   */
  formatReplyToEmail(ticketId: string): string {
    const ticketNumber = this.generateTicketNumber(ticketId, this.config.ticketNumberFormat);
    return this.config.replyToTemplate.replace('{ticketNumber}', ticketNumber);
  }

  /**
   * Generate email templates for different scenarios
   */
  generateEmailTemplates(ticketId: string, ticketTitle: string, ticketDetails: any) {
    const ticketNumber = this.generateTicketNumber(ticketId);
    
    return {
      // New ticket notification
      newTicketNotification: {
        subject: this.formatEmailSubject(ticketId, ticketTitle, 'New'),
        replyTo: this.formatReplyToEmail(ticketId),
        body: this.generateNewTicketEmailBody(ticketNumber, ticketDetails)
      },

      // Reply notification
      replyNotification: {
        subject: this.formatEmailSubject(ticketId, ticketTitle, 'Re:'),
        replyTo: this.formatReplyToEmail(ticketId),
        body: this.generateReplyEmailBody(ticketNumber, ticketDetails)
      },

      // Forward email
      forwardEmail: {
        subject: this.formatEmailSubject(ticketId, ticketTitle, 'FORWARDED'),
        replyTo: this.formatReplyToEmail(ticketId),
        body: this.generateForwardEmailBody(ticketNumber, ticketDetails)
      },

      // Status update
      statusUpdate: {
        subject: this.formatEmailSubject(ticketId, ticketTitle, 'Status Update'),
        replyTo: this.formatReplyToEmail(ticketId),
        body: this.generateStatusUpdateEmailBody(ticketNumber, ticketDetails)
      }
    };
  }

  /**
   * Resolve ticket number back to UUID (for processing email replies)
   */
  resolveTicketNumber(ticketNumber: string): string | null {
    try {
      // For demo purposes, create a consistent UUID from ticket number
      // In real implementation, this would query the database to find the actual ticket UUID
      const hash = ticketNumber.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const uuid = `${Math.abs(hash).toString(16).padStart(8, '0')}-1234-5678-9abc-${Date.now().toString(16).slice(-12)}`;
      console.log(`📧 Mock resolved ticket number ${ticketNumber} to UUID ${uuid}`);
      return uuid;
    } catch (error) {
      console.error('Error resolving ticket number:', error);
      return null;
    }
  }

  private generateNewTicketEmailBody(ticketNumber: string, details: any): string {
    return `
Dear ${details.customerName},

Your support ticket has been created and assigned ticket number #${ticketNumber}.

**Ticket Details:**
- Ticket Number: #${ticketNumber}
- Title: ${details.title}
- Priority: ${details.priority || 'Normal'}
- Status: ${details.status || 'Open'}
- Created: ${formatTicketDateTime(details.createdAt)}

**Description:**
${details.description}

Our support team will review your ticket and respond shortly. To ensure proper tracking, please include [Ticket #${ticketNumber}] in the subject line of any follow-up emails.

Thank you for contacting support.

Best regards,
Support Team
`;
  }

  private generateReplyEmailBody(ticketNumber: string, details: any): string {
    return `
Dear ${details.customerName},

There has been an update to your support ticket #${ticketNumber}.

**Latest Response:**
${details.latestComment || details.message}

**Current Status:** ${details.status || 'In Progress'}

To continue the conversation, simply reply to this email. Please keep [Ticket #${ticketNumber}] in the subject line.

View full ticket details: ${details.ticketUrl || '#'}

Best regards,
Support Team
`;
  }

  private generateForwardEmailBody(ticketNumber: string, details: any): string {
    return `
Dear Colleague,

Ticket #${ticketNumber} has been forwarded to you for attention.

**Ticket Details:**
- Ticket Number: #${ticketNumber}
- Title: ${details.title}
- Priority: ${details.priority || 'Normal'}
- Status: ${details.status || 'Open'}
- Customer: ${details.customerName} (${details.customerEmail})

**Original Description:**
${details.description}

${details.forwardMessage ? `**Forwarding Message:**\n${details.forwardMessage}\n` : ''}

Please review and take appropriate action. Include [Ticket #${ticketNumber}] in any email responses.

Best regards,
Support Team
`;
  }

  private generateStatusUpdateEmailBody(ticketNumber: string, details: any): string {
    return `
Dear ${details.customerName},

Your support ticket #${ticketNumber} status has been updated.

**Status Change:**
From: ${details.oldStatus || 'Previous Status'}
To: ${details.newStatus || details.status}

**Ticket Details:**
- Ticket Number: #${ticketNumber}
- Title: ${details.title}
- Updated: ${formatTicketDateTime(getCurrentIST())}

${details.statusComment ? `**Additional Notes:**\n${details.statusComment}` : ''}

If you have any questions, please reply to this email keeping [Ticket #${ticketNumber}] in the subject line.

Best regards,
Support Team
`;
  }

  /**
   * Parse ticket ID from email subject
   */
  parseTicketIdFromSubject(subject: string): string | null {
    const patterns = [
      /\[Ticket\s*#?([A-Z0-9]+)\]/i,    // [Ticket #ABC123] or [Ticket ABC123]
      /Ticket\s*#?([A-Z0-9]+)/i,        // Ticket #ABC123 or Ticket ABC123
      /Re:.*#([A-Z0-9]+)/i,             // Re: anything #ABC123
      /Fwd:.*#([A-Z0-9]+)/i             // Fwd: anything #ABC123
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) {
        // If it's a short format, we need to look it up in the database
        // For now, return the matched value
        return match[1];
      }
    }

    return null;
  }

  /**
   * Convert short ticket number back to full UUID
   * This would typically query the database
   */
  async resolveTicketId(shortNumber: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/tickets/resolve/${shortNumber}`);
      if (response.ok) {
        const result = await response.json();
        return result.ticketId;
      }
      return null;
    } catch (error) {
      console.error('Error resolving ticket ID:', error);
      return null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TicketEmailConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TicketEmailConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const ticketEmailUtility = new TicketEmailUtilityService();