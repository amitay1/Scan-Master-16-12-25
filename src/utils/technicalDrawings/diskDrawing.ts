/**
 * Disk Technical Drawing Module
 * Generates 2-view technical drawings for circular flat disk parts
 * Supports solid and hollow (ring) configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawDiskTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || dimensions.length || 100;
  const thickness = dimensions.thickness || 10;
  const innerDiameter = dimensions.innerDiameter;
  const isHollow = dimensions.isHollow || (innerDiameter && innerDiameter > 0);

  // FRONT VIEW (Circle)
  drawFrontView(generator, diameter, isHollow, innerDiameter, layout.frontView);

  // SIDE VIEW (Edge view with section)
  drawSideView(generator, diameter, thickness, isHollow, innerDiameter, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  isHollow?: boolean,
  innerDiameter?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Main circle
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');

  // Draw inner circle if hollow
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerRadius = (innerDiameter * scale) / 2;
    generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');
  }

  // Centerlines
  generator.drawLine(centerX - scaledRadius - 20, centerY, centerX + scaledRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledRadius - 20, centerX, centerY + scaledRadius + 20, 'center');

  // Add 45° reference lines for inspection zones
  const offset = scaledRadius * 0.7071; // cos(45°)
  generator.drawLine(
    centerX - offset - 15,
    centerY - offset - 15,
    centerX + offset + 15,
    centerY + offset + 15,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    centerX - scaledRadius,
    centerY + scaledRadius + 30,
    centerX + scaledRadius,
    centerY + scaledRadius + 30,
    `Ø${diameter}mm`,
    5
  );

  // Inner diameter if hollow
  if (isHollow && innerDiameter) {
    const scaledInnerRadius = (innerDiameter * scale) / 2;
    generator.drawDimension(
      centerX - scaledInnerRadius,
      centerY - scaledRadius - 30,
      centerX + scaledInnerRadius,
      centerY - scaledRadius - 30,
      `ID=${innerDiameter}mm`,
      5
    );
  }
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  thickness: number,
  isHollow?: boolean,
  innerDiameter?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width / diameter, height / thickness) * 0.6;
  const scaledDiameter = diameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10); // Ensure min visible thickness

  const rectX = x + (width - scaledDiameter) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledID = innerDiameter * scale;
    const hollowX = rectX + (scaledDiameter - scaledID) / 2;

    // Draw cross-section with hatching for hollow disk
    // Left wall
    generator.drawRectangle(rectX, rectY, (scaledDiameter - scaledID) / 2, scaledThickness, 'visible');
    generator.drawHatching(rectX, rectY, (scaledDiameter - scaledID) / 2, scaledThickness, 45, 4);

    // Right wall
    const rightX = rectX + (scaledDiameter + scaledID) / 2;
    generator.drawRectangle(rightX, rectY, (scaledDiameter - scaledID) / 2, scaledThickness, 'visible');
    generator.drawHatching(rightX, rectY, (scaledDiameter - scaledID) / 2, scaledThickness, 45, 4);

    // Hollow center
    generator.drawRectangle(hollowX, rectY, scaledID, scaledThickness, 'visible');
    // Hollow disk label
    generator.drawText(x + width / 2, rectY + scaledThickness / 2 - 10, 'DISK', 12, '#00BFFF');
    generator.drawText(x + width / 2, rectY + scaledThickness / 2 + 8, '(HOLLOW)', 9, '#FFD700');
  } else {
    // Solid disk - full hatching
    generator.drawRectangle(rectX, rectY, scaledDiameter, scaledThickness, 'visible');
    generator.drawHatching(rectX, rectY, scaledDiameter, scaledThickness, 45, 4);
    // Solid disk label - PROMINENT indicator
    generator.drawText(x + width / 2, rectY + scaledThickness / 2 - 10, 'DISK', 12, '#FF6B6B');
    generator.drawText(x + width / 2, rectY + scaledThickness / 2 + 8, '(SOLID, H/D<0.5)', 9, '#FFFFFF');
  }

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
    rectX + scaledDiameter,
    rectY + scaledThickness + 30,
    `Ø${diameter}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledDiameter + 30,
    rectY,
    rectX + scaledDiameter + 30,
    rectY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}
