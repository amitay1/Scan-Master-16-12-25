import { useEffect, useState, useId } from 'react';
import './liquid-progress-gauge.css';

interface LiquidProgressGaugeProps {
  value: number; // 0-100
  className?: string;
}

export const LiquidProgressGauge = ({ value, className = "" }: LiquidProgressGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Generate deterministic unique IDs for this instance to avoid SVG ID conflicts
  const uniqueId = useId().replace(/:/g, '-');
  
  useEffect(() => {
    // Animate the value change smoothly
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const liquidHeight = Math.max(0, Math.min(100, animatedValue));

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>

      {/* Test tube container - responsive size */}
      <div className="relative w-[100px] h-[200px] sm:w-[120px] sm:h-[240px] md:w-[140px] md:h-[280px]">
        {/* Glass test tube */}
        <svg
          viewBox="0 0 100 200"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ transform: 'translateZ(0)' }}
        >
          {/* Test tube outline with glass effect */}
          <defs>
            {/* Glass gradient */}
            <linearGradient id={`glass-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
            </linearGradient>
            
            {/* Liquid gradient */}
            <linearGradient id={`liquid-gradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(200, 90%, 50%)" />
              <stop offset="100%" stopColor="hsl(210, 100%, 45%)" />
            </linearGradient>
            
            {/* Clip path for test tube shape */}
            <clipPath id={`tube-clip-${uniqueId}`}>
              <rect x="20" y="10" width="60" height="170" rx="30" ry="30" />
            </clipPath>
            
            {/* Wave pattern */}
            <pattern id={`wave-pattern-${uniqueId}`} x="0" y="0" width="200" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 0 5 Q 50 0 100 5 T 200 5"
                stroke="none"
                fill="rgba(255,255,255,0.3)"
              />
            </pattern>
          </defs>

          {/* Test tube background */}
          <rect
            x="20"
            y="10"
            width="60"
            height="170"
            rx="30"
            ry="30"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          
          {/* Liquid container */}
          <g clipPath={`url(#tube-clip-${uniqueId})`}>
            {/* Liquid fill */}
            <rect
              x="20"
              y={10 + (170 * (1 - liquidHeight / 100))}
              width="60"
              height={170 * (liquidHeight / 100)}
              fill={`url(#liquid-gradient-${uniqueId})`}
              className="liquid-fill liquid-glow"
              opacity="0.9"
            />
            
            {/* Wave effects */}
            <g transform={`translate(0, ${10 + (170 * (1 - liquidHeight / 100)) - 5})`}>
              <rect
                x="-100"
                y="0"
                width="300"
                height="15"
                fill="rgba(255,255,255,0.2)"
                className="wave-layer"
              />
              <rect
                x="-100"
                y="2"
                width="300"
                height="10"
                fill="rgba(255,255,255,0.15)"
                className="wave-layer2"
              />
            </g>
          </g>
        </svg>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {Math.round(animatedValue)}%
            </div>
          </div>
        </div>
      </div>

      {/* Bottom shadow */}
      <div className="w-20 h-2 bg-black/10 rounded-full blur-sm mt-2" />
    </div>
  );
};