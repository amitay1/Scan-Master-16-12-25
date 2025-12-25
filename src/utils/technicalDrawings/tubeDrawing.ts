/**
 * Tube (Hollow Cylinder) Technical Drawing Module
 * Generates 2-view technical drawings for tubular parts
 * Tubes are always hollow with OD, ID, and wall thickness
 *
 * Professional aerospace-grade drawing with scan direction indicators:
 * - Front View: Side profile with LW 0° axial arrows (A-A, B-B) and radial arrow (C)
 * - End View: Cross-section with SW 45° shear wave arrows
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawTubeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // Ensure valid dimensions to prevent division by zero
  const outerDiameter = Math.max(dimensions.diameter || dimensions.outerDiameter || 100, 1);
  const length = Math.max(dimensions.length || 200, 1);

  // Calculate wall thickness and inner diameter
  // Priority: 1) explicit innerDiameter, 2) explicit wallThickness, 3) default 10% of OD
  let innerDiameter: number;
  let wallThickness: number;

  if (dimensions.innerDiameter && dimensions.innerDiameter > 0) {
    // Inner diameter provided explicitly
    innerDiameter = dimensions.innerDiameter;
    wallThickness = (outerDiameter - innerDiameter) / 2;
  } else if (dimensions.wallThickness && dimensions.wallThickness > 0) {
    // Wall thickness provided
    wallThickness = dimensions.wallThickness;
    innerDiameter = outerDiameter - (2 * wallThickness);
  } else {
    // Default: wall thickness is 10% of OD (minimum 5mm)
    wallThickness = Math.max(outerDiameter * 0.1, 5);
    innerDiameter = outerDiameter - (2 * wallThickness);
  }

  // Ensure inner diameter is valid (minimum 20% of OD)
  if (innerDiameter < outerDiameter * 0.2) {
    innerDiameter = outerDiameter * 0.6;
    wallThickness = (outerDiameter - innerDiameter) / 2;
  }

  // FRONT VIEW (Side profile - Length × OD with scan direction arrows)
  drawFrontView(generator, length, outerDiameter, innerDiameter, wallThickness, layout.frontView);

  // SIDE VIEW (End view - Concentric circles with SW 45° arrows)
  drawSideView(generator, outerDiameter, innerDiameter, wallThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  outerDiameter: number,
  innerDiameter: number,
  _wallThickness: number, // Reserved for future use
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit - use 0.35 to leave plenty of room for scan arrows
  const scale = Math.min(width / length, height / outerDiameter) * 0.35;
  const scaledLength = length * scale;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;

  // Position the tube more to the left to leave space for arrow C on the right
  const outerX = x + (width - scaledLength) / 2 - 40;
  const outerY = y + (height - scaledOD) / 2;

  const innerX = outerX;
  const innerY = outerY + (scaledOD - scaledID) / 2;

  // Outer rectangle (tube profile)
  generator.drawRectangle(outerX, outerY, scaledLength, scaledOD, 'visible');

  // Inner rectangle (hidden lines showing hollow interior)
  generator.drawRectangle(innerX, innerY, scaledLength, scaledID, 'hidden');

  // Centerlines
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  generator.drawLine(
    outerX - 20,
    centerY,
    outerX + scaledLength + 20,
    centerY,
    'center'
  );

  generator.drawLine(
    centerX,
    outerY - 20,
    centerX,
    outerY + scaledOD + 20,
    'center'
  );

  // ============================================
  // SCAN DIRECTION ARROWS (matching the hand drawing)
  // ============================================
  const arrowColor = '#FF0000'; // Red arrows like in the sketch
  const arrowHeadSize = 10;

  // A-A: LW 0° (AXIAL) - Arrow from top pointing down
  const arrowAX = centerX;
  const arrowAStartY = outerY - 40;
  const arrowAEndY = outerY - 5;

  // Draw arrow line A-A
  generator.drawLine(arrowAX, arrowAStartY, arrowAX, arrowAEndY, 'cutting');
  // Draw arrowhead pointing down
  drawScanArrowHead(generator, arrowAX, arrowAEndY, Math.PI / 2, arrowHeadSize, arrowColor);
  // Label A-A
  generator.drawText(arrowAX + 60, arrowAStartY + 10, 'A-A, LW 0° (AXIAL)', 10, arrowColor);

  // B-B: LW 0° (AXIAL) - Arrow from bottom pointing up
  const arrowBX = centerX;
  const arrowBStartY = outerY + scaledOD + 40;
  const arrowBEndY = outerY + scaledOD + 5;

  // Draw arrow line B-B
  generator.drawLine(arrowBX, arrowBStartY, arrowBX, arrowBEndY, 'cutting');
  // Draw arrowhead pointing up
  drawScanArrowHead(generator, arrowBX, arrowBEndY, -Math.PI / 2, arrowHeadSize, arrowColor);
  // Label B-B
  generator.drawText(arrowBX + 60, arrowBStartY - 10, 'B-B, LW 0° (AXIAL)', 10, arrowColor);

  // C: LW 0° (RADIAL) - Arrow from right pointing left (into the tube wall)
  const arrowCX = outerX + scaledLength + 50;
  const arrowCEndX = outerX + scaledLength + 5;
  const arrowCY = centerY;

  // Draw arrow line C
  generator.drawLine(arrowCX, arrowCY, arrowCEndX, arrowCY, 'cutting');
  // Draw arrowhead pointing left
  drawScanArrowHead(generator, arrowCEndX, arrowCY, Math.PI, arrowHeadSize, arrowColor);
  // Label C
  generator.drawText(arrowCX + 70, arrowCY, 'C, LW 0° (RADIAL)', 10, arrowColor);

  // ============================================
  // DIMENSIONS
  // ============================================
  generator.drawDimension(
    outerX,
    outerY + scaledOD + 70,
    outerX + scaledLength,
    outerY + scaledOD + 70,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    outerX - 50,
    outerY,
    outerX - 50,
    outerY + scaledOD,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    outerX - 80,
    innerY,
    outerX - 80,
    innerY + scaledID,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );
}

/**
 * Draw a scan direction arrowhead
 */
