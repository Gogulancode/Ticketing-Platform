// Ticket Forward Service
// Handles forwarding tickets to other agents, departments, or external parties

import { ticketEmailUtility } from './ticketEmailUtility';
import { formatTicketDateTime } from '../utils/dateUtils';

export interface ForwardRequest {
  ticketId: string;
  toEmail: string;
  message?: string;
  includeHistory: boolean;
  forwardType: 'agent' | 'department' | 'external';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  ticketNumber?: string;
  ticketTitle?: string;
}

export interface ForwardResponse {
  success: boolean;
  forwardId: string;
  message: string;
  sentAt: string;
}

export interface ForwardHistory {
  id: string;
  ticketId: string;
  forwardedBy: string;
  forwardedTo: string;
  forwardType: string;
  message?: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'acknowledged';
}

class TicketForwardService {
  /**
   * Forward a ticket to another agent or department
   */
  async forwardTicket(request: ForwardRequest): Promise<ForwardResponse> {
    try {
      console.log('Forwarding ticket:', request);

      // Validate forward request
      const validation = await this.validateForwardRequest(request);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get ticket details
      const ticketDetails = await this.getTicketDetails(request.ticketId);
      if (!ticketDetails) {
        throw new Error('Ticket not found');
      }

      // Prepare forward email content
      const emailContent = await this.prepareForwardEmail(ticketDetails, request);

      // Send forward email
      const emailResponse = await this.sendForwardEmail(emailContent);
      if (!emailResponse.success) {
        throw new Error('Failed to send forward email');
      }

      // Log forward action
      const forwardId = await this.logForwardAction(request, emailResponse);

      // Add system comment to ticket
      await this.addForwardComment(request);

      // Update ticket assignment if forwarding to internal agent
      if (request.forwardType === 'agent') {
        await this.updateTicketAssignment(request.ticketId, request.toEmail);
      }

      return {
        success: true,
        forwardId,
        message: 'Ticket forwarded successfully',
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error forwarding ticket:', error);
      return {
        success: false,
        forwardId: '',
        message: error instanceof Error ? error.message : 'Forward failed',
        sentAt: new Date().toISOString()
      };
    }
  }

  /**
   * Validate forward request
   */
  private async validateForwardRequest(request: ForwardRequest): Promise<{ valid: boolean; error?: string }> {
    if (!request.ticketId) {
      return { valid: false, error: 'Ticket ID is required' };
    }

    if (!request.toEmail || !this.isValidEmail(request.toEmail)) {
      return { valid: false, error: 'Valid email address is required' };
    }

    // Check if forwarding to self
    const currentAgent = await this.getCurrentAgent();
    if (currentAgent?.email === request.toEmail) {
      return { valid: false, error: 'Cannot forward ticket to yourself' };
    }

    return { valid: true };
  }

  /**
   * Get ticket details including history if requested
   */
  private async getTicketDetails(ticketId: string): Promise<any> {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ticket details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      return null;
    }
  }

  /**
   * Prepare forward email content
   */
  private async prepareForwardEmail(ticketDetails: any, request: ForwardRequest): Promise<any> {
    // Use the ticketEmailUtility for proper ticket number generation and subject formatting
    const ticketNumber = request.ticketNumber || ticketEmailUtility.generateTicketNumber(request.ticketId);
    const ticketTitle = request.ticketTitle || ticketDetails.title || 'Support Request';
    
    // Use the utility to format the forward subject properly
    const subject = ticketEmailUtility.formatEmailSubject(ticketNumber, ticketTitle, 'forward');
    
    let body = `
Dear Colleague,

A ticket has been forwarded to you for attention.

**Ticket Details:**
- Ticket ID: #${ticketNumber} (${request.ticketId})
- Title: ${ticketTitle}
- Priority: ${ticketDetails.priority?.name || 'Not set'}
- Status: ${ticketDetails.status?.name || 'Open'}
- Created: ${formatTicketDateTime(ticketDetails.createdAt)}
- Customer: ${ticketDetails.customerName} (${ticketDetails.customerEmail})

**Description:**
${ticketDetails.description}
`;

    if (request.message) {
      body += `\n**Forwarding Message:**\n${request.message}\n`;
    }

    if (request.includeHistory) {
      const comments = await this.getTicketComments(request.ticketId);
      if (comments && comments.length > 0) {
        body += `\n**Ticket History:**\n`;
        comments.forEach((comment: any) => {
          body += `\n${formatTicketDateTime(comment.createdAt)} - ${comment.authorName}:\n${comment.body}\n---\n`;
        });
      }
    }

    body += `\nTo reply to this ticket, please include [Ticket #${ticketNumber}] in your email subject line.\n\nBest regards,\nTicketing System`;

    return {
      to: request.toEmail,
      subject,
      body,
      ticketId: request.ticketId,
      ticketNumber,
      forwardType: request.forwardType
    };
  }

  /**
   * Send forward email
   */
  private async sendForwardEmail(emailContent: any): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/emails/send-forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.messageId };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Error sending forward email:', error);
      return { success: false };
    }
  }

  /**
   * Log forward action for audit trail
   */
  private async logForwardAction(request: ForwardRequest, emailResponse: any): Promise<string> {
    const forwardId = `fwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logData = {
      id: forwardId,
      ticketId: request.ticketId,
      forwardedBy: (await this.getCurrentAgent())?.email || 'system',
      forwardedTo: request.toEmail,
      forwardType: request.forwardType,
      message: request.message,
      messageId: emailResponse.messageId,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/forwards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Error logging forward action:', error);
    }

    return forwardId;
  }

  /**
   * Add forward comment to ticket
   */
  private async addForwardComment(request: ForwardRequest): Promise<void> {
    const commentText = `🔄 **Ticket Forwarded**\nForwarded to: ${request.toEmail}\nType: ${request.forwardType}${request.message ? `\nMessage: ${request.message}` : ''}`;

    try {
      await fetch(`/api/tickets/${request.ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Content: commentText,
          IsInternal: true,
          Source: 'system'
        })
      });
    } catch (error) {
      console.error('Error adding forward comment:', error);
    }
  }

  /**
   * Update ticket assignment if forwarding to internal agent
   */
  private async updateTicketAssignment(ticketId: string, agentEmail: string): Promise<void> {
    try {
      // Get agent ID by email
      const agent = await this.getAgentByEmail(agentEmail);
      if (agent) {
        await fetch(`/api/tickets/${ticketId}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignedAgentId: agent.id,
            assignedBy: 'forward_action'
          })
        });
      }
    } catch (error) {
      console.error('Error updating ticket assignment:', error);
    }
  }

  /**
   * Get forward history for a ticket
   */
  async getForwardHistory(ticketId: string): Promise<ForwardHistory[]> {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/forwards`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching forward history:', error);
      return [];
    }
  }

  /**
   * Helper functions
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async getCurrentAgent(): Promise<{ id: string; email: string } | null> {
    // Mock implementation - replace with actual user context
    return {
      id: 'current_agent_id',
      email: 'current.agent@company.com'
    };
  }

  private async getAgentByEmail(email: string): Promise<{ id: string; email: string } | null> {
    try {
      const response = await fetch(`/api/agents/by-email/${encodeURIComponent(email)}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching agent by email:', error);
      return null;
    }
  }

  private async getTicketComments(ticketId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching ticket comments:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ticketForwardService = new TicketForwardService();