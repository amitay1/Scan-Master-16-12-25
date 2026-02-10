/**
 * Dynamic Enhanced IOW Block Drawing
 * Area-Amplitude (IOW) reference block with FBH array
 * Per ASME/ASTM standards for area-amplitude calibration
 */

import React from 'react';
import {
  BlockDimensions,
  FBHData,
  formatDimension,
  fbhSizeToMm,
  validateFbhPosition,
} from './types';

interface IOWBlockDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  fbhData: FBHData;
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
 * FBH Array pattern for IOW block
 * Standard IOW has 3 rows x 5 columns = 15 holes
 */
function FBHArray({
  baseX,
  baseY,
  fbhData,
  blockHeight,
  blockWidth,
  scale,
  uniqueId,
  showDimensions,
}: {
  baseX: number;
  baseY: number;
  fbhData: FBHData;
  blockHeight: number;
  blockWidth: number;
  scale: number;
  uniqueId: string;
  showDimensions: boolean;
}) {
  const fbhDiameter = fbhSizeToMm(fbhData.size) * scale;
  const rows = 3;
  const cols = 5;
  
  // Spacing calculations
  const margin = 25 * scale;
  const availableWidth = blockWidth - 2 * margin;
  const availableHeight = blockHeight - 2 * margin;
  const spacingX = availableWidth / (cols - 1);
  const spacingY = availableHeight / (rows - 1);

  const holes = [];
  
  // Create 3x5 array of FBH
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = baseX + margin + col * spacingX;
      const cy = baseY + margin + row * spacingY;
      
      holes.push(
        <g key={`fbh-${row}-${col}`}>
          {/* FBH hole */}
          <circle
            cx={cx}
            cy={cy}
            r={fbhDiameter / 2}
            fill="#1e293b"
            stroke="#1e293b"
            strokeWidth="1"
          />
          {/* Hole number */}
          <text
            x={cx}
            y={cy + fbhDiameter + 6}
            fontSize="5"
            fill="#64748b"
            textAnchor="middle"
          >
            {row * cols + col + 1}
          </text>
        </g>
      );
    }
  }

  // Row depth indicators per standard DAC points: T/4, T/2, 3T/4
  const rowDepths = [
    fbhData.depth * 0.25,
    fbhData.depth * 0.50,
    fbhData.depth * 0.75
  ];

  return (
    <g>
      {holes}
      
      {/* Row labels with depths */}
      {showDimensions && rowDepths.map((depth, i) => (
        <text
          key={`depth-${i}`}
          x={baseX + blockWidth + 15}
          y={baseY + margin + i * spacingY + 3}
          fontSize="7"
          fill="#1e293b"
          textAnchor="start"
        >
          D{i + 1}: {depth.toFixed(1)}mm
        </text>
      ))}
    </g>
  );
}

/**
 * Main Enhanced IOW Block Drawing Component
 */
