/**
 * Irregular/Custom Shape Technical Drawing Module
 * Generates 2-view technical drawings for custom irregular parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawIrregularTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const maxLength = dimensions.length || 120;
  const maxWidth = dimensions.width || 80;
  const maxThickness = dimensions.thickness || 40;

  // FRONT VIEW (Custom profile)
  drawFrontView(generator, maxLength, maxThickness, layout.frontView);

  // SIDE VIEW (Section with hatching)
  drawSideView(generator, maxWidth, maxThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  maxLength: number,
  maxThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width / maxLength, height / maxThickness) * 0.6;
  const scaledLength = maxLength * scale;
  const scaledThickness = maxThickness * scale;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Draw custom irregular shape (example: bracket-like shape)
  const path = new scope.Path();

  const leftEnd = centerX - scaledLength / 2;
  const rightEnd = centerX + scaledLength / 2;
  const topEdge = centerY - scaledThickness / 2;
  const bottomEdge = centerY + scaledThickness / 2;

  // Create custom bracket profile with holes and cutouts
  path.add(new scope.Point(leftEnd, bottomEdge));
  path.add(new scope.Point(leftEnd, topEdge + scaledThickness * 0.3));
  path.add(new scope.Point(leftEnd + scaledLength * 0.2, topEdge));
  path.add(new scope.Point(centerX - scaledLength * 0.1, topEdge));

  // Notch in middle
  path.add(new scope.Point(centerX - scaledLength * 0.1, topEdge + scaledThickness * 0.2));
  path.add(new scope.Point(centerX + scaledLength * 0.1, topEdge + scaledThickness * 0.2));
  path.add(new scope.Point(centerX + scaledLength * 0.1, topEdge));

  path.add(new scope.Point(rightEnd - scaledLength * 0.3, topEdge));
  path.add(new scope.Point(rightEnd, centerY));
  path.add(new scope.Point(rightEnd, bottomEdge));

  // Bottom profile with step
  path.add(new scope.Point(centerX + scaledLength * 0.2, bottomEdge));
  path.add(new scope.Point(centerX + scaledLength * 0.2, bottomEdge - scaledThickness * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.2, bottomEdge - scaledThickness * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.2, bottomEdge));

  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;

  // Add mounting holes
  const hole1 = new scope.Path.Circle({
    center: [leftEnd + scaledLength * 0.15, centerY],
    radius: scaledThickness * 0.1
  });
  hole1.strokeColor = new scope.Color('#FFFFFF');
  hole1.strokeWidth = 2;

  const hole2 = new scope.Path.Circle({
    center: [rightEnd - scaledLength * 0.15, centerY],
    radius: scaledThickness * 0.1
  });
  hole2.strokeColor = new scope.Color('#FFFFFF');
  hole2.strokeWidth = 2;

  // Centerlines for holes
  generator.drawLine(
    leftEnd + scaledLength * 0.15 - 15,
    centerY,
    leftEnd + scaledLength * 0.15 + 15,
    centerY,
    'center'
  );
  generator.drawLine(
    leftEnd + scaledLength * 0.15,
    centerY - 15,
    leftEnd + scaledLength * 0.15,
    centerY + 15,
    'center'
  );

  generator.drawLine(
    rightEnd - scaledLength * 0.15 - 15,
    centerY,
    rightEnd - scaledLength * 0.15 + 15,
    centerY,
    'center'
  );
  generator.drawLine(
    rightEnd - scaledLength * 0.15,
    centerY - 15,
    rightEnd - scaledLength * 0.15,
    centerY + 15,
    'center'
  );

  // Overall dimensions
  generator.drawDimension(
    leftEnd,
    bottomEdge + 30,
    rightEnd,
    bottomEdge + 30,
    `L=${maxLength}mm`,
    5
  );

  generator.drawDimension(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `H=${maxThickness}mm`,
    5
  );

  // Hole dimensions
  generator.drawText(
    leftEnd + scaledLength * 0.15,
    centerY - scaledThickness * 0.15,
    '2×Ø10',
    10,
    '#FFFFFF'
  );

  // Note about custom shape
  generator.drawText(centerX, y + height - 5, 'CUSTOM BRACKET - ALL DIMS IN MM', 10, '#FFD700');
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  maxWidth: number,
  maxThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width / maxWidth, height / maxThickness) * 0.6;
  const scaledWidth = maxWidth * scale;
  const scaledThickness = maxThickness * scale;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Draw side profile
  const path = new scope.Path();

  const leftEdge = centerX - scaledWidth / 2;
  const rightEdge = centerX + scaledWidth / 2;
  const topEdge = centerY - scaledThickness / 2;
  const bottomEdge = centerY + scaledThickness / 2;

  // T-shaped side profile
  path.add(new scope.Point(leftEdge, bottomEdge));
  path.add(new scope.Point(leftEdge, centerY));
  path.add(new scope.Point(leftEdge + scaledWidth * 0.3, centerY));
  path.add(new scope.Point(leftEdge + scaledWidth * 0.3, topEdge));
  path.add(new scope.Point(rightEdge - scaledWidth * 0.3, topEdge));
  path.add(new scope.Point(rightEdge - scaledWidth * 0.3, centerY));
  path.add(new scope.Point(rightEdge, centerY));
  path.add(new scope.Point(rightEdge, bottomEdge));

  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;

  // Add hatching for section view
  generator.drawHatching(
    leftEdge,
    topEdge,
    scaledWidth,
    scaledThickness,
    45,
    6
  );

  // Show hole in side view (hidden line)
  const hiddenCircle = new scope.Path.Circle({
    center: [centerX, centerY - scaledThickness * 0.15],
    radius: scaledThickness * 0.1
  });
  hiddenCircle.strokeColor = new scope.Color('#B0B0B0');
  hiddenCircle.strokeWidth = 1;
  hiddenCircle.dashArray = [5, 3];

  // Centerlines
  generator.drawLine(leftEdge - 20, centerY, rightEdge + 20, centerY, 'center');
  generator.drawLine(centerX, topEdge - 20, centerX, bottomEdge + 20, 'center');

  // Dimensions
  generator.drawDimension(
    leftEdge,
    bottomEdge + 30,
    rightEdge,
    bottomEdge + 30,
    `W=${maxWidth}mm`,
    5
  );

  generator.drawDimension(
    rightEdge + 30,
    topEdge,
    rightEdge + 30,
    bottomEdge,
    `H=${maxThickness}mm`,
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
