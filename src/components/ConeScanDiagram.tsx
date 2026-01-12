import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface ConeScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    topDiameter?: number;
    bottomDiameter?: number;
    height?: number;
    wallThickness?: number;
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
 * ConeScanDiagram - Interactive SVG diagram showing scan directions for cone geometry
 * Based on ASTM E2375-16
 */
export const ConeScanDiagram: React.FC<ConeScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions - trapezoid (cone profile)
  const sideView = {
    x: 350,           // Center X
    topY: 120,        // Top of cone
    bottomY: 400,     // Bottom of cone
    topWidth: 80,     // Width at top (smaller)
    bottomWidth: 200, // Width at bottom (larger)
    wallThickness: 20
  };

  // End view dimensions - positioned left side
  const endView = {
    cx: 140,
    cy: 280,
    outerRadius: 80,
    innerRadius: 55
  };

  // Calculate trapezoid points
  const trapezoid = {
    // Outer trapezoid
    outerTopLeft: { x: sideView.x - sideView.topWidth / 2, y: sideView.topY },
    outerTopRight: { x: sideView.x + sideView.topWidth / 2, y: sideView.topY },
    outerBottomLeft: { x: sideView.x - sideView.bottomWidth / 2, y: sideView.bottomY },
    outerBottomRight: { x: sideView.x + sideView.bottomWidth / 2, y: sideView.bottomY },
    // Inner trapezoid (hollow)
    innerTopLeft: { x: sideView.x - sideView.topWidth / 2 + sideView.wallThickness, y: sideView.topY },
    innerTopRight: { x: sideView.x + sideView.topWidth / 2 - sideView.wallThickness, y: sideView.topY },
    innerBottomLeft: { x: sideView.x - sideView.bottomWidth / 2 + sideView.wallThickness * 2, y: sideView.bottomY },
    innerBottomRight: { x: sideView.x + sideView.bottomWidth / 2 - sideView.wallThickness * 2, y: sideView.bottomY },
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '520px' }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="cone-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section walls */}
          <pattern id="cone-wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Hatching for end view (annular) */}
          <pattern id="cone-annular-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#cone-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Cone
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 - Conical Geometry Scan Directions
        </text>

        {/* ==================== END VIEW (CROSS-SECTION) ==================== */}
        <g id="end-view">
          {/* End View Label */}
          <text
            x={endView.cx}
            y={endView.cy - endView.outerRadius - 25}
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
            fill="url(#cone-annular-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Inner circle (ID) - white fill */}
          <circle
            cx={endView.cx}
            cy={endView.cy}
            r={endView.innerRadius}
            fill="white"
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* OD / ID labels */}
          <text x={endView.cx + endView.innerRadius + 8} y={endView.cy + 5} fill="#6b7280" fontSize="10">ID</text>
          <text x={endView.cx + endView.outerRadius + 5} y={endView.cy + 5} fill="#6b7280" fontSize="10">OD</text>

          {/* 3 arrows from bottom pointing UP into the wall */}
          {/* Left arrow */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx - 30}
              y1={endView.cy + endView.outerRadius + 45}
              x2={endView.cx - 30}
              y2={endView.cy + endView.innerRadius + 10}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="3"
            />
            <polygon
              points={`${endView.cx - 30},${endView.cy + endView.innerRadius + 10}
                       ${endView.cx - 25},${endView.cy + endView.innerRadius + 22}
                       ${endView.cx - 35},${endView.cy + endView.innerRadius + 22}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
          </g>

          {/* Center arrow */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx}
              y1={endView.cy + endView.outerRadius + 45}
              x2={endView.cx}
              y2={endView.cy + endView.innerRadius + 10}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="3"
            />
            <polygon
              points={`${endView.cx},${endView.cy + endView.innerRadius + 10}
                       ${endView.cx + 5},${endView.cy + endView.innerRadius + 22}
                       ${endView.cx - 5},${endView.cy + endView.innerRadius + 22}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
          </g>

          {/* Right arrow */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx + 30}
              y1={endView.cy + endView.outerRadius + 45}
              x2={endView.cx + 30}
              y2={endView.cy + endView.innerRadius + 10}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="3"
            />
            <polygon
              points={`${endView.cx + 30},${endView.cy + endView.innerRadius + 10}
                       ${endView.cx + 35},${endView.cy + endView.innerRadius + 22}
                       ${endView.cx + 25},${endView.cy + endView.innerRadius + 22}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
          </g>
        </g>

        {/* ==================== SIDE VIEW (CONE/TRAPEZOID) ==================== */}
        <g id="side-view">
          {/* Left wall - hatched trapezoid */}
          <polygon
            points={`${trapezoid.outerTopLeft.x},${trapezoid.outerTopLeft.y}
                     ${trapezoid.innerTopLeft.x},${trapezoid.innerTopLeft.y}
                     ${trapezoid.innerBottomLeft.x},${trapezoid.innerBottomLeft.y}
                     ${trapezoid.outerBottomLeft.x},${trapezoid.outerBottomLeft.y}`}
            fill="url(#cone-wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right wall - hatched trapezoid */}
          <polygon
            points={`${trapezoid.outerTopRight.x},${trapezoid.outerTopRight.y}
                     ${trapezoid.innerTopRight.x},${trapezoid.innerTopRight.y}
                     ${trapezoid.innerBottomRight.x},${trapezoid.innerBottomRight.y}
                     ${trapezoid.outerBottomRight.x},${trapezoid.outerBottomRight.y}`}
            fill="url(#cone-wall-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Top line */}
          <line
            x1={trapezoid.outerTopLeft.x}
            y1={trapezoid.outerTopLeft.y}
            x2={trapezoid.outerTopRight.x}
            y2={trapezoid.outerTopRight.y}
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Bottom line */}
          <line
            x1={trapezoid.outerBottomLeft.x}
            y1={trapezoid.outerBottomLeft.y}
            x2={trapezoid.outerBottomRight.x}
            y2={trapezoid.outerBottomRight.y}
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* ========== A: LW 0° from right - position 1 (top area) ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={trapezoid.outerTopRight.x + 80}
              y1={sideView.topY + 40}
              x2={trapezoid.outerTopRight.x + 10}
              y2={sideView.topY + 40}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${trapezoid.outerTopRight.x + 80},${sideView.topY + 40} ${trapezoid.outerTopRight.x + 92},${sideView.topY + 34} ${trapezoid.outerTopRight.x + 92},${sideView.topY + 46}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={trapezoid.outerTopRight.x + 95}
              y={sideView.topY + 45}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              A
            </text>
          </g>

          {/* ========== B: LW 0° from right - position 2 ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={trapezoid.outerTopRight.x + 100}
              y1={sideView.topY + 110}
              x2={trapezoid.outerTopRight.x + 25}
              y2={sideView.topY + 110}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${trapezoid.outerTopRight.x + 100},${sideView.topY + 110} ${trapezoid.outerTopRight.x + 112},${sideView.topY + 104} ${trapezoid.outerTopRight.x + 112},${sideView.topY + 116}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={trapezoid.outerTopRight.x + 115}
              y={sideView.topY + 115}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              B
            </text>
          </g>

          {/* ========== C: LW 0° from right - position 3 ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={trapezoid.outerBottomRight.x + 80}
              y1={sideView.topY + 180}
              x2={trapezoid.outerTopRight.x + 45}
              y2={sideView.topY + 180}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${trapezoid.outerBottomRight.x + 80},${sideView.topY + 180} ${trapezoid.outerBottomRight.x + 92},${sideView.topY + 174} ${trapezoid.outerBottomRight.x + 92},${sideView.topY + 186}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={trapezoid.outerBottomRight.x + 95}
              y={sideView.topY + 185}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              C
            </text>
          </g>

          {/* ========== D: LW 0° from right - position 4 (bottom area) ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={trapezoid.outerBottomRight.x + 80}
              y1={sideView.topY + 250}
              x2={trapezoid.outerTopRight.x + 70}
              y2={sideView.topY + 250}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${trapezoid.outerBottomRight.x + 80},${sideView.topY + 250} ${trapezoid.outerBottomRight.x + 92},${sideView.topY + 244} ${trapezoid.outerBottomRight.x + 92},${sideView.topY + 256}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={trapezoid.outerBottomRight.x + 95}
              y={sideView.topY + 255}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              D
            </text>
          </g>

          {/* Side View Label */}
          <text
            x={sideView.x}
            y={sideView.bottomY + 100}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Cone Profile)
          </text>
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

export default ConeScanDiagram;
