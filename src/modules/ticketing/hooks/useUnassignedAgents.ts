import { useState, useEffect } from 'react';
import { settingsApi } from '../../../shared/services/api/settingsApi';
import type { Agent } from '../../../shared/services/api/settingsApi';

export const useUnassignedAgents = () => {
  const [unassignedAgents, setUnassignedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnassignedAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const agents = await settingsApi.getUnassignedAgents();
      setUnassignedAgents(agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unassigned agents');
      console.error('Failed to fetch unassigned agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassignedAgents();
  }, []);

  return {
    unassignedAgents,
    loading,
    error,
    refetch: fetchUnassignedAgents
  };
};