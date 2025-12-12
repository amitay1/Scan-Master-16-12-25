import React, { useRef, useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";

interface InspectionPlanViewerProps {
  partType?: PartGeometry;
  scanDetails: ScanDetail[];
  highlightedDirection?: string;
  dimensions: {
    diameter?: number;
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    outerDiameter?: number;
    innerDiameter?: number;
  };
}

/**
 * Professional Technical Drawing Style Inspection Plan Viewer
 * Shows cross-sectional view with scanning direction arrows and animations
 * Similar to professional CAD drawings with hatching patterns
 */
export const InspectionPlanViewer: React.FC<InspectionPlanViewerProps> = ({
  partType = 'plate',
  scanDetails,
  highlightedDirection,
  dimensions = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<number>();

  // High-DPI canvas support for retina displays
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      setAnimationFrame(prev => (prev + 1) % 120); // 120 frames cycle
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  // Draw technical drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support high-DPI displays (Retina)
    const displayWidth = 900;
    const displayHeight = 650;
    canvas.width = displayWidth * pixelRatio;
    canvas.height = displayHeight * pixelRatio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Set up high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const width = displayWidth;
    const height = displayHeight;

    // LEVEL 9: Professional Engineering Drawing Background
    drawPremiumBackground(ctx, width, height);

    // LEVEL 9: Professional border frame with zone markers
    drawProfessionalBorderFrame(ctx, width, height);

    // LEVEL 9: Grid reference markers (A-H horizontal, 1-8 vertical)
    drawGridReferenceMarkers(ctx, width, height);

    // Draw enhanced technical grid
    drawEnhancedTechnicalGrid(ctx, width, height);

    // Draw the part cross-section with premium rendering
    const crossSectionBounds = {
      x: 80,
      y: 80,
      width: width - 360,  // Leave room for legend
      height: height - 180
    };

    drawPremiumCrossSection(ctx, partType, crossSectionBounds, dimensions);

    // Draw ISO standard dimension lines
    drawISODimensionLines(ctx, partType, crossSectionBounds, dimensions);

    // RAFAEL 5036 style: Draw arrows for ALL ENABLED scan directions (checkbox checked)
    // Plus highlight the hovered one with extra emphasis
    scanDetails.forEach((detail) => {
      if (detail.enabled) {
        const isHighlighted = detail.scanningDirection === highlightedDirection;
        drawSelectedScanDirectionArrow(
          ctx,
          partType,
          detail.scanningDirection,
          crossSectionBounds,
          dimensions,
          isHighlighted
        );
      }
    });

    // LEVEL 9: Professional title block with all metadata
    drawProfessionalTitleBlock(ctx, width, height, partType);

    // LEVEL 9: Color-coded legend for wave modes
    drawWaveModeLegend(ctx, width, height, scanDetails);

  }, [partType, scanDetails, highlightedDirection, dimensions, animationFrame, pixelRatio]);

  const toggleAnimation = () => setIsAnimating(!isAnimating);
  const resetAnimation = () => setAnimationFrame(0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Inspection Plan - Technical Drawing</h3>
            <Badge variant="outline">{partType}</Badge>
          </div>

          {/* Animation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAnimation}
            >
              {isAnimating ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAnimation}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Professional cross-sectional view showing scanning directions for ultrasonic inspection.
          Hover over table rows to highlight specific scan directions.
        </div>

        <div className="border-4 border-slate-800 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-2 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
          <strong>📐 Technical Drawing View:</strong> This shows the actual part cross-section with animated scanning direction arrows.
          Each arrow represents an ultrasonic inspection direction (A, B, C, D...).
          This is separate from the calibration block which contains FBH drill holes.
        </div>
      </div>
    </Card>
  );
};

/**
 * Draw professional technical grid background
 */
function drawTechnicalGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = 0; x < width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Heavier grid every 100px
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Draw professional cross-section with hatching patterns
 */
function drawProfessionalCrossSection(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#1e293b';

  switch (partType) {
    // RING - Isometric 3D view (short hollow cylinder, height < 2x wall thickness)
    case 'ring':
    case 'ring_forging':
      drawIsometricRing(ctx, centerX, centerY, bounds, dimensions);
      break;

    // DISK - Isometric 3D view (short solid cylinder, height < diameter/3)
    case 'disk':
    case 'disk_forging':
      drawIsometricDisk(ctx, centerX, centerY, bounds, dimensions);
      break;

    // TUBE/PIPE - Hollow circular cross-sections (longer hollow cylinders)
    case 'tube':
    case 'pipe':
    case 'sleeve':
    case 'bushing':
      drawTubeCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // RECTANGULAR TUBE - Hollow rectangular cross-section
    case 'rectangular_tube':
    case 'square_tube':
      drawRectangularTubeCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // CYLINDER/ROUND - Solid circular cross-sections (longer solid cylinders)
    case 'cylinder':
    case 'round_bar':
    case 'shaft':
    case 'hub':
    case 'round_forging_stock':
      drawCylinderCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // PLATE/FLAT - Rectangular cross-sections
    case 'plate':
    case 'bar':
    case 'box':
    case 'sheet':
    case 'slab':
    case 'flat_bar':
    case 'rectangular_bar':
    case 'square_bar':
    case 'billet':
    case 'block':
    case 'rectangular_forging_stock':
      drawPlateCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // I-BEAM/I-PROFILE
    case 'i_profile':
    case 'extrusion_i':
      drawIBeamCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // U-CHANNEL/U-PROFILE
    case 'u_profile':
    case 'extrusion_u':
    case 'extrusion_channel':
      drawUChannelCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // L-ANGLE/L-PROFILE
    case 'l_profile':
    case 'extrusion_l':
    case 'extrusion_angle':
      drawLAngleCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // T-SECTION/T-PROFILE
    case 't_profile':
    case 'extrusion_t':
      drawTSectionCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // Z-PROFILE
    case 'z_profile':
    case 'z_section':
      drawZSectionCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // SPHERE
    case 'sphere':
      drawSphereCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // HEXAGON
    case 'hexagon':
    case 'hex_bar':
      drawHexagonCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // CONE
    case 'cone':
      drawConeCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // PYRAMID
    case 'pyramid':
      drawPyramidCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // ELLIPSE
    case 'ellipse':
      drawEllipseCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // FORGING
    case 'forging':
    case 'near_net_forging':
      drawForgingCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    // CUSTOM/OTHER
    case 'machined_component':
    case 'custom_profile':
    case 'custom':
    case 'irregular':
      drawCustomCrossSection(ctx, centerX, centerY, bounds, dimensions);
      break;

    default:
      drawPlateCrossSection(ctx, centerX, centerY, bounds, dimensions);
  }
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D TUBE / PIPE (Hollow Cylinder)
 * Features:
 * - Dramatic cutaway view showing wall thickness
 * - Inner bore (ID) clearly visible with hatching
 * - Metallic gradient shading for 3D form
 * - ISO hatching on cut section showing material
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawTubeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get REAL dimensions
  const outerDiam = dimensions.outerDiameter || dimensions.diameter || 100;
  const innerDiam = dimensions.innerDiameter || (outerDiam * 0.6);
  const tubeLength = dimensions.length || dimensions.height || 200;

  // Calculate wall thickness for UT: wall = (OD - ID) / 2
  const wallThickness = (outerDiam - innerDiam) / 2;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(outerDiam, tubeLength * 0.7);

  const outerRadius = (outerDiam / 2) * scale;
  const innerRadius = (innerDiam / 2) * scale;
  const length = tubeLength * scale * 0.55;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 10;

  // Back ellipse position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSES (far end) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back outer ellipse
  ctx.beginPath();
  ctx.ellipse(backX, backY, outerRadius * 0.45, outerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Back inner ellipse (the hole)
  ctx.beginPath();
  ctx.ellipse(backX, backY, innerRadius * 0.45, innerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // OUTER CYLINDER BODY with metallic gradient
  // ═══════════════════════════════════════════════════════════════════
  const bodyGradient = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
  bodyGradient.addColorStop(0, '#e2e8f0');
  bodyGradient.addColorStop(0.3, '#f8fafc');
  bodyGradient.addColorStop(0.5, '#e2e8f0');
  bodyGradient.addColorStop(0.7, '#cbd5e1');
  bodyGradient.addColorStop(1, '#94a3b8');

  // Draw outer cylinder body
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  ctx.lineTo(backX, backY - outerRadius);
  ctx.ellipse(backX, backY, outerRadius * 0.45, outerRadius, 0, -Math.PI/2, Math.PI/2, true);
  ctx.lineTo(cx, cy + outerRadius);
  ctx.arc(cx, cy, outerRadius, Math.PI/2, -Math.PI/2, true);
  ctx.closePath();
  ctx.fill();

  // Outer side edges - thick line weight
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  ctx.lineTo(backX, backY - outerRadius);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy + outerRadius);
  ctx.lineTo(backX, backY + outerRadius);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT FACE with annular ring (showing wall thickness)
  // ═══════════════════════════════════════════════════════════════════

  // Create radial gradient for 3D front face
  const frontGradient = ctx.createRadialGradient(
    cx - outerRadius * 0.3, cy - outerRadius * 0.3, innerRadius,
    cx, cy, outerRadius
  );
  frontGradient.addColorStop(0, '#e2e8f0');
  frontGradient.addColorStop(0.5, '#cbd5e1');
  frontGradient.addColorStop(1, '#94a3b8');

  // Draw the annular ring (wall material)
  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
  ctx.fill();

  // Outer circle outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle outline (the bore)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on wall section (45 degree diagonal lines)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius - 1, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerRadius + 1, 0, Math.PI * 2, true);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 5;
  for (let i = -outerRadius * 2; i < outerRadius * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - outerRadius, cy + outerRadius);
    ctx.lineTo(cx + i + outerRadius, cy - outerRadius);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // INNER BORE (white/light to show hollow)
  // ═══════════════════════════════════════════════════════════════════
  const boreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
  boreGradient.addColorStop(0, '#f8fafc');
  boreGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = boreGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 1, 0, Math.PI * 2);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - outerRadius - 40, cy);
  ctx.lineTo(cx + outerRadius + 40, cy);
  ctx.stroke();

  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius - 40);
  ctx.lineTo(cx, cy + outerRadius + 40);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 50 * cos45, cy + 50 * sin45);
  ctx.lineTo(backX - 60 * cos45, backY - 60 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + outerRadius + 55;
  ctx.fillText('TUBE / PIPE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, labelY + 5);
  ctx.lineTo(cx + 60, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

// =============================================================================
// RAFAEL SPEC 5036 FIGURE 1 - INSPECTION SYMBOLS
// =============================================================================

/**
 * RAFAEL 5036 - Scan Direction Symbol (outlined square)
 * Small outlined square indicating scan position
 * Per Figure 1 legend item 1
 */
function drawRAFAEL_ScanDirectionSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = 12
) {
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  // Outlined square only - NOT filled per RAFAEL 5036
  ctx.strokeRect(x - size/2, y - size/2, size, size);
  ctx.restore();
}

/**
 * RAFAEL 5036 - Straight Beam Inspection Symbol
 * Arrow with perpendicular line at tail, pointing INTO material
 * Per Figure 1 legend item 2: arrow pointing in with perpendicular bar at tail
 */
function drawRAFAEL_StraightBeamSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'down' | 'up' | 'left' | 'right',
  length: number = 40
) {
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = '#1e293b';
  ctx.lineWidth = 2.5;

  const headSize = 10;
  const tailWidth = 14;

  // Calculate end point based on direction
  let endX = x, endY = y;
  let tailX1 = x, tailY1 = y, tailX2 = x, tailY2 = y;

  switch (direction) {
    case 'down':
      endY = y + length;
      tailX1 = x - tailWidth/2; tailY1 = y;
      tailX2 = x + tailWidth/2; tailY2 = y;
      break;
    case 'up':
      endY = y - length;
      tailX1 = x - tailWidth/2; tailY1 = y;
      tailX2 = x + tailWidth/2; tailY2 = y;
      break;
    case 'right':
      endX = x + length;
      tailX1 = x; tailY1 = y - tailWidth/2;
      tailX2 = x; tailY2 = y + tailWidth/2;
      break;
    case 'left':
      endX = x - length;
      tailX1 = x; tailY1 = y - tailWidth/2;
      tailX2 = x; tailY2 = y + tailWidth/2;
      break;
  }

  // Draw perpendicular tail line (the bar at the arrow tail)
  ctx.beginPath();
  ctx.moveTo(tailX1, tailY1);
  ctx.lineTo(tailX2, tailY2);
  ctx.stroke();

  // Draw arrow shaft
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw filled arrowhead
  ctx.beginPath();
  if (direction === 'down') {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headSize/2, endY - headSize);
    ctx.lineTo(endX + headSize/2, endY - headSize);
  } else if (direction === 'up') {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headSize/2, endY + headSize);
    ctx.lineTo(endX + headSize/2, endY + headSize);
  } else if (direction === 'right') {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headSize, endY - headSize/2);
    ctx.lineTo(endX - headSize, endY + headSize/2);
  } else if (direction === 'left') {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + headSize, endY - headSize/2);
    ctx.lineTo(endX + headSize, endY + headSize/2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * RAFAEL 5036 - Angle Beam Inspection Symbol (outlined triangle)
 * Open/outlined triangle pointing into material
 * Per Figure 1 legend item 3
 */
function drawRAFAEL_AngleBeamSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'down' | 'up' | 'left' | 'right' | 'down-left' | 'down-right' = 'down',
  size: number = 16
) {
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  switch (direction) {
    case 'down':
      ctx.moveTo(x, y + size);
      ctx.lineTo(x - size/2, y);
      ctx.lineTo(x + size/2, y);
      break;
    case 'up':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size/2, y);
      ctx.lineTo(x + size/2, y);
      break;
    case 'left':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y - size/2);
      ctx.lineTo(x, y + size/2);
      break;
    case 'right':
      ctx.moveTo(x + size, y);
      ctx.lineTo(x, y - size/2);
      ctx.lineTo(x, y + size/2);
      break;
    case 'down-left':
    case 'down-right': {
      // Rotated triangle for angle beam at 45 degrees
      const angle = direction === 'down-left' ? -45 : 45;
      const rad = angle * Math.PI / 180;
      ctx.translate(x, y);
      ctx.rotate(rad);
      ctx.moveTo(0, size);
      ctx.lineTo(-size/2, 0);
      ctx.lineTo(size/2, 0);
      break;
    }
    default:
      ctx.moveTo(x, y + size);
      ctx.lineTo(x - size/2, y);
      ctx.lineTo(x + size/2, y);
  }
  ctx.closePath();
  // Outlined only - NOT filled per RAFAEL 5036
  ctx.stroke();

  ctx.restore();
}

// Legacy wrapper functions for backward compatibility during transition
function drawRafaelScanArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right' | 'right-up',
  _type: 'hollow' | 'filled' = 'filled'
) {
  // Map to new RAFAEL 5036 straight beam symbol
  const mappedDir = direction === 'right-up' ? 'right' : direction;
  drawRAFAEL_StraightBeamSymbol(ctx, x, y, mappedDir as 'up' | 'down' | 'left' | 'right');
}

function drawRafaelAngleBeamArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  // Map to new RAFAEL 5036 angle beam symbol
  drawRAFAEL_AngleBeamSymbol(ctx, x, y, 'down');
}

// =============================================================================
// RAFAEL 5036 FIGURE 1 - SELECTED SCAN DIRECTION ARROW SYSTEM
// =============================================================================

interface ScanDirectionPosition {
  x: number;
  y: number;
  symbolX: number;
  symbolY: number;
  labelX: number;
  labelY: number;
  arrowDirection: 'down' | 'up' | 'left' | 'right';
  isAngleBeam: boolean;
}

/**
 * Draw RAFAEL 5036 scan direction symbol at the correct position
 * Called for ALL enabled directions, with optional highlight for hovered direction
 */
