/**
 * Dynamic Enhanced IIW Block Drawing
 * Fully dynamic SVG drawing for IIW Type 1 calibration blocks
 */

import React from 'react';
import {
  BlockDimensions,
  formatDimension,
} from './types';

interface IIWBlockDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
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
 * Main Enhanced IIW Block Drawing Component
 */
export function EnhancedIIWBlockDrawing({
  uniqueId,
  dimensions,
  scale,
  showDimensions = true
}: IIWBlockDrawingProps) {
  const { length = 300, width = 40, height = 100 } = dimensions;
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // IIW block specific features (based on ISO 2400)
  const radiusR100 = 100 * scale; // R100 radius for beam calibration
  const radiusR25 = 25 * scale;   // R25 smaller radius
  const slotDepth = 3 * scale;    // Slot depth
  const holeD50 = 50 * scale;     // 50mm reference hole

  return (
    <g>
      {/* ==================== VIEW A - FRONT (IIW Type 1 Profile) ==================== */}
      <g transform="translate(30, 30)">
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - FRONT (IIW TYPE 1)
        </text>

        {/* Main block outline - IIW characteristic shape */}
        <path 
          d={`
            M 0 ${scaledHeight}
            L 0 ${scaledHeight * 0.3}
            Q 0 0 ${scaledLength * 0.15} 0
            L ${scaledLength * 0.85} 0
            Q ${scaledLength} 0 ${scaledLength} ${scaledHeight * 0.3}
            L ${scaledLength} ${scaledHeight}
            Z
          `}
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Reference radius R100 arc (for angle calibration) */}
        <path 
          d={`M ${scaledLength * 0.3} ${scaledHeight} 
              A ${radiusR100} ${radiusR100} 0 0 1 ${scaledLength * 0.7} ${scaledHeight}`}
          fill="none" 
          stroke="#2563eb" 
          strokeWidth="1.5"
          strokeDasharray="5,2"
        />
        <text 
          x={scaledLength * 0.5} 
          y={scaledHeight - radiusR100 * 0.3} 
          fontSize="8" 
          fill="#2563eb" 
          textAnchor="middle"
        >
          R100
        </text>

        {/* Small radius R25 */}
        <circle 
          cx={scaledLength * 0.15} 
          cy={scaledHeight * 0.3} 
          r={radiusR25 * 0.3} 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="1"
        />
        <text 
          x={scaledLength * 0.15 + radiusR25 * 0.5} 
          y={scaledHeight * 0.3} 
          fontSize="7" 
          fill="#1e293b"
        >
          R25
        </text>

        {/* Reference hole (50mm from edge) */}
        <circle 
          cx={holeD50} 
          cy={scaledHeight * 0.5} 
          r={2 * scale} 
          fill="white" 
          stroke="#1e293b" 
          strokeWidth="1.5"
        />
        <line x1={holeD50 - 4} y1={scaledHeight * 0.5} x2={holeD50 + 4} y2={scaledHeight * 0.5} stroke="#1e293b" strokeWidth="0.4"/>
        <line x1={holeD50} y1={scaledHeight * 0.5 - 4} x2={holeD50} y2={scaledHeight * 0.5 + 4} stroke="#1e293b" strokeWidth="0.4"/>

        {/* Graduated scale markings along bottom */}
        {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300].map((mm, i) => {
          if (mm > length) return null;
          const x = (mm / length) * scaledLength;
          const tickHeight = mm % 50 === 0 ? 8 : 4;
          return (
            <g key={i}>
              <line x1={x} y1={scaledHeight} x2={x} y2={scaledHeight - tickHeight} stroke="#1e293b" strokeWidth="0.5"/>
              {mm % 50 === 0 && (
                <text x={x} y={scaledHeight + 10} fontSize="6" textAnchor="middle" fill="#1e293b">{mm}</text>
              )}
            </g>
          );
        })}

        {/* Calibration slots */}
        <rect x={scaledLength * 0.4} y="0" width={slotDepth} height={scaledHeight * 0.15} fill="white" stroke="#1e293b" strokeWidth="1"/>
        <rect x={scaledLength * 0.6} y="0" width={slotDepth} height={scaledHeight * 0.15} fill="white" stroke="#1e293b" strokeWidth="1"/>

        {/* Center line */}
        <line 
          x1={scaledLength / 2} 
          y1="-10" 
          x2={scaledLength / 2} 
          y2={scaledHeight + 20} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledHeight} 
              x2={scaledLength} y2={scaledHeight} 
              value={length} tolerance={0.1}
              offset={30} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledHeight} 
              value={height} tolerance={0.05}
              offset={25} vertical uniqueId={uniqueId}
            />
            {/* 50mm reference dimension */}
            <DimensionLine 
              x1={0} y1={scaledHeight * 0.5} 
              x2={holeD50} y2={scaledHeight * 0.5} 
              value={50}
              offset={-15} uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW B - TOP VIEW ==================== */}
      <g transform="translate(400, 30)">
        <text x={scaledLength * 0.6 / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - TOP
        </text>

        {/* Block outline */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength * 0.6} 
          height={scaledWidth} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Reference hole (top view) */}
        <circle 
          cx={holeD50 * 0.6} 
          cy={scaledWidth / 2} 
          r={2 * scale} 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="1"
        />

        {/* Calibration slots (top view) */}
        <rect x={scaledLength * 0.24} y="0" width={slotDepth} height={scaledWidth} fill="white" stroke="#1e293b" strokeWidth="0.5"/>
        <rect x={scaledLength * 0.36} y="0" width={slotDepth} height={scaledWidth} fill="white" stroke="#1e293b" strokeWidth="0.5"/>

        {/* Center line */}
        <line 
          x1={scaledLength * 0.3} 
          y1="-10" 
          x2={scaledLength * 0.3} 
          y2={scaledWidth + 10} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWidth} 
              x2={scaledLength * 0.6} y2={scaledWidth} 
              value={length}
              offset={15} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength * 0.6} y1={0} 
              x2={scaledLength * 0.6} y2={scaledWidth} 
              value={width}
              offset={15} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(30, 180)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          IIW TYPE 1 SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="300" height="90" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Specifications content */}
        <text x="10" y="28" fontSize="8" fill="#1e293b" fontWeight="600">Standard: ISO 2400 / EN 12223</text>
        <text x="10" y="43" fontSize="8" fill="#1e293b">Material: Low-carbon steel (C45)</text>
        <text x="10" y="58" fontSize="8" fill="#1e293b">Dimensions: {length} × {width} × {height} mm</text>
        <text x="10" y="73" fontSize="8" fill="#1e293b">Reference Radius: R100 mm</text>
        <text x="10" y="88" fontSize="8" fill="#1e293b">Acoustic Properties: V = 5920 m/s (Long.), 3250 m/s (Trans.)</text>
        
        <line x1="150" y1="15" x2="150" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="160" y="28" fontSize="8" fill="#1e293b" fontWeight="600">Calibration Points:</text>
        <text x="160" y="43" fontSize="8" fill="#1e293b">• R100 arc for angle calibration</text>
        <text x="160" y="58" fontSize="8" fill="#1e293b">• 50mm reference point</text>
        <text x="160" y="73" fontSize="8" fill="#1e293b">• Graduated scale (mm)</text>
        <text x="160" y="88" fontSize="8" fill="#1e293b">• Depth calibration slots</text>
      </g>

      {/* Usage notes */}
      <g transform="translate(350, 180)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          USAGE NOTES
        </text>
        <rect x="0" y="8" width="220" height="70" fill="#fffbeb" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="25" fontSize="7" fill="#1e293b">• Use R100 surface for angle beam calibration</text>
        <text x="10" y="38" fontSize="7" fill="#1e293b">• 50mm hole for zero calibration</text>
        <text x="10" y="51" fontSize="7" fill="#1e293b">• Scale markings for distance calibration</text>
        <text x="10" y="64" fontSize="7" fill="#1e293b">• Slots for depth/resolution checks</text>
      </g>
    </g>
  );
}

export default EnhancedIIWBlockDrawing;
