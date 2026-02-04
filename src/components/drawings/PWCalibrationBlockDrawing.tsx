/**
 * Pratt & Whitney IAE2P16675 Calibration Block Drawing Component
 *
 * Dedicated technical drawing for the P&W 45-degree angle calibration block
 * used for V2500 HPT Disk inspection per NDIP-1226/1227.
 *
 * Block specifications:
 * - Part Number: IAE2P16675
 * - Dimensions: 8.0" x 2.479" x 1.085" (203.2 x 62.97 x 27.56 mm)
 * - Material: Powdered Nickel equivalent
 * - FBH Size: #1 FBH (1/64" = 0.4mm diameter)
 * - Holes: L through S (0.250" to 1.000" depths)
 * - Omitted: J, K holes per NDIP Section 5.1.1.7.1
 */

import React, { useMemo, useId } from 'react';
import { PW_ANGLE_CALIBRATION_BLOCK, getActiveCalibrationHoles } from '@/rules/pw/pwCalibrationBlocks';

// ============================================================================
// TYPES
// ============================================================================

interface PWCalibrationBlockDrawingProps {
  /** Drawing width in pixels */
  width?: number;
  /** Drawing height in pixels */
  height?: number;
  /** Show dimensions */
  showDimensions?: boolean;
  /** Show title block */
  showTitleBlock?: boolean;
  /** Highlight specific holes (by ID) */
  highlightedHoles?: string[];
  /** Custom title */
  title?: string;
  /** NDIP standard reference */
  standardRef?: 'NDIP-1226' | 'NDIP-1227';
}

// ============================================================================
// CONSTANTS - Block Dimensions (from IAE2P16675 spec)
// ============================================================================

const BLOCK = {
  // Main dimensions (inches to mm)
  lengthMm: 203.2,    // 8.0"
  widthMm: 62.97,     // 2.479"
  heightMm: 27.56,    // 1.085"

  // 45-degree angle face
  angleDeq: 45,

  // Tolerances
  toleranceMm: 0.38,  // ±0.015"

  // FBH specifications
  fbhDiameterMm: 0.4, // 1/64" = 0.015625" = 0.4mm
  fbhNumber: 1,       // #1 FBH

  // Hole depths (inches, from sound entry surface)
  holes: [
    { id: 'J', depthInch: 0.125, depthMm: 3.175, used: false },
    { id: 'K', depthInch: 0.188, depthMm: 4.775, used: false },
    { id: 'L', depthInch: 0.250, depthMm: 6.350, used: true },
    { id: 'M', depthInch: 0.375, depthMm: 9.525, used: true },
    { id: 'N', depthInch: 0.500, depthMm: 12.700, used: true },
    { id: 'P', depthInch: 0.625, depthMm: 15.875, used: true },
    { id: 'Q', depthInch: 0.750, depthMm: 19.050, used: true },
    { id: 'R', depthInch: 0.875, depthMm: 22.225, used: true },
    { id: 'S', depthInch: 1.000, depthMm: 25.400, used: true },
  ],
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: string;
  tolerance?: string;
  offset?: number;
  vertical?: boolean;
  uniqueId: string;
}

