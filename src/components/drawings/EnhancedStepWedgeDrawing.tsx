/**
 * Dynamic Enhanced Step Wedge Drawing
 * Fully dynamic SVG drawing for step wedge calibration blocks
 */

import React from 'react';
import {
  BlockDimensions,
  formatDimension,
} from './types';

interface StepWedgeDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  scale: number;
  showDimensions?: boolean;
  stepCount?: number;
  stepHeights?: number[];
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
        <rect x={x1 + offset - 18} y={midY - 6} width="36" height="12" fill="white"/>
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
      <rect x={midX - 20} y={y1 + offset - 6} width="40" height="12" fill="white"/>
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
 * Main Enhanced Step Wedge Drawing Component
 */
export function EnhancedStepWedgeDrawing({
  uniqueId,
  dimensions,
  scale,
  showDimensions = true,
  stepCount = 5,
  stepHeights
}: StepWedgeDrawingProps) {
  const { length = 200, width = 60, height = 50 } = dimensions;
  
  // Calculate step heights if not provided
  const heights = stepHeights || Array.from({ length: stepCount }, (_, i) => 
    (height / stepCount) * (i + 1)
  );
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledMaxHeight = height * scale;
  const stepWidth = scaledLength / stepCount;

  // Calculate scaled step heights
  const scaledHeights = heights.map(h => h * scale);
  
  // Base Y position (bottom of the tallest step)
  const baseY = 120;

  return (
    <g>
      {/* ==================== VIEW A - FRONT (Step Profile) ==================== */}
      <g transform="translate(30, 30)">
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - FRONT (STEP PROFILE)
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-step-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Draw steps from left to right (ascending) */}
        {scaledHeights.map((stepH, i) => {
          const x = i * stepWidth;
          const y = baseY - stepH;
          
          return (
            <g key={i}>
              {/* Step body */}
              <rect 
                x={x} 
                y={y} 
                width={stepWidth} 
                height={stepH} 
                fill={`url(#hatch-step-${uniqueId})`}
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              
              {/* Step number */}
              <text 
                x={x + stepWidth / 2} 
                y={baseY - stepH / 2 + 3} 
                fontSize="9" 
                fontWeight="600"
                fill="#1e293b" 
                textAnchor="middle"
              >
                {i + 1}
              </text>

              {/* Height dimension for each step */}
              {showDimensions && (
                <g>
                  <line 
                    x1={x + stepWidth - 5} 
                    y1={baseY} 
                    x2={x + stepWidth - 5} 
                    y2={y} 
                    stroke="#1e293b" 
                    strokeWidth="0.4"
                  />
                  <text 
                    x={x + stepWidth - 8} 
                    y={baseY - stepH / 2 + 3} 
                    fontSize="6" 
                    fill="#1e293b" 
                    textAnchor="end"
                  >
                    {heights[i].toFixed(1)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Overall step outline */}
        <path 
          d={`
            M 0 ${baseY}
            ${scaledHeights.map((h, i) => `L ${i * stepWidth} ${baseY - h} L ${(i + 1) * stepWidth} ${baseY - h}`).join(' ')}
            L ${scaledLength} ${baseY}
            Z
          `}
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* Center line */}
        <line 
          x1={scaledLength / 2} 
          y1={baseY - scaledMaxHeight - 20} 
          x2={scaledLength / 2} 
          y2={baseY + 40} 
          stroke="#dc2626" 
          strokeWidth="0.5" 
          strokeDasharray="15,3,3,3"
        />

        {/* Overall dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={baseY} 
              x2={scaledLength} y2={baseY} 
              value={length} tolerance={0.1}
              offset={25} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={baseY - scaledMaxHeight} 
              x2={scaledLength} y2={baseY} 
              value={height} tolerance={0.05}
              offset={35} vertical uniqueId={uniqueId}
            />
            {/* Step width dimension */}
            <DimensionLine 
              x1={0} y1={baseY - scaledHeights[0]} 
              x2={stepWidth} y2={baseY - scaledHeights[0]} 
              value={length / stepCount}
              offset={-15} uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW B - TOP VIEW ==================== */}
      <g transform="translate(320, 50)">
        <text x={scaledLength / 2} y="-20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW B - TOP
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

        {/* Step divisions */}
        {Array.from({ length: stepCount - 1 }, (_, i) => (
          <line 
            key={i}
            x1={(i + 1) * stepWidth} 
            y1="0" 
            x2={(i + 1) * stepWidth} 
            y2={scaledWidth} 
            stroke="#1e293b" 
            strokeWidth="0.8"
            strokeDasharray="4,2"
          />
        ))}

        {/* Step numbers */}
        {Array.from({ length: stepCount }, (_, i) => (
          <text 
            key={i}
            x={i * stepWidth + stepWidth / 2} 
            y={scaledWidth / 2 + 3} 
            fontSize="10" 
            fontWeight="600"
            fill="#1e293b" 
            textAnchor="middle"
          >
            {i + 1}
          </text>
        ))}

        {/* Center line */}
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

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWidth} 
              x2={scaledLength} y2={scaledWidth} 
              value={length}
              offset={20} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledWidth} 
              value={width}
              offset={20} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== STEP SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(30, 200)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          STEP SPECIFICATIONS
        </text>
        <rect x="0" y="8" width={60 + stepCount * 45} height="60" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <line x1="0" y1="28" x2={60 + stepCount * 45} y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="22" fontSize="8" fontWeight="600" fill="#1e293b">STEP</text>
        {heights.map((_, i) => (
          <text key={i} x={60 + i * 45 + 20} y="22" fontSize="8" fontWeight="600" fill="#1e293b" textAnchor="middle">
            {i + 1}
          </text>
        ))}

        {/* Height row */}
        <line x1="0" y1="45" x2={60 + stepCount * 45} y2="45" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="40" fontSize="8" fill="#1e293b">HEIGHT</text>
        {heights.map((h, i) => (
          <text key={i} x={60 + i * 45 + 20} y="40" fontSize="8" fill="#1e293b" textAnchor="middle">
            {h.toFixed(1)}
          </text>
        ))}

        {/* Width row */}
        <text x="10" y="58" fontSize="8" fill="#1e293b">WIDTH</text>
        {heights.map((_, i) => (
          <text key={i} x={60 + i * 45 + 20} y="58" fontSize="8" fill="#1e293b" textAnchor="middle">
            {(length / stepCount).toFixed(1)}
          </text>
        ))}

        {/* Vertical column dividers */}
        <line x1="55" y1="8" x2="55" y2="68" stroke="#1e293b" strokeWidth="0.5"/>
        {heights.map((_, i) => (
          <line key={i} x1={60 + (i + 1) * 45} y1="8" x2={60 + (i + 1) * 45} y2="68" stroke="#1e293b" strokeWidth="0.5"/>
        ))}
      </g>

      {/* Usage notes */}
      <g transform="translate(350, 200)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          CALIBRATION NOTES
        </text>
        <rect x="0" y="8" width="200" height="60" fill="#fffbeb" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="25" fontSize="7" fill="#1e293b">• Use for thickness calibration</text>
        <text x="10" y="38" fontSize="7" fill="#1e293b">• Steps provide known metal travel</text>
        <text x="10" y="51" fontSize="7" fill="#1e293b">• Verify linearity across range</text>
      </g>
    </g>
  );
}

export default EnhancedStepWedgeDrawing;
