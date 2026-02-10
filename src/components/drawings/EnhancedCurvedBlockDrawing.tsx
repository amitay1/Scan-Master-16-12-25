/**
 * Dynamic Enhanced Curved Block Drawing
 * Fully dynamic SVG drawing for curved/convex surface calibration blocks
 */

import React from 'react';
import {
  BlockDimensions,
  FBHData,
  formatDimension,
} from './types';

interface CurvedBlockDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  fbhData: FBHData[];
  scale: number;
  showDimensions?: boolean;
}

/**
 * Dimension Line Component (shared)
 */
function DimensionLine({
  x1, y1, x2, y2,
  value,
  tolerance,
  offset = 20,
  vertical = false,
  uniqueId,
}: {
  x1: number; y1: number; x2: number; y2: number;
  value: number;
  tolerance?: number;
  offset?: number;
  vertical?: boolean;
  uniqueId: string;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const label = formatDimension(value, tolerance);

  if (vertical) {
    return (
      <g className="dimension">
        <line x1={x1 - 3} y1={y1} x2={x1 + offset + 5} y2={y1} stroke="#1e293b" strokeWidth="0.4"/>
        <line x1={x2 - 3} y1={y2} x2={x2 + offset + 5} y2={y2} stroke="#1e293b" strokeWidth="0.4"/>
        <line
          x1={x1 + offset} y1={y1 + 3}
          x2={x2 + offset} y2={y2 - 3}
          stroke="#1e293b" strokeWidth="0.6"
          markerStart={`url(#arrow-rev-${uniqueId})`}
          markerEnd={`url(#arrow-${uniqueId})`}
        />
        <rect x={x1 + offset - 22} y={midY - 6} width="44" height="12" fill="white"/>
        <text
          x={x1 + offset}
          y={midY + 3}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill="#1e293b"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </g>
    );
  }

  return (
    <g className="dimension">
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      <line
        x1={x1 + 3} y1={y1 + offset}
        x2={x2 - 3} y2={y2 + offset}
        stroke="#1e293b" strokeWidth="0.6"
        markerStart={`url(#arrow-rev-${uniqueId})`}
        markerEnd={`url(#arrow-${uniqueId})`}
      />
      <rect x={midX - 24} y={y1 + offset - 6} width="48" height="12" fill="white"/>
      <text
        x={midX}
        y={y1 + offset + 3}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#1e293b"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Main Enhanced Curved Block Drawing Component
 */
export function EnhancedCurvedBlockDrawing({
  uniqueId,
  dimensions,
  fbhData,
  scale,
  showDimensions = true
}: CurvedBlockDrawingProps) {
  const { length, width, height, radius = 150 } = dimensions;
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledRadius = radius * scale;

  // Calculate arc geometry for curved surface using actual radius
  // For a convex surface with radius R, the sagitta (rise) over chord L is:
  //   sagitta = R - sqrt(R^2 - (L/2)^2)
  // If L/2 > R (chord exceeds diameter), clamp to semicircle.
  const arcStartY = 80; // Starting Y position for the arc
  const arcHeight = scaledHeight;
  const halfChord = length / 2; // in mm (unscaled)
  const clampedRadius = Math.max(radius, halfChord + 1); // ensure arc is drawable
  const sagittaMm = clampedRadius - Math.sqrt(clampedRadius * clampedRadius - halfChord * halfChord);
  const scaledSagitta = sagittaMm * scale;

  // SVG arc path for convex surface using true circular arc
  // The arc command: A rx ry x-rotation large-arc-flag sweep-flag x y
  // For a convex surface viewed from the side, the arc rises above the chord
  const arcPath = `M 0 ${arcStartY + arcHeight}
                   A ${scaledRadius} ${scaledRadius} 0 0 1 ${scaledLength} ${arcStartY + arcHeight}`;

  // Calculate FBH positions along the curve
  const fbhPositions = fbhData.map((fbh, index) => {
    const t = fbhData.length > 1 ? index / (fbhData.length - 1) : 0.5;
    const x = t * scaledLength;
    // Y position follows the circular arc: sagitta variation = 4*sagitta*t*(1-t)
    const y = arcStartY + arcHeight - (4 * scaledSagitta * t * (1 - t));
    return { ...fbh, screenX: x, screenY: y };
  });

  return (
    <g>
      {/* Arrow marker definitions for dimension lines */}
      <defs>
        <marker id={`arrow-${uniqueId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#1e293b" />
        </marker>
        <marker id={`arrow-rev-${uniqueId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
          <path d="M8,0 L0,4 L8,8 L6,4 Z" fill="#1e293b" />
        </marker>
      </defs>

      {/* ==================== VIEW A - SIDE/PROFILE VIEW (Convex) ==================== */}
      <g transform="translate(30, 30)">
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - SIDE (CONVEX PROFILE)
        </text>

        {/* Block body */}
        <rect 
          x="0" 
          y={arcStartY} 
          width={scaledLength} 
          height={arcHeight} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Convex surface curve */}
        <path 
          d={arcPath} 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="2.5"
        />

        {/* Radius indication -- label near the apex of the arc */}
        <g>
          <path
            d={`M ${scaledLength / 2} ${arcStartY + arcHeight - scaledSagitta}
                L ${scaledLength / 2 + 30} ${arcStartY + arcHeight - scaledSagitta - 20}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.5"
          />
          <text
            x={scaledLength / 2 + 35}
            y={arcStartY + arcHeight - scaledSagitta - 22}
            fontSize="8"
            fill="#1e293b"
            fontFamily="Arial, sans-serif"
          >
            R{radius.toFixed(0)}
          </text>
        </g>

        {/* FBH holes on curved surface */}
        {fbhPositions.map((hole, i) => (
          <g key={i}>
            <circle 
              cx={hole.screenX} 
              cy={hole.screenY - 5} 
              r={Math.max(hole.diameter * scale * 2, 2)} 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="1.5"
            />
            {/* Hole depth line */}
            <line 
              x1={hole.screenX} 
              y1={hole.screenY - 5} 
              x2={hole.screenX} 
              y2={hole.screenY - 5 + hole.depth * scale} 
              stroke="#1e293b" 
              strokeWidth="0.8" 
              strokeDasharray="2,1"
            />
          </g>
        ))}

        {/* Center line */}
        <line 
          x1={scaledLength / 2} 
          y1={arcStartY - 20} 
          x2={scaledLength / 2} 
          y2={arcStartY + arcHeight + 20} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={arcStartY + arcHeight} 
              x2={scaledLength} y2={arcStartY + arcHeight} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={arcStartY} 
              x2={scaledLength} y2={arcStartY + arcHeight} 
              value={height} tolerance={0.05}
              offset={30} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW B - TOP VIEW ==================== */}
      <g transform="translate(300, 30)">
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - TOP
        </text>

        {/* Block outline */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength} 
          height={scaledWidth * 0.8} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Center lines */}
        <line 
          x1={scaledLength / 2} 
          y1="-10" 
          x2={scaledLength / 2} 
          y2={scaledWidth * 0.8 + 10} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* FBH holes */}
        {fbhData.map((hole, i) => {
          const spacing = scaledLength / (fbhData.length + 1);
          const x = spacing * (i + 1);
          return (
            <g key={i}>
              <circle 
                cx={x} 
                cy={scaledWidth * 0.4} 
                r={Math.max(hole.diameter * scale * 2, 2)} 
                fill="none" 
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              <line x1={x - 4} y1={scaledWidth * 0.4} x2={x + 4} y2={scaledWidth * 0.4} stroke="#1e293b" strokeWidth="0.4"/>
              <line x1={x} y1={scaledWidth * 0.4 - 4} x2={x} y2={scaledWidth * 0.4 + 4} stroke="#1e293b" strokeWidth="0.4"/>
            </g>
          );
        })}

        {/* FBH spacing dimensions */}
        {showDimensions && fbhData.length > 0 && (
          <g>
            {fbhData.map((_, i) => {
              const spacing = scaledLength / (fbhData.length + 1);
              const x1 = i === 0 ? 0 : spacing * i;
              const x2 = spacing * (i + 1);
              return (
                <DimensionLine 
                  key={i}
                  x1={x1} y1={scaledWidth * 0.8} 
                  x2={x2} y2={scaledWidth * 0.8} 
                  value={length / (fbhData.length + 1)}
                  offset={20} uniqueId={uniqueId}
                />
              );
            })}
          </g>
        )}
      </g>

      {/* ==================== VIEW C - END VIEW ==================== */}
      <g transform="translate(550, 30)">
        <text x={scaledWidth * 0.4} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW C - END
        </text>

        {/* End profile with curve */}
        <rect 
          x="0" 
          y="20" 
          width={scaledWidth * 0.8} 
          height={scaledHeight} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Curved top edge -- use sagitta computed from actual radius
            For the end view, the chord is the block width.
            End-view sagitta = R - sqrt(R^2 - (width/2)^2) */}
        <path
          d={(() => {
            const endHalfChord = width / 2;
            const endClampedR = Math.max(radius, endHalfChord + 1);
            const endSagitta = (endClampedR - Math.sqrt(endClampedR * endClampedR - endHalfChord * endHalfChord)) * scale;
            return `M 0 20 A ${scaledRadius} ${scaledRadius} 0 0 1 ${scaledWidth * 0.8} 20`;
          })()}
          fill="none"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Center line */}
        <line 
          x1={scaledWidth * 0.4} 
          y1="0" 
          x2={scaledWidth * 0.4} 
          y2={20 + scaledHeight + 20} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={20 + scaledHeight} 
              x2={scaledWidth * 0.8} y2={20 + scaledHeight} 
              value={width}
              offset={15} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledWidth * 0.8} y1={20} 
              x2={scaledWidth * 0.8} y2={20 + scaledHeight} 
              value={height}
              offset={15} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== SPECIFICATIONS ==================== */}
      <g transform="translate(30, 220)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          CURVED BLOCK SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="200" height="60" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="25" fontSize="8" fill="#1e293b">Radius: R{radius.toFixed(0)} mm</text>
        <text x="10" y="40" fontSize="8" fill="#1e293b">Surface: Convex</text>
        <text x="10" y="55" fontSize="8" fill="#1e293b">FBH Count: {fbhData.length}</text>
      </g>
    </g>
  );
}

export default EnhancedCurvedBlockDrawing;
