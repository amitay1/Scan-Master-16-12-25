/**
 * Disk Technical Drawing Module
 * Generates multi-view technical drawings for circular flat disk parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawDiskTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || dimensions.length || 100;
  const thickness = dimensions.thickness || 10;
  
  // FRONT VIEW (Circle)
  drawFrontView(generator, diameter, layout.frontView);
  
  // TOP VIEW (Rectangle - edge view)
  drawTopView(generator, diameter, thickness, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, diameter, thickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, diameter, thickness, layout.isometric);
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
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Main circle
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');
  
  // Centerlines
  generator.drawLine(centerX - scaledRadius - 20, centerY, centerX + scaledRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledRadius - 20, centerX, centerY + scaledRadius + 20, 'center');
  
  // Add 45° reference lines for inspection zones
  const offset = scaledRadius * 0.7071; // cos(45°)
  generator.drawLine(
    centerX - offset - 15, 
    centerY - offset - 15,
    centerX + offset + 15, 
    centerY + offset + 15,
    'center'
  );
  generator.drawLine(
    centerX - offset - 15, 
    centerY + offset + 15,
    centerX + offset + 15, 
    centerY - offset - 15,
    'center'
  );
  
  // Dimensions with tolerance
  generator.drawDimensionWithTolerance(
    centerX - scaledRadius,
    centerY + scaledRadius + 30,
    centerX + scaledRadius,
    centerY + scaledRadius + 30,
    `Ø${diameter}`,
    '+0.2',
    '-0.2',
    5
  );
  
  // Surface finish
  generator.drawSurfaceFinish(centerX + scaledRadius + 30, centerY, 'machined', '3.2');
  
  // Circularity tolerance
  generator.drawGeometricTolerance(
    centerX,
    centerY + scaledRadius + 60,
    'circularity',
    '0.05',
    ''
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW (EDGE)');
  
  // Scale to fit
  const scale = Math.min(width / diameter, height / thickness) * 0.6;
  const scaledDiameter = diameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10); // Ensure min visible thickness
  
  const rectX = x + (width - scaledDiameter) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Edge view rectangle
  generator.drawRectangle(rectX, rectY, scaledDiameter, scaledThickness, 'visible');
  
  // Centerline
  generator.drawLine(
    rectX - 20,
    y + height / 2,
    rectX + scaledDiameter + 20,
    y + height / 2,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledDiameter,
    rectY + scaledThickness + 30,
    `Ø${diameter}mm`,
    5
  );
  
  generator.drawDimension(
    rectX + scaledDiameter + 30,
    rectY,
    rectX + scaledDiameter + 30,
    rectY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width / diameter, height / thickness) * 0.6;
  const scaledDiameter = diameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10);
  
  const rectX = x + (width - scaledDiameter) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Section rectangle with hatching
  generator.drawRectangle(rectX, rectY, scaledDiameter, scaledThickness, 'visible');
  generator.drawHatching(rectX, rectY, scaledDiameter, scaledThickness, 45, 4);
  
  // Centerlines
  generator.drawLine(
    x + width / 2,
    rectY - 20,
    x + width / 2,
    rectY + scaledThickness + 20,
    'center'
  );
  
  // Section arrows (replaced drawSectionArrow with text and lines)
  generator.drawText(rectX - 40, rectY + scaledThickness / 2, 'A', 14, '#00D4FF');
  generator.drawLine(
    rectX - 35, 
    rectY + scaledThickness / 2 - 10,
    rectX - 35,
    rectY + scaledThickness / 2 + 10,
    'cutting'
  );
  generator.drawText(rectX + scaledDiameter + 40, rectY + scaledThickness / 2, 'A', 14, '#00D4FF');
  generator.drawLine(
    rectX + scaledDiameter + 35, 
    rectY + scaledThickness / 2 - 10,
    rectX + scaledDiameter + 35,
    rectY + scaledThickness / 2 + 10,
    'cutting'
  );
  
  // Flatness indicator on surfaces
  generator.drawGeometricTolerance(
    x + width / 2,
    rectY - 30,
    'flatness',
    '0.02',
    ''
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale
  const scale = Math.min(width, height) * 0.5 / diameter;
  const scaledRadius = diameter * scale / 2;
  const scaledThickness = Math.max(thickness * scale, 5);
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw bottom circle (ellipse in isometric)
  const bottomEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY + scaledThickness / 2],
    size: [scaledRadius * 2, scaledRadius * 0.866], // cos(30°) for isometric
  });
  bottomEllipse.strokeColor = new scope.Color('#FFFFFF');
  bottomEllipse.strokeWidth = 2;
  bottomEllipse.fillColor = null;
  
  // Draw top circle (ellipse in isometric)
  const topEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY - scaledThickness / 2],
    size: [scaledRadius * 2, scaledRadius * 0.866],
  });
  topEllipse.strokeColor = new scope.Color('#FFFFFF');
  topEllipse.strokeWidth = 2;
  topEllipse.fillColor = null;
  
  // Draw connecting edges
  const leftEdge = new scope.Path.Line(
    new scope.Point(centerX - scaledRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX - scaledRadius, centerY + scaledThickness / 2)
  );
  leftEdge.strokeColor = new scope.Color('#FFFFFF');
  leftEdge.strokeWidth = 2;
  
  const rightEdge = new scope.Path.Line(
    new scope.Point(centerX + scaledRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX + scaledRadius, centerY + scaledThickness / 2)
  );
  rightEdge.strokeColor = new scope.Color('#FFFFFF');
  rightEdge.strokeWidth = 2;
  
  // Add shading gradient to show 3D effect
  const shadingPath = new scope.Path();
  shadingPath.add(new scope.Point(centerX - scaledRadius, centerY - scaledThickness / 2));
  shadingPath.add(new scope.Point(centerX - scaledRadius, centerY + scaledThickness / 2));
  
  // Create arc for bottom edge
  const bottomArc = new scope.Path.Arc({
    from: [centerX - scaledRadius, centerY + scaledThickness / 2],
    through: [centerX, centerY + scaledThickness / 2 + scaledRadius * 0.433],
    to: [centerX + scaledRadius, centerY + scaledThickness / 2]
  });
  shadingPath.add(bottomArc.segments);
  
  shadingPath.add(new scope.Point(centerX + scaledRadius, centerY - scaledThickness / 2));
  
  // Create arc for top edge
  const topArc = new scope.Path.Arc({
    from: [centerX + scaledRadius, centerY - scaledThickness / 2],
    through: [centerX, centerY - scaledThickness / 2 - scaledRadius * 0.433],
    to: [centerX - scaledRadius, centerY - scaledThickness / 2]
  });
  shadingPath.add(topArc.segments);
  
  shadingPath.closed = true;
  shadingPath.fillColor = new scope.Color(1, 1, 1, 0.05);
  shadingPath.strokeColor = null;
}