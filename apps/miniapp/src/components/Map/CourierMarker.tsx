import React from 'react';

interface CourierMarkerProps {
  heading: number; // 0-360 degrees
}

/**
 * Red triangle marker component that rotates based on courier heading.
 * 
 * Uses CSS transform-origin centering for smooth rotation animation.
 * The marker is 44px wide by 48px tall with a gradient fill and shadow.
 */
export const CourierMarker: React.FC<CourierMarkerProps> = ({ heading }) => {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: '44px',
        height: '48px',
        transformOrigin: 'center center',
        transform: `rotate(${heading}deg)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      <svg
        width="44"
        height="48"
        viewBox="0 0 44 48"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="courierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" /> {/* Red-500 */}
            <stop offset="100%" stopColor="#DC2626" /> {/* Red-600 */}
          </linearGradient>
          <filter id="courierShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>
        
        {/* Main red pyramid / triangle */}
        <polygon
          points="22,4 40,44 22,36 4,44"
          fill="url(#courierGradient)"
          stroke="#991B1B"
          strokeWidth="1.5"
          filter="url(#courierShadow)"
        />
        
        {/* Highlight stripe for depth */}
        <polygon
          points="22,8 36,40 22,33"
          fill="rgba(255,255,255,0.25)"
        />
      </svg>
    </div>
  );
};
