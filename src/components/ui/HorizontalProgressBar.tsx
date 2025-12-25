import { useEffect, useState, useId, useMemo } from 'react';

interface HorizontalProgressBarProps {
  value: number; // 0-100
  completedFields: number;
  totalFields: number;
  className?: string;
}

// Generate random bubbles for the liquid effect
const generateBubbles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5,
    opacity: 0.3 + Math.random() * 0.4,
  }));
};

export const HorizontalProgressBar = ({
  value,
  completedFields,
  totalFields,
  className = "",
}: HorizontalProgressBarProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const uniqueId = useId().replace(/:/g, '-');

  // Generate bubbles once
  const bubbles = useMemo(() => generateBubbles(15), []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const progress = Math.max(0, Math.min(100, animatedValue));
  const liquidWidth = (progress / 100) * 780;
  const probeX = 20 + (progress / 100) * 760;

  return (
    <div className={`w-full bg-gradient-to-r from-card/95 via-card/90 to-card/95 border-y border-border/50 shadow-lg backdrop-blur-sm ${className}`}>
      <div className="max-w-full mx-auto px-2 md:px-4 py-1.5 md:py-2">
        <svg
          viewBox="0 0 900 70"
          className="w-full h-12 md:h-14"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Metal surface gradient */}
            <linearGradient id={`metal-h-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="50%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#1a202c" />
            </linearGradient>

            {/* Advanced liquid gradient with depth */}
            <linearGradient id={`liquid-depth-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#059669" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
            </linearGradient>

            {/* Horizontal shimmer gradient */}
            <linearGradient id={`shimmer-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)">
                <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="25%" stopColor="rgba(255,255,255,0.4)">
                <animate attributeName="offset" values="-0.25;1.75" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="rgba(255,255,255,0)">
                <animate attributeName="offset" values="0;2" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            {/* Foam/froth gradient */}
            <linearGradient id={`foam-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
            </linearGradient>

            {/* Probe body gradient */}
            <linearGradient id={`probe-h-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Probe tip gradient */}
            <linearGradient id={`tip-h-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Glow filter for liquid edge */}
            <filter id={`liquid-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Turbulence filter for organic look */}
            <filter id={`turbulence-${uniqueId}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise">
                <animate attributeName="baseFrequency" values="0.015;0.02;0.015" dur="4s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* Wave clip path - animated waves */}
            <clipPath id={`wave-clip-${uniqueId}`}>
              <path>
                <animate
                  attributeName="d"
                  dur="2s"
                  repeatCount="indefinite"
                  values="
                    M 20 30
                    Q 100 26, 180 30
                    T 340 30
                    T 500 30
                    T 660 30
                    T 820 30
                    L 820 55 L 20 55 Z;
                    M 20 30
                    Q 100 34, 180 30
                    T 340 30
                    T 500 30
                    T 660 30
                    T 820 30
                    L 820 55 L 20 55 Z;
                    M 20 30
                    Q 100 26, 180 30
                    T 340 30
                    T 500 30
                    T 660 30
                    T 820 30
                    L 820 55 L 20 55 Z
                  "
                />
              </path>
            </clipPath>

            {/* Liquid container clip */}
            <clipPath id={`liquid-container-${uniqueId}`}>
              <rect x="20" y="28" width={liquidWidth} height="24" rx="3" />
            </clipPath>
          </defs>

          {/* Background frame */}
          <rect
            x="10"
            y="8"
            width="880"
            height="54"
            rx="8"
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Metal surface base (tank) */}
          <rect
            x="20"
            y="28"
            width="780"
            height="24"
            rx="4"
            fill={`url(#metal-h-${uniqueId})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />

          {/* Tank inner shadow */}
          <rect
            x="21"
            y="29"
            width="778"
            height="22"
            rx="3"
            fill="none"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="2"
          />

          {/* Surface texture lines */}
          {Array.from({ length: 40 }, (_, i) => (
            <line
              key={i}
              x1={20 + i * 20}
              y1="30"
              x2={20 + i * 20}
              y2="50"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          ))}

          {/* LIQUID FILL GROUP */}
          {progress > 0 && (
            <g clipPath={`url(#liquid-container-${uniqueId})`}>
              {/* Base liquid layer with depth gradient */}
              <rect
                x="20"
                y="28"
                width={liquidWidth}
                height="24"
                fill={`url(#liquid-depth-${uniqueId})`}
                style={{ transition: 'width 0.5s ease-out' }}
              />

              {/* Animated wave layer 1 (bottom) */}
              <path
                fill="rgba(16, 185, 129, 0.6)"
                style={{ transition: 'all 0.5s ease-out' }}
              >
                <animate
                  attributeName="d"
                  dur="3s"
                  repeatCount="indefinite"
                  values={`
                    M 20 40
                    Q ${20 + liquidWidth * 0.15} 36, ${20 + liquidWidth * 0.3} 40
                    T ${20 + liquidWidth * 0.6} 40
                    T ${20 + liquidWidth * 0.9} 40
                    T ${20 + liquidWidth} 40
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 40
                    Q ${20 + liquidWidth * 0.15} 44, ${20 + liquidWidth * 0.3} 40
                    T ${20 + liquidWidth * 0.6} 40
                    T ${20 + liquidWidth * 0.9} 40
                    T ${20 + liquidWidth} 40
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 40
                    Q ${20 + liquidWidth * 0.15} 36, ${20 + liquidWidth * 0.3} 40
                    T ${20 + liquidWidth * 0.6} 40
                    T ${20 + liquidWidth * 0.9} 40
                    T ${20 + liquidWidth} 40
                    L ${20 + liquidWidth} 52 L 20 52 Z
                  `}
                />
              </path>

              {/* Animated wave layer 2 (middle) - faster */}
              <path
                fill="rgba(52, 211, 153, 0.4)"
                style={{ transition: 'all 0.5s ease-out' }}
              >
                <animate
                  attributeName="d"
                  dur="2s"
                  repeatCount="indefinite"
                  values={`
                    M 20 36
                    Q ${20 + liquidWidth * 0.2} 32, ${20 + liquidWidth * 0.4} 36
                    T ${20 + liquidWidth * 0.7} 36
                    T ${20 + liquidWidth} 36
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 36
                    Q ${20 + liquidWidth * 0.2} 40, ${20 + liquidWidth * 0.4} 36
                    T ${20 + liquidWidth * 0.7} 36
                    T ${20 + liquidWidth} 36
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 36
                    Q ${20 + liquidWidth * 0.2} 32, ${20 + liquidWidth * 0.4} 36
                    T ${20 + liquidWidth * 0.7} 36
                    T ${20 + liquidWidth} 36
                    L ${20 + liquidWidth} 52 L 20 52 Z
                  `}
                />
              </path>

              {/* Animated wave layer 3 (top) - slowest, most visible */}
              <path
                fill="rgba(110, 231, 183, 0.5)"
                style={{ transition: 'all 0.5s ease-out' }}
              >
                <animate
                  attributeName="d"
                  dur="4s"
                  repeatCount="indefinite"
                  values={`
                    M 20 32
                    Q ${20 + liquidWidth * 0.1} 28, ${20 + liquidWidth * 0.25} 32
                    T ${20 + liquidWidth * 0.5} 32
                    T ${20 + liquidWidth * 0.75} 32
                    T ${20 + liquidWidth} 32
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 32
                    Q ${20 + liquidWidth * 0.1} 35, ${20 + liquidWidth * 0.25} 32
                    T ${20 + liquidWidth * 0.5} 32
                    T ${20 + liquidWidth * 0.75} 32
                    T ${20 + liquidWidth} 32
                    L ${20 + liquidWidth} 52 L 20 52 Z;
                    M 20 32
                    Q ${20 + liquidWidth * 0.1} 28, ${20 + liquidWidth * 0.25} 32
                    T ${20 + liquidWidth * 0.5} 32
                    T ${20 + liquidWidth * 0.75} 32
                    T ${20 + liquidWidth} 32
                    L ${20 + liquidWidth} 52 L 20 52 Z
                  `}
                />
              </path>

              {/* Bubbles */}
              {bubbles.map((bubble) => {
                const bubbleX = 20 + (bubble.x / 100) * liquidWidth;
                if (bubbleX > 20 + liquidWidth - 10) return null;
                return (
                  <circle
                    key={bubble.id}
                    r={bubble.size}
                    fill="rgba(255,255,255,0.5)"
                    opacity={bubble.opacity}
                  >
                    <animate
                      attributeName="cx"
                      values={`${bubbleX};${bubbleX + (Math.random() - 0.5) * 10};${bubbleX}`}
                      dur={`${bubble.duration}s`}
                      repeatCount="indefinite"
                      begin={`${bubble.delay}s`}
                    />
                    <animate
                      attributeName="cy"
                      values="48;32;48"
                      dur={`${bubble.duration}s`}
                      repeatCount="indefinite"
                      begin={`${bubble.delay}s`}
                    />
                    <animate
                      attributeName="opacity"
                      values={`0;${bubble.opacity};0`}
                      dur={`${bubble.duration}s`}
                      repeatCount="indefinite"
                      begin={`${bubble.delay}s`}
                    />
                    <animate
                      attributeName="r"
                      values={`${bubble.size};${bubble.size * 1.5};${bubble.size * 0.5}`}
                      dur={`${bubble.duration}s`}
                      repeatCount="indefinite"
                      begin={`${bubble.delay}s`}
                    />
                  </circle>
                );
              })}

              {/* Shimmer/light reflection overlay */}
              <rect
                x="20"
                y="28"
                width={liquidWidth}
                height="10"
                fill={`url(#shimmer-${uniqueId})`}
                opacity="0.6"
                style={{ transition: 'width 0.5s ease-out' }}
              />

              {/* Foam layer at top */}
              <rect
                x="20"
                y="28"
                width={liquidWidth}
                height="6"
                fill={`url(#foam-${uniqueId})`}
                opacity="0.4"
                rx="2"
                style={{ transition: 'width 0.5s ease-out' }}
              />

              {/* Leading edge glow effect */}
              {progress < 100 && (
                <g filter={`url(#liquid-glow-${uniqueId})`}>
                  <line
                    x1={20 + liquidWidth}
                    y1="29"
                    x2={20 + liquidWidth}
                    y2="51"
                    stroke="#34d399"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.5;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                </g>
              )}

              {/* Turbulent splash at leading edge */}
              {progress > 5 && progress < 100 && (
                <g>
                  {[0, 1, 2].map((i) => (
                    <circle
                      key={i}
                      cx={20 + liquidWidth + 2}
                      cy={35 + i * 5}
                      r="2"
                      fill="#6ee7b7"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="cx"
                        values={`${20 + liquidWidth};${20 + liquidWidth + 8};${20 + liquidWidth}`}
                        dur="0.8s"
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="0.8s"
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </circle>
                  ))}
                </g>
              )}
            </g>
          )}

          {/* Probe assembly */}
          <g
            transform={`translate(${probeX}, 0)`}
            style={{ transition: 'transform 0.5s ease-out' }}
          >
            {/* Probe body */}
            <rect
              x="-8"
              y="10"
              width="16"
              height="16"
              rx="2"
              fill={`url(#probe-h-${uniqueId})`}
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Probe grip lines */}
            <line x1="-5" y1="13" x2="5" y2="13" stroke="#334155" strokeWidth="1.5" />
            <line x1="-5" y1="16" x2="5" y2="16" stroke="#334155" strokeWidth="1.5" />
            <line x1="-5" y1="19" x2="5" y2="19" stroke="#334155" strokeWidth="1.5" />
            <line x1="-5" y1="22" x2="5" y2="22" stroke="#334155" strokeWidth="1.5" />

            {/* Probe tip */}
            <rect
              x="-4"
              y="26"
              width="8"
              height="4"
              rx="1"
              fill={`url(#tip-h-${uniqueId})`}
            />

            {/* Ultrasonic waves */}
            {progress > 0 && progress < 100 && (
              <g>
                <ellipse
                  cx="0"
                  cy="38"
                  rx="6"
                  ry="3"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity="0.6"
                >
                  <animate attributeName="ry" values="3;6;3" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="0.8s" repeatCount="indefinite" />
                </ellipse>
                <ellipse
                  cx="0"
                  cy="42"
                  rx="10"
                  ry="5"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  opacity="0.4"
                >
                  <animate attributeName="ry" values="5;10;5" dur="1s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="1s" repeatCount="indefinite" begin="0.2s" />
                </ellipse>
              </g>
            )}

            {/* LED indicator */}
            <circle
              cx="0"
              cy="6"
              r="3"
              fill={progress === 100 ? "#22c55e" : progress > 0 ? "#3b82f6" : "#64748b"}
            >
              {progress > 0 && progress < 100 && (
                <animate attributeName="opacity" values="1;0.4;1" dur="0.6s" repeatCount="indefinite" />
              )}
            </circle>
          </g>

          {/* Scale markers */}
          {[0, 25, 50, 75, 100].map((mark) => (
            <g key={mark}>
              <line
                x1={20 + (mark / 100) * 780}
                y1="53"
                x2={20 + (mark / 100) * 780}
                y2="58"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <text
                x={20 + (mark / 100) * 780}
                y="66"
                fill="rgba(255,255,255,0.4)"
                fontSize="8"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {mark}%
              </text>
            </g>
          ))}

          {/* Status indicator */}
          <g>
            <circle
              cx="840"
              cy="22"
              r="6"
              fill={progress === 100 ? "#22c55e" : progress > 0 ? "#3b82f6" : "#64748b"}
            >
              {progress > 0 && progress < 100 && (
                <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
              )}
              {progress === 100 && (
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            <text
              x="852"
              y="26"
              fill="rgba(255,255,255,0.8)"
              fontSize="11"
              fontWeight="500"
              fontFamily="sans-serif"
            >
              {progress === 100 ? "Complete" : progress > 0 ? "Scanning..." : "Ready"}
            </text>
          </g>

          {/* Percentage display */}
          <g>
            <rect
              x="820"
              y="36"
              width="70"
              height="24"
              rx="5"
              fill="rgba(0,0,0,0.5)"
              stroke={progress === 100 ? "#22c55e" : "#3b82f6"}
              strokeWidth="1.5"
            >
              {progress === 100 && (
                <animate attributeName="stroke" values="#22c55e;#6ee7b7;#22c55e" dur="2s" repeatCount="indefinite" />
              )}
            </rect>
            <text
              x="855"
              y="53"
              fill={progress === 100 ? "#22c55e" : "#ffffff"}
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {Math.round(animatedValue)}%
            </text>
          </g>

          {/* Fields counter */}
          <text
            x="25"
            y="22"
            fill="rgba(255,255,255,0.7)"
            fontSize="12"
            fontFamily="sans-serif"
          >
            <tspan fontWeight="600">PROGRESS</tspan>
            <tspan dx="12" fill="rgba(255,255,255,0.5)">{completedFields}/{totalFields} fields</tspan>
          </text>

          {/* ScanMaster branding */}
          <text
            x="800"
            y="22"
            fill="rgba(255,255,255,0.3)"
            fontSize="10"
            textAnchor="end"
            fontFamily="sans-serif"
            fontStyle="italic"
          >
            ScanMaster
          </text>
        </svg>
      </div>
    </div>
  );
};
