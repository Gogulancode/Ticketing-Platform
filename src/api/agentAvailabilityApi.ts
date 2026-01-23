import { API_BASE_URL } from '../config/api';

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface AgentAvailabilityStatus {
  agentId: number;
  name: string;
  email: string;
  isAvailable: boolean;
  shiftStatus: string;
  lastStatusChange: string | null;
  currentTicketCount: number;
  maxTicketsCapacity: number;
}

export interface UpdateAvailabilityRequest {
  isAvailable: boolean;
  shiftStatus?: string;
}

export interface UpdateAvailabilityResponse {
  message: string;
  isAvailable: boolean;
  shiftStatus: string;
}

export interface AllAgentsAvailability {
  agents: AgentAvailabilityStatus[];
  summary: {
    total: number;
    available: number;
    unavailable: number;
  };
}

export const agentAvailabilityApi = {
  /**
   * Get current user's availability status
   */
  async getMyAvailability(): Promise<AgentAvailabilityStatus> {
    const response = await fetch(`${API_BASE_URL}/api/agents/availability/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Agent profile not found');
      }
      throw new Error('Failed to get availability status');
    }
    
    return response.json();
  },

  /**
   * Update current user's availability status
   */
  async updateMyAvailability(request: UpdateAvailabilityRequest): Promise<UpdateAvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/api/agents/availability/me`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Agent profile not found');
      }
      throw new Error('Failed to update availability status');
    }
    
    return response.json();
  },

  /**
   * Get all agents with availability status (for managers/admins)
   */
  async getAllAgentsAvailability(): Promise<AllAgentsAvailability> {
    const response = await fetch(`${API_BASE_URL}/api/agents/availability/all`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get agents availability');
    }
    
    return response.json();
  },

  /**
   * Get available agents for ticket assignment
   */
  async getAvailableAgents(departmentId?: number): Promise<AgentAvailabilityStatus[]> {
    const url = departmentId 
      ? `${API_BASE_URL}/api/agents/availability/available?departmentId=${departmentId}`
      : `${API_BASE_URL}/api/agents/availability/available`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get available agents');
    }
    
    return response.json();
  },

  /**
   * Admin: Update any agent's availability
   */
  async updateAgentAvailability(agentId: number, request: UpdateAvailabilityRequest): Promise<UpdateAvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/api/agents/availability/${agentId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Agent not found');
      }
      throw new Error('Failed to update agent availability');
    }
    
    return response.json();
  },
};

export default agentAvailabilityApi;
