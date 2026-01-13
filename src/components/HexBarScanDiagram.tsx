import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface HexBarScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    acrossFlats?: number;
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
 * HexBarScanDiagram - Interactive SVG diagram showing scan directions for hexagonal bar geometry
 * Based on ASTM E2375-16 Figure 6 - Bar Stock
 */
export const HexBarScanDiagram: React.FC<HexBarScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions - 3D isometric hex bar
  const sideView = {
    x: 60,
    y: 160,
    width: 260,
    height: 140
  };

  // End view dimensions - hexagon cross-section
  const endView = {
    cx: 560,
    cy: 260,
    radius: 80 // distance from center to vertex
  };

  // Calculate hexagon points for end view
  const hexPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start from flat top
    hexPoints.push({
      x: endView.cx + endView.radius * Math.cos(angle),
      y: endView.cy + endView.radius * Math.sin(angle)
    });
  }
  const hexPointsStr = hexPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Calculate 3D isometric hex bar vertices
  const iso3D = {
    // Front face of hex (visible faces)
    frontHex: [
      { x: sideView.x, y: sideView.y + 20 },
      { x: sideView.x + 30, y: sideView.y },
      { x: sideView.x + 30, y: sideView.y + sideView.height },
      { x: sideView.x, y: sideView.y + sideView.height - 20 }
    ],
    // Top face (visible)
    topFace: [
      { x: sideView.x + 30, y: sideView.y },
      { x: sideView.x + sideView.width + 30, y: sideView.y },
      { x: sideView.x + sideView.width + 60, y: sideView.y + 20 },
      { x: sideView.x + 60, y: sideView.y + 20 }
    ],
    // Side face (visible)
    sideFace: [
      { x: sideView.x, y: sideView.y + 20 },
      { x: sideView.x + sideView.width, y: sideView.y + 20 },
      { x: sideView.x + sideView.width, y: sideView.y + sideView.height - 20 },
      { x: sideView.x, y: sideView.y + sideView.height - 20 }
    ],
    // Bottom visible face
    bottomFace: [
      { x: sideView.x, y: sideView.y + sideView.height - 20 },
      { x: sideView.x + sideView.width, y: sideView.y + sideView.height - 20 },
      { x: sideView.x + sideView.width + 30, y: sideView.y + sideView.height },
      { x: sideView.x + 30, y: sideView.y + sideView.height }
    ],
    // Right end face
    rightEnd: [
      { x: sideView.x + sideView.width, y: sideView.y + 20 },
      { x: sideView.x + sideView.width + 30, y: sideView.y },
      { x: sideView.x + sideView.width + 60, y: sideView.y + 20 },
      { x: sideView.x + sideView.width + 60, y: sideView.y + sideView.height - 20 },
      { x: sideView.x + sideView.width + 30, y: sideView.y + sideView.height },
      { x: sideView.x + sideView.width, y: sideView.y + sideView.height - 20 }
    ]
  };

  const toPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

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
          <pattern id="hex-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section */}
          <pattern id="hex-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Gradient for 3D effect */}
          <linearGradient id="hex-side-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
          <linearGradient id="hex-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#hex-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Hexagonal Bar
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 6 - Hex Bar Stock
        </text>

        {/* ==================== ISOMETRIC VIEW ==================== */}
        <g id="isometric-view">

          {/* Isometric View Label */}
          <text
            x={sideView.x + sideView.width / 2 + 30}
            y={sideView.y - 45}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Isometric View
          </text>

          {/* Bottom face */}
          <path
            d={toPath(iso3D.bottomFace)}
            fill="#d1d5db"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Side face (main visible face) */}
          <path
            d={toPath(iso3D.sideFace)}
            fill="url(#hex-side-grad)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Top face */}
          <path
            d={toPath(iso3D.topFace)}
            fill="url(#hex-top-grad)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right end face (hex end) */}
          <path
            d={toPath(iso3D.rightEnd)}
            fill="url(#hex-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Dimension labels */}
          <text x={sideView.x + sideView.width / 2} y={sideView.y + sideView.height + 35} textAnchor="middle" fill="#6b7280" fontSize="10">Length (L)</text>
          <text x={sideView.x - 25} y={sideView.y + sideView.height / 2} textAnchor="end" fill="#6b7280" fontSize="10">AF</text>

          {/* ========== A: LW 0° from End ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x - 60}
              y1={sideView.y + sideView.height / 2}
              x2={sideView.x - 20}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x - 25},${sideView.y + sideView.height / 2}
                       ${sideView.x - 38},${sideView.y + sideView.height / 2 - 7}
                       ${sideView.x - 38},${sideView.y + sideView.height / 2 + 7}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x - 85}
              y={sideView.y + sideView.height / 2 - 10}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== C: LW 0° from Top (radial through flat) ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width / 2 + 30}
              y1={sideView.y - 60}
              x2={sideView.x + sideView.width / 2 + 30}
              y2={sideView.y - 15}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width / 2 + 30},${sideView.y - 20}
                       ${sideView.x + sideView.width / 2 + 23},${sideView.y - 35}
                       ${sideView.x + sideView.width / 2 + 37},${sideView.y - 35}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width / 2 + 45}
              y={sideView.y - 45}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              C, LW 0° (RADIAL)
            </text>
          </g>

          {/* ========== B: SW 45° Axial Forward ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width + 100}
              y1={sideView.y + sideView.height / 2 - 40}
              x2={sideView.x + sideView.width + 55}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width + 60},${sideView.y + sideView.height / 2 - 5}
                       ${sideView.x + sideView.width + 70},${sideView.y + sideView.height / 2 - 20}
                       ${sideView.x + sideView.width + 80},${sideView.y + sideView.height / 2 - 10}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width + 85}
              y={sideView.y + sideView.height / 2 - 35}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              B: SW 45°
            </text>
          </g>

          {/* ========== B₁: SW 45° Axial Reverse ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.width + 100}
              y1={sideView.y + sideView.height / 2 + 40}
              x2={sideView.x + sideView.width + 55}
              y2={sideView.y + sideView.height / 2}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.width + 60},${sideView.y + sideView.height / 2 + 5}
                       ${sideView.x + sideView.width + 70},${sideView.y + sideView.height / 2 + 20}
                       ${sideView.x + sideView.width + 80},${sideView.y + sideView.height / 2 + 10}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.width + 85}
              y={sideView.y + sideView.height / 2 + 45}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              B₁: SW 45°
            </text>
          </g>

          {/* Isometric View Bottom Label */}
          <text
            x={sideView.x + sideView.width / 2 + 30}
            y={sideView.y + sideView.height + 85}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Isometric View
          </text>
        </g>

        {/* ==================== END VIEW (HEXAGON CROSS-SECTION) ==================== */}
        <g id="end-view">

          {/* End View Label */}
          <text
            x={endView.cx}
            y={endView.cy - endView.radius - 35}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            End View (Cross-Section)
          </text>

          {/* Hexagon with hatching */}
          <polygon
            points={hexPointsStr}
            fill="url(#hex-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
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

          {/* AF (Across Flats) label */}
          <text x={endView.cx + endView.radius * 0.866 + 10} y={endView.cy + 5} fill="#6b7280" fontSize="10">AF</text>

          {/* ========== D: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx + endView.radius + 55}
              y1={endView.cy + 20}
              x2={endView.cx + endView.radius + 15}
              y2={endView.cy - 15}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${endView.cx + endView.radius + 10},${endView.cy - 18}
                       ${endView.cx + endView.radius + 24},${endView.cy - 6}
                       ${endView.cx + endView.radius + 6},${endView.cy - 28}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.radius + 35}
              y={endView.cy - 20}
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
              x1={endView.cx + endView.radius + 55}
              y1={endView.cy - 20}
              x2={endView.cx + endView.radius + 15}
              y2={endView.cy + 15}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${endView.cx + endView.radius + 10},${endView.cy + 18}
                       ${endView.cx + endView.radius + 24},${endView.cy + 6}
                       ${endView.cx + endView.radius + 6},${endView.cy + 28}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx + endView.radius + 35}
              y={endView.cy + 30}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* ========== L: LW 0° Radial through vertex ========== */}
          <g opacity={getDirectionOpacity("L", scanDetails, highlightedDirection)}>
            <line
              x1={endView.cx - endView.radius - 55}
              y1={endView.cy}
              x2={endView.cx - endView.radius - 15}
              y2={endView.cy}
              stroke={getDirectionColor("L", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${endView.cx - endView.radius - 20},${endView.cy}
                       ${endView.cx - endView.radius - 33},${endView.cy - 7}
                       ${endView.cx - endView.radius - 33},${endView.cy + 7}`}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
            />
            <text
              x={endView.cx - endView.radius - 75}
              y={endView.cy - 10}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              L, LW 0°
            </text>
            <text
              x={endView.cx - endView.radius - 75}
              y={endView.cy + 5}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
              fontSize="9"
            >
              (RADIAL)
            </text>
          </g>

          {/* End View Bottom Label */}
          <text
            x={endView.cx}
            y={endView.cy + endView.radius + 55}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            End View (Hex Cross-Section)
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

export default HexBarScanDiagram;
