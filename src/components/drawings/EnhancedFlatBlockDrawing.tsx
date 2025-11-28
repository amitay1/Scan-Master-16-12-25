/**
 * Dynamic Enhanced Flat Block Drawing
 * Fully dynamic SVG drawing that responds to dimension and FBH props
 */

import React from 'react';
import {
  DynamicDrawingProps,
  BlockDimensions,
  FBHData,
  DEFAULT_DIMENSIONS,
  DEFAULT_FBH_DATA,
  calculateAutoScale,
  formatDimension,
  validateFbhPosition,
  clamp
} from './types';

interface FlatBlockDrawingProps {
  uniqueId: string;
  dimensions: BlockDimensions;
  fbhData: FBHData[];
  scale: number;
  showDimensions?: boolean;
  editable?: boolean;
  onDimensionClick?: (key: string, value: number) => void;
}

/**
 * Professional Dimension Line Component
 */
function DimensionLine({
  x1, y1, x2, y2,
  value,
  tolerance,
  offset = 20,
  vertical = false,
  uniqueId,
  editable = false,
  onClick
}: {
  x1: number; y1: number; x2: number; y2: number;
  value: number;
  tolerance?: number;
  offset?: number;
  vertical?: boolean;
  uniqueId: string;
  editable?: boolean;
  onClick?: () => void;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const label = formatDimension(value, tolerance);
  
  const cursorStyle = editable ? 'pointer' : 'default';
  const textClass = editable ? 'hover:fill-blue-600 transition-colors' : '';

  if (vertical) {
    return (
      <g className="dimension" style={{ cursor: cursorStyle }} onClick={onClick}>
        {/* Extension lines */}
        <line x1={x1 - 3} y1={y1} x2={x1 + offset + 5} y2={y1} stroke="#1e293b" strokeWidth="0.4"/>
        <line x1={x2 - 3} y1={y2} x2={x2 + offset + 5} y2={y2} stroke="#1e293b" strokeWidth="0.4"/>
        {/* Dimension line with arrows */}
        <line
          x1={x1 + offset} y1={y1 + 3}
          x2={x2 + offset} y2={y2 - 3}
          stroke="#1e293b" strokeWidth="0.6"
          markerStart={`url(#arrow-rev-${uniqueId})`}
          markerEnd={`url(#arrow-${uniqueId})`}
        />
        {/* Label background */}
        <rect x={x1 + offset - 22} y={midY - 6} width="44" height="12" fill="white"/>
        {/* Label */}
        <text
          x={x1 + offset}
          y={midY + 3}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill="#1e293b"
          fontFamily="Arial, sans-serif"
          className={textClass}
        >
          {label}
        </text>
      </g>
    );
  }

  return (
    <g className="dimension" style={{ cursor: cursorStyle }} onClick={onClick}>
      {/* Extension lines */}
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      {/* Dimension line with arrows */}
      <line
        x1={x1 + 3} y1={y1 + offset}
        x2={x2 - 3} y2={y2 + offset}
        stroke="#1e293b" strokeWidth="0.6"
        markerStart={`url(#arrow-rev-${uniqueId})`}
        markerEnd={`url(#arrow-${uniqueId})`}
      />
      {/* Label background */}
      <rect x={midX - 24} y={y1 + offset - 6} width="48" height="12" fill="white"/>
      {/* Label */}
      <text
        x={midX}
        y={y1 + offset + 3}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#1e293b"
        fontFamily="Arial, sans-serif"
        className={textClass}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * FBH Hole Component with Callout
 */
function FBHHole({
  hole,
  blockWidth,
  scale,
  index,
  invalid = false
}: {
  hole: FBHData;
  blockWidth: number;
  scale: number;
  index: number;
  invalid?: boolean;
}) {
  const cx = hole.position.x * scale;
  const cy = (blockWidth / 2) * scale; // Center on Y axis of top view
  const r = Math.max(hole.diameter * scale * 2, 2); // Minimum visible radius
  
  const strokeColor = invalid ? '#ef4444' : '#1e293b';
  const fillColor = invalid ? '#fee2e2' : 'none';
  
  // Callout position - stagger to avoid overlap
  const calloutY = 15 - index * 12;
  const calloutX = cx + r + 20;

  return (
    <g>
      {/* Hole circle */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill={fillColor} 
        stroke={strokeColor} 
        strokeWidth="1.5"
      />
      {/* Cross-hair for hole center */}
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke={strokeColor} strokeWidth="0.4"/>
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke={strokeColor} strokeWidth="0.4"/>
      {/* Hole callout line */}
      <line 
        x1={cx + r} 
        y1={cy - r} 
        x2={calloutX - 5} 
        y2={calloutY} 
        stroke={strokeColor} 
        strokeWidth="0.4"
      />
      {/* Callout text */}
      <text 
        x={calloutX} 
        y={calloutY + 3} 
        fontSize="8" 
        fill={strokeColor} 
        fontFamily="Arial, sans-serif"
      >
        Ø{hole.size || `${hole.diameter.toFixed(2)}mm`}
      </text>
      {invalid && (
        <text 
          x={calloutX} 
          y={calloutY + 12} 
          fontSize="6" 
          fill="#ef4444" 
          fontFamily="Arial, sans-serif"
        >
          ⚠ Out of bounds
        </text>
      )}
    </g>
  );
}

/**
 * Section View A-A Component (Front/Side View showing FBH depths)
 */
function SectionViewAA({
  dimensions,
  fbhData,
  scale,
  uniqueId,
  showDimensions = true
}: {
  dimensions: BlockDimensions;
  fbhData: FBHData[];
  scale: number;
  uniqueId: string;
  showDimensions?: boolean;
}) {
  const length = dimensions.length * scale;
  const height = dimensions.height * scale;

  return (
    <g>
      {/* View label */}
      <text x={length / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
        VIEW B - SECTION A-A
      </text>

      {/* Block outline */}
      <rect x="0" y="0" width={length} height={height} fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>

      {/* Hatching pattern for section */}
      <defs>
        <pattern id={`hatch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width={length} height={height} fill={`url(#hatch-${uniqueId})`} opacity="0.3"/>

      {/* FBH holes shown as vertical lines from top */}
      {fbhData.map((hole, i) => {
        const holeX = hole.position.x * scale;
        const holeDepth = hole.depth * scale;
        const holeRadius = Math.max(hole.diameter * scale, 1);
        
        return (
          <g key={i}>
            {/* Hole representation in section */}
            <rect 
              x={holeX - holeRadius} 
              y="0" 
              width={holeRadius * 2} 
              height={holeDepth} 
              fill="white" 
              stroke="#1e293b" 
              strokeWidth="1"
            />
            {/* Bottom of hole (flat bottom) */}
            <line 
              x1={holeX - holeRadius} 
              y1={holeDepth} 
              x2={holeX + holeRadius} 
              y2={holeDepth} 
              stroke="#1e293b" 
              strokeWidth="1.5"
            />
            {/* Depth dimension */}
            {showDimensions && (
              <g>
                <line x1={holeX + holeRadius + 5} y1="0" x2={holeX + holeRadius + 5} y2={holeDepth} stroke="#1e293b" strokeWidth="0.4"/>
                <text 
                  x={holeX + holeRadius + 8} 
                  y={holeDepth / 2 + 3} 
                  fontSize="7" 
                  fill="#1e293b" 
                  fontFamily="Arial, sans-serif"
                >
                  {hole.depth.toFixed(1)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Main dimensions */}
      {showDimensions && (
        <>
          <DimensionLine 
            x1={0} y1={height} x2={length} y2={height} 
            value={dimensions.length} tolerance={0.1}
            offset={25} uniqueId={uniqueId}
          />
          <DimensionLine 
            x1={length} y1={0} x2={length} y2={height} 
            value={dimensions.height} tolerance={0.05}
            offset={25} vertical uniqueId={uniqueId}
          />
        </>
      )}
    </g>
  );
}

/**
 * End View Component
 */
function EndView({
  dimensions,
  scale,
  uniqueId,
  showDimensions = true
}: {
  dimensions: BlockDimensions;
  scale: number;
  uniqueId: string;
  showDimensions?: boolean;
}) {
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;

  return (
    <g>
      {/* View label */}
      <text x={width / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
        VIEW C - END
      </text>

      {/* Block outline */}
      <rect x="0" y="0" width={width} height={height} fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>

      {/* Center lines */}
      <line x1={width / 2} y1="-10" x2={width / 2} y2={height + 10} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
      <line x1="-10" y1={height / 2} x2={width + 10} y2={height / 2} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>

      {/* Dimensions */}
      {showDimensions && (
        <>
          <DimensionLine 
            x1={0} y1={height} x2={width} y2={height} 
            value={dimensions.width}
            offset={20} uniqueId={uniqueId}
          />
          <DimensionLine 
            x1={width} y1={0} x2={width} y2={height} 
            value={dimensions.height}
            offset={20} vertical uniqueId={uniqueId}
          />
        </>
      )}
    </g>
  );
}

/**
 * Main Enhanced Flat Block Drawing Component
 */
export function EnhancedFlatBlockDrawing({
  uniqueId,
  dimensions,
  fbhData,
  scale,
  showDimensions = true,
  editable = false,
  onDimensionClick
}: FlatBlockDrawingProps) {
  const { length, width, height } = dimensions;
  
  // Calculate scaled dimensions
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Validate FBH positions
  const validatedFbh = fbhData.map(fbh => ({
    ...fbh,
    invalid: !validateFbhPosition(fbh, dimensions).valid
  }));

  // Calculate FBH spacing for dimension lines
  const fbhPositions = fbhData.map(f => f.position.x).sort((a, b) => a - b);
  const fbhSpacings: number[] = [];
  for (let i = 0; i < fbhPositions.length; i++) {
    if (i === 0) {
      fbhSpacings.push(fbhPositions[i]);
    } else {
      fbhSpacings.push(fbhPositions[i] - fbhPositions[i - 1]);
    }
  }
  // Add remaining distance to end
  if (fbhPositions.length > 0) {
    fbhSpacings.push(length - fbhPositions[fbhPositions.length - 1]);
  }

  return (
    <g>
      {/* ==================== VIEW A - TOP VIEW ==================== */}
      <g transform="translate(20, 50)">
        {/* View label */}
        <text x={scaledLength / 2} y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          VIEW A - TOP
        </text>

        {/* Block outline with thick lines */}
        <rect x="0" y="0" width={scaledLength} height={scaledWidth} fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>

        {/* Center lines (red, long-short dash) */}
        <line x1={scaledLength / 2} y1="-10" x2={scaledLength / 2} y2={scaledWidth + 10} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1={scaledWidth / 2} x2={scaledLength + 10} y2={scaledWidth / 2} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>

        {/* FBH holes with proper symbols */}
        {validatedFbh.map((hole, i) => (
          <FBHHole 
            key={i} 
            hole={hole} 
            blockWidth={width} 
            scale={scale} 
            index={i}
            invalid={hole.invalid}
          />
        ))}

        {/* FBH spacing dimensions */}
        {showDimensions && fbhPositions.length > 0 && (
          <g>
            {/* First spacing (0 to first FBH) */}
            <DimensionLine 
              x1={0} y1={scaledWidth} 
              x2={fbhPositions[0] * scale} y2={scaledWidth} 
              value={fbhPositions[0]}
              offset={25} uniqueId={uniqueId}
            />
            {/* Spacing between FBHs */}
            {fbhPositions.slice(1).map((pos, i) => (
              <DimensionLine 
                key={i}
                x1={fbhPositions[i] * scale} y1={scaledWidth} 
                x2={pos * scale} y2={scaledWidth} 
                value={pos - fbhPositions[i]}
                offset={25} uniqueId={uniqueId}
              />
            ))}
            {/* Last spacing (last FBH to end) */}
            <DimensionLine 
              x1={fbhPositions[fbhPositions.length - 1] * scale} y1={scaledWidth} 
              x2={scaledLength} y2={scaledWidth} 
              value={length - fbhPositions[fbhPositions.length - 1]}
              offset={25} uniqueId={uniqueId}
            />
          </g>
        )}

        {/* Overall dimensions */}
        {showDimensions && (
          <>
            <DimensionLine 
              x1={0} y1={scaledWidth} 
              x2={scaledLength} y2={scaledWidth} 
              value={length} tolerance={0.1}
              offset={45} uniqueId={uniqueId}
              editable={editable}
              onClick={() => onDimensionClick?.('length', length)}
            />
            <DimensionLine 
              x1={scaledLength} y1={0} 
              x2={scaledLength} y2={scaledWidth} 
              value={width} tolerance={0.1}
              offset={25} vertical uniqueId={uniqueId}
              editable={editable}
              onClick={() => onDimensionClick?.('width', width)}
            />
          </>
        )}

        {/* Section line A-A */}
        <line x1="-15" y1={scaledWidth / 2} x2={scaledLength + 15} y2={scaledWidth / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="12,4"/>
        <circle cx="-15" cy={scaledWidth / 2} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x="-15" y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">A</text>
        <circle cx={scaledLength + 15} cy={scaledWidth / 2} r="8" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <text x={scaledLength + 15} y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">A</text>
      </g>

      {/* ==================== VIEW B - SECTION A-A ==================== */}
      <g transform="translate(280, 50)">
        <SectionViewAA 
          dimensions={dimensions} 
          fbhData={fbhData} 
          scale={scale} 
          uniqueId={uniqueId}
          showDimensions={showDimensions}
        />
      </g>

      {/* ==================== VIEW C - END VIEW ==================== */}
      <g transform="translate(540, 50)">
        <EndView 
          dimensions={dimensions} 
          scale={scale} 
          uniqueId={uniqueId}
          showDimensions={showDimensions}
        />
      </g>

      {/* ==================== FBH SPECIFICATIONS TABLE ==================== */}
      <g transform="translate(20, 200)">
        <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">
          FBH SPECIFICATIONS
        </text>
        <rect x="0" y="8" width="250" height={20 + fbhData.length * 15} fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <line x1="0" y1="28" x2="250" y2="28" stroke="#1e293b" strokeWidth="0.5"/>
        <text x="10" y="22" fontSize="7" fontWeight="600" fill="#1e293b">HOLE</text>
        <text x="50" y="22" fontSize="7" fontWeight="600" fill="#1e293b">SIZE</text>
        <text x="100" y="22" fontSize="7" fontWeight="600" fill="#1e293b">Ø (mm)</text>
        <text x="145" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH</text>
        <text x="195" y="22" fontSize="7" fontWeight="600" fill="#1e293b">X POS</text>
        
        {/* Table rows */}
        {fbhData.map((hole, i) => (
          <g key={i} transform={`translate(0, ${30 + i * 15})`}>
            <text x="10" y="10" fontSize="7" fill="#1e293b">{i + 1}</text>
            <text x="50" y="10" fontSize="7" fill="#1e293b">{hole.size || '-'}</text>
            <text x="100" y="10" fontSize="7" fill="#1e293b">{hole.diameter.toFixed(2)}</text>
            <text x="145" y="10" fontSize="7" fill="#1e293b">{hole.depth.toFixed(1)}</text>
            <text x="195" y="10" fontSize="7" fill="#1e293b">{hole.position.x.toFixed(1)}</text>
          </g>
        ))}
      </g>
    </g>
  );
}

export default EnhancedFlatBlockDrawing;