export function EnhancedIOWBlockDrawing({
  uniqueId,
  dimensions,
  fbhData,
  scale,
  showDimensions = true,
}: IOWBlockDrawingProps) {
  const { length = 200, width = 100, height = 75 } = dimensions;
  const fbhDiameter = fbhSizeToMm(fbhData.size);
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  
  // Validate FBH positions
  const validationResult = validateFbhPosition(
    fbhData,
    { length, width, height }
  );

  return (
    <g>
      {/* ==================== VIEW A - TOP (FBH ARRAY) ==================== */}
      <g transform="translate(30, 30)">
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - TOP (SCANNING SURFACE)
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

        {/* FBH array */}
        <FBHArray
          baseX={0}
          baseY={0}
          fbhData={fbhData}
          blockHeight={scaledWidth}
          blockWidth={scaledLength}
          scale={scale}
          uniqueId={uniqueId}
          showDimensions={showDimensions}
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
              offset={55} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== VIEW B - SECTION (FBH DEPTHS) ==================== */}
      <g transform="translate(340, 30)">
        <text x={scaledWidth / 2 + 20} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          SECTION B-B (FBH DEPTHS)
        </text>

        {/* Hatching pattern */}
        <defs>
          <pattern id={`hatch-iow-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Block cross-section */}
        <rect 
          x="0" 
          y="0" 
          width={scaledWidth} 
          height={scaledHeight} 
          fill={`url(#hatch-iow-${uniqueId})`}
          stroke="#1e293b" 
          strokeWidth="2"
        />

        {/* FBH depths visualization (3 rows at T/4, T/2, 3T/4) */}
        {[0.25, 0.50, 0.75].map((depthRatio, i) => {
          const y = depthRatio * scaledHeight - (fbhSizeToMm(fbhData.size) * scale / 2);
          const fbhR = fbhSizeToMm(fbhData.size) * scale / 2;
          
          return (
            <g key={`fbh-section-${i}`}>
              {/* FBH representation in section */}
              <rect
                x={scaledWidth / 2 - fbhR}
                y={y - fbhR}
                width={fbhR * 2}
                height={fbhR * 2}
                fill="white"
                stroke="#1e293b"
                strokeWidth="1"
              />
              
              {/* Depth dimension line */}
              {showDimensions && (
                <g>
                  <line 
                    x1={scaledWidth + 10} 
                    y1={0} 
                    x2={scaledWidth + 10} 
                    y2={y}
                    stroke="#64748b" 
                    strokeWidth="0.5"
                    strokeDasharray="3,2"
                  />
                  <text 
                    x={scaledWidth + 25} 
                    y={y / 2 + 3}
                    fontSize="7"
                    fill="#1e293b"
                  >
                    {(fbhData.depth * depthRatio).toFixed(1)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Scanning surface indicator */}
        <line x1="-10" y1="0" x2={scaledWidth + 10} y2="0" stroke="#22c55e" strokeWidth="2"/>
        <text x={scaledWidth + 15} y="4" fontSize="6" fill="#22c55e">SCAN</text>

        {/* Dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledHeight} 
              x2={scaledWidth} y2={scaledHeight} 
              value={width}
              offset={20} uniqueId={uniqueId}
            />
            <DimensionLine 
              x1={0} y1={0} 
              x2={0} y2={scaledHeight} 
              value={height} tolerance={0.05}
              offset={-30} vertical uniqueId={uniqueId}
            />
          </>
        )}
      </g>

      {/* ==================== FBH SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(30, 180)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          FBH ARRAY SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="280" height="80" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table content */}
        <line x1="0" y1="28" x2="280" y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="140" y1="8" x2="140" y2="88" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="10" y="22" fontSize="8" fontWeight="600" fill="#1e293b">PARAMETER</text>
        <text x="150" y="22" fontSize="8" fontWeight="600" fill="#1e293b">VALUE</text>
        
        <text x="10" y="40" fontSize="8" fill="#1e293b">FBH Diameter</text>
        <text x="150" y="40" fontSize="8" fill="#1e293b">⌀{fbhDiameter.toFixed(2)} mm ({fbhData.size})</text>
        
        <text x="10" y="55" fontSize="8" fill="#1e293b">Array Configuration</text>
        <text x="150" y="55" fontSize="8" fill="#1e293b">3 rows × 5 columns = 15 holes</text>
        
        <text x="10" y="70" fontSize="8" fill="#1e293b">Max Depth (Row 3)</text>
        <text x="150" y="70" fontSize="8" fill="#1e293b">{fbhData.depth.toFixed(1)} mm</text>
        
        <text x="10" y="85" fontSize="8" fill="#1e293b">Depth Increments (T/4, T/2, 3T/4)</text>
        <text x="150" y="85" fontSize="8" fill="#1e293b">{(fbhData.depth * 0.25).toFixed(1)} / {(fbhData.depth * 0.50).toFixed(1)} / {(fbhData.depth * 0.75).toFixed(1)} mm</text>
      </g>

      {/* ==================== CALIBRATION INFO ==================== */}
      <g transform="translate(330, 180)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          AREA-AMPLITUDE CALIBRATION
        </text>
        <rect x="0" y="8" width="220" height="80" fill="#eff6ff" stroke="#1e293b" strokeWidth="1"/>
        
        <text x="10" y="25" fontSize="7" fill="#1e293b">• Area-amplitude calibration per ASTM E2491</text>
        <text x="10" y="38" fontSize="7" fill="#1e293b">• Response varies with reflector depth</text>
        <text x="10" y="51" fontSize="7" fill="#1e293b">• Used to establish DAC/TCG curves</text>
        <text x="10" y="64" fontSize="7" fill="#1e293b">• 15-hole array covers full range</text>
        <text x="10" y="77" fontSize="7" fill="#1e293b">• Scan from top surface (green line)</text>
      </g>

      {/* Validation warning if FBH out of bounds */}
      {!validationResult.valid && (
        <g transform="translate(30, 275)">
          <rect x="0" y="0" width="520" height="25" fill="#fef2f2" stroke="#dc2626" strokeWidth="1"/>
          <text x="10" y="16" fontSize="9" fill="#dc2626" fontWeight="600">
            ⚠ WARNING: {validationResult.warning || 'FBH position out of bounds'}
          </text>
        </g>
      )}
    </g>
  );
}

export default EnhancedIOWBlockDrawing;
