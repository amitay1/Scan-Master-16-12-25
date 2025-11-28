/**
 * Cylinder Technical Drawing Module
 * Generates multi-view technical drawings for cylindrical parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawCylinderTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || 50;
  const length = dimensions.length;
  
  // FRONT VIEW (Length × Diameter)
  drawFrontView(generator, length, diameter, layout.frontView);
  
  // TOP VIEW (Circle with Ø)
  drawTopView(generator, diameter, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, length, diameter, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, length, diameter, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width / length, height / diameter) * 0.6;
  const scaledLength = length * scale;
  const scaledDiameter = diameter * scale;
  
  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledDiameter) / 2;
  
  // Main rectangle (cylinder viewed from side)
  generator.drawRectangle(rectX, rectY, scaledLength, scaledDiameter, 'visible');
  
  // Centerlines - horizontal and vertical
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
    rectY + scaledDiameter + 20,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledDiameter + 35,
    rectX + scaledLength,
    rectY + scaledDiameter + 35,
    `L=${length}mm`,
    5
  );
  
  generator.drawDimension(
    rectX + scaledLength + 35,
    rectY,
    rectX + scaledLength + 35,
    rectY + scaledDiameter,
    `Ø${diameter}mm`,
    5
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) / diameter * 0.5;
  const scaledRadius = (diameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Main circle
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');
  
  // Centerlines - cross
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
  
  // Dimension - diameter
  generator.drawDimension(
    centerX - scaledRadius,
    centerY - scaledRadius - 25,
    centerX + scaledRadius,
    centerY - scaledRadius - 25,
    `Ø${diameter}mm`,
    5
  );
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  length: number,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width / length, height / diameter) * 0.6;
  const scaledLength = length * scale;
  const scaledDiameter = diameter * scale;
  
  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledDiameter) / 2;
  
  // Main rectangle with hatching (solid material)
  generator.drawRectangle(rectX, rectY, scaledLength, scaledDiameter, 'visible');
  
  // Hatching to show solid material
  generator.drawHatching(rectX, rectY, scaledLength, scaledDiameter, 45, 6);
  
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
  
  // Text label - HIGH CONTRAST
  generator.drawText(
    centerX,
    centerY + scaledDiameter / 2 + 20,
    'SOLID MATERIAL',
    10,
    '#FFFFFF'
  );
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
  
  // Scale to fit
  const maxDim = Math.max(length, diameter);
  const scale = Math.min(width, height) / maxDim * 0.5;
  
  const scaledLength = length * scale;
  const scaledRadius = (diameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const scope = generator.getScope();
  
  // Draw cylinder in isometric projection
  // Front ellipse (bottom)
  const frontEllipse = new scope.Path.Ellipse({
    center: [centerX - scaledLength / 3, centerY + scaledRadius / 3],
    radius: [scaledRadius, scaledRadius / 2]
  });
  frontEllipse.strokeColor = new scope.Color('#FFFFFF');
  frontEllipse.strokeWidth = 2;
  frontEllipse.fillColor = new scope.Color('#505050');
  
  // Back ellipse (top)
  const backEllipse = new scope.Path.Ellipse({
    center: [centerX + scaledLength / 3, centerY - scaledRadius / 3],
    radius: [scaledRadius, scaledRadius / 2]
  });
  backEllipse.strokeColor = new scope.Color('#FFFFFF');
  backEllipse.strokeWidth = 2;
  backEllipse.fillColor = new scope.Color('#F5F5F5');
  
  // Side lines
  generator.drawLine(
    centerX - scaledLength / 3 - scaledRadius,
    centerY + scaledRadius / 3,
    centerX + scaledLength / 3 - scaledRadius,
    centerY - scaledRadius / 3,
    'visible'
  );
  
  generator.drawLine(
    centerX - scaledLength / 3 + scaledRadius,
    centerY + scaledRadius / 3,
    centerX + scaledLength / 3 + scaledRadius,
    centerY - scaledRadius / 3,
    'visible'
  );
}
