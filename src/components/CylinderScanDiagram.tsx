import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface CylinderScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    diameter?: number;
    length?: number;
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
 * CylinderScanDiagram - Interactive SVG diagram showing scan directions for solid cylinder/round bar geometry
 * Based on ASTM E2375-16 Figure 6 - Round Bars and Round Forging Stock
 */
export const CylinderScanDiagram: React.FC<CylinderScanDiagramProps> = ({
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
    height: 280
  };

  // End view dimensions - positioned right side (solid circle for cylinder)
  const endView = {
    cx: 580,
    cy: 260,
    radius: 90
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
          <pattern id="cylinder-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section */}
          <pattern id="cylinder-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Gradient for 3D effect on side view */}
          <linearGradient id="cylinder-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          {/* Arrow markers */}
          <marker
            id="cylinder-arrow-red"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#b91c1c" />
          </marker>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#cylinder-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Cylinder / Round Bar
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 6 - Round Bars and Round Forging Stock
        </text>

        {/* ==================== SIDE VIEW (LONGITUDINAL) ==================== */}
        <g id="side-view">

          {/* Cylinder body - with gradient for 3D effect */}
          <rect
            x={sideView.x}
            y={sideView.y}
            width={sideView.width}
            height={sideView.height}
            fill="url(#cylinder-gradient)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Top ellipse (cap) */}
          <ellipse
            cx={sideView.x + sideView.width / 2}
            cy={sideView.y}
            rx={sideView.width / 2}
            ry={15}
            fill="#e5e7eb"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Bottom ellipse (cap) */}
          <ellipse
            cx={sideView.x + sideView.width / 2}
            cy={sideView.y + sideView.height}
            rx={sideView.width / 2}
            ry={15}
            fill="#d1d5db"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Center line (axis) */}
          <line
            x1={sideView.x + sideView.width / 2}
            y1={sideView.y - 30}
            x2={sideView.x + sideView.width / 2}
            y2={sideView.y + sideView.height + 30}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {/* ========== A: LW 0° AXIAL from top ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width / 2 + 40}
              y1={sideView.y - 90}
              x2={sideView.x + sideView.width / 2 + 40}
              y2={sideView.y - 20}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width / 2 + 40},${sideView.y - 25}
                       ${sideView.x + sideView.width / 2 + 33},${sideView.y - 38}
                       ${sideView.x + sideView.width / 2 + 47},${sideView.y - 38}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width / 2 + 55}
              y={sideView.y - 50}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== A₁: Dual Element from top (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width / 2 + 65}
              y1={sideView.y - 70}
              x2={sideView.x + sideView.width / 2 + 65}
              y2={sideView.y - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.width / 2 + 65},${sideView.y - 25}
                       ${sideView.x + sideView.width / 2 + 60},${sideView.y - 35}
                       ${sideView.x + sideView.width / 2 + 70},${sideView.y - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width / 2 + 55}
              y={sideView.y - 30}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              A₁ (0-20mm)
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width / 2 + 40}
              y1={sideView.y + sideView.height + 90}
              x2={sideView.x + sideView.width / 2 + 40}
              y2={sideView.y + sideView.height + 20}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width / 2 + 40},${sideView.y + sideView.height + 25}
                       ${sideView.x + sideView.width / 2 + 33},${sideView.y + sideView.height + 38}
                       ${sideView.x + sideView.width / 2 + 47},${sideView.y + sideView.height + 38}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width / 2 + 55}
              y={sideView.y + sideView.height + 55}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              B, LW 0°
            </text>
          </g>

          {/* ========== B₁: Dual Element from bottom (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width / 2 + 65}
              y1={sideView.y + sideView.height + 70}
              x2={sideView.x + sideView.width / 2 + 65}
              y2={sideView.y + sideView.height + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.width / 2 + 65},${sideView.y + sideView.height + 25}
                       ${sideView.x + sideView.width / 2 + 60},${sideView.y + sideView.height + 35}
                       ${sideView.x + sideView.width / 2 + 70},${sideView.y + sideView.height + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width / 2 + 55}
              y={sideView.y + sideView.height + 35}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              B₁ (0-20mm)
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from OD ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width + 110}
              y1={sideView.y + sideView.height / 2}
              x2={sideView.x + sideView.width + 20}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width + 25},${sideView.y + sideView.height / 2}
                       ${sideView.x + sideView.width + 40},${sideView.y + sideView.height / 2 - 7}
                       ${sideView.x + sideView.width + 40},${sideView.y + sideView.height / 2 + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width + 85}
              y={sideView.y + sideView.height / 2 - 10}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              C, LW 0° (RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL from OD (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width + 90}
              y1={sideView.y + sideView.height / 2 + 25}
              x2={sideView.x + sideView.width + 20}
              y2={sideView.y + sideView.height / 2 + 25}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.width + 25},${sideView.y + sideView.height / 2 + 25}
                       ${sideView.x + sideView.width + 38},${sideView.y + sideView.height / 2 + 20}
                       ${sideView.x + sideView.width + 38},${sideView.y + sideView.height / 2 + 30}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width + 85}
              y={sideView.y + sideView.height / 2 + 15}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              C₁ (0-20mm)
            </text>
          </g>

          {/* ========== L: Rotational scanning indicator ========== */}
          <g opacity={getDirectionOpacity("L", scanDetails, highlightedDirection)}>
            {/* Curved arrow around the cylinder indicating rotation */}
            <path
              d={`M ${sideView.x - 25} ${sideView.y + sideView.height / 2 - 40}
                  Q ${sideView.x - 50} ${sideView.y + sideView.height / 2}
                    ${sideView.x - 25} ${sideView.y + sideView.height / 2 + 40}`}
              fill="none"
              stroke={getDirectionColor("L", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x - 25},${sideView.y + sideView.height / 2 + 40}
                       ${sideView.x - 35},${sideView.y + sideView.height / 2 + 30}
                       ${sideView.x - 15},${sideView.y + sideView.height / 2 + 30}`}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x - 70}
              y={sideView.y + sideView.height / 2}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              L: 360°
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
            y={endView.cy - endView.radius - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            End View (Cross-Section)
          </text>

          {/* Solid circle with hatching (solid cylinder) */}
          <circle
            cx={endView.cx}
            cy={endView.cy}
            r={endView.radius}
            fill="url(#cylinder-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Center point */}
          <circle
            cx={endView.cx}
            cy={endView.cy}
            r="4"
            fill="#374151"
          />

          {/* Center lines */}
          <line
            x1={endView.cx - endView.radius - 20}
            y1={endView.cy}
            x2={endView.cx + endView.radius + 20}
            y2={endView.cy}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          <line
            x1={endView.cx}
            y1={endView.cy - endView.radius - 20}
            x2={endView.cx}
            y2={endView.cy + endView.radius + 20}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {/* OD label */}
          <text
            x={endView.cx + endView.radius + 10}
            y={endView.cy + 5}
            fill="#6b7280"
            fontSize="10"
          >
            OD
          </text>

          {/* ========== D: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx + endView.radius + 70}
              y1={endView.cy + 15}
              x2={endView.cx + endView.radius + 20}
              y2={endView.cy - 26}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${endView.cx + endView.radius + 12},${endView.cy - 30}
                       ${endView.cx + endView.radius + 28},${endView.cy - 16}
                       ${endView.cx + endView.radius + 8},${endView.cy - 40}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.radius + 50}
              y={endView.cy - 15}
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
              x1={endView.cx + endView.radius + 70}
              y1={endView.cy - 15}
              x2={endView.cx + endView.radius + 20}
              y2={endView.cy + 26}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${endView.cx + endView.radius + 12},${endView.cy + 30}
                       ${endView.cx + endView.radius + 28},${endView.cy + 16}
                       ${endView.cx + endView.radius + 8},${endView.cy + 40}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.radius + 50}
              y={endView.cy + 25}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* ========== C arrows pointing to center from multiple directions ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            {/* Arrow from top */}
            <line
              x1={endView.cx}
              y1={endView.cy - endView.radius - 50}
              x2={endView.cx}
              y2={endView.cy - endView.radius - 10}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <polygon
              points={`${endView.cx},${endView.cy - endView.radius - 15}
                       ${endView.cx - 5},${endView.cy - endView.radius - 25}
                       ${endView.cx + 5},${endView.cy - endView.radius - 25}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />

            {/* Arrow from bottom */}
            <line
              x1={endView.cx}
              y1={endView.cy + endView.radius + 50}
              x2={endView.cx}
              y2={endView.cy + endView.radius + 10}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <polygon
              points={`${endView.cx},${endView.cy + endView.radius + 15}
                       ${endView.cx - 5},${endView.cy + endView.radius + 25}
                       ${endView.cx + 5},${endView.cy + endView.radius + 25}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />

            {/* Arrow from left */}
            <line
              x1={endView.cx - endView.radius - 50}
              y1={endView.cy}
              x2={endView.cx - endView.radius - 10}
              y2={endView.cy}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <polygon
              points={`${endView.cx - endView.radius - 15},${endView.cy}
                       ${endView.cx - endView.radius - 25},${endView.cy - 5}
                       ${endView.cx - endView.radius - 25},${endView.cy + 5}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
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

export default CylinderScanDiagram;
