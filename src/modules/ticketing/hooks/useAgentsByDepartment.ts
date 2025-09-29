import { useState, useEffect } from 'react';

export interface Agent {
  id: string;
  name: string;
  email: string;
  department: string;
  isAgent: boolean;
}

// Mock data for agents - in production, this would come from an API
const mockAgents: Agent[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', department: 'IT', isAgent: true },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'IT', isAgent: true },
  { id: '3', name: 'Mike Davis', email: 'mike.davis@company.com', department: 'HR', isAgent: true },
  { id: '4', name: 'Lisa Chen', email: 'lisa.chen@company.com', department: 'Finance', isAgent: true },
  { id: '5', name: 'Tom Wilson', email: 'tom.wilson@company.com', department: 'IT', isAgent: true },
  { id: '6', name: 'Emma Brown', email: 'emma.brown@company.com', department: 'Operations', isAgent: true },
  { id: '7', name: 'David Lee', email: 'david.lee@company.com', department: 'Training', isAgent: true },
  { id: '8', name: 'Amy Taylor', email: 'amy.taylor@company.com', department: 'Quality', isAgent: true },
  { id: '9', name: 'Chris Martin', email: 'chris.martin@company.com', department: 'HR', isAgent: true },
  { id: '10', name: 'Rachel White', email: 'rachel.white@company.com', department: 'IT', isAgent: true },
];

export const useAgentsByDepartment = (targetDepartment?: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In production, this would be an actual API call:
        // const response = await fetch('/api/users/agents');
        // const agentsData = await response.json();
        
        const agentsData = mockAgents;
        setAllAgents(agentsData);
        
        // Filter agents by department if specified
        if (targetDepartment) {
          const filteredAgents = agentsData.filter(agent => 
            agent.department.toLowerCase() === targetDepartment.toLowerCase() && agent.isAgent
          );
          setAgents(filteredAgents);
        } else {
          // Show all agents if no department specified
          setAgents(agentsData.filter(agent => agent.isAgent));
        }
      } catch (err) {
        setError('Failed to fetch agents');
        console.error('Error fetching agents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [targetDepartment]);

  return {
    agents,
    allAgents,
    loading,
    error,
    refetch: () => {
      // Re-trigger the effect
      setLoading(true);
    }
  };
};

// Helper function to get agents for a specific department
export const getAgentsByDepartment = (department: string): Agent[] => {
  return mockAgents.filter(agent => 
    agent.department.toLowerCase() === department.toLowerCase() && agent.isAgent
  );
};

// Helper function to get all departments with agent counts
export const getDepartmentAgentCounts = (): { department: string; agentCount: number }[] => {
  const departmentCounts: { [key: string]: number } = {};
  
  mockAgents.filter(agent => agent.isAgent).forEach(agent => {
    departmentCounts[agent.department] = (departmentCounts[agent.department] || 0) + 1;
  });
  
  return Object.entries(departmentCounts).map(([department, agentCount]) => ({
    department,
    agentCount
  }));
};
