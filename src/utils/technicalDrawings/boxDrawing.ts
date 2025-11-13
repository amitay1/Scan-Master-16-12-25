/**
 * Box Technical Drawing Module
 * Generates multi-view technical drawings for rectangular box parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawBoxTechnicalDrawing(
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
    `T=${thickness}mm`,
    5
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
  generator.drawDimension(
    rectX,
    rectY + scaledWidth + 30,
    rectX + scaledLength,
    rectY + scaledWidth + 30,
    `L=${length}mm`,
    5
  );
  
  generator.drawDimension(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledWidth,
    `W=${width}mm`,
    5
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
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'ISOMETRIC VIEW');
  
  // Isometric angles
  const angle30 = Math.PI / 6; // 30 degrees
  
  // Scale to fit
  const maxDim = Math.max(length, width, thickness);
  const scale = Math.min(viewWidth, height) / maxDim * 0.4;
  
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  // Calculate isometric coordinates
  const scope = generator.getScope();
  
  // Front face (bottom)
  const p1 = { x: centerX - scaledLength / 2, y: centerY + scaledThickness / 2 };
  const p2 = { x: centerX + scaledLength / 2, y: centerY + scaledThickness / 2 };
  const p3 = { 
    x: centerX + scaledLength / 2 + scaledWidth * Math.cos(angle30), 
    y: centerY + scaledThickness / 2 - scaledWidth * Math.sin(angle30) 
  };
  const p4 = { 
    x: centerX - scaledLength / 2 + scaledWidth * Math.cos(angle30), 
    y: centerY + scaledThickness / 2 - scaledWidth * Math.sin(angle30) 
  };
  
  // Top face
  const p5 = { x: p1.x, y: p1.y - scaledThickness };
  const p6 = { x: p2.x, y: p2.y - scaledThickness };
  const p7 = { x: p3.x, y: p3.y - scaledThickness };
  const p8 = { x: p4.x, y: p4.y - scaledThickness };
  
  // Draw bottom face
  const bottomFace = new scope.Path();
  bottomFace.add(new scope.Point(p1.x, p1.y));
  bottomFace.add(new scope.Point(p2.x, p2.y));
  bottomFace.add(new scope.Point(p3.x, p3.y));
  bottomFace.add(new scope.Point(p4.x, p4.y));
  bottomFace.closed = true;
  bottomFace.strokeColor = new scope.Color('#000000');
  bottomFace.strokeWidth = 2;
  bottomFace.fillColor = new scope.Color('#E0E0E0');
  
  // Draw top face
  const topFace = new scope.Path();
  topFace.add(new scope.Point(p5.x, p5.y));
  topFace.add(new scope.Point(p6.x, p6.y));
  topFace.add(new scope.Point(p7.x, p7.y));
  topFace.add(new scope.Point(p8.x, p8.y));
  topFace.closed = true;
  topFace.strokeColor = new scope.Color('#000000');
  topFace.strokeWidth = 2;
  topFace.fillColor = new scope.Color('#F5F5F5');
  
  // Draw side face
  const sideFace = new scope.Path();
  sideFace.add(new scope.Point(p2.x, p2.y));
  sideFace.add(new scope.Point(p3.x, p3.y));
  sideFace.add(new scope.Point(p7.x, p7.y));
  sideFace.add(new scope.Point(p6.x, p6.y));
  sideFace.closed = true;
  sideFace.strokeColor = new scope.Color('#000000');
  sideFace.strokeWidth = 2;
  sideFace.fillColor = new scope.Color('#C8C8C8');
  
  // Draw vertical edges
  generator.drawLine(p1.x, p1.y, p5.x, p5.y, 'visible');
  generator.drawLine(p2.x, p2.y, p6.x, p6.y, 'visible');
  generator.drawLine(p3.x, p3.y, p7.x, p7.y, 'visible');
  generator.drawLine(p4.x, p4.y, p8.x, p8.y, 'visible');
}
