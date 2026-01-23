import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, AlertCircle } from 'lucide-react';
import { agentAvailabilityApi, AgentAvailabilityStatus } from '../../api/agentAvailabilityApi';

interface AvailabilityToggleProps {
  compact?: boolean;
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({ compact = false }) => {
  const [availability, setAvailability] = useState<AgentAvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAgent, setIsAgent] = useState(true); // Assume user is an agent initially

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentAvailabilityApi.getMyAvailability();
      setAvailability(data);
      setIsAgent(true);
    } catch (err) {
      // If not an agent, hide the component
      if (err instanceof Error && err.message.includes('not found')) {
        setIsAgent(false);
      } else {
        setError('Failed to load availability');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!availability || updating) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      const newStatus = !availability.isAvailable;
      const shiftStatus = newStatus ? 'Available' : 'Shift Closed';
      
      await agentAvailabilityApi.updateMyAvailability({
        isAvailable: newStatus,
        shiftStatus,
      });
      
      setAvailability({
        ...availability,
        isAvailable: newStatus,
        shiftStatus,
        lastStatusChange: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to update status');
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
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error && !availability) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-full">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Offline</span>
      </div>
    );
  }

  const isAvailable = availability?.isAvailable ?? false;

  return (
    <div className="relative group">
      <button
        onClick={toggleAvailability}
        disabled={updating}
        className={`flex items-center space-x-2 pl-3 pr-4 py-2 rounded-full transition-all duration-300 shadow-sm border ${
          isAvailable
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300 hover:shadow-md'
            : 'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-300 hover:border-gray-400 hover:shadow-md'
        } ${updating ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        {/* Toggle Switch */}
        <div className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
          isAvailable ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
            isAvailable ? 'left-5' : 'left-0.5'
          }`}>
            {isAvailable ? (
              <Phone className="w-2.5 h-2.5 text-green-600 absolute top-0.5 left-0.5" />
            ) : (
              <PhoneOff className="w-2.5 h-2.5 text-gray-500 absolute top-0.5 left-0.5" />
            )}
          </div>
        </div>
        
        {/* Status Label */}
        <div className="flex flex-col items-start">
          <span className={`text-sm font-semibold leading-tight ${
            isAvailable ? 'text-green-700' : 'text-gray-600'
          }`}>
            {updating ? 'Updating...' : isAvailable ? 'Available' : 'Off'}
          </span>
          {!compact && availability?.currentTicketCount !== undefined && (
            <span className="text-[10px] text-gray-500 leading-tight">
              {availability.currentTicketCount} active tickets
            </span>
          )}
        </div>
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        <div className="font-medium mb-1">
          {isAvailable ? '🟢 Accepting new tickets' : '🔴 Not accepting tickets'}
        </div>
        <div className="text-gray-300">
          Click to {isAvailable ? 'go off shift' : 'go on shift'}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default AvailabilityToggle;
