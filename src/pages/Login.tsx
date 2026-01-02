import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login as apiLogin } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import NivoLogo from '../components/NivoLogo';
import { useBrandingSettings } from '../api/brandingApi';
import { API_CONFIG } from '../config/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  
  // Fetch branding settings
  const { data: branding, isLoading: brandingLoading } = useBrandingSettings();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Clear form when component mounts to prevent auto-fill issues
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  // Reset logo error when branding data changes
  useEffect(() => {
    setLogoError(false);
  }, [branding?.logoUrl]);

  // Apply theme colors dynamically
  useEffect(() => {
    if (branding?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    }
    if (branding?.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
    }
  }, [branding?.primaryColor, branding?.secondaryColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Step 1: Call API login to get JWT token
      console.log('🔐 Logging in...');
      const data = await apiLogin({ userName: email, password });
      
      // Step 2: Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.expires) {
        const expiresIso = new Date(data.expires).toISOString();
        localStorage.setItem('tokenExpiresAt', expiresIso);
      }
      console.log('✅ Token stored, expires:', data.expires);
      
      // Step 3: Fetch and store user permissions in AuthContext
      await authLogin();
      console.log('✅ User permissions loaded');
      
      // Step 4: Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('❌ Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build logo URL
  const logoUrl = branding?.logoUrl 
    ? `${API_CONFIG.BASE_URL.replace('/api', '')}${branding.logoUrl}`
    : null;

  // Debug: Log branding data
  console.log('🎨 Branding:', { branding, logoUrl, brandingLoading, logoError });

  // Parse login title (handle \n for line breaks) - Default to Nivo branding
  const loginTitle = (branding?.loginTitle || 'Hello,\nI\'m Nivo').replace(/\\n/g, '\n');
  const loginSubtitle = branding?.loginSubtitle || 'I\'m here to streamline your business operations and boost productivity. Let me help you save time and enhance efficiency across your enterprise!';
  const footerText = branding?.footerText || `© ${new Date().getFullYear()} Nivo. All rights reserved.`;
  const primaryColor = branding?.primaryColor || '#111827';
  const secondaryColor = branding?.secondaryColor || '#1f2937';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Left Side - Branding Panel (Similar to SaleSkip) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
        }}
      >
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rotate-12 rounded-lg"></div>
          <div className="absolute bottom-32 right-16 w-48 h-48 border border-white/20 -rotate-12 rounded-lg"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white/20 rotate-45 rounded-lg"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white max-w-lg">
          {/* Nivo Logo above heading */}
          <div className="mb-8">
            <NivoLogo size="xl" showText={true} primaryColor="#DC2626" secondaryColor="#991B1B" textColor="#FFFFFF" />
          </div>
          
          {/* Main Heading - Dynamic */}
          <h1 className="text-5xl font-bold mb-6 leading-tight whitespace-pre-line">
            {loginTitle}
          </h1>
          
          {/* Description - Dynamic */}
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            {loginSubtitle}
          </p>
          
          {/* Company Branding - Dynamic Footer */}
          <div className="mt-auto">
            <p className="text-white/60 text-sm">
              {footerText}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-lg">
          
          {/* Mobile Header - Company Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="bg-white rounded-2xl p-6 inline-block mb-6 shadow-sm">
              {brandingLoading ? (
                <div className="h-28 w-28 mx-auto animate-pulse bg-gray-200 rounded" />
              ) : logoUrl && !logoError ? (
                <img 
                  src={logoUrl} 
                  alt={branding?.appName || 'Company Logo'} 
                  className="h-28 w-auto mx-auto"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <img 
                  src="/BABAJI LOGO.png" 
                  alt="Babaji Shivram" 
                  className="h-28 w-auto mx-auto"
                />
              )}
            </div>
          </div>

          {/* Login Header */}
          <div className="text-center mb-12">
            {/* Company Logo for Desktop - Centered */}
            <div className="hidden lg:flex justify-center mb-6">
              {brandingLoading ? (
                <div className="h-32 w-32 animate-pulse bg-gray-200 rounded" />
              ) : logoUrl && !logoError ? (
                <img 
                  src={logoUrl} 
                  alt={branding?.appName || 'Company Logo'} 
                  className="h-32 w-auto bg-white"
                  style={{ backgroundColor: 'white' }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <img 
                  src="/BABAJI LOGO.png" 
                  alt="Babaji Shivram" 
                  className="h-32 w-auto"
                />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h2>
            <p className="text-gray-600 mb-2">
              Sign in to access the platform
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
            {/* Email Field */}
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg border-b-2 border-gray-200 focus:border-red-600 focus:outline-none transition-colors bg-transparent"
                placeholder="Enter your email"
                autoComplete="off"
                name="email"
                id="login-email"
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg border-b-2 border-gray-200 focus:border-red-600 focus:outline-none transition-colors bg-transparent pr-12"
                placeholder="Password"
                autoComplete="new-password"
                name="password"
                id="login-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-gray-600 text-sm">{error}</div>
              </div>
            )}
            
            {/* Login Button - Uses branding primary color */}
            <button
              type="submit"
              className="w-full py-4 text-white text-lg font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading && <NivoLogo size="sm" showText={false} />}
              <span>{loading ? 'Signing in...' : 'Login Now'}</span>
            </button>
            
          </form>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
