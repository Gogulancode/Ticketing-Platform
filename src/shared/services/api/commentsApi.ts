// Comments API service for ticket comments functionality
export interface Comment {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string;
  isInternal: boolean;  // Backend response uses camelCase
  createdAt: string;
}

export interface AddCommentRequest {
  Content: string;  // Changed to PascalCase to match C# backend
  IsInternal: boolean;  // Changed to PascalCase to match C# backend
}

export interface AddCommentResponse {
  id: string;
  message: string;
}

class CommentsApi {
  private baseUrl = '/api/tickets-v2';

  /**
   * Get all comments for a ticket
   */
  async getComments(ticketId: string): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/${ticketId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a new comment to a ticket
   */
  async addComment(ticketId: string, request: AddCommentRequest): Promise<AddCommentResponse> {
    console.log('🚀 CommentsApi: Making request to add comment/note', {
      ticketId,
      request,
      url: `${this.baseUrl}/${ticketId}/comments`
    });

    const response = await fetch(`${this.baseUrl}/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
}

export const commentsApi = new CommentsApi();