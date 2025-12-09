/**
 * Box Technical Drawing Module
 * Generates 2-view technical drawings for rectangular box parts
 * Supports solid and hollow (with inner cavity) configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawBoxTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness, isHollow, innerLength, innerWidth, wallThickness } = dimensions;

  // FRONT VIEW (Length × Thickness)
  drawFrontView(generator, length, thickness, isHollow, innerLength, wallThickness, layout.frontView);

  // SIDE VIEW (Width × Thickness) - shows cross-section for hollow parts
  drawSideView(generator, width, thickness, isHollow, innerWidth, wallThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  thickness: number,
  isHollow?: boolean,
  innerLength?: number,
  wallThickness?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width / length, height / thickness) * 0.6;
  const scaledLength = length * scale;
  const scaledThickness = thickness * scale;

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle (outer)
  generator.drawRectangle(rectX, rectY, scaledLength, scaledThickness, 'visible');

  // Draw inner rectangle if hollow
  if (isHollow && (innerLength || wallThickness)) {
    const wall = wallThickness ? wallThickness * scale : scaledThickness * 0.15;
    const scaledInnerLength = innerLength ? innerLength * scale : scaledLength - (2 * wall);
    const scaledInnerThickness = scaledThickness - (2 * wall);

    const innerX = rectX + (scaledLength - scaledInnerLength) / 2;
    const innerY = rectY + wall;

    // Inner cavity (hidden lines for front view)
    generator.drawRectangle(innerX, innerY, scaledInnerLength, scaledInnerThickness, 'hidden');
  }

  // Centerlines
  generator.drawCenterlines(
    x + width / 2,
    y + height / 2,
    scaledLength,
    scaledThickness
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledLength,
    rectY + scaledThickness + 30,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledThickness,
    `T=${thickness}mm`,
    5
  );

  // Wall thickness dimension if hollow
  if (isHollow && wallThickness) {
    generator.drawText(
      rectX + scaledLength / 2,
      rectY - 15,
      `t=${wallThickness}mm`,
      10,
      '#FFD700'
    );
  }
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  width: number,
  thickness: number,
  isHollow?: boolean,
  innerWidth?: number,
  wallThickness?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width: viewWidth, height } = viewConfig;

  // View label - show as section if hollow
  const label = isHollow ? 'SECTION A-A' : 'SIDE VIEW';
  generator.drawViewLabel(x + viewWidth / 2, y, label);

  // Scale to fit
  const scale = Math.min(viewWidth / width, height / thickness) * 0.6;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;

  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle (outer)
  generator.drawRectangle(rectX, rectY, scaledWidth, scaledThickness, 'visible');

  // Draw inner cavity if hollow (with hatching for section view)
  if (isHollow && (innerWidth || wallThickness)) {
    const wall = wallThickness ? wallThickness * scale : scaledThickness * 0.15;
    const scaledInnerWidth = innerWidth ? innerWidth * scale : scaledWidth - (2 * wall);
    const scaledInnerThickness = scaledThickness - (2 * wall);

    const innerX = rectX + (scaledWidth - scaledInnerWidth) / 2;
    const innerY = rectY + wall;

    // Inner cavity outline
    generator.drawRectangle(innerX, innerY, scaledInnerWidth, scaledInnerThickness, 'visible');

    // Add hatching for walls (section view)
    // Top wall
    generator.drawHatching(rectX, rectY, scaledWidth, wall, 45, 6);
    // Bottom wall
    generator.drawHatching(rectX, rectY + scaledThickness - wall, scaledWidth, wall, 45, 6);
    // Left wall
    generator.drawHatching(rectX, rectY + wall, (scaledWidth - scaledInnerWidth) / 2, scaledInnerThickness, 45, 6);
    // Right wall
    generator.drawHatching(innerX + scaledInnerWidth, rectY + wall, (scaledWidth - scaledInnerWidth) / 2, scaledInnerThickness, 45, 6);

    // Label showing hollow
    generator.drawText(
      x + viewWidth / 2,
      rectY + scaledThickness / 2,
      'HOLLOW',
      10,
      '#FFFFFF'
    );
  } else {
    // Solid - add hatching for section view
    generator.drawHatching(rectX, rectY, scaledWidth, scaledThickness, 45, 6);

    generator.drawText(
      x + viewWidth / 2,
      rectY + scaledThickness / 2,
      'SOLID',
      10,
      '#FFFFFF'
    );
  }

  // Centerlines
  generator.drawCenterlines(
    x + viewWidth / 2,
    y + height / 2,
    scaledWidth,
    scaledThickness
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledWidth,
    rectY + scaledThickness + 30,
    `W=${width}mm`,
    5
  );
}
