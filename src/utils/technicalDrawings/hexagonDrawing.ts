// @ts-nocheck
/**
 * Hexagon Technical Drawing Module
 * Generates 2-view technical drawings for hexagonal bar parts
 * Supports solid and hollow configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawHexagonTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || 50;
  const length = dimensions.length;
  const innerDiameter = dimensions.innerDiameter;
  const isHollow = dimensions.isHollow || (innerDiameter && innerDiameter > 0);

  // FRONT VIEW (Hexagon end view)
  drawFrontView(generator, diameter, isHollow, innerDiameter, layout.frontView);

  // SIDE VIEW (Rectangle side view)
  drawSideView(generator, length, diameter, isHollow, innerDiameter, layout.sideView);
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
  const label = isHollow ? 'SECTION A-A' : 'FRONT VIEW';
  generator.drawViewLabel(x + width / 2, y, label);

  // Scale to fit
  const scale = Math.min(width, height) / diameter * 0.5;
  const scaledRadius = (diameter / 2) * scale;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const scope = generator.getScope();

  // Draw hexagon
  const hexagon = new scope.Path.RegularPolygon({
    center: [centerX, centerY],
    sides: 6,
    radius: scaledRadius,
    rotation: 30 // Flat side on top
  });
  hexagon.strokeColor = new scope.Color('#000000');
  hexagon.strokeWidth = 2;
  hexagon.fillColor = null;

  // Draw inner circle if hollow
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerRadius = (innerDiameter / 2) * scale;
    generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

    // Hatching between hexagon and inner circle
    for (let angle = 0; angle < 360; angle += 60) {
      const rad = (angle * Math.PI) / 180;
      const midRadius = (scaledRadius + scaledInnerRadius) / 2;
      const wallThickness = scaledRadius - scaledInnerRadius;
      const hatchX = centerX + midRadius * Math.cos(rad) - wallThickness / 4;
      const hatchY = centerY + midRadius * Math.sin(rad) - wallThickness / 4;
      generator.drawHatching(hatchX, hatchY, wallThickness / 2, wallThickness / 2, 45, 3);
    }
  } else {
    // Solid - add hatching
    generator.drawHatching(
      centerX - scaledRadius,
      centerY - scaledRadius,
      scaledRadius * 2,
      scaledRadius * 2,
      45,
      6
    );
  }

  // Centerlines
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

  // Dimensions - Across Flats (AF)
  const af = diameter * Math.cos(Math.PI / 6); // Across flats
  generator.drawDimension(
    centerX - scaledRadius * Math.cos(Math.PI / 6),
    centerY + scaledRadius + 30,
    centerX + scaledRadius * Math.cos(Math.PI / 6),
    centerY + scaledRadius + 30,
    `AF=${af.toFixed(1)}mm`,
    5
  );

  // Across Corners (AC)
  generator.drawDimension(
    centerX + scaledRadius + 30,
    centerY - scaledRadius,
    centerX + scaledRadius + 30,
    centerY + scaledRadius,
    `AC=${diameter}mm`,
    5
  );

  // Inner diameter if hollow
  if (isHollow && innerDiameter) {
    generator.drawText(
      centerX,
      centerY,
      `ID=${innerDiameter}mm`,
      10,
      '#000000'
    );
  }
}

function drawSideView(
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
  generator.drawViewLabel(x + width / 2, y, 'SIDE VIEW');

  const af = diameter * Math.cos(Math.PI / 6); // Across flats

  // Scale to fit
  const scale = Math.min(width / length, height / af) * 0.6;
  const scaledLength = length * scale;
  const scaledAF = af * scale;

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledAF) / 2;

  // Main rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledAF, 'visible');

  // Draw inner hole if hollow
  if (isHollow && innerDiameter && innerDiameter > 0) {
    const scaledInnerDiameter = innerDiameter * scale;
    const innerY = rectY + (scaledAF - scaledInnerDiameter) / 2;
    generator.drawRectangle(rectX, innerY, scaledLength, scaledInnerDiameter, 'hidden');
  }

  // Centerlines
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledLength + 20,
    centerY,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledAF + 30,
    rectX + scaledLength,
    rectY + scaledAF + 30,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledAF,
    `AF=${af.toFixed(1)}mm`,
    5
  );
}
