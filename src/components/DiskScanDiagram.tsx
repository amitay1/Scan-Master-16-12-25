import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface DiskScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  dimensions?: {
    diameter?: number;
    thickness?: number;
    hubDiameter?: number;
    hubHeight?: number;
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
 * DiskScanDiagram - Interactive SVG diagram showing scan directions for disk/hub forging geometry
 * Based on ASTM E2375-16 Figure 6 - Disk/Hub Forgings
 */
export const DiskScanDiagram: React.FC<DiskScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions - disk with hub (cross-section)
  const sideView = {
    x: 60,
    y: 150,
    diskWidth: 260,
    diskHeight: 60,
    hubWidth: 80,
    hubHeight: 100
  };

  // Top view dimensions - plan view of disk
  const topView = {
    cx: 560,
    cy: 260,
    radius: 100,
    hubRadius: 40
  };

  // Calculated values for side view
  const diskCenterX = sideView.x + sideView.diskWidth / 2;
  const hubStartX = diskCenterX - sideView.hubWidth / 2;
  const hubEndX = diskCenterX + sideView.hubWidth / 2;
  const diskCenterY = sideView.y + sideView.diskHeight / 2;

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
          <pattern id="disk-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section */}
          <pattern id="disk-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Hatching for top view */}
          <pattern id="disk-top-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#disk-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Disk Forging with Hub
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 6 - Disk Forgings
        </text>

        {/* ==================== SIDE VIEW (CROSS-SECTION) ==================== */}
        <g id="side-view">

          {/* Side View Label */}
          <text
            x={diskCenterX}
            y={sideView.y - 60}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Cross-Section)
          </text>

          {/* Disk body with hatching */}
          <rect
            x={sideView.x}
            y={sideView.y}
            width={sideView.diskWidth}
            height={sideView.diskHeight}
            fill="url(#disk-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Hub above disk */}
          <rect
            x={hubStartX}
            y={sideView.y - sideView.hubHeight}
            width={sideView.hubWidth}
            height={sideView.hubHeight}
            fill="url(#disk-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Hub below disk */}
          <rect
            x={hubStartX}
            y={sideView.y + sideView.diskHeight}
            width={sideView.hubWidth}
            height={sideView.hubHeight}
            fill="url(#disk-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Dimension labels */}
          <text x={diskCenterX} y={sideView.y + sideView.diskHeight + sideView.hubHeight + 35} textAnchor="middle" fill="#6b7280" fontSize="10">Hub</text>
          <text x={sideView.x - 15} y={diskCenterY + 5} textAnchor="end" fill="#6b7280" fontSize="10">Disk</text>
          <text x={hubEndX + 15} y={sideView.y - sideView.hubHeight / 2} fill="#6b7280" fontSize="10">Hub</text>

          {/* ========== A: LW 0° AXIAL from top hub ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={diskCenterX}
              y1={sideView.y - sideView.hubHeight - 70}
              x2={diskCenterX}
              y2={sideView.y - sideView.hubHeight - 20}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${diskCenterX},${sideView.y - sideView.hubHeight - 25}
                       ${diskCenterX - 7},${sideView.y - sideView.hubHeight - 38}
                       ${diskCenterX + 7},${sideView.y - sideView.hubHeight - 38}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={diskCenterX - 35}
              y={sideView.y - sideView.hubHeight - 55}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== A₁: Dual Element from top hub (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            <line
              x1={diskCenterX + 25}
              y1={sideView.y - sideView.hubHeight - 55}
              x2={diskCenterX + 25}
              y2={sideView.y - sideView.hubHeight - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${diskCenterX + 25},${sideView.y - sideView.hubHeight - 25}
                       ${diskCenterX + 20},${sideView.y - sideView.hubHeight - 35}
                       ${diskCenterX + 30},${sideView.y - sideView.hubHeight - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            <text
              x={diskCenterX + 35}
              y={sideView.y - sideView.hubHeight - 40}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              A₁ (0-20mm)
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom hub ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={diskCenterX}
              y1={sideView.y + sideView.diskHeight + sideView.hubHeight + 70}
              x2={diskCenterX}
              y2={sideView.y + sideView.diskHeight + sideView.hubHeight + 20}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${diskCenterX},${sideView.y + sideView.diskHeight + sideView.hubHeight + 25}
                       ${diskCenterX - 7},${sideView.y + sideView.diskHeight + sideView.hubHeight + 38}
                       ${diskCenterX + 7},${sideView.y + sideView.diskHeight + sideView.hubHeight + 38}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={diskCenterX - 35}
              y={sideView.y + sideView.diskHeight + sideView.hubHeight + 60}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              B, LW 0°
            </text>
          </g>

          {/* ========== B₁: Dual Element from bottom hub (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={diskCenterX + 25}
              y1={sideView.y + sideView.diskHeight + sideView.hubHeight + 55}
              x2={diskCenterX + 25}
              y2={sideView.y + sideView.diskHeight + sideView.hubHeight + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${diskCenterX + 25},${sideView.y + sideView.diskHeight + sideView.hubHeight + 25}
                       ${diskCenterX + 20},${sideView.y + sideView.diskHeight + sideView.hubHeight + 35}
                       ${diskCenterX + 30},${sideView.y + sideView.diskHeight + sideView.hubHeight + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text
              x={diskCenterX + 35}
              y={sideView.y + sideView.diskHeight + sideView.hubHeight + 45}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              B₁ (0-20mm)
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from OD of disk ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.diskWidth + 70}
              y1={diskCenterY}
              x2={sideView.x + sideView.diskWidth + 20}
              y2={diskCenterY}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${sideView.x + sideView.diskWidth + 25},${diskCenterY}
                       ${sideView.x + sideView.diskWidth + 40},${diskCenterY - 7}
                       ${sideView.x + sideView.diskWidth + 40},${diskCenterY + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.diskWidth + 75}
              y={diskCenterY - 8}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              C, LW 0°
            </text>
            <text
              x={sideView.x + sideView.diskWidth + 75}
              y={diskCenterY + 8}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="9"
            >
              (RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL from OD of disk (near surface 0-20mm) ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            <line
              x1={sideView.x + sideView.diskWidth + 55}
              y1={diskCenterY + 20}
              x2={sideView.x + sideView.diskWidth + 20}
              y2={diskCenterY + 20}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${sideView.x + sideView.diskWidth + 25},${diskCenterY + 20}
                       ${sideView.x + sideView.diskWidth + 38},${diskCenterY + 15}
                       ${sideView.x + sideView.diskWidth + 38},${diskCenterY + 25}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            <text
              x={sideView.x + sideView.diskWidth + 75}
              y={diskCenterY + 25}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              fontSize="10"
            >
              C₁ (0-20mm)
            </text>
          </g>

          {/* ========== D: SW 45° Circumferential on hub from top ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={hubStartX - 60}
              y1={sideView.y - sideView.hubHeight / 2 - 35}
              x2={hubStartX - 20}
              y2={sideView.y - sideView.hubHeight / 2}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${hubStartX - 25},${sideView.y - sideView.hubHeight / 2 - 5}
                       ${hubStartX - 40},${sideView.y - sideView.hubHeight / 2 - 15}
                       ${hubStartX - 30},${sideView.y - sideView.hubHeight / 2 - 25}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={hubStartX - 85}
              y={sideView.y - sideView.hubHeight / 2 - 30}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° Circumferential on hub reverse ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={hubEndX + 60}
              y1={sideView.y - sideView.hubHeight / 2 + 35}
              x2={hubEndX + 20}
              y2={sideView.y - sideView.hubHeight / 2}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${hubEndX + 25},${sideView.y - sideView.hubHeight / 2 + 5}
                       ${hubEndX + 40},${sideView.y - sideView.hubHeight / 2 + 15}
                       ${hubEndX + 30},${sideView.y - sideView.hubHeight / 2 + 25}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={hubEndX + 40}
              y={sideView.y - sideView.hubHeight / 2 + 45}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* Side View Bottom Label */}
          <text
            x={diskCenterX}
            y={sideView.y + sideView.diskHeight + sideView.hubHeight + 120}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Side View (Disk with Hub)
          </text>
        </g>

        {/* ==================== TOP VIEW (PLAN) ==================== */}
        <g id="top-view">

          {/* Top View Label */}
          <text
            x={topView.cx}
            y={topView.cy - topView.radius - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Top View (Plan)
          </text>

          {/* Outer circle (disk OD) with hatching */}
          <circle
            cx={topView.cx}
            cy={topView.cy}
            r={topView.radius}
            fill="url(#disk-top-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Hub circle */}
          <circle
            cx={topView.cx}
            cy={topView.cy}
            r={topView.hubRadius}
            fill="url(#disk-top-hatch)"
            stroke="#1f2937"
            strokeWidth="1.5"
          />

          {/* Center lines */}
          <line
            x1={topView.cx - topView.radius - 20}
            y1={topView.cy}
            x2={topView.cx + topView.radius + 20}
            y2={topView.cy}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          <line
            x1={topView.cx}
            y1={topView.cy - topView.radius - 20}
            x2={topView.cx}
            y2={topView.cy + topView.radius + 20}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {/* Labels */}
          <text x={topView.cx + topView.hubRadius + 5} y={topView.cy + 5} fill="#6b7280" fontSize="10">Hub</text>
          <text x={topView.cx + topView.radius + 5} y={topView.cy + 5} fill="#6b7280" fontSize="10">Disk OD</text>

          {/* ========== F: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("F", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx + topView.radius + 60}
              y1={topView.cy + 25}
              x2={topView.cx + topView.radius + 20}
              y2={topView.cy - 16}
              stroke={getDirectionColor("F", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx + topView.radius + 14},${topView.cy - 20}
                       ${topView.cx + topView.radius + 28},${topView.cy - 6}
                       ${topView.cx + topView.radius + 10},${topView.cy - 32}`}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx + topView.radius + 40}
              y={topView.cy - 20}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              F: SW 45°
            </text>
          </g>

          {/* ========== G: SW 45° Circumferential CCW ========== */}
          <g opacity={getDirectionOpacity("G", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx + topView.radius + 60}
              y1={topView.cy - 25}
              x2={topView.cx + topView.radius + 20}
              y2={topView.cy + 16}
              stroke={getDirectionColor("G", scanDetails, highlightedDirection)}
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx + topView.radius + 14},${topView.cy + 20}
                       ${topView.cx + topView.radius + 28},${topView.cy + 6}
                       ${topView.cx + topView.radius + 10},${topView.cy + 32}`}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx + topView.radius + 40}
              y={topView.cy + 30}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              G: SW 45°
            </text>
          </g>

          {/* ========== L: SW 45° Radial ========== */}
          <g opacity={getDirectionOpacity("L", scanDetails, highlightedDirection)}>
            <line
              x1={topView.cx - topView.radius - 55}
              y1={topView.cy - 30}
              x2={topView.cx - topView.radius - 15}
              y2={topView.cy + 10}
              stroke={getDirectionColor("L", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${topView.cx - topView.radius - 20},${topView.cy + 5}
                       ${topView.cx - topView.radius - 35},${topView.cy - 10}
                       ${topView.cx - topView.radius - 25},${topView.cy - 20}`}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
            />
            <text
              x={topView.cx - topView.radius - 65}
              y={topView.cy - 25}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              L: SW 45°
            </text>
            <text
              x={topView.cx - topView.radius - 65}
              y={topView.cy - 10}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
              fontSize="9"
            >
              (RADIAL)
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

export default DiskScanDiagram;
