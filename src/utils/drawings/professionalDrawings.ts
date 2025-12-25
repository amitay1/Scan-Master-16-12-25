/**
 * Professional Technical Drawings for PDF Export
 * ===============================================
 * High-quality isometric 3D-style technical drawings with:
 * - Professional dimensioning (ISO standard)
 * - Isometric projections
 * - Cross-sections
 * - Material hatching
 * - Professional annotations
 */

import { jsPDF } from 'jspdf';
import type { CalibrationBlockType, PartGeometry } from '@/types/techniqueSheet';

// ============= DRAWING CONSTANTS =============
const COLORS = {
  primary: [41, 128, 185] as [number, number, number],      // Blue
  secondary: [52, 152, 219] as [number, number, number],    // Light blue
  dimension: [100, 100, 100] as [number, number, number],   // Gray
  centerLine: [150, 150, 150] as [number, number, number],  // Light gray
  hole: [180, 0, 0] as [number, number, number],            // Red for holes
  fill: [240, 240, 240] as [number, number, number],        // Light fill
  shadow: [200, 200, 200] as [number, number, number],      // Shadow
  scanArrow: [0, 150, 0] as [number, number, number],       // Green for scan direction
  highlight: [255, 200, 0] as [number, number, number],     // Yellow highlight
};

// Isometric projection helpers (30° angle)
const ISO_ANGLE = Math.PI / 6; // 30 degrees
const cos30 = Math.cos(ISO_ANGLE);
const sin30 = Math.sin(ISO_ANGLE);

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

// Convert 3D point to isometric 2D
function toIsometric(p: Point3D, centerX: number, centerY: number, scale: number = 1): Point2D {
  return {
    x: centerX + (p.x - p.z) * cos30 * scale,
    y: centerY - p.y * scale + (p.x + p.z) * sin30 * scale
  };
}

