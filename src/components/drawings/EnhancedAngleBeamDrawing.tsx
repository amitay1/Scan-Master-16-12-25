/**
 * Dynamic Enhanced Angle Beam Block Drawing
 * Fully dynamic SVG drawing for angle beam test blocks with SDH
 */

import React from 'react';
import {
  BlockDimensions,
  FBHData,
  formatDimension,
} from './types';

interface AngleBeamDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  fbhData: FBHData[]; // Used for SDH positions
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
 * Main Enhanced Angle Beam Drawing Component
 */
export function EnhancedAngleBeamDrawing({
  uniqueId,
  dimensions,
  fbhData,
  scale,
  showDimensions = true
}: AngleBeamDrawingProps) {
  const { length, width, height, angle = 45 } = dimensions;
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // SDH positions (Side Drilled Holes)
  // Clamp depths to valid range (5% to 95% of block height)
  const minDepth = height * 0.05;
  const maxDepth = height * 0.95;
  const sdhDepths = fbhData.length > 0
    ? fbhData.map(f => Math.min(Math.max(f.depth, minDepth), maxDepth))
    : [height * 0.25, height * 0.5, height * 0.75];

  return (
    <g>
      {/* ==================== VIEW A - TOP VIEW ==================== */}
      <g transform="translate(30, 50)">
        <text x={scaledLength / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - TOP
        </text>

        {/* Block outline */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength} 
          height={scaledWidth} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Center lines */}
        <line 
          x1={scaledLength / 2} 
          y1="-10" 
          x2={scaledLength / 2} 
          y2={scaledWidth + 10} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />
        <line 
          x1="-10" 
          y1={scaledWidth / 2} 
          x2={scaledLength + 10} 
          y2={scaledWidth / 2} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* SDH holes shown as dashed circles (hidden lines) */}
        {sdhDepths.map((depth, i) => {
          const spacing = scaledLength / (sdhDepths.length + 1);
          const x = spacing * (i + 1);
          const holeRadius = fbhData[i] ? Math.max(fbhData[i].diameter * scale, 3) : 3;

          return (
            <g key={i}>
              <circle 
                cx={x} 
                cy={scaledWidth / 2} 
                r={holeRadius} 
                fill="none" 
                stroke="#1e293b" 
                strokeWidth="0.8"
                strokeDasharray="3,2"
              />
              {/* Cross mark */}
              <line x1={x - 4} y1={scaledWidth / 2} x2={x + 4} y2={scaledWidth / 2} stroke="#1e293b" strokeWidth="0.4"/>
              <line x1={x} y1={scaledWidth / 2 - 4} x2={x} y2={scaledWidth / 2 + 4} stroke="#1e293b" strokeWidth="0.4"/>
            </g>
          );
        })}

        {/* Beam angle indicator */}
        <g transform={`translate(${scaledLength - 30}, 15)`}>
          <line x1="0" y1="0" x2="25" y2="0" stroke="#2563eb" strokeWidth="0.8"/>
          <line 
            x1="0" 
            y1="0" 
            x2={25 * Math.cos(angle * Math.PI / 180)} 
            y2={25 * Math.sin(angle * Math.PI / 180)} 
            stroke="#2563eb" 
            strokeWidth="0.8"
          />
          <path 
            d={`M 10 0 A 10 10 0 0 1 ${10 * Math.cos(angle * Math.PI / 180)} ${10 * Math.sin(angle * Math.PI / 180)}`}
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="0.5"
          />
          <text x="15" y={12} fontSize="7" fill="#2563eb">{angle}°</text>
        </g>

        {/* Section line A-A */}
        <line 
          x1="-15" 
          y1={scaledWidth / 2} 
          x2={scaledLength + 15} 
          y2={scaledWidth / 2} 
          stroke="#1e293b" 
          strokeWidth="1" 
          strokeDasharray="12,4"
        />
        <circle cx="-15" cy={scaledWidth / 2} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x="-15" y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">A</text>
        <circle cx={scaledLength + 15} cy={scaledWidth / 2} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={scaledLength + 15} y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">A</text>

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWidth} 
              x2={scaledLength} y2={scaledWidth} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledWidth} 
              value={width} tolerance={0.1}
              offset={25} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW B - SECTION A-A ==================== */}
      <g transform="translate(280, 50)">
        <text x={scaledLength / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - SECTION A-A
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-angle-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Block outline */}
        <rect 
          x="0" 
          y="0" 
          width={scaledLength} 
          height={scaledHeight} 
          fill={`url(#hatch-angle-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* SDH holes */}
        {sdhDepths.map((depth, i) => {
          const spacing = scaledLength / (sdhDepths.length + 1);
          const x = spacing * (i + 1);
          const scaledDepth = depth * scale;
          const holeRadius = fbhData[i] ? Math.max(fbhData[i].diameter * scale, 3) : 3;

          return (
            <g key={i}>
              {/* SDH circle */}
              <circle 
                cx={x} 
                cy={scaledDepth} 
                r={holeRadius} 
                fill="white" 
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              {/* Depth dimension line */}
              <line 
                x1={x + holeRadius + 3} 
                y1="0" 
                x2={x + holeRadius + 3} 
                y2={scaledDepth} 
                stroke="#1e293b" 
                strokeWidth="0.4"
              />
              <line 
                x1={x + holeRadius} 
                y1="0" 
                x2={x + holeRadius + 6} 
                y2="0" 
                stroke="#1e293b" 
                strokeWidth="0.4"
              />
              <line 
                x1={x + holeRadius} 
                y1={scaledDepth} 
                x2={x + holeRadius + 6} 
                y2={scaledDepth} 
                stroke="#1e293b" 
                strokeWidth="0.4"
              />
              <text 
                x={x + holeRadius + 8} 
                y={scaledDepth / 2 + 3} 
                fontSize="7" 
                fill="#1e293b"
              >
                {depth.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Angle beam path visualization */}
        <g>
          <line 
            x1={scaledLength * 0.1} 
            y1="0" 
            x2={scaledLength * 0.1 + scaledHeight * Math.tan(angle * Math.PI / 180)} 
            y2={scaledHeight} 
            stroke="#2563eb" 
            strokeWidth="1" 
            strokeDasharray="5,3"
          />
          <line 
            x1={scaledLength * 0.1 + scaledHeight * Math.tan(angle * Math.PI / 180)} 
            y1={scaledHeight} 
            x2={scaledLength * 0.1 + scaledHeight * Math.tan(angle * Math.PI / 180) * 2} 
            y2="0" 
            stroke="#2563eb" 
            strokeWidth="1" 
            strokeDasharray="5,3"
          />
          <text 
            x={scaledLength * 0.1 + 5} 
            y="15" 
            fontSize="7" 
            fill="#2563eb"
          >
            {angle}° beam
          </text>
        </g>

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledHeight} 
              x2={scaledLength} y2={scaledHeight} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledHeight} 
              value={height} tolerance={0.05}
              offset={25} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW C - END VIEW ==================== */}
      <g transform="translate(550, 50)">
        <text x={scaledWidth / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW C - END
        </text>

        {/* Block outline */}
        <rect 
          x="0" 
          y="0" 
          width={scaledWidth} 
          height={scaledHeight} 
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Center line */}
        <line 
          x1={scaledWidth / 2} 
          y1="-10" 
          x2={scaledWidth / 2} 
          y2={scaledHeight + 10} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* SDH shown as horizontal line */}
        {sdhDepths.map((depth, i) => {
          const scaledDepth = depth * scale;
          return (
            <line 
              key={i}
              x1="0" 
              y1={scaledDepth} 
              x2={scaledWidth} 
              y2={scaledDepth} 
              stroke="#1e293b" 
              strokeWidth="0.8"
              strokeDasharray="3,2"
            />
          );
        })}

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledHeight} 
              x2={scaledWidth} y2={scaledHeight} 
              value={width}
              offset={15} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledWidth} y1={0} 
              x2={scaledWidth} y2={scaledHeight} 
              value={height}
              offset={15} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== SDH SPECIFICATIONS ==================== */}
      <g transform="translate(30, 200)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          SDH SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="220" height={25 + sdhDepths.length * 15} fill="white" stroke="#1e293b" strokeWidth="1"/>
        <line x1="0" y1="28" x2="220" y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="22" fontSize="7" fontWeight="600" fill="#1e293b">HOLE</text>
        <text x="60" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH (mm)</text>
        <text x="130" y="22" fontSize="7" fontWeight="600" fill="#1e293b">SIZE</text>
        <text x="180" y="22" fontSize="7" fontWeight="600" fill="#1e293b">TYPE</text>
        
        {sdhDepths.map((depth, i) => (
          <g key={i} transform={`translate(0, ${30 + i * 15})`}>
            <text x="10" y="10" fontSize="7" fill="#1e293b">{i + 1}</text>
            <text x="60" y="10" fontSize="7" fill="#1e293b">{depth.toFixed(1)}</text>
            <text x="130" y="10" fontSize="7" fill="#1e293b">{fbhData[i]?.size || '1.5mm'}</text>
            <text x="180" y="10" fontSize="7" fill="#1e293b">SDH</text>
          </g>
        ))}
      </g>

      {/* Angle info box */}
      <g transform="translate(280, 200)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          BEAM ANGLE PARAMETERS
        </text>
        <rect x="0" y="8" width="180" height="50" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="28" fontSize="8" fill="#1e293b">Primary Angle: {angle}°</text>
        <text x="10" y="43" fontSize="8" fill="#1e293b">Refracted Angle: {(angle * 1.5).toFixed(1)}° (steel)</text>
      </g>
    </g>
  );
}

export default EnhancedAngleBeamDrawing;
