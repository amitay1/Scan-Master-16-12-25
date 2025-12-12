/**
 * Cylinder Technical Drawing Module
 * Generates 2-view technical drawings for cylindrical parts
 * Supports solid and hollow configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawCylinderTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || dimensions.outerDiameter || 50;
  const length = dimensions.length;
  const innerDiameter = dimensions.innerDiameter;
  const isHollow = dimensions.isHollow || (innerDiameter && innerDiameter > 0);

  // FRONT VIEW (Length × Diameter - side view of cylinder)
  drawFrontView(generator, length, diameter, isHollow, innerDiameter, layout.frontView);

  // SIDE VIEW (Circle cross-section)
  drawSideView(generator, diameter, isHollow, innerDiameter, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
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
  const scale = Math.min(width / length, height / diameter) * 0.6;
  const scaledLength = length * scale;
  const scaledDiameter = diameter * scale;

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledDiameter) / 2;

  // Main rectangle (cylinder viewed from side)
  generator.drawRectangle(rectX, rectY, scaledLength, scaledDiameter, 'visible');

  // Draw inner diameter if hollow
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerDiameter = innerDiameter * scale;
    const innerY = rectY + (scaledDiameter - scaledInnerDiameter) / 2;

    // Inner rectangle (hidden lines showing bore)
    generator.drawRectangle(rectX, innerY, scaledLength, scaledInnerDiameter, 'hidden');
  }

  // Centerlines - horizontal and vertical
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledLength + 20,
    centerY,
    'center'
  );

  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledDiameter + 20,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledDiameter + 35,
    rectX + scaledLength,
    rectY + scaledDiameter + 35,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledLength + 35,
    rectY,
    rectX + scaledLength + 35,
    rectY + scaledDiameter,
    `Ø${diameter}mm`,
    5
  );

  // Inner diameter dimension if hollow
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerDiameter = innerDiameter * scale;
    const innerY = rectY + (scaledDiameter - scaledInnerDiameter) / 2;

    generator.drawDimension(
      rectX + scaledLength + 55,
      innerY,
      rectX + scaledLength + 55,
      innerY + scaledInnerDiameter,
      `ID=${innerDiameter}mm`,
      5
    );
  }
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  isHollow?: boolean,
  innerDiameter?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  const label = isHollow ? 'SECTION A-A' : 'END VIEW';
  generator.drawViewLabel(x + width / 2, y, label);

  // Scale to fit
  const scale = Math.min(width, height) / diameter * 0.5;
  const scaledRadius = (diameter / 2) * scale;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Main circle (outer)
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');

  if (isHollow && innerDiameter && innerDiameter > 0) {
    // Hollow cylinder - draw concentric circles with hatching
    const scaledInnerRadius = (innerDiameter / 2) * scale;

    // Inner circle
    generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

    // Hatching for the wall area (approximated with rectangles)
    const wallThickness = scaledRadius - scaledInnerRadius;
    // Draw hatching in 4 sections around the ring
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const midRadius = (scaledRadius + scaledInnerRadius) / 2;
      const hatchX = centerX + midRadius * Math.cos(rad) - wallThickness / 4;
      const hatchY = centerY + midRadius * Math.sin(rad) - wallThickness / 4;
      generator.drawHatching(hatchX, hatchY, wallThickness / 2, wallThickness / 2, 45, 3);
    }

    // Wall thickness indicator
    generator.drawText(
      centerX + (scaledInnerRadius + scaledRadius) / 2 + 10,
      centerY - 10,
      `t=${((diameter - innerDiameter) / 2).toFixed(1)}mm`,
      10,
      '#FFD700'
    );

    // Dimension - inner diameter
    generator.drawDimension(
      centerX - scaledInnerRadius,
      centerY + scaledRadius + 25,
      centerX + scaledInnerRadius,
      centerY + scaledRadius + 25,
      `ID=${innerDiameter}mm`,
      5
    );
  } else {
    // Solid cylinder - show hatching
    generator.drawHatching(
      centerX - scaledRadius,
      centerY - scaledRadius,
      scaledRadius * 2,
      scaledRadius * 2,
      45,
      6
    );

    // Shape type label - PROMINENT indicator that this is SOLID
    generator.drawText(
      centerX,
      centerY - 15,
      'CYLINDER',
      12,
      '#FF6B6B'  // Coral red for visibility
    );
    generator.drawText(
      centerX,
      centerY + 5,
      '(SOLID)',
      10,
      '#FFFFFF'  // White for contrast
    );
  }

  // Centerlines - cross
  generator.drawLine(
    centerX - scaledRadius - 20,
    centerY,
    centerX + scaledRadius + 20,
    centerY,
    'center'
  );

  generator.drawLine(
    centerX,
    centerY - scaledRadius - 20,
    centerX,
    centerY + scaledRadius + 20,
    'center'
  );

  // Dimension - outer diameter
  generator.drawDimension(
    centerX - scaledRadius,
    centerY - scaledRadius - 25,
    centerX + scaledRadius,
    centerY - scaledRadius - 25,
    `Ø${diameter}mm`,
    5
  );
}
