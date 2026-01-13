import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface TubeScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    outerDiameter?: number;
    innerDiameter?: number;
    length?: number;
    height?: number;
  };
}

// Get color for direction (enabled vs disabled)
const getDirectionColor = (direction: string, scanDetails?: ScanDetail[], highlighted?: string | null) => {
  const detail = scanDetails?.find(d => d.scanningDirection === direction);
  const isEnabled = detail?.enabled;
  const isHighlighted = highlighted === direction;

  if (isHighlighted) return "#dc2626"; // bright red when highlighted
  if (isEnabled) return "#b91c1c"; // red when enabled
  return "#d1d5db"; // light gray when disabled
};

const getDirectionOpacity = (direction: string, scanDetails?: ScanDetail[], highlighted?: string | null) => {
  const detail = scanDetails?.find(d => d.scanningDirection === direction);
  const isEnabled = detail?.enabled;
  const isHighlighted = highlighted === direction;

  if (isHighlighted) return 1;
  if (isEnabled) return 1;
  return 0.3;
};

/**
 * TubeScanDiagram - Interactive SVG diagram showing scan directions for tube geometry
 * Based on ASTM E2375-16 Figure 7
 */
export const TubeScanDiagram: React.FC<TubeScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions - positioned left side
  const sideView = {
    x: 120,
    y: 120,
    width: 180,
    height: 280,
    wallThickness: 25
  };

  // End view dimensions - positioned right side, aligned with side view
  const endView = {
    cx: 580,
    cy: 260,
    outerRadius: 90,
    innerRadius: 60
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto scan-direction-diagram"
        style={{ maxHeight: '520px' }}
        data-testid="scan-direction-svg"
        id="scan-direction-svg"
      >
        {/* Grid background */}
        <defs>
          <pattern id="tube-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section walls */}
          <pattern id="wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Hatching for end view (annular) */}
          <pattern id="annular-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.8" />
          </pattern>

          {/* Clip path for annular region in end view */}
          <clipPath id="annular-clip">
            <ellipse cx={endView.cx} cy={endView.cy} rx={endView.outerRadius} ry={endView.outerRadius * 0.65} />
          </clipPath>

          {/* Arrow markers */}
          <marker
            id="arrow-red"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#b91c1c" />
          </marker>

          <marker
            id="arrow-gray"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#9ca3af" />
          </marker>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#tube-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Tube
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 7 - Scan Direction Diagram
        </text>

        {/* ==================== SIDE VIEW (LONGITUDINAL) ==================== */}
        <g id="side-view">

          {/* Left wall - hatched */}
          <rect
            x={sideView.x}
            y={sideView.y}
            width={sideView.wallThickness}
            height={sideView.height}
            fill="url(#wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right wall - hatched */}
          <rect
            x={sideView.x + sideView.width - sideView.wallThickness}
            y={sideView.y}
            width={sideView.wallThickness}
            height={sideView.height}
            fill="url(#wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Center hollow area (no fill) */}
          <rect
            x={sideView.x + sideView.wallThickness}
            y={sideView.y}
            width={sideView.width - 2 * sideView.wallThickness}
            height={sideView.height}
            fill="none"
            stroke="#1f2937"
            strokeWidth="0"
          />

          {/* Tube rectangle - outer boundary */}
          <rect
            x={sideView.x}
            y={sideView.y}
            width={sideView.width}
            height={sideView.height}
            fill="none"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Left wall line */}
          <line
            x1={sideView.x + sideView.wallThickness}
            y1={sideView.y}
            x2={sideView.x + sideView.wallThickness}
            y2={sideView.y + sideView.height}
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* Right wall line */}
          <line
            x1={sideView.x + sideView.width - sideView.wallThickness}
            y1={sideView.y}
            x2={sideView.x + sideView.width - sideView.wallThickness}
            y2={sideView.y + sideView.height}
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* ========== A: LW 0° AXIAL from top - FULL penetration ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            {/* Full penetration arrow - points to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width - sideView.wallThickness / 2}
              y1={sideView.y - 90}
              x2={sideView.x + sideView.width - sideView.wallThickness / 2}
              y2={sideView.y - 20}
              stroke="#0000FF"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              markerEnd="url(#arrow-red)"
            />
            {/* Arrow indicator at top */}
            <polygon
              points={`${sideView.x + sideView.width - sideView.wallThickness / 2},${sideView.y - 45} ${sideView.x + sideView.width - sideView.wallThickness / 2 - 7},${sideView.y - 58} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 7},${sideView.y - 58}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 10}
              y={sideView.y - 50}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== A₁: Dual Element - NEAR SURFACE (0-20mm) ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            {/* Short arrow - points to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width - sideView.wallThickness / 2 + 20}
              y1={sideView.y - 75}
              x2={sideView.x + sideView.width - sideView.wallThickness / 2 + 20}
              y2={sideView.y - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
              markerEnd="url(#arrow-red)"
            />
            {/* Small arrow indicator */}
            <polygon
              points={`${sideView.x + sideView.width - sideView.wallThickness / 2 + 20},${sideView.y - 25} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 15},${sideView.y - 35} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 25},${sideView.y - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 10}
              y={sideView.y - 30}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              A₁ (0-20mm)
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom - FULL penetration ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            {/* Full penetration arrow - points to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width - sideView.wallThickness / 2}
              y1={sideView.y + sideView.height + 90}
              x2={sideView.x + sideView.width - sideView.wallThickness / 2}
              y2={sideView.y + sideView.height + 20}
              stroke="#0000FF"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              markerEnd="url(#arrow-red)"
            />
            {/* Arrow indicator at bottom */}
            <polygon
              points={`${sideView.x + sideView.width - sideView.wallThickness / 2},${sideView.y + sideView.height + 45} ${sideView.x + sideView.width - sideView.wallThickness / 2 - 7},${sideView.y + sideView.height + 58} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 7},${sideView.y + sideView.height + 58}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 10}
              y={sideView.y + sideView.height + 55}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              B, LW 0°
            </text>
          </g>

          {/* ========== B₁: Dual Element - NEAR SURFACE (0-20mm) ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            {/* Short arrow - points to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width - sideView.wallThickness / 2 + 20}
              y1={sideView.y + sideView.height + 75}
              x2={sideView.x + sideView.width - sideView.wallThickness / 2 + 20}
              y2={sideView.y + sideView.height + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
              markerEnd="url(#arrow-red)"
            />
            {/* Small arrow indicator */}
            <polygon
              points={`${sideView.x + sideView.width - sideView.wallThickness / 2 + 20},${sideView.y + sideView.height + 25} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 15},${sideView.y + sideView.height + 35} ${sideView.x + sideView.width - sideView.wallThickness / 2 + 25},${sideView.y + sideView.height + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 10}
              y={sideView.y + sideView.height + 35}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              B₁ (0-20mm)
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from OD - FULL penetration ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            {/* Full penetration - horizontal line pointing to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width + 110}
              y1={sideView.y + sideView.height / 2 - 15}
              x2={sideView.x + sideView.width + 20}
              y2={sideView.y + sideView.height / 2 - 15}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
              markerEnd="url(#arrow-red)"
            />
            {/* Arrow head */}
            <polygon
              points={`${sideView.x + sideView.width + 70},${sideView.y + sideView.height / 2 - 15} ${sideView.x + sideView.width + 85},${sideView.y + sideView.height / 2 - 22} ${sideView.x + sideView.width + 85},${sideView.y + sideView.height / 2 - 8}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 90}
              y={sideView.y + sideView.height / 2 - 20}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              C, LW 0° (RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL - NEAR SURFACE (0-20mm) ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            {/* Short arrow - points to shape but doesn't overlap */}
            <line
              x1={sideView.x + sideView.width + 90}
              y1={sideView.y + sideView.height / 2 + 15}
              x2={sideView.x + sideView.width + 20}
              y2={sideView.y + sideView.height / 2 + 15}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
              markerEnd="url(#arrow-red)"
            />
            {/* Arrow head */}
            <polygon
              points={`${sideView.x + sideView.width + 50},${sideView.y + sideView.height / 2 + 15} ${sideView.x + sideView.width + 62},${sideView.y + sideView.height / 2 + 10} ${sideView.x + sideView.width + 62},${sideView.y + sideView.height / 2 + 20}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            {/* Label */}
            <text
              x={sideView.x + sideView.width + 90}
              y={sideView.y + sideView.height / 2 + 5}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              C₁ (0-20mm)
            </text>
          </g>

          {/* ========== F: SW 45° Axial Shear Dir 1 ========== */}
          <g opacity={getDirectionOpacity("F", scanDetails, highlightedDirection)}>
            {/* Angled arrow pointing to shape at 45° but doesn't overlap */}
            <line
              x1={sideView.x - 90}
              y1={sideView.y + 10}
              x2={sideView.x - 20}
              y2={sideView.y + 80}
              stroke="#0000FF"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              markerEnd="url(#arrow-red)"
            />
            {/* Label */}
            <text
              x={sideView.x - 80}
              y={sideView.y + 35}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              F: SW 45°
            </text>
          </g>

          {/* ========== G: SW 45° Axial Shear Dir 2 (opposite) ========== */}
          <g opacity={getDirectionOpacity("G", scanDetails, highlightedDirection)}>
            {/* Angled arrow pointing to shape at 45° but doesn't overlap */}
            <line
              x1={sideView.x - 90}
              y1={sideView.y + sideView.height - 10}
              x2={sideView.x - 20}
              y2={sideView.y + sideView.height - 80}
              stroke="#0000FF"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              markerEnd="url(#arrow-red)"
            />
            {/* Label */}
            <text
              x={sideView.x - 80}
              y={sideView.y + sideView.height - 30}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              G: SW 45°
            </text>
          </g>

          {/* Side View Label */}
          <text
            x={sideView.x + sideView.width / 2}
            y={sideView.y + sideView.height + 110}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Longitudinal)
          </text>
        </g>

        {/* ==================== END VIEW (CROSS-SECTION) ==================== */}
        <g id="end-view">

          {/* End View Label - above */}
          <text
            x={endView.cx}
            y={endView.cy - endView.outerRadius - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            End View (Cross-Section)
          </text>

          {/* Outer circle (OD) with hatching */}
          <circle
            cx={endView.cx}
            cy={endView.cy}
            r={endView.outerRadius}
            fill="url(#annular-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Inner circle (ID) - white fill to mask hatching inside */}
          <circle
            cx={endView.cx}
            cy={endView.cy}
            r={endView.innerRadius}
            fill="white"
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* OD / ID labels */}
          <text
            x={endView.cx + endView.innerRadius + 10}
            y={endView.cy + 5}
            fill="#6b7280"
            fontSize="10"
          >
            ID
          </text>
          <text
            x={endView.cx + endView.outerRadius + 5}
            y={endView.cy + 5}
            fill="#6b7280"
            fontSize="10"
          >
            OD
          </text>

          {/* ========== D: SW 45° Circumferential CW - right side, arrow UP ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx + endView.outerRadius + 70}
              y1={endView.cy + 15}
              x2={endView.cx + endView.outerRadius + 20}
              y2={endView.cy - 26}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            {/* Arrowhead */}
            <polygon
              points={`${endView.cx + endView.outerRadius + 12},${endView.cy - 30}
                       ${endView.cx + endView.outerRadius + 28},${endView.cy - 16}
                       ${endView.cx + endView.outerRadius + 8},${endView.cy - 40}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.outerRadius + 50}
              y={endView.cy - 15}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° Circumferential CCW - right side, arrow DOWN ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx + endView.outerRadius + 70}
              y1={endView.cy - 15}
              x2={endView.cx + endView.outerRadius + 20}
              y2={endView.cy + 26}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            {/* Arrowhead */}
            <polygon
              points={`${endView.cx + endView.outerRadius + 12},${endView.cy + 30}
                       ${endView.cx + endView.outerRadius + 28},${endView.cy + 16}
                       ${endView.cx + endView.outerRadius + 8},${endView.cy + 40}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.outerRadius + 40}
              y={endView.cy + 25}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* ========== H: LW 0° from ID - small arrow inside hollow ========== */}
          <g opacity={getDirectionOpacity("H", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx}
              y1={endView.cy}
              x2={endView.cx - 35}
              y2={endView.cy}
              stroke={getDirectionColor("H", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="5,3"
            />
            {/* Arrowhead pointing LEFT */}
            <polygon
              points={`${endView.cx - 35},${endView.cy}
                       ${endView.cx - 25},${endView.cy - 5}
                       ${endView.cx - 25},${endView.cy + 5}`}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx - 20}
              y={endView.cy - 12}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              H
            </text>
          </g>
        </g>

        {/* Legend */}
        <g id="legend" transform="translate(30, 470)">
          <rect x="0" y="0" width="280" height="60" fill="#fafafa" stroke="#e5e7eb" rx="4" />
          <text x="10" y="18" fontSize="12" fontWeight="bold" fill="#374151">Legend:</text>

          <line x1="10" y1="35" x2="50" y2="35" stroke="#b91c1c" strokeWidth="2.5" strokeDasharray="8,4" />
          <polygon points="50,35 60,31 60,39" fill="#b91c1c" />
          <text x="70" y="39" fontSize="11" fill="#374151">Enabled scan direction</text>

          <line x1="160" y1="35" x2="200" y2="35" stroke="#d1d5db" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.4" />
          <text x="210" y="39" fontSize="11" fill="#6b7280">Disabled</text>
        </g>
      </svg>
    </div>
  );
};

export default TubeScanDiagram;
