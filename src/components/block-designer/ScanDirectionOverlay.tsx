/**
 * Scan Direction Overlay Component
 * Animated visualization of scan directions on isometric drawings per ASTM E2375
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import {
  ScanDirectionCode,
  ScanDirectionDefinition,
  SCAN_DIRECTION_DEFINITIONS,
} from '@/types/scanDetails';
import { CustomBlockShape } from '@/types/blockDesigner.types';

// Isometric projection constants (matching IsometricDrawing.tsx)
const ISO_ANGLE = 30 * (Math.PI / 180);
const COS_ISO = Math.cos(ISO_ANGLE);
const SIN_ISO = Math.sin(ISO_ANGLE);

function toIsometric(x: number, y: number, z: number): { x: number; y: number } {
  return {
    x: (x - z) * COS_ISO,
    y: (x + z) * SIN_ISO - y,
  };
}

interface ScanDirectionOverlayProps {
  blockShape: CustomBlockShape;
  selectedDirections: ScanDirectionCode[];
  width?: number;
  height?: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ArrowConfig {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  color: string;
  label: string;
  labelHe: string;
  waveMode: string;
  animationType: 'pulse' | 'sweep' | 'rotate' | 'bounce';
  angle?: number;
}

// Get arrow configuration for each scan direction based on shape
function getArrowConfig(
  direction: ScanDirectionDefinition,
  blockShape: CustomBlockShape,
  scale: number,
  offsetX: number,
  offsetY: number
): ArrowConfig | null {
  const { geometryType, length, width, height, outerDiameter, innerDiameter, cylinderLength } = blockShape;
  const isCylindrical = geometryType === 'cylinder' || geometryType === 'tube';

  // Shape dimensions for positioning
  const l = isCylindrical ? cylinderLength : length;
  const w = isCylindrical ? outerDiameter : width;
  const h = isCylindrical ? outerDiameter : height;

  // Base positions (centered on shape)
  const centerX = l / 2;
  const centerY = h / 2;
  const centerZ = w / 2;

  // Offset for arrow spacing (to avoid overlapping)
  const spacing = Math.max(l, w, h) * 0.15;

  let startPoint: { x: number; y: number };
  let endPoint: { x: number; y: number };
  let animationType: ArrowConfig['animationType'] = 'pulse';

  switch (direction.code) {
    case 'A':
    case 'A₁': {
      // Primary - from top, going down
      const start3D = { x: centerX - spacing * 0.3, y: h + h * 0.5, z: centerZ };
      const end3D = { x: centerX - spacing * 0.3, y: h * 0.2, z: centerZ };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'pulse';
      break;
    }

    case 'B':
    case 'B₁': {
      // Secondary - from side (front face)
      const start3D = { x: centerX, y: centerY, z: w + w * 0.5 };
      const end3D = { x: centerX, y: centerY, z: w * 0.2 };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'pulse';
      break;
    }

    case 'C':
    case 'C₁': {
      // Tertiary/Radial - from right side
      const start3D = { x: l + l * 0.5, y: centerY, z: centerZ };
      const end3D = { x: l * 0.2, y: centerY, z: centerZ };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'pulse';
      break;
    }

    case 'D': {
      // Circumferential CW - curved arrow around shape
      if (!isCylindrical) {
        // For rectangular: angled shear wave from front
        const start3D = { x: l * 0.3, y: h * 0.1, z: w + w * 0.3 };
        const end3D = { x: l * 0.6, y: h * 0.5, z: w * 0.3 };
        startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
        endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      } else {
        // Circumferential path (simplified as tangent arrow)
        const start3D = { x: centerX, y: h + h * 0.2, z: w * 0.3 };
        const end3D = { x: centerX + l * 0.1, y: h * 0.8, z: w * 0.1 };
        startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
        endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      }
      animationType = 'sweep';
      break;
    }

    case 'E': {
      // Circumferential CCW - opposite direction
      if (!isCylindrical) {
        const start3D = { x: l * 0.7, y: h * 0.1, z: w + w * 0.3 };
        const end3D = { x: l * 0.4, y: h * 0.5, z: w * 0.3 };
        startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
        endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      } else {
        const start3D = { x: centerX, y: h + h * 0.2, z: w * 0.7 };
        const end3D = { x: centerX - l * 0.1, y: h * 0.8, z: w * 0.9 };
        startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
        endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      }
      animationType = 'sweep';
      break;
    }

    case 'F': {
      // Axial shear direction 1
      const start3D = { x: l * 0.15, y: h * 0.7, z: w * 1.3 };
      const end3D = { x: l * 0.45, y: h * 0.3, z: w * 0.7 };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'sweep';
      break;
    }

    case 'G': {
      // Axial shear direction 2 (opposite)
      const start3D = { x: l * 0.85, y: h * 0.7, z: w * 1.3 };
      const end3D = { x: l * 0.55, y: h * 0.3, z: w * 0.7 };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'sweep';
      break;
    }

    case 'H': {
      // From ID (inner diameter) - for tubes
      if (innerDiameter && innerDiameter > 0) {
        const innerR = innerDiameter / 2;
        const start3D = { x: centerX, y: centerY, z: (w - innerDiameter) / 2 + innerR * 0.2 };
        const end3D = { x: centerX, y: centerY, z: w * 0.9 };
        startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
        endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      } else {
        // Not applicable
        return null;
      }
      animationType = 'pulse';
      break;
    }

    case 'I': {
      // Through-transmission (two transducers)
      const start3D = { x: centerX + spacing * 0.3, y: h + h * 0.4, z: centerZ };
      const end3D = { x: centerX + spacing * 0.3, y: -h * 0.3, z: centerZ };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'bounce';
      break;
    }

    case 'J': {
      // Shear wave 60°
      const start3D = { x: l * 0.2, y: h * 1.3, z: w * 0.6 };
      const end3D = { x: l * 0.5, y: h * 0.1, z: w * 0.8 };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'sweep';
      break;
    }

    case 'K': {
      // Shear wave 45°
      const start3D = { x: l * 0.8, y: h * 1.3, z: w * 0.6 };
      const end3D = { x: l * 0.5, y: h * 0.1, z: w * 0.8 };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'sweep';
      break;
    }

    case 'L': {
      // Rotational 360° scan
      const start3D = { x: l * 1.3, y: centerY + h * 0.3, z: centerZ };
      const end3D = { x: l * 0.1, y: centerY + h * 0.3, z: centerZ };
      startPoint = toIsometric(start3D.x * scale, start3D.y * scale, start3D.z * scale);
      endPoint = toIsometric(end3D.x * scale, end3D.y * scale, end3D.z * scale);
      animationType = 'rotate';
      break;
    }

    default:
      return null;
  }

  return {
    startPoint: { x: startPoint.x + offsetX, y: startPoint.y + offsetY },
    endPoint: { x: endPoint.x + offsetX, y: endPoint.y + offsetY },
    color: direction.color,
    label: direction.code,
    labelHe: direction.nameHe,
    waveMode: direction.waveMode,
    animationType,
    angle: direction.angle,
  };
}

// Animated arrow component
function AnimatedArrow({
  config,
  index,
}: {
  config: ArrowConfig;
  index: number;
}) {
  const { startPoint, endPoint, color, label, animationType } = config;

  // Calculate arrow properties
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Arrowhead size
  const headLength = 12;
  const headWidth = 8;

  // Calculate arrowhead points
  const headPoint1 = {
    x: endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
    y: endPoint.y - headLength * Math.sin(angle - Math.PI / 6),
  };
  const headPoint2 = {
    x: endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
    y: endPoint.y - headLength * Math.sin(angle + Math.PI / 6),
  };

  // Get animation config based on type
  const getAnimationConfig = () => {
    const baseDelay = index * 0.15;
    
    switch (animationType) {
      case 'pulse':
        return {
          pathLength: [0, 1, 1] as number[],
          opacity: [0, 1, 0.7] as number[],
          transition: {
            duration: 2,
            delay: baseDelay,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
          },
        };
      case 'sweep':
        return {
          pathLength: [0, 1] as number[],
          opacity: [0.3, 1, 0.3] as number[],
          transition: {
            duration: 1.5,
            delay: baseDelay,
            repeat: Infinity,
            repeatType: 'reverse' as const,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
          },
        };
      case 'rotate':
        return {
          pathLength: [0, 1] as number[],
          opacity: [0.5, 1] as number[],
          transition: {
            duration: 3,
            delay: baseDelay,
            repeat: Infinity,
            ease: 'linear' as const,
          },
        };
      case 'bounce':
        return {
          pathLength: [0, 1, 0] as number[],
          opacity: [0.3, 1, 0.3] as number[],
          transition: {
            duration: 2.5,
            delay: baseDelay,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
          },
        };
      default:
        return {
          pathLength: 1,
          opacity: 1,
          transition: { duration: 1, delay: baseDelay },
        };
    }
  };

  const animConfig = getAnimationConfig();

  // Glow filter ID
  const filterId = `glow-${label}-${index}`;

  return (
    <g className="scan-direction-arrow">
      {/* Glow filter */}
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`gradient-${label}-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Background glow line */}
      <motion.line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
      />

      {/* Main arrow line with animation */}
      <motion.line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={`url(#gradient-${label}-${index})`}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={animConfig}
      />

      {/* Animated wave particles along the arrow */}
      {[0, 0.25, 0.5, 0.75].map((offset, i) => (
        <motion.circle
          key={i}
          r="3"
          fill={color}
          initial={{ opacity: 0 }}
          animate={{
            cx: [startPoint.x, endPoint.x],
            cy: [startPoint.y, endPoint.y],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: index * 0.15 + offset * 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Arrowhead */}
      <motion.polygon
        points={`${endPoint.x},${endPoint.y} ${headPoint1.x},${headPoint1.y} ${headPoint2.x},${headPoint2.y}`}
        fill={color}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
      />

      {/* Label background */}
      <motion.rect
        x={startPoint.x - 14}
        y={startPoint.y - 22}
        width="28"
        height="18"
        rx="4"
        fill={color}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.15 }}
      />

      {/* Label text */}
      <motion.text
        x={startPoint.x}
        y={startPoint.y - 10}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: index * 0.15 + 0.1 }}
      >
        {label}
      </motion.text>
    </g>
  );
}

