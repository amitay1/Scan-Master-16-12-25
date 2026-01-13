import React from "react";
import type { ScanDetail } from "@/types/scanDetails";
import type { PartGeometry } from "@/types/techniqueSheet";

interface BoxScanDiagramProps {
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  partType?: PartGeometry | "";
  dimensions?: {
    width?: number;
    thickness?: number;
    height?: number;
    length?: number;
  };
}

// Check if this is a plate type (thin, flat geometry)
const isPlateType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["plate", "sheet", "slab", "flat_bar"].includes(partType);
};

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
 * BoxScanDiagram - Interactive SVG diagram showing scan directions for box/plate/rectangular bar geometry
 * Based on ASTM E2375-16 Figure 6 - Plate, Flat Bar, Rectangular Bar, Bloom, and Billets
 * 
 * For PLATE: Renders a flat, thin shape with actual proportions from dimensions
 * For BOX/BAR: Renders a more cubic shape
 */
export const BoxScanDiagram: React.FC<BoxScanDiagramProps> = ({
  scanDetails,
  highlightedDirection,
  partType,
  dimensions,
}) => {
  // SVG dimensions
  const svgWidth = 750;
  const svgHeight = 550;

  // Get actual dimensions or use defaults
  const actualWidth = dimensions?.width || dimensions?.length || 300;
  const actualLength = dimensions?.length || dimensions?.width || 200;
  const actualThickness = dimensions?.thickness || dimensions?.height || 30;
  
  // Determine if this is a plate (W/T > 5 per ASTM E2375-16)
  const isPlate = isPlateType(partType) || (actualWidth / actualThickness > 5);
  
  // Calculate proportional dimensions for display
  // Max dimension in SVG space
  const maxBoxWidth = 220;
  const maxBoxHeight = 180;
  const maxBoxDepth = 120;
  
  // Scale factor based on largest dimension
  const maxDim = Math.max(actualWidth, actualLength, actualThickness);
  const scaleFactor = maxBoxWidth / maxDim;
  
  // Apply scale to get proportional dimensions
  let boxWidth: number, boxHeight: number, boxDepth: number;
  
  if (isPlate) {
    // For plates: emphasize flat, thin appearance
    // Width and Length should be large, thickness should be visually thin
    boxWidth = Math.max(160, Math.min(maxBoxWidth, actualWidth * scaleFactor));
    boxDepth = Math.max(80, Math.min(maxBoxDepth, actualLength * scaleFactor));
    // Thickness is proportionally thin - enforce minimum for visibility but show thinness
    boxHeight = Math.max(15, Math.min(50, actualThickness * scaleFactor));
  } else {
    // For boxes/bars: more cubic proportions
    boxWidth = Math.max(100, Math.min(maxBoxWidth, actualWidth * scaleFactor));
    boxDepth = Math.max(60, Math.min(maxBoxDepth, actualLength * scaleFactor));
    boxHeight = Math.max(80, Math.min(maxBoxHeight, actualThickness * scaleFactor));
  }

  // Main view - Isometric box positioned left
  const boxView = {
    x: 100,
    y: isPlate ? 180 : 140,  // Adjust Y for plates to center better
    width: boxWidth,
    height: boxHeight,
    depth: boxDepth
  };

  // Cross-section view - positioned right
  // For plate: width should be much larger than height (thin profile)
  const crossWidth = isPlate ? 180 : 180;
  const crossHeight = isPlate ? Math.max(20, Math.min(60, boxHeight * 1.5)) : 200;
  
  const crossSection = {
    x: 480,
    y: isPlate ? 200 : 160,
    width: crossWidth,
    height: crossHeight
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
          <pattern id="box-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>

          {/* Hatching pattern for cross-section */}
          <pattern id="box-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>

          {/* Gradient for 3D effect */}
          <linearGradient id="box-gradient-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          <linearGradient id="box-gradient-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
          <linearGradient id="box-gradient-side" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#box-grid)" />

        {/* Main Title */}
        <text x="30" y="35" fill="#1f2937" fontSize="20" fontWeight="bold">
          {isPlate ? "Scan Directions - Plate / Flat Bar" : "Scan Directions - Rectangular Bar / Box"}
        </text>
        <text x="30" y="55" fill="#6b7280" fontSize="11">
          ASTM E2375-16 Figure 6 - {isPlate ? "Plate, Flat Bar (W/T > 5)" : "Rectangular Bar, Bloom, Billets"}
        </text>
        {/* Actual Dimensions Display */}
        <text x="30" y="75" fill="#3b82f6" fontSize="10">
          Dimensions: W={actualWidth}mm × L={actualLength}mm × T={actualThickness}mm {isPlate ? "(Plate: W/T > 5)" : ""}
        </text>

        {/* ==================== ISOMETRIC VIEW ==================== */}
        <g id="isometric-view">

          {/* Top face */}
          <polygon
            points={`${boxView.x + boxView.depth / 2},${boxView.y}
                     ${boxView.x + boxView.width + boxView.depth / 2},${boxView.y}
                     ${boxView.x + boxView.width},${boxView.y + boxView.depth / 2}
                     ${boxView.x},${boxView.y + boxView.depth / 2}`}
            fill="url(#box-gradient-top)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Front face */}
          <rect
            x={boxView.x}
            y={boxView.y + boxView.depth / 2}
            width={boxView.width}
            height={boxView.height}
            fill="url(#box-gradient-front)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Right face */}
          <polygon
            points={`${boxView.x + boxView.width},${boxView.y + boxView.depth / 2}
                     ${boxView.x + boxView.width + boxView.depth / 2},${boxView.y}
                     ${boxView.x + boxView.width + boxView.depth / 2},${boxView.y + boxView.height}
                     ${boxView.x + boxView.width},${boxView.y + boxView.depth / 2 + boxView.height}`}
            fill="url(#box-gradient-side)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Dimension labels with actual values */}
          <text x={boxView.x + boxView.width / 2} y={boxView.y - 10} textAnchor="middle" fill="#6b7280" fontSize="11">W = {actualWidth}mm</text>
          <text x={boxView.x + boxView.width + boxView.depth / 2 + 20} y={boxView.y + boxView.height / 2} fill="#6b7280" fontSize="11">L = {actualLength}mm</text>
          <text x={boxView.x - 20} y={boxView.y + boxView.depth / 2 + boxView.height / 2} textAnchor="end" fill="#6b7280" fontSize="11">T = {actualThickness}mm</text>

          {/* ========== A: LW 0° from top (through thickness) ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={boxView.x + boxView.width / 2 + boxView.depth / 4}
              y1={boxView.y - 70}
              x2={boxView.x + boxView.width / 2 + boxView.depth / 4}
              y2={boxView.y - 10}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${boxView.x + boxView.width / 2 + boxView.depth / 4},${boxView.y - 15}
                       ${boxView.x + boxView.width / 2 + boxView.depth / 4 - 7},${boxView.y - 28}
                       ${boxView.x + boxView.width / 2 + boxView.depth / 4 + 7},${boxView.y - 28}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={boxView.x + boxView.width / 2 + boxView.depth / 4 + 20}
              y={boxView.y - 50}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              A, LW 0°
            </text>
          </g>

          {/* ========== B: LW 0° from side (through width) ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={boxView.x - 70}
              y1={boxView.y + boxView.depth / 2 + boxView.height / 2}
              x2={boxView.x - 10}
              y2={boxView.y + boxView.depth / 2 + boxView.height / 2}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${boxView.x - 15},${boxView.y + boxView.depth / 2 + boxView.height / 2}
                       ${boxView.x - 28},${boxView.y + boxView.depth / 2 + boxView.height / 2 - 7}
                       ${boxView.x - 28},${boxView.y + boxView.depth / 2 + boxView.height / 2 + 7}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={boxView.x - 80}
              y={boxView.y + boxView.depth / 2 + boxView.height / 2 - 10}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              B, LW 0°
            </text>
          </g>

          {/* ========== C: LW 0° from right side (through length) ========== */}
          <g opacity={getDirectionOpacity("C", scanDetails, highlightedDirection)}>
            <line
              x1={boxView.x + boxView.width + boxView.depth / 2 + 70}
              y1={boxView.y + boxView.height / 2}
              x2={boxView.x + boxView.width + boxView.depth / 2 + 10}
              y2={boxView.y + boxView.height / 2}
              stroke={getDirectionColor("C", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${boxView.x + boxView.width + boxView.depth / 2 + 15},${boxView.y + boxView.height / 2}
                       ${boxView.x + boxView.width + boxView.depth / 2 + 28},${boxView.y + boxView.height / 2 - 7}
                       ${boxView.x + boxView.width + boxView.depth / 2 + 28},${boxView.y + boxView.height / 2 + 7}`}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
            />
            <text
              x={boxView.x + boxView.width + boxView.depth / 2 + 30}
              y={boxView.y + boxView.height / 2 - 15}
              fill={getDirectionColor("C", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              C, LW 0°
            </text>
          </g>

          {/* ========== D: SW 45° angle beam from bottom-left ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={boxView.x - 50}
              y1={boxView.y + boxView.depth / 2 + boxView.height + 50}
              x2={boxView.x + 20}
              y2={boxView.y + boxView.depth / 2 + boxView.height - 10}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${boxView.x + 15},${boxView.y + boxView.depth / 2 + boxView.height - 5}
                       ${boxView.x - 5},${boxView.y + boxView.depth / 2 + boxView.height + 10}
                       ${boxView.x + 5},${boxView.y + boxView.depth / 2 + boxView.height + 20}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={boxView.x - 60}
              y={boxView.y + boxView.depth / 2 + boxView.height + 70}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              D: SW 45°
            </text>
          </g>

          {/* ========== E: SW 45° angle beam from bottom-right ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={boxView.x + boxView.width + boxView.depth / 2 + 50}
              y1={boxView.y + boxView.height + 50}
              x2={boxView.x + boxView.width + boxView.depth / 2 - 10}
              y2={boxView.y + boxView.height - 20}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${boxView.x + boxView.width + boxView.depth / 2 - 5},${boxView.y + boxView.height - 15}
                       ${boxView.x + boxView.width + boxView.depth / 2 + 15},${boxView.y + boxView.height}
                       ${boxView.x + boxView.width + boxView.depth / 2 + 5},${boxView.y + boxView.height + 10}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={boxView.x + boxView.width + boxView.depth / 2 + 55}
              y={boxView.y + boxView.height + 70}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="12"
              fontWeight="bold"
            >
              E: SW 45°
            </text>
          </g>

          {/* Isometric View Label */}
          <text
            x={boxView.x + boxView.width / 2}
            y={boxView.y + boxView.depth / 2 + boxView.height + 100}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Isometric View
          </text>
        </g>

        {/* ==================== CROSS-SECTION VIEW ==================== */}
        <g id="cross-section-view">

          {/* Cross-section Label */}
          <text
            x={crossSection.x + crossSection.width / 2}
            y={crossSection.y - 30}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
          >
            Cross-Section View (W × T)
          </text>

          {/* Rectangle with hatching */}
          <rect
            x={crossSection.x}
            y={crossSection.y}
            width={crossSection.width}
            height={crossSection.height}
            fill="url(#box-hatch)"
            stroke="#1f2937"
            strokeWidth="2"
          />

          {/* Center lines */}
          <line
            x1={crossSection.x - 20}
            y1={crossSection.y + crossSection.height / 2}
            x2={crossSection.x + crossSection.width + 20}
            y2={crossSection.y + crossSection.height / 2}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          <line
            x1={crossSection.x + crossSection.width / 2}
            y1={crossSection.y - 20}
            x2={crossSection.x + crossSection.width / 2}
            y2={crossSection.y + crossSection.height + 20}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {/* Dimension labels with actual values */}
          <text x={crossSection.x + crossSection.width / 2} y={crossSection.y + crossSection.height + 30} textAnchor="middle" fill="#6b7280" fontSize="10">W = {actualWidth}mm</text>
          <text x={crossSection.x - 15} y={crossSection.y + crossSection.height / 2} textAnchor="end" fill="#6b7280" fontSize="10">T = {actualThickness}mm</text>

          {/* ========== A: Arrow from top ========== */}
          <g opacity={getDirectionOpacity("A", scanDetails, highlightedDirection)}>
            <line
              x1={crossSection.x + crossSection.width / 2}
              y1={crossSection.y - 60}
              x2={crossSection.x + crossSection.width / 2}
              y2={crossSection.y - 15}
              stroke={getDirectionColor("A", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${crossSection.x + crossSection.width / 2},${crossSection.y - 20}
                       ${crossSection.x + crossSection.width / 2 - 7},${crossSection.y - 33}
                       ${crossSection.x + crossSection.width / 2 + 7},${crossSection.y - 33}`}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
            />
            <text
              x={crossSection.x + crossSection.width / 2 + 20}
              y={crossSection.y - 45}
              fill={getDirectionColor("A", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              A
            </text>
          </g>

          {/* ========== B: Arrow from side ========== */}
          <g opacity={getDirectionOpacity("B", scanDetails, highlightedDirection)}>
            <line
              x1={crossSection.x - 60}
              y1={crossSection.y + crossSection.height / 2}
              x2={crossSection.x - 15}
              y2={crossSection.y + crossSection.height / 2}
              stroke={getDirectionColor("B", scanDetails, highlightedDirection)}
              strokeWidth="2.5"
              strokeDasharray="8,4"
            />
            <polygon
              points={`${crossSection.x - 20},${crossSection.y + crossSection.height / 2}
                       ${crossSection.x - 33},${crossSection.y + crossSection.height / 2 - 7}
                       ${crossSection.x - 33},${crossSection.y + crossSection.height / 2 + 7}`}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
            />
            <text
              x={crossSection.x - 50}
              y={crossSection.y + crossSection.height / 2 - 15}
              fill={getDirectionColor("B", scanDetails, highlightedDirection)}
              fontSize="11"
              fontWeight="bold"
            >
              B
            </text>
          </g>

          {/* ========== D: SW 45° from corner ========== */}
          <g opacity={getDirectionOpacity("D", scanDetails, highlightedDirection)}>
            <line
              x1={crossSection.x - 40}
              y1={crossSection.y + crossSection.height + 40}
              x2={crossSection.x + 20}
              y2={crossSection.y + crossSection.height - 15}
              stroke={getDirectionColor("D", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <polygon
              points={`${crossSection.x + 15},${crossSection.y + crossSection.height - 10}
                       ${crossSection.x - 5},${crossSection.y + crossSection.height + 5}
                       ${crossSection.x + 5},${crossSection.y + crossSection.height + 15}`}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
            />
            <text
              x={crossSection.x - 50}
              y={crossSection.y + crossSection.height + 55}
              fill={getDirectionColor("D", scanDetails, highlightedDirection)}
              fontSize="10"
              fontWeight="bold"
            >
              D: 45°
            </text>
          </g>

          {/* ========== E: SW 45° from corner ========== */}
          <g opacity={getDirectionOpacity("E", scanDetails, highlightedDirection)}>
            <line
              x1={crossSection.x + crossSection.width + 40}
              y1={crossSection.y + crossSection.height + 40}
              x2={crossSection.x + crossSection.width - 20}
              y2={crossSection.y + crossSection.height - 15}
              stroke={getDirectionColor("E", scanDetails, highlightedDirection)}
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <polygon
              points={`${crossSection.x + crossSection.width - 15},${crossSection.y + crossSection.height - 10}
                       ${crossSection.x + crossSection.width + 5},${crossSection.y + crossSection.height + 5}
                       ${crossSection.x + crossSection.width - 5},${crossSection.y + crossSection.height + 15}`}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
            />
            <text
              x={crossSection.x + crossSection.width + 30}
              y={crossSection.y + crossSection.height + 55}
              fill={getDirectionColor("E", scanDetails, highlightedDirection)}
              fontSize="10"
              fontWeight="bold"
            >
              E: 45°
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

export default BoxScanDiagram;
