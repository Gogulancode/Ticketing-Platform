import React, { useState, useEffect } from 'react';

interface RoleMaster {
  roleId: number;
  roleName: string;
  remarks?: string;
  updatedAt: string;
}

interface SyncResponse {
  updated: number;
  total: number;
  savedChanges: number;
  message: string;
}

interface SyncStatus {
  totalRoles: number;
  recentlyUpdated: number;
  lastSyncDate?: string;
  lastSyncedRole?: string;
  isConfigured: boolean;
}

interface ConnectionTest {
  connected: boolean;
  statusCode?: number;
  responseTime?: number;
  url?: string;
  hasData?: boolean;
  dataLength?: number;
  message: string;
  error?: string;
}

const RoleSync: React.FC = () => {
  const [roles, setRoles] = useState<RoleMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTest | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:5015/api/role-sync';

  useEffect(() => {
    loadRoles();
    loadStatus();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        throw new Error('Failed to load roles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setConnectionStatus(null);
      const response = await fetch(`${API_BASE}/test-connection`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
      } else {
        throw new Error('Failed to test connection');
      }
    } catch (err) {
      setConnectionStatus({
        connected: false,
        message: err instanceof Error ? err.message : 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const syncRoles = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setError(null);

      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSyncResult(result);
        await loadRoles();
        await loadStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (daysSinceUpdate: number) => {
    if (daysSinceUpdate <= 1) {
      return <span className="role-sync-badge role-sync-badge-success">Recent</span>;
    } else if (daysSinceUpdate <= 7) {
      return <span className="role-sync-badge role-sync-badge-warning">This Week</span>;
    } else {
      return <span className="role-sync-badge role-sync-badge-danger">Outdated</span>;
    }
  };

  return (
    <div className="container mx-auto p-6" style={{ maxWidth: '1200px' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .role-sync-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }
        .role-sync-card-header {
          background: #f8f9fa;
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
        }
        .role-sync-card-body {
          padding: 1rem;
        }
        .role-sync-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          margin: 0.25rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          text-decoration: none;
          font-size: 0.875rem;
        }
        .role-sync-btn:hover {
          background: #f8f9fa;
        }
        .role-sync-btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .role-sync-btn-primary:hover {
          background: #0056b3;
        }
        .role-sync-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .role-sync-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .role-sync-badge-success {
          background: #d4edda;
          color: #155724;
        }
        .role-sync-badge-warning {
          background: #fff3cd;
          color: #856404;
        }
        .role-sync-badge-danger {
          background: #f8d7da;
          color: #721c24;
        }
        .role-sync-alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .role-sync-alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .role-sync-alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .role-sync-grid {
          display: grid;
          gap: 1rem;
        }
        .role-sync-grid-cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        .role-sync-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: role-sync-spin 1s linear infinite;
        }
        @keyframes role-sync-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .role-sync-table {
          width: 100%;
          border-collapse: collapse;
        }
        .role-sync-table th, .role-sync-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        .role-sync-table th {
          background: #f8f9fa;
          font-weight: 500;
        }
        .role-sync-table tr:hover {
          background: #f8f9fa;
        }
        .role-sync-text-center {
          text-align: center;
        }
        .role-sync-text-muted {
          color: #6c757d;
        }
        .role-sync-status-connected {
          color: #28a745;
        }
        .role-sync-status-disconnected {
          color: #dc3545;
        }
        @media (max-width: 768px) {
          .role-sync-grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .role-sync-grid-cols-4 {
            grid-template-columns: 1fr;
          }
        }
        `
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Role Sync Management</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="role-sync-btn"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? (
              <span className="role-sync-spinner" style={{ marginRight: '0.5rem' }}></span>
            ) : (
              <span style={{ marginRight: '0.5rem' }}>🔗</span>
            )}
            Test Connection
          </button>
          <button
            className={`role-sync-btn ${status?.isConfigured ? 'role-sync-btn-primary' : ''}`}
            onClick={syncRoles}
            disabled={syncing || !status?.isConfigured}
          >
            {syncing ? (
              <span className="role-sync-spinner" style={{ marginRight: '0.5rem' }}></span>
            ) : (
              <span style={{ marginRight: '0.5rem' }}>⬇️</span>
            )}
            Sync Roles
          </button>
          <button className="role-sync-btn" onClick={loadRoles} disabled={loading}>
            {loading ? (
              <span className="role-sync-spinner" style={{ marginRight: '0.5rem' }}></span>
            ) : (
              <span style={{ marginRight: '0.5rem' }}>🔄</span>
            )}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="role-sync-alert role-sync-alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {syncResult && (
        <div className="role-sync-alert role-sync-alert-success">
          <strong>Sync Complete:</strong> {syncResult.message}
          <br />
          Updated: {syncResult.updated} | Total: {syncResult.total} | Changes Saved: {syncResult.savedChanges}
        </div>
      )}

      {/* Status Cards */}
      <div className="role-sync-grid role-sync-grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="role-sync-card">
          <div className="role-sync-card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500' }}>📊 Total Roles</h3>
          </div>
          <div className="role-sync-card-body">
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{status?.totalRoles || 0}</div>
            <p className="role-sync-text-muted" style={{ fontSize: '0.875rem' }}>In local database</p>
          </div>
        </div>

        <div className="role-sync-card">
          <div className="role-sync-card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500' }}>⏰ Recent Updates</h3>
          </div>
          <div className="role-sync-card-body">
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{status?.recentlyUpdated || 0}</div>
            <p className="role-sync-text-muted" style={{ fontSize: '0.875rem' }}>Updated this week</p>
          </div>
        </div>

        <div className="role-sync-card">
          <div className="role-sync-card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500' }}>🌐 API Status</h3>
          </div>
          <div className="role-sync-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {connectionStatus ? (
                <>
                  <span className={connectionStatus.connected ? 'role-sync-status-connected' : 'role-sync-status-disconnected'}>
                    {connectionStatus.connected ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>
                    {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </>
              ) : (
                <span className="role-sync-text-muted" style={{ fontSize: '0.875rem' }}>Not tested</span>
              )}
            </div>
            {connectionStatus?.responseTime && (
              <p className="role-sync-text-muted" style={{ fontSize: '0.875rem' }}>
                Response: {connectionStatus.responseTime.toFixed(0)}ms
              </p>
            )}
          </div>
        </div>

        <div className="role-sync-card">
          <div className="role-sync-card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500' }}>🔄 Last Sync</h3>
          </div>
          <div className="role-sync-card-body">
            <div style={{ fontSize: '0.875rem' }}>
              {status?.lastSyncDate ? (
                <>
                  <div style={{ fontWeight: '500' }}>{status.lastSyncedRole}</div>
                  <div className="role-sync-text-muted" style={{ fontSize: '0.875rem' }}>
                    {formatDate(status.lastSyncDate)}
                  </div>
                </>
              ) : (
                <span className="role-sync-text-muted">Never synced</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Test Results */}
      {connectionStatus && (
        <div className="role-sync-card">
          <div className="role-sync-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={connectionStatus.connected ? 'role-sync-status-connected' : 'role-sync-status-disconnected'}>
                {connectionStatus.connected ? '✅' : '❌'}
              </span>
              Connection Test Results
            </h3>
          </div>
          <div className="role-sync-card-body">
            <div className="role-sync-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: '500' }}>Status</p>
                <p className="role-sync-text-muted">{connectionStatus.message}</p>
              </div>
              {connectionStatus.statusCode && (
                <div>
                  <p style={{ fontWeight: '500' }}>HTTP Status</p>
                  <p className="role-sync-text-muted">{connectionStatus.statusCode}</p>
                </div>
              )}
              {connectionStatus.responseTime && (
                <div>
                  <p style={{ fontWeight: '500' }}>Response Time</p>
                  <p className="role-sync-text-muted">{connectionStatus.responseTime.toFixed(0)}ms</p>
                </div>
              )}
              {connectionStatus.hasData && (
                <div>
                  <p style={{ fontWeight: '500' }}>Data Received</p>
                  <p className="role-sync-text-muted">{connectionStatus.dataLength} characters</p>
                </div>
              )}
              {connectionStatus.url && (
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontWeight: '500' }}>API Endpoint</p>
                  <p className="role-sync-text-muted" style={{ wordBreak: 'break-all' }}>{connectionStatus.url}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roles Table */}
      <div className="role-sync-card">
        <div className="role-sync-card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>Role Master Data</h3>
            <span className="role-sync-badge role-sync-badge-success">{roles.length} roles</span>
          </div>
        </div>
        <div className="role-sync-card-body">
          {loading ? (
            <div className="role-sync-text-center" style={{ padding: '2rem' }}>
              <span className="role-sync-spinner" style={{ marginRight: '0.5rem' }}></span>
              <span>Loading roles...</span>
            </div>
          ) : roles.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="role-sync-table">
                <thead>
                  <tr>
                    <th>Role ID</th>
                    <th>Role Name</th>
                    <th>Remarks</th>
                    <th>Updated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.slice(0, 20).map((role) => {
                    const updatedDate = new Date(role.updatedAt);
                    const daysSinceUpdate = Math.floor(
                      (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <tr key={role.roleId}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {role.roleId}
                        </td>
                        <td style={{ fontWeight: '500' }}>{role.roleName}</td>
                        <td className="role-sync-text-muted">
                          {role.remarks || '-'}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {formatDate(role.updatedAt)}
                        </td>
                        <td>
                          {getStatusBadge(daysSinceUpdate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {roles.length > 20 && (
                <div className="role-sync-text-center role-sync-text-muted" style={{ padding: '1rem' }}>
                  Showing first 20 of {roles.length} roles
                </div>
              )}
            </div>
          ) : (
            <div className="role-sync-text-center role-sync-text-muted" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p>No roles found. Try syncing from the external API.</p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      {!status?.isConfigured && (
        <div className="role-sync-alert role-sync-alert-danger">
          <strong>Configuration Error:</strong> External API is not configured. Please check the application configuration.
        </div>
      )}
    </div>
  );
};

export default RoleSync;