export function ScanDirectionOverlay({
  blockShape,
  selectedDirections,
  width = 600,
  height = 400,
  scale,
  offsetX,
  offsetY,
}: ScanDirectionOverlayProps) {
  // Get applicable directions for this shape
  const applicableDirections = useMemo(() => {
    const shapeType = blockShape.geometryType;
    const shapeMapping: Record<string, string[]> = {
      rectangular: ['rectangular_bar', 'plate', 'billet'],
      curved_block: ['rectangular_bar', 'plate'],
      cylinder: ['round_bar', 'cylinder', 'shaft'],
      tube: ['tube', 'pipe', 'ring'],
    };

    const matchingTypes = shapeMapping[shapeType] || [];

    return SCAN_DIRECTION_DEFINITIONS.filter((dir) =>
      dir.applicableParts.some((part) =>
        matchingTypes.some((type) => part.includes(type) || type.includes(part))
      )
    );
  }, [blockShape.geometryType]);

  // Generate arrow configs for selected directions
  const arrowConfigs = useMemo(() => {
    return selectedDirections
      .map((code) => {
        const direction = SCAN_DIRECTION_DEFINITIONS.find((d) => d.code === code);
        if (!direction) return null;
        return getArrowConfig(direction, blockShape, scale, offsetX, offsetY);
      })
      .filter((config): config is ArrowConfig => config !== null);
  }, [selectedDirections, blockShape, scale, offsetX, offsetY]);

  return (
    <g className="scan-direction-overlay">
      {arrowConfigs.map((config, index) => (
        <AnimatedArrow key={config.label} config={config} index={index} />
      ))}
    </g>
  );
}