function drawScanArrowHead(
  generator: TechnicalDrawingGenerator,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string
) {
  const scope = generator.getScope();
  const path = new scope.Path();
  path.add(new scope.Point(x, y));
  path.add(new scope.Point(
    x - size * Math.cos(angle - Math.PI / 6),
    y - size * Math.sin(angle - Math.PI / 6)
  ));
  path.add(new scope.Point(
    x - size * Math.cos(angle + Math.PI / 6),
    y - size * Math.sin(angle + Math.PI / 6)
  ));
  path.closed = true;
  path.fillColor = new scope.Color(color);
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  wallThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label - END VIEW showing cross-section
  generator.drawViewLabel(x + width / 2, y, 'END VIEW (SECTION A-A)');

  // Scale to fit - use 0.3 to leave plenty of room for SW arrows
  const scale = Math.min(width, height) / outerDiameter * 0.3;
  const scaledOuterRadius = (outerDiameter / 2) * scale;
  const scaledInnerRadius = (innerDiameter / 2) * scale;

  // Position the circle more to the right to leave space for SW arrows on the left
  const centerX = x + width / 2 + 40;
  const centerY = y + height / 2;

  // Outer circle
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');

  // Inner circle (hollow)
  generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

  // Hatching for the wall area (section hatching)
  const wallThicknessScaled = scaledOuterRadius - scaledInnerRadius;
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    const midRadius = (scaledOuterRadius + scaledInnerRadius) / 2;
    const hatchX = centerX + midRadius * Math.cos(rad) - wallThicknessScaled / 3;
    const hatchY = centerY + midRadius * Math.sin(rad) - wallThicknessScaled / 3;
    generator.drawHatching(hatchX, hatchY, wallThicknessScaled / 1.5, wallThicknessScaled / 1.5, 45, 3);
  }

  // Centerlines
  generator.drawLine(
    centerX - scaledOuterRadius - 20,
    centerY,
    centerX + scaledOuterRadius + 20,
    centerY,
    'center'
  );

  generator.drawLine(
    centerX,
    centerY - scaledOuterRadius - 20,
    centerX,
    centerY + scaledOuterRadius + 20,
    'center'
  );

  // ============================================
  // SHEAR WAVE 45° ARROWS (matching the hand drawing)
  // Two arrows at 45° angle showing shear wave scan directions
  // ============================================
  const arrowColor = '#FF0000'; // Red arrows
  const arrowHeadSize = 10;

  // Calculate arrow positions - arrows should point toward the tube wall
  // at 45° angles, showing circumferential shear wave inspection
  const arrowStartRadius = scaledOuterRadius + 60; // Start outside the tube
  const arrowEndRadius = scaledOuterRadius + 10; // End near the outer wall

  // SW 45° Arrow 1 - Coming from lower-right at 45° angle (pointing up-left into wall)
  const angle1 = Math.PI / 4; // 45 degrees
  const arrow1StartX = centerX + arrowStartRadius * Math.cos(angle1);
  const arrow1StartY = centerY + arrowStartRadius * Math.sin(angle1);
  const arrow1EndX = centerX + arrowEndRadius * Math.cos(angle1);
  const arrow1EndY = centerY + arrowEndRadius * Math.sin(angle1);

  // Draw dashed line for beam path
  generator.drawLine(arrow1StartX, arrow1StartY, arrow1EndX, arrow1EndY, 'cutting');
  // Arrowhead pointing toward center (into the wall)
  drawScanArrowHead(generator, arrow1EndX, arrow1EndY, angle1 + Math.PI, arrowHeadSize, arrowColor);
  // Label
  generator.drawText(arrow1StartX + 20, arrow1StartY + 15, 'SW 45°', 10, arrowColor);

  // SW 45° Arrow 2 - Coming from lower-left at 135° angle (pointing up-right into wall)
  const angle2 = 3 * Math.PI / 4; // 135 degrees
  const arrow2StartX = centerX + arrowStartRadius * Math.cos(angle2);
  const arrow2StartY = centerY + arrowStartRadius * Math.sin(angle2);
  const arrow2EndX = centerX + arrowEndRadius * Math.cos(angle2);
  const arrow2EndY = centerY + arrowEndRadius * Math.sin(angle2);

  // Draw dashed line for beam path
  generator.drawLine(arrow2StartX, arrow2StartY, arrow2EndX, arrow2EndY, 'cutting');
  // Arrowhead pointing toward center (into the wall)
  drawScanArrowHead(generator, arrow2EndX, arrow2EndY, angle2 + Math.PI, arrowHeadSize, arrowColor);
  // Label
  generator.drawText(arrow2StartX - 50, arrow2StartY + 15, 'SW 45°', 10, arrowColor);

  // ============================================
  // DIMENSIONS
  // ============================================
  generator.drawDimension(
    centerX - scaledOuterRadius,
    centerY - scaledOuterRadius - 40,
    centerX + scaledOuterRadius,
    centerY - scaledOuterRadius - 40,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    centerX - scaledInnerRadius,
    centerY - scaledInnerRadius - 20,
    centerX + scaledInnerRadius,
    centerY - scaledInnerRadius - 20,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );

  // Wall thickness indicator
  generator.drawText(
    centerX + scaledOuterRadius + 25,
    centerY - scaledOuterRadius / 2,
    `t=${wallThickness.toFixed(1)}mm`,
    10,
    '#FFD700'
  );
}