function drawSelectedScanDirectionArrow(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  direction: string,
  bounds: DrawBounds,
  dimensions?: DrawDimensions,
  isHighlighted: boolean = false
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Get the correct position for this direction on this shape
  const position = getScanDirectionPosition(partType, direction, centerX, centerY, bounds, dimensions);

  if (!position) return;

  ctx.save();

  // Add glow effect for highlighted direction
  if (isHighlighted) {
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (position.isAngleBeam) {
    // Angle beam - draw outlined triangle (bigger size: 18 instead of 14)
    drawRAFAEL_AngleBeamSymbol(ctx, position.x, position.y, position.arrowDirection, 18);
  } else {
    // Straight beam - draw square + arrow with bar (bigger sizes: 14 and 45)
    drawRAFAEL_ScanDirectionSymbol(ctx, position.symbolX, position.symbolY, 14);
    drawRAFAEL_StraightBeamSymbol(ctx, position.x, position.y, position.arrowDirection, 45);
  }

  // Draw the direction label (A, B, C, D...) - bigger font: 16px bold
  ctx.fillStyle = isHighlighted ? '#2563eb' : '#1e293b';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(direction.toUpperCase(), position.labelX, position.labelY);

  ctx.restore();
}

/**
 * Get the exact position for a scan direction based on shape type
 * Each shape has specific positions for each direction (A, B, C, D...)
 * Per ASTM E2375 Figures 6 & 7 and Annex A1
 */
function getScanDirectionPosition(
  partType: PartGeometry,
  direction: string,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions?: DrawDimensions
): ScanDirectionPosition | null {

  const scale = Math.min(bounds.width, bounds.height) * 0.003;
  const shapeRadius = 60 * scale;

  // Normalize part type for matching
  const normalizedType = partType.toLowerCase();

  // Define positions for each shape type and direction per ASTM E2375
  switch (normalizedType) {
    // ═══════════════════════════════════════════════════════════════════
    // PLATE / FLAT BAR / RECTANGULAR BAR / BILLET - E2375 Fig.6
    // A=through thickness, B=adjacent side (if W/T<5), J/K=angle beams
    // ═══════════════════════════════════════════════════════════════════
    case 'plate':
    case 'box':
    case 'sheet':
    case 'slab':
    case 'flat_bar':
    case 'rectangular_bar':
    case 'square_bar':
    case 'billet':
    case 'block':
    case 'rectangular_forging_stock':
    case 'bar': {
      const plateW = 100 * scale;
      const plateH = 50 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // E2375 Fig.6: Primary - from top through thickness
          return {
            x: centerX, y: centerY - plateH - 30,
            symbolX: centerX, symbolY: centerY - plateH - 50,
            labelX: centerX + 25, labelY: centerY - plateH - 35,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375 Fig.6: Secondary - from adjacent side (required if W/T<5)
          return {
            x: centerX - plateW - 30, y: centerY,
            symbolX: centerX - plateW - 50, symbolY: centerY,
            labelX: centerX - plateW - 45, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // Opposite side (required if >9 inches)
          return {
            x: centerX, y: centerY + plateH + 30,
            symbolX: centerX, symbolY: centerY + plateH + 50,
            labelX: centerX + 25, labelY: centerY + plateH + 45,
            arrowDirection: 'up', isAngleBeam: false
          };
        case 'J': // E2375 A1.3.4: SW 60° for thin sections (<1 inch)
          return {
            x: centerX + plateW * 0.5, y: centerY - plateH - 25,
            symbolX: centerX + plateW * 0.5, symbolY: centerY - plateH - 25,
            labelX: centerX + plateW * 0.5 + 20, labelY: centerY - plateH - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'K': // E2375 A1.3.4: SW 45° for thick sections (>1 inch)
          return {
            x: centerX - plateW * 0.5, y: centerY - plateH - 25,
            symbolX: centerX - plateW * 0.5, symbolY: centerY - plateH - 25,
            labelX: centerX - plateW * 0.5 - 20, labelY: centerY - plateH - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'I': // Through-Transmission
          return {
            x: centerX + plateW * 0.3, y: centerY - plateH - 30,
            symbolX: centerX + plateW * 0.3, symbolY: centerY - plateH - 50,
            labelX: centerX + plateW * 0.3 + 25, labelY: centerY - plateH - 35,
            arrowDirection: 'down', isAngleBeam: false
          };
        default: return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ROUND BAR / CYLINDER / SHAFT - E2375 Fig.6
    // A/B=radial (while rotating), D/E=circumferential shear CW/CCW, L=360° rotation
    // ═══════════════════════════════════════════════════════════════════
    case 'cylinder':
    case 'round_bar':
    case 'shaft':
    case 'hub':
    case 'round_forging_stock': {
      const barRadius = 55 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // E2375 Fig.6: Radial from top (part rotates)
          return {
            x: centerX, y: centerY - barRadius - 35,
            symbolX: centerX, symbolY: centerY - barRadius - 55,
            labelX: centerX + 25, labelY: centerY - barRadius - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375 Fig.6: Radial from side (alternative position)
          return {
            x: centerX - barRadius - 35, y: centerY,
            symbolX: centerX - barRadius - 55, symbolY: centerY,
            labelX: centerX - barRadius - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // Radial from OD (general radial access)
          return {
            x: centerX + barRadius + 35, y: centerY,
            symbolX: centerX + barRadius + 55, symbolY: centerY,
            labelX: centerX + barRadius + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // E2375 A1.3.2: Circumferential shear CW (angle ≤45°)
          return {
            x: centerX + barRadius * 0.7, y: centerY - barRadius - 25,
            symbolX: centerX + barRadius * 0.7, symbolY: centerY - barRadius - 25,
            labelX: centerX + barRadius * 0.7 + 20, labelY: centerY - barRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E': // E2375 A1.3.2: Circumferential shear CCW
          return {
            x: centerX - barRadius * 0.7, y: centerY - barRadius - 25,
            symbolX: centerX - barRadius * 0.7, symbolY: centerY - barRadius - 25,
            labelX: centerX - barRadius * 0.7 - 20, labelY: centerY - barRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'L': // E2375 Fig.6: Rotational 360° scan (bar rotates while scanning)
          return {
            x: centerX, y: centerY + barRadius + 35,
            symbolX: centerX, symbolY: centerY + barRadius + 55,
            labelX: centerX + 25, labelY: centerY + barRadius + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        default: return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TUBE / PIPE - E2375 Fig.7 + Annex A1.3.3
    // A=from OD, B=from side, C=radial, D/E=circumferential shear CW/CCW,
    // F/G=axial shear directions 1&2, H=from ID
    // ═══════════════════════════════════════════════════════════════════
    case 'tube':
    case 'pipe':
    case 'sleeve':
    case 'bushing': {
      const tubeRadius = 55 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // E2375: From OD radial top
          return {
            x: centerX, y: centerY - tubeRadius - 35,
            symbolX: centerX, symbolY: centerY - tubeRadius - 55,
            labelX: centerX + 25, labelY: centerY - tubeRadius - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375: From OD radial side
          return {
            x: centerX - tubeRadius - 35, y: centerY,
            symbolX: centerX - tubeRadius - 55, symbolY: centerY,
            labelX: centerX - tubeRadius - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // Radial from OD (general)
          return {
            x: centerX + tubeRadius + 35, y: centerY,
            symbolX: centerX + tubeRadius + 55, symbolY: centerY,
            labelX: centerX + tubeRadius + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // E2375 A1.3.3: Circumferential shear CLOCKWISE (required!)
          return {
            x: centerX + tubeRadius * 0.7, y: centerY - tubeRadius - 25,
            symbolX: centerX + tubeRadius * 0.7, symbolY: centerY - tubeRadius - 25,
            labelX: centerX + tubeRadius * 0.7 + 20, labelY: centerY - tubeRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E': // E2375 A1.3.3: Circumferential shear COUNTER-CLOCKWISE (required!)
          return {
            x: centerX - tubeRadius * 0.7, y: centerY - tubeRadius - 25,
            symbolX: centerX - tubeRadius * 0.7, symbolY: centerY - tubeRadius - 25,
            labelX: centerX - tubeRadius * 0.7 - 20, labelY: centerY - tubeRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'F': // E2375 A1.3.3: Axial shear direction 1
          return {
            x: centerX + tubeRadius + 40, y: centerY - tubeRadius * 0.5,
            symbolX: centerX + tubeRadius + 40, symbolY: centerY - tubeRadius * 0.5,
            labelX: centerX + tubeRadius + 55, labelY: centerY - tubeRadius * 0.5 - 15,
            arrowDirection: 'left', isAngleBeam: true
          };
        case 'G': // E2375 A1.3.3: Axial shear direction 2 (opposite)
          return {
            x: centerX + tubeRadius + 40, y: centerY + tubeRadius * 0.5,
            symbolX: centerX + tubeRadius + 40, symbolY: centerY + tubeRadius * 0.5,
            labelX: centerX + tubeRadius + 55, labelY: centerY + tubeRadius * 0.5 + 15,
            arrowDirection: 'left', isAngleBeam: true
          };
        case 'H': // E2375: From ID (inner surface)
          return {
            x: centerX, y: centerY + tubeRadius + 35,
            symbolX: centerX, symbolY: centerY + tubeRadius + 55,
            labelX: centerX + 25, labelY: centerY + tubeRadius + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        default: return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RING FORGING - E2375 Fig.7 + Annex A1.3.1
    // A=from flat face, B=radial from OD (if wall>20% OD), C=radial from circumference,
    // D/E=circumferential shear CW/CCW (REQUIRED!), F/G=axial shear, H=from ID
    // ═══════════════════════════════════════════════════════════════════
    case 'ring':
    case 'ring_forging': {
      const ringRadius = 55 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // E2375 Fig.7: From flat face (axial)
          return {
            x: centerX, y: centerY - ringRadius - 35,
            symbolX: centerX, symbolY: centerY - ringRadius - 55,
            labelX: centerX + 25, labelY: centerY - ringRadius - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375 Fig.7: Radial from OD (if wall thickness > 20% of OD)
          return {
            x: centerX - ringRadius - 35, y: centerY,
            symbolX: centerX - ringRadius - 55, symbolY: centerY,
            labelX: centerX - ringRadius - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // E2375 Fig.7: Radial from circumference
          return {
            x: centerX + ringRadius + 35, y: centerY,
            symbolX: centerX + ringRadius + 55, symbolY: centerY,
            labelX: centerX + ringRadius + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // E2375 A1.3.1: Circumferential shear CLOCKWISE (REQUIRED for rings!)
          return {
            x: centerX + ringRadius * 0.7, y: centerY - ringRadius - 25,
            symbolX: centerX + ringRadius * 0.7, symbolY: centerY - ringRadius - 25,
            labelX: centerX + ringRadius * 0.7 + 20, labelY: centerY - ringRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E': // E2375 A1.3.1: Circumferential shear CCW (REQUIRED for rings!)
          return {
            x: centerX - ringRadius * 0.7, y: centerY - ringRadius - 25,
            symbolX: centerX - ringRadius * 0.7, symbolY: centerY - ringRadius - 25,
            labelX: centerX - ringRadius * 0.7 - 20, labelY: centerY - ringRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'F': // Axial shear direction 1
          return {
            x: centerX + ringRadius + 35, y: centerY - ringRadius * 0.4,
            symbolX: centerX + ringRadius + 35, symbolY: centerY - ringRadius * 0.4,
            labelX: centerX + ringRadius + 50, labelY: centerY - ringRadius * 0.4 - 15,
            arrowDirection: 'left', isAngleBeam: true
          };
        case 'G': // Axial shear direction 2
          return {
            x: centerX + ringRadius + 35, y: centerY + ringRadius * 0.4,
            symbolX: centerX + ringRadius + 35, symbolY: centerY + ringRadius * 0.4,
            labelX: centerX + ringRadius + 50, labelY: centerY + ringRadius * 0.4 + 15,
            arrowDirection: 'left', isAngleBeam: true
          };
        case 'H': // E2375: From ID (inner surface)
          return {
            x: centerX, y: centerY + ringRadius + 35,
            symbolX: centerX, symbolY: centerY + ringRadius + 55,
            labelX: centerX + 25, labelY: centerY + ringRadius + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        default: return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // DISK FORGING - E2375 Fig.7
    // A=from flat face (primary), B=from opposite flat face,
    // C=radial from circumference (required per Fig.7)
    // ═══════════════════════════════════════════════════════════════════
    case 'disk':
    case 'disk_forging': {
      const diskRadius = 55 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // E2375 Fig.7: From flat face (at least one required)
          return {
            x: centerX, y: centerY - diskRadius - 35,
            symbolX: centerX, symbolY: centerY - diskRadius - 55,
            labelX: centerX + 25, labelY: centerY - diskRadius - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375 Fig.7: From opposite flat face (for thick disks)
          return {
            x: centerX, y: centerY + diskRadius + 35,
            symbolX: centerX, symbolY: centerY + diskRadius + 55,
            labelX: centerX + 25, labelY: centerY + diskRadius + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        case 'C': // E2375 Fig.7: Radial from circumference (whenever practical)
          return {
            x: centerX - diskRadius - 35, y: centerY,
            symbolX: centerX - diskRadius - 55, symbolY: centerY,
            labelX: centerX - diskRadius - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'D': // Angle beam from top
          return {
            x: centerX + diskRadius * 0.6, y: centerY - diskRadius - 25,
            symbolX: centerX + diskRadius * 0.6, symbolY: centerY - diskRadius - 25,
            labelX: centerX + diskRadius * 0.6 + 20, labelY: centerY - diskRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E': // Angle beam opposite
          return {
            x: centerX - diskRadius * 0.6, y: centerY - diskRadius - 25,
            symbolX: centerX - diskRadius * 0.6, symbolY: centerY - diskRadius - 25,
            labelX: centerX - diskRadius * 0.6 - 20, labelY: centerY - diskRadius - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // HEX BAR - E2375 Fig.7
    // A/B/C = THREE adjacent faces (required per standard!)
    // ═══════════════════════════════════════════════════════════════════
    case 'hexagon':
    case 'hex_bar': {
      const hexR = 50 * scale;
      // Hex bar has 6 faces at 60° intervals - scan from 3 adjacent (A, B, C)
      switch (direction.toUpperCase()) {
        case 'A': // E2375 Fig.7: First face (top)
          return {
            x: centerX, y: centerY - hexR - 35,
            symbolX: centerX, symbolY: centerY - hexR - 55,
            labelX: centerX + 25, labelY: centerY - hexR - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // E2375 Fig.7: Second adjacent face (upper-left, 60° from A)
          return {
            x: centerX - hexR * 0.87 - 30, y: centerY - hexR * 0.5 - 15,
            symbolX: centerX - hexR * 0.87 - 50, symbolY: centerY - hexR * 0.5 - 15,
            labelX: centerX - hexR * 0.87 - 45, labelY: centerY - hexR * 0.5 - 35,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // E2375 Fig.7: Third adjacent face (upper-right, 60° from A other side)
          return {
            x: centerX + hexR * 0.87 + 30, y: centerY - hexR * 0.5 - 15,
            symbolX: centerX + hexR * 0.87 + 50, symbolY: centerY - hexR * 0.5 - 15,
            labelX: centerX + hexR * 0.87 + 45, labelY: centerY - hexR * 0.5 - 35,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // Angle beam if needed
          return {
            x: centerX + hexR * 0.5, y: centerY - hexR - 30,
            symbolX: centerX + hexR * 0.5, symbolY: centerY - hexR - 30,
            labelX: centerX + hexR * 0.5 + 20, labelY: centerY - hexR - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E': // Angle beam opposite
          return {
            x: centerX - hexR * 0.5, y: centerY - hexR - 30,
            symbolX: centerX - hexR * 0.5, symbolY: centerY - hexR - 30,
            labelX: centerX - hexR * 0.5 - 20, labelY: centerY - hexR - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    case 'rectangular_tube':
    case 'square_tube': {
      const rectW = 60 * scale;
      const rectH = 45 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // From top
          return {
            x: centerX, y: centerY - rectH - 35,
            symbolX: centerX, symbolY: centerY - rectH - 55,
            labelX: centerX + 25, labelY: centerY - rectH - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // From left side
          return {
            x: centerX - rectW - 35, y: centerY,
            symbolX: centerX - rectW - 55, symbolY: centerY,
            labelX: centerX - rectW - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // From right side
          return {
            x: centerX + rectW + 35, y: centerY,
            symbolX: centerX + rectW + 55, symbolY: centerY,
            labelX: centerX + rectW + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // Angle beam
          return {
            x: centerX + rectW * 0.5, y: centerY - rectH - 30,
            symbolX: centerX + rectW * 0.5, symbolY: centerY - rectH - 30,
            labelX: centerX + rectW * 0.5 + 20, labelY: centerY - rectH - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'H': // From inside (hollow)
          return {
            x: centerX, y: centerY + rectH + 35,
            symbolX: centerX, symbolY: centerY + rectH + 55,
            labelX: centerX + 25, labelY: centerY + rectH + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        default: return null;
      }
    }

    case 'i_profile':
    case 'extrusion_i':
    case 'u_profile':
    case 'extrusion_u':
    case 'extrusion_channel':
    case 'l_profile':
    case 'extrusion_l':
    case 'extrusion_angle':
    case 't_profile':
    case 'extrusion_t':
    case 'z_profile':
    case 'z_section': {
      // Structural profiles - scan from multiple directions
      const profH = 55 * scale;
      const profW = 45 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // From top
          return {
            x: centerX, y: centerY - profH - 35,
            symbolX: centerX, symbolY: centerY - profH - 55,
            labelX: centerX + 25, labelY: centerY - profH - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // From left side
          return {
            x: centerX - profW - 35, y: centerY,
            symbolX: centerX - profW - 55, symbolY: centerY,
            labelX: centerX - profW - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // From right side
          return {
            x: centerX + profW + 35, y: centerY,
            symbolX: centerX + profW + 55, symbolY: centerY,
            labelX: centerX + profW + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // Angle beam
          return {
            x: centerX + profW * 0.5, y: centerY - profH - 30,
            symbolX: centerX + profW * 0.5, symbolY: centerY - profH - 30,
            labelX: centerX + profW * 0.5 + 20, labelY: centerY - profH - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    case 'sphere': {
      const sphereR = 55 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // From top
          return {
            x: centerX, y: centerY - sphereR - 35,
            symbolX: centerX, symbolY: centerY - sphereR - 55,
            labelX: centerX + 25, labelY: centerY - sphereR - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // From left side
          return {
            x: centerX - sphereR - 35, y: centerY,
            symbolX: centerX - sphereR - 55, symbolY: centerY,
            labelX: centerX - sphereR - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // From right side
          return {
            x: centerX + sphereR + 35, y: centerY,
            symbolX: centerX + sphereR + 55, symbolY: centerY,
            labelX: centerX + sphereR + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // Angle beam
          return {
            x: centerX + sphereR * 0.7, y: centerY - sphereR - 25,
            symbolX: centerX + sphereR * 0.7, symbolY: centerY - sphereR - 25,
            labelX: centerX + sphereR * 0.7 + 20, labelY: centerY - sphereR - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    case 'cone':
    case 'pyramid': {
      const coneH = 65 * scale;
      const coneW = 50 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // From top/apex
          return {
            x: centerX, y: centerY - coneH - 35,
            symbolX: centerX, symbolY: centerY - coneH - 55,
            labelX: centerX + 25, labelY: centerY - coneH - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // From left side
          return {
            x: centerX - coneW - 35, y: centerY,
            symbolX: centerX - coneW - 55, symbolY: centerY,
            labelX: centerX - coneW - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // From base
          return {
            x: centerX, y: centerY + coneH + 35,
            symbolX: centerX, symbolY: centerY + coneH + 55,
            labelX: centerX + 25, labelY: centerY + coneH + 50,
            arrowDirection: 'up', isAngleBeam: false
          };
        case 'D': // Angle beam
          return {
            x: centerX + coneW * 0.5, y: centerY - coneH - 30,
            symbolX: centerX + coneW * 0.5, symbolY: centerY - coneH - 30,
            labelX: centerX + coneW * 0.5 + 20, labelY: centerY - coneH - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    case 'ellipse': {
      const ellMajor = 60 * scale;
      const ellMinor = 40 * scale;
      switch (direction.toUpperCase()) {
        case 'A': // From top
          return {
            x: centerX, y: centerY - ellMinor - 35,
            symbolX: centerX, symbolY: centerY - ellMinor - 55,
            labelX: centerX + 25, labelY: centerY - ellMinor - 40,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B': // From left side
          return {
            x: centerX - ellMajor - 35, y: centerY,
            symbolX: centerX - ellMajor - 55, symbolY: centerY,
            labelX: centerX - ellMajor - 50, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C': // From right side
          return {
            x: centerX + ellMajor + 35, y: centerY,
            symbolX: centerX + ellMajor + 55, symbolY: centerY,
            labelX: centerX + ellMajor + 50, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D': // Angle beam
          return {
            x: centerX + ellMajor * 0.5, y: centerY - ellMinor - 30,
            symbolX: centerX + ellMajor * 0.5, symbolY: centerY - ellMinor - 30,
            labelX: centerX + ellMajor * 0.5 + 20, labelY: centerY - ellMinor - 45,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }

    default: {
      // Default positions for other shapes (forging, custom, etc.)
      const defaultR = 60 * scale;
      switch (direction.toUpperCase()) {
        case 'A':
          return {
            x: centerX, y: centerY - defaultR - 30,
            symbolX: centerX, symbolY: centerY - defaultR - 50,
            labelX: centerX + 25, labelY: centerY - defaultR - 35,
            arrowDirection: 'down', isAngleBeam: false
          };
        case 'B':
          return {
            x: centerX - defaultR - 30, y: centerY,
            symbolX: centerX - defaultR - 50, symbolY: centerY,
            labelX: centerX - defaultR - 45, labelY: centerY - 20,
            arrowDirection: 'right', isAngleBeam: false
          };
        case 'C':
          return {
            x: centerX + defaultR + 30, y: centerY,
            symbolX: centerX + defaultR + 50, symbolY: centerY,
            labelX: centerX + defaultR + 45, labelY: centerY - 20,
            arrowDirection: 'left', isAngleBeam: false
          };
        case 'D':
          return {
            x: centerX + defaultR * 0.5, y: centerY - defaultR - 25,
            symbolX: centerX + defaultR * 0.5, symbolY: centerY - defaultR - 25,
            labelX: centerX + defaultR * 0.5 + 20, labelY: centerY - defaultR - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        case 'E':
          return {
            x: centerX - defaultR * 0.5, y: centerY - defaultR - 25,
            symbolX: centerX - defaultR * 0.5, symbolY: centerY - defaultR - 25,
            labelX: centerX - defaultR * 0.5 - 20, labelY: centerY - defaultR - 40,
            arrowDirection: 'down', isAngleBeam: true
          };
        default: return null;
      }
    }
  }
}

/**
 * Draw RAFAEL-STYLE CYLINDER/ROUND BAR TECHNICAL DRAWING
 * Left: Cross-section view (solid circle)
 * Right: Side view (rectangle)
 * Includes scan direction arrows
 */
/**
 * Draw PROFESSIONAL CAD-GRADE 3D CYLINDER / ROUND BAR
 * Features:
 * - Tilted 3D cylinder at 45 degrees showing depth
 * - Metallic gradient shading for 3D form
 * - Elliptical front face with ISO hatching
 * - Dashed hidden lines for back ellipse
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawCylinderCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get REAL dimensions
  const diameter = dimensions.diameter || dimensions.outerDiameter || 100;
  const cylinderLength = dimensions.length || dimensions.height || 200;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(diameter, cylinderLength * 0.7);

  const radius = (diameter / 2) * scale;
  const length = cylinderLength * scale * 0.6;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 10;

  // Back ellipse position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (far end) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, radius * 0.45, radius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // CYLINDRICAL BODY with metallic gradient
  // ═══════════════════════════════════════════════════════════════════

  // Create gradient for metallic look on cylinder body
  const bodyGradient = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  bodyGradient.addColorStop(0, '#e2e8f0');
  bodyGradient.addColorStop(0.3, '#f8fafc');
  bodyGradient.addColorStop(0.5, '#e2e8f0');
  bodyGradient.addColorStop(0.7, '#cbd5e1');
  bodyGradient.addColorStop(1, '#94a3b8');

  // Draw cylinder body (connect front and back with filled area)
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(backX, backY - radius);
  // Back arc (top half)
  ctx.ellipse(backX, backY, radius * 0.45, radius, 0, -Math.PI/2, Math.PI/2, true);
  ctx.lineTo(cx, cy + radius);
  // Front arc (bottom half going back)
  ctx.arc(cx, cy, radius, Math.PI/2, -Math.PI/2, true);
  ctx.closePath();
  ctx.fill();

  // Side edges - thick line weight
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;

  // Top edge
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(backX, backY - radius);
  ctx.stroke();

  // Bottom edge
  ctx.beginPath();
  ctx.moveTo(cx, cy + radius);
  ctx.lineTo(backX, backY + radius);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT CIRCLE (cross-section) with gradient and hatching
  // ═══════════════════════════════════════════════════════════════════

  // Create radial gradient for 3D circle
  const frontGradient = ctx.createRadialGradient(
    cx - radius * 0.3, cy - radius * 0.3, 0,
    cx, cy, radius
  );
  frontGradient.addColorStop(0, '#f8fafc');
  frontGradient.addColorStop(0.5, '#e2e8f0');
  frontGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Thick outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front face (45 degree diagonal lines)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 6;
  for (let i = -radius * 2; i < radius * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - radius, cy + radius);
    ctx.lineTo(cx + i + radius, cy - radius);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front circle
  ctx.beginPath();
  ctx.moveTo(cx - radius - 40, cy);
  ctx.lineTo(cx + radius + 40, cy);
  ctx.stroke();

  // Vertical through front circle
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 40);
  ctx.lineTo(cx, cy + radius + 40);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 50 * cos45, cy + 50 * sin45);
  ctx.lineTo(backX - 60 * cos45, backY - 60 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + radius + 55;
  ctx.fillText('ROUND BAR', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 55, labelY + 5);
  ctx.lineTo(cx + 55, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: Draw diagonal arrow with line (Rafael style)
 */
function drawRafaelDiagonalArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // Draw arrowhead
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLength = 10;
  
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D RING (Hollow Short Cylinder)
 * Features:
 * - Torus-like 3D view showing circular cross-section
 * - Visible wall thickness with ISO hatching
 * - Metallic gradient shading for 3D form
 * - Clear OD, ID indication
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawIsometricRing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get REAL dimensions
  const outerDiam = dimensions.outerDiameter || dimensions.diameter || 200;
  const innerDiam = dimensions.innerDiameter || (outerDiam * 0.6);
  const ringHeight = dimensions.thickness || dimensions.height || 40;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(outerDiam, ringHeight * 2);

  const outerR = (outerDiam / 2) * scale;
  const innerR = (innerDiam / 2) * scale;
  const h = ringHeight * scale;
  const ellipseRatio = 0.4;

  // Position
  const cx = centerX;
  const cy = centerY;

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSES (top surface) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back outer ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, outerR, outerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Back inner ellipse (hole at top)
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, innerR, innerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // OUTER CYLINDER WALL with metallic gradient
  // ═══════════════════════════════════════════════════════════════════
  const outerGradient = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy);
  outerGradient.addColorStop(0, '#94a3b8');
  outerGradient.addColorStop(0.3, '#cbd5e1');
  outerGradient.addColorStop(0.5, '#f8fafc');
  outerGradient.addColorStop(0.7, '#e2e8f0');
  outerGradient.addColorStop(1, '#94a3b8');

  // Draw outer cylinder wall (visible portion)
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerR, outerR * ellipseRatio, 0, 0, Math.PI); // Bottom half
  ctx.lineTo(cx - outerR, cy - h);
  ctx.ellipse(cx, cy - h, outerR, outerR * ellipseRatio, 0, Math.PI, 0, true); // Top back half
  ctx.lineTo(cx + outerR, cy);
  ctx.closePath();
  ctx.fill();

  // Outer side edges - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - outerR, cy);
  ctx.lineTo(cx - outerR, cy - h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + outerR, cy);
  ctx.lineTo(cx + outerR, cy - h);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // INNER CYLINDER WALL (the hole)
  // ═══════════════════════════════════════════════════════════════════
  const innerGradient = ctx.createLinearGradient(cx - innerR, cy, cx + innerR, cy);
  innerGradient.addColorStop(0, '#e2e8f0');
  innerGradient.addColorStop(0.5, '#f8fafc');
  innerGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, innerR, innerR * ellipseRatio, 0, 0, Math.PI);
  ctx.lineTo(cx - innerR, cy - h);
  ctx.ellipse(cx, cy - h, innerR, innerR * ellipseRatio, 0, Math.PI, 0, true);
  ctx.lineTo(cx + innerR, cy);
  ctx.closePath();
  ctx.fill();

  // Inner side edges
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - innerR, cy);
  ctx.lineTo(cx - innerR, cy - h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + innerR, cy);
  ctx.lineTo(cx + innerR, cy - h);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSES (bottom surface) with hatching on annular face
  // ═══════════════════════════════════════════════════════════════════

  // Draw annular ring face with gradient
  const frontGradient = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy);
  frontGradient.addColorStop(0, '#cbd5e1');
  frontGradient.addColorStop(0.5, '#e2e8f0');
  frontGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerR, outerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy, innerR, innerR * ellipseRatio, 0, 0, Math.PI * 2, true);
  ctx.fill();

  // ISO Hatching on annular face
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerR - 1, (outerR - 1) * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy, innerR + 1, (innerR + 1) * ellipseRatio, 0, 0, Math.PI * 2, true);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 5;
  for (let i = -outerR * 2; i < outerR * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - outerR, cy + outerR * ellipseRatio);
    ctx.lineTo(cx + i + outerR, cy - outerR * ellipseRatio);
    ctx.stroke();
  }
  ctx.restore();

  // Front outer ellipse outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerR, outerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Front inner ellipse outline (the hole)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, innerR, innerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - outerR - 40, cy);
  ctx.lineTo(cx + outerR + 40, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - outerR * ellipseRatio - 30);
  ctx.lineTo(cx, cy + outerR * ellipseRatio + 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + outerR * ellipseRatio + 55;
  ctx.fillText('RING', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 30, labelY + 5);
  ctx.lineTo(cx + 30, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D DISK (Short Solid Cylinder)
 * Features:
 * - Tilted coin-like 3D view
 * - Top ellipse with subtle hatching showing solid material
 * - Metallic gradient shading on cylindrical surface
 * - Clear thickness indication
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawIsometricDisk(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get REAL dimensions
  const diameter = dimensions.diameter || dimensions.outerDiameter || 200;
  const diskHeight = dimensions.thickness || dimensions.height || 40;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(diameter, diskHeight * 2);

  const r = (diameter / 2) * scale;
  const h = diskHeight * scale;
  const ellipseRatio = 0.4;

  // Position
  const cx = centerX;
  const cy = centerY;

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (top surface) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, r, r * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // CYLINDRICAL SIDE WALL with metallic gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  sideGradient.addColorStop(0, '#94a3b8');
  sideGradient.addColorStop(0.2, '#cbd5e1');
  sideGradient.addColorStop(0.4, '#f8fafc');
  sideGradient.addColorStop(0.6, '#e2e8f0');
  sideGradient.addColorStop(0.8, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Draw side wall
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * ellipseRatio, 0, 0, Math.PI); // Bottom half
  ctx.lineTo(cx - r, cy - h);
  ctx.ellipse(cx, cy - h, r, r * ellipseRatio, 0, Math.PI, 0, true); // Top back half
  ctx.lineTo(cx + r, cy);
  ctx.closePath();
  ctx.fill();

  // Side edges - thick line weight
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx - r, cy - h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + r, cy - h);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSE (bottom face) with gradient and hatching
  // ═══════════════════════════════════════════════════════════════════
  const frontGradient = ctx.createRadialGradient(
    cx - r * 0.3, cy - r * ellipseRatio * 0.3, 0,
    cx, cy, r
  );
  frontGradient.addColorStop(0, '#f8fafc');
  frontGradient.addColorStop(0.5, '#e2e8f0');
  frontGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.fill();

  // ISO Hatching on front ellipse
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r - 2, (r - 2) * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 6;
  for (let i = -r * 2; i < r * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - r, cy + r * ellipseRatio);
    ctx.lineTo(cx + i + r, cy - r * ellipseRatio);
    ctx.stroke();
  }
  ctx.restore();

  // Front ellipse outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - r - 40, cy);
  ctx.lineTo(cx + r + 40, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - r * ellipseRatio - 30);
  ctx.lineTo(cx, cy + r * ellipseRatio + 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + r * ellipseRatio + 55;
  ctx.fillText('DISK', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 28, labelY + 5);
  ctx.lineTo(cx + 28, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw plate cross-section with hatching
 */
/**
 * Draw PROFESSIONAL CAD-GRADE 3D ISOMETRIC PLATE
 * Features:
 * - True isometric projection (30 degrees from horizontal)
 * - ISO standard line weights (thick 2.5-3px, medium 1.5px, thin 0.8px)
 * - Gradient fills for 3D depth perception
 * - 45-degree ISO hatching on front face showing material section
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawPlateCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get dimensions - make it BIG
  const thickness = dimensions.thickness || dimensions.height || 30;
  const width = dimensions.width || dimensions.length || 200;
  const depth = dimensions.depth || width * 0.4;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(width, depth, thickness * 3);

  const w = width * scale;
  const h = thickness * scale;
  const d = depth * scale * 0.5; // Isometric depth

  // Isometric offsets (30 degrees)
  const isoX = d * Math.cos(Math.PI / 6);
  const isoY = d * Math.sin(Math.PI / 6);

  // Position
  const x = centerX - w / 2;
  const y = centerY - h / 2 + isoY / 2;

  // ═══════════════════════════════════════════════════════════════════
  // TOP FACE (lightest - receives most light)
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(x, y - isoY, x + w, y);
  topGradient.addColorStop(0, '#f8fafc');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + isoX, y - isoY);
  ctx.lineTo(x + w + isoX, y - isoY);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();

  // Top face outline - thick line weight
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT FACE (medium shade - section cut view)
  // ═══════════════════════════════════════════════════════════════════
  const frontGradient = ctx.createLinearGradient(x, y, x, y + h);
  frontGradient.addColorStop(0, '#e2e8f0');
  frontGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = frontGradient;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT FACE (darkest - shadow side)
  // ═══════════════════════════════════════════════════════════════════
  const rightGradient = ctx.createLinearGradient(x + w, y, x + w + isoX, y + h);
  rightGradient.addColorStop(0, '#cbd5e1');
  rightGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + isoX, y - isoY);
  ctx.lineTo(x + w + isoX, y + h - isoY);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front face (45 degree diagonal lines - material indication)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 6;
  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline through front face
  ctx.beginPath();
  ctx.moveTo(x - 30, y + h/2);
  ctx.lineTo(x + w + 30, y + h/2);
  ctx.stroke();

  // Vertical centerline through front face
  ctx.beginPath();
  ctx.moveTo(x + w/2, y - 30);
  ctx.lineTo(x + w/2, y + h + 30);
  ctx.stroke();

  // Diagonal centerline through top face
  ctx.beginPath();
  ctx.moveTo(x + w/2 - 20, y - isoY/2 + 20 * Math.tan(Math.PI/6));
  ctx.lineTo(x + w/2 + isoX + 20, y - isoY - 20 * Math.tan(Math.PI/6));
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PLATE', centerX, y + h + 50);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 35, y + h + 55);
  ctx.lineTo(centerX + 35, y + h + 55);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D FORGING
 * Generic irregular forging with scan arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw PROFESSIONAL CAD-GRADE 3D FORGING BLOCK
 * Features:
 * - Rough-edged isometric block (slightly irregular to show forging)
 * - Heavy hatching showing solid material
 * - Bold outlines (3px)
 * - Gradient fills for 3D metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawForgingCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get dimensions
  const width = dimensions.width || dimensions.length || 180;
  const height = dimensions.height || dimensions.thickness || 100;
  const depth = dimensions.depth || width * 0.4;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(width, height, depth);

  const w = width * scale;
  const h = height * scale;
  const d = depth * scale * 0.5;

  // Isometric offsets (30 degrees)
  const isoAngle = Math.PI / 6;
  const isoX = d * Math.cos(isoAngle);
  const isoY = d * Math.sin(isoAngle);

  // Position
  const cx = centerX;
  const cy = centerY;
  const x = cx - w / 2;
  const y = cy - h / 2 + isoY / 2;

  // Irregular edge offsets (to show forging character)
  const irregularOffset = 3;
  const irr = () => (Math.random() - 0.5) * irregularOffset;

  // ═══════════════════════════════════════════════════════════════════
  // TOP FACE (lightest - forging surface)
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(x, y - isoY, x + w, y);
  topGradient.addColorStop(0, '#f8fafc');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(x + irr(), y + irr());
  ctx.lineTo(x + isoX + irr(), y - isoY + irr());
  ctx.lineTo(x + w + isoX + irr(), y - isoY + irr());
  ctx.lineTo(x + w + irr(), y + irr());
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT FACE (medium - section view with heavy hatching)
  // ═══════════════════════════════════════════════════════════════════
  const frontGradient = ctx.createLinearGradient(x, y, x, y + h);
  frontGradient.addColorStop(0, '#e2e8f0');
  frontGradient.addColorStop(0.5, '#d1d5db');
  frontGradient.addColorStop(1, '#9ca3af');

  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.moveTo(x + irr(), y + irr());
  ctx.lineTo(x + w + irr(), y + irr());
  ctx.lineTo(x + w + irr(), y + h + irr());
  ctx.lineTo(x + irr(), y + h + irr());
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT FACE (darkest - shadow side)
  // ═══════════════════════════════════════════════════════════════════
  const rightGradient = ctx.createLinearGradient(x + w, y, x + w + isoX, y + h);
  rightGradient.addColorStop(0, '#94a3b8');
  rightGradient.addColorStop(1, '#64748b');

  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.moveTo(x + w + irr(), y + irr());
  ctx.lineTo(x + w + isoX + irr(), y - isoY + irr());
  ctx.lineTo(x + w + isoX + irr(), y + h - isoY + irr());
  ctx.lineTo(x + w + irr(), y + h + irr());
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // HEAVY ISO HATCHING on front face (45 degree, 5px spacing - dense for forging)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.8;
  const hatchSpacing = 5;
  for (let i = -h; i < w + h; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // FORGING TEXTURE LINES (additional cross-hatching for forging character)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.4;
  for (let i = -h; i < w + h; i += hatchSpacing * 2) {
    ctx.beginPath();
    ctx.moveTo(x + i + h, y + h);
    ctx.lineTo(x + i, y);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline through front face
  ctx.beginPath();
  ctx.moveTo(x - 40, y + h/2);
  ctx.lineTo(x + w + 40, y + h/2);
  ctx.stroke();

  // Vertical centerline through front face
  ctx.beginPath();
  ctx.moveTo(x + w/2, y - 40);
  ctx.lineTo(x + w/2, y + h + 40);
  ctx.stroke();

  // Diagonal centerline through top face
  ctx.beginPath();
  ctx.moveTo(x + w/2 - 20, y - isoY/2 + 10);
  ctx.lineTo(x + w/2 + isoX + 20, y - isoY - 10);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = y + h + 55;
  ctx.fillText('FORGING', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 45, labelY + 5);
  ctx.lineTo(cx + 45, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D I-BEAM PROFILE
 * Features:
 * - True I-profile cross-section view
 * - 3D extrusion showing depth
 * - Hatching on the I-profile material
 * - Web and flanges clearly distinguished
 * - Gradient fills for metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawIBeamCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const flangeWidth = dimensions.flangeWidth || 120;
  const flangeThickness = dimensions.flangeThickness || 15;
  const webThickness = dimensions.webThickness || 10;
  const profileHeight = dimensions.profileHeight || dimensions.height || 180;
  const profileLength = dimensions.length || 150;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(flangeWidth, profileHeight, profileLength * 0.6);

  const fw = flangeWidth * scale;
  const ft = Math.max(flangeThickness * scale, 8);
  const wt = Math.max(webThickness * scale, 6);
  const ph = profileHeight * scale;
  const length = profileLength * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK I-PROFILE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back I-shape outline
  ctx.beginPath();
  // Top flange
  ctx.moveTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2 + ft);
  ctx.lineTo(backX + wt/2, backY - ph/2 + ft);
  // Web right
  ctx.lineTo(backX + wt/2, backY + ph/2 - ft);
  // Bottom flange
  ctx.lineTo(backX + fw/2, backY + ph/2 - ft);
  ctx.lineTo(backX + fw/2, backY + ph/2);
  ctx.lineTo(backX - fw/2, backY + ph/2);
  ctx.lineTo(backX - fw/2, backY + ph/2 - ft);
  ctx.lineTo(backX - wt/2, backY + ph/2 - ft);
  // Web left
  ctx.lineTo(backX - wt/2, backY - ph/2 + ft);
  ctx.lineTo(backX - fw/2, backY - ph/2 + ft);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP FLANGE SURFACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(backX, backY - ph/2, cx, cy - ph/2);
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT SIDE SURFACE (web and flange) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx + fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(0.5, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Right flange top
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2 + ft);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right flange bottom
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy + ph/2 - ft);
  ctx.lineTo(backX + fw/2, backY + ph/2 - ft);
  ctx.lineTo(backX + fw/2, backY + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT I-PROFILE FACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createLinearGradient(cx - fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  faceGradient.addColorStop(0, '#f8fafc');
  faceGradient.addColorStop(0.3, '#f1f5f9');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  // Top flange
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  // Web right
  ctx.lineTo(cx + wt/2, cy + ph/2 - ft);
  // Bottom flange
  ctx.lineTo(cx + fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy + ph/2 - ft);
  // Web left
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front I-profile (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  // Recreate I-shape for clipping
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(fw, ph) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front I-profile outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 50, cy);
  ctx.lineTo(cx + fw/2 + 50, cy);
  ctx.stroke();

  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 50);
  ctx.lineTo(cx, cy + ph/2 + 50);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + ph/2 + 55;
  ctx.fillText('I-BEAM', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 40, labelY + 5);
  ctx.lineTo(cx + 40, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D U-CHANNEL PROFILE
 * Features:
 * - U-shape cross-section view
 * - 3D depth showing the profile
 * - Hatching on material areas
 * - Clear wall thickness visualization
 * - Gradient fills for metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawUChannelCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const profileHeight = dimensions.profileHeight || dimensions.height || 120;
  const flangeWidth = dimensions.flangeWidth || 80;
  const webThickness = dimensions.webThickness || 10;
  const flangeThickness = dimensions.flangeThickness || 12;
  const profileLength = dimensions.length || 140;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(flangeWidth, profileHeight, profileLength * 0.6);

  const ph = profileHeight * scale;
  const fw = flangeWidth * scale;
  const wt = Math.max(webThickness * scale, 6);
  const ft = Math.max(flangeThickness * scale, 8);
  const length = profileLength * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK U-PROFILE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX - fw/2, backY + ph/2);
  ctx.lineTo(backX + fw/2, backY + ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2 - ft, backY - ph/2);
  ctx.lineTo(backX + fw/2 - ft, backY + ph/2 - wt);
  ctx.lineTo(backX - fw/2 + ft, backY + ph/2 - wt);
  ctx.lineTo(backX - fw/2 + ft, backY - ph/2);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP SURFACES (left and right flanges) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(backX, backY - ph/2, cx, cy - ph/2);
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  // Left flange top
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX - fw/2 + ft, backY - ph/2);
  ctx.lineTo(cx - fw/2 + ft, cy - ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Right flange top
  ctx.beginPath();
  ctx.moveTo(cx + fw/2 - ft, cy - ph/2);
  ctx.lineTo(backX + fw/2 - ft, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // OUTER SIDE SURFACES with gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx + fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(0.5, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Right outer side
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom (web) surface
  const bottomGradient = ctx.createLinearGradient(cx, cy + ph/2 - wt, cx, cy + ph/2);
  bottomGradient.addColorStop(0, '#cbd5e1');
  bottomGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = bottomGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(backX - fw/2, backY + ph/2);
  ctx.lineTo(backX + fw/2, backY + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT U-PROFILE FACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createLinearGradient(cx - fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  faceGradient.addColorStop(0, '#f8fafc');
  faceGradient.addColorStop(0.3, '#f1f5f9');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy - ph/2);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front U-profile (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy - ph/2);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(fw, ph) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front U-profile outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy - ph/2);
  ctx.lineTo(cx + fw/2 - ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy + ph/2 - wt);
  ctx.lineTo(cx - fw/2 + ft, cy - ph/2);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 50, cy);
  ctx.lineTo(cx + fw/2 + 50, cy);
  ctx.stroke();

  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 50);
  ctx.lineTo(cx, cy + ph/2 + 50);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + ph/2 + 55;
  ctx.fillText('U-CHANNEL', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 55, labelY + 5);
  ctx.lineTo(cx + 55, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D L-ANGLE PROFILE
 * Features:
 * - L-shape cross-section view
 * - 3D isometric view with depth
 * - Hatching showing material
 * - Equal or unequal legs clearly shown
 * - Gradient fills for metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawLAngleCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const leg1 = dimensions.leg1 || 100; // Horizontal leg
  const leg2 = dimensions.leg2 || 80;  // Vertical leg
  const thickness = dimensions.thickness || 12;
  const profileLength = dimensions.length || 120;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(leg1, leg2, profileLength * 0.6);

  const l1 = leg1 * scale;
  const l2 = leg2 * scale;
  const t = Math.max(thickness * scale, 8);
  const length = profileLength * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK L-PROFILE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(backX - t/2, backY + l2/2);
  ctx.lineTo(backX - t/2, backY - l2/2);
  ctx.lineTo(backX + l1/2, backY - l2/2);
  ctx.lineTo(backX + l1/2, backY - l2/2 + t);
  ctx.lineTo(backX + t/2, backY - l2/2 + t);
  ctx.lineTo(backX + t/2, backY + l2/2);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP SURFACE (horizontal leg) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(backX, backY - l2/2, cx, cy - l2/2);
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy - l2/2);
  ctx.lineTo(backX - t/2, backY - l2/2);
  ctx.lineTo(backX + l1/2, backY - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT SIDE SURFACE (horizontal leg end) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx + l1/2, cy - l2/2, cx + l1/2, cy - l2/2 + t);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(backX + l1/2, backY - l2/2);
  ctx.lineTo(backX + l1/2, backY - l2/2 + t);
  ctx.lineTo(cx + l1/2, cy - l2/2 + t);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // LEFT SIDE SURFACE (vertical leg) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const leftGradient = ctx.createLinearGradient(cx - t/2, cy - l2/2, cx - t/2, cy + l2/2);
  leftGradient.addColorStop(0, '#cbd5e1');
  leftGradient.addColorStop(0.5, '#b3bcc9');
  leftGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy - l2/2);
  ctx.lineTo(backX - t/2, backY - l2/2);
  ctx.lineTo(backX - t/2, backY + l2/2);
  ctx.lineTo(cx - t/2, cy + l2/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT L-PROFILE FACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createLinearGradient(cx - t/2, cy - l2/2, cx + l1/2, cy + l2/2);
  faceGradient.addColorStop(0, '#f8fafc');
  faceGradient.addColorStop(0.3, '#f1f5f9');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy + l2/2);
  ctx.lineTo(cx - t/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy + l2/2);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front L-profile (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy + l2/2);
  ctx.lineTo(cx - t/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy + l2/2);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(l1, l2) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front L-profile outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy + l2/2);
  ctx.lineTo(cx - t/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy + l2/2);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Vertical centerline through vertical leg
  ctx.beginPath();
  ctx.moveTo(cx, cy - l2/2 - 50);
  ctx.lineTo(cx, cy + l2/2 + 50);
  ctx.stroke();

  // Horizontal centerline through horizontal leg
  ctx.beginPath();
  ctx.moveTo(cx - t/2 - 30, cy - l2/2 + t/2);
  ctx.lineTo(cx + l1/2 + 30, cy - l2/2 + t/2);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + l2/2 + 55;
  ctx.fillText('L-ANGLE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 45, labelY + 5);
  ctx.lineTo(cx + 45, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D T-SECTION PROFILE
 * Features:
 * - T-shape cross-section view
 * - 3D depth showing the profile
 * - Hatching on material areas
 * - Stem and flange clearly distinguished
 * - Gradient fills for metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawTSectionCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const flangeWidth = dimensions.flangeWidth || 120;
  const flangeThickness = dimensions.flangeThickness || 15;
  const webThickness = dimensions.webThickness || 12;
  const profileHeight = dimensions.profileHeight || dimensions.height || 140;
  const profileLength = dimensions.length || 130;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(flangeWidth, profileHeight, profileLength * 0.6);

  const fw = flangeWidth * scale;
  const ft = Math.max(flangeThickness * scale, 8);
  const wt = Math.max(webThickness * scale, 6);
  const ph = profileHeight * scale;
  const length = profileLength * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK T-PROFILE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2 + ft);
  ctx.lineTo(backX + wt/2, backY - ph/2 + ft);
  ctx.lineTo(backX + wt/2, backY + ph/2);
  ctx.lineTo(backX - wt/2, backY + ph/2);
  ctx.lineTo(backX - wt/2, backY - ph/2 + ft);
  ctx.lineTo(backX - fw/2, backY - ph/2 + ft);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP FLANGE SURFACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(backX, backY - ph/2, cx, cy - ph/2);
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT SIDE SURFACES with gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx + fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(0.5, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Right flange side
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2);
  ctx.lineTo(backX + fw/2, backY - ph/2 + ft);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right web side
  ctx.beginPath();
  ctx.moveTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(backX + wt/2, backY - ph/2 + ft);
  ctx.lineTo(backX + wt/2, backY + ph/2);
  ctx.lineTo(cx + wt/2, cy + ph/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT T-PROFILE FACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createLinearGradient(cx - fw/2, cy - ph/2, cx + fw/2, cy + ph/2);
  faceGradient.addColorStop(0, '#f8fafc');
  faceGradient.addColorStop(0.3, '#f1f5f9');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front T-profile (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(fw, ph) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front T-profile outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy + ph/2);
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Vertical centerline through stem
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 50);
  ctx.lineTo(cx, cy + ph/2 + 50);
  ctx.stroke();

  // Horizontal centerline through flange
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 50, cy - ph/2 + ft/2);
  ctx.lineTo(cx + fw/2 + 50, cy - ph/2 + ft/2);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + ph/2 + 55;
  ctx.fillText('T-SECTION', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 50, labelY + 5);
  ctx.lineTo(cx + 50, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D SPHERE
 * Features:
 * - Photorealistic 3D sphere with specular highlight
 * - Multiple gradient layers for depth
 * - Equator and meridian lines for orientation
 * - Half-section cutaway option with hatching
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawSphereCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get dimensions
  const diameter = dimensions.diameter || 150;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / diameter;
  const radius = (diameter / 2) * scale;

  // Position
  const cx = centerX;
  const cy = centerY;

  // ═══════════════════════════════════════════════════════════════════
  // SHADOW (subtle drop shadow for depth)
  // ═══════════════════════════════════════════════════════════════════
  const shadowGradient = ctx.createRadialGradient(
    cx + 5, cy + 8, radius * 0.8,
    cx + 5, cy + 8, radius * 1.2
  );
  shadowGradient.addColorStop(0, 'rgba(0,0,0,0.1)');
  shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 8, radius * 1.1, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // MAIN SPHERE with photorealistic gradient
  // ═══════════════════════════════════════════════════════════════════

  // Base gradient (ambient light)
  const baseGradient = ctx.createRadialGradient(
    cx - radius * 0.4, cy - radius * 0.4, 0,
    cx, cy, radius
  );
  baseGradient.addColorStop(0, '#ffffff');
  baseGradient.addColorStop(0.2, '#f8fafc');
  baseGradient.addColorStop(0.5, '#e2e8f0');
  baseGradient.addColorStop(0.8, '#94a3b8');
  baseGradient.addColorStop(1, '#64748b');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight (glossy reflection)
  const specularGradient = ctx.createRadialGradient(
    cx - radius * 0.35, cy - radius * 0.35, 0,
    cx - radius * 0.35, cy - radius * 0.35, radius * 0.4
  );
  specularGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  specularGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  specularGradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = specularGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Thick outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // EQUATOR LINE (horizontal great circle)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // MERIDIAN LINE (vertical great circle - partial)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.35, radius, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // SECTION CUT HATCHING (on visible hemisphere)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, Math.PI * 0.75, Math.PI * 1.25);
  ctx.arc(cx, cy, radius * 0.3, Math.PI * 1.25, Math.PI * 0.75, true);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.5;
  const spacing = 5;
  for (let i = -radius * 2; i < radius * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - radius, cy + radius);
    ctx.lineTo(cx + i + radius, cy - radius);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - radius - 50, cy);
  ctx.lineTo(cx + radius + 50, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 50);
  ctx.lineTo(cx, cy + radius + 50);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + radius + 55;
  ctx.fillText('SPHERE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 40, labelY + 5);
  ctx.lineTo(cx + 40, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D HEXAGON BAR
 * Features:
 * - Tilted 3D hexagonal bar at 45 degrees
 * - Gradient shading on visible faces
 * - ISO hatching on front hexagonal face
 * - Clear edge definition with proper line weights
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawHexagonCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get dimensions
  const acrossFlats = dimensions.acrossFlats || dimensions.width || 60;
  const hexLength = dimensions.length || dimensions.height || 180;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(acrossFlats * 1.5, hexLength * 0.7);

  const radius = (acrossFlats / 2) * scale * 1.15; // Circumradius from across-flats
  const length = hexLength * scale * 0.55;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 10;

  // Back hexagon position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // Helper function to get hexagon vertices
  const getHexVertex = (centerX: number, centerY: number, r: number, index: number) => {
    const a = (Math.PI / 3) * index - Math.PI / 2; // Start from top
    return { x: centerX + r * Math.cos(a), y: centerY + r * Math.sin(a) };
  };

  // ═══════════════════════════════════════════════════════════════════
  // BACK HEXAGON (far end) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const v = getHexVertex(backX, backY, radius * 0.55, i);
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE FACES with gradient (3 visible faces)
  // ═══════════════════════════════════════════════════════════════════

  // Draw top-right face (lightest)
  const topGradient = ctx.createLinearGradient(cx, cy - radius, backX, backY - radius * 0.55);
  topGradient.addColorStop(0, '#f8fafc');
  topGradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = topGradient;
  ctx.beginPath();
  const fv0 = getHexVertex(cx, cy, radius, 0);
  const fv1 = getHexVertex(cx, cy, radius, 1);
  const bv0 = getHexVertex(backX, backY, radius * 0.55, 0);
  const bv1 = getHexVertex(backX, backY, radius * 0.55, 1);
  ctx.moveTo(fv0.x, fv0.y);
  ctx.lineTo(fv1.x, fv1.y);
  ctx.lineTo(bv1.x, bv1.y);
  ctx.lineTo(bv0.x, bv0.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw top-left face (medium light)
  const topLeftGradient = ctx.createLinearGradient(cx, cy - radius, backX, backY);
  topLeftGradient.addColorStop(0, '#e2e8f0');
  topLeftGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = topLeftGradient;
  ctx.beginPath();
  const fv5 = getHexVertex(cx, cy, radius, 5);
  const bv5 = getHexVertex(backX, backY, radius * 0.55, 5);
  ctx.moveTo(fv5.x, fv5.y);
  ctx.lineTo(fv0.x, fv0.y);
  ctx.lineTo(bv0.x, bv0.y);
  ctx.lineTo(bv5.x, bv5.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw left face (darkest)
  const leftGradient = ctx.createLinearGradient(cx - radius, cy, backX - radius * 0.55, backY);
  leftGradient.addColorStop(0, '#cbd5e1');
  leftGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  const fv4 = getHexVertex(cx, cy, radius, 4);
  const bv4 = getHexVertex(backX, backY, radius * 0.55, 4);
  ctx.moveTo(fv4.x, fv4.y);
  ctx.lineTo(fv5.x, fv5.y);
  ctx.lineTo(bv5.x, bv5.y);
  ctx.lineTo(bv4.x, bv4.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT HEXAGON with gradient and hatching
  // ═══════════════════════════════════════════════════════════════════
  const frontGradient = ctx.createRadialGradient(
    cx - radius * 0.3, cy - radius * 0.3, 0,
    cx, cy, radius
  );
  frontGradient.addColorStop(0, '#f8fafc');
  frontGradient.addColorStop(0.5, '#e2e8f0');
  frontGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const v = getHexVertex(cx, cy, radius, i);
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.closePath();
  ctx.fill();

  // ISO Hatching on front face
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const v = getHexVertex(cx, cy, radius - 2, i);
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 6;
  for (let i = -radius * 2; i < radius * 2; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - radius, cy + radius);
    ctx.lineTo(cx + i + radius, cy - radius);
    ctx.stroke();
  }
  ctx.restore();

  // Front hexagon outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const v = getHexVertex(cx, cy, radius, i);
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - radius - 40, cy);
  ctx.lineTo(cx + radius + 40, cy);
  ctx.stroke();

  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 40);
  ctx.lineTo(cx, cy + radius + 40);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + radius + 55;
  ctx.fillText('HEX BAR', cx, labelY);

  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 45, labelY + 5);
  ctx.lineTo(cx + 45, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D CONE
 * Features:
 * - Isometric 3D cone with elliptical base
 * - Gradient shading from apex to base
 * - ISO hatching on base face
 * - Clear apex and base indication
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawConeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const bottomDiam = dimensions.bottomDiameter || dimensions.diameter || 100;
  const coneHeight = dimensions.height || dimensions.length || 150;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(bottomDiam, coneHeight);

  const bd = bottomDiam * scale;
  const h = coneHeight * scale;

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Ellipse ratio for 3D base
  const ellipseRatio = 0.35;

  // ═══════════════════════════════════════════════════════════════════
  // CONE BODY with gradient shading
  // ═══════════════════════════════════════════════════════════════════

  // Left side gradient (darker)
  const leftGradient = ctx.createLinearGradient(cx - bd/2, cy + h/2, cx, cy - h/2);
  leftGradient.addColorStop(0, '#94a3b8');
  leftGradient.addColorStop(0.5, '#cbd5e1');
  leftGradient.addColorStop(1, '#e2e8f0');

  // Draw left half of cone
  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.moveTo(cx - bd/2, cy + h/2);
  ctx.lineTo(cx, cy - h/2); // apex
  ctx.lineTo(cx, cy + h/2);
  ctx.ellipse(cx, cy + h/2, bd/2, bd/2 * ellipseRatio, 0, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Right side gradient (lighter)
  const rightGradient = ctx.createLinearGradient(cx, cy - h/2, cx + bd/2, cy + h/2);
  rightGradient.addColorStop(0, '#f8fafc');
  rightGradient.addColorStop(0.5, '#e2e8f0');
  rightGradient.addColorStop(1, '#cbd5e1');

  // Draw right half of cone
  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h/2); // apex
  ctx.lineTo(cx + bd/2, cy + h/2);
  ctx.ellipse(cx, cy + h/2, bd/2, bd/2 * ellipseRatio, 0, 0, Math.PI);
  ctx.lineTo(cx, cy + h/2);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // BASE ELLIPSE with hatching
  // ═══════════════════════════════════════════════════════════════════

  // Base ellipse fill with gradient
  const baseGradient = ctx.createLinearGradient(cx - bd/2, cy + h/2, cx + bd/2, cy + h/2);
  baseGradient.addColorStop(0, '#cbd5e1');
  baseGradient.addColorStop(0.5, '#e2e8f0');
  baseGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h/2, bd/2, bd/2 * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.fill();

  // ISO Hatching on base ellipse
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + h/2, bd/2 - 2, (bd/2 - 2) * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const spacing = 5;
  for (let i = -bd; i < bd; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - bd/2, cy + h/2 + bd/2 * ellipseRatio);
    ctx.lineTo(cx + i + bd/2, cy + h/2 - bd/2 * ellipseRatio);
    ctx.stroke();
  }
  ctx.restore();

  // Base ellipse outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h/2, bd/2, bd/2 * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CONE EDGES - thick outline
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;

  // Left edge
  ctx.beginPath();
  ctx.moveTo(cx - bd/2, cy + h/2);
  ctx.lineTo(cx, cy - h/2);
  ctx.stroke();

  // Right edge
  ctx.beginPath();
  ctx.moveTo(cx + bd/2, cy + h/2);
  ctx.lineTo(cx, cy - h/2);
  ctx.stroke();

  // Apex highlight (small filled circle)
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(cx, cy - h/2, 3, 0, Math.PI * 2);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Vertical centerline (through apex)
  ctx.beginPath();
  ctx.moveTo(cx, cy - h/2 - 50);
  ctx.lineTo(cx, cy + h/2 + bd/2 * ellipseRatio + 30);
  ctx.stroke();

  // Horizontal centerline (through base)
  ctx.beginPath();
  ctx.moveTo(cx - bd/2 - 40, cy + h/2);
  ctx.lineTo(cx + bd/2 + 40, cy + h/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + h/2 + bd/2 * ellipseRatio + 55;
  ctx.fillText('CONE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 32, labelY + 5);
  ctx.lineTo(cx + 32, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE RECTANGULAR TUBE PROFILE
 * Hollow rectangular cross-section with scan arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D RECTANGULAR TUBE
 * Like Rafael 5036 - tilted at 45° with hollow rectangular cross-section at front
 */
/**
 * Draw PROFESSIONAL CAD-GRADE 3D RECTANGULAR TUBE (Hollow Section)
 * Features:
 * - Dramatic 3D isometric view with cutaway showing wall thickness
 * - Inner void clearly visible with contrasting fill
 * - Metallic gradient shading for professional 3D appearance
 * - ISO 45-degree hatching on cut section (6px spacing)
 * - Chain-dash centerlines per ISO 128 [15, 3, 3, 3]
 * - Uses 70% of available canvas space
 * - Line weights: thick (2.5px) outlines, thin (0.6px) hatching
 */
function drawRectangularTubeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get REAL dimensions
  const outerWidth = dimensions.width || 120;
  const outerHeight = dimensions.height || dimensions.thickness || 80;
  const wallThickness = dimensions.wallThickness || 10;
  const tubeLength = dimensions.length || 180;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(outerWidth, outerHeight, tubeLength * 0.6);

  const ow = outerWidth * scale;
  const oh = outerHeight * scale;
  const wt = Math.max(wallThickness * scale, 6);
  const iw = ow - 2 * wt;
  const ih = oh - 2 * wt;
  const length = tubeLength * scale * 0.45;

  // Center position
  const cx = centerX;
  const cy = centerY + 10;

  // Isometric 45-degree angle
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK FACE (far end) - dashed hidden lines
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back outer rectangle
  ctx.beginPath();
  ctx.rect(backX - ow/2, backY - oh/2, ow, oh);
  ctx.stroke();

  // Back inner rectangle
  ctx.beginPath();
  ctx.rect(backX - iw/2, backY - ih/2, iw, ih);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP AND SIDE SURFACES with metallic gradient
  // ═══════════════════════════════════════════════════════════════════

  // Top surface gradient
  const topGradient = ctx.createLinearGradient(
    backX - ow/2, backY - oh/2,
    cx + ow/2, cy - oh/2
  );
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.3, '#f1f5f9');
  topGradient.addColorStop(0.7, '#e2e8f0');
  topGradient.addColorStop(1, '#cbd5e1');

  // Draw top surface (outer)
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx - ow/2, cy - oh/2);
  ctx.lineTo(backX - ow/2, backY - oh/2);
  ctx.lineTo(backX + ow/2, backY - oh/2);
  ctx.lineTo(cx + ow/2, cy - oh/2);
  ctx.closePath();
  ctx.fill();

  // Top surface outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Right side surface gradient
  const sideGradient = ctx.createLinearGradient(cx + ow/2, cy - oh/2, cx + ow/2, cy + oh/2);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(0.5, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Draw right side surface
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + ow/2, cy - oh/2);
  ctx.lineTo(backX + ow/2, backY - oh/2);
  ctx.lineTo(backX + ow/2, backY + oh/2);
  ctx.lineTo(cx + ow/2, cy + oh/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT FACE with wall cross-section
  // ═══════════════════════════════════════════════════════════════════

  // Front face gradient (wall material)
  const frontGradient = ctx.createLinearGradient(cx - ow/2, cy - oh/2, cx + ow/2, cy + oh/2);
  frontGradient.addColorStop(0, '#f1f5f9');
  frontGradient.addColorStop(0.3, '#e2e8f0');
  frontGradient.addColorStop(0.7, '#cbd5e1');
  frontGradient.addColorStop(1, '#94a3b8');

  // Draw outer rectangle fill
  ctx.fillStyle = frontGradient;
  ctx.beginPath();
  ctx.rect(cx - ow/2, cy - oh/2, ow, oh);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on wall section (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();

  // Create clipping path for wall area (outer minus inner)
  ctx.beginPath();
  ctx.rect(cx - ow/2, cy - oh/2, ow, oh);
  ctx.rect(cx - iw/2, cy - ih/2, iw, ih);
  ctx.clip('evenodd');

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(ow, oh) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // INNER VOID (hollow center)
  // ═══════════════════════════════════════════════════════════════════
  const voidGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(iw, ih)/2);
  voidGradient.addColorStop(0, '#ffffff');
  voidGradient.addColorStop(1, '#f1f5f9');

  ctx.fillStyle = voidGradient;
  ctx.beginPath();
  ctx.rect(cx - iw/2, cy - ih/2, iw, ih);
  ctx.fill();

  // Inner rectangle outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cx - iw/2, cy - ih/2, iw, ih);

  // Outer rectangle outline - thick
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - ow/2, cy - oh/2, ow, oh);

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - ow/2 - 50, cy);
  ctx.lineTo(cx + ow/2 + 50, cy);
  ctx.stroke();

  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - oh/2 - 50);
  ctx.lineTo(cx, cy + oh/2 + 50);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + oh/2 + 55;
  ctx.fillText('RECTANGULAR TUBE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 85, labelY + 5);
  ctx.lineTo(cx + 85, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D Z-SECTION PROFILE
 * Features:
 * - Z-shape cross-section view
 * - 3D isometric view with depth
 * - Hatching on material areas
 * - Diagonal web clearly visible
 * - Gradient fills for metallic look
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawZSectionCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const flangeWidth = dimensions.width || 80;
  const totalHeight = dimensions.height || 120;
  const thickness = dimensions.thickness || 12;
  const profileLength = dimensions.length || 120;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(flangeWidth * 2, totalHeight, profileLength * 0.6);

  const fw = flangeWidth * scale;
  const th = totalHeight * scale;
  const t = Math.max(thickness * scale, 8);
  const length = profileLength * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position
  const cx = centerX;
  const cy = centerY + 10;

  // Back face position
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK Z-PROFILE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back Z-shape
  ctx.beginPath();
  // Top flange (right side)
  ctx.moveTo(backX, backY - th/2);
  ctx.lineTo(backX + fw, backY - th/2);
  ctx.lineTo(backX + fw, backY - th/2 + t);
  ctx.lineTo(backX + t/2, backY - th/2 + t);
  // Web (diagonal)
  ctx.lineTo(backX + t/2, backY + th/2 - t);
  // Bottom flange (left side)
  ctx.lineTo(backX, backY + th/2 - t);
  ctx.lineTo(backX - fw + t, backY + th/2 - t);
  ctx.lineTo(backX - fw + t, backY + th/2);
  ctx.lineTo(backX - fw, backY + th/2);
  ctx.lineTo(backX - fw, backY + th/2 - t);
  ctx.lineTo(backX - t/2, backY + th/2 - t);
  ctx.lineTo(backX - t/2, backY - th/2 + t);
  ctx.lineTo(backX, backY - th/2 + t);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP SURFACES with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(backX, backY - th/2, cx, cy - th/2);
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.5, '#f1f5f9');
  topGradient.addColorStop(1, '#e2e8f0');

  // Top flange surface
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy - th/2);
  ctx.lineTo(backX, backY - th/2);
  ctx.lineTo(backX + fw, backY - th/2);
  ctx.lineTo(cx + fw, cy - th/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // SIDE SURFACES with gradient
  // ═══════════════════════════════════════════════════════════════════
  const sideGradient = ctx.createLinearGradient(cx + fw, cy - th/2, cx + fw, cy + th/2);
  sideGradient.addColorStop(0, '#e2e8f0');
  sideGradient.addColorStop(0.5, '#cbd5e1');
  sideGradient.addColorStop(1, '#94a3b8');

  // Right side of top flange
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(cx + fw, cy - th/2);
  ctx.lineTo(backX + fw, backY - th/2);
  ctx.lineTo(backX + fw, backY - th/2 + t);
  ctx.lineTo(cx + fw, cy - th/2 + t);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left side of bottom flange
  const leftGradient = ctx.createLinearGradient(cx - fw, cy - th/2, cx - fw, cy + th/2);
  leftGradient.addColorStop(0, '#cbd5e1');
  leftGradient.addColorStop(0.5, '#b3bcc9');
  leftGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.moveTo(cx - fw, cy + th/2 - t);
  ctx.lineTo(backX - fw, backY + th/2 - t);
  ctx.lineTo(backX - fw, backY + th/2);
  ctx.lineTo(cx - fw, cy + th/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT Z-PROFILE FACE with gradient
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createLinearGradient(cx - fw, cy - th/2, cx + fw, cy + th/2);
  faceGradient.addColorStop(0, '#f8fafc');
  faceGradient.addColorStop(0.3, '#f1f5f9');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  // Top flange
  ctx.moveTo(cx, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2 + t);
  ctx.lineTo(cx + t/2, cy - th/2 + t);
  // Web
  ctx.lineTo(cx + t/2, cy + th/2 - t);
  // Bottom flange
  ctx.lineTo(cx, cy + th/2 - t);
  ctx.lineTo(cx, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2 - t);
  ctx.lineTo(cx - t/2, cy + th/2 - t);
  // Web back
  ctx.lineTo(cx - t/2, cy - th/2 + t);
  ctx.lineTo(cx, cy - th/2 + t);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front Z-profile (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  // Recreate Z-shape for clipping
  ctx.moveTo(cx, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2 + t);
  ctx.lineTo(cx + t/2, cy - th/2 + t);
  ctx.lineTo(cx + t/2, cy + th/2 - t);
  ctx.lineTo(cx, cy + th/2 - t);
  ctx.lineTo(cx, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2 - t);
  ctx.lineTo(cx - t/2, cy + th/2 - t);
  ctx.lineTo(cx - t/2, cy - th/2 + t);
  ctx.lineTo(cx, cy - th/2 + t);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(fw * 2, th) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front Z-profile outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2);
  ctx.lineTo(cx + fw, cy - th/2 + t);
  ctx.lineTo(cx + t/2, cy - th/2 + t);
  ctx.lineTo(cx + t/2, cy + th/2 - t);
  ctx.lineTo(cx, cy + th/2 - t);
  ctx.lineTo(cx, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2);
  ctx.lineTo(cx - fw, cy + th/2 - t);
  ctx.lineTo(cx - t/2, cy + th/2 - t);
  ctx.lineTo(cx - t/2, cy - th/2 + t);
  ctx.lineTo(cx, cy - th/2 + t);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Vertical centerline through web
  ctx.beginPath();
  ctx.moveTo(cx, cy - th/2 - 50);
  ctx.lineTo(cx, cy + th/2 + 50);
  ctx.stroke();

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - fw - 30, cy);
  ctx.lineTo(cx + fw + 30, cy);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + th/2 + 55;
  ctx.fillText('Z-SECTION', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 50, labelY + 5);
  ctx.lineTo(cx + 50, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D PYRAMID
 * Isometric pyramid with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw PROFESSIONAL CAD-GRADE 3D PYRAMID
 * Features:
 * - Dramatic 4-sided pyramid in isometric view
 * - Gradient shading on visible faces (2-3 faces)
 * - Base with hatching
 * - Apex clearly marked
 * - Professional line weights (2.5px)
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawPyramidCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const baseWidth = dimensions.width || dimensions.diameter || 100;
  const pyramidHeight = dimensions.height || dimensions.length || 150;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(baseWidth, pyramidHeight);

  const bw = baseWidth * scale;
  const h = pyramidHeight * scale;
  const baseDepth = bw * 0.5; // Isometric depth for 3D effect

  // Isometric angles
  const isoAngle = Math.PI / 6; // 30 degrees
  const isoX = baseDepth * Math.cos(isoAngle);
  const isoY = baseDepth * Math.sin(isoAngle);

  // Position (centered)
  const cx = centerX;
  const cy = centerY;

  // Key points
  const apex = { x: cx, y: cy - h/2 };
  const frontLeft = { x: cx - bw/2, y: cy + h/2 };
  const frontRight = { x: cx + bw/2, y: cy + h/2 };
  const backLeft = { x: cx - bw/2 + isoX, y: cy + h/2 - isoY };
  const backRight = { x: cx + bw/2 + isoX, y: cy + h/2 - isoY };

  // ═══════════════════════════════════════════════════════════════════
  // BACK FACE (hidden lines - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Back left edge to apex
  ctx.beginPath();
  ctx.moveTo(backLeft.x, backLeft.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.stroke();

  // Back base edge
  ctx.beginPath();
  ctx.moveTo(backLeft.x, backLeft.y);
  ctx.lineTo(backRight.x, backRight.y);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RIGHT FACE (darkest - shadow side) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const rightGradient = ctx.createLinearGradient(frontRight.x, frontRight.y, apex.x, apex.y);
  rightGradient.addColorStop(0, '#94a3b8');
  rightGradient.addColorStop(0.5, '#b3bcc9');
  rightGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.lineTo(backRight.x, backRight.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // LEFT FACE (main visible face) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const leftGradient = ctx.createLinearGradient(frontLeft.x, frontLeft.y, apex.x, apex.y);
  leftGradient.addColorStop(0, '#e2e8f0');
  leftGradient.addColorStop(0.4, '#f1f5f9');
  leftGradient.addColorStop(1, '#f8fafc');

  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(frontLeft.x, frontLeft.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front face (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(frontLeft.x, frontLeft.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(bw, h) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + h);
    ctx.lineTo(cx + i + hatchExtent/2, cy - h);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // BASE LINE (front edge - emphasized)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(frontLeft.x, frontLeft.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // APEX MARKER (small circle at apex)
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(apex.x, apex.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Vertical centerline (through apex)
  ctx.beginPath();
  ctx.moveTo(cx, apex.y - 40);
  ctx.lineTo(cx, frontLeft.y + 30);
  ctx.stroke();

  // Horizontal centerline (through base center)
  ctx.beginPath();
  ctx.moveTo(frontLeft.x - 40, frontLeft.y);
  ctx.lineTo(frontRight.x + 40, frontLeft.y);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = frontLeft.y + 55;
  ctx.fillText('PYRAMID', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 45, labelY + 5);
  ctx.lineTo(cx + 45, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE 3D ELLIPSE/OVAL CYLINDER
 * Features:
 * - Elliptical cross-section (not circular)
 * - 3D depth showing the elliptical shape
 * - Hatching on front ellipse face
 * - Gradients for metallic look
 * - Professional line weights (2.5px)
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawEllipseCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get real dimensions
  const majorAxis = dimensions.width || dimensions.diameter || 120;
  const minorAxis = dimensions.height || dimensions.thickness || 70;
  const depth = dimensions.length || majorAxis * 0.6;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(majorAxis, minorAxis, depth * 0.7);

  const ma = majorAxis * scale;
  const mi = minorAxis * scale;
  const extrusionLength = depth * scale * 0.4;

  // Isometric angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Position (front face center)
  const cx = centerX;
  const cy = centerY + 10;

  // Back ellipse center
  const backX = cx - extrusionLength * cos45;
  const backY = cy - extrusionLength * sin45;

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (hidden - dashed)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // TOP SURFACE (curved connecting surface) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const topGradient = ctx.createLinearGradient(
    backX - ma/2, backY,
    cx + ma/2, cy
  );
  topGradient.addColorStop(0, '#cbd5e1');
  topGradient.addColorStop(0.3, '#f1f5f9');
  topGradient.addColorStop(0.7, '#e2e8f0');
  topGradient.addColorStop(1, '#cbd5e1');

  // Draw top curved surface (upper half of ellipse connection)
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, Math.PI, 0);
  ctx.lineTo(backX + ma/2, backY);
  ctx.ellipse(backX, backY, ma/2, mi/2, 0, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // BOTTOM SURFACE (darker) with gradient
  // ═══════════════════════════════════════════════════════════════════
  const bottomGradient = ctx.createLinearGradient(cx, cy, cx, cy + mi/2);
  bottomGradient.addColorStop(0, '#cbd5e1');
  bottomGradient.addColorStop(1, '#94a3b8');

  ctx.fillStyle = bottomGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, 0, Math.PI);
  ctx.lineTo(backX - ma/2, backY);
  ctx.ellipse(backX, backY, ma/2, mi/2, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSE FACE with radial gradient (3D metallic look)
  // ═══════════════════════════════════════════════════════════════════
  const faceGradient = ctx.createRadialGradient(
    cx - ma * 0.15, cy - mi * 0.15, 0,
    cx, cy, Math.max(ma, mi) / 2
  );
  faceGradient.addColorStop(0, '#ffffff');
  faceGradient.addColorStop(0.3, '#f8fafc');
  faceGradient.addColorStop(0.7, '#e2e8f0');
  faceGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ═══════════════════════════════════════════════════════════════════
  // ISO HATCHING on front ellipse face (45 degree, 6px spacing)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.6;
  const hatchSpacing = 6;
  const hatchExtent = Math.max(ma, mi) * 1.5;

  for (let i = -hatchExtent; i < hatchExtent; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(cx + i - hatchExtent/2, cy + hatchExtent/2);
    ctx.lineTo(cx + i + hatchExtent/2, cy - hatchExtent/2);
    ctx.stroke();
  }
  ctx.restore();

  // Front ellipse outline - thick
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline (major axis)
  ctx.beginPath();
  ctx.moveTo(cx - ma/2 - 50, cy);
  ctx.lineTo(cx + ma/2 + 50, cy);
  ctx.stroke();

  // Vertical centerline (minor axis)
  ctx.beginPath();
  ctx.moveTo(cx, cy - mi/2 - 50);
  ctx.lineTo(cx, cy + mi/2 + 50);
  ctx.stroke();

  // Axial centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = cy + mi/2 + 55;
  ctx.fillText('ELLIPSE', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 40, labelY + 5);
  ctx.lineTo(cx + 40, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw PROFESSIONAL CAD-GRADE CUSTOM SHAPE PLACEHOLDER
 * Features:
 * - Clean rounded rectangle container
 * - Professional gear icon in center (engineering symbol)
 * - Gradient fills for modern look
 * - "CUSTOM" label with professional styling
 * - Chain-dash centerlines per ISO 128
 * - Uses 70% of available canvas space
 */
function drawCustomCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.save();

  // Get dimensions
  const width = dimensions.width || 140;
  const height = dimensions.height || 100;

  // Scale to fill canvas (70% of available space)
  const maxSize = Math.min(bounds.width, bounds.height) * 0.7;
  const scale = maxSize / Math.max(width, height);

  const w = width * scale;
  const h = height * scale;
  const r = Math.min(w, h) * 0.12; // Corner radius

  // Position
  const cx = centerX;
  const cy = centerY;
  const x = cx - w/2;
  const y = cy - h/2;

  // ═══════════════════════════════════════════════════════════════════
  // MAIN CONTAINER with gradient (rounded rectangle)
  // ═══════════════════════════════════════════════════════════════════
  const containerGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  containerGradient.addColorStop(0, '#f8fafc');
  containerGradient.addColorStop(0.3, '#f1f5f9');
  containerGradient.addColorStop(0.7, '#e2e8f0');
  containerGradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = containerGradient;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Container outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // GEAR ICON (engineering symbol for custom/configurable)
  // ═══════════════════════════════════════════════════════════════════
  const gearSize = Math.min(w, h) * 0.35;
  const gearX = cx;
  const gearY = cy;
  const outerR = gearSize / 2;
  const innerR = outerR * 0.6;
  const holeR = outerR * 0.25;
  const teethCount = 8;
  const toothDepth = outerR * 0.25;

  // Gear gradient
  const gearGradient = ctx.createRadialGradient(gearX - 5, gearY - 5, 0, gearX, gearY, outerR);
  gearGradient.addColorStop(0, '#94a3b8');
  gearGradient.addColorStop(0.5, '#64748b');
  gearGradient.addColorStop(1, '#475569');

  ctx.fillStyle = gearGradient;
  ctx.beginPath();

  // Draw gear teeth
  for (let i = 0; i < teethCount; i++) {
    const angle1 = (i / teethCount) * Math.PI * 2;
    const angle2 = ((i + 0.35) / teethCount) * Math.PI * 2;
    const angle3 = ((i + 0.65) / teethCount) * Math.PI * 2;
    const angle4 = ((i + 1) / teethCount) * Math.PI * 2;

    if (i === 0) {
      ctx.moveTo(gearX + (outerR + toothDepth) * Math.cos(angle1), gearY + (outerR + toothDepth) * Math.sin(angle1));
    }
    ctx.lineTo(gearX + (outerR + toothDepth) * Math.cos(angle2), gearY + (outerR + toothDepth) * Math.sin(angle2));
    ctx.lineTo(gearX + outerR * Math.cos(angle2), gearY + outerR * Math.sin(angle2));
    ctx.lineTo(gearX + outerR * Math.cos(angle3), gearY + outerR * Math.sin(angle3));
    ctx.lineTo(gearX + (outerR + toothDepth) * Math.cos(angle3), gearY + (outerR + toothDepth) * Math.sin(angle3));
    ctx.lineTo(gearX + (outerR + toothDepth) * Math.cos(angle4), gearY + (outerR + toothDepth) * Math.sin(angle4));
  }
  ctx.closePath();
  ctx.fill();

  // Gear outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner circle
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(gearX, gearY, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center hole
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(gearX, gearY, holeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // HATCHING around gear (light diagonal lines for texture)
  // ═══════════════════════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  // Cut out gear area
  ctx.arc(gearX, gearY, outerR + toothDepth + 10, 0, Math.PI * 2, true);
  ctx.clip('evenodd');

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.5;
  const hatchSpacing = 8;
  for (let i = -h; i < w + h; i += hatchSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (chain-dash per ISO 128)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([15, 3, 3, 3]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(x - 50, cy);
  ctx.lineTo(x + w + 50, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, y - 50);
  ctx.lineTo(cx, y + h + 50);
  ctx.stroke();

  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // LABEL with professional styling
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const labelY = y + h + 55;
  ctx.fillText('CUSTOM', cx, labelY);

  // Underline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 45, labelY + 5);
  ctx.lineTo(cx + 45, labelY + 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw diagonal hatching pattern (professional CAD style)
 */
function drawDiagonalHatching(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
  spacing: number
) {
  ctx.save();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;

  const diagonal = Math.sqrt(width * width + height * height);
  const numLines = Math.ceil(diagonal / spacing);

  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  for (let i = -numLines; i < numLines; i++) {
    const offset = i * spacing;
    ctx.beginPath();
    ctx.moveTo(x - diagonal + offset, y - diagonal);
    ctx.lineTo(x + diagonal + offset, y + diagonal);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw annular hatching for tube sections
 */
function drawAnnularHatching(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  side: 'left' | 'right'
) {
  ctx.save();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;

  // Create clipping region for the annular section
  ctx.beginPath();
  if (side === 'left') {
    ctx.rect(centerX - outerRadius, centerY - outerRadius, outerRadius, outerRadius * 2);
  } else {
    ctx.rect(centerX, centerY - outerRadius, outerRadius, outerRadius * 2);
  }
  ctx.clip();

  // Draw hatching lines
  const spacing = 8;
  const numLines = Math.ceil(outerRadius * 2 / spacing);

  for (let i = -numLines; i < numLines; i++) {
    const offset = i * spacing;
    ctx.beginPath();
    ctx.moveTo(centerX - outerRadius * 2, centerY - outerRadius * 2 + offset);
    ctx.lineTo(centerX + outerRadius * 2, centerY + outerRadius * 2 + offset);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Get fixed angle for each scan direction letter
 * This ensures each direction (A, B, C, D...) always appears in the same position
 */
function getFixedAngleForDirection(direction: string): number {
  // Fixed angles based on professional UT scan direction standards
  // A-L represent standard scanning positions
  const directionAngles: Record<string, number> = {
    'A': 270,    // Top → scanning DOWN (from top face)
    'B': 90,     // Bottom → scanning UP (from bottom face)
    'C': 180,    // Left/OD → scanning toward center (radial from OD)
    'D': 45,     // SW 45° Clockwise
    'E': 315,    // SW 45° Counter-Clockwise
    'F': 0,      // Circumferential (around part)
    'G': 225,    // Axial SW from OD
    'H': 0,      // From ID → scanning outward
    'I': 270,    // Through-Transmission (top to bottom)
    'J': 60,     // SW 60°
    'K': 70,     // SW 70°
    'L': 135,    // Radial Position 2
  };

  return directionAngles[direction.toUpperCase()] ?? 0;
}

/**
 * Draw animated scanning arrows - PHYSICS-BASED SMART ARROWS
 * Each arrow shows the ACTUAL ultrasonic beam path based on wave mode
 */
function drawAnimatedScanArrows(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  scanDetails: ScanDetail[],
  bounds: DrawBounds,
  highlightedDirection: string | undefined,
  frame: number,
  dimensions?: DrawDimensions
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const totalScans = scanDetails.length;

  scanDetails.forEach((detail, index) => {
    const isHighlighted = detail.scanningDirection === highlightedDirection;

    // Parse wave mode to determine beam characteristics
    const beamConfig = parseWaveMode(detail.waveMode, partType);

    // Calculate animation progress (0 to 1)
    const animProgress = ((frame + index * 30) % 120) / 120;

    // Get fixed angle for this scan direction
    const fixedAngle = getFixedAngleForDirection(detail.scanningDirection);

    // Draw smart beam visualization
    drawSmartBeamVisualization(
      ctx,
      partType,
      bounds,
      beamConfig,
      detail.scanningDirection,
      isHighlighted,
      animProgress,
      fixedAngle,
      totalScans,
      dimensions
    );
  });
}

/**
 * Parse wave mode string and return beam configuration
 * Updated to support comprehensive UT scan directions (A-L) based on AMS 2630, AMS-STD-2154
 */
function parseWaveMode(waveMode: string, partType: PartGeometry): BeamConfig {
  const mode = waveMode.toLowerCase();

  // LW 0° (Axial from Top) - Direction A: Green arrow pointing DOWN
  if (mode.includes('lw') && mode.includes('axial') && mode.includes('top')) {
    return {
      type: 'longitudinal-axial-top',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 15,
      scanPattern: 'axial',
      color: '#22c55e' // Green
    };
  }

  // LW 0° (Axial from Bottom) - Direction B: Blue arrow pointing UP
  if (mode.includes('lw') && mode.includes('axial') && mode.includes('bottom')) {
    return {
      type: 'longitudinal-axial-bottom',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 15,
      scanPattern: 'axial',
      color: '#3b82f6' // Blue
    };
  }

  // LW 0° (Radial from OD) - Direction C: Amber arrow pointing toward center
  if (mode.includes('lw') && mode.includes('radial') && (mode.includes('od') || mode.includes('pos'))) {
    return {
      type: 'longitudinal-radial',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 12,
      scanPattern: 'perpendicular',
      color: mode.includes('pos. 2') ? '#a855f7' : '#f59e0b' // Violet for Pos 2, Amber for OD
    };
  }

  // LW 0° (from ID) - Direction H: Cyan arrow from inner diameter
  if (mode.includes('lw') && mode.includes('id')) {
    return {
      type: 'longitudinal-id',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 12,
      scanPattern: 'perpendicular',
      color: '#06b6d4' // Cyan
    };
  }

  // Through-Transmission (TT) - Direction I: Lime green, two-probe technique
  if (mode.includes('through') || mode.includes('tt')) {
    return {
      type: 'through-transmission',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 8,
      scanPattern: 'axial',
      color: '#84cc16' // Lime
    };
  }

  // SW 45° (Clockwise) - Direction D: Red
  if (mode.includes('sw') && mode.includes('45') && mode.includes('clockwise') && !mode.includes('counter')) {
    return {
      type: 'shear-45-cw',
      angle: 45,
      penetrationDepth: 0.85,
      beamSpread: 20,
      scanPattern: 'clockwise',
      color: '#ef4444' // Red
    };
  }

  // SW 45° (Counter-Clockwise) - Direction E: Pink
  if (mode.includes('sw') && mode.includes('45') && mode.includes('counter')) {
    return {
      type: 'shear-45-ccw',
      angle: 45,
      penetrationDepth: 0.85,
      beamSpread: 20,
      scanPattern: 'counter-clockwise',
      color: '#ec4899' // Pink
    };
  }

  // SW Circumferential - Direction F: Purple
  if (mode.includes('sw') && mode.includes('circumferential')) {
    return {
      type: 'circumferential',
      angle: 45,
      penetrationDepth: 0.3,
      beamSpread: 10,
      scanPattern: 'circumferential',
      color: '#8b5cf6' // Purple
    };
  }

  // SW Axial 45° (from OD) - Direction G: Teal
  if (mode.includes('sw') && mode.includes('axial') && mode.includes('od')) {
    return {
      type: 'shear-axial-od',
      angle: 45,
      penetrationDepth: 0.85,
      beamSpread: 18,
      scanPattern: 'axial',
      color: '#14b8a6' // Teal
    };
  }

  // SW 60° - Direction J: Orange
  if (mode.includes('sw') && mode.includes('60')) {
    return {
      type: 'shear-60',
      angle: 60,
      penetrationDepth: 0.75,
      beamSpread: 25,
      scanPattern: 'linear',
      color: '#f97316' // Orange
    };
  }

  // SW 70° - Direction K: Yellow
  if (mode.includes('sw') && mode.includes('70')) {
    return {
      type: 'shear-70',
      angle: 70,
      penetrationDepth: 0.65,
      beamSpread: 30,
      scanPattern: 'linear',
      color: '#eab308' // Yellow
    };
  }

  // Legacy support: Generic longitudinal axial
  if (mode.includes('longitudinal') && mode.includes('axial')) {
    return {
      type: 'longitudinal-axial',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 15,
      scanPattern: 'axial',
      color: '#3b82f6'
    };
  }

  // Legacy support: Generic longitudinal
  if (mode.includes('longitudinal')) {
    return {
      type: 'longitudinal',
      angle: 0,
      penetrationDepth: 1.0,
      beamSpread: 12,
      scanPattern: 'perpendicular',
      color: '#10b981'
    };
  }

  // Legacy support: Generic shear 45
  if (mode.includes('shear') && mode.includes('45')) {
    const isClockwise = mode.includes('clockwise');
    const isCounter = mode.includes('counter');
    return {
      type: 'shear-45',
      angle: 45,
      penetrationDepth: 0.85,
      beamSpread: 20,
      scanPattern: isClockwise ? 'clockwise' : (isCounter ? 'counter-clockwise' : 'linear'),
      color: '#f59e0b'
    };
  }

  // Legacy support: circumferential
  if (mode.includes('circumferential')) {
    return {
      type: 'circumferential',
      angle: 0,
      penetrationDepth: 0.3,
      beamSpread: 10,
      scanPattern: 'circumferential',
      color: '#8b5cf6'
    };
  }

  // Legacy support: Generic axial
  if (mode.includes('axial')) {
    return {
      type: 'axial',
      angle: 0,
      penetrationDepth: 0.9,
      beamSpread: 15,
      scanPattern: 'axial',
      color: '#06b6d4'
    };
  }

  // Default
  return {
    type: 'longitudinal',
    angle: 0,
    penetrationDepth: 1.0,
    beamSpread: 12,
    scanPattern: 'perpendicular',
    color: '#64748b'
  };
}

interface BeamConfig {
  type: string;
  angle: number;
  penetrationDepth: number;
  beamSpread: number;
  scanPattern: 'perpendicular' | 'axial' | 'circumferential' | 'clockwise' | 'counter-clockwise' | 'linear';
  color: string;
}

// Type for bounds object used in drawing functions
interface DrawBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Type for dimensions object used in drawing functions
interface DrawDimensions {
  diameter?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  width?: number;
  height?: number;
  thickness?: number;
  length?: number;
  flangeWidth?: number;
  flangeThickness?: number;
  webThickness?: number;
  profileHeight?: number;
  leg1?: number;
  leg2?: number;
  acrossFlats?: number;
  bottomDiameter?: number;
  topDiameter?: number;
  wallThickness?: number;
}

/**
 * Draw smart beam visualization showing actual ultrasonic physics
 */
function drawSmartBeamVisualization(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  totalScans: number,
  dimensions?: DrawDimensions
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  switch (partType) {
    // RING - Isometric 3D arrows for ring shapes
    case 'ring':
    case 'ring_forging':
      drawIsometricRingBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans);
      break;

    // DISK - Isometric 3D arrows for disk shapes
    case 'disk':
    case 'disk_forging':
      drawIsometricDiskBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans);
      break;

    // TUBE/PIPE SHAPES - Radial, circumferential, or axial beams
    case 'tube':
    case 'pipe':
    case 'sleeve':
    case 'bushing':
    case 'rectangular_tube':
    case 'square_tube':
      drawTubeBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans, dimensions);
      break;

    // CYLINDER/ROUND SHAPES - Radial beams pointing toward center
    case 'cylinder':
    case 'sphere':
    case 'hexagon':
    case 'cone':
    case 'round_bar':
    case 'shaft':
    case 'hub':
    case 'hex_bar':
    case 'round_forging_stock':
    case 'ellipse':
    case 'pyramid':
      drawCylinderBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans, dimensions);
      break;

    // PLATE/FLAT SHAPES, STRUCTURAL PROFILES, FORGINGS, AND CUSTOM - Perpendicular beams from top surface
    case 'plate':
    case 'bar':
    case 'box':
    case 'sheet':
    case 'slab':
    case 'flat_bar':
    case 'rectangular_bar':
    case 'square_bar':
    case 'billet':
    case 'block':
    case 'i_profile':
    case 'extrusion_i':
    case 'u_profile':
    case 'extrusion_u':
    case 'extrusion_channel':
    case 'l_profile':
    case 'extrusion_l':
    case 'extrusion_angle':
    case 't_profile':
    case 'extrusion_t':
    case 'z_profile':
    case 'z_section':
    case 'forging':
    case 'rectangular_forging_stock':
    case 'near_net_forging':
    case 'machined_component':
    case 'custom_profile':
    case 'custom':
    case 'irregular':
      drawPlateBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans);
      break;

    default:
      // Fallback to plate beam for unknown types
      drawPlateBeam(ctx, centerX, centerY, bounds, beamConfig, label, isHighlighted, animProgress, fixedAngle, totalScans);
  }
}

/**
 * Draw beam arrows for ISOMETRIC RING - matching the 3D ring drawing
 * Shows scan directions: Top (A), Bottom (B), Radial from OD (C), ID (H)
 * Based on Rafael spec diagrams
 */
function drawIsometricRingBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  _totalScans: number
) {
  // Match the isometric ring dimensions
  const scale = Math.min(bounds.width, bounds.height) * 0.004;
  const outerDiam = 200;
  const innerDiam = outerDiam * 0.7;
  const ringHeight = 30;

  const outerRadius = (outerDiam / 2) * scale;
  const innerRadius = (innerDiam / 2) * scale;
  const height = ringHeight * scale;

  // Move center to match isometric drawing
  const isoCenterY = centerY - height / 2;

  const beamType = beamConfig.type;
  const probeOffset = 35;
  const arrowLength = 60;

  ctx.save();

  // A - Straight Beam from Top - pointing DOWN into the ring
  if (beamType === 'longitudinal-axial-top') {
    const startX = centerX;
    const startY = isoCenterY - outerRadius * 0.5 - probeOffset;
    const endY = isoCenterY + height/2;

    // Draw probe symbol (rectangle with arrow)
    drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'down');
    ctx.restore();
    return;
  }

  // B - Straight Beam from Bottom - pointing UP into the ring
  if (beamType === 'longitudinal-axial-bottom') {
    const startX = centerX + outerRadius * 0.3;
    const startY = isoCenterY + height + probeOffset;
    const endY = isoCenterY + height/2;

    drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'up');
    ctx.restore();
    return;
  }

  // C - Radial from OD (left side) - pointing RIGHT into wall
  if (beamType === 'longitudinal-radial') {
    const startX = centerX - outerRadius - probeOffset;
    const startY = isoCenterY + height/2;
    const endX = centerX - innerRadius;

    drawIsometricStraightBeamArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'right');
    ctx.restore();
    return;
  }

  // H - From ID (inner surface) - pointing outward
  if (beamType === 'longitudinal-id') {
    const startX = centerX + innerRadius;
    const startY = isoCenterY + height/2;
    const endX = centerX + outerRadius + probeOffset * 0.5;

    drawIsometricStraightBeamArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'left');
    ctx.restore();
    return;
  }

  // I - Through-Transmission
  if (beamType === 'through-transmission') {
    const xPos = centerX - outerRadius * 0.3;
    const yTop = isoCenterY - outerRadius * 0.5 - probeOffset;
    const yBottom = isoCenterY + height + probeOffset;

    // Transmitter
    drawIsometricStraightBeamArrow(ctx, xPos, yTop, xPos, isoCenterY + height/2, beamConfig.color, 'T', isHighlighted, animProgress, 'down');
    
    // Receiver indicator
    ctx.fillStyle = '#65a30d';
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos - 10, yBottom);
    ctx.lineTo(xPos + 10, yBottom);
    ctx.lineTo(xPos, yBottom - 12);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R', xPos, yBottom + 15);

    // Main label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(label, xPos + 30, isoCenterY + height/2);
    ctx.restore();
    return;
  }

  // D/E - Shear waves (angled)
  if (beamType.includes('shear')) {
    const isClockwise = beamConfig.scanPattern === 'clockwise';
    const angle = isClockwise ? -45 : 45;
    const startX = isClockwise ? centerX + outerRadius * 0.5 : centerX - outerRadius * 0.5;
    const startY = isoCenterY - outerRadius * 0.5 - probeOffset * 0.5;
    
    const rad = (angle + 90) * Math.PI / 180;
    const endX = startX + Math.cos(rad) * arrowLength;
    const endY = startY + Math.sin(rad) * arrowLength;

    drawIsometricAngledBeamArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, beamConfig.angle);
    ctx.restore();
    return;
  }

  // F - Circumferential
  if (beamConfig.scanPattern === 'circumferential' || beamType === 'circumferential') {
    const arcRadius = outerRadius + 15;
    ctx.strokeStyle = beamConfig.color;
    ctx.lineWidth = isHighlighted ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(centerX, isoCenterY + height/2, arcRadius, -0.5, 0.5);
    ctx.stroke();
    
    // Arrow head at end
    const arrowX = centerX + arcRadius * Math.cos(0.5);
    const arrowY = isoCenterY + height/2 + arcRadius * Math.sin(0.5);
    drawArrowHead(ctx, arrowX, arrowY, 0.5 + Math.PI/2, beamConfig.color, 10);
    
    // Label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX + arcRadius + 25, isoCenterY + height/2);
    ctx.restore();
    return;
  }

  ctx.restore();

  // Default fallback - draw from top
  const startX = centerX;
  const startY = isoCenterY - outerRadius * 0.5 - probeOffset;
  const endY = isoCenterY + height/2;
  drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'down');
}

/**
 * Draw beam arrows for ISOMETRIC DISK - matching the 3D disk drawing
 * Shows scan directions: Top (A), Bottom (B), Radial (C)
 * Based on Rafael spec diagrams
 */
function drawIsometricDiskBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  _totalScans: number
) {
  // Match the isometric disk dimensions
  const scale = Math.min(bounds.width, bounds.height) * 0.004;
  const diameter = 200;
  const diskHeight = 40;

  const radius = (diameter / 2) * scale;
  const height = diskHeight * scale;

  // Move center to match isometric drawing
  const isoCenterY = centerY - height / 2;

  const beamType = beamConfig.type;
  const probeOffset = 35;
  const arrowLength = 60;

  ctx.save();

  // A - Straight Beam from Top - pointing DOWN into the disk
  if (beamType === 'longitudinal-axial-top') {
    const startX = centerX;
    const startY = isoCenterY - radius * 0.5 - probeOffset;
    const endY = isoCenterY + height/2;

    drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'down');
    ctx.restore();
    return;
  }

  // B - Straight Beam from Bottom - pointing UP into the disk
  if (beamType === 'longitudinal-axial-bottom') {
    const startX = centerX + radius * 0.3;
    const startY = isoCenterY + height + probeOffset;
    const endY = isoCenterY + height/2;

    drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'up');
    ctx.restore();
    return;
  }

  // C - Radial from OD (left side) - pointing RIGHT into disk
  if (beamType === 'longitudinal-radial') {
    const startX = centerX - radius - probeOffset;
    const startY = isoCenterY + height/2;
    const endX = centerX - radius * 0.3;

    drawIsometricStraightBeamArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'right');
    ctx.restore();
    return;
  }

  // I - Through-Transmission
  if (beamType === 'through-transmission') {
    const xPos = centerX - radius * 0.3;
    const yTop = isoCenterY - radius * 0.5 - probeOffset;
    const yBottom = isoCenterY + height + probeOffset;

    // Transmitter
    drawIsometricStraightBeamArrow(ctx, xPos, yTop, xPos, isoCenterY + height/2, beamConfig.color, 'T', isHighlighted, animProgress, 'down');
    
    // Receiver indicator
    ctx.fillStyle = '#65a30d';
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos - 10, yBottom);
    ctx.lineTo(xPos + 10, yBottom);
    ctx.lineTo(xPos, yBottom - 12);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R', xPos, yBottom + 15);

    // Main label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(label, xPos + 30, isoCenterY + height/2);
    ctx.restore();
    return;
  }

  // D/E - Shear waves (angled)
  if (beamType.includes('shear')) {
    const isClockwise = beamConfig.scanPattern === 'clockwise';
    const angle = isClockwise ? -45 : 45;
    const startX = isClockwise ? centerX + radius * 0.5 : centerX - radius * 0.5;
    const startY = isoCenterY - radius * 0.5 - probeOffset * 0.5;
    
    const rad = (angle + 90) * Math.PI / 180;
    const endX = startX + Math.cos(rad) * arrowLength;
    const endY = startY + Math.sin(rad) * arrowLength;

    drawIsometricAngledBeamArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, beamConfig.angle);
    ctx.restore();
    return;
  }

  ctx.restore();

  // Default fallback - draw from top
  const startX = centerX;
  const startY = isoCenterY - radius * 0.5 - probeOffset;
  const endY = isoCenterY + height/2;
  drawIsometricStraightBeamArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'down');
}

/**
 * Draw isometric straight beam arrow with probe symbol
 * Like the arrows in Rafael spec diagrams
 */
function drawIsometricStraightBeamArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  direction: 'up' | 'down' | 'left' | 'right'
) {
  ctx.save();

  const lineWidth = isHighlighted ? 3.5 : 2.5;
  const arrowSize = isHighlighted ? 14 : 12;

  // Calculate direction
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Draw main beam line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw arrow head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Draw probe symbol at start (small rectangle)
  const probeSize = 12;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  if (direction === 'down') {
    ctx.fillRect(x1 - probeSize, y1 - probeSize/2, probeSize * 2, probeSize/2);
    ctx.strokeRect(x1 - probeSize, y1 - probeSize/2, probeSize * 2, probeSize/2);
  } else if (direction === 'up') {
    ctx.fillRect(x1 - probeSize, y1, probeSize * 2, probeSize/2);
    ctx.strokeRect(x1 - probeSize, y1, probeSize * 2, probeSize/2);
  } else if (direction === 'right') {
    ctx.fillRect(x1 - probeSize/2, y1 - probeSize, probeSize/2, probeSize * 2);
    ctx.strokeRect(x1 - probeSize/2, y1 - probeSize, probeSize/2, probeSize * 2);
  } else if (direction === 'left') {
    ctx.fillRect(x1, y1 - probeSize, probeSize/2, probeSize * 2);
    ctx.strokeRect(x1, y1 - probeSize, probeSize/2, probeSize * 2);
  }

  // Animated pulse along the beam
  const pulseX = x1 + dx * animProgress;
  const pulseY = y1 + dy * animProgress;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, isHighlighted ? 5 : 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw label
  let labelX = x1;
  let labelY = y1;
  
  if (direction === 'down') {
    labelY = y1 - 20;
  } else if (direction === 'up') {
    labelY = y1 + 25;
  } else if (direction === 'right') {
    labelX = x1 - 25;
  } else if (direction === 'left') {
    labelX = x1 + 25;
  }

  // Label background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const labelWidth = 22;
  ctx.fillRect(labelX - labelWidth/2, labelY - 10, labelWidth, 18);
  
  // Label border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(labelX - labelWidth/2, labelY - 10, labelWidth, 18);
  
  // Label text
  ctx.fillStyle = color;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, labelX, labelY);

  ctx.restore();
}

/**
 * Draw isometric angled beam arrow (for shear waves)
 */
function drawIsometricAngledBeamArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  angle: number
) {
  ctx.save();

  const lineWidth = isHighlighted ? 3 : 2.5;
  const arrowSize = 10;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineAngle = Math.atan2(dy, dx);

  // Main beam line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrow head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - arrowSize * Math.cos(lineAngle - Math.PI / 6), y2 - arrowSize * Math.sin(lineAngle - Math.PI / 6));
  ctx.lineTo(x2 - arrowSize * Math.cos(lineAngle + Math.PI / 6), y2 - arrowSize * Math.sin(lineAngle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Animated pulse
  const pulseX = x1 + dx * animProgress;
  const pulseY = y1 + dy * animProgress;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Label with angle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const labelWidth = 45;
  ctx.fillRect(x1 - labelWidth/2, y1 - 25, labelWidth, 18);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x1 - labelWidth/2, y1 - 25, labelWidth, 18);

  ctx.fillStyle = color;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label} ${angle}°`, x1, y1 - 16);

  ctx.restore();
}

/**
 * Draw beam for tube geometry - PROFESSIONAL LAYOUT
 * Arrows positioned around the tube in dedicated zones to avoid overlap
 * Based on professional UT technical drawing standards
 */
function drawTubeBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  _totalScans: number,
  dimensions?: DrawDimensions
) {
  // First draw the 3D tilted hollow cylinder (Seamless Tube)
  ctx.save();

  // Get actual dimensions or defaults
  const outerDiam = dimensions?.outerDiameter || dimensions?.diameter || 100;
  const innerDiam = dimensions?.innerDiameter || (outerDiam * 0.6);
  const tubeLength = dimensions?.length || dimensions?.height || 200;

  // Calculate scale to fit available space
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const diagonalLength = tubeLength * 0.7; // Projected length at 45°
  const totalDiagonal = Math.sqrt(diagonalLength * diagonalLength + (outerDiam * 0.5) * (outerDiam * 0.5));
  const scale = Math.min(availableSize / Math.max(totalDiagonal, outerDiam), 1.2);

  const outerRadius = (outerDiam / 2) * scale;
  const innerRadius = (innerDiam / 2) * scale;
  const length = tubeLength * scale * 0.6;

  // Tilt angle (45 degrees like Rafael image)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Adjust center position
  const cx = centerX;
  const cy = centerY + 10;

  // Draw back ellipses (far end - dashed for hidden parts)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  // Back outer ellipse
  ctx.beginPath();
  ctx.ellipse(backX, backY, outerRadius * 0.4, outerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Back inner ellipse
  ctx.beginPath();
  ctx.ellipse(backX, backY, innerRadius * 0.4, innerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw side walls
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e293b';

  // Top outer edge
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  ctx.lineTo(backX, backY - outerRadius);
  ctx.stroke();

  // Bottom outer edge
  ctx.beginPath();
  ctx.moveTo(cx, cy + outerRadius);
  ctx.lineTo(backX, backY + outerRadius);
  ctx.stroke();

  // Draw front circles with gradient shading for 3D effect
  // Fill the ring area with gradient
  const outerGradient = ctx.createRadialGradient(cx - outerRadius * 0.3, cy - outerRadius * 0.3, 0, cx, cy, outerRadius);
  outerGradient.addColorStop(0, '#f1f5f9');
  outerGradient.addColorStop(0.7, '#e2e8f0');
  outerGradient.addColorStop(1, '#cbd5e1');

  // Draw outer filled circle
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  // Clear the inner hole
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Draw the outlines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;

  // Outer circle outline
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle outline (the hole)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw centerlines (dashed)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - outerRadius - 30, cy);
  ctx.lineTo(cx + outerRadius + 30, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius - 30);
  ctx.lineTo(cx, cy + outerRadius + 30);
  ctx.stroke();

  // Diagonal centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw label
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Seamless Tube', cx, cy + outerRadius + 60);

  ctx.restore();

  // Calculate actual dimensions for beam placement
  const wallThickness = outerRadius - innerRadius;
  const beamType = beamConfig.type;

  // Professional arrow styling
  const arrowLength = outerRadius * 0.8;
  const probeOffset = 25; // Distance from tube surface to probe position

  // A - LW 0° (Axial from Top): Centered above tube, arrow pointing DOWN
  if (beamType === 'longitudinal-axial-top') {
    const startX = centerX;
    const startY = centerY - outerRadius - probeOffset;
    const endY = centerY + outerRadius * 0.3; // Penetrates through tube

    drawProfessionalArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'vertical');
    drawProbeSymbol(ctx, startX, startY - 5, beamConfig.color, 'down');
    return;
  }

  // B - LW 0° (Axial from Bottom): Centered below tube, arrow pointing UP
  if (beamType === 'longitudinal-axial-bottom') {
    const startX = centerX;
    const startY = centerY + outerRadius + probeOffset;
    const endY = centerY - outerRadius * 0.3;

    drawProfessionalArrow(ctx, startX, startY, startX, endY, beamConfig.color, label, isHighlighted, animProgress, 'vertical');
    drawProbeSymbol(ctx, startX, startY + 5, beamConfig.color, 'up');
    return;
  }

  // C - LW 0° (Radial from OD): Left side of tube, arrow pointing RIGHT into wall
  if (beamType === 'longitudinal-radial') {
    const startX = centerX - outerRadius - probeOffset;
    const startY = centerY;
    const endX = centerX - innerRadius + wallThickness * 0.3;

    drawProfessionalArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'horizontal');
    drawProbeSymbol(ctx, startX - 5, startY, beamConfig.color, 'right');
    return;
  }

  // H - LW 0° (from ID): Right side, from inner surface pointing outward
  if (beamType === 'longitudinal-id') {
    const startX = centerX + innerRadius - 5;
    const startY = centerY;
    const endX = centerX + outerRadius + 10;

    drawProfessionalArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'horizontal');

    // ID indicator circle
    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, -0.3, 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // I - Through-Transmission (TT): Top and bottom probes aligned
  if (beamType === 'through-transmission') {
    const xPos = centerX + outerRadius * 0.4;
    const yTop = centerY - outerRadius - probeOffset;
    const yBottom = centerY + outerRadius + probeOffset;

    // Transmitter arrow (top)
    drawProfessionalArrow(ctx, xPos, yTop, xPos, centerY, beamConfig.color, 'T', isHighlighted, animProgress, 'vertical');
    drawProbeSymbol(ctx, xPos, yTop - 5, beamConfig.color, 'down');

    // Receiver indicator (bottom)
    ctx.save();
    ctx.fillStyle = '#65a30d';
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos - 8, yBottom);
    ctx.lineTo(xPos + 8, yBottom);
    ctx.lineTo(xPos, yBottom - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#65a30d';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R', xPos, yBottom + 15);
    ctx.restore();

    // Label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, xPos + 25, centerY);
    return;
  }

  // D - SW 45° (Clockwise): Top-right position, angled into tube
  if (beamType === 'shear-45-cw' || (beamType.includes('shear') && beamConfig.scanPattern === 'clockwise')) {
    const angle = -45 * Math.PI / 180; // 45° from vertical
    const startX = centerX + outerRadius * 0.7;
    const startY = centerY - outerRadius - probeOffset * 0.8;
    const length = arrowLength * 0.9;
    const endX = startX + Math.sin(angle) * length;
    const endY = startY + Math.cos(angle) * length;

    drawProfessionalAngledArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, beamConfig.angle);
    return;
  }

  // E - SW 45° (Counter-Clockwise): Top-left position, angled into tube (opposite side)
  if (beamType === 'shear-45-ccw' || (beamType.includes('shear') && beamConfig.scanPattern === 'counter-clockwise')) {
    const angle = 45 * Math.PI / 180; // -45° from vertical
    const startX = centerX - outerRadius * 0.7;
    const startY = centerY - outerRadius - probeOffset * 0.8;
    const length = arrowLength * 0.9;
    const endX = startX + Math.sin(angle) * length;
    const endY = startY + Math.cos(angle) * length;

    drawProfessionalAngledArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, beamConfig.angle);
    return;
  }

  // F - SW Circumferential: Shows arc around the tube
  if (beamConfig.scanPattern === 'circumferential' || beamType === 'circumferential') {
    const arcRadius = outerRadius + 15;
    const startAngle = -30 * Math.PI / 180;
    const endAngle = 30 * Math.PI / 180;

    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.lineWidth = isHighlighted ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, startAngle, endAngle);
    ctx.stroke();

    // Arrow head at end of arc
    const arrowX = centerX + arcRadius * Math.cos(endAngle);
    const arrowY = centerY + arcRadius * Math.sin(endAngle);
    drawArrowHead(ctx, arrowX, arrowY, endAngle + Math.PI/2, beamConfig.color, 8);

    // Label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX + arcRadius + 20, centerY);
    ctx.restore();
    return;
  }

  // G - SW Axial 45° (from OD): Bottom-left position
  if (beamType === 'shear-axial-od') {
    const startX = centerX - outerRadius - probeOffset * 0.6;
    const startY = centerY + outerRadius * 0.5;
    const length = arrowLength * 0.8;
    const angle = -30 * Math.PI / 180;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    drawProfessionalAngledArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, beamConfig.angle);
    return;
  }

  // J - SW 60°: Bottom-right position
  if (beamType === 'shear-60') {
    const angle = -60 * Math.PI / 180;
    const startX = centerX + outerRadius * 0.5;
    const startY = centerY + outerRadius + probeOffset * 0.6;
    const length = arrowLength * 0.8;
    const endX = startX + Math.sin(angle) * length;
    const endY = startY - Math.cos(angle) * length;

    drawProfessionalAngledArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, 60);
    return;
  }

  // K - SW 70°: Right side position
  if (beamType === 'shear-70') {
    const startX = centerX + outerRadius + probeOffset * 0.6;
    const startY = centerY + outerRadius * 0.3;
    const length = arrowLength * 0.7;
    const angle = 160 * Math.PI / 180;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    drawProfessionalAngledArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, 70);
    return;
  }

  // L - Radial Position 2: Right side of tube
  if (beamType === 'longitudinal-radial' || label === 'L') {
    const startX = centerX + outerRadius + probeOffset;
    const startY = centerY - outerRadius * 0.3;
    const endX = centerX + innerRadius;

    drawProfessionalArrow(ctx, startX, startY, endX, startY, beamConfig.color, label, isHighlighted, animProgress, 'horizontal');
    return;
  }

  // Default fallback - radial beam
  const angleRad = (fixedAngle * Math.PI) / 180;
  const startX = centerX + (outerRadius + probeOffset) * Math.cos(angleRad);
  const startY = centerY + (outerRadius + probeOffset) * Math.sin(angleRad);
  const endX = centerX + innerRadius * Math.cos(angleRad);
  const endY = centerY + innerRadius * Math.sin(angleRad);

  drawProfessionalArrow(ctx, startX, startY, endX, endY, beamConfig.color, label, isHighlighted, animProgress, 'radial');
}

/**
 * Draw professional-style arrow with animation
 */
function drawProfessionalArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  orientation: 'vertical' | 'horizontal' | 'radial'
) {
  ctx.save();

  const lineWidth = isHighlighted ? 3.5 : 2.5;
  const arrowSize = isHighlighted ? 12 : 10;

  // Calculate direction
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Draw main line with gradient effect
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, adjustColorBrightness(color, -20));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw arrow head
  drawArrowHead(ctx, x2, y2, angle, color, arrowSize);

  // Animated pulse along the arrow
  const pulseX = x1 + dx * animProgress;
  const pulseY = y1 + dy * animProgress;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, isHighlighted ? 5 : 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw label with background
  let labelX = x1;
  let labelY = y1 - 12;

  if (orientation === 'horizontal') {
    labelX = x1 - 15;
    labelY = y1;
  } else if (orientation === 'vertical' && dy > 0) {
    labelY = y1 - 12;
  } else if (orientation === 'vertical' && dy < 0) {
    labelY = y1 + 20;
  }

  // Label background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const labelWidth = ctx.measureText(label).width + 8;
  ctx.fillRect(labelX - labelWidth/2, labelY - 10, labelWidth, 16);

  // Label border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(labelX - labelWidth/2, labelY - 10, labelWidth, 16);

  // Label text
  ctx.fillStyle = color;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, labelX, labelY - 2);

  ctx.restore();
}

/**
 * Draw arrow head
 */
function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, size: number) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw professional angled arrow for shear waves
 */
function drawProfessionalAngledArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  angle: number
) {
  ctx.save();

  const lineWidth = isHighlighted ? 3 : 2.5;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineAngle = Math.atan2(dy, dx);

  // Main beam line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrow head
  drawArrowHead(ctx, x2, y2, lineAngle, color, 10);

  // Animated pulse
  const pulseX = x1 + dx * animProgress;
  const pulseY = y1 + dy * animProgress;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Label with angle indicator
  const labelX = x1;
  const labelY = y1 - 15;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(labelX - 20, labelY - 10, 40, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(labelX - 20, labelY - 10, 40, 16);

  ctx.fillStyle = color;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label} ${angle}°`, labelX, labelY - 2);

  ctx.restore();
}

/**
 * Draw probe symbol
 */
function drawProbeSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, direction: 'up' | 'down' | 'left' | 'right') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const size = 8;
  ctx.beginPath();

  switch (direction) {
    case 'down':
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y - size);
      ctx.lineTo(x, y);
      break;
    case 'up':
      ctx.moveTo(x - size, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y);
      break;
    case 'right':
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.lineTo(x, y);
      break;
    case 'left':
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y);
      break;
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Draw beam for cylinder geometry
 * Updated to support comprehensive scan directions: TOP (A), BOTTOM (B), Radial (C), ID (H), TT (I)
 */
function drawCylinderBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  _totalScans: number,
  dimensions?: DrawDimensions
) {
  // First draw the 3D tilted cylinder shape (like Rafael document)
  ctx.save();

  // Get actual dimensions or defaults
  const diameter = dimensions?.diameter || 100;
  const cylinderLength = dimensions?.length || dimensions?.height || 200;

  // Calculate scale to fit available space
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const diagonalLength = cylinderLength * 0.7; // Projected length at 45°
  const totalDiagonal = Math.sqrt(diagonalLength * diagonalLength + (diameter * 0.5) * (diameter * 0.5));
  const scale = Math.min(availableSize / Math.max(totalDiagonal, diameter), 1.2);

  const radius = (diameter / 2) * scale;
  const length = cylinderLength * scale * 0.6;

  // Tilt angle (45 degrees like Rafael image)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Adjust center position
  const cx = centerX;
  const cy = centerY + 10;

  // Draw back ellipse (far end - dashed)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, radius * 0.4, radius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw side walls
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e293b';

  // Top edge
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(backX, backY - radius);
  ctx.stroke();

  // Bottom edge
  ctx.beginPath();
  ctx.moveTo(cx, cy + radius);
  ctx.lineTo(backX, backY + radius);
  ctx.stroke();

  // Draw front circle with subtle shading
  // Add subtle gradient fill for 3D effect
  const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(0.7, '#e2e8f0');
  gradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw the outline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw centerlines (dashed)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);

  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - radius - 30, cy);
  ctx.lineTo(cx + radius + 30, cy);
  ctx.stroke();

  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 30);
  ctx.lineTo(cx, cy + radius + 30);
  ctx.stroke();

  // Diagonal centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw label
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Round Bar', cx, cy + radius + 60);

  ctx.restore();

  // Now draw the beam arrows
  const beamType = beamConfig.type;

  // A - LW 0° (Axial from Top): Arrow from TOP going DOWN through cylinder
  if (beamType === 'longitudinal-axial-top') {
    const arrowX = cx - length * cos45 * 0.5; // Position at middle of tilted cylinder
    const arrowY = cy - length * sin45 * 0.5 - radius - 40;

    // Draw square scan direction indicator
    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.fillStyle = beamConfig.color;
    ctx.lineWidth = 2;

    // Square symbol
    const symbolSize = 8;
    ctx.strokeRect(arrowX - symbolSize/2, arrowY - symbolSize/2, symbolSize, symbolSize);

    // Arrow line
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY + symbolSize/2);
    ctx.lineTo(arrowX, arrowY + 30);
    ctx.stroke();

    // Arrow head pointing down
    drawArrowHead(ctx, arrowX, arrowY + 30, Math.PI/2, beamConfig.color, 8);

    // Label
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, arrowX, arrowY - symbolSize - 5);
    ctx.restore();
    return;
  }

  // B - LW 0° (Axial from Bottom): Arrow from BOTTOM going UP through cylinder
  if (beamType === 'longitudinal-axial-bottom') {
    const arrowX = cx + length * cos45 * 0.3; // Position offset from center
    const arrowY = cy + radius + 40;

    // Draw square scan direction indicator
    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.fillStyle = beamConfig.color;
    ctx.lineWidth = 2;

    // Square symbol
    const symbolSize = 8;
    ctx.strokeRect(arrowX - symbolSize/2, arrowY - symbolSize/2, symbolSize, symbolSize);

    // Arrow line pointing up
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY - symbolSize/2);
    ctx.lineTo(arrowX, arrowY - 30);
    ctx.stroke();

    // Arrow head pointing up
    drawArrowHead(ctx, arrowX, arrowY - 30, -Math.PI/2, beamConfig.color, 8);

    // Label
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, arrowX, arrowY + symbolSize + 15);
    ctx.restore();
    return;
  }

  // C - LW 0° (Radial from OD): Arrow from OD pointing toward center
  if (beamType === 'longitudinal-radial') {
    const arrowX = cx - radius - 40;
    const arrowY = cy;

    // Draw square scan direction indicator
    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.fillStyle = beamConfig.color;
    ctx.lineWidth = 2;

    // Square symbol
    const symbolSize = 8;
    ctx.strokeRect(arrowX - symbolSize/2, arrowY - symbolSize/2, symbolSize, symbolSize);

    // Arrow line pointing right toward center
    ctx.beginPath();
    ctx.moveTo(arrowX + symbolSize/2, arrowY);
    ctx.lineTo(arrowX + 30, arrowY);
    ctx.stroke();

    // Arrow head pointing right
    drawArrowHead(ctx, arrowX + 30, arrowY, 0, beamConfig.color, 8);

    // Label
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, arrowX, arrowY - symbolSize - 5);
    ctx.restore();
    return;
  }

  // I - Through-Transmission (TT): Two probes - one top, one bottom
  if (beamType === 'through-transmission') {
    // Draw transmitter from top
    const yTop = centerY - radius - 40;
    drawPerpedicularBeam(ctx, centerX, yTop, 90, radius * 2 + 50, beamConfig, 'T', isHighlighted, animProgress);

    // Draw receiver at bottom
    const yBottom = centerY + radius + 40;
    const receiverConfig = { ...beamConfig, color: '#65a30d' };
    drawPerpedicularBeam(ctx, centerX, yBottom, 270, 30, receiverConfig, 'R', false, animProgress);

    // Draw label
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label + ' (TT)', centerX, yTop - 15);
    return;
  }

  // Shear wave beams - angled from OD surface with triangular symbol
  if (beamType.includes('shear')) {
    let arrowX, arrowY;
    const angle = beamConfig.angle || 45;

    // Position arrows around the tilted cylinder based on scan direction
    if (label === 'D') { // SW 45° Clockwise
      arrowX = cx + radius * 0.7;
      arrowY = cy - radius * 0.7;
    } else if (label === 'E') { // SW 45° Counter-Clockwise
      arrowX = cx - radius * 0.7;
      arrowY = cy - radius * 0.7;
    } else if (label === 'F') { // SW Circumferential
      arrowX = cx + radius + 30;
      arrowY = cy;
    } else if (label === 'G') { // SW Axial from OD
      arrowX = cx - radius * 0.5;
      arrowY = cy + radius + 30;
    } else { // J, K - other angles
      arrowX = cx + radius * 0.5;
      arrowY = cy + radius * 0.5;
    }

    // Draw triangular scan direction indicator
    ctx.save();
    ctx.strokeStyle = beamConfig.color;
    ctx.fillStyle = beamConfig.color;
    ctx.lineWidth = 2;

    // Triangle symbol pointing down
    const symbolSize = 8;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY + symbolSize);
    ctx.lineTo(arrowX - symbolSize * 0.6, arrowY - symbolSize * 0.5);
    ctx.lineTo(arrowX + symbolSize * 0.6, arrowY - symbolSize * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Angled arrow line
    const angleRad = (angle * Math.PI) / 180;
    const arrowLength = 25;

    // Calculate arrow direction based on scan pattern
    let arrowAngle = angleRad;
    if (beamConfig.scanPattern === 'clockwise') {
      arrowAngle = angleRad + Math.PI/4; // 45° clockwise
    } else if (beamConfig.scanPattern === 'counter-clockwise') {
      arrowAngle = -angleRad - Math.PI/4; // 45° counter-clockwise
    }

    const endX = arrowX + Math.cos(arrowAngle) * arrowLength;
    const endY = arrowY + Math.sin(arrowAngle) * arrowLength;

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrow head
    drawArrowHead(ctx, endX, endY, arrowAngle, beamConfig.color, 6);

    // Label
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, arrowX, arrowY - symbolSize - 10);
    ctx.restore();
    return;
  }

  // Default behavior - radial or axial based on pattern
  const angleRad = (fixedAngle * Math.PI) / 180;
  const startX = centerX + radius * 1.15 * Math.cos(angleRad);
  const startY = centerY + radius * 1.15 * Math.sin(angleRad);

  if (beamConfig.scanPattern === 'axial') {
    drawAxialBeam(ctx, startX, startY, fixedAngle + 90, beamConfig, label, isHighlighted, animProgress);
  } else {
    drawRadialBeam(ctx, startX, startY, fixedAngle + 180, radius * 1.3, beamConfig, label, isHighlighted, animProgress);
  }
}

/**
 * Draw beam for plate geometry
 * Updated to support comprehensive scan directions: TOP (A), BOTTOM (B), TT (I), and shear waves
 */
function drawPlateBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number,
  fixedAngle: number,
  _totalScans: number
) {
  // CRITICAL FIX: Use SAME dimensions as the actual plate cross-section drawing!
  const scale = Math.min(bounds.width, bounds.height) * 0.01;
  const plateWidth = 100 * scale;  // Default width used in cross-section
  const plateHeight = 25 * scale;   // Default thickness used in cross-section
  const beamDepth = plateHeight + 50;  // Plate thickness + 50px for clear visualization

  // Determine beam direction based on beamConfig.type
  const beamType = beamConfig.type;

  // Calculate horizontal position based on beam type
  let x: number;
  let y: number;
  let direction: number;

  // A - LW 0° (Axial from Top): Arrow from TOP going DOWN
  if (beamType === 'longitudinal-axial-top') {
    x = centerX - plateWidth * 0.3;  // Left-center position
    y = centerY - plateHeight/2;  // AT the top surface (ASTM E2375-16)
    direction = 90;  // Points DOWN
    drawPerpedicularBeam(ctx, x, y, direction, beamDepth, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // B - LW 0° (Axial from Bottom): Arrow from BOTTOM going UP
  if (beamType === 'longitudinal-axial-bottom') {
    x = centerX + plateWidth * 0.3;  // Right-center position
    y = centerY + plateHeight/2;  // AT the bottom surface (ASTM E2375-16)
    direction = 270;  // Points UP
    drawPerpedicularBeam(ctx, x, y, direction, beamDepth, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // I - Through-Transmission (TT): Two probes - one top, one bottom
  if (beamType === 'through-transmission') {
    // Draw transmitter from top
    x = centerX;
    const yTop = centerY - plateHeight/2;  // AT the top surface (ASTM E2375-16)
    drawPerpedicularBeam(ctx, x, yTop, 90, beamDepth, beamConfig, 'T', isHighlighted, animProgress);

    // Draw receiver at bottom (with "R" label)
    const yBottom = centerY + plateHeight/2;  // AT the bottom surface (ASTM E2375-16)
    const receiverConfig = { ...beamConfig, color: '#65a30d' };  // Slightly darker lime for receiver
    drawPerpedicularBeam(ctx, x, yBottom, 270, beamDepth * 0.3, receiverConfig, 'R', false, animProgress);

    // Draw label for the combo
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label + ' (TT)', x, centerY - plateHeight/2 - 20);  // Adjusted label position
    return;
  }

  // C - LW 0° (Radial from OD) - for plates this is from the SIDE
  if (beamType === 'longitudinal-radial') {
    x = centerX - plateWidth/2;  // AT the left edge (ASTM E2375-16)
    y = centerY;  // Center height
    direction = 0;  // Points RIGHT (into the plate)
    drawPerpedicularBeam(ctx, x, y, direction, plateWidth + 40, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // Shear wave beams (D, E, J, K) - angled beams from top surface
  if (beamType.includes('shear')) {
    const normalizedAngle = fixedAngle % 360;

    // Position along top surface based on direction
    if (normalizedAngle < 180) {
      x = centerX - plateWidth * 0.2;
    } else {
      x = centerX + plateWidth * 0.2;
    }
    y = centerY - plateHeight/2;  // AT the top surface (ASTM E2375-16)

    // Draw angled beam
    const shearAngle = beamConfig.scanPattern === 'clockwise' ? 90 + beamConfig.angle :
                       beamConfig.scanPattern === 'counter-clockwise' ? 90 - beamConfig.angle :
                       90 + beamConfig.angle;
    drawAngledBeam(ctx, x, y, shearAngle, beamDepth * 1.2, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // Default behavior for legacy modes - from TOP going DOWN
  const normalizedAngle = fixedAngle % 360;

  // Map angle to horizontal position evenly across the top surface
  if (normalizedAngle === 0) {
    x = centerX + plateWidth * 0.35;
  } else if (normalizedAngle === 90) {
    x = centerX + plateWidth * 0.15;
  } else if (normalizedAngle === 180) {
    x = centerX - plateWidth * 0.15;
  } else if (normalizedAngle === 270) {
    x = centerX - plateWidth * 0.35;
  } else if (normalizedAngle === 45) {
    x = centerX + plateWidth * 0.25;
  } else if (normalizedAngle === 135) {
    x = centerX + plateWidth * 0.05;
  } else if (normalizedAngle === 225) {
    x = centerX - plateWidth * 0.25;
  } else if (normalizedAngle === 315) {
    x = centerX + plateWidth * 0.45;
  } else if (normalizedAngle === 60) {
    x = centerX + plateWidth * 0.1;
  } else if (normalizedAngle === 70) {
    x = centerX - plateWidth * 0.1;
  } else {
    const normalizedPosition = normalizedAngle / 360;
    x = centerX - plateWidth/2 + plateWidth * normalizedPosition;
  }

  y = centerY - plateHeight/2;  // AT the top surface (ASTM E2375-16)
  drawPerpedicularBeam(ctx, x, y, 90, beamDepth, beamConfig, label, isHighlighted, animProgress);
}

/**
 * Draw an angled beam for shear wave visualization
 */
function drawAngledBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number
) {
  const rad = (angle * Math.PI) / 180;
  const endX = x + Math.cos(rad) * length;
  const endY = y + Math.sin(rad) * length;

  ctx.save();

  // Set line style
  ctx.strokeStyle = beamConfig.color;
  ctx.lineWidth = isHighlighted ? 4 : 2.5;
  ctx.lineCap = 'round';

  // Draw main beam line
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw animated pulse along the beam
  const pulseProgress = animProgress;
  const pulseX = x + (endX - x) * pulseProgress;
  const pulseY = y + (endY - y) * pulseProgress;

  ctx.fillStyle = beamConfig.color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, isHighlighted ? 6 : 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw arrowhead at the end
  const arrowSize = 10;
  const arrowAngle = Math.atan2(endY - y, endX - x);

  ctx.fillStyle = beamConfig.color;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
    endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
    endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Draw label
  ctx.fillStyle = beamConfig.color;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 10);

  // Draw angle indicator
  ctx.font = '10px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${beamConfig.angle}°`, x + 15, y + 5);

  ctx.restore();
}

/**
 * Draw circumferential beam (travels around surface)
 */
function drawCircumferentialBeam(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean
) {
  const angleRad = (angle * Math.PI) / 180;
  const x = centerX + radius * Math.cos(angleRad);
  const y = centerY + radius * Math.sin(angleRad);

  ctx.save();

  // Draw wave propagation arc
  const arcLength = 60;
  ctx.strokeStyle = beamConfig.color;
  ctx.lineWidth = isHighlighted ? 4 : 2.5;
  ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, (angle - arcLength/2) * Math.PI / 180, (angle + arcLength/2) * Math.PI / 180);
  ctx.stroke();

  // Draw direction arrow
  const nextAngle = angle + 5;
  const nextAngleRad = (nextAngle * Math.PI) / 180;
  const nextX = centerX + radius * Math.cos(nextAngleRad);
  const nextY = centerY + radius * Math.sin(nextAngleRad);

  drawArrowHead(ctx, nextX, nextY, Math.atan2(nextY - y, nextX - x), beamConfig.color, isHighlighted ? 14 : 12);

  // Label
  ctx.globalAlpha = 1;
  drawLabel(ctx, x, y, label, beamConfig.color, isHighlighted);

  ctx.restore();
}

/**
 * Draw axial beam (travels along length)
 */
function drawAxialBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number
) {
  const beamLength = 80;
  const animOffset = animProgress * beamLength * 0.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  // Draw beam path
  ctx.strokeStyle = beamConfig.color;
  ctx.lineWidth = isHighlighted ? 4 : 2.5;
  ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;

  // Animated dashed line showing wave propagation
  ctx.setLineDash([10, 5]);
  ctx.lineDashOffset = -animOffset;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(beamLength, 0);
  ctx.stroke();

  ctx.setLineDash([]);

  // Arrow at the end
  drawArrowHead(ctx, beamLength, 0, 0, beamConfig.color, isHighlighted ? 16 : 14);

  // Wave propagation indicator (moving dot)
  const dotPos = (animProgress * beamLength) % beamLength;
  ctx.fillStyle = beamConfig.color;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(dotPos, 0, isHighlighted ? 5 : 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();

  // Label
  drawLabel(ctx, x, y - 20, label, beamConfig.color, isHighlighted);
}

/**
 * Draw radial beam (penetrates from outside to center)
 */
function drawRadialBeam(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,
  maxDepth: number,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number
) {
  const actualDepth = maxDepth * beamConfig.penetrationDepth;
  const animatedDepth = actualDepth * animProgress;

  ctx.save();
  ctx.translate(startX, startY);
  ctx.rotate((angle * Math.PI) / 180);

  // Draw beam cone/path with angle
  const beamAngleRad = (beamConfig.angle * Math.PI) / 180;
  const spreadRad = (beamConfig.beamSpread * Math.PI) / 180;

  // Beam path
  ctx.strokeStyle = beamConfig.color;
  ctx.fillStyle = beamConfig.color;
  ctx.globalAlpha = isHighlighted ? 0.3 : 0.15;

  ctx.beginPath();
  ctx.moveTo(0, 0);

  // Left edge of beam
  const leftAngle = beamAngleRad - spreadRad / 2;
  ctx.lineTo(
    actualDepth * Math.cos(leftAngle),
    actualDepth * Math.sin(leftAngle)
  );

  // Right edge of beam
  const rightAngle = beamAngleRad + spreadRad / 2;
  ctx.lineTo(
    actualDepth * Math.cos(rightAngle),
    actualDepth * Math.sin(rightAngle)
  );

  ctx.closePath();
  ctx.fill();

  // Center beam line
  ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;
  ctx.lineWidth = isHighlighted ? 4 : 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(
    actualDepth * Math.cos(beamAngleRad),
    actualDepth * Math.sin(beamAngleRad)
  );
  ctx.stroke();

  // Animated wave propagation
  ctx.globalAlpha = 1;
  const wavePos = animatedDepth;
  ctx.fillStyle = beamConfig.color;
  ctx.beginPath();
  ctx.arc(
    wavePos * Math.cos(beamAngleRad),
    wavePos * Math.sin(beamAngleRad),
    isHighlighted ? 5 : 3,
    0,
    2 * Math.PI
  );
  ctx.fill();

  // Arrow at penetration point
  if (animProgress > 0.5) {
    drawArrowHead(
      ctx,
      actualDepth * Math.cos(beamAngleRad),
      actualDepth * Math.sin(beamAngleRad),
      beamAngleRad,
      beamConfig.color,
      isHighlighted ? 16 : 14
    );
  }

  ctx.restore();

  // Label and angle indicator
  drawLabel(ctx, startX, startY - 25, label, beamConfig.color, isHighlighted);

  if (beamConfig.angle > 0 && isHighlighted) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate((angle * Math.PI) / 180);

    ctx.font = '11px Arial';
    ctx.fillStyle = beamConfig.color;
    ctx.fillText(`${beamConfig.angle}°`, 20, -15);

    ctx.restore();
  }
}

/**
 * Draw perpendicular beam (straight down into plate)
 */
function drawPerpedicularBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  depth: number,
  beamConfig: BeamConfig,
  label: string,
  isHighlighted: boolean,
  animProgress: number
) {
  const animatedDepth = depth * beamConfig.penetrationDepth * animProgress;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  // Beam path
  ctx.strokeStyle = beamConfig.color;
  ctx.lineWidth = isHighlighted ? 4 : 2.5;
  ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, depth * beamConfig.penetrationDepth);
  ctx.stroke();

  // Wave propagation indicator
  ctx.globalAlpha = 1;
  ctx.fillStyle = beamConfig.color;
  ctx.beginPath();
  ctx.arc(0, animatedDepth, isHighlighted ? 5 : 3, 0, 2 * Math.PI);
  ctx.fill();

  // Arrow
  if (animProgress > 0.5) {
    drawArrowHead(ctx, 0, depth * beamConfig.penetrationDepth, Math.PI / 2, beamConfig.color, isHighlighted ? 16 : 14);
  }

  ctx.restore();

  // Label - position based on beam direction (ASTM E2375-16: labels OUTSIDE the shape)
  // angle 90° = down, label above; angle 270° = up, label below; angle 0° = right, label left
  let labelX = x;
  let labelY = y;
  const labelOffset = 15;

  if (angle === 90) {
    // Arrow points DOWN, label goes ABOVE
    labelY = y - labelOffset;
  } else if (angle === 270) {
    // Arrow points UP, label goes BELOW
    labelY = y + labelOffset;
  } else if (angle === 0) {
    // Arrow points RIGHT, label goes LEFT
    labelX = x - labelOffset;
  } else if (angle === 180) {
    // Arrow points LEFT, label goes RIGHT
    labelX = x + labelOffset;
  } else {
    // Default: label above
    labelY = y - labelOffset;
  }

  drawLabel(ctx, labelX, labelY, label, beamConfig.color, isHighlighted);
}

/**
 * Draw label for beam
 */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  isHighlighted: boolean
) {
  ctx.save();

  ctx.font = `bold ${isHighlighted ? 16 : 14}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background
  const metrics = ctx.measureText(text);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(x - metrics.width/2 - 5, y - 10, metrics.width + 10, 20);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = isHighlighted ? 2 : 1;
  ctx.strokeRect(x - metrics.width/2 - 5, y - 10, metrics.width + 10, 20);

  // Text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * Draw dimension lines (professional CAD style)
 */
function drawDimensionLines(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  ctx.strokeStyle = '#475569';
  ctx.fillStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  switch (partType) {
    case 'tube':
    case 'ring': {
      const outerRadius = Math.min(bounds.width, bounds.height) * 0.35;
      const innerRadius = outerRadius * 0.75;

      // Outer diameter dimension
      drawDimensionLine(
        ctx,
        centerX - outerRadius,
        bounds.y + bounds.height - 20,
        centerX + outerRadius,
        bounds.y + bounds.height - 20,
        `Ø${(dimensions.outerDiameter || outerRadius * 2).toFixed(0)}`
      );

      // Inner diameter dimension
      drawDimensionLine(
        ctx,
        centerX - innerRadius,
        centerY,
        centerX + innerRadius,
        centerY,
        `Ø${(dimensions.innerDiameter || innerRadius * 2).toFixed(0)}`
      );
      break;
    }

    case 'cylinder':
    case 'disk': {
      const cylinderRadius = Math.min(bounds.width, bounds.height) * 0.35;

      // Diameter dimension
      drawDimensionLine(
        ctx,
        centerX - cylinderRadius,
        bounds.y + bounds.height - 20,
        centerX + cylinderRadius,
        bounds.y + bounds.height - 20,
        `Ø${(dimensions.diameter || cylinderRadius * 2).toFixed(0)}`
      );

      // Length dimension (if available)
      if (dimensions.length) {
        ctx.textAlign = 'left';
        ctx.fillText(`Length: ${dimensions.length.toFixed(0)}`, bounds.x + 10, bounds.y + 20);
      }
      break;
    }

    case 'plate':
    case 'bar': {
      const plateWidth = bounds.width * 0.6;
      const plateHeight = bounds.height * 0.5;

      // Width dimension
      drawDimensionLine(
        ctx,
        centerX - plateWidth / 2,
        bounds.y + bounds.height - 25,
        centerX + plateWidth / 2,
        bounds.y + bounds.height - 25,
        `${(dimensions.width || plateWidth).toFixed(0)}`
      );

      // Height dimension
      drawDimensionLine(
        ctx,
        bounds.x + bounds.width - 25,
        centerY - plateHeight / 2,
        bounds.x + bounds.width - 25,
        centerY + plateHeight / 2,
        `${(dimensions.height || dimensions.thickness || plateHeight).toFixed(0)}`,
        true
      );
      break;
    }

    case 'i_profile':
    case 'extrusion_i': {
      const scale_i = Math.min(bounds.width, bounds.height) * 0.008;
      const iWidth = (dimensions.flangeWidth || 120) * scale_i;
      const iHeight = (dimensions.profileHeight || dimensions.height || 240) * scale_i;

      // Width
      drawDimensionLine(ctx, centerX - iWidth/2, bounds.y + bounds.height - 25, centerX + iWidth/2, bounds.y + bounds.height - 25, `${dimensions.flangeWidth || 120}`);
      // Height
      drawDimensionLine(ctx, bounds.x + bounds.width - 25, centerY - iHeight/2, bounds.x + bounds.width - 25, centerY + iHeight/2, `${dimensions.profileHeight || dimensions.height || 240}`, true);
      break;
    }

    case 'u_profile':
    case 'extrusion_u':
    case 'extrusion_channel': {
      const scale_u = Math.min(bounds.width, bounds.height) * 0.008;
      const uWidth = (dimensions.flangeWidth || 80) * scale_u;
      const uHeight = (dimensions.profileHeight || dimensions.height || 200) * scale_u;

      // Width
      drawDimensionLine(ctx, centerX - uWidth/2, bounds.y + bounds.height - 25, centerX + uWidth/2, bounds.y + bounds.height - 25, `${dimensions.flangeWidth || 80}`);
      // Height
      drawDimensionLine(ctx, bounds.x + bounds.width - 25, centerY - uHeight/2, bounds.x + bounds.width - 25, centerY + uHeight/2, `${dimensions.profileHeight || dimensions.height || 200}`, true);
      break;
    }

    case 'l_profile':
    case 'extrusion_l':
    case 'extrusion_angle': {
      const scale_l = Math.min(bounds.width, bounds.height) * 0.012;
      const lLeg1 = (dimensions.leg1 || 50) * scale_l;
      const lLeg2 = (dimensions.leg2 || 40) * scale_l;

      // Leg 1
      drawDimensionLine(ctx, centerX - lLeg1/2, bounds.y + bounds.height - 25, centerX + lLeg1/2, bounds.y + bounds.height - 25, `Leg1: ${dimensions.leg1 || 50}`);
      // Leg 2
      drawDimensionLine(ctx, bounds.x + bounds.width - 25, centerY - lLeg2/2, bounds.x + bounds.width - 25, centerY + lLeg2/2, `Leg2: ${dimensions.leg2 || 40}`, true);
      break;
    }

    case 't_profile':
    case 'extrusion_t': {
      const scale_t = Math.min(bounds.width, bounds.height) * 0.008;
      const tWidth = (dimensions.flangeWidth || 120) * scale_t;
      const tHeight = (dimensions.profileHeight || dimensions.height || 200) * scale_t;

      // Width
      drawDimensionLine(ctx, centerX - tWidth/2, bounds.y + bounds.height - 25, centerX + tWidth/2, bounds.y + bounds.height - 25, `${dimensions.flangeWidth || 120}`);
      // Height
      drawDimensionLine(ctx, bounds.x + bounds.width - 25, centerY - tHeight/2, bounds.x + bounds.width - 25, centerY + tHeight/2, `${dimensions.profileHeight || dimensions.height || 200}`, true);
      break;
    }

    case 'sphere': {
      const scale_s = Math.min(bounds.width, bounds.height) * 0.007;
      const sDiam = (dimensions.diameter || 50) * scale_s;

      // Diameter
      drawDimensionLine(ctx, centerX - sDiam, bounds.y + bounds.height - 20, centerX + sDiam, bounds.y + bounds.height - 20, `Ø${dimensions.diameter || 50}`);
      break;
    }

    case 'hexagon':
    case 'hex_bar': {
      const scale_h = Math.min(bounds.width, bounds.height) * 0.008;
      const hFlat = (dimensions.acrossFlats || dimensions.width || 50) * scale_h;

      // Across flats
      drawDimensionLine(ctx, centerX - hFlat/2, bounds.y + bounds.height - 20, centerX + hFlat/2, bounds.y + bounds.height - 20, `AF: ${dimensions.acrossFlats || dimensions.width || 50}`);
      break;
    }

    case 'cone': {
      const scale_c = Math.min(bounds.width, bounds.height) * 0.008;
      const cBottomDiam = (dimensions.bottomDiameter || dimensions.diameter || 50) * scale_c;
      const cHeight = (dimensions.height || dimensions.length || 100) * scale_c;

      // Bottom diameter
      drawDimensionLine(ctx, centerX - cBottomDiam/2, bounds.y + bounds.height - 20, centerX + cBottomDiam/2, bounds.y + bounds.height - 20, `Ø${dimensions.bottomDiameter || dimensions.diameter || 50}`);
      // Height
      drawDimensionLine(ctx, bounds.x + bounds.width - 25, centerY - cHeight/2, bounds.x + bounds.width - 25, centerY + cHeight/2, `H: ${dimensions.height || dimensions.length || 100}`, true);
      break;
    }

    case 'forging':
    case 'near_net_forging': {
      const forgingWidth = bounds.width * 0.55;
      const forgingHeight = bounds.height * 0.5;

      // Width dimension
      drawDimensionLine(
        ctx,
        centerX - forgingWidth / 2,
        bounds.y + bounds.height - 25,
        centerX + forgingWidth / 2,
        bounds.y + bounds.height - 25,
        `${(dimensions.width || forgingWidth).toFixed(0)}`
      );

      // Height dimension
      drawDimensionLine(
        ctx,
        bounds.x + bounds.width - 25,
        centerY - forgingHeight / 2,
        bounds.x + bounds.width - 25,
        centerY + forgingHeight / 2,
        `${(dimensions.height || forgingHeight).toFixed(0)}`,
        true
      );
      break;
    }
  }
}

/**
 * Draw a single dimension line with arrows and text
 */
function drawDimensionLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  text: string,
  vertical: boolean = false
) {
  const arrowSize = 8;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw arrows
  if (vertical) {
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - arrowSize/2, y1 + arrowSize);
    ctx.lineTo(x1 + arrowSize/2, y1 + arrowSize);
    ctx.closePath();
    ctx.fill();

    // Right arrow
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize/2, y2 - arrowSize);
    ctx.lineTo(x2 + arrowSize/2, y2 - arrowSize);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.save();
    ctx.translate((x1 + x2) / 2 - 15, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  } else {
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowSize, y1 - arrowSize/2);
    ctx.lineTo(x1 + arrowSize, y1 + arrowSize/2);
    ctx.closePath();
    ctx.fill();

    // Right arrow
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize, y2 - arrowSize/2);
    ctx.lineTo(x2 - arrowSize, y2 + arrowSize/2);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillText(text, (x1 + x2) / 2, y1 - 10);
  }
}

/**
 * Draw title block (like professional CAD drawings)
 */
function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  partType: PartGeometry
) {
  const blockX = width - 220;
  const blockY = height - 80;
  const blockWidth = 210;
  const blockHeight = 70;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(blockX, blockY, blockWidth, blockHeight);

  // Border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);

  // Title
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.fillText('INSPECTION PLAN', blockX + 10, blockY + 20);

  // Part type
  ctx.font = '12px Arial';
  ctx.fillText(`Part Type: ${partType.toUpperCase()}`, blockX + 10, blockY + 40);

  // Date
  const date = new Date().toLocaleDateString();
  ctx.fillText(`Date: ${date}`, blockX + 10, blockY + 58);

  // Scale
  ctx.textAlign = 'right';
  ctx.fillText('Scale: 1:1', blockX + blockWidth - 10, blockY + 58);
}

// ============================================================================
// LEVEL 9 PREMIUM DRAWING FUNCTIONS
// ============================================================================

/**
 * LEVEL 9: Premium gradient background
 */
function drawPremiumBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Professional engineering drawing background with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#fafafa');
  gradient.addColorStop(1, '#f5f5f5');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * LEVEL 9: Professional border frame with CAD-quality styling
 */
function drawProfessionalBorderFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const margin = 15;
  const innerMargin = 25;

  // Outer border (thick)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Inner border (medium)
  ctx.lineWidth = 1.5;
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Corner accents (professional touch)
  const cornerSize = 10;
  ctx.lineWidth = 2;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(innerMargin - 5, innerMargin + cornerSize);
  ctx.lineTo(innerMargin - 5, innerMargin - 5);
  ctx.lineTo(innerMargin + cornerSize, innerMargin - 5);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - innerMargin - cornerSize, innerMargin - 5);
  ctx.lineTo(width - innerMargin + 5, innerMargin - 5);
  ctx.lineTo(width - innerMargin + 5, innerMargin + cornerSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(innerMargin - 5, height - innerMargin - cornerSize);
  ctx.lineTo(innerMargin - 5, height - innerMargin + 5);
  ctx.lineTo(innerMargin + cornerSize, height - innerMargin + 5);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - innerMargin - cornerSize, height - innerMargin + 5);
  ctx.lineTo(width - innerMargin + 5, height - innerMargin + 5);
  ctx.lineTo(width - innerMargin + 5, height - innerMargin - cornerSize);
  ctx.stroke();
}

/**
 * LEVEL 9: Grid reference markers (A-H horizontal, 1-8 vertical)
 */
function drawGridReferenceMarkers(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const margin = 15;
  const innerMargin = 25;

  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Horizontal markers (A-H)
  const horizontalLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const hStep = (width - innerMargin * 2) / horizontalLetters.length;

  horizontalLetters.forEach((letter, i) => {
    const x = innerMargin + hStep * i + hStep / 2;
    // Top
    ctx.fillText(letter, x, (margin + innerMargin) / 2);
    // Bottom
    ctx.fillText(letter, x, height - (margin + innerMargin) / 2);
  });

  // Vertical markers (1-8)
  const verticalNumbers = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const vStep = (height - innerMargin * 2) / verticalNumbers.length;

  verticalNumbers.forEach((number, i) => {
    const y = innerMargin + vStep * i + vStep / 2;
    // Left
    ctx.fillText(number, (margin + innerMargin) / 2, y);
    // Right
    ctx.fillText(number, width - (margin + innerMargin) / 2, y);
  });
}

/**
 * LEVEL 9: Enhanced technical grid with professional styling
 */
function drawEnhancedTechnicalGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const innerMargin = 25;
  const drawWidth = width - innerMargin * 2;
  const drawHeight = height - innerMargin * 2;

  // Fine grid (light)
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
  ctx.lineWidth = 0.5;

  const fineSpacing = 10;
  for (let x = innerMargin; x <= width - innerMargin; x += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, innerMargin);
    ctx.lineTo(x, height - innerMargin);
    ctx.stroke();
  }

  for (let y = innerMargin; y <= height - innerMargin; y += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(innerMargin, y);
    ctx.lineTo(width - innerMargin, y);
    ctx.stroke();
  }

  // Major grid (medium)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;

  const majorSpacing = 50;
  for (let x = innerMargin; x <= width - innerMargin; x += majorSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, innerMargin);
    ctx.lineTo(x, height - innerMargin);
    ctx.stroke();
  }

  for (let y = innerMargin; y <= height - innerMargin; y += majorSpacing) {
    ctx.beginPath();
    ctx.moveTo(innerMargin, y);
    ctx.lineTo(width - innerMargin, y);
    ctx.stroke();
  }
}

/**
 * LEVEL 9: Premium cross-section with enhanced rendering
 */
function drawPremiumCrossSection(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Add subtle shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  // Call the original professional cross-section function
  drawProfessionalCrossSection(ctx, partType, bounds, dimensions);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * LEVEL 9: Premium animated arrows with glow effects
 */
function drawPremiumAnimatedScanArrows(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  scanDetails: ScanDetail[],
  bounds: DrawBounds,
  highlightedDirection: string | undefined,
  frame: number,
  dimensions?: DrawDimensions
) {
  // Enable glow effect for highlighted arrows
  if (highlightedDirection) {
    ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
    ctx.shadowBlur = 20;
  }

  // Call the original animated scan arrows function
  drawAnimatedScanArrows(ctx, partType, scanDetails, bounds, highlightedDirection, frame, dimensions);

  // Reset glow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * LEVEL 9: ISO/ASME standard dimension lines
 */
function drawISODimensionLines(
  ctx: CanvasRenderingContext2D,
  partType: PartGeometry,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Use enhanced dimension styling
  ctx.strokeStyle = '#334155';
  ctx.fillStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.font = 'bold 11px Arial';

  // Call the original dimension lines function
  drawDimensionLines(ctx, partType, bounds, dimensions);
}

/**
 * LEVEL 9: Professional title block with full metadata
 */
function drawProfessionalTitleBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  partType: PartGeometry
) {
  const blockX = 15;
  const blockY = height - 120;
  const blockWidth = 350;
  const blockHeight = 105;

  // Professional gradient background
  const gradient = ctx.createLinearGradient(blockX, blockY, blockX, blockY + blockHeight);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = gradient;
  ctx.fillRect(blockX, blockY, blockWidth, blockHeight);

  // Outer border (thick)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);

  // Inner sections
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;

  // Horizontal dividers
  ctx.beginPath();
  ctx.moveTo(blockX, blockY + 35);
  ctx.lineTo(blockX + blockWidth, blockY + 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(blockX, blockY + 70);
  ctx.lineTo(blockX + blockWidth, blockY + 70);
  ctx.stroke();

  // Vertical dividers
  ctx.beginPath();
  ctx.moveTo(blockX + 180, blockY + 35);
  ctx.lineTo(blockX + 180, blockY + blockHeight);
  ctx.stroke();

  // Header
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('ULTRASONIC INSPECTION PLAN', blockX + 10, blockY + 23);

  // Left column
  ctx.font = 'bold 10px Arial';
  ctx.fillStyle = '#475569';
  ctx.fillText('Part Type:', blockX + 10, blockY + 50);
  ctx.fillText('Drawing No:', blockX + 10, blockY + 85);

  ctx.font = '11px Arial';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(partType.toUpperCase().replace(/_/g, ' '), blockX + 70, blockY + 50);

  // Generate stable drawing number based on part type (not changing every frame)
  const drawingNumber = 'SM-UT-' + partType.toUpperCase().substring(0, 3) + '-001';
  ctx.fillText(drawingNumber, blockX + 70, blockY + 85);

  // Right column
  ctx.font = 'bold 10px Arial';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'left';
  ctx.fillText('Date:', blockX + 190, blockY + 50);
  ctx.fillText('Revision:', blockX + 190, blockY + 65);
  ctx.fillText('Scale:', blockX + 190, blockY + 85);
  ctx.fillText('Engineer:', blockX + 190, blockY + 100);

  ctx.font = '11px Arial';
  ctx.fillStyle = '#1e293b';
  const date = new Date().toLocaleDateString();
  ctx.fillText(date, blockX + 240, blockY + 50);
  ctx.fillText('Rev. A', blockX + 240, blockY + 65);
  ctx.fillText('1:1', blockX + 240, blockY + 85);
  ctx.fillText('ScanMaster AI', blockX + 240, blockY + 100);

  // Quality stamp
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(blockX + 10, blockY + 95, 160, 8);
  ctx.setLineDash([]);

  ctx.font = 'bold 9px Arial';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'center';
  ctx.fillText('✓ ISO 9001 CERTIFIED', blockX + 90, blockY + 101);
}

/**
 * LEVEL 9: Color-coded legend for wave modes
 */
function drawWaveModeLegend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scanDetails: ScanDetail[]
) {
  const legendX = width - 250;
  const legendY = 80;
  const legendWidth = 230;

  // Get unique wave modes from scan details
  const waveModes = new Set<string>();
  scanDetails.forEach(detail => {
    if (detail.waveMode) waveModes.add(detail.waveMode);
  });

  const modes = Array.from(waveModes);
  if (modes.length === 0) return;

  const legendHeight = 60 + modes.length * 28;

  // Background with gradient
  const gradient = ctx.createLinearGradient(legendX, legendY, legendX, legendY + legendHeight);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#f8fafc');
  ctx.fillStyle = gradient;
  ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

  // Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('WAVE MODE LEGEND', legendX + 10, legendY + 22);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(legendX + 10, legendY + 30);
  ctx.lineTo(legendX + legendWidth - 10, legendY + 30);
  ctx.stroke();

  // Legend items
  modes.forEach((mode, index) => {
    const y = legendY + 50 + index * 28;
    const beamConfig = parseWaveMode(mode, 'plate' as PartGeometry);

    // Color indicator (circle)
    ctx.fillStyle = beamConfig.color;
    ctx.beginPath();
    ctx.arc(legendX + 20, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wave mode text
    ctx.fillStyle = '#1e293b';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(mode, legendX + 35, y + 4);

    // Angle indicator if applicable
    if (beamConfig.angle > 0) {
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(`${beamConfig.angle}°`, legendX + legendWidth - 15, y + 4);
    }
  });

  // Footer note
  ctx.font = 'italic 9px Arial';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('Color-coded beam visualization', legendX + legendWidth / 2, legendY + legendHeight - 10);
}
