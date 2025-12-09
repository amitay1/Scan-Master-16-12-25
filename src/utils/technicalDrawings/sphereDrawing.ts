/**
 * Sphere Technical Drawing Module
 * Generates 2-view technical drawings for spherical parts
 * Supports solid and hollow configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawSphereTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || dimensions.length;
  const innerDiameter = dimensions.innerDiameter;
  const isHollow = dimensions.isHollow || (innerDiameter && innerDiameter > 0);

  // FRONT VIEW (Circle)
  drawFrontView(generator, diameter, isHollow, innerDiameter, layout.frontView);

  // SIDE VIEW (Section with hatching)
  drawSideView(generator, diameter, isHollow, innerDiameter, layout.sideView);
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

  // Draw inner circle if hollow (hidden)
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerRadius = (innerDiameter * scale) / 2;
    generator.drawCircle(centerX, centerY, scaledInnerRadius, 'hidden');
  }

  // Centerlines
  generator.drawLine(centerX - scaledRadius - 20, centerY, centerX + scaledRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledRadius - 20, centerX, centerY + scaledRadius + 20, 'center');

  // Dimensions with tolerance
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
    generator.drawDimension(
      centerX - (innerDiameter * scale) / 2,
      centerY - scaledRadius - 30,
      centerX + (innerDiameter * scale) / 2,
      centerY - scaledRadius - 30,
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
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Section outline (circle)
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');

  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerRadius = (innerDiameter * scale) / 2;

    // Inner circle for hollow sphere
    generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

    // Hatching for the wall area (approximated with segments)
    const wallThickness = scaledRadius - scaledInnerRadius;
    for (let angle = 0; angle < 360; angle += 30) {
      const rad = (angle * Math.PI) / 180;
      const midRadius = (scaledRadius + scaledInnerRadius) / 2;
      const hatchX = centerX + midRadius * Math.cos(rad) - wallThickness / 3;
      const hatchY = centerY + midRadius * Math.sin(rad) - wallThickness / 3;
      generator.drawHatching(hatchX, hatchY, wallThickness / 1.5, wallThickness / 1.5, 45, 3);
    }

    // Wall thickness
    generator.drawText(
      centerX + (scaledInnerRadius + scaledRadius) / 2,
      centerY - 10,
      `t=${((diameter - innerDiameter) / 2).toFixed(1)}mm`,
      10,
      '#FFD700'
    );
  } else {
    // Solid - add cross-hatching
    const numLines = 15;
    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * (scaledRadius * 2 / numLines);
      const y1 = centerY + offset;

      if (Math.abs(offset) < scaledRadius) {
        const x_offset = Math.sqrt(scaledRadius * scaledRadius - offset * offset);
        const hatchLine = new scope.Path();
        hatchLine.add(new scope.Point(centerX - x_offset, y1));
        hatchLine.add(new scope.Point(centerX + x_offset, y1));
        hatchLine.strokeColor = new scope.Color('#CCCCCC');
        hatchLine.strokeWidth = 0.5;
        hatchLine.rotate(45, new scope.Point(centerX, centerY));
      }
    }

    generator.drawText(centerX, centerY, 'SOLID', 10, '#FFFFFF');
  }

  // Centerlines
  generator.drawLine(centerX - scaledRadius - 20, centerY, centerX + scaledRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledRadius - 20, centerX, centerY + scaledRadius + 20, 'center');
}
