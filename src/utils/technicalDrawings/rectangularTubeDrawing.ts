/**
 * Rectangular Tube Technical Drawing Module
 * Generates 2-view technical drawings for hollow rectangular tube parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawRectangularTubeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const length = dimensions.length || 400;
  const width = dimensions.width || 100;
  const thickness = dimensions.thickness || 80;
  const wallThickness = dimensions.wallThickness || 5;

  // FRONT VIEW (Length × Thickness with hollow interior)
  drawFrontView(generator, length, thickness, wallThickness, layout.frontView);

  // SIDE VIEW (Cross-section with hatching)
  drawSideView(generator, width, thickness, wallThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  thickness: number,
  wallThickness: number,
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
  const scaledWall = wallThickness * scale;

  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Outer rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledThickness, 'visible');

  // Inner rectangle (hollow interior) - using hidden lines
  const innerX = rectX;
  const innerY = rectY + scaledWall;
  const innerWidth = scaledLength;
  const innerHeight = scaledThickness - (2 * scaledWall);

  generator.drawRectangle(innerX, innerY, innerWidth, innerHeight, 'hidden');

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
  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledThickness + 20,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 35,
    rectX + scaledLength,
    rectY + scaledThickness + 35,
    `L=${length}mm`,
    5
  );

  generator.drawDimension(
    rectX + scaledLength + 35,
    rectY,
    rectX + scaledLength + 35,
    rectY + scaledThickness,
    `H=${thickness}mm`,
    5
  );

  // Wall thickness dimension
  generator.drawText(
    rectX + scaledLength / 2,
    rectY - 15,
    `t=${wallThickness}mm`,
    10,
    '#FFD700'
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  width: number,
  thickness: number,
  wallThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width: viewWidth, height } = viewConfig;
  const scope = generator.getScope();

  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(viewWidth / width, height / thickness) * 0.6;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  const scaledWall = Math.max(wallThickness * scale, 3); // Ensure visible wall

  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Draw cross-section with hollow center
  // Outer rectangle
  const outerPath = new scope.Path.Rectangle({
    point: [rectX, rectY],
    size: [scaledWidth, scaledThickness]
  });
  outerPath.strokeColor = new scope.Color('#FFFFFF');
  outerPath.strokeWidth = 2;

  // Inner hollow rectangle
  const innerX = rectX + scaledWall;
  const innerY = rectY + scaledWall;
  const innerWidth = scaledWidth - (2 * scaledWall);
  const innerHeight = scaledThickness - (2 * scaledWall);

  const innerPath = new scope.Path.Rectangle({
    point: [innerX, innerY],
    size: [innerWidth, innerHeight]
  });
  innerPath.strokeColor = new scope.Color('#FFFFFF');
  innerPath.strokeWidth = 2;

  // Hatching for walls only
  // Top wall
  generator.drawHatching(rectX, rectY, scaledWidth, scaledWall, 45, 3);

  // Bottom wall
  generator.drawHatching(rectX, rectY + scaledThickness - scaledWall, scaledWidth, scaledWall, 45, 3);

  // Left wall
  generator.drawHatching(rectX, rectY + scaledWall, scaledWall, innerHeight, 45, 3);

  // Right wall
  generator.drawHatching(rectX + scaledWidth - scaledWall, rectY + scaledWall, scaledWall, innerHeight, 45, 3);

  // Centerlines
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;

  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledWidth + 20,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledThickness + 20,
    'center'
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
    `H=${thickness}mm`,
    5
  );

  // Wall thickness
  generator.drawDimension(
    innerX,
    rectY - 30,
    rectX,
    rectY - 30,
    `t=${wallThickness}mm`,
    5
  );
}
