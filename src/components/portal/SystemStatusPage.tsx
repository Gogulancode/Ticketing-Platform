import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { 
  useSystemStatus, 
  useActiveIncidents, 
  useRecentIncidents 
} from '../../api/customerPortalApi';

const SystemStatusPage: React.FC = () => {
  const { data: systemStatus, isLoading, refetch, dataUpdatedAt } = useSystemStatus();
  const { data: activeIncidents } = useActiveIncidents();
  const { data: recentIncidents } = useRecentIncidents(30);
  
  const [expandedIncidents, setExpandedIncidents] = React.useState<Set<number>>(new Set());

  const toggleIncident = (id: number) => {
    setExpandedIncidents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusConfig = (status: number) => {
    switch (status) {
      case 0: // Operational
        return { 
          icon: CheckCircle, 
          color: 'text-green-500', 
          bg: 'bg-green-50', 
          label: 'Operational' 
        };
      case 1: // Degraded
        return { 
          icon: AlertTriangle, 
          color: 'text-yellow-500', 
          bg: 'bg-yellow-50', 
          label: 'Degraded Performance' 
        };
      case 2: // Partial Outage
        return { 
          icon: AlertTriangle, 
          color: 'text-orange-500', 
          bg: 'bg-orange-50', 
          label: 'Partial Outage' 
        };
      case 3: // Major Outage
        return { 
          icon: XCircle, 
          color: 'text-gray-500', 
          bg: 'bg-red-50', 
          label: 'Major Outage' 
        };
      case 4: // Maintenance
        return { 
          icon: Clock, 
          color: 'text-gray-500', 
          bg: 'bg-red-50', 
          label: 'Under Maintenance' 
        };
      default:
        return { 
          icon: Activity, 
          color: 'text-gray-500', 
          bg: 'bg-gray-50', 
          label: 'Unknown' 
        };
    }
  };

  const getOverallStatusConfig = () => {
    if (!systemStatus) return { color: 'gray', label: 'Loading...' };
    
    const status = systemStatus.overallStatus.toLowerCase();
    if (status === 'operational') {
      return { color: 'green', label: 'All Systems Operational' };
    } else if (status.includes('degraded')) {
      return { color: 'yellow', label: 'Some Systems Degraded' };
    } else if (status.includes('outage')) {
      return { color: 'red', label: 'System Outage' };
    } else if (status.includes('maintenance')) {
      return { color: 'blue', label: 'Scheduled Maintenance' };
    }
    return { color: 'gray', label: systemStatus.overallStatus };
  };

  const overallConfig = getOverallStatusConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-gray-600" />
            System Status
          </h1>
          <p className="text-gray-600">
            Current status of all services and recent incidents
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className={`
        rounded-xl p-6 
        ${overallConfig.color === 'green' ? 'bg-green-50 border border-green-200' : ''}
        ${overallConfig.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' : ''}
        ${overallConfig.color === 'red' ? 'bg-red-50 border border-red-200' : ''}
        ${overallConfig.color === 'blue' ? 'bg-red-50 border border-red-200' : ''}
        ${overallConfig.color === 'gray' ? 'bg-gray-50 border border-gray-200' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${overallConfig.color === 'green' ? 'bg-green-100' : ''}
              ${overallConfig.color === 'yellow' ? 'bg-yellow-100' : ''}
              ${overallConfig.color === 'red' ? 'bg-red-100' : ''}
              ${overallConfig.color === 'blue' ? 'bg-red-100' : ''}
              ${overallConfig.color === 'gray' ? 'bg-gray-100' : ''}
            `}>
              {overallConfig.color === 'green' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {overallConfig.color === 'yellow' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
              {overallConfig.color === 'red' && <XCircle className="h-6 w-6 text-gray-600" />}
              {overallConfig.color === 'blue' && <Clock className="h-6 w-6 text-gray-600" />}
              {overallConfig.color === 'gray' && <Activity className="h-6 w-6 text-gray-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{overallConfig.label}</h2>
              <p className="text-sm text-gray-500">
                Last checked: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Incidents */}
      {activeIncidents && activeIncidents.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Active Incidents
          </h2>
          <div className="space-y-4">
            {activeIncidents.map((incident) => (
              <IncidentCard 
                key={incident.id} 
                incident={incident}
                isExpanded={expandedIncidents.has(incident.id)}
                onToggle={() => toggleIncident(incident.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Services Status */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Services</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="divide-y">
            {systemStatus?.services?.map((service) => {
              const config = getStatusConfig(service.status);
              const Icon = config.icon;
              
              return (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{service.serviceName}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`
                      inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                      ${config.bg} ${config.color}
                    `}>
                      {config.label}
                    </span>
                    {service.statusMessage && (
                      <p className="text-xs text-gray-500 mt-1">{service.statusMessage}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {(!systemStatus?.services || systemStatus.services.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No services configured
            </div>
          )}
        </div>
      </section>

      {/* Uptime Graph (Placeholder) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">90-Day Uptime</h2>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 90 }).map((_, index) => {
              const uptime = Math.random() > 0.05 ? 100 : Math.random() * 100;
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-sm ${
                    uptime === 100 ? 'bg-green-400' :
                    uptime > 95 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}
                  style={{ height: `${Math.max(10, uptime)}%` }}
                  title={`Day ${90 - index}: ${uptime.toFixed(1)}% uptime`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>90 days ago</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-400" /> 100%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-yellow-400" /> Degraded
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-400" /> Outage
              </span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* Recent Incidents History */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Incident History (30 days)</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          {recentIncidents && recentIncidents.length > 0 ? (
            <div className="divide-y">
              {recentIncidents.map((incident) => (
                <IncidentCard 
                  key={incident.id} 
                  incident={incident}
                  isExpanded={expandedIncidents.has(incident.id)}
                  onToggle={() => toggleIncident(incident.id)}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">No incidents in the past 30 days</p>
            </div>
          )}
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Stay Informed</h3>
        <p className="text-gray-100 mb-4">
          Subscribe to receive notifications about system status changes and scheduled maintenance.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-red-300"
          />
          <button className="px-6 py-2 bg-white text-gray-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
            Subscribe
          </button>
        </div>
      </section>
    </div>
  );
};

// Incident Card Component
interface IncidentCardProps {
  incident: {
    id: number;
    title: string;
    description: string;
    severity: number;
    severityDisplay: string;
    status: number;
    statusDisplay: string;
    affectedServiceName?: string;
    startedAt: string;
    resolvedAt?: string;
    updates?: {
      id: number;
      message: string;
      status: number;
      statusDisplay: string;
      createdAt: string;
      createdByName?: string;
    }[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ 
  incident, 
  isExpanded, 
  onToggle,
  compact = false 
}) => {
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 0: return 'text-yellow-600 bg-yellow-100';
      case 1: return 'text-orange-600 bg-orange-100';
      case 2: return 'text-gray-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isResolved = incident.status === 3; // Resolved status

  return (
    <div className={`${compact ? '' : 'bg-white rounded-xl border'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(incident.severity)}`}>
              {incident.severityDisplay}
            </span>
            {isResolved && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-green-600 bg-green-100">
                Resolved
              </span>
            )}
            {incident.affectedServiceName && (
              <span className="text-xs text-gray-500">
                • {incident.affectedServiceName}
              </span>
            )}
          </div>
          <h3 className="font-medium text-gray-900">{incident.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Started: {new Date(incident.startedAt).toLocaleString()}
            {incident.resolvedAt && (
              <> • Resolved: {new Date(incident.resolvedAt).toLocaleString()}</>
            )}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-12">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700">{incident.description}</p>
          </div>

          {incident.updates && incident.updates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Updates</h4>
              <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                {incident.updates.map((update) => (
                  <div key={update.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
                    <p className="text-sm text-gray-600">{update.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.createdAt).toLocaleString()}
                      {update.createdByName && ` • ${update.createdByName}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemStatusPage;
