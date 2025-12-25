/**
 * Pyramid Technical Drawing Module
 * Generates 2-view technical drawings for pyramid parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawPyramidTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const baseLength = dimensions.length || 100;
  const baseWidth = dimensions.width || baseLength; // Square base by default
  const height = dimensions.thickness * 2 || 80; // Use thickness as height reference

  // FRONT VIEW (Triangle)
  drawFrontView(generator, baseLength, height, layout.frontView);

  // SIDE VIEW (Triangle - Section with hatching)
  drawSideView(generator, baseWidth, height, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  baseLength: number,
  height: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scaleW = width * 0.6 / baseLength;
  const scaleH = viewHeight * 0.6 / height;
  const scale = Math.min(scaleW, scaleH);

  const scaledBase = baseLength * scale;
  const scaledHeight = height * scale;

  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  const bottomY = centerY + scaledHeight / 2;
  const topY = centerY - scaledHeight / 2;

  // Draw pyramid triangle
  const path = new scope.Path();
  path.add(new scope.Point(centerX - scaledBase / 2, bottomY)); // Bottom left
  path.add(new scope.Point(centerX, topY)); // Apex
  path.add(new scope.Point(centerX + scaledBase / 2, bottomY)); // Bottom right
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;

  // Draw height centerline
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');

  // Draw base centerline
  generator.drawLine(
    centerX - scaledBase / 2 - 20,
    bottomY,
    centerX + scaledBase / 2 + 20,
    bottomY,
    'center'
  );

  // Hidden line for back edge (from apex to back center of base)
  generator.drawLine(centerX, topY, centerX, bottomY, 'hidden');

  // Dimensions
  generator.drawDimension(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `L=${baseLength}mm`,
    5
  );

  generator.drawDimension(
    centerX + scaledBase / 2 + 30,
    bottomY,
    centerX + scaledBase / 2 + 30,
    topY,
    `H=${height}mm`,
    5
  );

  // Angle dimension
  const angle = Math.atan(height / (baseLength / 2)) * 180 / Math.PI;
  generator.drawText(
    centerX - scaledBase / 4,
    bottomY - 20,
    `α=${angle.toFixed(1)}°`,
    10,
    '#FFFFFF'
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  baseWidth: number,
  height: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scaleW = width * 0.6 / baseWidth;
  const scaleH = viewHeight * 0.6 / height;
  const scale = Math.min(scaleW, scaleH);

  const scaledBase = baseWidth * scale;
  const scaledHeight = height * scale;

  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  const bottomY = centerY + scaledHeight / 2;
  const topY = centerY - scaledHeight / 2;

  // Draw pyramid triangle (side view)
  const path = new scope.Path();
  path.add(new scope.Point(centerX - scaledBase / 2, bottomY));
  path.add(new scope.Point(centerX, topY));
  path.add(new scope.Point(centerX + scaledBase / 2, bottomY));
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;

  // Add hatching for section view
  generator.drawHatching(
    centerX - scaledBase / 2,
    topY,
    scaledBase,
    scaledHeight,
    45,
    6
  );

  // Centerlines
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');
  generator.drawLine(
    centerX - scaledBase / 2 - 20,
    bottomY,
    centerX + scaledBase / 2 + 20,
    bottomY,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `W=${baseWidth}mm`,
    5
  );

  generator.drawText(
    centerX,
    centerY,
    'SOLID',
    10,
    '#FFFFFF'
  );
}
