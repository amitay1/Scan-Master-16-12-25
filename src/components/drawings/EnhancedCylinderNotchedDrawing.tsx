/**
 * Dynamic Enhanced Cylinder Notched Drawing
 * Fully dynamic SVG drawing for hollow cylindrical notched blocks
 */

import React from 'react';
import {
  BlockDimensions,
  NotchData,
  formatDimension,
} from './types';

interface CylinderNotchedDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  notchData: NotchData[];
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

// Default notch configuration if not provided
const DEFAULT_NOTCHES: NotchData[] = [
  { type: 'OD', angle: 0, depth: 1, width: 0.5, length: 10 },
  { type: 'ID', angle: 90, depth: 1, width: 0.5, length: 10 },
  { type: 'OD', angle: 180, depth: 1, width: 0.5, length: 10 },
  { type: 'axial', angle: 270, depth: 1, width: 0.5, length: 10 },
];

/**
 * Main Enhanced Cylinder Notched Drawing Component
 */
export function EnhancedCylinderNotchedDrawing({
  uniqueId,
  dimensions,
  notchData = DEFAULT_NOTCHES,
  scale,
  showDimensions = true
}: CylinderNotchedDrawingProps) {
  const { 
    length = 120, 
    diameter = 100, 
    innerDiameter = 60, 
    wallThickness = 20 
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
  const centerX = outerRadius + 40;
  const centerY = outerRadius + 40;

  // Use provided notches or defaults
  const notches = notchData.length > 0 ? notchData : DEFAULT_NOTCHES;

  // Helper function to calculate visual notch depth proportional to wall thickness
  // Ensures notches are visible while maintaining accurate proportions
  const getVisualNotchDepth = (notchDepth: number): number => {
    // Calculate actual proportion of wall thickness
    const depthRatio = notchDepth / wallThickness;
    // Ensure minimum visibility (at least 10% of wall) but cap at 90% to prevent overflow
    const clampedRatio = Math.min(Math.max(depthRatio, 0.10), 0.90);
    return clampedRatio * scaledWall;
  };

  return (
    <g>
      {/* ==================== VIEW A - END VIEW (Notch Positions) ==================== */}
      <g transform="translate(30, 30)">
        <text x={centerX} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - END (NOTCH POSITIONS)
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-notch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Outer circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill={`url(#hatch-notch-${uniqueId})`}
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
          y1={centerY - outerRadius - 20}
          x2={centerX}
          y2={centerY + outerRadius + 20}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="15,3,3,3"
        />
        <line
          x1={centerX - outerRadius - 20}
          y1={centerY}
          x2={centerX + outerRadius + 20}
          y2={centerY}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="15,3,3,3"
        />

        {/* Notches */}
        {notches.map((notch, i) => {
          const angleRad = (notch.angle - 90) * Math.PI / 180; // -90 to start at top
          const notchDepthScaled = getVisualNotchDepth(notch.depth); // Proportional to wall thickness
          
          let notchPath = '';
          let labelX = 0, labelY = 0;
          
          if (notch.type === 'OD') {
            // OD notch - on outer surface
            const startRadius = outerRadius;
            const endRadius = outerRadius - notchDepthScaled;
            const x1 = centerX + Math.cos(angleRad) * startRadius;
            const y1 = centerY + Math.sin(angleRad) * startRadius;
            const x2 = centerX + Math.cos(angleRad) * endRadius;
            const y2 = centerY + Math.sin(angleRad) * endRadius;
            notchPath = `M ${x1} ${y1} L ${x2} ${y2}`;
            labelX = centerX + Math.cos(angleRad) * (outerRadius + 15);
            labelY = centerY + Math.sin(angleRad) * (outerRadius + 15);
          } else if (notch.type === 'ID') {
            // ID notch - on inner surface
            const startRadius = innerRadius;
            const endRadius = innerRadius + notchDepthScaled;
            const x1 = centerX + Math.cos(angleRad) * startRadius;
            const y1 = centerY + Math.sin(angleRad) * startRadius;
            const x2 = centerX + Math.cos(angleRad) * endRadius;
            const y2 = centerY + Math.sin(angleRad) * endRadius;
            notchPath = `M ${x1} ${y1} L ${x2} ${y2}`;
            labelX = centerX + Math.cos(angleRad) * (innerRadius - 15);
            labelY = centerY + Math.sin(angleRad) * (innerRadius - 15);
          } else {
            // Axial notch - represented as circle
            const midRadius = (outerRadius + innerRadius) / 2;
            const x = centerX + Math.cos(angleRad) * midRadius;
            const y = centerY + Math.sin(angleRad) * midRadius;
            labelX = centerX + Math.cos(angleRad) * (outerRadius + 15);
            labelY = centerY + Math.sin(angleRad) * (outerRadius + 15);
            
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={3} fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
                <line 
                  x1={x} 
                  y1={y} 
                  x2={labelX} 
                  y2={labelY} 
                  stroke="#1e293b" 
                  strokeWidth="0.4"
                />
                <text 
                  x={labelX + (Math.cos(angleRad) > 0 ? 5 : -5)} 
                  y={labelY + 3} 
                  fontSize="7" 
                  fill="#1e293b"
                  textAnchor={Math.cos(angleRad) > 0 ? 'start' : 'end'}
                >
                  {notch.angle}° AX
                </text>
              </g>
            );
          }

          return (
            <g key={i}>
              <path 
                d={notchPath} 
                stroke="#ef4444" 
                strokeWidth="3" 
                fill="none"
              />
              {/* Callout */}
              <line 
                x1={centerX + Math.cos(angleRad) * (notch.type === 'OD' ? outerRadius - notchDepthScaled/2 : innerRadius + notchDepthScaled/2)} 
                y1={centerY + Math.sin(angleRad) * (notch.type === 'OD' ? outerRadius - notchDepthScaled/2 : innerRadius + notchDepthScaled/2)} 
                x2={labelX} 
                y2={labelY} 
                stroke="#1e293b" 
                strokeWidth="0.4"
              />
              <text 
                x={labelX + (Math.cos(angleRad) > 0 ? 5 : -5)} 
                y={labelY + 3} 
                fontSize="7" 
                fill="#1e293b"
                textAnchor={Math.cos(angleRad) > 0 ? 'start' : 'end'}
              >
                {notch.angle}° {notch.type}
              </text>
            </g>
          );
        })}

        {/* Diameter dimensions */}
        {showDimensions && (
          <>
            {/* OD */}
            <line 
              x1={centerX - outerRadius} 
              y1={centerY + outerRadius + 25} 
              x2={centerX + outerRadius} 
              y2={centerY + outerRadius + 25} 
              stroke="#1e293b" 
              strokeWidth="0.6"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <line x1={centerX - outerRadius} y1={centerY + outerRadius} x2={centerX - outerRadius} y2={centerY + outerRadius + 30} stroke="#1e293b" strokeWidth="0.4"/>
            <line x1={centerX + outerRadius} y1={centerY + outerRadius} x2={centerX + outerRadius} y2={centerY + outerRadius + 30} stroke="#1e293b" strokeWidth="0.4"/>
            <rect x={centerX - 25} y={centerY + outerRadius + 19} width="50" height="12" fill="white"/>
            <text x={centerX} y={centerY + outerRadius + 28} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b">
              ⌀{diameter.toFixed(0)}
            </text>

            {/* ID */}
            <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize="8" fill="#1e293b">
              ⌀{innerDiameter.toFixed(0)}
            </text>
          </>
        )}

        {/* Section line B-B */}
        <line 
          x1={centerX - outerRadius - 25} 
          y1={centerY} 
          x2={centerX + outerRadius + 25} 
          y2={centerY} 
          stroke="#1e293b" 
          strokeWidth="1" 
          strokeDasharray="12,4"
        />
        <circle cx={centerX - outerRadius - 25} cy={centerY} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={centerX - outerRadius - 25} y={centerY + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">B</text>
        <circle cx={centerX + outerRadius + 25} cy={centerY} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={centerX + outerRadius + 25} y={centerY + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">B</text>
      </g>

      {/* ==================== VIEW B - SECTION B-B (Longitudinal) ==================== */}
      <g transform="translate(320, 50)">
        <text x={scaledLength / 2} y="-20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - SECTION B-B
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-long-notch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Top wall */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength} 
          height={scaledWall} 
          fill={`url(#hatch-long-notch-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Bottom wall */}
        <rect 
          x="0" 
          y={scaledWall + scaledID * 0.5} 
          width={scaledLength} 
          height={scaledWall} 
          fill={`url(#hatch-long-notch-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Inner bore */}
        <rect 
          x="0" 
          y={scaledWall} 
          width={scaledLength} 
          height={scaledID * 0.5} 
          fill="#f8fafc" 
          stroke="none"
        />

        {/* Notches in longitudinal view */}
        {notches.filter(n => n.type !== 'axial').map((notch, i) => {
          const notchW = (notch.width || 0.5) * scale * 5;
          const notchD = getVisualNotchDepth(notch.depth); // Proportional to wall thickness
          const xPos = scaledLength * (0.2 + i * 0.2);

          if (notch.type === 'OD') {
            return (
              <rect 
                key={i}
                x={xPos - notchW / 2} 
                y="0" 
                width={notchW} 
                height={notchD} 
                fill="white" 
                stroke="#ef4444" 
                strokeWidth="1"
              />
            );
          } else {
            return (
              <rect 
                key={i}
                x={xPos - notchW / 2} 
                y={scaledWall - notchD} 
                width={notchW} 
                height={notchD} 
                fill="white" 
                stroke="#ef4444" 
                strokeWidth="1"
              />
            );
          }
        })}

        {/* Center line */}
        <line 
          x1={-10} 
          y1={scaledWall + scaledID * 0.25} 
          x2={scaledLength + 10} 
          y2={scaledWall + scaledID * 0.25} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWall * 2 + scaledID * 0.5} 
              x2={scaledLength} y2={scaledWall * 2 + scaledID * 0.5} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledWall} 
              value={wallThickness}
              offset={20} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== NOTCH SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(30, 230)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          NOTCH SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="280" height={25 + notches.length * 15} fill="white" stroke="#1e293b" strokeWidth="1"/>
        <line x1="0" y1="28" x2="280" y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="22" fontSize="7" fontWeight="600" fill="#1e293b">#</text>
        <text x="35" y="22" fontSize="7" fontWeight="600" fill="#1e293b">TYPE</text>
        <text x="80" y="22" fontSize="7" fontWeight="600" fill="#1e293b">ANGLE</text>
        <text x="125" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH</text>
        <text x="175" y="22" fontSize="7" fontWeight="600" fill="#1e293b">WIDTH</text>
        <text x="225" y="22" fontSize="7" fontWeight="600" fill="#1e293b">LENGTH</text>
        
        {notches.map((notch, i) => (
          <g key={i} transform={`translate(0, ${30 + i * 15})`}>
            <text x="10" y="10" fontSize="7" fill="#1e293b">{i + 1}</text>
            <text x="35" y="10" fontSize="7" fill={notch.type === 'OD' ? '#2563eb' : notch.type === 'ID' ? '#16a34a' : '#ef4444'}>{notch.type}</text>
            <text x="80" y="10" fontSize="7" fill="#1e293b">{notch.angle}°</text>
            <text x="125" y="10" fontSize="7" fill="#1e293b">{notch.depth.toFixed(2)}mm</text>
            <text x="175" y="10" fontSize="7" fill="#1e293b">{(notch.width || 0.5).toFixed(2)}mm</text>
            <text x="225" y="10" fontSize="7" fill="#1e293b">{(notch.length || 10).toFixed(1)}mm</text>
          </g>
        ))}
      </g>

      {/* Legend */}
      <g transform="translate(330, 230)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          NOTCH TYPE LEGEND
        </text>
        <rect x="0" y="8" width="150" height="55" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <rect x="10" y="18" width="10" height="3" fill="#2563eb"/>
        <text x="30" y="23" fontSize="7" fill="#1e293b">OD - Outer Diameter</text>
        <rect x="10" y="33" width="10" height="3" fill="#16a34a"/>
        <text x="30" y="38" fontSize="7" fill="#1e293b">ID - Inner Diameter</text>
        <circle cx="15" cy="50" r="3" fill="#ef4444"/>
        <text x="30" y="53" fontSize="7" fill="#1e293b">AX - Axial</text>
      </g>
    </g>
  );
}

export default EnhancedCylinderNotchedDrawing;
