/**
 * Ring Technical Drawing Module
 * Generates 2-view technical drawings for annular ring parts
 * Rings are always hollow with OD, ID, and height/thickness
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawRingTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // Ensure valid dimensions to prevent division by zero
  const outerDiameter = Math.max(dimensions.diameter || dimensions.outerDiameter || 100, 1);
  const thickness = Math.max(dimensions.thickness || dimensions.length || 30, 1);

  // Calculate inner diameter - Rings are ALWAYS hollow
  // Priority: 1) explicit innerDiameter, 2) wallThickness-based, 3) default 60% of OD
  let innerDiameter: number;

  if (dimensions.innerDiameter && dimensions.innerDiameter > 0) {
    innerDiameter = dimensions.innerDiameter;
  } else if (dimensions.wallThickness && dimensions.wallThickness > 0) {
    innerDiameter = outerDiameter - (2 * dimensions.wallThickness);
  } else {
    // Default: ID is 60% of OD (standard ring proportion)
    innerDiameter = outerDiameter * 0.6;
  }

  // Ensure inner diameter is valid (minimum 30% of OD for visual clarity)
  if (innerDiameter < outerDiameter * 0.3) {
    innerDiameter = outerDiameter * 0.6;
  }

  // FRONT VIEW (Concentric circles)
  drawFrontView(generator, outerDiameter, innerDiameter, layout.frontView);

  // SIDE VIEW (Section view with hatching)
  drawSideView(generator, outerDiameter, innerDiameter, thickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / outerDiameter;
  const scaledOuterRadius = (outerDiameter * scale) / 2;
  const scaledInnerRadius = (innerDiameter * scale) / 2;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Outer circle
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');

  // Inner circle
  generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

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

  // 45° reference lines
  const offset = scaledOuterRadius * 0.7071;
  generator.drawLine(
    centerX - offset - 15,
    centerY - offset - 15,
    centerX + offset + 15,
    centerY + offset + 15,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    centerX - scaledOuterRadius,
    centerY + scaledOuterRadius + 30,
    centerX + scaledOuterRadius,
    centerY + scaledOuterRadius + 30,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    centerX - scaledInnerRadius,
    centerY - scaledOuterRadius - 30,
    centerX + scaledInnerRadius,
    centerY - scaledOuterRadius - 30,
    `ID=${innerDiameter}mm`,
    5
  );

  // Wall thickness dimension
  const wallThickness = (outerDiameter - innerDiameter) / 2;
  generator.drawText(
    centerX + (scaledInnerRadius + scaledOuterRadius) / 2,
    centerY - 10,
    `w=${wallThickness.toFixed(1)}mm`,
    10,
    '#FFD700'
  );

  // Shape type label - PROMINENT indicator that this is HOLLOW
  generator.drawText(
    centerX,
    centerY - 15,
    'RING',
    12,
    '#00BFFF'  // Bright cyan for visibility
  );
  generator.drawText(
    centerX,
    centerY + 5,
    '(HOLLOW, L/T<5)',
    9,
    '#FFD700'  // Gold color for emphasis
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  thickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width / outerDiameter, height / thickness) * 0.6;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10);

  const rectX = x + (width - scaledOD) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  const hollowX = rectX + (scaledOD - scaledID) / 2;

  // Draw cross-section with hatching
  // Left wall
  generator.drawRectangle(rectX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 'visible');
  generator.drawHatching(rectX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 45, 4);

  // Right wall
  const rightX = rectX + (scaledOD + scaledID) / 2;
  generator.drawRectangle(rightX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 'visible');
  generator.drawHatching(rightX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 45, 4);

  // Hollow center (no hatching)
  generator.drawRectangle(hollowX, rectY, scaledID, scaledThickness, 'visible');

  // Centerlines
  generator.drawLine(
    x + width / 2,
    rectY - 20,
    x + width / 2,
    rectY + scaledThickness + 20,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledOD,
    rectY + scaledThickness + 30,
    `OD=${outerDiameter}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledOD + 30,
    rectY,
    rectX + scaledOD + 30,
    rectY + scaledThickness,
    `H=${thickness}mm`,
    5
  );

  // Wall thickness
  const wallThickness = (outerDiameter - innerDiameter) / 2;
  generator.drawDimension(
    rectX,
    rectY - 30,
    hollowX,
    rectY - 30,
    `w=${wallThickness.toFixed(1)}mm`,
    5
  );
}
