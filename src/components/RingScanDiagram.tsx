import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface RingScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    outerDiameter?: number;
    innerDiameter?: number;
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
 * RingScanDiagram - Interactive SVG diagram showing scan directions for ring forging geometry
 * Based on ASTM E2375-16 Figure 7 - Ring Forgings
 */
export const RingScanDiagram: React.FC<RingScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions - positioned left side (ring cross-section like washer)
  const sideView = {
    x: 80,
    y: 150,
    outerWidth: 220,
    innerWidth: 100,
    height: 180
  };

  // Top view dimensions - positioned right side (annular ring)
  const topView = {
    cx: 560,
    cy: 260,
    outerRadius: 100,
    innerRadius: 55
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
          <pattern id="ring-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section walls */}
          <pattern id="ring-wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Hatching for top view (annular) */}
          <pattern id="ring-annular-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#ring-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Ring Forging
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 7 - Ring Forgings (L/T &lt; 5)
        </text>

        {/* ==================== SIDE VIEW (CROSS-SECTION) ==================== */}
        <g id="side-view">

          {/* Side View Label */}
          <text
            x={sideView.x + sideView.outerWidth / 2}
            y={sideView.y - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Cross-Section)
          </text>

          {/* Left wall - hatched */}
          <rect
            x={sideView.x}
            y={sideView.y}
            width={(sideView.outerWidth - sideView.innerWidth) / 2}
            height={sideView.height}
            fill="url(#ring-wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right wall - hatched */}
          <rect
            x={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 2}
            y={sideView.y}
            width={(sideView.outerWidth - sideView.innerWidth) / 2}
            height={sideView.height}
            fill="url(#ring-wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Top line */}
          <line
            x1={sideView.x}
            y1={sideView.y}
            x2={sideView.x + sideView.outerWidth}
            y2={sideView.y}
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Bottom line */}
          <line
            x1={sideView.x}
            y1={sideView.y + sideView.height}
            x2={sideView.x + sideView.outerWidth}
            y2={sideView.y + sideView.height}
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Inner lines (hollow center) */}
          <line
            x1={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 2}
            y1={sideView.y}
            x2={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 2}
            y2={sideView.y + sideView.height}
            stroke="#1f2937"
            strokeWidth="1.5"
          />
          <line
            x1={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 2}
            y1={sideView.y}
            x2={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 2}
            y2={sideView.y + sideView.height}
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* Dimension labels */}
          <text x={sideView.x + sideView.outerWidth / 2} y={sideView.y + sideView.height + 30} textAnchor="middle" fill="#6b7280" fontSize="10">OD</text>
          <text x={sideView.x + sideView.outerWidth / 2} y={sideView.y + sideView.height / 2 + 5} textAnchor="middle" fill="#6b7280" fontSize="10">ID</text>
          <text x={sideView.x - 15} y={sideView.y + sideView.height / 2} textAnchor="end" fill="#6b7280" fontSize="10">H</text>

          {/* ========== A: LW 0° AXIAL from top (left wall) ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4}
              y1={sideView.y - 70}
              x2={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4}
              y2={sideView.y - 20}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4},${sideView.y - 25}
                       ${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 - 7},${sideView.y - 38}
                       ${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 7},${sideView.y - 38}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 - 30}
              y={sideView.y - 55}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== A₁: Dual Element from top (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 25}
              y1={sideView.y - 55}
              x2={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 25}
              y2={sideView.y - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 25},${sideView.y - 25}
                       ${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 20},${sideView.y - 35}
                       ${sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 30},${sideView.y - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + (sideView.outerWidth - sideView.innerWidth) / 4 + 35}
              y={sideView.y - 40}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              A₁ (0-20mm)
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom (right wall) ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4}
              y1={sideView.y + sideView.height + 70}
              x2={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4}
              y2={sideView.y + sideView.height + 20}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4},${sideView.y + sideView.height + 25}
                       ${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 7},${sideView.y + sideView.height + 38}
                       ${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 + 7},${sideView.y + sideView.height + 38}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 + 15}
              y={sideView.y + sideView.height + 60}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              B, LW 0°
            </text>
          </g>

          {/* ========== B₁: Dual Element from bottom (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 25}
              y1={sideView.y + sideView.height + 55}
              x2={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 25}
              y2={sideView.y + sideView.height + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 25},${sideView.y + sideView.height + 25}
                       ${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 30},${sideView.y + sideView.height + 35}
                       ${sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 20},${sideView.y + sideView.height + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.outerWidth - (sideView.outerWidth - sideView.innerWidth) / 4 - 60}
              y={sideView.y + sideView.height + 45}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              B₁ (0-20mm)
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from OD ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.outerWidth + 70}
              y1={sideView.y + sideView.height / 2}
              x2={sideView.x + sideView.outerWidth + 20}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.outerWidth + 25},${sideView.y + sideView.height / 2}
                       ${sideView.x + sideView.outerWidth + 40},${sideView.y + sideView.height / 2 - 7}
                       ${sideView.x + sideView.outerWidth + 40},${sideView.y + sideView.height / 2 + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.outerWidth + 75}
              y={sideView.y + sideView.height / 2 - 10}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              C, LW 0°
            </text>
            <text
              x={sideView.x + sideView.outerWidth + 75}
              y={sideView.y + sideView.height / 2 + 5}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="9"
            >
              (RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL from OD (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.outerWidth + 55}
              y1={sideView.y + sideView.height / 2 + 22}
              x2={sideView.x + sideView.outerWidth + 20}
              y2={sideView.y + sideView.height / 2 + 22}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.outerWidth + 25},${sideView.y + sideView.height / 2 + 22}
                       ${sideView.x + sideView.outerWidth + 38},${sideView.y + sideView.height / 2 + 17}
                       ${sideView.x + sideView.outerWidth + 38},${sideView.y + sideView.height / 2 + 27}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.outerWidth + 75}
              y={sideView.y + sideView.height / 2 + 25}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              C₁ (0-20mm)
            </text>
          </g>

          {/* ========== H: LW 0° from ID ========== */}
          <g opacity={getDirectionOpacity("H", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.outerWidth / 2}
              y1={sideView.y + sideView.height / 2}
              x2={sideView.x + sideView.outerWidth / 2 - 30}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("H", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="5,3"
            />
            <polygon
              points={`${sideView.x + sideView.outerWidth / 2 - 25},${sideView.y + sideView.height / 2}
                       ${sideView.x + sideView.outerWidth / 2 - 15},${sideView.y + sideView.height / 2 - 5}
                       ${sideView.x + sideView.outerWidth / 2 - 15},${sideView.y + sideView.height / 2 + 5}`}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.outerWidth / 2 + 10}
              y={sideView.y + sideView.height / 2 - 10}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
              fontSize="10"
              fontWeight="bold"
            >
              H
            </text>
          </g>

          {/* Side View Bottom Label */}
          <text
            x={sideView.x + sideView.outerWidth / 2}
            y={sideView.y + sideView.height + 100}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Ring Cross-Section)
          </text>
        </g>

        {/* ==================== TOP VIEW (ANNULAR) ==================== */}
        <g id="top-view">

          {/* Top View Label */}
          <text
            x={topView.cx}
            y={topView.cy - topView.outerRadius - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Top View (Plan)
          </text>

          {/* Outer circle (OD) with hatching */}
          <circle
            cx={topView.cx}
            cy={topView.cy}
            r={topView.outerRadius}
            fill="url(#ring-annular-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Inner circle (ID) - white fill */}
          <circle
            cx={topView.cx}
            cy={topView.cy}
            r={topView.innerRadius}
            fill="white"
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* Center lines */}
          <line
            x1={topView.cx - topView.outerRadius - 20}
            y1={topView.cy}
            x2={topView.cx + topView.outerRadius + 20}
            y2={topView.cy}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          <line
            x1={topView.cx}
            y1={topView.cy - topView.outerRadius - 20}
            x2={topView.cx}
            y2={topView.cy + topView.outerRadius + 20}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {/* OD / ID labels */}
          <text x={topView.cx + topView.innerRadius + 10} y={topView.cy + 5} fill="#6b7280" fontSize="10">ID</text>
          <text x={topView.cx + topView.outerRadius + 5} y={topView.cy + 5} fill="#6b7280" fontSize="10">OD</text>

          {/* ========== D: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx + topView.outerRadius + 70}
              y1={topView.cy + 15}
              x2={topView.cx + topView.outerRadius + 20}
              y2={topView.cy - 26}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx + topView.outerRadius + 12},${topView.cy - 30}
                       ${topView.cx + topView.outerRadius + 28},${topView.cy - 16}
                       ${topView.cx + topView.outerRadius + 8},${topView.cy - 40}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx + topView.outerRadius + 50}
              y={topView.cy - 15}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° Circumferential CCW ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx + topView.outerRadius + 70}
              y1={topView.cy - 15}
              x2={topView.cx + topView.outerRadius + 20}
              y2={topView.cy + 26}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx + topView.outerRadius + 12},${topView.cy + 30}
                       ${topView.cx + topView.outerRadius + 28},${topView.cy + 16}
                       ${topView.cx + topView.outerRadius + 8},${topView.cy + 40}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx + topView.outerRadius + 50}
              y={topView.cy + 25}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* ========== F: SW 45° Axial ========== */}
          <g opacity={getDirectionOpacity("F", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx - topView.outerRadius - 60}
              y1={topView.cy - 40}
              x2={topView.cx - topView.outerRadius - 15}
              y2={topView.cy + 5}
              stroke={getDirectionColor("F", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx - topView.outerRadius - 20},${topView.cy}
                       ${topView.cx - topView.outerRadius - 35},${topView.cy - 15}
                       ${topView.cx - topView.outerRadius - 25},${topView.cy - 25}`}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx - topView.outerRadius - 70}
              y={topView.cy - 30}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              F: SW 45°
            </text>
          </g>

          {/* ========== G: SW 45° Axial (opposite) ========== */}
          <g opacity={getDirectionOpacity("G", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx - topView.outerRadius - 60}
              y1={topView.cy + 40}
              x2={topView.cx - topView.outerRadius - 15}
              y2={topView.cy - 5}
              stroke={getDirectionColor("G", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx - topView.outerRadius - 20},${topView.cy}
                       ${topView.cx - topView.outerRadius - 35},${topView.cy + 15}
                       ${topView.cx - topView.outerRadius - 25},${topView.cy + 25}`}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx - topView.outerRadius - 70}
              y={topView.cy + 45}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              G: SW 45°
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

export default RingScanDiagram;
