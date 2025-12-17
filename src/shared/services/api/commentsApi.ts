// Comments API service for ticket comments functionality
export interface CommentAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string;
  isInternal: boolean;  // Backend response uses camelCase
  createdAt: string;
  attachments: CommentAttachment[]; // Attachments linked to this comment
}

export interface AddCommentRequest {
  Content: string;  // Changed to PascalCase to match C# backend
  IsInternal: boolean;  // Changed to PascalCase to match C# backend
}

export interface AddCommentWithAttachmentsRequest {
  content: string;
  isInternal: boolean;
  attachments?: File[];
}

export interface AddCommentResponse {
  id: string;
  message: string;
  attachments?: CommentAttachment[];
}

import { API_CONFIG } from '../../../config/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

class CommentsApi {
  private baseUrl = `${API_CONFIG.BASE_URL}/tickets-v2`;

  private getHeaders(): Record<string, string> {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private getAuthHeader(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all comments for a ticket
   */
  async getComments(ticketId: string): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/comments`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a new comment to a ticket (without attachments)
   */
  async addComment(ticketId: string, request: AddCommentRequest): Promise<AddCommentResponse> {
    console.log('🚀 CommentsApi: Making request to add comment/note', {
      ticketId,
      request,
      url: `${this.baseUrl}/${ticketId}/comments`
    });

    const response = await fetch(`${this.baseUrl}/${ticketId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    console.log('📡 CommentsApi: Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ CommentsApi: Request failed', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to add comment: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ CommentsApi: Success response', result);
    return result;
  }

  /**
   * Add a new comment with attachments to a ticket
   */
  async addCommentWithAttachments(
    ticketId: string, 
    request: AddCommentWithAttachmentsRequest
  ): Promise<AddCommentResponse> {
    console.log('🚀 CommentsApi: Making request to add comment with attachments', {
      ticketId,
      content: request.content,
      isInternal: request.isInternal,
      attachmentCount: request.attachments?.length || 0,
      url: `${this.baseUrl}/${ticketId}/comments-with-attachments`
    });

    const formData = new FormData();
    formData.append('content', request.content);
    formData.append('isInternal', String(request.isInternal));
    
    if (request.attachments && request.attachments.length > 0) {
      request.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await fetch(`${this.baseUrl}/${ticketId}/comments-with-attachments`, {
      method: 'POST',
      headers: this.getAuthHeader(), // Don't set Content-Type for FormData
      body: formData,
    });

    console.log('📡 CommentsApi: Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ CommentsApi: Request failed', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to add comment: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ CommentsApi: Success response', result);
    return result;
  }
}

export const commentsApi = new CommentsApi();