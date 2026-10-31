import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const HospitalLogo: React.FC<LogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Left Pillar Deep Ocean Blue Gradient */}
        <linearGradient id="leftPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B5596" />
          <stop offset="100%" stopColor="#083158" />
        </linearGradient>

        {/* Right Pillar Emerald / Teal Gradient */}
        <linearGradient id="rightPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#02B29A" />
          <stop offset="100%" stopColor="#008F7E" />
        </linearGradient>

        {/* Dynamic Curved Ribbon Wave Gradient */}
        <linearGradient id="ribbonGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#0496A6" />
          <stop offset="100%" stopColor="#02B29A" />
        </linearGradient>

        {/* Soft Drop Shadow for Depth */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        {/* Left Column of H */}
        <path
          d="M12 20C12 14.477 16.477 10 22 10H38V100H22C16.477 100 12 95.523 12 90V20Z"
          fill="url(#leftPillarGrad)"
        />

        {/* Right Column of H */}
        <path
          d="M62 10H78C83.523 10 88 14.477 88 20V90C88 95.523 83.523 100 78 100H62V10Z"
          fill="url(#rightPillarGrad)"
        />

        {/* White Medical Cross (+) inside the lower right pillar */}
        {/* Vertical arm */}
        <rect x="71" y="61" width="8" height="22" rx="2" fill="#FFFFFF" />
        {/* Horizontal arm */}
        <rect x="64" y="68" width="22" height="8" rx="2" fill="#FFFFFF" />

        {/* Outer White Contour / Channel for the flowing ribbon */}
        <path
          d="M10 82C11.5 70 20 54 36 49C52 44 65 31 73 17C80 23 87 28 90 29C79 46 64 58 48 62C30 67 18 78 10 82Z"
          fill="#FFFFFF"
        />

        {/* Dynamic Wave / Ribbon connecting the H */}
        <path
          d="M11 78C13 67 22 55 37 51C53 46 66 33 74 20C79 24 84 27 87 28C76 43 62 55 47 59C29 64 18 75 11 78Z"
          fill="url(#ribbonGrad)"
        />
      </g>
    </svg>
  );
};
