import { useState, useEffect, useMemo } from 'react';
import { 
  mockAgentGroups, 
  mockTicketCategories, 
  mockDepartments,
  type AgentGroup, 
  type TicketCategory, 
  type Agent,
  type Department 
} from '../types/ticketGroups';

interface AgentRecommendation {
  agent: Agent;
  score: number;
  reason: string;
  group: AgentGroup;
}

export const useTicketAssignment = (departmentId?: string, categoryId?: string, subcategoryId?: string) => {
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setAgentGroups(mockAgentGroups);
        setCategories(mockTicketCategories);
        setDepartments(mockDepartments);
      } catch (err) {
        setError('Failed to fetch ticket assignment data');
        console.error('Error fetching ticket assignment data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get available categories for a department
  const availableCategories = useMemo(() => {
    if (!departmentId) return categories;
    
    const department = departments.find(d => d.id === departmentId);
    if (!department) return categories;

    return categories.filter(category => {
      const hasAssignedGroup = category.assignedGroups.some(groupId =>
        department.supportGroups.includes(groupId)
      );
      return hasAssignedGroup;
    });
  }, [departmentId, categories, departments]);

  // Get available subcategories for a category
  const availableSubcategories = useMemo(() => {
    if (!categoryId) return [];
    
    const category = categories.find(c => c.id === categoryId);
    return category?.subcategories.filter(sub => sub.isActive) || [];
  }, [categoryId, categories]);

  // Get recommended agents based on department, category, and subcategory
  const recommendedAgents = useMemo((): AgentRecommendation[] => {
    if (!departmentId || !categoryId) return [];

    const department = departments.find(d => d.id === departmentId);
    const category = categories.find(c => c.id === categoryId);
    const subcategory = subcategoryId ? 
      category?.subcategories.find(s => s.id === subcategoryId) : null;

    if (!department || !category) return [];

    // Find agent groups that can handle this request
    const eligibleGroups = agentGroups.filter(group => {
      // Group must be active
      if (!group.isActive) return false;
      
      // Group must support this department
      const supportsDepartment = department.supportGroups.includes(group.id);
      
      // Group must handle this category or subcategory
      const handlesCategory = group.categories.includes(category.id);
      const handlesSubcategory = subcategory ? 
        (subcategory.assignedGroups.includes(group.id)) : true;

      return supportsDepartment && handlesCategory && handlesSubcategory;
    });

    // Get agents from eligible groups and calculate recommendation scores
    const recommendations: AgentRecommendation[] = [];

    eligibleGroups.forEach(group => {
      group.agents.forEach(agent => {
        if (!agent.isActive) return;

        let score = 100;
        let reason = 'Available agent';

        // Factor in workload (lower is better)
        score -= agent.workload * 5;
        
        // Factor in response time (lower is better) 
        score -= agent.avgResponseTime * 2;

        // Bonus for specialization match
        if (subcategory) {
          const hasRelevantSpecialization = agent.specializations.some(spec =>
            subcategory.tags.some(tag => 
              spec.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(spec.toLowerCase())
            )
          );
          if (hasRelevantSpecialization) {
            score += 20;
            reason = `Specialized in ${agent.specializations.join(', ')}`;
          }
        }

        // Bonus for department match
        if (agent.department === department.code) {
          score += 15;
          reason += reason === 'Available agent' ? 
            `Department specialist (${agent.department})` : 
            ` + Department specialist`;
        }

        // Priority bonus for urgent subcategories
        if (subcategory?.priority === 'urgent') {
          if (agent.workload < 3) {
            score += 25;
            reason += ' + Low workload for urgent ticket';
          }
        }

        recommendations.push({
          agent,
          score: Math.max(0, score),
          reason,
          group
        });
      });
    });

    // Sort by score (highest first) and limit to top 10
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [departmentId, categoryId, subcategoryId, departments, categories, agentGroups]);

  // Get all agents in groups (for fallback)
  const allAvailableAgents = useMemo(() => {
    const allAgents: Agent[] = [];
    agentGroups.forEach(group => {
      if (group.isActive) {
        group.agents.forEach(agent => {
          if (agent.isActive && !allAgents.find(a => a.id === agent.id)) {
            allAgents.push(agent);
          }
        });
      }
    });
    return allAgents.sort((a, b) => a.workload - b.workload);
  }, [agentGroups]);

  // Get group statistics
  const groupStats = useMemo(() => {
    return agentGroups.map(group => ({
      ...group,
      totalAgents: group.agents.length,
      activeAgents: group.agents.filter(a => a.isActive).length,
      avgWorkload: group.agents.reduce((sum, a) => sum + a.workload, 0) / group.agents.length,
      avgResponseTime: group.agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / group.agents.length
    }));
  }, [agentGroups]);

  return {
    // Data
    agentGroups,
    categories,
    departments,
    availableCategories,
    availableSubcategories,
    
    // Recommendations
    recommendedAgents,
    allAvailableAgents,
    groupStats,
    
    // State
    loading,
    error,
    
    // Actions
    refetch: () => setLoading(true)
  };
};

// Helper functions
export const getAgentGroupById = (groups: AgentGroup[], id: string): AgentGroup | undefined => {
  return groups.find(g => g.id === id);
};

export const getCategoryById = (categories: TicketCategory[], id: string): TicketCategory | undefined => {
  return categories.find(c => c.id === id);
};

export const getSubcategoryById = (categories: TicketCategory[], categoryId: string, subcategoryId: string) => {
  const category = getCategoryById(categories, categoryId);
  return category?.subcategories.find(s => s.id === subcategoryId);
};

export const getDepartmentById = (departments: Department[], id: string): Department | undefined => {
  return departments.find(d => d.id === id);
};
