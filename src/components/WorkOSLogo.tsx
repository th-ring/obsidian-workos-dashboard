import React from 'react';

interface WorkOSLogoProps {
  className?: string;
  size?: number;
  variant?: 'apex' | 'faceted' | 'blades';
}

/**
 * Obsidian WorkOS — Master Vector Brand Identity
 * Mathematical 45°/60° Miter Precision Geometries
 */
export const WorkOSLogo: React.FC<WorkOSLogoProps> = ({
  className = 'w-4 h-4',
  size,
  variant = 'apex',
}) => {
  const style = size ? { width: size, height: size } : undefined;

  if (variant === 'faceted') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        {/* Left Outer Blade */}
        <polygon points="12,20 34,84 22,84 6,20" fill="currentColor" />
        {/* Left Inner Facet */}
        <polygon points="34,84 50,42 40,42 28,84" fill="currentColor" fillOpacity={0.6} />
        {/* Center Diamond Chisel */}
        <polygon points="50,14 58,28 50,42 42,28" fill="currentColor" />
        {/* Right Inner Facet */}
        <polygon points="50,42 66,84 72,84 58,42" fill="currentColor" fillOpacity={0.4} />
        {/* Right Outer Blade */}
        <polygon points="66,84 88,20 94,20 78,84" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'blades') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <polygon points="12,22 26,22 42,78 28,78" fill="currentColor" />
        <polygon points="34,78 48,78 58,40 44,40" fill="currentColor" fillOpacity={0.7} />
        <polygon points="52,40 66,40 56,78 42,78" fill="currentColor" fillOpacity={0.5} />
        <polygon points="58,78 72,78 88,22 74,22" fill="currentColor" />
      </svg>
    );
  }

  // Default: Razor Apex Monoline W
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Precision Miter W Track */}
      <polyline
        points="14,24 38,82 50,48 62,82 86,24"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      />
      {/* Center Kinetic Apex Line */}
      <line
        x1="50"
        y1="48"
        x2="50"
        y2="18"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="square"
      />
    </svg>
  );
};

export const WORKOS_LOGO_SVG_STRING = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polyline points="14,24 38,82 50,48 62,82 86,24" stroke="currentColor" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="10"/>
  <line x1="50" y1="48" x2="50" y2="18" stroke="currentColor" stroke-width="10" stroke-linecap="square"/>
</svg>
`.trim();