// ============= PROFESSIONAL FLAT BLOCK - ISOMETRIC 3D =============
export function drawProfessionalFlatBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    length?: number;
    width?: number;
    height?: number;
    fbhSizes?: string[];
    fbhDepths?: number[];
  }
) {
  const L = blockData?.length || 100;
  const W = blockData?.width || 50;
  const H = blockData?.height || 25;
  const scale = 0.5;

  // Block vertices in 3D
  const vertices = {
    // Front face
    frontTopLeft: { x: -L/2, y: H/2, z: -W/2 },
    frontTopRight: { x: L/2, y: H/2, z: -W/2 },
    frontBottomLeft: { x: -L/2, y: -H/2, z: -W/2 },
    frontBottomRight: { x: L/2, y: -H/2, z: -W/2 },
    // Back face
    backTopLeft: { x: -L/2, y: H/2, z: W/2 },
    backTopRight: { x: L/2, y: H/2, z: W/2 },
    backBottomLeft: { x: -L/2, y: -H/2, z: W/2 },
    backBottomRight: { x: L/2, y: -H/2, z: W/2 },
  };

  // Convert to 2D isometric
  const iso = (p: Point3D) => toIsometric(p, centerX, centerY, scale);
  const pts = {
    ftl: iso(vertices.frontTopLeft),
    ftr: iso(vertices.frontTopRight),
    fbl: iso(vertices.frontBottomLeft),
    fbr: iso(vertices.frontBottomRight),
    btl: iso(vertices.backTopLeft),
    btr: iso(vertices.backTopRight),
    bbl: iso(vertices.backBottomLeft),
    bbr: iso(vertices.backBottomRight),
  };

  // Draw shadow first
  doc.setFillColor(...COLORS.shadow);
  doc.setDrawColor(...COLORS.shadow);
  const shadowOffset = 3;
  doc.triangle(
    pts.fbl.x + shadowOffset, pts.fbl.y + shadowOffset,
    pts.fbr.x + shadowOffset, pts.fbr.y + shadowOffset,
    pts.bbr.x + shadowOffset, pts.bbr.y + shadowOffset,
    'F'
  );

  // Draw top face (lightest)
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  
  // Top face polygon
  const topFace = [pts.ftl, pts.ftr, pts.btr, pts.btl];
  doc.moveTo(topFace[0].x, topFace[0].y);
  topFace.forEach((p, i) => {
    if (i > 0) doc.lineTo(p.x, p.y);
  });
  doc.lineTo(topFace[0].x, topFace[0].y);
  doc.fill();
  
  // Stroke top face
  doc.setLineWidth(0.5);
  topFace.forEach((p, i) => {
    const next = topFace[(i + 1) % topFace.length];
    doc.line(p.x, p.y, next.x, next.y);
  });

  // Draw right face (medium shade)
  doc.setFillColor(...COLORS.fill);
  const rightFace = [pts.ftr, pts.fbr, pts.bbr, pts.btr];
  doc.moveTo(rightFace[0].x, rightFace[0].y);
  rightFace.forEach((p, i) => {
    if (i > 0) doc.lineTo(p.x, p.y);
  });
  doc.lineTo(rightFace[0].x, rightFace[0].y);
  doc.fill();
  
  rightFace.forEach((p, i) => {
    const next = rightFace[(i + 1) % rightFace.length];
    doc.line(p.x, p.y, next.x, next.y);
  });

  // Draw front face (darkest visible)
  doc.setFillColor(230, 230, 230);
  const frontFace = [pts.ftl, pts.ftr, pts.fbr, pts.fbl];
  doc.moveTo(frontFace[0].x, frontFace[0].y);
  frontFace.forEach((p, i) => {
    if (i > 0) doc.lineTo(p.x, p.y);
  });
  doc.lineTo(frontFace[0].x, frontFace[0].y);
  doc.fill();
  
  frontFace.forEach((p, i) => {
    const next = frontFace[(i + 1) % frontFace.length];
    doc.line(p.x, p.y, next.x, next.y);
  });

  // Draw FBH holes on top surface (3 holes)
  const fbhSizes = blockData?.fbhSizes || ['3/64"', '5/64"', '8/64"'];
  const depths = blockData?.fbhDepths || [H * 0.4, H * 0.6, H * 0.8];
  
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);
  
  const holePositions = [-L/3, 0, L/3];
  holePositions.forEach((xPos, i) => {
    const holeCenter3D = { x: xPos, y: H/2, z: 0 };
    const hole2D = iso(holeCenter3D);
    const holeRadius = 2 + i * 0.5;
    
    // Draw hole as ellipse (isometric distortion)
    doc.ellipse(hole2D.x, hole2D.y, holeRadius * cos30, holeRadius * 0.5, 'S');
    
    // Depth indicator line
    doc.setDrawColor(...COLORS.dimension);
    doc.setLineDashPattern([1, 1], 0);
    const depthEnd = { x: xPos, y: H/2 - depths[i], z: 0 };
    const depthEnd2D = iso(depthEnd);
    doc.line(hole2D.x + holeRadius, hole2D.y, depthEnd2D.x + holeRadius, depthEnd2D.y + depths[i] * scale * 0.5);
    doc.setLineDashPattern([], 0);
  });

  // ============= PROFESSIONAL DIMENSIONS =============
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  // Length dimension (bottom)
  const dimOffset = 12;
  const dimY = pts.fbr.y + dimOffset;
  
  // Dimension line
  doc.line(pts.fbl.x, dimY, pts.fbr.x, dimY);
  // Extension lines
  doc.line(pts.fbl.x, pts.fbl.y, pts.fbl.x, dimY + 2);
  doc.line(pts.fbr.x, pts.fbr.y, pts.fbr.x, dimY + 2);
  // Arrows
  drawDimensionArrow(doc, pts.fbl.x, dimY, 'right');
  drawDimensionArrow(doc, pts.fbr.x, dimY, 'left');
  // Text
  doc.text(`L = ${L}mm`, (pts.fbl.x + pts.fbr.x) / 2, dimY + 4, { align: 'center' });

  // Height dimension (left side)
  const dimX = pts.fbl.x - dimOffset;
  doc.line(dimX, pts.ftl.y, dimX, pts.fbl.y);
  doc.line(pts.ftl.x, pts.ftl.y, dimX - 2, pts.ftl.y);
  doc.line(pts.fbl.x, pts.fbl.y, dimX - 2, pts.fbl.y);
  drawDimensionArrow(doc, dimX, pts.ftl.y, 'down');
  drawDimensionArrow(doc, dimX, pts.fbl.y, 'up');
  doc.text(`H = ${H}mm`, dimX - 3, (pts.ftl.y + pts.fbl.y) / 2, { angle: 90, align: 'center' });

  // Width dimension (top-right, isometric)
  const widthStart = { x: L/2, y: H/2, z: -W/2 };
  const widthEnd = { x: L/2, y: H/2, z: W/2 };
  const ws2D = iso(widthStart);
  const we2D = iso(widthEnd);
  const wDimOffset = { x: 8, y: -5 };
  
  doc.line(ws2D.x + wDimOffset.x, ws2D.y + wDimOffset.y, we2D.x + wDimOffset.x, we2D.y + wDimOffset.y);
  doc.line(ws2D.x, ws2D.y, ws2D.x + wDimOffset.x + 2, ws2D.y + wDimOffset.y);
  doc.line(we2D.x, we2D.y, we2D.x + wDimOffset.x + 2, we2D.y + wDimOffset.y);
  doc.text(`W = ${W}mm`, (ws2D.x + we2D.x) / 2 + wDimOffset.x + 5, (ws2D.y + we2D.y) / 2 + wDimOffset.y);

  // FBH Labels
  doc.setFontSize(6);
  doc.setDrawColor(0);
  holePositions.forEach((xPos, i) => {
    const holeCenter3D = { x: xPos, y: H/2, z: 0 };
    const hole2D = iso(holeCenter3D);
    doc.text(`Ø${fbhSizes[i]}`, hole2D.x, hole2D.y - 8, { align: 'center' });
    doc.text(`d=${depths[i]}mm`, hole2D.x, hole2D.y - 5, { align: 'center' });
  });

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIBRATION BLOCK - FLAT BOTTOM HOLE', centerX, centerY - 45, { align: 'center' });
  
  // Reference
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: MIL-STD-2154 / AMS-STD-2154', centerX, centerY + 45, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= PROFESSIONAL HOLLOW CYLINDER (RING/TUBE) - ISOMETRIC 3D =============
export function drawProfessionalHollowCylinder(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    outerDiameter?: number;
    innerDiameter?: number;
    length?: number;
    fbhPositions?: number[];
  }
) {
  const OD = blockData?.outerDiameter || 80;
  const ID = blockData?.innerDiameter || 60;
  const length = blockData?.length || 100;
  const scale = 0.35;
  
  const outerR = OD / 2;
  const innerR = ID / 2;
  const wallThickness = outerR - innerR;

  // Draw the cylinder in isometric view (cross-section + 3D effect)
  
  // === SIDE VIEW (Left) ===
  const sideX = centerX - 45;
  const sideY = centerY;
  
  // Outer rectangle (side view)
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  
  const sideWidth = length * scale;
  const sideHeight = OD * scale;
  
  doc.rect(sideX - sideWidth/2, sideY - sideHeight/2, sideWidth, sideHeight, 'FD');
  
  // Inner hollow (dashed lines)
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...COLORS.centerLine);
  const innerHeight = ID * scale;
  doc.rect(sideX - sideWidth/2, sideY - innerHeight/2, sideWidth, innerHeight);
  doc.setLineDashPattern([], 0);
  
  // Center line
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([4, 2, 1, 2], 0);
  doc.line(sideX - sideWidth/2 - 10, sideY, sideX + sideWidth/2 + 10, sideY);
  doc.setLineDashPattern([], 0);

  // FBH holes on side view
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);
  const fbhPositions = blockData?.fbhPositions || [0.25, 0.5, 0.75];
  fbhPositions.forEach((pos, i) => {
    const holeX = sideX - sideWidth/2 + sideWidth * pos;
    const holeR = 1.5 + i * 0.3;
    doc.circle(holeX, sideY - sideHeight/2 + wallThickness * scale / 2, holeR, 'F');
  });

  // === CROSS-SECTION VIEW (Right) ===
  const crossX = centerX + 40;
  const crossY = centerY;
  
  // Outer circle
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.circle(crossX, crossY, outerR * scale, 'FD');
  
  // Inner circle (hole)
  doc.setFillColor(255, 255, 255);
  doc.circle(crossX, crossY, innerR * scale, 'FD');
  
  // Cross-hatching for wall material
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.15);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    const outerX1 = crossX + Math.cos(angle) * outerR * scale;
    const outerY1 = crossY + Math.sin(angle) * outerR * scale;
    const innerX1 = crossX + Math.cos(angle) * innerR * scale;
    const innerY1 = crossY + Math.sin(angle) * innerR * scale;
    
    // Radial hatching
    if (Math.floor(angle / (Math.PI / 6)) % 2 === 0) {
      doc.setLineDashPattern([1, 2], 0);
      doc.line(innerX1, innerY1, outerX1, outerY1);
      doc.setLineDashPattern([], 0);
    }
  }

  // Center lines for cross-section
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([4, 2, 1, 2], 0);
  doc.line(crossX - outerR * scale - 8, crossY, crossX + outerR * scale + 8, crossY);
  doc.line(crossX, crossY - outerR * scale - 8, crossX, crossY + outerR * scale + 8);
  doc.setLineDashPattern([], 0);

  // FBH positions marked on cross-section
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);
  [0, Math.PI/2, Math.PI, Math.PI * 3/2].forEach((angle, i) => {
    const holeX = crossX + Math.cos(angle) * (outerR - wallThickness/2) * scale;
    const holeY = crossY + Math.sin(angle) * (outerR - wallThickness/2) * scale;
    doc.circle(holeX, holeY, 2, 'F');
  });

  // ============= DIMENSIONS =============
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Side view dimensions
  // Length
  const lenDimY = sideY + sideHeight/2 + 10;
  doc.line(sideX - sideWidth/2, lenDimY, sideX + sideWidth/2, lenDimY);
  doc.line(sideX - sideWidth/2, sideY + sideHeight/2, sideX - sideWidth/2, lenDimY + 2);
  doc.line(sideX + sideWidth/2, sideY + sideHeight/2, sideX + sideWidth/2, lenDimY + 2);
  drawDimensionArrow(doc, sideX - sideWidth/2, lenDimY, 'right');
  drawDimensionArrow(doc, sideX + sideWidth/2, lenDimY, 'left');
  doc.text(`L = ${length}mm`, sideX, lenDimY + 4, { align: 'center' });

  // OD
  const odDimX = sideX - sideWidth/2 - 10;
  doc.line(odDimX, sideY - sideHeight/2, odDimX, sideY + sideHeight/2);
  doc.line(sideX - sideWidth/2, sideY - sideHeight/2, odDimX - 2, sideY - sideHeight/2);
  doc.line(sideX - sideWidth/2, sideY + sideHeight/2, odDimX - 2, sideY + sideHeight/2);
  drawDimensionArrow(doc, odDimX, sideY - sideHeight/2, 'down');
  drawDimensionArrow(doc, odDimX, sideY + sideHeight/2, 'up');
  doc.text(`OD = ${OD}mm`, odDimX - 3, sideY, { angle: 90, align: 'center' });

  // Cross-section dimensions
  // OD diameter
  const odCrossY = crossY + outerR * scale + 12;
  doc.line(crossX - outerR * scale, odCrossY, crossX + outerR * scale, odCrossY);
  doc.line(crossX - outerR * scale, crossY + outerR * scale, crossX - outerR * scale, odCrossY + 2);
  doc.line(crossX + outerR * scale, crossY + outerR * scale, crossX + outerR * scale, odCrossY + 2);
  drawDimensionArrow(doc, crossX - outerR * scale, odCrossY, 'right');
  drawDimensionArrow(doc, crossX + outerR * scale, odCrossY, 'left');
  doc.text(`ØOD = ${OD}mm`, crossX, odCrossY + 4, { align: 'center' });

  // ID diameter
  doc.setFontSize(6);
  doc.text(`ØID = ${ID}mm`, crossX, crossY, { align: 'center' });
  doc.text(`t = ${wallThickness}mm`, crossX + outerR * scale + 5, crossY - 5);

  // Section indicators
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SIDE VIEW', sideX, sideY - sideHeight/2 - 8, { align: 'center' });
  doc.text('SECTION A-A', crossX, crossY - outerR * scale - 8, { align: 'center' });

  // Title
  doc.setFontSize(9);
  doc.text('CALIBRATION BLOCK - HOLLOW CYLINDER FBH', centerX, centerY - 48, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: MIL-STD-2154 / AMS-STD-2154 Figure 6', centerX, centerY + 48, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= PROFESSIONAL PART WITH SCAN DIRECTIONS =============
export function drawProfessionalPartWithScanDirections(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  partData: {
    partType: PartGeometry | string;
    length: number;
    width: number;
    thickness: number;
    diameter?: number;
    innerDiameter?: number;
    isHollow?: boolean;
    scanDirections?: Array<{
      surface: string;
      direction: string;
      angle: number;
    }>;
  }
) {
  const { partType, length, width, thickness, diameter, innerDiameter, isHollow, scanDirections } = partData;
  const scale = 0.4;

  // Determine if it's a cylindrical or rectangular part
  const isCylindrical = ['tube', 'pipe', 'ring', 'cylinder', 'round_bar', 'shaft'].includes(partType as string);

  if (isCylindrical) {
    drawCylindricalPartWithScans(doc, centerX, centerY, {
      outerDiameter: diameter || Math.max(length, width),
      innerDiameter: isHollow ? (innerDiameter || diameter! * 0.7) : undefined,
      length: thickness || 100,
      isHollow: isHollow || false,
      scanDirections,
      scale
    });
  } else {
    drawRectangularPartWithScans(doc, centerX, centerY, {
      length: length || 100,
      width: width || 50,
      height: thickness || 25,
      scanDirections,
      scale
    });
  }
}

function drawRectangularPartWithScans(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  data: {
    length: number;
    width: number;
    height: number;
    scanDirections?: Array<{ surface: string; direction: string; angle: number }>;
    scale: number;
  }
) {
  const { length, width, height, scanDirections, scale } = data;

  // Draw isometric box
  const L = length * scale;
  const W = width * scale;
  const H = height * scale;

  // Vertices
  const iso = (p: Point3D) => toIsometric(p, centerX, centerY, 1);
  const pts = {
    ftl: iso({ x: -L/2, y: H/2, z: -W/2 }),
    ftr: iso({ x: L/2, y: H/2, z: -W/2 }),
    fbl: iso({ x: -L/2, y: -H/2, z: -W/2 }),
    fbr: iso({ x: L/2, y: -H/2, z: -W/2 }),
    btl: iso({ x: -L/2, y: H/2, z: W/2 }),
    btr: iso({ x: L/2, y: H/2, z: W/2 }),
    bbl: iso({ x: -L/2, y: -H/2, z: W/2 }),
    bbr: iso({ x: L/2, y: -H/2, z: W/2 }),
  };

  // Draw faces with gradient effect
  // Top face
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  drawPolygon(doc, [pts.ftl, pts.ftr, pts.btr, pts.btl], true);
  
  // Right face
  doc.setFillColor(235, 235, 235);
  drawPolygon(doc, [pts.ftr, pts.fbr, pts.bbr, pts.btr], true);
  
  // Front face
  doc.setFillColor(220, 220, 220);
  drawPolygon(doc, [pts.ftl, pts.ftr, pts.fbr, pts.fbl], true);

  // Draw scan direction arrows
  if (scanDirections && scanDirections.length > 0) {
    doc.setDrawColor(...COLORS.scanArrow);
    doc.setFillColor(...COLORS.scanArrow);
    doc.setLineWidth(1);

    // Top surface scan
    const topCenter = {
      x: (pts.ftl.x + pts.btr.x) / 2,
      y: (pts.ftl.y + pts.btr.y) / 2 - 5
    };
    
    // Axial scan arrow (along length)
    drawScanArrow(doc, topCenter.x - 15, topCenter.y, topCenter.x + 15, topCenter.y, 'AXIAL');
    
    // Transverse scan arrow (along width)
    drawScanArrow(doc, topCenter.x, topCenter.y - 8, topCenter.x + 10, topCenter.y + 5, 'TRANS', true);

    // Front face scan
    const frontCenter = {
      x: (pts.ftl.x + pts.fbr.x) / 2,
      y: (pts.ftl.y + pts.fbr.y) / 2
    };
    drawScanArrow(doc, frontCenter.x - 12, frontCenter.y, frontCenter.x + 12, frontCenter.y, '');
  }

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  // Length dimension
  const dimY = pts.fbr.y + 15;
  doc.line(pts.fbl.x, dimY, pts.fbr.x, dimY);
  doc.line(pts.fbl.x, pts.fbl.y, pts.fbl.x, dimY + 2);
  doc.line(pts.fbr.x, pts.fbr.y, pts.fbr.x, dimY + 2);
  drawDimensionArrow(doc, pts.fbl.x, dimY, 'right');
  drawDimensionArrow(doc, pts.fbr.x, dimY, 'left');
  doc.text(`L = ${length}mm`, (pts.fbl.x + pts.fbr.x) / 2, dimY + 5, { align: 'center' });

  // Height dimension
  const dimX = pts.fbl.x - 12;
  doc.line(dimX, pts.ftl.y, dimX, pts.fbl.y);
  drawDimensionArrow(doc, dimX, pts.ftl.y, 'down');
  drawDimensionArrow(doc, dimX, pts.fbl.y, 'up');
  doc.text(`T = ${height}mm`, dimX - 3, (pts.ftl.y + pts.fbl.y) / 2, { angle: 90, align: 'center' });

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PART GEOMETRY WITH SCAN DIRECTIONS', centerX, centerY - 50, { align: 'center' });

  // Legend
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const legendY = centerY + 45;
  doc.setFillColor(...COLORS.scanArrow);
  doc.rect(centerX - 40, legendY, 8, 3, 'F');
  doc.text('= Scan Direction', centerX - 30, legendY + 2.5);
}

function drawCylindricalPartWithScans(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  data: {
    outerDiameter: number;
    innerDiameter?: number;
    length: number;
    isHollow: boolean;
    scanDirections?: Array<{ surface: string; direction: string; angle: number }>;
    scale: number;
  }
) {
  const { outerDiameter, innerDiameter, length, isHollow, scale } = data;
  
  const outerR = outerDiameter / 2 * scale;
  const innerR = isHollow && innerDiameter ? innerDiameter / 2 * scale : 0;
  const len = length * scale;

  // Side view (left)
  const sideX = centerX - 35;
  const sideY = centerY;

  // Draw cylinder side view
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(sideX - len/2, sideY - outerR, len, outerR * 2, 'FD');

  if (isHollow) {
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(...COLORS.centerLine);
    doc.rect(sideX - len/2, sideY - innerR, len, innerR * 2);
    doc.setLineDashPattern([], 0);
  }

  // Center line
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([4, 2, 1, 2], 0);
  doc.line(sideX - len/2 - 10, sideY, sideX + len/2 + 10, sideY);
  doc.setLineDashPattern([], 0);

  // Scan arrows on side view
  doc.setDrawColor(...COLORS.scanArrow);
  doc.setFillColor(...COLORS.scanArrow);
  doc.setLineWidth(1);
  
  // Axial scan
  drawScanArrow(doc, sideX - len/3, sideY - outerR - 8, sideX + len/3, sideY - outerR - 8, 'AXIAL');
  
  // Circumferential scan arrow (curved)
  doc.setFontSize(6);
  doc.text('CIRC', sideX + len/2 + 8, sideY);

  // Cross-section view (right)
  const crossX = centerX + 40;
  const crossY = centerY;

  // Outer circle
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.circle(crossX, crossY, outerR, 'FD');

  if (isHollow) {
    doc.setFillColor(255, 255, 255);
    doc.circle(crossX, crossY, innerR, 'FD');
  }

  // Cross-section center lines
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([4, 2, 1, 2], 0);
  doc.line(crossX - outerR - 5, crossY, crossX + outerR + 5, crossY);
  doc.line(crossX, crossY - outerR - 5, crossX, crossY + outerR + 5);
  doc.setLineDashPattern([], 0);

  // Radial scan arrows on cross-section
  doc.setDrawColor(...COLORS.scanArrow);
  doc.setFillColor(...COLORS.scanArrow);
  doc.setLineWidth(0.8);
  
  // Draw 4 radial arrows
  [0, Math.PI/2, Math.PI, Math.PI * 3/2].forEach(angle => {
    const startR = outerR + 5;
    const endR = isHollow ? innerR + 3 : outerR * 0.3;
    const startX = crossX + Math.cos(angle) * startR;
    const startY = crossY + Math.sin(angle) * startR;
    const endX = crossX + Math.cos(angle) * endR;
    const endY = crossY + Math.sin(angle) * endR;
    
    doc.line(startX, startY, endX, endY);
    // Arrow head
    drawArrowHead(doc, endX, endY, angle + Math.PI);
  });

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  // Length dimension
  const dimY = sideY + outerR + 12;
  doc.line(sideX - len/2, dimY, sideX + len/2, dimY);
  drawDimensionArrow(doc, sideX - len/2, dimY, 'right');
  drawDimensionArrow(doc, sideX + len/2, dimY, 'left');
  doc.text(`L = ${length}mm`, sideX, dimY + 5, { align: 'center' });

  // OD dimension
  const odDimX = sideX - len/2 - 10;
  doc.line(odDimX, sideY - outerR, odDimX, sideY + outerR);
  drawDimensionArrow(doc, odDimX, sideY - outerR, 'down');
  drawDimensionArrow(doc, odDimX, sideY + outerR, 'up');
  doc.text(`OD = ${outerDiameter}mm`, odDimX - 3, sideY, { angle: 90, align: 'center' });

  // Cross-section OD
  const crossDimY = crossY + outerR + 10;
  doc.line(crossX - outerR, crossDimY, crossX + outerR, crossDimY);
  drawDimensionArrow(doc, crossX - outerR, crossDimY, 'right');
  drawDimensionArrow(doc, crossX + outerR, crossDimY, 'left');
  doc.text(`Ø${outerDiameter}mm`, crossX, crossDimY + 5, { align: 'center' });

  if (isHollow && innerDiameter) {
    doc.setFontSize(6);
    doc.text(`ID = ${innerDiameter}mm`, crossX, crossY, { align: 'center' });
  }

  // View labels
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SIDE VIEW', sideX, sideY - outerR - 15, { align: 'center' });
  doc.text('END VIEW', crossX, crossY - outerR - 10, { align: 'center' });

  // Title
  doc.setFontSize(10);
  doc.text('PART GEOMETRY WITH SCAN DIRECTIONS', centerX, centerY - 50, { align: 'center' });

  // Legend
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const legendY = centerY + 50;
  doc.setFillColor(...COLORS.scanArrow);
  doc.rect(centerX - 45, legendY, 8, 3, 'F');
  doc.text('= Ultrasonic Beam Direction', centerX - 35, legendY + 2.5);
}

// ============= HELPER FUNCTIONS =============

function drawDimensionArrow(doc: jsPDF, x: number, y: number, direction: 'up' | 'down' | 'left' | 'right') {
  const size = 2;
  doc.setFillColor(...COLORS.dimension);
  
  switch (direction) {
    case 'up':
      doc.triangle(x, y, x - size/2, y + size, x + size/2, y + size, 'F');
      break;
    case 'down':
      doc.triangle(x, y, x - size/2, y - size, x + size/2, y - size, 'F');
      break;
    case 'left':
      doc.triangle(x, y, x + size, y - size/2, x + size, y + size/2, 'F');
      break;
    case 'right':
      doc.triangle(x, y, x - size, y - size/2, x - size, y + size/2, 'F');
      break;
  }
}

function drawArrowHead(doc: jsPDF, x: number, y: number, angle: number) {
  const size = 3;
  const x1 = x + Math.cos(angle + 0.4) * size;
  const y1 = y + Math.sin(angle + 0.4) * size;
  const x2 = x + Math.cos(angle - 0.4) * size;
  const y2 = y + Math.sin(angle - 0.4) * size;
  doc.triangle(x, y, x1, y1, x2, y2, 'F');
}

function drawScanArrow(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, label: string, vertical: boolean = false) {
  doc.line(x1, y1, x2, y2);
  
  // Arrow head at end
  const angle = Math.atan2(y2 - y1, x2 - x1);
  drawArrowHead(doc, x2, y2, angle);
  
  // Label
  if (label) {
    doc.setFontSize(6);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    if (vertical) {
      doc.text(label, midX + 5, midY);
    } else {
      doc.text(label, midX, midY - 3, { align: 'center' });
    }
  }
}

function drawPolygon(doc: jsPDF, points: Point2D[], fill: boolean = false) {
  if (points.length < 3) return;
  
  doc.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i].x, points[i].y);
  }
  doc.lineTo(points[0].x, points[0].y);
  
  if (fill) {
    doc.fill();
  }
  
  // Stroke the outline
  doc.setDrawColor(0);
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    doc.line(points[i].x, points[i].y, next.x, next.y);
  }
}

