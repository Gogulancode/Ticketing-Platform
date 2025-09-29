import React, { useState, useEffect } from 'react';

interface RoleSyncStatus {
  totalRoles: number;
  recentlyUpdated: number;
  lastSyncTime?: string;
  isConfigured: boolean;
  lastSyncStatus?: string;
}

interface RoleSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  newCount: number;
  updatedCount: number;
  syncTime: string;
  responseTimeMs: number;
}

interface SyncLog {
  id: number;
  syncTime: string;
  success: boolean;
  message: string;
  syncedCount: number;
  newCount: number;
  updatedCount: number;
  responseTimeMs: number;
}

const RoleSyncAdmin: React.FC = () => {
  const [status, setStatus] = useState<RoleSyncStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<RoleSyncResult | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    loadStatus();
    loadSyncLogs();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('http://localhost:5015/api/rolesync/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await fetch('http://localhost:5015/api/rolesync/logs?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSyncLogs(data);
      }
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setAlert(null);
    
    try {
      const response = await fetch('http://localhost:5015/api/rolesync/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAlert({
          type: 'success',
          message: `Connection test successful! ${result.message}`
        });
      } else {
        setAlert({
          type: 'error',
          message: `Connection test failed: ${result.message}`
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: `Connection test error: ${error}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const performManualSync = async () => {
    setIsLoading(true);
    setAlert(null);
    
    try {
      const response = await fetch('http://localhost:5015/api/rolesync/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setLastSyncResult(result);
      
      if (result.success) {
        setAlert({
          type: 'success',
          message: result.message
        });
        await loadStatus();
        await loadSyncLogs();
      } else {
        setAlert({
          type: 'error',
          message: `Sync failed: ${result.message}`
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: `Sync error: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatResponseTime = (ms: number) => {
    return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  if (!status) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-sm p-sm max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Role Sync Administration</h1>
        <button 
          onClick={() => window.location.reload()} 
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {alert && (
        <div className={`rounded-md p-4 ${
          alert.type === 'error' ? 'bg-red-50 border border-red-200' : 
          alert.type === 'success' ? 'bg-green-50 border border-green-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${
                alert.type === 'error' ? 'text-red-400' : 
                alert.type === 'success' ? 'text-green-400' : 
                'text-blue-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${
                alert.type === 'error' ? 'text-red-800' : 
                alert.type === 'success' ? 'text-green-800' : 
                'text-blue-800'
              }`}>
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      <div className="bg-white shadow rounded-lg p-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-xs flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuration Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              status.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.isConfigured ? "Configured" : "Not Configured"}
            </span>
            <span className="text-sm text-gray-600">External API</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="font-medium">{status.totalRoles}</span>
            <span className="text-sm text-gray-600">Total Roles</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium">{status.recentlyUpdated}</span>
            <span className="text-sm text-gray-600">Updated Today</span>
          </div>
        </div>
      </div>

      {/* Last Sync Status */}
      <div className="bg-white shadow rounded-lg p-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-xs flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last Sync Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {status.lastSyncStatus === 'Success' ? (
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">
                {status.lastSyncStatus || 'Never synced'}
              </span>
            </div>
            {status.lastSyncTime && (
              <p className="text-sm text-gray-600">
                {formatDate(status.lastSyncTime)}
              </p>
            )}
          </div>
          {lastSyncResult && (
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Synced:</span> {lastSyncResult.syncedCount} roles</p>
              <p><span className="font-medium">New:</span> {lastSyncResult.newCount}</p>
              <p><span className="font-medium">Updated:</span> {lastSyncResult.updatedCount}</p>
              <p><span className="font-medium">Response Time:</span> {formatResponseTime(lastSyncResult.responseTimeMs)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-xs">Manual Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={testConnection} 
            disabled={isTesting || !status.isConfigured}
            className={`px-3 py-2 border rounded-md flex items-center ${
              isTesting || !status.isConfigured 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            Test Connection
          </button>
          
          <button 
            onClick={performManualSync} 
            disabled={isLoading || !status.isConfigured}
            className={`px-3 py-2 rounded-md flex items-center ${
              isLoading || !status.isConfigured 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Manual Sync
          </button>
        </div>
        
        {!status.isConfigured && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ External API is not configured. Please check your app settings.
          </p>
        )}
      </div>

      {/* Automated Sync Info */}
      <div className="bg-white shadow rounded-lg p-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-xs">Automated Sync</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-blue-800">Scheduled Daily Sync</span>
          </div>
          <p className="text-sm text-blue-700">
            The system automatically syncs role data from the external API every day at 2:00 AM.
            Manual sync can be performed at any time using the button above.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Next scheduled sync: Tomorrow at 2:00 AM
          </p>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-white shadow rounded-lg p-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-xs">Recent Sync History</h2>
        {syncLogs.length > 0 ? (
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {log.success ? (
                        <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-medium">
                        {formatDate(log.syncTime)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.message}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {log.success && (
                      <div>
                        <p>{log.syncedCount} synced</p>
                        <p>{log.newCount} new, {log.updatedCount} updated</p>
                        <p>{formatResponseTime(log.responseTimeMs)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No sync history available</p>
        )}
      </div>
    </div>
  );
};

export default RoleSyncAdmin;

