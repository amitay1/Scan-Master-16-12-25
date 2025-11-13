/**
 * Ellipse Technical Drawing Module
 * Generates multi-view technical drawings for elliptical parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawEllipseTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const majorAxis = dimensions.length || 120;
  const minorAxis = dimensions.width || 80;
  const thickness = dimensions.thickness || 20;
  
  // FRONT VIEW (Ellipse)
  drawFrontView(generator, majorAxis, minorAxis, layout.frontView);
  
  // TOP VIEW (Rectangle - edge view)
  drawTopView(generator, majorAxis, thickness, layout.topView);
  
  // SIDE VIEW (Rectangle - edge view)
  drawSideView(generator, minorAxis, thickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, majorAxis, minorAxis, thickness, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  majorAxis: number,
  minorAxis: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scaleX = width * 0.6 / majorAxis;
  const scaleY = height * 0.6 / minorAxis;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledMajor = majorAxis * scale;
  const scaledMinor = minorAxis * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw ellipse
  const ellipse = new scope.Path.Ellipse({
    center: [centerX, centerY],
    size: [scaledMajor, scaledMinor]
  });
  ellipse.strokeColor = new scope.Color('#FFFFFF');
  ellipse.strokeWidth = 2;
  ellipse.fillColor = null;
  
  // Major axis centerline
  generator.drawLine(
    centerX - scaledMajor / 2 - 20,
    centerY,
    centerX + scaledMajor / 2 + 20,
    centerY,
    'center'
  );
  
  // Minor axis centerline
  generator.drawLine(
    centerX,
    centerY - scaledMinor / 2 - 20,
    centerX,
    centerY + scaledMinor / 2 + 20,
    'center'
  );
  
  // Draw focal points
  const eccentricity = Math.sqrt(1 - Math.pow(minorAxis / majorAxis, 2));
  const focalDistance = (majorAxis / 2) * eccentricity * scale;
  
  const f1 = new scope.Path.Circle({
    center: [centerX - focalDistance, centerY],
    radius: 2
  });
  f1.strokeColor = new scope.Color('#FFD700');
  f1.fillColor = new scope.Color('#FFD700');
  
  const f2 = new scope.Path.Circle({
    center: [centerX + focalDistance, centerY],
    radius: 2
  });
  f2.strokeColor = new scope.Color('#FFD700');
  f2.fillColor = new scope.Color('#FFD700');
  
  // Label focal points
  generator.drawText(centerX - focalDistance, centerY - 15, 'F₁', '10px');
  generator.drawText(centerX + focalDistance, centerY - 15, 'F₂', '10px');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    centerX - scaledMajor / 2,
    centerY + scaledMinor / 2 + 30,
    centerX + scaledMajor / 2,
    centerY + scaledMinor / 2 + 30,
    `a=${majorAxis}`,
    '+0.3',
    '-0.3',
    5
  );
  
  generator.drawDimensionWithTolerance(
    centerX + scaledMajor / 2 + 30,
    centerY - scaledMinor / 2,
    centerX + scaledMajor / 2 + 30,
    centerY + scaledMinor / 2,
    `b=${minorAxis}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Eccentricity annotation
  generator.drawText(
    x + width / 2,
    y + height - 10,
    `e=${eccentricity.toFixed(3)}`,
    '10px'
  );
  
  // Surface finish
  generator.drawSurfaceFinish(centerX + scaledMajor / 2 + 10, centerY - scaledMinor / 2, 'machined', '1.6');
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  majorAxis: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width / majorAxis, height / thickness) * 0.6;
  const scaledMajor = majorAxis * scale;
  const scaledThickness = Math.max(thickness * scale, 10);
  
  const rectX = x + (width - scaledMajor) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Edge view rectangle with rounded ends (elliptical ends)
  const scope = generator.getScope();
  const edgePath = new scope.Path();
  
  // Left rounded end
  edgePath.add(new scope.Point(rectX, rectY));
  edgePath.arcTo(
    new scope.Point(rectX, rectY + scaledThickness),
    new scope.Size(scaledThickness / 2, scaledThickness / 2),
    180
  );
  
  // Bottom edge
  edgePath.add(new scope.Point(rectX + scaledMajor, rectY + scaledThickness));
  
  // Right rounded end
  edgePath.arcTo(
    new scope.Point(rectX + scaledMajor, rectY),
    new scope.Size(scaledThickness / 2, scaledThickness / 2),
    180
  );
  
  // Top edge
  edgePath.closed = true;
  edgePath.strokeColor = new scope.Color('#FFFFFF');
  edgePath.strokeWidth = 2;
  
  // Centerline
  generator.drawLine(
    rectX - 20,
    y + height / 2,
    rectX + scaledMajor + 20,
    y + height / 2,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledMajor,
    rectY + scaledThickness + 30,
    `L=${majorAxis}mm`,
    5
  );
  
  generator.drawDimension(
    rectX + scaledMajor + 30,
    rectY,
    rectX + scaledMajor + 30,
    rectY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  minorAxis: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SIDE VIEW');
  
  // Scale to fit
  const scale = Math.min(width / minorAxis, height / thickness) * 0.6;
  const scaledMinor = minorAxis * scale;
  const scaledThickness = Math.max(thickness * scale, 10);
  
  const rectX = x + (width - scaledMinor) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Edge view with elliptical profile
  const edgePath = new scope.Path();
  
  // Left curved edge
  edgePath.add(new scope.Point(rectX, rectY));
  edgePath.arcTo(
    new scope.Point(rectX, rectY + scaledThickness),
    new scope.Size(scaledThickness / 2, scaledThickness / 2),
    180
  );
  
  // Bottom edge
  edgePath.add(new scope.Point(rectX + scaledMinor, rectY + scaledThickness));
  
  // Right curved edge
  edgePath.arcTo(
    new scope.Point(rectX + scaledMinor, rectY),
    new scope.Size(scaledThickness / 2, scaledThickness / 2),
    180
  );
  
  // Top edge
  edgePath.closed = true;
  edgePath.strokeColor = new scope.Color('#FFFFFF');
  edgePath.strokeWidth = 2;
  
  // Centerline
  generator.drawLine(
    rectX - 20,
    y + height / 2,
    rectX + scaledMinor + 20,
    y + height / 2,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledMinor,
    rectY + scaledThickness + 30,
    `W=${minorAxis}mm`,
    5
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  majorAxis: number,
  minorAxis: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale
  const maxDim = Math.max(majorAxis, minorAxis);
  const scale = Math.min(width, height) * 0.5 / maxDim;
  
  const scaledMajor = majorAxis * scale;
  const scaledMinor = minorAxis * scale;
  const scaledThickness = Math.max(thickness * scale, 5);
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw bottom ellipse (transformed for isometric)
  const bottomEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY + scaledThickness / 2],
    size: [scaledMajor, scaledMinor * 0.866]
  });
  bottomEllipse.strokeColor = new scope.Color('#FFFFFF');
  bottomEllipse.strokeWidth = 2;
  bottomEllipse.rotate(15, [centerX, centerY + scaledThickness / 2]);
  
  // Draw top ellipse
  const topEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY - scaledThickness / 2],
    size: [scaledMajor, scaledMinor * 0.866]
  });
  topEllipse.strokeColor = new scope.Color('#FFFFFF');
  topEllipse.strokeWidth = 2;
  topEllipse.rotate(15, [centerX, centerY - scaledThickness / 2]);
  
  // Draw connecting edges (tangent lines)
  // Calculate tangent points
  const angle = 15 * Math.PI / 180;
  const cos_a = Math.cos(angle);
  const sin_a = Math.sin(angle);
  
  // Left tangent
  const leftX = centerX - scaledMajor / 2 * cos_a - scaledMinor * 0.433 * sin_a;
  const leftTop = new scope.Point(leftX, centerY - scaledThickness / 2);
  const leftBottom = new scope.Point(leftX, centerY + scaledThickness / 2);
  
  const leftEdge = new scope.Path.Line(leftTop, leftBottom);
  leftEdge.strokeColor = new scope.Color('#FFFFFF');
  leftEdge.strokeWidth = 2;
  
  // Right tangent
  const rightX = centerX + scaledMajor / 2 * cos_a + scaledMinor * 0.433 * sin_a;
  const rightTop = new scope.Point(rightX, centerY - scaledThickness / 2);
  const rightBottom = new scope.Point(rightX, centerY + scaledThickness / 2);
  
  const rightEdge = new scope.Path.Line(rightTop, rightBottom);
  rightEdge.strokeColor = new scope.Color('#FFFFFF');
  rightEdge.strokeWidth = 2;
  
  // Add subtle shading
  const shadingPath = topEllipse.clone();
  shadingPath.fillColor = new scope.Color(1, 1, 1, 0.05);
  shadingPath.strokeColor = null;
}