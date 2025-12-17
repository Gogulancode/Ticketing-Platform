import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

interface BrandingSettings {
  logoUrl: string | null;
  appName: string;
  appTagline: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, serverUrl } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  useEffect(() => {
    loadBranding();
  }, [serverUrl]);

  const loadBranding = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/branding`);
      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      }
    } catch (err) {
      console.log('Could not load branding settings');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.user, response.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Use branding colors or fallback to defaults
  const primaryColor = branding?.primaryColor || '#3B82F6';
  const logoUrl = branding?.logoUrl ? `${serverUrl}${branding.logoUrl}` : null;
  const appName = branding?.appName || 'Nivo Chat';
  const appTagline = branding?.appTagline || 'Enterprise Messaging Platform';
  const footerText = branding?.footerText || '© 2024 Nivo. All rights reserved.';

  // Create gradient style with lighter tones
  const gradientStyle = {
    background: `linear-gradient(135deg, ${adjustColor(primaryColor, 80)} 0%, ${adjustColor(primaryColor, 40)} 50%, ${primaryColor} 100%)`,
  };

  // Helper function to darken/lighten color
  function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={gradientStyle}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient circles */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${adjustColor(primaryColor, 100)} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${adjustColor(primaryColor, 100)} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute top-1/4 -left-20 w-64 h-64 rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
        />
        <div 
          className="absolute bottom-1/4 -right-16 w-48 h-48 rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
        />
        
        {/* Decorative lines/patterns */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Floating shapes */}
        <div 
          className="absolute top-20 right-1/4 w-4 h-4 rounded-full bg-white/20 animate-pulse"
        />
        <div 
          className="absolute bottom-32 left-1/4 w-3 h-3 rounded-full bg-white/30 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div 
          className="absolute top-1/3 left-16 w-2 h-2 rounded-full bg-white/25 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div 
          className="absolute bottom-1/3 right-20 w-5 h-5 rounded-full bg-white/15 animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4 overflow-hidden ring-4 ring-white/20">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="w-full h-full object-contain p-2" />
            ) : (
              <MessageSquare className="w-10 h-10" style={{ color: primaryColor }} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">{appName}</h1>
          <p className="text-white/80 mt-2 text-lg">{appTagline}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-gray-50/50"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all pr-12 bg-gray-50/50"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3.5 px-4 rounded-xl font-semibold focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ 
                backgroundColor: primaryColor,
                '--tw-ring-color': primaryColor,
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = adjustColor(primaryColor, -20)}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-sm mt-6">
          {footerText}
        </p>
      </div>
    </div>
  );
}
