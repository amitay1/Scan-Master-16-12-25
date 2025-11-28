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

    // NOTE: Dynamic animated arrows disabled - using Rafael-style static arrows instead
    // The static arrows (LEFT/TOP probes with squares) are drawn inside each shape function
    // drawPremiumAnimatedScanArrows(ctx, partType, scanDetails, crossSectionBounds, highlightedDirection, animationFrame, dimensions);

    // Draw ISO standard dimension lines
    drawISODimensionLines(ctx, partType, crossSectionBounds, dimensions);

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
 * Draw RAFAEL-STYLE TILTED 3D SEAMLESS TUBE (Hollow Bar)
 * EXACTLY like the Rafael 5036 spec image:
 * - Tube tilted at ~45 degrees (diagonal view)
 * - Hollow circle at front end (cross-section with inner hole)
 * - Dashed centerlines through length and diameter
 * - Scan direction arrows from top-right diagonal
 * - "Seamless Tube (Hollow Bar)" label underlined
 */
function drawTubeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get REAL dimensions
  const outerDiam = dimensions.outerDiameter || dimensions.diameter || 100;
  const innerDiam = dimensions.innerDiameter || (outerDiam * 0.6);
  const tubeLength = dimensions.length || dimensions.height || 200;

  // Available space (leave room for arrows and label)
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  
  // Calculate scale to fit tilted tube
  const diagonalLength = tubeLength * 0.7;
  const totalDiagonal = Math.sqrt(diagonalLength * diagonalLength + (outerDiam * 0.5) * (outerDiam * 0.5));
  const scale = Math.min(availableSize / Math.max(totalDiagonal, outerDiam), 1.2);

  const outerRadius = (outerDiam / 2) * scale;
  const innerRadius = (innerDiam / 2) * scale;
  const length = tubeLength * scale * 0.6;

  // Tilt angle (45 degrees like Rafael image)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 20;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (far end of tube) - outer, partially hidden
  // ═══════════════════════════════════════════════════════════════════
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  // Back outer ellipse (dashed - hidden)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, outerRadius * 0.4, outerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Back inner ellipse (dashed - hidden)
  ctx.beginPath();
  ctx.ellipse(backX, backY, innerRadius * 0.4, innerRadius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE WALLS - lines connecting front and back (outer edges)
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // FRONT CIRCLES (cross-section view) - outer and inner
  // ═══════════════════════════════════════════════════════════════════
  
  // Outer circle
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner circle (the hole)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Centerline through front circle - horizontal
  ctx.beginPath();
  ctx.moveTo(cx - outerRadius - 30, cy);
  ctx.lineTo(cx + outerRadius + 30, cy);
  ctx.stroke();
  
  // Centerline through front circle - vertical
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius - 30);
  ctx.lineTo(cx, cy + outerRadius + 30);
  ctx.stroke();
  
  // Centerline through length (diagonal) - extends beyond tube
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - outerRadius - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - outerRadius - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + outerRadius * 0.7, cy - outerRadius - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Seamless Tube (Hollow Bar)" LABEL - underlined, bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + outerRadius + 50;
  ctx.fillText('Seamless Tube (Hollow Bar)', labelX, labelY);
  
  // Underline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - 100, labelY + 3);
  ctx.lineTo(labelX + 100, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Rafael-style scan arrow (unified version)
 * Supports both hollow and filled styles, and all directions
 */
function drawRafaelScanArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right' | 'right-up',
  type: 'hollow' | 'filled' = 'filled'
) {
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = type === 'filled' ? '#1e293b' : '#ffffff';
  ctx.lineWidth = 1.5;

  const len = 25;
  const headSize = 8;

  ctx.translate(x, y);
  
  // Rotate based on direction
  if (direction === 'down') ctx.rotate(Math.PI / 2);
  else if (direction === 'up') ctx.rotate(-Math.PI / 2);
  else if (direction === 'left') ctx.rotate(Math.PI);
  else if (direction === 'right-up') ctx.rotate(-Math.PI / 6);
  // 'right' = no rotation

  // Draw arrow line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();

  // Draw arrowhead (filled triangle)
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(len - headSize, -headSize / 2);
  ctx.lineTo(len - headSize, headSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Rafael-style angle beam arrow (triangle ▽)
 */
function drawRafaelAngleBeamArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.save();
  
  const size = 12;
  
  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  // Draw triangle pointing down
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE CYLINDER/ROUND BAR TECHNICAL DRAWING
 * Left: Cross-section view (solid circle)
 * Right: Side view (rectangle)
 * Includes scan direction arrows
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D ROUND BAR (Cylinder)
 * EXACTLY like the Rafael 5036 spec image:
 * - Cylinder tilted at ~45 degrees (diagonal view)
 * - Solid circle at front end (cross-section)
 * - Dashed centerlines through length and diameter
 * - Scan direction arrows from top-right diagonal
 * - "Round Bar" label underlined
 */
function drawCylinderCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get REAL dimensions
  const diameter = dimensions.diameter || 100;
  const cylinderLength = dimensions.length || dimensions.height || 200;

  // Available space (leave room for arrows and label)
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  
  // Calculate scale to fit tilted cylinder
  // When tilted 45°, the diagonal footprint is larger
  const diagonalLength = cylinderLength * 0.7; // Projected length at 45°
  const totalDiagonal = Math.sqrt(diagonalLength * diagonalLength + (diameter * 0.5) * (diameter * 0.5));
  const scale = Math.min(availableSize / Math.max(totalDiagonal, diameter), 1.2);

  const radius = (diameter / 2) * scale;
  const length = cylinderLength * scale * 0.6; // Shortened for diagonal view

  // Tilt angle (45 degrees like Rafael image)
  const angle = Math.PI / 4; // 45 degrees
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 20;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (far end of cylinder) - partially hidden
  // ═══════════════════════════════════════════════════════════════════
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  // Hidden part (dashed)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, radius * 0.4, radius, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE WALLS - lines connecting front and back ellipses
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // FRONT CIRCLE (cross-section view) - solid circle at front
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Centerline through front circle - horizontal
  ctx.beginPath();
  ctx.moveTo(cx - radius - 30, cy);
  ctx.lineTo(cx + radius + 30, cy);
  ctx.stroke();
  
  // Centerline through front circle - vertical
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 30);
  ctx.lineTo(cx, cy + radius + 30);
  ctx.stroke();
  
  // Centerline through length (diagonal) - extends beyond cylinder
  ctx.beginPath();
  ctx.moveTo(cx + 40 * cos45, cy + 40 * sin45);
  ctx.lineTo(backX - 50 * cos45, backY - 50 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - radius - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - radius - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + radius * 0.7, cy - radius - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Round Bar" LABEL - underlined, bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + radius + 50;
  ctx.fillText('Round Bar', labelX, labelY);
  
  // Underline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - 40, labelY + 3);
  ctx.lineTo(labelX + 40, labelY + 3);
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
 * Draw RAFAEL-STYLE ISOMETRIC 3D RING
 * EXACTLY like the Rafael 5036 spec image:
 * - 3D isometric ring (hollow cylinder)
 * - Dashed centerlines through the center
 * - Scan direction arrows (⇨ ⇩ ▽)
 * - "Ring" label on the right
 * 
 * SMART SCALING: Always fits inside bounds, no matter the dimensions
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D RING
 * Like Rafael 5036 - tilted at 45° to the right
 * With probe squares and arrows from side/top
 */
function drawIsometricRing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get REAL dimensions
  const outerDiam = dimensions.outerDiameter || dimensions.diameter || 200;
  const innerDiam = dimensions.innerDiameter || (outerDiam * 0.6);
  const ringHeight = dimensions.thickness || dimensions.height || 40;

  // Available space
  const availableSize = Math.min(bounds.width, bounds.height) - 100;
  const scale = Math.min(availableSize / outerDiam, 1.2) * 0.45;

  const outerR = (outerDiam / 2) * scale;
  const innerR = (innerDiam / 2) * scale;
  const h = ringHeight * scale;
  
  // Tilt parameters (ring tilted 45° to the right like Rafael)
  const tiltAngle = Math.PI / 6; // 30 degrees tilt
  const ellipseRatio = 0.4;

  // Position
  const cx = centerX;
  const cy = centerY;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (far side) - TOP of ring, dashed (hidden lines)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  
  // Back outer ellipse - full ellipse at top
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, outerR, outerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Back inner ellipse - full ellipse at top (hole at top)
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, innerR, innerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE WALLS - connecting front and back ellipses
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  
  // Left outer edge
  ctx.beginPath();
  ctx.moveTo(cx - outerR, cy);
  ctx.lineTo(cx - outerR, cy - h);
  ctx.stroke();
  
  // Right outer edge
  ctx.beginPath();
  ctx.moveTo(cx + outerR, cy);
  ctx.lineTo(cx + outerR, cy - h);
  ctx.stroke();

  // Left inner edge
  ctx.beginPath();
  ctx.moveTo(cx - innerR, cy);
  ctx.lineTo(cx - innerR, cy - h);
  ctx.stroke();

  // Right inner edge
  ctx.beginPath();
  ctx.moveTo(cx + innerR, cy);
  ctx.lineTo(cx + innerR, cy - h);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSE (visible - solid)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  
  // Front outer ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerR, outerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Front inner ellipse (hole)
  ctx.beginPath();
  ctx.ellipse(cx, cy, innerR, innerR * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline through front
  ctx.beginPath();
  ctx.moveTo(cx - outerR - 40, cy);
  ctx.lineTo(cx + outerR + 80, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - outerR * ellipseRatio - 30);
  ctx.lineTo(cx, cy + outerR * ellipseRatio + 25);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS with PROBE SQUARES
  // ═══════════════════════════════════════════════════════════════════
  
  // Left probe square
  const leftProbeX = cx - outerR - 55;
  const leftProbeY = cy;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  ctx.strokeRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  
  // Arrow from left probe to ring (horizontal)
  ctx.beginPath();
  ctx.moveTo(leftProbeX + 5, leftProbeY);
  ctx.lineTo(cx - outerR - 5, cy);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(cx - outerR - 5, cy);
  ctx.lineTo(cx - outerR - 12, cy - 4);
  ctx.lineTo(cx - outerR - 12, cy + 4);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Top probe square
  const topProbeX = cx;
  const topProbeY = cy - h - outerR * ellipseRatio - 45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(topProbeX - 5, topProbeY - 5, 10, 10);
  ctx.strokeRect(topProbeX - 5, topProbeY - 5, 10, 10);
  
  // Arrow from top probe to ring (vertical) - with double head
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(topProbeX, topProbeY + 5);
  ctx.lineTo(topProbeX, cy - h - outerR * ellipseRatio - 5);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(topProbeX, cy - h - outerR * ellipseRatio - 5);
  ctx.lineTo(topProbeX - 4, cy - h - outerR * ellipseRatio - 12);
  ctx.lineTo(topProbeX + 4, cy - h - outerR * ellipseRatio - 12);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Angle beam triangle marker (hollow)
  const triX = cx + 30;
  const triY = cy - h - outerR * ellipseRatio - 40;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(triX, triY + 10);
  ctx.lineTo(triX - 7, triY - 5);
  ctx.lineTo(triX + 7, triY - 5);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // "Ring" LABEL - underlined, on the right
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  const labelX = cx + outerR + 30;
  const labelY = cy;
  ctx.fillText('Ring', labelX, labelY);
  
  // Underline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX, labelY + 3);
  ctx.lineTo(labelX + 35, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE ISOMETRIC 3D DISK
 * EXACTLY like the Rafael 5036 spec:
 * - 3D isometric disk (solid short cylinder)
 * - Dashed centerlines
 * - Scan direction arrows
 * - "Disk" label on the right
 * 
 * SMART SCALING: Always fits inside bounds, no matter the dimensions
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D DISK
 * Like Rafael 5036 - tilted view with probe squares and arrows from side/top
 */
function drawIsometricDisk(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get REAL dimensions
  const diameter = dimensions.diameter || 200;
  const diskHeight = dimensions.thickness || dimensions.height || 40;

  // Available space
  const availableSize = Math.min(bounds.width, bounds.height) - 100;
  const scale = Math.min(availableSize / diameter, 1.2) * 0.5;

  const r = (diameter / 2) * scale;
  const h = diskHeight * scale;
  const ellipseRatio = 0.4;

  // Position
  const cx = centerX;
  const cy = centerY;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (far side - dashed) - TOP surface
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.ellipse(cx, cy - h, r, r * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE WALLS - connecting front and back
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  
  // Left edge
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx - r, cy - h);
  ctx.stroke();
  
  // Right edge
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + r, cy - h);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSE (solid)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - r - 40, cy);
  ctx.lineTo(cx + r + 80, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - r * ellipseRatio - 30);
  ctx.lineTo(cx, cy + r * ellipseRatio + 25);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS with PROBE SQUARES
  // ═══════════════════════════════════════════════════════════════════
  
  // Left probe square
  const leftProbeX = cx - r - 55;
  const leftProbeY = cy;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  ctx.strokeRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  
  // Arrow from left probe (horizontal)
  ctx.beginPath();
  ctx.moveTo(leftProbeX + 5, leftProbeY);
  ctx.lineTo(cx - r - 5, cy);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(cx - r - 5, cy);
  ctx.lineTo(cx - r - 12, cy - 4);
  ctx.lineTo(cx - r - 12, cy + 4);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Top probe square
  const topProbeX = cx;
  const topProbeY = cy - h - r * ellipseRatio - 45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(topProbeX - 5, topProbeY - 5, 10, 10);
  ctx.strokeRect(topProbeX - 5, topProbeY - 5, 10, 10);
  
  // Arrow from top probe (vertical)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(topProbeX, topProbeY + 5);
  ctx.lineTo(topProbeX, cy - h - r * ellipseRatio - 5);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(topProbeX, cy - h - r * ellipseRatio - 5);
  ctx.lineTo(topProbeX - 4, cy - h - r * ellipseRatio - 12);
  ctx.lineTo(topProbeX + 4, cy - h - r * ellipseRatio - 12);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Angle beam triangle marker (hollow)
  const triX = cx + 30;
  const triY = cy - h - r * ellipseRatio - 40;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(triX, triY + 10);
  ctx.lineTo(triX - 7, triY - 5);
  ctx.lineTo(triX + 7, triY - 5);
  ctx.closePath();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // "Disk" LABEL - underlined, on the right
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  const labelX = cx + r + 30;
  const labelY = cy;
  ctx.fillText('Disk', labelX, labelY);
  
  // Underline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX, labelY + 3);
  ctx.lineTo(labelX + 30, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw plate cross-section with hatching
 */
/**
 * Draw RAFAEL-STYLE 3D ISOMETRIC PLATE
 * Like Rafael 5036 spec - 3D box with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
function drawPlateCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const plateLength = dimensions.length || dimensions.width || 200;
  const plateWidth = dimensions.width || 100;
  const plateThickness = dimensions.thickness || dimensions.height || 25;

  // Isometric angles
  const isoAngle = Math.PI / 6; // 30 degrees
  const cosA = Math.cos(isoAngle);
  const sinA = Math.sin(isoAngle);

  // Calculate visual footprint for isometric view
  const arrowSpaceX = 120;
  const arrowSpaceY = 100;
  const availableWidth = bounds.width - arrowSpaceX;
  const availableHeight = bounds.height - arrowSpaceY;

  // Isometric projection dimensions
  const visualWidth = plateLength * cosA + plateWidth * cosA;
  const visualHeight = plateLength * sinA + plateWidth * sinA + plateThickness;

  // Smart scaling
  const scaleX = availableWidth / visualWidth;
  const scaleY = availableHeight / visualHeight;
  const scale = Math.min(scaleX, scaleY, 1.2) * 0.7;

  const len = plateLength * scale;
  const wid = plateWidth * scale;
  const thick = plateThickness * scale;

  // Center position (shifted left for label)
  const cx = centerX - 20;
  const cy = centerY + 10;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;

  // ═══════════════════════════════════════════════════════════════════
  // Draw 3D ISOMETRIC BOX (Plate)
  // ═══════════════════════════════════════════════════════════════════
  
  // Calculate vertices
  // Front-bottom-left corner
  const frontBottomLeft = { x: cx - len * cosA / 2, y: cy + len * sinA / 2 };
  
  // Front face (visible)
  const frontTopLeft = { x: frontBottomLeft.x, y: frontBottomLeft.y - thick };
  const frontBottomRight = { x: frontBottomLeft.x + len * cosA, y: frontBottomLeft.y - len * sinA };
  const frontTopRight = { x: frontBottomRight.x, y: frontBottomRight.y - thick };
  
  // Back face (going to back-right)
  const backBottomRight = { x: frontBottomRight.x + wid * cosA, y: frontBottomRight.y + wid * sinA };
  const backTopRight = { x: backBottomRight.x, y: backBottomRight.y - thick };
  const backBottomLeft = { x: frontBottomLeft.x + wid * cosA, y: frontBottomLeft.y + wid * sinA };
  const backTopLeft = { x: backBottomLeft.x, y: backBottomLeft.y - thick };

  // BOTTOM FACE (partial - hidden lines could be dashed)
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(frontBottomLeft.x, frontBottomLeft.y);
  ctx.lineTo(backBottomLeft.x, backBottomLeft.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // FRONT FACE
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frontBottomLeft.x, frontBottomLeft.y);
  ctx.lineTo(frontBottomRight.x, frontBottomRight.y);
  ctx.lineTo(frontTopRight.x, frontTopRight.y);
  ctx.lineTo(frontTopLeft.x, frontTopLeft.y);
  ctx.closePath();
  ctx.stroke();

  // TOP FACE
  ctx.beginPath();
  ctx.moveTo(frontTopLeft.x, frontTopLeft.y);
  ctx.lineTo(frontTopRight.x, frontTopRight.y);
  ctx.lineTo(backTopRight.x, backTopRight.y);
  ctx.lineTo(backTopLeft.x, backTopLeft.y);
  ctx.closePath();
  ctx.stroke();

  // RIGHT FACE
  ctx.beginPath();
  ctx.moveTo(frontBottomRight.x, frontBottomRight.y);
  ctx.lineTo(backBottomRight.x, backBottomRight.y);
  ctx.lineTo(backTopRight.x, backTopRight.y);
  ctx.lineTo(frontTopRight.x, frontTopRight.y);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline (through the top face center)
  const topCenterY = (frontTopLeft.y + backTopRight.y) / 2;
  const topCenterX = (frontTopLeft.x + backTopRight.x) / 2;
  ctx.beginPath();
  ctx.moveTo(frontTopLeft.x - 40, topCenterY);
  ctx.lineTo(backTopRight.x + 40, topCenterY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS with PROBE SQUARES (from side and top)
  // ═══════════════════════════════════════════════════════════════════
  
  // Left probe square (horizontal arrow)
  const leftProbeX = frontBottomLeft.x - 50;
  const leftProbeY = (frontBottomLeft.y + frontTopLeft.y) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.fillRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  ctx.strokeRect(leftProbeX - 5, leftProbeY - 5, 10, 10);
  
  // Arrow from left probe (horizontal)
  ctx.beginPath();
  ctx.moveTo(leftProbeX + 5, leftProbeY);
  ctx.lineTo(frontBottomLeft.x - 5, leftProbeY);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(frontBottomLeft.x - 5, leftProbeY);
  ctx.lineTo(frontBottomLeft.x - 12, leftProbeY - 4);
  ctx.lineTo(frontBottomLeft.x - 12, leftProbeY + 4);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Top probe squares (vertical arrows - two of them for "straight beam")
  const topProbe1X = (frontTopLeft.x + frontTopRight.x) / 2 - 15;
  const topProbe1Y = Math.min(frontTopLeft.y, frontTopRight.y) - 50;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(topProbe1X - 5, topProbe1Y - 5, 10, 10);
  ctx.strokeRect(topProbe1X - 5, topProbe1Y - 5, 10, 10);
  
  const topProbe2X = topProbe1X + 30;
  const topProbe2Y = topProbe1Y;
  ctx.fillRect(topProbe2X - 5, topProbe2Y - 5, 10, 10);
  ctx.strokeRect(topProbe2X - 5, topProbe2Y - 5, 10, 10);
  
  // Arrows from top probes (vertical - double headed for straight beam)
  const topTargetY = Math.min(frontTopLeft.y, frontTopRight.y) - 5;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  
  // Arrow 1
  ctx.beginPath();
  ctx.moveTo(topProbe1X, topProbe1Y + 5);
  ctx.lineTo(topProbe1X, topTargetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(topProbe1X, topTargetY);
  ctx.lineTo(topProbe1X - 4, topTargetY - 7);
  ctx.lineTo(topProbe1X + 4, topTargetY - 7);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  
  // Arrow 2
  ctx.beginPath();
  ctx.moveTo(topProbe2X, topProbe2Y + 5);
  ctx.lineTo(topProbe2X, topTargetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(topProbe2X, topTargetY);
  ctx.lineTo(topProbe2X - 4, topTargetY - 7);
  ctx.lineTo(topProbe2X + 4, topTargetY - 7);
  ctx.closePath();
  ctx.fill();

  // Note "(1)" for special case
  ctx.font = '12px Arial';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.fillText('(1)', topProbe1X - 20, topProbe1Y + 15);

  // ═══════════════════════════════════════════════════════════════════
  // "Plate" LABEL - underlined, on top
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  const labelX = (frontTopLeft.x + backTopRight.x) / 2;
  const labelY = Math.min(frontTopLeft.y, frontTopRight.y) - 70;
  ctx.fillText('Plate', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Plate').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D FORGING
 * Generic irregular forging with scan arrows
 * SMART SCALING: Always fits inside bounds
 */
function drawForgingCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Smart scaling
  const arrowSpace = 100;
  const availableWidth = bounds.width - arrowSpace;
  const availableHeight = bounds.height - arrowSpace;
  
  const width = Math.min(availableWidth * 0.6, 250);
  const height = Math.min(availableHeight * 0.55, 180);

  // Shift left for label
  const cx = centerX - 20;
  const cy = centerY;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#f8fafc';

  // ═══════════════════════════════════════════════════════════════════
  // IRREGULAR FORGING SHAPE (rounded rectangle - 3D effect)
  // ═══════════════════════════════════════════════════════════════════
  const cornerRadius = 20;
  
  // Main shape path
  ctx.beginPath();
  ctx.moveTo(cx - width/2 + cornerRadius, cy - height/2);
  ctx.lineTo(cx + width/2 - cornerRadius, cy - height/2);
  ctx.quadraticCurveTo(cx + width/2, cy - height/2, cx + width/2, cy - height/2 + cornerRadius);
  ctx.lineTo(cx + width/2, cy + height/2 - cornerRadius);
  ctx.quadraticCurveTo(cx + width/2, cy + height/2, cx + width/2 - cornerRadius, cy + height/2);
  ctx.lineTo(cx - width/2 + cornerRadius, cy + height/2);
  ctx.quadraticCurveTo(cx - width/2, cy + height/2, cx - width/2, cy + height/2 - cornerRadius);
  ctx.lineTo(cx - width/2, cy - height/2 + cornerRadius);
  ctx.quadraticCurveTo(cx - width/2, cy - height/2, cx - width/2 + cornerRadius, cy - height/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - width/2 - 40, cy);
  ctx.lineTo(cx + width/2 + 40, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - height/2 - 35);
  ctx.lineTo(cx, cy + height/2 + 35);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - width/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - height/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + width/3, cy - height/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Forging" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + height/2 + 50;
  ctx.fillText('Forging', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Forging').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE I-BEAM PROFILE
 * 3D isometric I-beam with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D I-BEAM
 * Like Rafael 5036 - tilted at 45° with I cross-section at front
 */
function drawIBeamCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const flangeWidth = dimensions.flangeWidth || 100;
  const flangeThickness = dimensions.flangeThickness || 12;
  const webThickness = dimensions.webThickness || 8;
  const profileHeight = dimensions.profileHeight || dimensions.height || 200;
  const profileLength = dimensions.length || 150;

  // Available space
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(flangeWidth, profileHeight, profileLength * 0.7), 0.9);

  const fw = flangeWidth * scale * 0.7;
  const ft = flangeThickness * scale;
  const wt = webThickness * scale;
  const ph = profileHeight * scale * 0.7;
  const length = profileLength * scale * 0.4;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 15;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK I-PROFILE (far end) - dashed
  // ═══════════════════════════════════════════════════════════════════
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  
  // Back I-shape (simplified)
  ctx.beginPath();
  ctx.moveTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.moveTo(backX - fw/2 * 0.6, backY + ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY + ph/2);
  ctx.moveTo(backX, backY - ph/2);
  ctx.lineTo(backX, backY + ph/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // CONNECTING EDGES (top and bottom flanges)
  // ═══════════════════════════════════════════════════════════════════
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e293b';
  
  // Top flange edges
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  
  // Bottom flange edges
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY + ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY + ph/2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT I-PROFILE (cross-section) - fully visible
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  
  ctx.beginPath();
  // Top flange
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(cx + fw/2, cy - ph/2 + ft);
  ctx.lineTo(cx + wt/2, cy - ph/2 + ft);
  // Web right side
  ctx.lineTo(cx + wt/2, cy + ph/2 - ft);
  // Bottom flange right
  ctx.lineTo(cx + fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(cx - fw/2, cy + ph/2 - ft);
  ctx.lineTo(cx - wt/2, cy + ph/2 - ft);
  // Web left side
  ctx.lineTo(cx - wt/2, cy - ph/2 + ft);
  ctx.lineTo(cx - fw/2, cy - ph/2 + ft);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 25, cy);
  ctx.lineTo(cx + fw/2 + 25, cy);
  ctx.stroke();
  
  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 25);
  ctx.lineTo(cx, cy + ph/2 + 25);
  ctx.stroke();
  
  // Diagonal centerline
  ctx.beginPath();
  ctx.moveTo(cx + 25 * cos45, cy + 25 * sin45);
  ctx.lineTo(backX - 35 * cos45, backY - 35 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - fw/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - ph/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + fw/3, cy - ph/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "I-Profile" LABEL - underlined, bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + ph/2 + 40;
  ctx.fillText('I-Profile', labelX, labelY);
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - 35, labelY + 3);
  ctx.lineTo(labelX + 35, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE TILTED 3D U-CHANNEL
 * Like Rafael 5036 - tilted at 45° with U cross-section at front
 */
function drawUChannelCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const profileHeight = dimensions.profileHeight || dimensions.height || 100;
  const flangeWidth = dimensions.flangeWidth || 50;
  const webThickness = dimensions.webThickness || 6;
  const flangeThickness = dimensions.flangeThickness || 8;
  const profileLength = dimensions.length || 120;

  // Available space
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(flangeWidth, profileHeight, profileLength * 0.7), 0.8);

  const ph = profileHeight * scale * 0.6;
  const fw = flangeWidth * scale * 0.6;
  const wt = webThickness * scale;
  const ft = flangeThickness * scale;
  const length = profileLength * scale * 0.35;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  const cx = centerX;
  const cy = centerY + 15;

  ctx.save();

  // Back U-shape (dashed)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY + ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY + ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Connecting edges
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy + ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY + ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy + ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY + ph/2);
  ctx.stroke();

  // Front U-shape
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
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
  ctx.fill();
  ctx.stroke();

  // Centerlines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 25, cy);
  ctx.lineTo(cx + fw/2 + 25, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 25);
  ctx.lineTo(cx, cy + ph/2 + 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - fw/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - ph/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + fw/3, cy - ph/2 - 45);

  // Label
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('U-Channel', cx, cy + ph/2 + 38);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + ph/2 + 41);
  ctx.lineTo(cx + 40, cy + ph/2 + 41);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE TILTED 3D L-ANGLE
 * Like Rafael 5036 - tilted at 45° with L cross-section at front
 */
function drawLAngleCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  const leg1 = dimensions.leg1 || 60;
  const leg2 = dimensions.leg2 || 50;
  const thickness = dimensions.thickness || 6;
  const profileLength = dimensions.length || 100;

  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(leg1, leg2, profileLength * 0.7), 1.0);

  const l1 = leg1 * scale * 0.6;
  const l2 = leg2 * scale * 0.6;
  const t = Math.max(thickness * scale, 4);
  const length = profileLength * scale * 0.35;

  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  const cx = centerX;
  const cy = centerY + 15;

  ctx.save();

  // Back L-shape (dashed)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(backX - t/2 * 0.6, backY + l2/2);
  ctx.lineTo(backX - t/2 * 0.6, backY - l2/2);
  ctx.lineTo(backX + l1/2 * 0.6, backY - l2/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Connecting edges
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy - l2/2);
  ctx.lineTo(backX - t/2 * 0.6, backY - l2/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(backX + l1/2 * 0.6, backY - l2/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy + l2/2);
  ctx.lineTo(backX - t/2 * 0.6, backY + l2/2);
  ctx.stroke();

  // Front L-shape
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - t/2, cy + l2/2);
  ctx.lineTo(cx - t/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2);
  ctx.lineTo(cx + l1/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy - l2/2 + t);
  ctx.lineTo(cx + t/2, cy + l2/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Centerlines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - l2/2 - 25);
  ctx.lineTo(cx, cy + l2/2 + 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - t/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - l2/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + l1/3, cy - l2/2 - 45);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('L-Angle', cx, cy + l2/2 + 38);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy + l2/2 + 41);
  ctx.lineTo(cx + 32, cy + l2/2 + 41);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE TILTED 3D T-SECTION
 * Like Rafael 5036 - tilted at 45° with T cross-section at front
 */
function drawTSectionCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  const flangeWidth = dimensions.flangeWidth || 80;
  const flangeThickness = dimensions.flangeThickness || 10;
  const webThickness = dimensions.webThickness || 8;
  const profileHeight = dimensions.profileHeight || dimensions.height || 100;
  const profileLength = dimensions.length || 120;

  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(flangeWidth, profileHeight, profileLength * 0.7), 0.8);

  const fw = flangeWidth * scale * 0.6;
  const ft = Math.max(flangeThickness * scale, 4);
  const wt = Math.max(webThickness * scale, 3);
  const ph = profileHeight * scale * 0.6;
  const length = profileLength * scale * 0.35;

  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  const cx = centerX;
  const cy = centerY + 15;

  ctx.save();

  // Back T-shape (dashed)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.moveTo(backX, backY - ph/2);
  ctx.lineTo(backX, backY + ph/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Connecting edges
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - fw/2, cy - ph/2);
  ctx.lineTo(backX - fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw/2, cy - ph/2);
  ctx.lineTo(backX + fw/2 * 0.6, backY - ph/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + ph/2);
  ctx.lineTo(backX, backY + ph/2);
  ctx.stroke();

  // Front T-shape
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
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
  ctx.fill();
  ctx.stroke();

  // Centerlines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - ph/2 - 25);
  ctx.lineTo(cx, cy + ph/2 + 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - fw/2 - 20, cy - ph/2 + ft/2);
  ctx.lineTo(cx + fw/2 + 20, cy - ph/2 + ft/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - fw/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - ph/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + fw/3, cy - ph/2 - 45);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('T-Section', cx, cy + ph/2 + 38);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + ph/2 + 41);
  ctx.lineTo(cx + 38, cy + ph/2 + 41);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D SPHERE
 * 3D shaded sphere with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE 3D SPHERE
 * Sphere with gradient shading and diagonal scan arrows
 * SMART SCALING: Always fits inside bounds
 */
function drawSphereCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Smart scaling - use available space directly
  const availableSize = Math.min(bounds.width, bounds.height);
  
  // Sphere fills 50% of available space
  const radius = availableSize * 0.22;

  // Position (shifted for arrows)
  const cx = centerX - 20;
  const cy = centerY + 10;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;

  // ═══════════════════════════════════════════════════════════════════
  // 3D SPHERE with gradient shading
  // ═══════════════════════════════════════════════════════════════════
  
  // Create 3D-looking gradient
  const gradient = ctx.createRadialGradient(
    cx - radius * 0.3, cy - radius * 0.3, 0, 
    cx, cy, radius
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#e2e8f0');
  gradient.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner ring (equator line - gives 3D effect)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - radius - 40, cy);
  ctx.lineTo(cx + radius + 40, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 40);
  ctx.lineTo(cx, cy + radius + 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - radius - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - radius - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + radius * 0.7, cy - radius - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Sphere" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + radius + 50;
  ctx.fillText('Sphere', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Sphere').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE HEXAGON BAR PROFILE
 * 3D hexagon with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D HEXAGON BAR
 * Like Rafael 5036 - tilted at 45° with hexagon cross-section at front
 */
function drawHexagonCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get dimensions
  const acrossFlats = dimensions.acrossFlats || dimensions.width || 50;
  const hexLength = dimensions.length || dimensions.height || 150;
  
  // Available space
  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(acrossFlats, hexLength * 0.7), 1.2);

  const radius = (acrossFlats / 2) * scale * 0.8; // Circumradius
  const length = hexLength * scale * 0.5;

  // Tilt angle (45 degrees)
  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  // Center position
  const cx = centerX;
  const cy = centerY + 20;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK HEXAGON (far end) - dashed/hidden
  // ═══════════════════════════════════════════════════════════════════
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = backX + radius * Math.cos(a) * 0.6;
    const y = backY + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // SIDE EDGES - connecting front and back hexagons (only visible edges)
  // ═══════════════════════════════════════════════════════════════════
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e293b';
  
  // Top edge
  const frontTopY = cy - radius;
  const backTopY = backY - radius;
  ctx.beginPath();
  ctx.moveTo(cx, frontTopY);
  ctx.lineTo(backX, backTopY);
  ctx.stroke();
  
  // Bottom edge
  ctx.beginPath();
  ctx.moveTo(cx, cy + radius);
  ctx.lineTo(backX, backY + radius);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // FRONT HEXAGON (cross-section) - fully visible
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal through front
  ctx.beginPath();
  ctx.moveTo(cx - radius - 30, cy);
  ctx.lineTo(cx + radius + 30, cy);
  ctx.stroke();
  
  // Vertical through front
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 30);
  ctx.lineTo(cx, cy + radius + 30);
  ctx.stroke();
  
  // Diagonal centerline through length
  ctx.beginPath();
  ctx.moveTo(cx + 30 * cos45, cy + 30 * sin45);
  ctx.lineTo(backX - 40 * cos45, backY - 40 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - radius - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - radius - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + radius * 0.7, cy - radius - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Hex Bar" LABEL - underlined, bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + radius + 45;
  ctx.fillText('Hex Bar', labelX, labelY);
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - 30, labelY + 3);
  ctx.lineTo(labelX + 30, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D CONE
 * Isometric cone with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE 3D CONE
 * Cone with isometric base ellipse and diagonal scan arrows
 * SMART SCALING: Always fits inside bounds
 */
function drawConeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const bottomDiam = dimensions.bottomDiameter || dimensions.diameter || 80;
  const coneHeight = dimensions.height || dimensions.length || 120;

  // Smart scaling
  const availableSize = Math.min(bounds.width, bounds.height);
  
  const scale = Math.min(
    availableSize / (Math.max(bottomDiam, coneHeight) + 100),
    1.0
  ) * 0.45;

  const bd = bottomDiam * scale;
  const h = coneHeight * scale;

  // Position (shifted for 3D effect)
  const cx = centerX - 15;
  const cy = centerY + 10;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#f8fafc';

  // ═══════════════════════════════════════════════════════════════════
  // 3D CONE (isometric with ellipse base)
  // ═══════════════════════════════════════════════════════════════════
  
  // Ellipse ratio for 3D effect
  const ellipseRatio = 0.3;
  
  // Fill cone body
  ctx.beginPath();
  ctx.moveTo(cx - bd/2, cy + h/2);
  ctx.lineTo(cx, cy - h/2); // apex
  ctx.lineTo(cx + bd/2, cy + h/2);
  ctx.closePath();
  ctx.fill();
  
  // Draw base ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy + h/2, bd/2, bd/2 * ellipseRatio, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw cone sides
  ctx.beginPath();
  ctx.moveTo(cx - bd/2, cy + h/2);
  ctx.lineTo(cx, cy - h/2); // apex
  ctx.lineTo(cx + bd/2, cy + h/2);
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Vertical centerline (through apex)
  ctx.beginPath();
  ctx.moveTo(cx, cy - h/2 - 40);
  ctx.lineTo(cx, cy + h/2 + bd/2 * ellipseRatio + 25);
  ctx.stroke();
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - bd/2 - 35, cy + h/2);
  ctx.lineTo(cx + bd/2 + 35, cy + h/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - bd/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - h/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + bd/3, cy - h/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Cone" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + h/2 + bd/2 * ellipseRatio + 45;
  ctx.fillText('Cone', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Cone').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
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
function drawRectangularTubeCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const outerWidth = dimensions.width || 80;
  const outerHeight = dimensions.height || dimensions.thickness || 60;
  const wallThickness = dimensions.wallThickness || 8;

  // Smart scaling
  const availableSize = Math.min(bounds.width, bounds.height);
  const scale = Math.min(
    availableSize / (Math.max(outerWidth, outerHeight) + 100),
    1.2
  ) * 0.5;

  const ow = outerWidth * scale;
  const oh = outerHeight * scale;
  const wt = Math.max(wallThickness * scale, 4);
  const iw = ow - 2 * wt;
  const ih = oh - 2 * wt;

  // Position (shifted for 3D effect)
  const cx = centerX - 25;
  const cy = centerY + 15;

  // 3D extrusion parameters (45° angle like Rafael)
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const extrusion = availableSize * 0.15;
  const backX = cx + extrusion * cos45;
  const backY = cy - extrusion * sin45;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK RECTANGULAR TUBE (lighter, at 45° offset)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  
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
  // EXTRUSION LINES connecting front to back (visible corners)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  
  // Outer corners extrusion lines
  const outerCorners = [
    { fx: cx - ow/2, fy: cy - oh/2 },  // Top-left
    { fx: cx + ow/2, fy: cy - oh/2 },  // Top-right
    { fx: cx + ow/2, fy: cy + oh/2 },  // Bottom-right
    { fx: cx - ow/2, fy: cy + oh/2 },  // Bottom-left
  ];
  
  outerCorners.forEach(corner => {
    ctx.beginPath();
    ctx.moveTo(corner.fx, corner.fy);
    ctx.lineTo(corner.fx + extrusion * cos45, corner.fy - extrusion * sin45);
    ctx.stroke();
  });

  // Inner corners extrusion lines (for the hollow part)
  const innerCorners = [
    { fx: cx - iw/2, fy: cy - ih/2 },  // Top-left
    { fx: cx + iw/2, fy: cy - ih/2 },  // Top-right
    { fx: cx + iw/2, fy: cy + ih/2 },  // Bottom-right
    { fx: cx - iw/2, fy: cy + ih/2 },  // Bottom-left
  ];
  
  innerCorners.forEach(corner => {
    ctx.beginPath();
    ctx.moveTo(corner.fx, corner.fy);
    ctx.lineTo(corner.fx + extrusion * cos45, corner.fy - extrusion * sin45);
    ctx.stroke();
  });

  // ═══════════════════════════════════════════════════════════════════
  // FRONT RECTANGULAR TUBE PROFILE (solid - main view)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#e2e8f0';
  
  // Fill outer
  ctx.fillRect(cx - ow/2, cy - oh/2, ow, oh);
  
  // Outer rectangle
  ctx.strokeRect(cx - ow/2, cy - oh/2, ow, oh);
  
  // Inner rectangle (hollow - white fill)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - iw/2, cy - ih/2, iw, ih);
  ctx.strokeRect(cx - iw/2, cy - ih/2, iw, ih);

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - ow/2 - 40, cy);
  ctx.lineTo(cx + ow/2 + 40, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - oh/2 - 40);
  ctx.lineTo(cx, cy + oh/2 + 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - ow/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - oh/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + ow/3, cy - oh/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Rect Tube" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + oh/2 + 55;
  ctx.fillText('Rect Tube', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Rect Tube').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE Z-SECTION PROFILE
 * Z-profile shape with scan arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D Z-SECTION
 * Like Rafael 5036 - tilted at 45° with Z cross-section at front
 */
function drawZSectionCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  const flangeWidth = dimensions.width || 50;
  const totalHeight = dimensions.height || 80;
  const thickness = dimensions.thickness || 8;
  const profileLength = dimensions.length || 100;

  const availableSize = Math.min(bounds.width, bounds.height) - 120;
  const scale = Math.min(availableSize / Math.max(flangeWidth * 2, totalHeight, profileLength * 0.7), 0.8);

  const fw = flangeWidth * scale * 0.5;
  const th = totalHeight * scale * 0.5;
  const t = Math.max(thickness * scale, 3);
  const length = profileLength * scale * 0.35;

  const angle = Math.PI / 4;
  const cos45 = Math.cos(angle);
  const sin45 = Math.sin(angle);

  const cx = centerX;
  const cy = centerY + 15;

  ctx.save();

  // Back Z-shape (dashed)
  const backX = cx - length * cos45;
  const backY = cy - length * sin45;
  
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  // Top flange
  ctx.moveTo(backX, backY - th/2);
  ctx.lineTo(backX + fw * 0.6, backY - th/2);
  // Web
  ctx.moveTo(backX, backY - th/2);
  ctx.lineTo(backX, backY + th/2);
  // Bottom flange
  ctx.moveTo(backX - fw * 0.6, backY + th/2);
  ctx.lineTo(backX, backY + th/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Connecting edges
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - th/2);
  ctx.lineTo(backX, backY - th/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + fw, cy - th/2);
  ctx.lineTo(backX + fw * 0.6, backY - th/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - fw, cy + th/2);
  ctx.lineTo(backX - fw * 0.6, backY + th/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + th/2);
  ctx.lineTo(backX, backY + th/2);
  ctx.stroke();

  // Front Z-shape
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  
  // Top flange
  ctx.fillRect(cx, cy - th/2, fw, t);
  ctx.strokeRect(cx, cy - th/2, fw, t);
  
  // Web
  ctx.fillRect(cx - t/2, cy - th/2 + t, t, th - 2*t);
  ctx.strokeRect(cx - t/2, cy - th/2 + t, t, th - 2*t);
  
  // Bottom flange
  ctx.fillRect(cx - fw, cy + th/2 - t, fw, t);
  ctx.strokeRect(cx - fw, cy + th/2 - t, fw, t);

  // Centerlines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - th/2 - 25);
  ctx.lineTo(cx, cy + th/2 + 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 20 * cos45, cy + 20 * sin45);
  ctx.lineTo(backX - 30 * cos45, backY - 30 * sin45);
  ctx.stroke();
  ctx.setLineDash([]);

  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - fw - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - th/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + fw/3, cy - th/2 - 45);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Z-Section', cx, cy + th/2 + 38);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + th/2 + 41);
  ctx.lineTo(cx + 38, cy + th/2 + 41);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE 3D PYRAMID
 * Isometric pyramid with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE 3D PYRAMID
 * Pyramid with perspective lines and diagonal scan arrows
 * SMART SCALING: Always fits inside bounds
 */
function drawPyramidCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const baseWidth = dimensions.width || dimensions.diameter || 80;
  const pyramidHeight = dimensions.height || dimensions.length || 120;

  // Smart scaling
  const availableSize = Math.min(bounds.width, bounds.height);
  
  const scale = Math.min(
    availableSize / (Math.max(baseWidth, pyramidHeight) + 100),
    1.0
  ) * 0.45;

  const bw = baseWidth * scale;
  const h = pyramidHeight * scale;

  // Position (shifted for 3D effect)
  const cx = centerX - 15;
  const cy = centerY + 10;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#f8fafc';

  // ═══════════════════════════════════════════════════════════════════
  // 3D PYRAMID (triangle with perspective lines)
  // ═══════════════════════════════════════════════════════════════════
  
  // Front face (triangle)
  ctx.beginPath();
  ctx.moveTo(cx - bw/2, cy + h/2); // Bottom left
  ctx.lineTo(cx + bw/2, cy + h/2); // Bottom right
  ctx.lineTo(cx, cy - h/2); // Apex
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Back edge (dashed for hidden line - gives 3D effect)
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy + h/2); // Bottom center
  ctx.lineTo(cx, cy - h/2); // Apex
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Vertical centerline (through apex)
  ctx.beginPath();
  ctx.moveTo(cx, cy - h/2 - 40);
  ctx.lineTo(cx, cy + h/2 + 30);
  ctx.stroke();
  
  // Horizontal centerline (through base)
  ctx.beginPath();
  ctx.moveTo(cx - bw/2 - 35, cy + h/2);
  ctx.lineTo(cx + bw/2 + 35, cy + h/2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - bw/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - h/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + bw/3, cy - h/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Pyramid" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + h/2 + 50;
  ctx.fillText('Pyramid', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Pyramid').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE ELLIPSE/OVAL PROFILE
 * Ellipse cross-section with scan direction arrows
 * SMART SCALING: Always fits inside bounds
 */
/**
 * Draw RAFAEL-STYLE TILTED 3D ELLIPSE BAR
 * Like Rafael 5036 - tilted at 45° with ellipse cross-section at front
 */
function drawEllipseCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const majorAxis = dimensions.width || dimensions.diameter || 100;
  const minorAxis = dimensions.height || dimensions.thickness || 60;

  // Smart scaling
  const availableSize = Math.min(bounds.width, bounds.height);
  
  const scale = Math.min(
    availableSize / (Math.max(majorAxis, minorAxis) + 100),
    1.0
  ) * 0.4;

  const ma = majorAxis * scale;
  const mi = minorAxis * scale;

  // Position (shifted for 3D effect)
  const cx = centerX - 20;
  const cy = centerY + 12;

  // 3D extrusion parameters (45° angle like Rafael)
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const extrusion = availableSize * 0.15;
  const backX = cx + extrusion * cos45;
  const backY = cy - extrusion * sin45;

  ctx.save();

  // ═══════════════════════════════════════════════════════════════════
  // BACK ELLIPSE (lighter, at 45° offset)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.ellipse(backX, backY, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // EXTRUSION LINES connecting front to back ellipse (visible edges)
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  
  // Draw connection lines at key points around the ellipse
  const anglePoints = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
  anglePoints.forEach(angle => {
    const fx = cx + (ma/2) * Math.cos(angle);
    const fy = cy + (mi/2) * Math.sin(angle);
    const bx = backX + (ma/2) * Math.cos(angle);
    const by = backY + (mi/2) * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(bx, by);
    ctx.stroke();
  });

  // ═══════════════════════════════════════════════════════════════════
  // FRONT ELLIPSE PROFILE with gradient (solid - main view)
  // ═══════════════════════════════════════════════════════════════════
  
  // Create subtle gradient for 3D effect
  const gradient = ctx.createRadialGradient(
    cx - ma * 0.15, cy - mi * 0.15, 0,
    cx, cy, ma / 2
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.7, '#f1f5f9');
  gradient.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ma/2, mi/2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline (major axis)
  ctx.beginPath();
  ctx.moveTo(cx - ma/2 - 40, cy);
  ctx.lineTo(cx + ma/2 + 40, cy);
  ctx.stroke();
  
  // Vertical centerline (minor axis)
  ctx.beginPath();
  ctx.moveTo(cx, cy - mi/2 - 40);
  ctx.lineTo(cx, cy + mi/2 + 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - ma/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - mi/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + ma/3, cy - mi/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Ellipse" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + mi/2 + 50;
  ctx.fillText('Ellipse', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Ellipse').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw RAFAEL-STYLE CUSTOM/IRREGULAR SHAPE
 * Generic shape with scan direction arrows for any custom part
 * SMART SCALING: Always fits inside bounds
 */
function drawCustomCrossSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bounds: DrawBounds,
  dimensions: DrawDimensions
) {
  // Get real dimensions
  const width = dimensions.width || 100;
  const height = dimensions.height || 80;

  // Smart scaling
  const arrowSpace = 120;
  const availableWidth = bounds.width - arrowSpace;
  const availableHeight = bounds.height - arrowSpace;
  
  const scale = Math.min(
    availableWidth / (width + 60),
    availableHeight / (height + 60),
    1.3
  ) * 0.6;

  const w = width * scale;
  const h = height * scale;

  // Position (shifted left for label)
  const cx = centerX - 20;
  const cy = centerY;

  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#f8fafc';

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOM SHAPE (organic rounded form to indicate "any shape")
  // ═══════════════════════════════════════════════════════════════════
  
  const x = cx - w/2;
  const y = cy - h/2;
  const r = Math.min(w, h) * 0.15;

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
  ctx.stroke();

  // "Custom" text inside
  ctx.font = 'italic 12px Arial';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Custom', cx, cy);

  // ═══════════════════════════════════════════════════════════════════
  // CENTERLINES (dashed) - Rafael style
  // ═══════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 4, 3, 4]);
  
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx - w/2 - 45, cy);
  ctx.lineTo(cx + w/2 + 45, cy);
  ctx.stroke();
  
  // Vertical centerline
  ctx.beginPath();
  ctx.moveTo(cx, cy - h/2 - 45);
  ctx.lineTo(cx, cy + h/2 + 45);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══════════════════════════════════════════════════════════════════
  // RAFAEL-STYLE ARROWS - from LEFT and TOP with PROBES
  // ═══════════════════════════════════════════════════════════════════
  const probeSize = 10;
  
  // Arrow from LEFT with probe square
  const probeLeftX = cx - w/2 - 55;
  const probeLeftY = cy;
  drawRafaelScanArrow(ctx, probeLeftX, probeLeftY, 'right');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeLeftX - probeSize/2, probeLeftY - probeSize/2, probeSize, probeSize);
  
  // Arrow from TOP with probe square
  const probeTopX = cx;
  const probeTopY = cy - h/2 - 55;
  drawRafaelScanArrow(ctx, probeTopX, probeTopY, 'down');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  ctx.strokeRect(probeTopX - probeSize/2, probeTopY - probeSize/2, probeSize, probeSize);
  
  // Angle beam triangle marker
  drawRafaelAngleBeamArrow(ctx, cx + w/3, cy - h/2 - 45);

  // ═══════════════════════════════════════════════════════════════════
  // "Custom" LABEL - underlined, at bottom
  // ═══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const labelX = cx;
  const labelY = cy + h/2 + 55;
  ctx.fillText('Custom', labelX, labelY);
  
  // Underline
  const labelWidth = ctx.measureText('Custom').width;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(labelX - labelWidth/2, labelY + 3);
  ctx.lineTo(labelX + labelWidth/2, labelY + 3);
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
    y = centerY - plateHeight/2 - 40;  // Above the plate
    direction = 90;  // Points DOWN
    drawPerpedicularBeam(ctx, x, y, direction, beamDepth, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // B - LW 0° (Axial from Bottom): Arrow from BOTTOM going UP
  if (beamType === 'longitudinal-axial-bottom') {
    x = centerX + plateWidth * 0.3;  // Right-center position
    y = centerY + plateHeight/2 + 40;  // Below the plate
    direction = 270;  // Points UP
    drawPerpedicularBeam(ctx, x, y, direction, beamDepth, beamConfig, label, isHighlighted, animProgress);
    return;
  }

  // I - Through-Transmission (TT): Two probes - one top, one bottom
  if (beamType === 'through-transmission') {
    // Draw transmitter from top
    x = centerX;
    const yTop = centerY - plateHeight/2 - 40;
    drawPerpedicularBeam(ctx, x, yTop, 90, beamDepth, beamConfig, 'T', isHighlighted, animProgress);

    // Draw receiver at bottom (with "R" label)
    const yBottom = centerY + plateHeight/2 + 40;
    const receiverConfig = { ...beamConfig, color: '#65a30d' };  // Slightly darker lime for receiver
    drawPerpedicularBeam(ctx, x, yBottom, 270, beamDepth * 0.3, receiverConfig, 'R', false, animProgress);

    // Draw label for the combo
    ctx.fillStyle = beamConfig.color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label + ' (TT)', x, centerY - plateHeight/2 - 55);
    return;
  }

  // C - LW 0° (Radial from OD) - for plates this is from the SIDE
  if (beamType === 'longitudinal-radial') {
    x = centerX - plateWidth/2 - 40;  // Left side of plate
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
    y = centerY - plateHeight/2 - 30;

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

  y = centerY - plateHeight/2 - 40;
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

  // Label
  drawLabel(ctx, x, y - 10, label, beamConfig.color, isHighlighted);
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
