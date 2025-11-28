/**
 * Cone Technical Drawing Generator
 * Creates multi-view technical drawing for conical parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawConeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const baseDiameter = dimensions.diameter || dimensions.width;
  const height = dimensions.length || dimensions.thickness * 10;
  const topDiameter = dimensions.innerDiameter || 0; // 0 for pointed cone, >0 for truncated
  
  // FRONT VIEW (Triangle/Trapezoid)
  drawFrontView(generator, baseDiameter, topDiameter, height, layout.frontView);
  
  // TOP VIEW (Circle)
  drawTopView(generator, baseDiameter, topDiameter, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, baseDiameter, topDiameter, height, layout.sideView);
  
  // ISOMETRIC VIEW (3D Cone)
  drawIsometricView(generator, baseDiameter, topDiameter, height, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scaleW = width * 0.6 / baseDiameter;
  const scaleH = viewHeight * 0.6 / height;
  const scale = Math.min(scaleW, scaleH);
  
  const scaledBase = baseDiameter * scale;
  const scaledTop = topDiameter * scale;
  const scaledHeight = height * scale;
  
  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  const bottomY = centerY + scaledHeight / 2;
  const topY = centerY - scaledHeight / 2;
  
  // Draw cone outline
  const conePath = new scope.Path();
  conePath.add(new scope.Point(centerX - scaledBase / 2, bottomY)); // Bottom left
  conePath.add(new scope.Point(centerX - scaledTop / 2, topY)); // Top left
  conePath.add(new scope.Point(centerX + scaledTop / 2, topY)); // Top right
  conePath.add(new scope.Point(centerX + scaledBase / 2, bottomY)); // Bottom right
  conePath.closed = true;
  conePath.strokeColor = new scope.Color('#FFFFFF');
  conePath.strokeWidth = 2;
  
  // Centerlines
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');
  generator.drawLine(centerX - scaledBase / 2 - 20, centerY, centerX + scaledBase / 2 + 20, centerY, 'center');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `Ø${baseDiameter}`,
    '+0.1',
    '-0.1',
    5
  );
  
  if (topDiameter > 0) {
    generator.drawDimensionWithTolerance(
      centerX - scaledTop / 2,
      topY - 30,
      centerX + scaledTop / 2,
      topY - 30,
      `Ø${topDiameter}`,
      '+0.1',
      '-0.1',
      5
    );
  }
  
  generator.drawDimensionWithTolerance(
    centerX + scaledBase / 2 + 30,
    bottomY,
    centerX + scaledBase / 2 + 30,
    topY,
    `${height}`,
    '+0.2',
    '-0.2',
    5
  );
  
  // Taper angle calculation - HIGH CONTRAST
  const taperAngle = Math.atan((baseDiameter - topDiameter) / 2 / height) * (180 / Math.PI);
  generator.drawText(centerX, bottomY + 55, `Taper: ${taperAngle.toFixed(1)}°`, 10, '#FFFFFF');
  
  // Surface finish
  generator.drawSurfaceFinish(centerX + scaledBase / 2 + 60, centerY, 'turned', '3.2');
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / baseDiameter;
  const scaledBaseRadius = (baseDiameter * scale) / 2;
  const scaledTopRadius = (topDiameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Base circle (visible)
  generator.drawCircle(centerX, centerY, scaledBaseRadius, 'visible');
  
  // Top circle if truncated (hidden line)
  if (topDiameter > 0) {
    generator.drawCircle(centerX, centerY, scaledTopRadius, 'hidden');
  }
  
  // Centerlines
  generator.drawLine(centerX - scaledBaseRadius - 20, centerY, centerX + scaledBaseRadius + 20, centerY, 'center');
  generator.drawLine(centerX, centerY - scaledBaseRadius - 20, centerX, centerY + scaledBaseRadius + 20, 'center');
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height: viewHeight } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scaleW = width * 0.6 / baseDiameter;
  const scaleH = viewHeight * 0.6 / height;
  const scale = Math.min(scaleW, scaleH);
  
  const scaledBase = baseDiameter * scale;
  const scaledTop = topDiameter * scale;
  const scaledHeight = height * scale;
  
  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  const bottomY = centerY + scaledHeight / 2;
  const topY = centerY - scaledHeight / 2;
  
  // Section hatching
  const hatchArea = {
    x: centerX - scaledBase / 2,
    y: topY,
    width: scaledBase,
    height: scaledHeight
  };
  
  // Draw hatching for solid section
  generator.drawHatching(
    hatchArea.x,
    hatchArea.y,
    hatchArea.width,
    hatchArea.height,
    45,
    8
  );
  
  // Section indicator
  generator.drawSectionIndicator(
    centerX - scaledBase / 2 - 30,
    centerY,
    centerX + scaledBase / 2 + 30,
    centerY,
    'A-A'
  );
  
  // Geometric tolerance for straightness
  generator.drawGeometricTolerance(
    centerX - 30,
    bottomY + 40,
    'straightness',
    '0.05',
    'B'
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  height: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Scale to fit
  const scale = Math.min(width, viewHeight) * 0.5 / Math.max(baseDiameter, height);
  const scaledBase = baseDiameter * scale;
  const scaledTop = topDiameter * scale;
  const scaledHeight = height * scale;
  
  const centerX = x + width / 2;
  const centerY = y + viewHeight / 2;
  
  // Base ellipse
  const baseEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY + scaledHeight / 3],
    radius: [scaledBase / 2, scaledBase / 4]
  });
  baseEllipse.strokeColor = new scope.Color('#FFFFFF');
  baseEllipse.strokeWidth = 2;
  baseEllipse.fillColor = new scope.Color('#505050');
  
  // Top ellipse (if truncated)
  if (topDiameter > 0) {
    const topEllipse = new scope.Path.Ellipse({
      center: [centerX, centerY - scaledHeight / 3],
      radius: [scaledTop / 2, scaledTop / 4]
    });
    topEllipse.strokeColor = new scope.Color('#FFFFFF');
    topEllipse.strokeWidth = 2;
    topEllipse.fillColor = new scope.Color('#303030');
  } else {
    // Point for complete cone
    const point = new scope.Path.Circle({
      center: [centerX, centerY - scaledHeight / 3],
      radius: 2
    });
    point.fillColor = new scope.Color('#FFFFFF');
  }
  
  // Side lines
  const leftLine = new scope.Path();
  leftLine.add(new scope.Point(centerX - scaledBase / 2, centerY + scaledHeight / 3));
  leftLine.add(new scope.Point(centerX - scaledTop / 2, centerY - scaledHeight / 3));
  leftLine.strokeColor = new scope.Color('#FFFFFF');
  leftLine.strokeWidth = 2;
  
  const rightLine = new scope.Path();
  rightLine.add(new scope.Point(centerX + scaledBase / 2, centerY + scaledHeight / 3));
  rightLine.add(new scope.Point(centerX + scaledTop / 2, centerY - scaledHeight / 3));
  rightLine.strokeColor = new scope.Color('#FFFFFF');
  rightLine.strokeWidth = 2;
  
  // Hidden rear edge (dashed)
  const rearLine = new scope.Path();
  rearLine.add(new scope.Point(centerX, centerY + scaledHeight / 3 - scaledBase / 4));
  rearLine.add(new scope.Point(centerX, centerY - scaledHeight / 3 - scaledTop / 4));
  rearLine.strokeColor = new scope.Color('#B0B0B0');
  rearLine.strokeWidth = 1;
  rearLine.dashArray = [5, 3];
}