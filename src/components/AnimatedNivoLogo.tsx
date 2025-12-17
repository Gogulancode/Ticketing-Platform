import React from 'react';

interface AnimatedNivoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AnimatedNivoLogo: React.FC<AnimatedNivoLogoProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizes = {
    xs: { logo: 16, ring: 24 },
    sm: { logo: 24, ring: 36 },
    md: { logo: 40, ring: 56 },
    lg: { logo: 56, ring: 80 },
    xl: { logo: 80, ring: 112 }
  };

  const { logo: logoSize, ring: ringSize } = sizes[size];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: ringSize, height: ringSize }}>
      {/* Outer spinning ring */}
      <svg
        className="absolute animate-spin"
        style={{ animationDuration: '3s', width: ringSize, height: ringSize }}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#spinnerGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="180 90"
        />
        <defs>
          <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--color-primary-500))" />
            <stop offset="50%" stopColor="rgb(var(--color-primary-400))" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inner pulsing logo */}
      <svg
        className="animate-pulse"
        style={{ width: logoSize, height: logoSize }}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="animatedLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--color-primary-500))" />
            <stop offset="100%" stopColor="rgb(var(--color-primary-700))" />
          </linearGradient>
        </defs>
        
        {/* Main N shape */}
        <path
          d="M12 36V12L24 28L36 12V36"
          stroke="url(#animatedLogoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Accent dot */}
        <circle
          cx="38"
          cy="12"
          r="3"
          fill="rgb(var(--color-secondary-500))"
        />
      </svg>
    </div>
  );
};

export default AnimatedNivoLogo;
