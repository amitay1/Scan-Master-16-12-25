import { useEffect, useState, useId } from 'react';
import './ProbeProgressGauge.css';

interface ProbeProgressGaugeProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  label?: string;
}

export const ProbeProgressGauge = ({
  value,
  className = "",
  showPercentage = true,
  label = "Progress"
}: ProbeProgressGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const progress = Math.max(0, Math.min(100, animatedValue));
  const probeX = 15 + (progress / 100) * 170; // Probe moves from 15 to 185

  return (
    <div className={`probe-gauge-container ${className}`}>
      <svg
        viewBox="0 0 220 120"
        className="probe-gauge-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Metal surface gradient */}
          <linearGradient id={`metal-surface-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="50%" stopColor="#2d3748" />
            <stop offset="100%" stopColor="#1a202c" />
          </linearGradient>

          {/* Scanned area gradient */}
          <linearGradient id={`scanned-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Probe body gradient */}
          <linearGradient id={`probe-body-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Probe tip gradient */}
          <linearGradient id={`probe-tip-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Ultrasonic wave gradient */}
          <linearGradient id={`wave-gradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Scan line glow */}
          <filter id={`scan-glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background frame */}
        <rect
          x="5"
          y="5"
          width="210"
          height="110"
          rx="8"
          fill="rgba(0,0,0,0.3)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Metal surface base */}
        <rect
          x="15"
          y="70"
          width="190"
          height="25"
          rx="3"
          fill={`url(#metal-surface-${uniqueId})`}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Surface texture lines */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line
            key={i}
            x1={15 + i * 20}
            y1="72"
            x2={15 + i * 20}
            y2="93"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Scanned area (green overlay) */}
        <rect
          x="15"
          y="70"
          width={(progress / 100) * 190}
          height="25"
          rx="3"
          fill={`url(#scanned-gradient-${uniqueId})`}
          opacity="0.7"
          className="scanned-area"
        />

        {/* Scan edge glow effect */}
        {progress > 0 && progress < 100 && (
          <line
            x1={15 + (progress / 100) * 190}
            y1="70"
            x2={15 + (progress / 100) * 190}
            y2="95"
            stroke="#10b981"
            strokeWidth="3"
            filter={`url(#scan-glow-${uniqueId})`}
            className="scan-edge"
          />
        )}

        {/* Probe assembly - positioned based on progress */}
        <g transform={`translate(${probeX}, 0)`} className="probe-assembly">
          {/* Probe cable */}
          <path
            d={`M 10 10 Q -10 20, 10 30`}
            stroke="#475569"
            strokeWidth="3"
            fill="none"
            className="probe-cable"
          />

          {/* Probe body */}
          <rect
            x="0"
            y="25"
            width="20"
            height="35"
            rx="3"
            fill={`url(#probe-body-${uniqueId})`}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Probe handle grip */}
          <rect x="2" y="28" width="16" height="3" rx="1" fill="#334155" />
          <rect x="2" y="34" width="16" height="3" rx="1" fill="#334155" />
          <rect x="2" y="40" width="16" height="3" rx="1" fill="#334155" />

          {/* Probe crystal housing */}
          <rect
            x="3"
            y="55"
            width="14"
            height="8"
            rx="2"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Probe tip (crystal) */}
          <rect
            x="5"
            y="63"
            width="10"
            height="5"
            rx="1"
            fill={`url(#probe-tip-${uniqueId})`}
            className="probe-tip"
          />

          {/* Ultrasonic waves emanating from probe */}
          {progress > 0 && progress < 100 && (
            <g className="ultrasonic-waves">
              <ellipse
                cx="10"
                cy="75"
                rx="8"
                ry="4"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                opacity="0.6"
                className="wave wave-1"
              />
              <ellipse
                cx="10"
                cy="80"
                rx="12"
                ry="6"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0.4"
                className="wave wave-2"
              />
              <ellipse
                cx="10"
                cy="85"
                rx="16"
                ry="8"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                opacity="0.2"
                className="wave wave-3"
              />
            </g>
          )}

          {/* Probe indicator LED */}
          <circle
            cx="10"
            cy="32"
            r="2"
            fill={progress > 0 && progress < 100 ? "#22c55e" : "#64748b"}
            className={progress > 0 && progress < 100 ? "led-active" : ""}
          />
        </g>

        {/* Scale markers on surface */}
        {[0, 25, 50, 75, 100].map((mark) => (
          <g key={mark}>
            <line
              x1={15 + (mark / 100) * 190}
              y1="96"
              x2={15 + (mark / 100) * 190}
              y2="100"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            <text
              x={15 + (mark / 100) * 190}
              y="108"
              fill="rgba(255,255,255,0.4)"
              fontSize="8"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {mark}%
            </text>
          </g>
        ))}

        {/* Percentage display */}
        {showPercentage && (
          <g>
            <rect
              x="80"
              y="15"
              width="60"
              height="24"
              rx="4"
              fill="rgba(0,0,0,0.5)"
              stroke={progress === 100 ? "#22c55e" : "#3b82f6"}
              strokeWidth="1"
            />
            <text
              x="110"
              y="32"
              fill={progress === 100 ? "#22c55e" : "#ffffff"}
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {Math.round(animatedValue)}%
            </text>
          </g>
        )}

        {/* Status indicator */}
        <g>
          <circle
            cx="25"
            cy="27"
            r="6"
            fill={progress === 100 ? "#22c55e" : progress > 0 ? "#3b82f6" : "#64748b"}
            className={progress > 0 && progress < 100 ? "status-scanning" : ""}
          />
          <text
            x="35"
            y="30"
            fill="rgba(255,255,255,0.7)"
            fontSize="10"
            fontFamily="sans-serif"
          >
            {progress === 100 ? "Complete" : progress > 0 ? "Scanning..." : "Ready"}
          </text>
        </g>

        {/* ScanMaster branding */}
        <text
          x="195"
          y="22"
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          textAnchor="end"
          fontFamily="sans-serif"
        >
          ScanMaster
        </text>
      </svg>

      {/* Label below */}
      {label && (
        <div className="probe-gauge-label">
          {label}
        </div>
      )}
    </div>
  );
};
