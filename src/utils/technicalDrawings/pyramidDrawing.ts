/**
 * Pyramid Technical Drawing Module
 * Generates multi-view technical drawings for pyramid parts
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
  
  // TOP VIEW (Square/Rectangle)
  drawTopView(generator, baseLength, baseWidth, layout.topView);
  
  // SIDE VIEW (Triangle)
  drawSideView(generator, baseWidth, height, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, baseLength, baseWidth, height, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  baseLength: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
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
  generator.drawDimensionWithTolerance(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `${baseLength}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    centerX + scaledBase / 2 + 30,
    bottomY,
    centerX + scaledBase / 2 + 30,
    topY,
    `h=${height}`,
    '+0.5',
    '-0.5',
    5
  );
  
  // Angle dimension
  const angle = Math.atan(height / (baseLength / 2)) * 180 / Math.PI;
  generator.drawText(
    centerX - scaledBase / 4,
    bottomY - 20,
    `α=${angle.toFixed(1)}°`,
    '10px'
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  baseLength: number,
  baseWidth: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width / baseLength, height / baseWidth) * 0.6;
  const scaledLength = baseLength * scale;
  const scaledWidth = baseWidth * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw base rectangle
  const rectX = centerX - scaledLength / 2;
  const rectY = centerY - scaledWidth / 2;
  generator.drawRectangle(rectX, rectY, scaledLength, scaledWidth, 'visible');
  
  // Draw diagonals to show apex position
  generator.drawLine(rectX, rectY, rectX + scaledLength, rectY + scaledWidth, 'center');
  generator.drawLine(rectX + scaledLength, rectY, rectX, rectY + scaledWidth, 'center');
  
  // Draw center point (apex projection)
  const apexPoint = new scope.Path.Circle({
    center: [centerX, centerY],
    radius: 3
  });
  apexPoint.strokeColor = new scope.Color('#FFFFFF');
  apexPoint.fillColor = new scope.Color('#FFFFFF');
  
  // Add cross at apex
  generator.drawLine(centerX - 10, centerY, centerX + 10, centerY, 'center');
  generator.drawLine(centerX, centerY - 10, centerX, centerY + 10, 'center');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledWidth + 30,
    rectX + scaledLength,
    rectY + scaledWidth + 30,
    `${baseLength}`,
    '+0.5',
    '-0.5',
    5
  );
  
  if (Math.abs(baseLength - baseWidth) > 0.1) {
    generator.drawDimensionWithTolerance(
      rectX + scaledLength + 30,
      rectY,
      rectX + scaledLength + 30,
      rectY + scaledWidth,
      `${baseWidth}`,
      '+0.5',
      '-0.5',
      5
    );
  }
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  baseWidth: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SIDE VIEW');
  
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
  
  // Centerlines
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');
  generator.drawLine(
    centerX - scaledBase / 2 - 20,
    bottomY,
    centerX + scaledBase / 2 + 20,
    bottomY,
    'center'
  );
  
  // Hidden line for internal edge
  generator.drawLine(centerX, topY, centerX, bottomY, 'hidden');
  
  // Dimensions
  generator.drawDimension(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `W=${baseWidth}mm`,
    5
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  baseLength: number,
  baseWidth: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale
  const maxDim = Math.max(baseLength, baseWidth, height);
  const scale = Math.min(width, viewHeight) * 0.5 / maxDim;
  
  const scaledLength = baseLength * scale;
  const scaledWidth = baseWidth * scale;
  const scaledHeight = height * scale;
  
  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  
  // Isometric angles
  const angle = 30 * Math.PI / 180;
  
  // Base vertices (clockwise from back-left)
  const bl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY + scaledHeight / 2 + scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const br = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY + scaledHeight / 2 - scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const fr = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY + scaledHeight / 2 - scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  const fl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY + scaledHeight / 2 + scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  
  // Apex point
  const apex = new scope.Point(centerX, centerY - scaledHeight / 2);
  
  // Draw base (hidden lines for back edges)
  const basePath = new scope.Path();
  basePath.add(bl);
  basePath.add(br);
  basePath.strokeColor = new scope.Color('#B0B0B0');
  basePath.strokeWidth = 1;
  basePath.dashArray = [5, 3];
  
  // Draw visible base edges
  const visibleBase = new scope.Path();
  visibleBase.add(br);
  visibleBase.add(fr);
  visibleBase.add(fl);
  visibleBase.strokeColor = new scope.Color('#FFFFFF');
  visibleBase.strokeWidth = 2;
  
  // Hidden base edge
  const hiddenBase = new scope.Path();
  hiddenBase.add(fl);
  hiddenBase.add(bl);
  hiddenBase.strokeColor = new scope.Color('#B0B0B0');
  hiddenBase.strokeWidth = 1;
  hiddenBase.dashArray = [5, 3];
  
  // Draw edges from base to apex
  // Back-left edge (hidden)
  const edge1 = new scope.Path.Line(bl, apex);
  edge1.strokeColor = new scope.Color('#B0B0B0');
  edge1.strokeWidth = 1;
  edge1.dashArray = [5, 3];
  
  // Other edges (visible)
  const edge2 = new scope.Path.Line(br, apex);
  edge2.strokeColor = new scope.Color('#FFFFFF');
  edge2.strokeWidth = 2;
  
  const edge3 = new scope.Path.Line(fr, apex);
  edge3.strokeColor = new scope.Color('#FFFFFF');
  edge3.strokeWidth = 2;
  
  const edge4 = new scope.Path.Line(fl, apex);
  edge4.strokeColor = new scope.Color('#FFFFFF');
  edge4.strokeWidth = 2;
}