function DimensionLine({
  x1, y1, x2, y2,
  value, tolerance,
  offset = 20,
  vertical = false,
  uniqueId,
}: DimensionLineProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const label = tolerance ? `${value} ${tolerance}` : value;

  if (vertical) {
    return (
      <g className="dimension-line">
        <line x1={x1 - 3} y1={y1} x2={x1 + offset + 5} y2={y1} stroke="#1e293b" strokeWidth="0.4" />
        <line x1={x2 - 3} y1={y2} x2={x2 + offset + 5} y2={y2} stroke="#1e293b" strokeWidth="0.4" />
        <line
          x1={x1 + offset} y1={y1 + 3}
          x2={x2 + offset} y2={y2 - 3}
          stroke="#1e293b" strokeWidth="0.6"
          markerStart={`url(#arrow-rev-${uniqueId})`}
          markerEnd={`url(#arrow-${uniqueId})`}
        />
        <rect x={x1 + offset - 25} y={midY - 6} width="50" height="12" fill="white" />
        <text
          x={x1 + offset}
          y={midY + 3}
          textAnchor="middle"
          fontSize="8"
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
    <g className="dimension-line">
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + offset + 5} stroke="#1e293b" strokeWidth="0.4" />
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + offset + 5} stroke="#1e293b" strokeWidth="0.4" />
      <line
        x1={x1 + 3} y1={y1 + offset}
        x2={x2 - 3} y2={y2 + offset}
        stroke="#1e293b" strokeWidth="0.6"
        markerStart={`url(#arrow-rev-${uniqueId})`}
        markerEnd={`url(#arrow-${uniqueId})`}
      />
      <rect x={midX - 28} y={y1 + offset - 6} width="56" height="12" fill="white" />
      <text
        x={midX}
        y={y1 + offset + 3}
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="#1e293b"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PWCalibrationBlockDrawing({
  width = 900,
  height = 650,
  showDimensions = true,
  showTitleBlock = true,
  highlightedHoles = [],
  title = 'IAE2P16675 - 45° Angle Calibration Block',
  standardRef = 'NDIP-1226',
}: PWCalibrationBlockDrawingProps) {
  const uniqueId = useId().replace(/:/g, '');

  // Get active holes from the P&W calibration block
  const activeHoles = useMemo(() => getActiveCalibrationHoles(PW_ANGLE_CALIBRATION_BLOCK), []);

  // Calculate scale to fit drawing
  const scale = Math.min(
    (width - 100) / (BLOCK.lengthMm * 1.5),
    (height - 200) / (BLOCK.heightMm * 8)
  );

  // Scaled dimensions
  const scaledLength = BLOCK.lengthMm * scale;
  const scaledWidth = BLOCK.widthMm * scale;
  const scaledHeight = BLOCK.heightMm * scale;

  // View positions
  const viewAX = 50;
  const viewAY = 80;
  const viewBX = 50;
  const viewBY = 280;
  const viewCX = scaledLength + 120;
  const viewCY = 80;

  return (
    <div className="pw-calibration-block-drawing bg-white rounded-lg border-2 border-blue-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-lg">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>P&W</span>
          <span className="text-sm font-normal opacity-80">Pratt & Whitney</span>
        </h3>
        <p className="text-sm opacity-90">{title}</p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block mx-auto"
      >
        {/* Definitions */}
        <defs>
          {/* Arrow markers */}
          <marker
            id={`arrow-${uniqueId}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill="#1e293b" />
          </marker>
          <marker
            id={`arrow-rev-${uniqueId}`}
            markerWidth="6"
            markerHeight="6"
            refX="1"
            refY="3"
            orient="auto"
          >
            <path d="M6,0 L0,3 L6,6 L4.5,3 Z" fill="#1e293b" />
          </marker>

          {/* Hatching pattern */}
          <pattern
            id={`hatch-${uniqueId}`}
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* ====================== VIEW A - TOP VIEW ====================== */}
        <g transform={`translate(${viewAX}, ${viewAY})`}>
          <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
            VIEW A - TOP (Sound Entry Surface)
          </text>

          {/* Block outline - rectangular */}
          <rect
            x="0" y="0"
            width={scaledLength}
            height={scaledWidth}
            fill="#f8fafc"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Center lines */}
          <line
            x1={scaledLength / 2} y1="-8"
            x2={scaledLength / 2} y2={scaledWidth + 8}
            stroke="#dc2626"
            strokeWidth="0.5"
            strokeDasharray="10,3,3,3"
          />
          <line
            x1="-8" y1={scaledWidth / 2}
            x2={scaledLength + 8} y2={scaledWidth / 2}
            stroke="#dc2626"
            strokeWidth="0.5"
            strokeDasharray="10,3,3,3"
          />

          {/* FBH holes (shown as circles from top) */}
          {BLOCK.holes.map((hole, index) => {
            const spacing = scaledLength / (BLOCK.holes.length + 1);
            const x = spacing * (index + 1);
            const holeRadius = Math.max(BLOCK.fbhDiameterMm * scale * 5, 3); // Exaggerated for visibility
            const isHighlighted = highlightedHoles.includes(hole.id);
            const isActive = hole.used;

            return (
              <g key={hole.id}>
                {/* Hole circle */}
                <circle
                  cx={x}
                  cy={scaledWidth / 2}
                  r={holeRadius}
                  fill={isHighlighted ? '#fef3c7' : isActive ? 'white' : '#f1f5f9'}
                  stroke={isHighlighted ? '#f59e0b' : isActive ? '#1e293b' : '#94a3b8'}
                  strokeWidth={isHighlighted ? '2' : '1'}
                  strokeDasharray={isActive ? 'none' : '2,2'}
                />
                {/* Cross mark for active holes */}
                {isActive && (
                  <>
                    <line
                      x1={x - 4} y1={scaledWidth / 2}
                      x2={x + 4} y2={scaledWidth / 2}
                      stroke="#1e293b" strokeWidth="0.4"
                    />
                    <line
                      x1={x} y1={scaledWidth / 2 - 4}
                      x2={x} y2={scaledWidth / 2 + 4}
                      stroke="#1e293b" strokeWidth="0.4"
                    />
                  </>
                )}
                {/* Hole label */}
                <text
                  x={x}
                  y={scaledWidth / 2 + holeRadius + 12}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight={isActive ? '700' : '400'}
                  fill={isActive ? '#1e293b' : '#94a3b8'}
                >
                  {hole.id}
                </text>
              </g>
            );
          })}

          {/* Section line A-A */}
          <line
            x1="-12" y1={scaledWidth / 2}
            x2={scaledLength + 12} y2={scaledWidth / 2}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="8,4"
          />
          <circle cx="-12" cy={scaledWidth / 2} r="7" fill="white" stroke="#1e293b" strokeWidth="1" />
          <text x="-12" y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#1e293b">A</text>
          <circle cx={scaledLength + 12} cy={scaledWidth / 2} r="7" fill="white" stroke="#1e293b" strokeWidth="1" />
          <text x={scaledLength + 12} y={scaledWidth / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#1e293b">A</text>

          {/* Dimensions */}
          {showDimensions && (
            <>
              <DimensionLine
                x1={0} y1={scaledWidth}
                x2={scaledLength} y2={scaledWidth}
                value="8.0&quot;" tolerance="(203.2mm)"
                offset={28} uniqueId={uniqueId}
              />
              <DimensionLine
                x1={scaledLength} y1={0}
                x2={scaledLength} y2={scaledWidth}
                value="2.479&quot;" tolerance="(63.0mm)"
                offset={28} vertical uniqueId={uniqueId}
              />
            </>
          )}
        </g>

        {/* ====================== VIEW B - SECTION A-A (with 45° angle) ====================== */}
        <g transform={`translate(${viewBX}, ${viewBY})`}>
          <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
            VIEW B - SECTION A-A (45° Angle Face with FBH)
          </text>

          {/* Block body with 45° angled top */}
          {/* Calculate 45° angle offset */}
          {(() => {
            const angleOffset = scaledHeight * Math.tan(Math.PI / 4); // tan(45°) = 1

            return (
              <>
                {/* Main block outline with angled top */}
                <path
                  d={`
                    M 0 ${scaledHeight * 3}
                    L 0 0
                    L ${angleOffset} ${scaledHeight * 3}
                    L ${scaledLength} ${scaledHeight * 3}
                    L ${scaledLength} ${scaledHeight}
                    L ${scaledLength - angleOffset} 0
                    L 0 0
                  `}
                  fill={`url(#hatch-${uniqueId})`}
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* 45° angle line */}
                <line
                  x1="0" y1="0"
                  x2={angleOffset} y2={scaledHeight * 3}
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Angle arc indicator */}
                <g transform="translate(15, 15)">
                  <path
                    d={`M 20 0 A 20 20 0 0 1 ${20 * Math.cos(Math.PI / 4)} ${20 * Math.sin(Math.PI / 4)}`}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="0.8"
                  />
                  <text x="25" y="15" fontSize="7" fill="#2563eb">45°</text>
                </g>

                {/* FBH holes shown from side */}
                {BLOCK.holes.map((hole, index) => {
                  const spacing = (scaledLength - angleOffset * 2) / (BLOCK.holes.length + 1);
                  const x = angleOffset + spacing * (index + 1);
                  const scaledDepth = hole.depthMm * scale * 3; // Scale depth for visibility
                  const isHighlighted = highlightedHoles.includes(hole.id);
                  const isActive = hole.used;

                  if (!isActive) return null;

                  return (
                    <g key={`section-${hole.id}`}>
                      {/* FBH representation (line into block from angled surface) */}
                      <line
                        x1={x} y1={scaledHeight * 1.5}
                        x2={x} y2={scaledHeight * 1.5 + scaledDepth}
                        stroke={isHighlighted ? '#f59e0b' : '#2563eb'}
                        strokeWidth={isHighlighted ? '2.5' : '2'}
                      />
                      {/* FBH bottom (flat bottom) */}
                      <line
                        x1={x - 3} y1={scaledHeight * 1.5 + scaledDepth}
                        x2={x + 3} y2={scaledHeight * 1.5 + scaledDepth}
                        stroke={isHighlighted ? '#f59e0b' : '#2563eb'}
                        strokeWidth="2"
                      />
                      {/* Depth label */}
                      <text
                        x={x}
                        y={scaledHeight * 3 + 15}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#1e293b"
                      >
                        {hole.id}: {hole.depthInch}&quot;
                      </text>
                    </g>
                  );
                })}

                {/* Dimensions */}
                {showDimensions && (
                  <>
                    <DimensionLine
                      x1={0} y1={scaledHeight * 3}
                      x2={scaledLength} y2={scaledHeight * 3}
                      value="8.0&quot;" tolerance="±0.015&quot;"
                      offset={35} uniqueId={uniqueId}
                    />
                    <DimensionLine
                      x1={scaledLength} y1={0}
                      x2={scaledLength} y2={scaledHeight * 3}
                      value="1.085&quot;" tolerance="(27.6mm)"
                      offset={28} vertical uniqueId={uniqueId}
                    />
                  </>
                )}
              </>
            );
          })()}
        </g>

        {/* ====================== VIEW C - END VIEW ====================== */}
        <g transform={`translate(${viewCX}, ${viewCY})`}>
          <text x={scaledWidth / 2} y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
            VIEW C - END
          </text>

          {/* End view - rectangular */}
          <rect
            x="0" y="0"
            width={scaledWidth}
            height={scaledHeight * 3}
            fill="#f8fafc"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Center line */}
          <line
            x1={scaledWidth / 2} y1="-5"
            x2={scaledWidth / 2} y2={scaledHeight * 3 + 5}
            stroke="#dc2626"
            strokeWidth="0.5"
            strokeDasharray="10,3,3,3"
          />

          {/* Dimensions */}
          {showDimensions && (
            <>
              <DimensionLine
                x1={0} y1={scaledHeight * 3}
                x2={scaledWidth} y2={scaledHeight * 3}
                value="2.479&quot;"
                offset={20} uniqueId={uniqueId}
              />
              <DimensionLine
                x1={scaledWidth} y1={0}
                x2={scaledWidth} y2={scaledHeight * 3}
                value="1.085&quot;"
                offset={20} vertical uniqueId={uniqueId}
              />
            </>
          )}
        </g>

        {/* ====================== FBH SPECIFICATIONS TABLE ====================== */}
        <g transform={`translate(${viewCX}, ${viewCY + scaledHeight * 3 + 60})`}>
          <text x="0" y="0" fontSize="10" fontWeight="700" fill="#1e293b">
            FBH HOLE SPECIFICATIONS (IAE2P16675)
          </text>
          <rect x="0" y="8" width="200" height={25 + activeHoles.length * 14} fill="white" stroke="#1e293b" strokeWidth="1" />

          {/* Table header */}
          <line x1="0" y1="28" x2="200" y2="28" stroke="#1e293b" strokeWidth="0.5" />
          <text x="10" y="22" fontSize="7" fontWeight="600" fill="#1e293b">HOLE</text>
          <text x="50" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH (in)</text>
          <text x="100" y="22" fontSize="7" fontWeight="600" fill="#1e293b">DEPTH (mm)</text>
          <text x="150" y="22" fontSize="7" fontWeight="600" fill="#1e293b">SIZE</text>

          {/* Table rows - active holes only */}
          {activeHoles.map((hole, index) => (
            <g key={`table-${hole.id}`} transform={`translate(0, ${30 + index * 14})`}>
              <text x="10" y="10" fontSize="7" fontWeight="600" fill="#1e293b">{hole.id}</text>
              <text x="50" y="10" fontSize="7" fill="#1e293b">{hole.depth.toFixed(3)}&quot;</text>
              <text x="100" y="10" fontSize="7" fill="#1e293b">{(hole.depth * 25.4).toFixed(2)}</text>
              <text x="150" y="10" fontSize="7" fill="#1e293b">#1 FBH</text>
            </g>
          ))}
        </g>

        {/* ====================== TITLE BLOCK ====================== */}
        {showTitleBlock && (
          <g transform={`translate(${width - 220}, ${height - 95})`}>
            <rect x="0" y="0" width="210" height="85" fill="white" stroke="#1e293b" strokeWidth="1.5" />

            {/* P&W Logo area */}
            <rect x="0" y="0" width="60" height="25" fill="#1e3a5f" />
            <text x="30" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">P&W</text>

            {/* Block info */}
            <text x="70" y="12" fontSize="7" fontWeight="600" fill="#1e293b">PART NUMBER:</text>
            <text x="70" y="22" fontSize="9" fontWeight="700" fill="#1e293b">IAE2P16675</text>

            <line x1="0" y1="25" x2="210" y2="25" stroke="#1e293b" strokeWidth="0.5" />

            <text x="5" y="37" fontSize="7" fill="#1e293b">DESCRIPTION:</text>
            <text x="5" y="47" fontSize="7" fontWeight="600" fill="#1e293b">45° Angle Calibration Block with #1 FBH</text>

            <line x1="0" y1="52" x2="210" y2="52" stroke="#1e293b" strokeWidth="0.5" />

            <text x="5" y="63" fontSize="7" fill="#1e293b">MATERIAL: Powdered Nickel equiv.</text>
            <text x="5" y="73" fontSize="7" fill="#1e293b">STANDARD: {standardRef}</text>
            <text x="110" y="63" fontSize="7" fill="#1e293b">RECERT: Yearly at PW NDE</text>
            <text x="110" y="73" fontSize="7" fill="#1e293b">HOLDER: IAE2P16674 (opt.)</text>

            <text x="5" y="83" fontSize="6" fill="#64748b">Calibration: 80% FSH | ±45° Shear Wave | 8&quot; Water Path</text>
          </g>
        )}

        {/* ====================== NOTES ====================== */}
        <g transform={`translate(${viewBX}, ${height - 50})`}>
          <text x="0" y="0" fontSize="8" fontWeight="700" fill="#1e293b">NOTES:</text>
          <text x="0" y="12" fontSize="7" fill="#64748b">
            1. Holes J & K omitted per NDIP Section 5.1.1.7.1
          </text>
          <text x="0" y="22" fontSize="7" fill="#64748b">
            2. Active holes L-S used for DAC calibration
          </text>
          <text x="0" y="32" fontSize="7" fill="#64748b">
            3. All dimensions in inches (metric equivalent shown)
          </text>
          <text x="300" y="12" fontSize="7" fill="#64748b">
            4. FBH Size: #1 (1/64&quot; = 0.4mm diameter)
          </text>
          <text x="300" y="22" fontSize="7" fill="#64748b">
            5. Transducer: IAE2P16679 (5 MHz, 0.75&quot; element)
          </text>
          <text x="300" y="32" fontSize="7" fill="#64748b">
            6. Mirror: IAE2P16678 (45° reflection)
          </text>
        </g>
      </svg>
    </div>
  );
}

export default PWCalibrationBlockDrawing;
