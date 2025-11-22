import React from 'react';

interface BusinessHubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BusinessHubLogo: React.FC<BusinessHubLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="url(#businessGradient)"
          stroke="url(#borderGradient)"
          strokeWidth="2"
        />
        
        {/* Central Hub Icon */}
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="white"
        />
        
        {/* Connection Lines */}
        <g stroke="white" strokeWidth="3" strokeLinecap="round">
          {/* Top */}
          <line x1="50" y1="20" x2="50" y2="35" />
          {/* Top Right */}
          <line x1="70.7" y1="29.3" x2="60.6" y2="39.4" />
          {/* Right */}
          <line x1="80" y1="50" x2="65" y2="50" />
          {/* Bottom Right */}
          <line x1="70.7" y1="70.7" x2="60.6" y2="60.6" />
          {/* Bottom */}
          <line x1="50" y1="80" x2="50" y2="65" />
          {/* Bottom Left */}
          <line x1="29.3" y1="70.7" x2="39.4" y2="60.6" />
          {/* Left */}
          <line x1="20" y1="50" x2="35" y2="50" />
          {/* Top Left */}
          <line x1="29.3" y1="29.3" x2="39.4" y2="39.4" />
        </g>
        
        {/* Outer Nodes */}
        <g fill="white">
          <circle cx="50" cy="20" r="4" />
          <circle cx="70.7" cy="29.3" r="4" />
          <circle cx="80" cy="50" r="4" />
          <circle cx="70.7" cy="70.7" r="4" />
          <circle cx="50" cy="80" r="4" />
          <circle cx="29.3" cy="70.7" r="4" />
          <circle cx="20" cy="50" r="4" />
          <circle cx="29.3" cy="29.3" r="4" />
        </g>
        
        {/* Modern accents */}
        <g fill="rgba(255,255,255,0.3)">
          <circle cx="50" cy="35" r="2" />
          <circle cx="65" cy="50" r="2" />
          <circle cx="50" cy="65" r="2" />
          <circle cx="35" cy="50" r="2" />
        </g>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="businessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default BusinessHubLogo;