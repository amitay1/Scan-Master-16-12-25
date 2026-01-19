import React from "react";
import type { ScanDetail } from "@/types/scanDetails";

interface ImpellerScanDiagramProps {
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
 * ImpellerScanDiagram - Interactive SVG diagram showing scan directions for Impeller geometry
 * Shows stepped profile with Hub (center), Web (middle), and Rim (outer) sections
 */
export const ImpellerScanDiagram: React.FC<ImpellerScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
}) => {
  const svgWidth = 750;
  const svgHeight = 490;

  // Impeller cross-section dimensions (side view) - scaled to fit left half of SVG
  const side = {
    x: 30,
    y: 100,
    // Hub (center - small diameter, tall)
    hubWidth: 36,
    hubHeight: 100,
    // Web (middle - medium diameter, medium height)
    webWidth: 55,
    webHeight: 60,
    // Rim (outer - large diameter, short)
    rimWidth: 75,
    rimHeight: 30,
  };

  // Calculate center and positions
  const totalWidth = side.hubWidth + side.webWidth * 2 + side.rimWidth * 2;
  const centerX = side.x + totalWidth / 2;
  const baseY = side.y + side.hubHeight;

  // Top view (plan view) - positioned in right half of SVG
  const top = {
    cx: 560,
    cy: 250,
    rimRadius: 85,
    webRadius: 55,
    hubRadius: 26,
    boreRadius: 10,
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto scan-direction-diagram"
        style={{ maxHeight: '490px' }}
      >
        {/* Patterns */}
        <defs>
          <pattern id="impeller-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>
          <pattern id="impeller-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.8" />
          </pattern>
          <pattern id="impeller-hatch-hub" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#7c3aed" strokeWidth="0.6" />
          </pattern>
          <pattern id="impeller-hatch-web" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#2563eb" strokeWidth="0.6" />
          </pattern>
          <pattern id="impeller-hatch-rim" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#059669" strokeWidth="0.6" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#impeller-grid)" />

        {/* Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          Scan Directions - Impeller
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          Stepped Profile: Hub / Web / Rim - AMS-STD-2154 Class AAA
        </text>

        {/* ==================== SIDE VIEW (CROSS-SECTION) ==================== */}
        <g id="side-view">
          <text x={centerX} y={side.y - 25} textAnchor="middle" fill="#374151" fontSize="12">
            Section View (Stepped Profile)
          </text>

          {/* Draw stepped profile from left to right */}
          {/* Left Rim */}
          <rect
            x={side.x}
            y={baseY - side.rimHeight}
            width={side.rimWidth}
            height={side.rimHeight}
            fill="url(#impeller-hatch-rim)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Left Web */}
          <rect
            x={side.x + side.rimWidth}
            y={baseY - side.webHeight}
            width={side.webWidth}
            height={side.webHeight}
            fill="url(#impeller-hatch-web)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Hub (center) */}
          <rect
            x={side.x + side.rimWidth + side.webWidth}
            y={side.y}
            width={side.hubWidth}
            height={side.hubHeight}
            fill="url(#impeller-hatch-hub)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right Web */}
          <rect
            x={side.x + side.rimWidth + side.webWidth + side.hubWidth}
            y={baseY - side.webHeight}
            width={side.webWidth}
            height={side.webHeight}
            fill="url(#impeller-hatch-web)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right Rim */}
          <rect
            x={side.x + side.rimWidth + side.webWidth * 2 + side.hubWidth}
            y={baseY - side.rimHeight}
            width={side.rimWidth}
            height={side.rimHeight}
            fill="url(#impeller-hatch-rim)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Zone labels */}
          <text x={side.x + side.rimWidth / 2} y={baseY - side.rimHeight / 2 + 4} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">RIM</text>
          <text x={side.x + side.rimWidth + side.webWidth / 2} y={baseY - side.webHeight / 2 + 4} textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold">WEB</text>
          <text x={centerX} y={side.y + side.hubHeight / 2 + 4} textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="bold">HUB</text>
          <text x={side.x + side.rimWidth + side.webWidth * 1.5 + side.hubWidth} y={baseY - side.webHeight / 2 + 4} textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold">WEB</text>
          <text x={side.x + totalWidth - side.rimWidth / 2} y={baseY - side.rimHeight / 2 + 4} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">RIM</text>

          {/* Centerline */}
          <line x1={centerX} y1={side.y - 15} x2={centerX} y2={baseY + 30} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />

          {/* ========== A: LW 0° AXIAL from top of hub ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={centerX}
              y1={side.y - 70}
              x2={centerX}
              y2={side.y - 20}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${centerX},${side.y - 25} ${centerX - 7},${side.y - 40} ${centerX + 7},${side.y - 40}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text x={centerX - 50} y={side.y - 55} fill={getDirectionColor("A", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              A: LW 0° (HUB)
            </text>
          </g>

          {/* ========== A₁: Dual Element from top hub ========== */}
          <g opacity={getDirectionOpacity("A₁", scanDetails, highlightedDirection)}>
            <line
              x1={centerX + 25}
              y1={side.y - 55}
              x2={centerX + 25}
              y2={side.y - 20}
              stroke={getDirectionColor("A₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${centerX + 25},${side.y - 25} ${centerX + 20},${side.y - 35} ${centerX + 30},${side.y - 35}`}
              fill={getDirectionColor("A₁", scanDetails, highlightedDirection)}
            />
            <text x={centerX + 35} y={side.y - 40} fill={getDirectionColor("A₁", scanDetails, highlightedDirection)} fontSize="10">
              A₁
            </text>
          </g>

          {/* ========== B: LW 0° AXIAL from bottom of hub ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={centerX}
              y1={baseY + 70}
              x2={centerX}
              y2={baseY + 20}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${centerX},${baseY + 25} ${centerX - 7},${baseY + 40} ${centerX + 7},${baseY + 40}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text x={centerX - 50} y={baseY + 60} fill={getDirectionColor("B", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              B: LW 0° (HUB)
            </text>
          </g>

          {/* ========== B₁: Dual Element from bottom hub ========== */}
          <g opacity={getDirectionOpacity("B₁", scanDetails, highlightedDirection)}>
            <line
              x1={centerX + 25}
              y1={baseY + 55}
              x2={centerX + 25}
              y2={baseY + 20}
              stroke={getDirectionColor("B₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${centerX + 25},${baseY + 25} ${centerX + 20},${baseY + 35} ${centerX + 30},${baseY + 35}`}
              fill={getDirectionColor("B₁", scanDetails, highlightedDirection)}
            />
            <text x={centerX + 35} y={baseY + 45} fill={getDirectionColor("B₁", scanDetails, highlightedDirection)} fontSize="10">
              B₁
            </text>
          </g>

          {/* ========== C: LW 0° RADIAL from rim OD ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + totalWidth + 70}
              y1={baseY - side.rimHeight / 2}
              x2={side.x + totalWidth + 15}
              y2={baseY - side.rimHeight / 2}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x + totalWidth + 20},${baseY - side.rimHeight / 2}
                       ${side.x + totalWidth + 35},${baseY - side.rimHeight / 2 - 7}
                       ${side.x + totalWidth + 35},${baseY - side.rimHeight / 2 + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text x={side.x + totalWidth + 75} y={baseY - side.rimHeight / 2 - 5} fill={getDirectionColor("C", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              C: LW 0°
            </text>
            <text x={side.x + totalWidth + 75} y={baseY - side.rimHeight / 2 + 10} fill={getDirectionColor("C", scanDetails, highlightedDirection)} fontSize="9">
              (RIM RADIAL)
            </text>
          </g>

          {/* ========== C₁: Dual Element RADIAL ========== */}
          <g opacity={getDirectionOpacity("C₁", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + totalWidth + 55}
              y1={baseY - side.rimHeight / 2 + 18}
              x2={side.x + totalWidth + 15}
              y2={baseY - side.rimHeight / 2 + 18}
              stroke={getDirectionColor("C₁", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <polygon
              points={`${side.x + totalWidth + 20},${baseY - side.rimHeight / 2 + 18}
                       ${side.x + totalWidth + 32},${baseY - side.rimHeight / 2 + 13}
                       ${side.x + totalWidth + 32},${baseY - side.rimHeight / 2 + 23}`}
              fill={getDirectionColor("C₁", scanDetails, highlightedDirection)}
            />
            <text x={side.x + totalWidth + 75} y={baseY - side.rimHeight / 2 + 25} fill={getDirectionColor("C₁", scanDetails, highlightedDirection)} fontSize="10">
              C₁
            </text>
          </g>

          {/* ========== D: SW 45° on Hub OD ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + side.rimWidth + side.webWidth - 45}
              y1={side.y + 20}
              x2={side.x + side.rimWidth + side.webWidth - 10}
              y2={side.y + 55}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x + side.rimWidth + side.webWidth - 15},${side.y + 50}
                       ${side.x + side.rimWidth + side.webWidth - 30},${side.y + 40}
                       ${side.x + side.rimWidth + side.webWidth - 20},${side.y + 30}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text x={side.x + side.rimWidth + side.webWidth - 80} y={side.y + 15} fill={getDirectionColor("D", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° on Web ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + side.rimWidth / 2 - 40}
              y1={baseY - side.rimHeight - 45}
              x2={side.x + side.rimWidth / 2}
              y2={baseY - side.rimHeight - 10}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x + side.rimWidth / 2 - 5},${baseY - side.rimHeight - 15}
                       ${side.x + side.rimWidth / 2 - 20},${baseY - side.rimHeight - 25}
                       ${side.x + side.rimWidth / 2 - 10},${baseY - side.rimHeight - 35}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text x={side.x + side.rimWidth / 2 - 75} y={baseY - side.rimHeight - 50} fill={getDirectionColor("E", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              E: SW 45°
            </text>
          </g>

          {/* ========== H: LW 0° on Web top surface ========== */}
          <g opacity={getDirectionOpacity("H", scanDetails, highlightedDirection)}>
            <line
              x1={side.x + side.rimWidth + side.webWidth / 2}
              y1={baseY - side.webHeight - 50}
              x2={side.x + side.rimWidth + side.webWidth / 2}
              y2={baseY - side.webHeight - 10}
              stroke={getDirectionColor("H", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${side.x + side.rimWidth + side.webWidth / 2},${baseY - side.webHeight - 15}
                       ${side.x + side.rimWidth + side.webWidth / 2 - 6},${baseY - side.webHeight - 28}
                       ${side.x + side.rimWidth + side.webWidth / 2 + 6},${baseY - side.webHeight - 28}`}
              fill={getDirectionColor("H", scanDetails, highlightedDirection)}
            />
            <text x={side.x + side.rimWidth + side.webWidth / 2 + 10} y={baseY - side.webHeight - 40} fill={getDirectionColor("H", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              H: LW 0° (WEB)
            </text>
          </g>
        </g>

        {/* ==================== TOP VIEW (PLAN) ==================== */}
        <g id="top-view">
          <text x={top.cx} y={top.cy - top.rimRadius - 25} textAnchor="middle" fill="#374151" fontSize="12">
            Top View (Plan)
          </text>

          {/* Rim circle */}
          <circle cx={top.cx} cy={top.cy} r={top.rimRadius} fill="url(#impeller-hatch-rim)" stroke="#1f2937" strokeWidth="2" />

          {/* Web circle */}
          <circle cx={top.cx} cy={top.cy} r={top.webRadius} fill="url(#impeller-hatch-web)" stroke="#1f2937" strokeWidth="1.5" />

          {/* Hub circle */}
          <circle cx={top.cx} cy={top.cy} r={top.hubRadius} fill="url(#impeller-hatch-hub)" stroke="#1f2937" strokeWidth="1.5" />

          {/* Center bore */}
          <circle cx={top.cx} cy={top.cy} r={top.boreRadius} fill="white" stroke="#1f2937" strokeWidth="1" />

          {/* Centerlines */}
          <line x1={top.cx - top.rimRadius - 20} y1={top.cy} x2={top.cx + top.rimRadius + 20} y2={top.cy} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />
          <line x1={top.cx} y1={top.cy - top.rimRadius - 20} x2={top.cx} y2={top.cy + top.rimRadius + 20} stroke="#374151" strokeWidth="1" strokeDasharray="10,5" />

          {/* Zone labels */}
          <text x={top.cx} y={top.cy + 5} textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="bold">HUB</text>
          <text x={top.cx + top.webRadius - 15} y={top.cy - 15} fill="#2563eb" fontSize="9">WEB</text>
          <text x={top.cx + top.rimRadius - 15} y={top.cy - 35} fill="#059669" fontSize="9">RIM</text>

          {/* ========== F: SW 45° Circumferential CW ========== */}
          <g opacity={getDirectionOpacity("F", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx + top.rimRadius + 55}
              y1={top.cy + 25}
              x2={top.cx + top.rimRadius + 15}
              y2={top.cy - 15}
              stroke={getDirectionColor("F", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx + top.rimRadius + 10},${top.cy - 18}
                       ${top.cx + top.rimRadius + 25},${top.cy - 5}
                       ${top.cx + top.rimRadius + 8},${top.cy - 30}`}
              fill={getDirectionColor("F", scanDetails, highlightedDirection)}
            />
            <text x={top.cx + top.rimRadius + 35} y={top.cy - 25} fill={getDirectionColor("F", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              F: SW 45° CW
            </text>
          </g>

          {/* ========== G: SW 45° Circumferential CCW ========== */}
          <g opacity={getDirectionOpacity("G", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx + top.rimRadius + 55}
              y1={top.cy - 25}
              x2={top.cx + top.rimRadius + 15}
              y2={top.cy + 15}
              stroke={getDirectionColor("G", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx + top.rimRadius + 10},${top.cy + 18}
                       ${top.cx + top.rimRadius + 25},${top.cy + 5}
                       ${top.cx + top.rimRadius + 8},${top.cy + 30}`}
              fill={getDirectionColor("G", scanDetails, highlightedDirection)}
            />
            <text x={top.cx + top.rimRadius + 35} y={top.cy + 35} fill={getDirectionColor("G", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              G: SW 45° CCW
            </text>
          </g>

          {/* ========== L: SW 45° Radial ========== */}
          <g opacity={getDirectionOpacity("L", scanDetails, highlightedDirection)}>
            <line
              x1={top.cx - top.rimRadius - 50}
              y1={top.cy - 25}
              x2={top.cx - top.rimRadius - 10}
              y2={top.cy + 15}
              stroke={getDirectionColor("L", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${top.cx - top.rimRadius - 15},${top.cy + 10}
                       ${top.cx - top.rimRadius - 30},${top.cy - 5}
                       ${top.cx - top.rimRadius - 20},${top.cy - 15}`}
              fill={getDirectionColor("L", scanDetails, highlightedDirection)}
            />
            <text x={top.cx - top.rimRadius - 60} y={top.cy - 20} fill={getDirectionColor("L", scanDetails, highlightedDirection)} fontSize="11" fontWeight="bold">
              L: SW 45°
            </text>
            <text x={top.cx - top.rimRadius - 60} y={top.cy - 5} fill={getDirectionColor("L", scanDetails, highlightedDirection)} fontSize="9">
              (RADIAL)
            </text>
          </g>
        </g>

        {/* Legend */}
        <g id="legend" transform="translate(30, 420)">
          <rect x="0" y="0" width="690" height="55" fill="#fafafa" stroke="#e5e7eb" rx="4" />
          <text x="15" y="20" fontSize="12" fontWeight="bold" fill="#374151">Legend:</text>

          {/* Enabled/Disabled */}
          <line x1="15" y1="40" x2="55" y2="40" stroke="#b91c1c" strokeWidth="2.5" strokeDasharray="8,4" />
          <polygon points="55,40 65,36 65,44" fill="#b91c1c" />
          <text x="75" y="44" fontSize="10" fill="#374151">Enabled</text>

          <line x1="140" y1="40" x2="180" y2="40" stroke="#d1d5db" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.4" />
          <text x="190" y="44" fontSize="10" fill="#6b7280">Disabled</text>

          {/* Zone colors */}
          <rect x="280" y="32" width="15" height="15" fill="url(#impeller-hatch-hub)" stroke="#7c3aed" />
          <text x="300" y="44" fontSize="10" fill="#7c3aed">Hub</text>

          <rect x="340" y="32" width="15" height="15" fill="url(#impeller-hatch-web)" stroke="#2563eb" />
          <text x="360" y="44" fontSize="10" fill="#2563eb">Web</text>

          <rect x="400" y="32" width="15" height="15" fill="url(#impeller-hatch-rim)" stroke="#059669" />
          <text x="420" y="44" fontSize="10" fill="#059669">Rim</text>

          {/* Scan types */}
          <text x="480" y="44" fontSize="10" fill="#374151">LW = Longitudinal | SW = Shear Wave</text>
        </g>
      </svg>
    </div>
  );
};

export default ImpellerScanDiagram;
