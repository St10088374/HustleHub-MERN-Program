import React from 'react';

export const HPlusIcon = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`hplus-brand-mark ${className}`}
  >
    <defs>
      <linearGradient id="hp-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="hp-plus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <filter id="hp-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.3" />
      </filter>
    </defs>
    <rect width="64" height="64" rx="18" fill="url(#hp-grad-main)" filter="url(#hp-glow)" />
    <rect x="2" y="2" width="60" height="60" rx="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    <path
      d="M18 16V48M34 16V48M18 32H34"
      stroke="#ffffff"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M47 21V33M41 27H53"
      stroke="url(#hp-plus-grad)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BrandLogo = ({ size = 36, showText = true, className = '' }) => (
  <div className={`brand-identity-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
    <HPlusIcon size={size} />
    {showText && (
      <span className="brand-name-text">
        HustleHub+
      </span>
    )}
  </div>
);

export default BrandLogo;
