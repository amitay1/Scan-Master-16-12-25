/**
 * Bar Technical Drawing Module
 * Generates multi-view technical drawings for solid rectangular bar parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawBarTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  // FRONT VIEW (Length × Thickness)
  drawFrontView(generator, length, thickness, layout.frontView);
  
  // TOP VIEW (Length × Width)
  drawTopView(generator, length, width, layout.topView);
  
  // SIDE VIEW (Width × Thickness)
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
  
  // Surface finish for machined surfaces
  generator.drawSurfaceFinish(rectX + 30, rectY - 10, 'machined', '3.2');
  
  // Dimensions with tolerances
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledLength,
    rectY + scaledThickness + 30,
    `${length}`,
    '+0.2',
    '-0.2',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledThickness,
    `${thickness}`,
    '+0.1',
    '-0.1',
    5
  );
  
  // Add straightness tolerance
  generator.drawGeometricTolerance(
    x + width / 2,
    rectY - 30,
    'straightness',
    '0.05',
    ''
  );
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
  const scale = Math.min(viewWidth / length, height / width) * 0.6;
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  
  const rectX = x + (viewWidth - scaledLength) / 2;
  const rectY = y + (height - scaledWidth) / 2;
  
  // Main rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledWidth, 'visible');
  
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
    '+0.2',
    '-0.2',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledWidth,
    `${width}`,
    '+0.1',
    '-0.1',
    5
  );
  
  // Perpendicularity tolerance
  generator.drawGeometricTolerance(
    rectX - 40,
    y + height / 2,
    'perpendicularity',
    '0.05',
    'A'
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
  const scale = Math.min(viewWidth / width, height / thickness) * 0.6;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  
  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Main rectangle
  generator.drawRectangle(rectX, rectY, scaledWidth, scaledThickness, 'visible');
  
  // Centerlines
  generator.drawCenterlines(
    x + viewWidth / 2,
    y + height / 2,
    scaledWidth,
    scaledThickness
  );
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledWidth,
    rectY + scaledThickness + 30,
    `${width}`,
    '+0.1',
    '-0.1',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledWidth + 30,
    rectY,
    rectX + scaledWidth + 30,
    rectY + scaledThickness,
    `${thickness}`,
    '+0.1',
    '-0.1',
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
  
  // Calculate scale for a solid bar
  const maxDim = Math.max(length, width, thickness);
  const scale = Math.min(viewWidth, height) * 0.4 / maxDim;
  
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  // Isometric angles
  const angle = 30 * Math.PI / 180;
  
  // Draw solid bar as a rectangular parallelepiped
  const path = new scope.Path();
  
  // Bottom face vertices
  const bl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY + scaledThickness / 2 + scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const br = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
    centerY + scaledThickness / 2 - scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
  );
  const fr = new scope.Point(
    centerX + scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY + scaledThickness / 2 - scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  const fl = new scope.Point(
    centerX - scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
    centerY + scaledThickness / 2 + scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
  );
  
  // Top face vertices
  const tlTop = new scope.Point(bl.x, bl.y - scaledThickness);
  const trTop = new scope.Point(br.x, br.y - scaledThickness);
  const frTop = new scope.Point(fr.x, fr.y - scaledThickness);
  const flTop = new scope.Point(fl.x, fl.y - scaledThickness);
  
  // Draw bottom face (hidden)
  const bottomPath = new scope.Path();
  bottomPath.add(bl);
  bottomPath.add(br);
  bottomPath.strokeColor = new scope.Color('#B0B0B0');
  bottomPath.strokeWidth = 1;
  bottomPath.dashArray = [5, 3];
  
  // Draw visible faces
  // Front face
  const frontPath = new scope.Path();
  frontPath.add(br);
  frontPath.add(fr);
  frontPath.add(frTop);
  frontPath.add(trTop);
  frontPath.closed = true;
  frontPath.strokeColor = new scope.Color('#FFFFFF');
  frontPath.strokeWidth = 2;
  
  // Right face  
  const rightPath = new scope.Path();
  rightPath.add(fr);
  rightPath.add(fl);
  rightPath.add(flTop);
  rightPath.add(frTop);
  rightPath.closed = true;
  rightPath.strokeColor = new scope.Color('#FFFFFF');
  rightPath.strokeWidth = 2;
  
  // Top face
  const topPath = new scope.Path();
  topPath.add(tlTop);
  topPath.add(trTop);
  topPath.add(frTop);
  topPath.add(flTop);
  topPath.closed = true;
  topPath.strokeColor = new scope.Color('#FFFFFF');
  topPath.strokeWidth = 2;
  
  // Hidden edges
  const hiddenEdge1 = new scope.Path.Line(bl, tlTop);
  hiddenEdge1.strokeColor = new scope.Color('#B0B0B0');
  hiddenEdge1.strokeWidth = 1;
  hiddenEdge1.dashArray = [5, 3];
  
  const hiddenEdge2 = new scope.Path.Line(bl, fl);
  hiddenEdge2.strokeColor = new scope.Color('#B0B0B0');
  hiddenEdge2.strokeWidth = 1;
  hiddenEdge2.dashArray = [5, 3];
  
  const hiddenEdge3 = new scope.Path.Line(tlTop, flTop);
  hiddenEdge3.strokeColor = new scope.Color('#B0B0B0');
  hiddenEdge3.strokeWidth = 1;
  hiddenEdge3.dashArray = [5, 3];
  
  // Add subtle shading
  const shadingGradient = new scope.Gradient();
  shadingGradient.stops = [
    new scope.GradientStop(new scope.Color(1, 1, 1, 0.1), 0),
    new scope.GradientStop(new scope.Color(1, 1, 1, 0), 1)
  ];
  
  frontPath.fillColor = new scope.Color(1, 1, 1, 0.05);
  rightPath.fillColor = new scope.Color(1, 1, 1, 0.03);
  topPath.fillColor = new scope.Color(1, 1, 1, 0.08);
}