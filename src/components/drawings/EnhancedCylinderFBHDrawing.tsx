/**
 * Dynamic Enhanced Cylinder FBH Drawing
 * Fully dynamic SVG drawing for hollow cylindrical blocks with FBH
 */

import React from 'react';
import {
  BlockDimensions,
  FBHData,
  formatDimension,
} from './types';

interface CylinderFBHDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  fbhData: FBHData[];
  scale: number;
  showDimensions?: boolean;
}

/**
 * Dimension Line Component
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
 * Main Enhanced Cylinder FBH Drawing Component
 */
export function EnhancedCylinderFBHDrawing({
  uniqueId,
  dimensions,
  fbhData,
  scale,
  showDimensions = true
}: CylinderFBHDrawingProps) {
  const { 
    length = 150, 
    diameter = 150, 
    innerDiameter = 90, 
    wallThickness = 30 
  } = dimensions;
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledOD = diameter * scale;
  const scaledID = innerDiameter * scale;
  const scaledWall = wallThickness * scale;
  
  // Radii for drawing
  const outerRadius = scaledOD / 2;
  const innerRadius = scaledID / 2;

  // Center point for end view
  const centerX = outerRadius + 30;
  const centerY = outerRadius + 30;

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

      {/* ==================== VIEW A - END VIEW (Cross-Section) ==================== */}
      <g transform="translate(30, 30)">
        <text x={centerX} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - END (CROSS-SECTION)
        </text>

        {/* Hatching pattern definition */}
        <defs>
          <pattern id={`hatch-cyl-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Outer circle */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={outerRadius} 
          fill={`url(#hatch-cyl-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Inner circle (hollow) */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={innerRadius} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Center lines */}
        <line 
          x1={centerX} 
          y1={centerY - outerRadius - 15} 
          x2={centerX} 
          y2={centerY + outerRadius + 15} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />
        <line 
          x1={centerX - outerRadius - 15} 
          y1={centerY} 
          x2={centerX + outerRadius + 15} 
          y2={centerY} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* FBH holes around circumference */}
        {fbhData.map((hole, i) => {
          // Distribute FBH around the wall
          const angle = (i / fbhData.length) * Math.PI * 2 - Math.PI / 2;
          const midWallRadius = (outerRadius + innerRadius) / 2;
          const holeX = centerX + Math.cos(angle) * midWallRadius;
          const holeY = centerY + Math.sin(angle) * midWallRadius;
          const holeR = Math.max(hole.diameter * scale, 2);

          return (
            <g key={i}>
              <circle 
                cx={holeX} 
                cy={holeY} 
                r={holeR} 
                fill="white" 
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              {/* Callout */}
              <line 
                x1={holeX + holeR * 1.2 * Math.cos(angle)} 
                y1={holeY + holeR * 1.2 * Math.sin(angle)} 
                x2={holeX + 25 * Math.cos(angle)} 
                y2={holeY + 25 * Math.sin(angle)} 
                stroke="#1e293b" 
                strokeWidth="0.4"
              />
              <text 
                x={holeX + 30 * Math.cos(angle)} 
                y={holeY + 30 * Math.sin(angle) + 3} 
                fontSize="7" 
                fill="#1e293b" 
                fontFamily="Arial, sans-serif"
                textAnchor={Math.cos(angle) > 0 ? "start" : "end"}
              >
                Ø{hole.size || hole.diameter.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Diameter dimensions */}
        {showDimensions && (
          <>
            {/* OD dimension */}
            <line 
              x1={centerX - outerRadius} 
              y1={centerY + outerRadius + 20} 
              x2={centerX + outerRadius} 
              y2={centerY + outerRadius + 20} 
              stroke="#1e293b" 
              strokeWidth="0.6"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <line x1={centerX - outerRadius} y1={centerY + outerRadius} x2={centerX - outerRadius} y2={centerY + outerRadius + 25} stroke="#1e293b" strokeWidth="0.4"/>
            <line x1={centerX + outerRadius} y1={centerY + outerRadius} x2={centerX + outerRadius} y2={centerY + outerRadius + 25} stroke="#1e293b" strokeWidth="0.4"/>
            <rect x={centerX - 25} y={centerY + outerRadius + 14} width="50" height="12" fill="white"/>
            <text x={centerX} y={centerY + outerRadius + 23} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b">
              ⌀{diameter.toFixed(1)}
            </text>

            {/* ID dimension */}
            <line 
              x1={centerX - innerRadius} 
              y1={centerY} 
              x2={centerX + innerRadius} 
              y2={centerY} 
              stroke="#1e293b" 
              strokeWidth="0.6"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <rect x={centerX - 20} y={centerY - 6} width="40" height="12" fill="white"/>
            <text x={centerX} y={centerY + 3} textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b">
              ⌀{innerDiameter.toFixed(0)}
            </text>

            {/* Wall thickness */}
            <line 
              x1={centerX + innerRadius} 
              y1={centerY - outerRadius - 15} 
              x2={centerX + outerRadius} 
              y2={centerY - outerRadius - 15} 
              stroke="#1e293b" 
              strokeWidth="0.6"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <line x1={centerX + innerRadius} y1={centerY - innerRadius * 0.7} x2={centerX + innerRadius} y2={centerY - outerRadius - 20} stroke="#1e293b" strokeWidth="0.4"/>
            <line x1={centerX + outerRadius} y1={centerY - outerRadius} x2={centerX + outerRadius} y2={centerY - outerRadius - 20} stroke="#1e293b" strokeWidth="0.4"/>
            <text x={centerX + (innerRadius + outerRadius) / 2} y={centerY - outerRadius - 18} textAnchor="middle" fontSize="7" fill="#1e293b">
              t={wallThickness.toFixed(0)}
            </text>
          </>
        )}

        {/* Section line B-B */}
        <line 
          x1={centerX - outerRadius - 20} 
          y1={centerY} 
          x2={centerX + outerRadius + 20} 
          y2={centerY} 
          stroke="#1e293b" 
          strokeWidth="1" 
          strokeDasharray="12,4"
        />
        <circle cx={centerX - outerRadius - 20} cy={centerY} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={centerX - outerRadius - 20} y={centerY + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">B</text>
        <circle cx={centerX + outerRadius + 20} cy={centerY} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={centerX + outerRadius + 20} y={centerY + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">B</text>
      </g>

      {/* ==================== VIEW B - SECTION B-B (Longitudinal) ==================== */}
      <g transform="translate(320, 50)">
        <text x={scaledLength / 2} y="-20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - SECTION B-B
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-long-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Top wall section */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength} 
          height={scaledWall} 
          fill={`url(#hatch-long-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Bottom wall section */}
        <rect 
          x="0" 
          y={scaledWall + scaledID * 0.6} 
          width={scaledLength} 
          height={scaledWall} 
          fill={`url(#hatch-long-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Inner bore space */}
        <rect 
          x="0" 
          y={scaledWall} 
          width={scaledLength} 
          height={scaledID * 0.6} 
          fill="#f8fafc" 
          stroke="none"
        />

        {/* FBH holes in section */}
        {fbhData.map((hole, i) => {
          const spacing = scaledLength / (fbhData.length + 1);
          const x = spacing * (i + 1);
          const holeWidth = Math.max(hole.diameter * scale * 2, 2);
          const holeDepth = hole.depth * scale;

          return (
            <g key={i}>
              {/* Top FBH */}
              <rect 
                x={x - holeWidth / 2} 
                y="0" 
                width={holeWidth} 
                height={Math.min(holeDepth, scaledWall)} 
                fill="white" 
                stroke="#1e293b" 
                strokeWidth="1"
              />
              {/* Depth label */}
              <text 
                x={x} 
                y={Math.min(holeDepth, scaledWall) + 10} 
                fontSize="6" 
                fill="#1e293b" 
                textAnchor="middle"
              >
                {hole.depth.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Center line */}
        <line 
          x1={-10} 
          y1={scaledWall + scaledID * 0.3} 
          x2={scaledLength + 10} 
          y2={scaledWall + scaledID * 0.3} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWall * 2 + scaledID * 0.6} 
              x2={scaledLength} y2={scaledWall * 2 + scaledID * 0.6} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            {/* Wall thickness */}
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledWall} 
              value={wallThickness}
              offset={20} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(30, 230)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          CYLINDER SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="250" height="70" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="25" fontSize="8" fill="#1e293b">Outer Diameter (OD): ⌀{diameter.toFixed(1)} mm</text>
        <text x="10" y="40" fontSize="8" fill="#1e293b">Inner Diameter (ID): ⌀{innerDiameter.toFixed(1)} mm</text>
        <text x="10" y="55" fontSize="8" fill="#1e293b">Wall Thickness: {wallThickness.toFixed(1)} mm</text>
        <text x="10" y="70" fontSize="8" fill="#1e293b">Length: {length.toFixed(1)} mm</text>
      </g>

      {/* FBH Table */}
      <g transform="translate(300, 230)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          FBH ARRAY
        </text>
        <rect x="0" y="8" width="200" height={20 + fbhData.length * 15} fill="white" stroke="#1e293b" strokeWidth="1"/>
        <line x1="0" y1="28" x2="200" y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="22" fontSize="7" fontWeight="600" fill="#1e293b">#</text>
        <text x="40" y="22" fontSize="7" fontWeight="600" fill="#1e293b">SIZE</text>
        <text x="90" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH</text>
        <text x="140" y="22" fontSize="7" fontWeight="600" fill="#1e293b">ANGLE</text>
        
        {fbhData.map((hole, i) => (
          <g key={i} transform={`translate(0, ${30 + i * 15})`}>
            <text x="10" y="10" fontSize="7" fill="#1e293b">{i + 1}</text>
            <text x="40" y="10" fontSize="7" fill="#1e293b">{hole.size || `${hole.diameter.toFixed(2)}mm`}</text>
            <text x="90" y="10" fontSize="7" fill="#1e293b">{hole.depth.toFixed(1)}mm</text>
            <text x="140" y="10" fontSize="7" fill="#1e293b">{((i / fbhData.length) * 360).toFixed(0)}°</text>
          </g>
        ))}
      </g>
    </g>
  );
}

export default EnhancedCylinderFBHDrawing;
