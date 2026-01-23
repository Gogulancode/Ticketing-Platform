import { useState, useEffect } from 'react';
import { Circle, Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AgentAvailabilityStatus {
  agentId: number;
  name: string;
  email: string;
  isAvailable: boolean;
  shiftStatus: string;
  lastStatusChange: string | null;
  currentTicketCount: number;
  maxTicketsCapacity: number;
}

interface AvailabilityToggleProps {
  compact?: boolean;
}

export default function AvailabilityToggle({ compact = false }: AvailabilityToggleProps) {
  const [availability, setAvailability] = useState<AgentAvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAgent, setIsAgent] = useState(true);
  const { serverUrl, token } = useAuthStore();

  useEffect(() => {
    fetchAvailability();
  }, [serverUrl, token]);

  const fetchAvailability = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${serverUrl}/api/agents/availability/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
        setIsAgent(true);
      } else if (response.status === 404) {
        // Not an agent, hide the component
        setIsAgent(false);
      } else {
        setError('Failed to load');
      }
    } catch (err) {
      setError('Offline');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!availability || updating || !token) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      const newStatus = !availability.isAvailable;
      const shiftStatus = newStatus ? 'Available' : 'Shift Closed';
      
      const response = await fetch(`${serverUrl}/api/agents/availability/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: newStatus,
          shiftStatus,
        }),
      });
      
      if (response.ok) {
        setAvailability({
          ...availability,
          isAvailable: newStatus,
          shiftStatus,
          lastStatusChange: new Date().toISOString(),
        });
      } else {
        setError('Update failed');
      }
    } catch (err) {
      setError('Update failed');
      console.error('Error updating availability:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Don't render if user is not an agent
  if (!isAgent) return null;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
        <div className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-pulse" />
        <span className="text-xs text-slate-400">...</span>
      </div>
    );
  }

  // Error state
  if (error && !availability) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs text-red-600">Offline</span>
      </div>
    );
  }

  const isAvailable = availability?.isAvailable ?? false;

  if (compact) {
    return (
      <button
        onClick={toggleAvailability}
        disabled={updating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
          isAvailable
            ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            : 'bg-slate-100 hover:bg-slate-200 border border-slate-300'
        } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={`Click to ${isAvailable ? 'close shift' : 'open shift'}`}
      >
        <Circle
          className={`w-2.5 h-2.5 ${
            isAvailable ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400 fill-slate-400'
          } ${updating ? 'animate-pulse' : ''}`}
        />
        <span className={`text-xs font-medium ${isAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>
          {updating ? '...' : isAvailable ? 'Available' : 'Off'}
        </span>
        {!isAvailable && <Clock className="w-3 h-3 text-slate-400" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleAvailability}
      disabled={updating}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
        isAvailable
          ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          : 'bg-slate-100 hover:bg-slate-200 border border-slate-300'
      } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={`Click to ${isAvailable ? 'close shift' : 'open shift'}`}
    >
      <Circle
        className={`w-3 h-3 ${
          isAvailable ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400 fill-slate-400'
        } ${updating ? 'animate-pulse' : ''}`}
      />
      <div className="flex flex-col items-start">
        <span className={`text-sm font-medium ${isAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>
          {updating ? 'Updating...' : availability?.shiftStatus || 'Unknown'}
        </span>
        {availability?.currentTicketCount !== undefined && (
          <span className="text-[10px] text-slate-500">
            {availability.currentTicketCount}/{availability.maxTicketsCapacity} tickets
          </span>
        )}
      </div>
      {!isAvailable && <Clock className="w-4 h-4 text-slate-400 ml-1" />}
    </button>
  );
}
