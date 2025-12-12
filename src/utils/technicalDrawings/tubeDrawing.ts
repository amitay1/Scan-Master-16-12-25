/**
 * Tube (Hollow Cylinder) Technical Drawing Module
 * Generates 2-view technical drawings for tubular parts
 * Tubes are always hollow with OD, ID, and wall thickness
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawTubeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const outerDiameter = dimensions.diameter || dimensions.outerDiameter || 100;
  const length = dimensions.length || 200;

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

  // FRONT VIEW (Length × OD with inner rectangle)
  drawFrontView(generator, length, outerDiameter, innerDiameter, layout.frontView);

  // SIDE VIEW (Concentric circles - section view)
  drawSideView(generator, outerDiameter, innerDiameter, wallThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width / length, height / outerDiameter) * 0.6;
  const scaledLength = length * scale;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;

  const outerX = x + (width - scaledLength) / 2;
  const outerY = y + (height - scaledOD) / 2;

  const innerX = outerX;
  const innerY = outerY + (scaledOD - scaledID) / 2;

  // Outer rectangle
  generator.drawRectangle(outerX, outerY, scaledLength, scaledOD, 'visible');

  // Inner rectangle (hidden lines)
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

  // Dimensions
  generator.drawDimension(
    outerX,
    outerY + scaledOD + 35,
    outerX + scaledLength,
    outerY + scaledOD + 35,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    outerX + scaledLength + 35,
    outerY,
    outerX + scaledLength + 35,
    outerY + scaledOD,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    outerX + scaledLength + 55,
    innerY,
    outerX + scaledLength + 55,
    innerY + scaledID,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );
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

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width, height) / outerDiameter * 0.5;
  const scaledOuterRadius = (outerDiameter / 2) * scale;
  const scaledInnerRadius = (innerDiameter / 2) * scale;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Outer circle
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');

  // Inner circle (hollow)
  generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

  // Hatching for the wall area (approximated with rectangles around the ring)
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

  // Dimensions
  generator.drawDimension(
    centerX - scaledOuterRadius,
    centerY - scaledOuterRadius - 30,
    centerX + scaledOuterRadius,
    centerY - scaledOuterRadius - 30,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    centerX - scaledInnerRadius,
    centerY + scaledInnerRadius + 25,
    centerX + scaledInnerRadius,
    centerY + scaledInnerRadius + 25,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );

  // Wall thickness indicator
  generator.drawText(
    centerX + (scaledInnerRadius + scaledOuterRadius) / 2,
    centerY - 10,
    `t=${wallThickness.toFixed(1)}mm`,
    10,
    '#FFD700'
  );

  // Shape type label - PROMINENT indicator that this is HOLLOW
  generator.drawText(
    centerX,
    centerY - 15,
    'TUBE',
    12,
    '#00BFFF'  // Bright cyan for visibility
  );
  generator.drawText(
    centerX,
    centerY + 5,
    '(HOLLOW)',
    10,
    '#FFD700'  // Gold color for emphasis
  );
}