// ============= CURVED BLOCK - ISOMETRIC 3D =============
export function drawProfessionalCurvedBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    length?: number;
    radius?: number;
    height?: number;
  }
) {
  const L = blockData?.length || 100;
  const R = blockData?.radius || 50;
  const H = blockData?.height || 25;
  const scale = 0.4;

  // Draw curved block with radius indication
  const sideX = centerX;
  const sideY = centerY;

  // Draw the curved surface (arc)
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  // Draw curved top surface using bezier approximation
  const curveWidth = L * scale;
  const curveHeight = H * scale;
  const curveDepth = 15;

  // Front curved surface
  doc.setFillColor(235, 235, 235);
  
  // Draw arc for curved surface
  const startX = sideX - curveWidth / 2;
  const endX = sideX + curveWidth / 2;
  const arcY = sideY - curveDepth;
  
  // Top arc
  doc.ellipse(sideX, arcY, curveWidth / 2, curveDepth, 'S');
  
  // Side lines
  doc.line(startX, arcY, startX, sideY + curveHeight / 2);
  doc.line(endX, arcY, endX, sideY + curveHeight / 2);
  
  // Bottom line
  doc.line(startX, sideY + curveHeight / 2, endX, sideY + curveHeight / 2);

  // FBH holes on curved surface
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);
  doc.circle(sideX - 15, arcY, 2, 'F');
  doc.circle(sideX, arcY, 2, 'F');
  doc.circle(sideX + 15, arcY, 2, 'F');

  // Radius annotation
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  
  // Draw radius line
  doc.setLineDashPattern([2, 1], 0);
  doc.line(sideX, arcY, sideX, arcY - curveDepth - 10);
  doc.setLineDashPattern([], 0);
  
  doc.text(`R = ${R}mm`, sideX + 5, arcY - curveDepth - 5);

  // Length dimension
  const dimY = sideY + curveHeight / 2 + 12;
  doc.line(startX, dimY, endX, dimY);
  doc.line(startX, sideY + curveHeight / 2, startX, dimY + 2);
  doc.line(endX, sideY + curveHeight / 2, endX, dimY + 2);
  drawDimensionArrow(doc, startX, dimY, 'right');
  drawDimensionArrow(doc, endX, dimY, 'left');
  doc.text(`L = ${L}mm`, sideX, dimY + 5, { align: 'center' });

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIBRATION BLOCK - CURVED SURFACE', centerX, centerY - 45, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: MIL-STD-2154 / AMS-STD-2154 Figure 5', centerX, centerY + 45, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= ANGLE BEAM BLOCK - ISOMETRIC 3D =============
export function drawProfessionalAngleBeamBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    length?: number;
    width?: number;
    height?: number;
    angles?: number[];
  }
) {
  const L = blockData?.length || 150;
  const W = blockData?.width || 50;
  const H = blockData?.height || 30;
  const angles = blockData?.angles || [45, 60, 70];
  const scale = 0.35;

  // Draw IIW-style angle beam block
  const blockWidth = L * scale;
  const blockHeight = H * scale;

  // Main block rectangle
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight, 'FD');

  // Side-drilled holes (SDH) at different depths
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);
  
  const holePositions = [-blockWidth / 3, 0, blockWidth / 3];
  const holeDepths = [blockHeight * 0.3, blockHeight * 0.5, blockHeight * 0.7];
  
  holePositions.forEach((xPos, i) => {
    const holeX = centerX + xPos;
    const holeY = centerY - blockHeight / 2 + holeDepths[i];
    doc.circle(holeX, holeY, 2.5, 'S');
    
    // Depth indicator
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(...COLORS.dimension);
    doc.line(holeX, centerY - blockHeight / 2, holeX, holeY);
    doc.setLineDashPattern([], 0);
  });

  // Angle indicators from top surface
  doc.setDrawColor(...COLORS.scanArrow);
  doc.setLineWidth(0.8);
  
  angles.forEach((angle, i) => {
    const startX = centerX + holePositions[i];
    const startY = centerY - blockHeight / 2 - 5;
    const rad = (90 - angle) * Math.PI / 180;
    const arrowLen = 20;
    const endX = startX + Math.cos(rad) * arrowLen;
    const endY = startY + Math.sin(rad) * arrowLen;
    
    doc.line(startX, startY, endX, endY);
    drawArrowHead(doc, endX, endY, rad);
    
    // Angle label
    doc.setFontSize(6);
    doc.setDrawColor(0);
    doc.text(`${angle}°`, startX, startY - 3, { align: 'center' });
  });

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Length
  const dimY = centerY + blockHeight / 2 + 12;
  doc.line(centerX - blockWidth / 2, dimY, centerX + blockWidth / 2, dimY);
  drawDimensionArrow(doc, centerX - blockWidth / 2, dimY, 'right');
  drawDimensionArrow(doc, centerX + blockWidth / 2, dimY, 'left');
  doc.text(`L = ${L}mm`, centerX, dimY + 5, { align: 'center' });

  // Height
  const dimX = centerX - blockWidth / 2 - 10;
  doc.line(dimX, centerY - blockHeight / 2, dimX, centerY + blockHeight / 2);
  drawDimensionArrow(doc, dimX, centerY - blockHeight / 2, 'down');
  drawDimensionArrow(doc, dimX, centerY + blockHeight / 2, 'up');
  doc.text(`H = ${H}mm`, dimX - 3, centerY, { angle: 90, align: 'center' });

  // SDH labels
  doc.setFontSize(6);
  doc.setDrawColor(0);
  holePositions.forEach((xPos, i) => {
    doc.text(`SDH ${i + 1}`, centerX + xPos, centerY + blockHeight / 2 - 3, { align: 'center' });
  });

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIBRATION BLOCK - ANGLE BEAM (SDH)', centerX, centerY - 48, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: ASTM E164 / AWS D1.1', centerX, centerY + 48, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= IIW/IIV BLOCK - TYPE 1 =============
export function drawProfessionalIIVBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    radius?: number;
  }
) {
  const R = blockData?.radius || 100;
  const scale = 0.3;

  // IIW Type 1 Block (V1 Block) - Classic quarter-circle shape
  const radius = R * scale;
  const blockWidth = radius * 2;
  const blockHeight = radius;

  // Draw the quarter-circle shape
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  // Main rectangular part
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 4, blockWidth, blockHeight / 2, 'FD');

  // Quarter circle on right side (for angle calibration)
  const arcCenterX = centerX + blockWidth / 2 - radius / 2;
  const arcCenterY = centerY;
  
  // Draw arc segments
  doc.setDrawColor(0);
  for (let angle = 0; angle <= 90; angle += 5) {
    const rad1 = angle * Math.PI / 180;
    const rad2 = (angle + 5) * Math.PI / 180;
    const x1 = arcCenterX + Math.cos(rad1) * (radius / 2);
    const y1 = arcCenterY - Math.sin(rad1) * (radius / 2);
    const x2 = arcCenterX + Math.cos(rad2) * (radius / 2);
    const y2 = arcCenterY - Math.sin(rad2) * (radius / 2);
    doc.line(x1, y1, x2, y2);
  }

  // Reference holes
  doc.setFillColor(...COLORS.hole);
  doc.circle(centerX - blockWidth / 4, centerY, 2, 'F');  // 50mm hole
  doc.circle(centerX, centerY - blockHeight / 6, 1.5, 'F');  // 25mm hole

  // Scale markings along the edge
  doc.setFontSize(5);
  doc.setDrawColor(...COLORS.dimension);
  for (let i = 0; i <= 100; i += 25) {
    const markX = centerX - blockWidth / 2 + (i / 100) * blockWidth;
    doc.line(markX, centerY + blockHeight / 4, markX, centerY + blockHeight / 4 + 3);
    if (i % 50 === 0) {
      doc.text(`${i}`, markX, centerY + blockHeight / 4 + 7, { align: 'center' });
    }
  }

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Width dimension
  const dimY = centerY + blockHeight / 4 + 15;
  doc.line(centerX - blockWidth / 2, dimY, centerX + blockWidth / 2, dimY);
  drawDimensionArrow(doc, centerX - blockWidth / 2, dimY, 'right');
  drawDimensionArrow(doc, centerX + blockWidth / 2, dimY, 'left');
  doc.text('200mm', centerX, dimY + 5, { align: 'center' });

  // Radius annotation
  doc.setLineDashPattern([2, 1], 0);
  doc.line(arcCenterX, arcCenterY, arcCenterX + radius / 2, arcCenterY - radius / 2);
  doc.setLineDashPattern([], 0);
  doc.text(`R = ${R}mm`, arcCenterX + radius / 2 + 3, arcCenterY - radius / 2);

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IIW TYPE 1 (V1) CALIBRATION BLOCK', centerX, centerY - 40, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: BS EN ISO 2400', centerX, centerY + 45, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= STEP WEDGE BLOCK =============
export function drawProfessionalStepWedge(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    steps?: number;
    minThickness?: number;
    maxThickness?: number;
    length?: number;
  }
) {
  const steps = blockData?.steps || 5;
  const minT = blockData?.minThickness || 5;
  const maxT = blockData?.maxThickness || 25;
  const L = blockData?.length || 100;
  const scale = 0.5;

  const totalWidth = L * scale;
  const stepWidth = totalWidth / steps;
  const maxHeight = maxT * scale * 1.5;

  // Draw steps from left (thin) to right (thick)
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  const baseY = centerY + maxHeight / 2;

  for (let i = 0; i < steps; i++) {
    const stepThickness = minT + (maxT - minT) * (i / (steps - 1));
    const stepHeight = stepThickness * scale * 1.5;
    const stepX = centerX - totalWidth / 2 + i * stepWidth;
    
    // Draw step with 3D effect
    doc.setFillColor(245 - i * 5, 245 - i * 5, 245 - i * 5);
    doc.rect(stepX, baseY - stepHeight, stepWidth, stepHeight, 'FD');
    
    // Top surface (lighter)
    doc.setFillColor(250 - i * 3, 250 - i * 3, 250 - i * 3);
    const topPoints: Point2D[] = [
      { x: stepX, y: baseY - stepHeight },
      { x: stepX + stepWidth, y: baseY - stepHeight },
      { x: stepX + stepWidth + 5, y: baseY - stepHeight - 5 },
      { x: stepX + 5, y: baseY - stepHeight - 5 },
    ];
    drawPolygon(doc, topPoints, true);

    // Thickness label
    doc.setFontSize(5);
    doc.setDrawColor(0);
    doc.text(`${stepThickness.toFixed(0)}`, stepX + stepWidth / 2, baseY - stepHeight - 8, { align: 'center' });
  }

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Total length
  const dimY = baseY + 10;
  doc.line(centerX - totalWidth / 2, dimY, centerX + totalWidth / 2, dimY);
  drawDimensionArrow(doc, centerX - totalWidth / 2, dimY, 'right');
  drawDimensionArrow(doc, centerX + totalWidth / 2, dimY, 'left');
  doc.text(`L = ${L}mm`, centerX, dimY + 5, { align: 'center' });

  // Thickness range
  doc.text(`Thickness: ${minT}mm - ${maxT}mm`, centerX, baseY + 20, { align: 'center' });

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STEP WEDGE CALIBRATION BLOCK', centerX, centerY - 45, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(`${steps} Steps - Reference: ASTM E797`, centerX, centerY + 48, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= IOW BLOCK (Distance Amplitude) =============
export function drawProfessionalIOWBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    length?: number;
    height?: number;
  }
) {
  const L = blockData?.length || 200;
  const H = blockData?.height || 50;
  const scale = 0.35;

  const blockWidth = L * scale;
  const blockHeight = H * scale;

  // Main block
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight, 'FD');

  // Distance/Amplitude holes at different depths
  doc.setFillColor(...COLORS.hole);
  doc.setDrawColor(...COLORS.hole);

  const holeDistances = [25, 50, 75, 100, 125, 150, 175]; // mm from edge
  const holeDepths = [6, 12, 18, 25, 31, 37, 44]; // mm depths

  holeDistances.forEach((dist, i) => {
    const holeX = centerX - blockWidth / 2 + (dist / L) * blockWidth;
    const holeY = centerY - blockHeight / 2 + (holeDepths[i] / H) * blockHeight;
    doc.circle(holeX, holeY, 1.5, 'F');
    
    // Connecting line to show depth pattern
    if (i > 0) {
      const prevX = centerX - blockWidth / 2 + (holeDistances[i - 1] / L) * blockWidth;
      const prevY = centerY - blockHeight / 2 + (holeDepths[i - 1] / H) * blockHeight;
      doc.setLineDashPattern([1, 1], 0);
      doc.setDrawColor(...COLORS.dimension);
      doc.line(prevX, prevY, holeX, holeY);
      doc.setLineDashPattern([], 0);
    }
  });

  // DAC curve annotation
  doc.setDrawColor(...COLORS.scanArrow);
  doc.setFontSize(6);
  doc.text('DAC Curve Reference Points', centerX, centerY - blockHeight / 2 - 5, { align: 'center' });

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Length
  const dimY = centerY + blockHeight / 2 + 10;
  doc.line(centerX - blockWidth / 2, dimY, centerX + blockWidth / 2, dimY);
  drawDimensionArrow(doc, centerX - blockWidth / 2, dimY, 'right');
  drawDimensionArrow(doc, centerX + blockWidth / 2, dimY, 'left');
  doc.text(`L = ${L}mm`, centerX, dimY + 5, { align: 'center' });

  // Height
  const dimX = centerX - blockWidth / 2 - 10;
  doc.line(dimX, centerY - blockHeight / 2, dimX, centerY + blockHeight / 2);
  drawDimensionArrow(doc, dimX, centerY - blockHeight / 2, 'down');
  drawDimensionArrow(doc, dimX, centerY + blockHeight / 2, 'up');
  doc.text(`H = ${H}mm`, dimX - 3, centerY, { angle: 90, align: 'center' });

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IOW/DAC CALIBRATION BLOCK', centerX, centerY - 45, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Distance Amplitude Correction Reference', centerX, centerY + 48, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= NOTCHED CYLINDER =============
export function drawProfessionalNotchedCylinder(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    outerDiameter?: number;
    innerDiameter?: number;
    length?: number;
  }
) {
  const OD = blockData?.outerDiameter || 80;
  const ID = blockData?.innerDiameter || 60;
  const length = blockData?.length || 100;
  const scale = 0.35;

  const outerR = OD / 2 * scale;
  const innerR = ID / 2 * scale;
  const len = length * scale;

  // Side view
  const sideX = centerX - 35;
  const sideY = centerY;

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(sideX - len / 2, sideY - outerR, len, outerR * 2, 'FD');

  // Inner hollow (dashed)
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...COLORS.centerLine);
  doc.rect(sideX - len / 2, sideY - innerR, len, innerR * 2);
  doc.setLineDashPattern([], 0);

  // Notches on outer surface (V-notches)
  doc.setDrawColor(...COLORS.hole);
  doc.setFillColor(...COLORS.hole);
  const notchPositions = [0.25, 0.5, 0.75];
  notchPositions.forEach(pos => {
    const notchX = sideX - len / 2 + len * pos;
    // Draw V-notch
    doc.line(notchX - 2, sideY - outerR, notchX, sideY - outerR + 4);
    doc.line(notchX, sideY - outerR + 4, notchX + 2, sideY - outerR);
    // Bottom notch
    doc.line(notchX - 2, sideY + outerR, notchX, sideY + outerR - 4);
    doc.line(notchX, sideY + outerR - 4, notchX + 2, sideY + outerR);
  });

  // Center line
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([4, 2, 1, 2], 0);
  doc.line(sideX - len / 2 - 10, sideY, sideX + len / 2 + 10, sideY);
  doc.setLineDashPattern([], 0);

  // Cross-section view
  const crossX = centerX + 40;
  const crossY = centerY;

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.circle(crossX, crossY, outerR, 'FD');
  doc.setFillColor(255, 255, 255);
  doc.circle(crossX, crossY, innerR, 'FD');

  // Notch indicators on cross-section
  doc.setDrawColor(...COLORS.hole);
  [0, Math.PI].forEach(angle => {
    const x = crossX + Math.cos(angle) * outerR;
    const y = crossY + Math.sin(angle) * outerR;
    doc.line(x - 3, y, x + 3, y);
  });

  // Dimensions
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);

  // Length
  const dimY = sideY + outerR + 12;
  doc.line(sideX - len / 2, dimY, sideX + len / 2, dimY);
  drawDimensionArrow(doc, sideX - len / 2, dimY, 'right');
  drawDimensionArrow(doc, sideX + len / 2, dimY, 'left');
  doc.text(`L = ${length}mm`, sideX, dimY + 5, { align: 'center' });

  // OD
  const odDimX = sideX - len / 2 - 10;
  doc.line(odDimX, sideY - outerR, odDimX, sideY + outerR);
  drawDimensionArrow(doc, odDimX, sideY - outerR, 'down');
  drawDimensionArrow(doc, odDimX, sideY + outerR, 'up');
  doc.text(`OD=${OD}`, odDimX - 3, sideY, { angle: 90, align: 'center' });

  // Cross-section labels
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SIDE VIEW', sideX, sideY - outerR - 12, { align: 'center' });
  doc.text('SECTION A-A', crossX, crossY - outerR - 8, { align: 'center' });

  // Title
  doc.setFontSize(9);
  doc.text('CALIBRATION BLOCK - NOTCHED CYLINDER', centerX, centerY - 48, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Reference: MIL-STD-2154 Figure 5', centerX, centerY + 48, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

// ============= ASTM E127 SOLID CYLINDER SET (STRAIGHT BEAM) =============
/**
 * ASTM E127 / E428 Solid Cylinder Calibration Block SET
 * Standard blocks for Straight Beam (longitudinal wave) inspection
 * Shows 3 cylinders of different heights based on part thickness
 * Dimensions: 2" diameter (50.8mm) cylinders with varying Metal Travel Distance (MTD)
 */
export function drawProfessionalSolidCylinderFBH(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  blockData?: {
    diameter?: number;      // Block diameter (default 50.8mm = 2")
    height?: number;        // Part thickness to determine block sizes
    metalPath?: number;     // Base Metal Travel Distance
    fbhDiameter?: string;   // FBH size (e.g., "3/64", "5/64", "8/64")
  }
) {
  const diameter = blockData?.diameter || 50.8; // 2" = 50.8mm (ASTM E127 standard)
  const partThickness = blockData?.height || 75;
  const fbhSize = blockData?.fbhDiameter || '5/64"';
  
  // Calculate 3 block heights based on part thickness (per ASTM E127)
  // Typically: near surface, mid-range, and far surface coverage
  const blockHeights = [
    Math.max(25, partThickness * 0.3),   // Small block (~30% of part)
    Math.max(50, partThickness * 0.6),   // Medium block (~60% of part)
    Math.max(75, partThickness * 0.9),   // Large block (~90% of part)
  ];
  
  const scale = 0.35;
  const baseRadius = (diameter / 2) * scale;
  const spacing = 48; // Space between blocks
  
  // ===== DRAW 3 BLOCKS =====
  const startX = centerX - spacing - 10;
  const baseY = centerY + 15;
  
  blockHeights.forEach((height, index) => {
    const blockX = startX + index * spacing;
    const h = height * scale;
    const radius = baseRadius;
    const fbhDepth = 5 * scale;
    
    // Align blocks at bottom
    const blockTop = baseY - h;
    const blockBottom = baseY;
    const blockCenterY = blockTop + h / 2;
    
    // Draw cylinder body
    doc.setFillColor(235, 235, 235);
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.rect(blockX - radius, blockTop, radius * 2, h, 'FD');
    
    // Top ellipse (3D effect)
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(60, 60, 60);
    doc.ellipse(blockX, blockTop, radius, radius * 0.2, 'FD');
    
    // Bottom ellipse (dashed - hidden)
    doc.setDrawColor(150, 150, 150);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.ellipse(blockX, blockBottom, radius, radius * 0.2, 'S');
    doc.setLineDashPattern([], 0);
    
    // FBH from bottom
    doc.setDrawColor(...COLORS.hole);
    doc.setFillColor(...COLORS.hole);
    const fbhWidth = 2;
    doc.rect(blockX - fbhWidth / 2, blockBottom - fbhDepth, fbhWidth, fbhDepth, 'FD');
    
    // Center line
    doc.setDrawColor(...COLORS.centerLine);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([3, 1.5, 0.5, 1.5], 0);
    doc.line(blockX, blockTop - 5, blockX, blockBottom + 5);
    doc.setLineDashPattern([], 0);
    
    // Height dimension on side
    doc.setDrawColor(...COLORS.dimension);
    doc.setLineWidth(0.2);
    const dimX = blockX + radius + 4;
    doc.line(dimX, blockTop, dimX, blockBottom);
    drawDimensionArrow(doc, dimX, blockTop, 'down');
    drawDimensionArrow(doc, dimX, blockBottom, 'up');
    
    // Height label
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dimension);
    doc.text(`${height.toFixed(0)}`, dimX + 2, blockCenterY + 1);
    
    // Block number label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`#${index + 1}`, blockX, blockBottom + 12, { align: 'center' });
  });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // ===== DIAMETER DIMENSION (shared) =====
  doc.setDrawColor(...COLORS.dimension);
  doc.setLineWidth(0.25);
  doc.setFontSize(6);
  const dimY = baseY + 18;
  const middleBlockX = startX + spacing;
  doc.line(middleBlockX - baseRadius, dimY, middleBlockX + baseRadius, dimY);
  drawDimensionArrow(doc, middleBlockX - baseRadius, dimY, 'right');
  drawDimensionArrow(doc, middleBlockX + baseRadius, dimY, 'left');
  doc.text(`Ø ${diameter.toFixed(1)}mm (2")`, middleBlockX, dimY + 5, { align: 'center' });
  
  // ===== TOP VIEW (small, right side) =====
  const topViewX = centerX + 65;
  const topViewY = centerY - 20;
  const topViewRadius = baseRadius * 0.7;
  
  // Label
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP VIEW', topViewX, topViewY - topViewRadius - 5, { align: 'center' });
  
  // Circle
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.circle(topViewX, topViewY, topViewRadius, 'FD');
  
  // Center crosshairs
  doc.setDrawColor(...COLORS.centerLine);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([2, 1, 0.5, 1], 0);
  doc.line(topViewX - topViewRadius - 3, topViewY, topViewX + topViewRadius + 3, topViewY);
  doc.line(topViewX, topViewY - topViewRadius - 3, topViewX, topViewY + topViewRadius + 3);
  doc.setLineDashPattern([], 0);
  
  // FBH in center
  doc.setDrawColor(...COLORS.hole);
  doc.setFillColor(...COLORS.hole);
  doc.circle(topViewX, topViewY, 1.5, 'FD');
  
  // ===== FBH SPECIFICATION BOX =====
  const specBoxX = topViewX - 18;
  const specBoxY = topViewY + topViewRadius + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLORS.hole);
  doc.setLineWidth(0.3);
  doc.roundedRect(specBoxX, specBoxY, 36, 14, 1, 1, 'FD');
  
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.hole);
  doc.text('FBH SPECIFICATION', specBoxX + 18, specBoxY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Diameter: ${fbhSize}`, specBoxX + 18, specBoxY + 9, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // ===== TITLE =====
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ASTM E127 CALIBRATION BLOCK SET', centerX, centerY - 45, { align: 'center' });
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Straight Beam (Longitudinal Wave) Reference Standards', centerX, centerY - 40, { align: 'center' });
  
  // ===== NOTES TABLE =====
  const notesY = baseY + 28;
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  
  // Table header
  doc.setFillColor(41, 128, 185);
  doc.rect(centerX - 60, notesY, 120, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOCK', centerX - 50, notesY + 4, { align: 'center' });
  doc.text('HEIGHT (MTD)', centerX - 15, notesY + 4, { align: 'center' });
  doc.text('PURPOSE', centerX + 35, notesY + 4, { align: 'center' });
  
  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const rowHeight = 5;
  
  const tableData = [
    ['#1 (Small)', `${blockHeights[0].toFixed(0)} mm`, 'Near Surface'],
    ['#2 (Medium)', `${blockHeights[1].toFixed(0)} mm`, 'Mid-Range'],
    ['#3 (Large)', `${blockHeights[2].toFixed(0)} mm`, 'Full Thickness'],
  ];
  
  tableData.forEach((row, i) => {
    const rowY = notesY + 6 + (i + 1) * rowHeight;
    doc.setFillColor(i % 2 === 0 ? 250 : 240, i % 2 === 0 ? 250 : 240, i % 2 === 0 ? 250 : 240);
    doc.rect(centerX - 60, rowY - 4, 120, rowHeight, 'F');
    doc.text(row[0], centerX - 50, rowY, { align: 'center' });
    doc.text(row[1], centerX - 15, rowY, { align: 'center' });
    doc.text(row[2], centerX + 35, rowY, { align: 'center' });
  });
  
  // Border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);
  doc.rect(centerX - 60, notesY, 120, 6 + tableData.length * rowHeight);
  
  // Footer note
  doc.setFontSize(5);
  doc.setFont('helvetica', 'italic');
  doc.text('Per ASTM E127-20 | Material matches part | Surface Ra 1.6 µm (63 µin)', centerX, notesY + 26, { align: 'center' });
}

// ============= DRAWING SELECTOR =============
export function drawProfessionalCalibrationBlock(
  doc: jsPDF,
  blockType: CalibrationBlockType,
  centerX: number,
  centerY: number,
  data?: {
    length?: number;
    width?: number;
    height?: number;
    outerDiameter?: number;
    innerDiameter?: number;
    fbhSizes?: string[];
    radius?: number;
    steps?: number;
    angles?: number[];
  }
) {
  switch (blockType) {
    case 'angle_beam':
      // Angle beam blocks have unique design (IIW/IOW style)
      drawProfessionalAngleBeamBlock(doc, centerX, centerY, {
        length: data?.length || 150,
        width: data?.width || 50,
        height: data?.height || 30,
        angles: data?.angles || [45, 60, 70]
      });
      break;

    case 'iiv_block':
      // IIV/V1 block for angle beam calibration
      drawProfessionalIIVBlock(doc, centerX, centerY, {
        radius: data?.radius || 100
      });
      break;

    case 'iow_block':
      // IOW/V2 block for angle beam calibration
      drawProfessionalIOWBlock(doc, centerX, centerY, {
        length: data?.length || 200,
        height: data?.height || 50
      });
      break;

    // ALL OTHER BLOCK TYPES: Use unified MIL-STD-2154 / AMS-STD-2154 solid cylinder set
    case 'flat_block':
    case 'cylinder_fbh':
    case 'cylinder_notched':
    case 'curved_block':
    case 'step_wedge':
    case 'solid_cylinder_fbh':
    case 'custom':
    default:
      // Standard calibration: 3 solid cylinders with FBH per MIL-STD-2154
      drawProfessionalSolidCylinderFBH(doc, centerX, centerY, {
        diameter: data?.outerDiameter || 50.8, // 2" standard
        height: data?.height || 75,            // Part thickness
        metalPath: data?.length || 50,
        fbhDiameter: data?.fbhSizes?.[0] || '3/64"'
      });
      break;
  }
}
