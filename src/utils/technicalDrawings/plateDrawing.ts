/**
 * Plate Technical Drawing Module
 * Generates multi-view technical drawings for flat rectangular plate parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawPlateTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  // FRONT VIEW (Length × Thickness - thin rectangle)
  drawFrontView(generator, length, thickness, layout.frontView);
  
  // TOP VIEW (Length × Width - main face)
  drawTopView(generator, length, width, layout.topView);
  
  // SIDE VIEW (Width × Thickness - thin rectangle)
  drawSideView(generator, width, thickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, length, width, thickness, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
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
  
  // Surface finish indicators
  generator.drawSurfaceFinish(rectX + 30, rectY - 10, 'asRolled', '12.5');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledLength,
    rectY + scaledThickness + 30,
    `${length}`,
    '+0.5',
    '-0.5',
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
  
  // Add note for plate
  generator.drawText(x + width / 2, y + height - 10, 'FLAT PLATE', '12px');
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  length: number,
  width: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(viewWidth / length, height / width) * 0.7;
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  
  const rectX = x + (viewWidth - scaledLength) / 2;
  const rectY = y + (height - scaledWidth) / 2;
  
  // Main rectangle - this is the main face of the plate
  generator.drawRectangle(rectX, rectY, scaledLength, scaledWidth, 'visible');
  
  // Add hatching to show surface
  generator.drawHatching(rectX, rectY, scaledLength, scaledWidth, 45, 5);
  
  // Centerlines
  generator.drawCenterlines(
    x + viewWidth / 2,
    y + height / 2,
    scaledLength,
    scaledWidth
  );
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledWidth + 30,
    rectX + scaledLength,
    rectY + scaledWidth + 30,
    `${length}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledWidth,
    `${width}`,
    '+0.5',
    '-0.5',
    5
  );
  
  // Flatness tolerance
  generator.drawGeometricTolerance(
    x + viewWidth / 2,
    rectY - 30,
    'flatness',
    '0.1',
    ''
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  width: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'SIDE VIEW');
  
  // Scale to fit
  const scale = Math.min(viewWidth / width, height / thickness) * 0.7;
  const scaledWidth = width * scale;
  const scaledThickness = Math.max(thickness * scale, 10); // Ensure min visible thickness
  
  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Main rectangle - very thin
  generator.drawRectangle(rectX, rectY, scaledWidth, scaledThickness, 'visible');
  
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

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  length: number,
  width: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale for thin plate
  const maxDim = Math.max(length, width);
  const scale = Math.min(viewWidth, height) * 0.5 / maxDim;
  
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledThickness = Math.max(thickness * scale, 5); // Ensure min visible thickness
  
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  // Isometric angles
  const angle = 30 * Math.PI / 180;
  
  // Draw thin plate as a flat parallelepiped
  const path = new scope.Path();
  
  // Bottom face vertices
  const bl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY + scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const br = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY - scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const fr = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY - scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  const fl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY + scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  
  // Draw bottom face (main plate surface)
  path.add(bl);
  path.add(br);
  path.add(fr);
  path.add(fl);
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Draw thin thickness edges
  const thicknessOffset = scaledThickness;
  
  // Top face vertices (offset by thickness)
  const tlTop = new scope.Point(bl.x, bl.y - thicknessOffset);
  const trTop = new scope.Point(br.x, br.y - thicknessOffset);
  const frTop = new scope.Point(fr.x, fr.y - thicknessOffset);
  const flTop = new scope.Point(fl.x, fl.y - thicknessOffset);
  
  // Draw visible edges
  const topPath = new scope.Path();
  topPath.add(tlTop);
  topPath.add(trTop);
  topPath.add(frTop);
  topPath.strokeColor = new scope.Color('#FFFFFF');
  topPath.strokeWidth = 2;
  
  // Draw vertical edges
  const edge1 = new scope.Path.Line(bl, tlTop);
  edge1.strokeColor = new scope.Color('#FFFFFF');
  edge1.strokeWidth = 2;
  
  const edge2 = new scope.Path.Line(br, trTop);
  edge2.strokeColor = new scope.Color('#FFFFFF');
  edge2.strokeWidth = 2;
  
  const edge3 = new scope.Path.Line(fr, frTop);
  edge3.strokeColor = new scope.Color('#FFFFFF');
  edge3.strokeWidth = 2;
  
  // Hidden edge
  const hiddenEdge = new scope.Path.Line(fl, flTop);
  hiddenEdge.strokeColor = new scope.Color('#B0B0B0');
  hiddenEdge.strokeWidth = 1;
  hiddenEdge.dashArray = [5, 3];
}