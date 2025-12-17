import React from 'react';

interface NivoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
}

const NivoLogo: React.FC<NivoLogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false,
  primaryColor = '#18181B',
  secondaryColor = '#DC2626',
  textColor
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={sizeClasses[size]}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`nivoGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <linearGradient id={`nivoAccent-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Main Circle */}
          <circle cx="50" cy="50" r="48" fill={`url(#nivoGrad-${size})`} />
          
          {/* Decorative Ring */}
          <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#nivoAccent-${size})`} strokeWidth="1" />
          
          {/* N Letter */}
          <path 
            d="M30 70V30H38L62 58V30H70V70H62L38 42V70H30Z" 
            fill="white"
          />
          
          {/* Accent Dot */}
          <circle cx="75" cy="35" r="6" fill="white" opacity="0.9" />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold ${textSizes[size]}`} style={{ color: textColor || primaryColor }}>
          Nivo
        </span>
      )}
    </div>
  );
};

export default NivoLogo;
