import { useState, useEffect } from 'react';
import { ticketsApi } from '../api/ticketsApi';

export interface DepartmentAnalytics {
  department: string;
  ticketCount: number;
  percentage: number;
  avgResolutionTime?: number;
}

export interface TicketAnalytics {
  totalTickets: number;
  departmentBreakdown: DepartmentAnalytics[];
  topDepartments: DepartmentAnalytics[];
  monthlyTrends?: { month: string; count: number }[];
}

// Mock data for demonstration - in production this would come from backend
const mockDepartmentAnalytics: DepartmentAnalytics[] = [
  { department: 'IT', ticketCount: 45, percentage: 35.7, avgResolutionTime: 2.5 },
  { department: 'HR', ticketCount: 28, percentage: 22.2, avgResolutionTime: 1.8 },
  { department: 'Finance', ticketCount: 22, percentage: 17.5, avgResolutionTime: 3.2 },
  { department: 'Operations', ticketCount: 18, percentage: 14.3, avgResolutionTime: 2.1 },
  { department: 'Training', ticketCount: 8, percentage: 6.3, avgResolutionTime: 1.5 },
  { department: 'Quality', ticketCount: 5, percentage: 4.0, avgResolutionTime: 2.8 },
];

export const useTicketAnalytics = () => {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In production, this would be an actual API call:
        // const response = await ticketsApi.departmentAnalytics();
        
        const totalTickets = mockDepartmentAnalytics.reduce((sum, dept) => sum + dept.ticketCount, 0);
        
        const analyticsData: TicketAnalytics = {
          totalTickets,
          departmentBreakdown: mockDepartmentAnalytics,
          topDepartments: mockDepartmentAnalytics
            .sort((a, b) => b.ticketCount - a.ticketCount)
            .slice(0, 5),
        };
        
        setAnalytics(analyticsData);
      } catch (err) {
        setError('Failed to fetch ticket analytics');
        console.error('Error fetching ticket analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: () => {
      setLoading(true);
    }
  };
};

// Helper functions for analytics
export const getDepartmentRanking = (analytics: TicketAnalytics | null): DepartmentAnalytics[] => {
  if (!analytics) return [];
  return analytics.departmentBreakdown.sort((a, b) => b.ticketCount - a.ticketCount);
};

export const getDepartmentById = (analytics: TicketAnalytics | null, department: string): DepartmentAnalytics | undefined => {
  if (!analytics) return undefined;
  return analytics.departmentBreakdown.find(d => d.department.toLowerCase() === department.toLowerCase());
};
