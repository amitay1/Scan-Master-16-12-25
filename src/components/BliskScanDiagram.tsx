import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface BliskScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
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
 * BliskScanDiagram - Interactive SVG diagram showing scan directions for Blisk (Bladed Disk) geometry
 * Shows disk body with integrated blades and center bore
 */
export const BliskScanDiagram: React.FC<BliskScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  const svgWidth = 750;
  const svgHeight = 550;

  // Side view dimensions
  const side = {
    x: 50,
    y: 180,
    diskWidth: 200,
    diskHeight: 50,
    boreWidth: 50,
    bladeHeight: 60,
    bladeWidth: 8,
  };

  const centerX = side.x + side.diskWidth / 2;
  const diskCenterY = side.y + side.diskHeight / 2;

  // Top view dimensions
  const top = {
    cx: 560,
    cy: 280,
    diskRadius: 85,
    boreRadius: 25,
    bladeEnvelope: 110,
    numBlades: 16,
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto scan-direction-diagram"
        style={{ maxHeight: '520px' }}
      >
        {/* Patterns */}
        <defs>
          <pattern id="blisk-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>
          <pattern id="blisk-hatch-disk" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#2563eb" strokeWidth="0.8" />
          </pattern>
          <pattern id="blisk-hatch-blade" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#dc2626" strokeWidth="0.6" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#blisk-grid)" />

        {/* Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Blisk (Bladed Disk)
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          Integrated Blade-Disk for Aero Engines - AMS-STD-2154 Class AAA
        </text>

        {/* ==================== SIDE VIEW (CROSS-SECTION) ==================== */}
        <g id="side-view">
          <text x={centerX} y={side.y - 85} textAnchor="middle" fill="#374151" fontSize="12">
            Section View (Disk with Blades)
          </text>

          {/* Blades on top */}
          {[-80, -50, -20, 20, 50, 80].map((offset, i) => (
            <rect
              key={`blade-top-${i}`}
              x={centerX + offset - side.bladeWidth / 2}
              y={side.y - side.bladeHeight}
              width={side.bladeWidth}
              height={side.bladeHeight}
              fill="url(#blisk-hatch-blade)"
              stroke="#dc2626"
              strokeWidth="1"
            />
          ))}

          {/* Disk body with hollow center */}
          {/* Left wall */}
          <rect
            x={side.x}
            y={side.y}
            width={(side.diskWidth - side.boreWidth) / 2}
            height={side.diskHeight}
            fill="url(#blisk-hatch-disk)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right wall */}
          <rect
            x={side.x + (side.diskWidth + side.boreWidth) / 2}
            y={side.y}
            width={(side.diskWidth - side.boreWidth) / 2}
            height={side.diskHeight}
            fill="url(#blisk-hatch-disk)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Center bore (hollow) */}
          <rect
            x={side.x + (side.diskWidth - side.boreWidth) / 2}
            y={side.y}
            width={side.boreWidth}
            height={side.diskHeight}
            fill="white"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Zone labels */}
          <text x={centerX} y={side.y - side.bladeHeight / 2} textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="bold">BLADES</text>
          <text x={side.x + (side.diskWidth - side.boreWidth) / 4} y={diskCenterY + 4} textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold">DISK</text>
          <text x={centerX} y={diskCenterY + 4} textAnchor="middle" fill="#6b7280" fontSize="9">BORE</text>
          <text x={side.x + side.diskWidth - (side.diskWidth - side.boreWidth) / 4} y={diskCenterY + 4} textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold">DISK</text>

          {/* Centerline */}
          <line x1={centerX} y1={side.y - side.bladeHeight - 20} x2={centerX} y2={side.y + side.diskHeight + 40} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />

          {/* ========== A: LW 0° AXIAL from top (blades) ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={centerX - 30}
              y1={side.y - side.bladeHeight - 70}
              x2={centerX - 30}
              y2={side.y - side.bladeHeight - 20}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${centerX - 30},${side.y - side.bladeHeight - 25}
                       ${centerX - 37},${side.y - side.bladeHeight - 40}
                       ${centerX - 23},${side.y - side.bladeHeight - 40}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text x={centerX - 80} y={side.y - side.bladeHeight - 55} fill={getDirectionColor("A", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              A: LW 0°
            </text>
            <text x={centerX - 80} y={side.y - side.bladeHeight - 40} fill={getDirectionColor("A", scanDetails, highlightedDirection)} fontSize="9">
              (BLADE ROOT)
            </text>
          </g>

          {/* ========== A₁: Dual Element from top ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            <line
              x1={centerX + 30}
              y1={side.y - side.bladeHeight - 55}
              x2={centerX + 30}
              y2={side.y - side.bladeHeight - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${centerX + 30},${side.y - side.bladeHeight - 25}
                       ${centerX + 25},${side.y - side.bladeHeight - 35}
                       ${centerX + 35},${side.y - side.bladeHeight - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            <text x={centerX + 40} y={side.y - side.bladeHeight - 40} fill={getDirectionColor("A₁", scanDetails, highlightedDirection)} fontSize="10">
              A₁
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={centerX}
              y1={side.y + side.diskHeight + 70}
              x2={centerX}
              y2={side.y + side.diskHeight + 20}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${centerX},${side.y + side.diskHeight + 25}
                       ${centerX - 7},${side.y + side.diskHeight + 40}
                       ${centerX + 7},${side.y + side.diskHeight + 40}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text x={centerX - 45} y={side.y + side.diskHeight + 60} fill={getDirectionColor("B", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              B: LW 0°
            </text>
          </g>

          {/* ========== B₁: Dual Element from bottom ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={centerX + 30}
              y1={side.y + side.diskHeight + 55}
              x2={centerX + 30}
              y2={side.y + side.diskHeight + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${centerX + 30},${side.y + side.diskHeight + 25}
                       ${centerX + 25},${side.y + side.diskHeight + 35}
                       ${centerX + 35},${side.y + side.diskHeight + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text x={centerX + 40} y={side.y + side.diskHeight + 45} fill={getDirectionColor("B₁", scanDetails, highlightedDirection)} fontSize="10">
              B₁
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from OD ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + side.diskWidth + 70}
              y1={diskCenterY}
              x2={side.x + side.diskWidth + 20}
              y2={diskCenterY}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x + side.diskWidth + 25},${diskCenterY}
                       ${side.x + side.diskWidth + 40},${diskCenterY - 7}
                       ${side.x + side.diskWidth + 40},${diskCenterY + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text x={side.x + side.diskWidth + 75} y={diskCenterY - 5} fill={getDirectionColor("C", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              C: LW 0°
            </text>
            <text x={side.x + side.diskWidth + 75} y={diskCenterY + 10} fill={getDirectionColor("C", scanDetails, highlightedDirection)} fontSize="9">
              (RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + side.diskWidth + 55}
              y1={diskCenterY + 20}
              x2={side.x + side.diskWidth + 20}
              y2={diskCenterY + 20}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${side.x + side.diskWidth + 25},${diskCenterY + 20}
                       ${side.x + side.diskWidth + 38},${diskCenterY + 15}
                       ${side.x + side.diskWidth + 38},${diskCenterY + 25}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            <text x={side.x + side.diskWidth + 75} y={diskCenterY + 25} fill={getDirectionColor("C₁", scanDetails, highlightedDirection)} fontSize="10">
              C₁
            </text>
          </g>

          {/* ========== D: SW 45° on disk body ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={side.x - 50}
              y1={side.y - 30}
              x2={side.x - 10}
              y2={side.y + 10}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x - 15},${side.y + 5}
                       ${side.x - 30},${side.y - 10}
                       ${side.x - 20},${side.y - 20}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text x={side.x - 85} y={side.y - 35} fill={getDirectionColor("D", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° reverse ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={side.x - 50}
              y1={side.y + side.diskHeight + 30}
              x2={side.x - 10}
              y2={side.y + side.diskHeight - 10}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x - 15},${side.y + side.diskHeight - 5}
                       ${side.x - 30},${side.y + side.diskHeight + 10}
                       ${side.x - 20},${side.y + side.diskHeight + 20}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text x={side.x - 85} y={side.y + side.diskHeight + 40} fill={getDirectionColor("E", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              E: SW 45°
            </text>
          </g>

          {/* ========== H: ID inspection ========== */}
          <g opacity={getDirectionOpacity("H", scanDetails, highlightedDirection)}>
            <line
              x1={centerX}
              y1={side.y + side.diskHeight - 5}
              x2={centerX}
              y2={side.y + 5}
              stroke={getDirectionColor("H", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${centerX},${side.y + 8}
                       ${centerX - 5},${side.y + 18}
                       ${centerX + 5},${side.y + 18}`}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
            />
            <text x={centerX + 10} y={side.y + side.diskHeight / 2} fill={getDirectionColor("H", scanDetails, highlightedDirection)} fontSize="10">
              H (BORE)
            </text>
          </g>
        </g>

        {/* ==================== TOP VIEW (PLAN) ==================== */}
        <g id="top-view">
          <text x={top.cx} y={top.cy - top.bladeEnvelope - 25} textAnchor="middle" fill="#374151" fontSize="12">
            Top View (Plan)
          </text>

          {/* Blade envelope (dashed) */}
          <circle cx={top.cx} cy={top.cy} r={top.bladeEnvelope} fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="5,3" />

          {/* Blades around the rim */}
          {Array.from({ length: top.numBlades }).map((_, i) => {
            const angle = (i / top.numBlades) * Math.PI * 2 - Math.PI / 2;
            const x1 = top.cx + Math.cos(angle) * top.diskRadius;
            const y1 = top.cy + Math.sin(angle) * top.diskRadius;
            const x2 = top.cx + Math.cos(angle) * top.bladeEnvelope;
            const y2 = top.cy + Math.sin(angle) * top.bladeEnvelope;
            return (
              <line
                key={`blade-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#dc2626"
                strokeWidth="3"
              />
            );
          })}

          {/* Disk body */}
          <circle cx={top.cx} cy={top.cy} r={top.diskRadius} fill="url(#blisk-hatch-disk)" stroke="#1f2937" strokeWidth="2" />

          {/* Center bore */}
          <circle cx={top.cx} cy={top.cy} r={top.boreRadius} fill="white" stroke="#1f2937" strokeWidth="1.5" />

          {/* Centerlines */}
          <line x1={top.cx - top.bladeEnvelope - 20} y1={top.cy} x2={top.cx + top.bladeEnvelope + 20} y2={top.cy} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />
          <line x1={top.cx} y1={top.cy - top.bladeEnvelope - 20} x2={top.cx} y2={top.cy + top.bladeEnvelope + 20} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />

          {/* Zone labels */}
          <text x={top.cx} y={top.cy + 5} textAnchor="middle" fill="#6b7280" fontSize="9">BORE</text>
          <text x={top.cx + top.diskRadius - 20} y={top.cy - 25} fill="#2563eb" fontSize="9" fontWeight="bold">DISK</text>
          <text x={top.cx + top.bladeEnvelope + 5} y={top.cy - 35} fill="#dc2626" fontSize="9" fontWeight="bold">BLADES</text>

          {/* ========== F: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("F", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx + top.bladeEnvelope + 55}
              y1={top.cy + 25}
              x2={top.cx + top.bladeEnvelope + 15}
              y2={top.cy - 15}
              stroke={getDirectionColor("F", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx + top.bladeEnvelope + 10},${top.cy - 18}
                       ${top.cx + top.bladeEnvelope + 25},${top.cy - 5}
                       ${top.cx + top.bladeEnvelope + 8},${top.cy - 30}`}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
            />
            <text x={top.cx + top.bladeEnvelope + 35} y={top.cy - 25} fill={getDirectionColor("F", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              F: SW 45° CW
            </text>
          </g>

          {/* ========== G: SW 45° Circumferential CCW ========== */}
          <g opacity={getDirectionOpacity("G", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx + top.bladeEnvelope + 55}
              y1={top.cy - 25}
              x2={top.cx + top.bladeEnvelope + 15}
              y2={top.cy + 15}
              stroke={getDirectionColor("G", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx + top.bladeEnvelope + 10},${top.cy + 18}
                       ${top.cx + top.bladeEnvelope + 25},${top.cy + 5}
                       ${top.cx + top.bladeEnvelope + 8},${top.cy + 30}`}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
            />
            <text x={top.cx + top.bladeEnvelope + 35} y={top.cy + 35} fill={getDirectionColor("G", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              G: SW 45° CCW
            </text>
          </g>

          {/* ========== L: SW 45° Radial ========== */}
          <g opacity={getDirectionOpacity("L", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx - top.bladeEnvelope - 50}
              y1={top.cy - 25}
              x2={top.cx - top.bladeEnvelope - 10}
              y2={top.cy + 15}
              stroke={getDirectionColor("L", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx - top.bladeEnvelope - 15},${top.cy + 10}
                       ${top.cx - top.bladeEnvelope - 30},${top.cy - 5}
                       ${top.cx - top.bladeEnvelope - 20},${top.cy - 15}`}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
            />
            <text x={top.cx - top.bladeEnvelope - 60} y={top.cy - 20} fill={getDirectionColor("L", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              L: SW 45°
            </text>
            <text x={top.cx - top.bladeEnvelope - 60} y={top.cy - 5} fill={getDirectionColor("L", scanDetails, highlightedDirection)} fontSize="9">
              (RADIAL)
            </text>
          </g>
        </g>

        {/* Legend */}
        <g id="legend" transform="translate(30, 470)">
          <rect x="0" y="0" width="350" height="60" fill="#fafafa" stroke="#e5e7eb" rx="4" />
          <text x="10" y="18" fontSize="12" fontWeight="bold" fill="#374151">Legend:</text>

          {/* Enabled/Disabled */}
          <line x1="10" y1="38" x2="50" y2="38" stroke="#b91c1c" strokeWidth="2.5" strokeDasharray="8,4" />
          <polygon points="50,38 60,34 60,42" fill="#b91c1c" />
          <text x="70" y="42" fontSize="10" fill="#374151">Enabled</text>

          <line x1="130" y1="38" x2="170" y2="38" stroke="#d1d5db" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.4" />
          <text x="180" y="42" fontSize="10" fill="#6b7280">Disabled</text>

          {/* Zone colors */}
          <rect x="240" y="30" width="15" height="15" fill="url(#blisk-hatch-disk)" stroke="#2563eb" />
          <text x="260" y="42" fontSize="10" fill="#2563eb">Disk</text>

          <rect x="295" y="30" width="15" height="15" fill="url(#blisk-hatch-blade)" stroke="#dc2626" />
          <text x="315" y="42" fontSize="10" fill="#dc2626">Blades</text>
        </g>
      </svg>
    </div>
  );
};

export default BliskScanDiagram;
