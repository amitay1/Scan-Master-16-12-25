/**
 * Plate Technical Drawing Module
 * Generates 2-view technical drawings for flat rectangular plate parts
 *
 * PLATE characteristics (per ASTM E2375-16):
 * - W/T > 5 (width-to-thickness ratio greater than 5)
 * - Flat, thin, sheet-like geometry
 * - Visually: emphasized length/width, thin profile
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawPlateTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const length = dimensions.length || 400;
  const width = dimensions.width || 200;
  // For plates, thickness should be thin relative to width (W/T > 5)
  const thickness = dimensions.thickness || Math.min(width / 6, 20);

  // FRONT VIEW (Length × Thickness - emphasize thinness)
  drawFrontView(generator, length, thickness, layout.frontView);

  // SIDE VIEW (Width × Thickness - section view)
  drawSideView(generator, width, thickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  thickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit - emphasize length over thin thickness
  const scale = Math.min(width / length, height / thickness) * 0.7;
  const scaledLength = length * scale;
  const scaledThickness = Math.max(thickness * scale, 10); // Ensure min visible thickness

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledThickness, 'visible');

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
    `t=${thickness}mm`,
    5
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  width: number,
  thickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width: viewWidth, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(viewWidth / width, height / thickness) * 0.7;
  const scaledWidth = width * scale;
  const scaledThickness = Math.max(thickness * scale, 10); // Ensure min visible thickness

  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle with hatching (solid plate)
  generator.drawRectangle(rectX, rectY, scaledWidth, scaledThickness, 'visible');
  generator.drawHatching(rectX, rectY, scaledWidth, scaledThickness, 45, 6);

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

  generator.drawText(
    x + viewWidth / 2,
    rectY + scaledThickness / 2,
    'PLATE (W/T>5)',
    10,
    '#000000'
  );
}
