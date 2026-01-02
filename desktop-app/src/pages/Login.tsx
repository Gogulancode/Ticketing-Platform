import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

// Server presets - users can switch between environments
const SERVER_PRESETS = [
  { label: 'Staging', url: 'https://enrichbeauty.solutionsnextwave.com/api' },
  { label: 'Production', url: 'https://support.yourcompany.com/api' },
  { label: 'Local Dev', url: 'http://localhost:5016' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, serverUrl, setServerUrl } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Save the server URL before attempting login
    if (customServerUrl !== serverUrl) {
      setServerUrl(customServerUrl);
    }

    try {
      const response = await authApi.login(email, password);
      
      // Fetch fresh user data to get department and other details
      let fullUserData = response.user;
      try {
        const meResponse = await fetch(`${customServerUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${response.token}` }
        });
        if (meResponse.ok) {
          const freshData = await meResponse.json();
          fullUserData = { ...response.user, ...freshData };
        }
      } catch (e) {
        console.warn('Could not fetch full user data:', e);
      }
      
      login(fullUserData, response.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and server URL.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerPreset = (url: string) => {
    setCustomServerUrl(url);
    setServerUrl(url);
    toast.success('Server URL updated');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-6 overflow-hidden ring-4 ring-white/10">
            <img 
              src="/EnrichLogo.jpeg" 
              alt="Enrich" 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Enrich</h1>
          <p className="text-gray-400 text-lg font-light">Enterprise Support Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-gray-800/50">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Server Configuration */}
            <div className="border border-gray-700/50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Server: {customServerUrl.replace(/^https?:\/\//, '').split('/')[0]}</span>
                </div>
                <span className="text-xs text-gray-500">{showServerConfig ? '▲' : '▼'}</span>
              </button>
              
              {showServerConfig && (
                <div className="p-4 bg-gray-800/20 border-t border-gray-700/50 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {SERVER_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handleServerPreset(preset.url)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          customServerUrl === preset.url
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    onBlur={() => setServerUrl(customServerUrl)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-server.com/api"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email / Username
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email or username"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Powered by <span className="text-gray-400 font-medium">Enrich</span>
        </p>
      </div>
    </div>
  );
}
