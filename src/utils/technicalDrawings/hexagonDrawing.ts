/**
 * Hexagon Technical Drawing Module
 * Generates multi-view technical drawings for hexagonal parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawHexagonTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || 50;
  const length = dimensions.length;
  
  // FRONT VIEW (Hexagon)
  drawFrontView(generator, diameter, layout.frontView);
  
  // TOP VIEW (Rectangle representing length)
  drawTopView(generator, length, diameter, layout.topView);
  
  // SIDE VIEW (Hexagon rotated)
  drawSideView(generator, diameter, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, length, diameter, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) / diameter * 0.5;
  const scaledRadius = (diameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const scope = generator.getScope();
  
  // Draw hexagon
  const hexagon = new scope.Path.RegularPolygon({
    center: [centerX, centerY],
    sides: 6,
    radius: scaledRadius,
    rotation: 30 // Flat side on top
  });
  hexagon.strokeColor = new scope.Color('#FFFFFF');
  hexagon.strokeWidth = 2;
  hexagon.fillColor = null;
  
  // Centerlines
  generator.drawLine(
    centerX - scaledRadius - 20,
    centerY,
    centerX + scaledRadius + 20,
    centerY,
    'center'
  );
  
  generator.drawLine(
    centerX,
    centerY - scaledRadius - 20,
    centerX,
    centerY + scaledRadius + 20,
    'center'
  );
  
  // Dimensions - Across Flats (AF)
  const af = diameter * Math.cos(Math.PI / 6); // Across flats
  generator.drawDimension(
    centerX - scaledRadius * Math.cos(Math.PI / 6),
    centerY + scaledRadius + 30,
    centerX + scaledRadius * Math.cos(Math.PI / 6),
    centerY + scaledRadius + 30,
    `AF=${af.toFixed(1)}mm`,
    5
  );
  
  // Across Corners (AC)
  generator.drawDimension(
    centerX + scaledRadius + 30,
    centerY - scaledRadius,
    centerX + scaledRadius + 30,
    centerY + scaledRadius,
    `AC=${diameter}mm`,
    5
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  length: number,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  const af = diameter * Math.cos(Math.PI / 6); // Across flats
  
  // Scale to fit
  const scale = Math.min(width / length, height / af) * 0.6;
  const scaledLength = length * scale;
  const scaledAF = af * scale;
  
  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledAF) / 2;
  
  // Main rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledAF, 'visible');
  
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
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledAF + 30,
    rectX + scaledLength,
    rectY + scaledAF + 30,
    `L=${length}mm`,
    5
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SIDE VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) / diameter * 0.5;
  const scaledRadius = (diameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const scope = generator.getScope();
  
  // Draw hexagon (rotated 90 degrees)
  const hexagon = new scope.Path.RegularPolygon({
    center: [centerX, centerY],
    sides: 6,
    radius: scaledRadius,
    rotation: 0 // Point on top
  });
  hexagon.strokeColor = new scope.Color('#FFFFFF');
  hexagon.strokeWidth = 2;
  hexagon.fillColor = null;
  
  // Centerlines
  generator.drawCenterlines(centerX, centerY, scaledRadius * 2, scaledRadius * 2);
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  length: number,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const scope = generator.getScope();
  
  // Simplified isometric hexagon
  const scale = Math.min(width, height) / Math.max(length, diameter) * 0.4;
  const scaledRadius = (diameter / 2) * scale;
  const scaledLength = length * scale;
  
  // Front hexagon
  const frontHex = new scope.Path.RegularPolygon({
    center: [centerX - scaledLength / 3, centerY + scaledRadius / 3],
    sides: 6,
    radius: scaledRadius,
    rotation: 30
  });
  frontHex.strokeColor = new scope.Color('#FFFFFF');
  frontHex.strokeWidth = 2;
  frontHex.fillColor = new scope.Color('#505050');
  
  // Back hexagon
  const backHex = new scope.Path.RegularPolygon({
    center: [centerX + scaledLength / 3, centerY - scaledRadius / 3],
    sides: 6,
    radius: scaledRadius,
    rotation: 30
  });
  backHex.strokeColor = new scope.Color('#FFFFFF');
  backHex.strokeWidth = 2;
  backHex.fillColor = new scope.Color('#707070');
}
