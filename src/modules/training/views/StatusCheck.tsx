import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

const StatusCheck: React.FC = () => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Backend Health', url: 'http://localhost:5015/api/auth/me', status: 'checking', message: 'Checking...' },
    { name: 'Modules API', url: 'http://localhost:5015/api/Modules', status: 'checking', message: 'Checking...' },
    { name: 'Users API', url: 'http://localhost:5015/api/users', status: 'checking', message: 'Checking...' },
    { name: 'Assessments API', url: 'http://localhost:5015/api/assessments', status: 'checking', message: 'Checking...' },
    { name: 'Upload Content API', url: 'http://localhost:5015/api/uploadedcontent/recent', status: 'checking', message: 'Checking...' }
  ]);

  const [authStatus, setAuthStatus] = useState<string>('');

  useEffect(() => {
    checkEndpoints();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    const user = localStorage.getItem('user');

    setAuthStatus(`
      Token: ${token ? '✅ Present' : '❌ Missing'}
      CurrentUser: ${currentUser ? '✅ Present' : '❌ Missing'}
      User: ${user ? '✅ Present' : '❌ Missing'}
    `);
  };

  const checkEndpoints = async () => {
    const updatedEndpoints = [...endpoints];

    for (let i = 0; i < updatedEndpoints.length; i++) {
      try {
        const response = await fetch(updatedEndpoints[i].url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          updatedEndpoints[i] = {
            ...updatedEndpoints[i],
            status: 'success',
            message: `✅ Status ${response.status}`,
            data: Array.isArray(data) ? `Array with ${data.length} items` : typeof data
          };
        } else {
          updatedEndpoints[i] = {
            ...updatedEndpoints[i],
            status: 'error',
            message: `❌ HTTP ${response.status}: ${response.statusText}`
          };
        }
      } catch (error) {
        updatedEndpoints[i] = {
          ...updatedEndpoints[i],
          status: 'error',
          message: `❌ Network Error: ${error}`
        };
      }

      setEndpoints([...updatedEndpoints]);
      // Small delay to show checking status
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Status Check</h1>
      
      {/* Authentication Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Status</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm font-mono">
          {authStatus}
        </pre>
      </div>

      {/* API Endpoints Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">API Endpoints Status</h2>
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(endpoint.status)}
                <div>
                  <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                  <p className="text-sm text-gray-500">{endpoint.url}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{endpoint.message}</p>
                {endpoint.data && (
                  <p className="text-xs text-gray-500">Data: {endpoint.data}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Refresh Status
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-2"
          >
            Clear Storage & Reload
          </button>
          <button 
            onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5015'}/swagger`, '_blank')} 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Open API Docs
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusCheck;
