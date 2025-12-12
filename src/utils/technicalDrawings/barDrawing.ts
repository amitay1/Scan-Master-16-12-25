/**
 * Bar Technical Drawing Module
 * Generates 2-view technical drawings for solid rectangular bar parts
 *
 * BAR characteristics (industry convention):
 * - L/W > 4 (length-to-width ratio greater than 4)
 * - Elongated profile, compact cross-section
 * - Visually: long and narrow
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawBarTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // For bars, length should be significantly greater than width (L/W > 4)
  const length = dimensions.length || 500;
  const width = dimensions.width || Math.min(length / 5, 50);
  const thickness = dimensions.thickness || width;

  // FRONT VIEW (Length × Thickness)
  drawFrontView(generator, length, thickness, layout.frontView);

  // SIDE VIEW (Width × Thickness - Section with hatching)
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

  // Scale to fit
  const scale = Math.min(width / length, height / thickness) * 0.6;
  const scaledLength = length * scale;
  const scaledThickness = thickness * scale;

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle - solid bar
  generator.drawRectangle(rectX, rectY, scaledLength, scaledThickness, 'visible');

  // Centerlines
  generator.drawCenterlines(
    x + width / 2,
    y + height / 2,
    scaledLength,
    scaledThickness
  );

  // Dimensions with tolerances
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
  const scale = Math.min(viewWidth / width, height / thickness) * 0.6;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;

  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Main rectangle with hatching (solid bar)
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

  generator.drawDimension(
    rectX + scaledWidth + 30,
    rectY,
    rectX + scaledWidth + 30,
    rectY + scaledThickness,
    `T=${thickness}mm`,
    5
  );

  generator.drawText(
    x + viewWidth / 2,
    rectY + scaledThickness / 2,
    'BAR (L/W>4)',
    10,
    '#FFFFFF'
  );
}