// Legend component for scan directions
export function ScanDirectionLegend({
  selectedDirections,
  availableDirections,
  onToggleDirection,
  compact = false,
}: {
  selectedDirections: ScanDirectionCode[];
  availableDirections: ScanDirectionDefinition[];
  onToggleDirection: (code: ScanDirectionCode) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 p-2 bg-slate-800/90 rounded-lg backdrop-blur-sm">
        {availableDirections.map((dir) => {
          const isSelected = selectedDirections.includes(dir.code);
          return (
            <button
              key={dir.code}
              onClick={() => onToggleDirection(dir.code)}
              className={`
                px-2 py-1 rounded text-xs font-bold transition-all
                ${isSelected
                  ? 'ring-2 ring-white shadow-lg scale-105'
                  : 'opacity-50 hover:opacity-75'
                }
              `}
              style={{
                backgroundColor: isSelected ? dir.color : `${dir.color}40`,
                color: 'white',
              }}
              title={`${dir.nameHe}\n${dir.waveMode}`}
            >
              {dir.code}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1 p-3 bg-slate-800/95 rounded-lg backdrop-blur-sm max-h-64 overflow-y-auto">
      <h4 className="text-xs font-semibold text-slate-300 mb-2">
        כיווני סריקה - E2375
      </h4>
      {availableDirections.map((dir) => {
        const isSelected = selectedDirections.includes(dir.code);
        return (
          <button
            key={dir.code}
            onClick={() => onToggleDirection(dir.code)}
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all
              ${isSelected
                ? 'bg-slate-700 ring-1 ring-white/30'
                : 'hover:bg-slate-700/50 opacity-60'
              }
            `}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: dir.color }}
            >
              {dir.code}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{dir.nameHe}</div>
              <div className="text-[10px] text-slate-400 truncate">{dir.waveMode}</div>
            </div>
            {isSelected && (
              <span className="text-green-400 text-xs">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Hook for managing scan direction selection
export function useScanDirections(geometryType: string) {
  const [selectedDirections, setSelectedDirections] = useState<ScanDirectionCode[]>([]);

  // Get available directions for current geometry
  const availableDirections = useMemo(() => {
    const shapeMapping: Record<string, string[]> = {
      rectangular: ['rectangular_bar', 'plate', 'billet'],
      curved_block: ['rectangular_bar', 'plate'],
      cylinder: ['round_bar', 'cylinder', 'shaft'],
      tube: ['tube', 'pipe', 'ring'],
    };

    const matchingTypes = shapeMapping[geometryType] || [];

    return SCAN_DIRECTION_DEFINITIONS.filter((dir) =>
      dir.applicableParts.some((part) =>
        matchingTypes.some((type) => part.includes(type) || type.includes(part))
      )
    );
  }, [geometryType]);

  // Reset selection when geometry changes
  useEffect(() => {
    setSelectedDirections([]);
  }, [geometryType]);

  const toggleDirection = useCallback((code: ScanDirectionCode) => {
    setSelectedDirections((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDirections(availableDirections.map((d) => d.code));
  }, [availableDirections]);

  const clearAll = useCallback(() => {
    setSelectedDirections([]);
  }, []);

  return {
    selectedDirections,
    availableDirections,
    toggleDirection,
    selectAll,
    clearAll,
  };
}
