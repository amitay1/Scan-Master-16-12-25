/**
 * Sphere Technical Drawing Generator
 * Creates multi-view technical drawing for sphere parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawSphereTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const diameter = dimensions.diameter || dimensions.length;
  
  // FRONT VIEW (Circle)
  drawFrontView(generator, diameter, layout.frontView);
  
  // TOP VIEW (Circle)
  drawTopView(generator, diameter, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, diameter, layout.sideView);
  
  // ISOMETRIC VIEW (3D Sphere)
  drawIsometricView(generator, diameter, layout.isometric);
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
  
  // Dimensions with tolerance
  generator.drawDimensionWithTolerance(
    centerX - scaledRadius,
    centerY + scaledRadius + 30,
    centerX + scaledRadius,
    centerY + scaledRadius + 30,
    `Ø${diameter}`,
    '+0.05',
    '-0.05',
    5
  );
  
  // Surface finish symbol
  generator.drawSurfaceFinish(centerX + scaledRadius + 30, centerY - scaledRadius, 'machined', '1.6');
  
  // Geometric tolerance for sphericity
  generator.drawGeometricTolerance(
    centerX - 30,
    centerY + scaledRadius + 55,
    'circularity',
    '0.02',
    'A'
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
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Main circle (identical to front view for sphere)
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');
  
  // Centerlines
  generator.drawLine(centerX - scaledRadius - 20, centerY, centerX + scaledRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledRadius - 20, centerX, centerY + scaledRadius + 20, 'center');
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Section outline (circle)
  generator.drawCircle(centerX, centerY, scaledRadius, 'section');
  
  // Add cross-hatching for section
  const hatchPath = new scope.Path();
  const numLines = 15;
  
  for (let i = -numLines; i <= numLines; i++) {
    const offset = i * (scaledRadius * 2 / numLines);
    const y1 = centerY + offset;
    
    // Calculate x positions where line intersects circle
    if (Math.abs(offset) < scaledRadius) {
      const x_offset = Math.sqrt(scaledRadius * scaledRadius - offset * offset);
      const x1 = centerX - x_offset;
      const x2 = centerX + x_offset;
      
      // Draw hatching line at 45 degrees
      const hatchLine = new scope.Path();
      hatchLine.add(new scope.Point(x1, y1));
      hatchLine.add(new scope.Point(x2, y1));
      hatchLine.strokeColor = new scope.Color('#CCCCCC');
      hatchLine.strokeWidth = 0.5;
      hatchLine.rotate(45, new scope.Point(centerX, centerY));
    }
  }
  
  // Section indicator
  generator.drawSectionIndicator(
    centerX - scaledRadius - 30,
    centerY - scaledRadius - 10,
    centerX + scaledRadius + 30,
    centerY - scaledRadius - 10,
    'A-A'
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  diameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / diameter;
  const scaledRadius = (diameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Main sphere circle
  generator.drawCircle(centerX, centerY, scaledRadius, 'visible');
  
  // Add meridian lines for 3D effect
  // Horizontal ellipse
  const hEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY],
    radius: [scaledRadius, scaledRadius * 0.3]
  });
  hEllipse.strokeColor = new scope.Color('#B0B0B0');
  hEllipse.strokeWidth = 1;
  hEllipse.dashArray = [5, 3];
  
  // Vertical ellipse rotated
  const vEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY],
    radius: [scaledRadius * 0.3, scaledRadius]
  });
  vEllipse.strokeColor = new scope.Color('#B0B0B0');
  vEllipse.strokeWidth = 1;
  vEllipse.dashArray = [5, 3];
  
  // 45-degree ellipse for depth
  const dEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY],
    radius: [scaledRadius * 0.7, scaledRadius * 0.7]
  });
  dEllipse.rotate(45, new scope.Point(centerX, centerY));
  dEllipse.strokeColor = new scope.Color('#B0B0B0');
  dEllipse.strokeWidth = 1;
  dEllipse.dashArray = [5, 3];
  
  // Add highlight for 3D effect
  const highlight = new scope.Path.Circle({
    center: [centerX - scaledRadius * 0.3, centerY - scaledRadius * 0.3],
    radius: scaledRadius * 0.2
  });
  highlight.fillColor = new scope.Color('#FFFFFF');
  highlight.opacity = 0.4;
}