/**
 * Ring Technical Drawing Module  
 * Generates multi-view technical drawings for annular ring parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawRingTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const outerDiameter = dimensions.diameter || dimensions.outerDiameter || 100;
  const innerDiameter = dimensions.innerDiameter || outerDiameter * 0.6;
  const thickness = dimensions.thickness || 20;
  
  // FRONT VIEW (Concentric circles)
  drawFrontView(generator, outerDiameter, innerDiameter, layout.frontView);
  
  // TOP VIEW (Rectangle with hollow center - edge view)
  drawTopView(generator, outerDiameter, innerDiameter, thickness, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, outerDiameter, innerDiameter, thickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, outerDiameter, innerDiameter, thickness, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) * 0.6 / outerDiameter;
  const scaledOuterRadius = (outerDiameter * scale) / 2;
  const scaledInnerRadius = (innerDiameter * scale) / 2;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Outer circle
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');
  
  // Inner circle
  generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');
  
  // Centerlines
  generator.drawLine(
    centerX - scaledOuterRadius - 20,
    centerY,
    centerX + scaledOuterRadius + 20,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    centerY - scaledOuterRadius - 20,
    centerX,
    centerY + scaledOuterRadius + 20,
    'center'
  );
  
  // 45° reference lines
  const offset = scaledOuterRadius * 0.7071;
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
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    centerX - scaledOuterRadius,
    centerY + scaledOuterRadius + 30,
    centerX + scaledOuterRadius,
    centerY + scaledOuterRadius + 30,
    `Ø${outerDiameter}`,
    '+0.2',
    '-0.2',
    5
  );
  
  generator.drawDimensionWithTolerance(
    centerX - scaledInnerRadius,
    centerY - scaledOuterRadius - 30,
    centerX + scaledInnerRadius,
    centerY - scaledOuterRadius - 30,
    `Ø${innerDiameter}`,
    '+0.2',
    '-0.2',
    5
  );
  
  // Wall thickness dimension
  const wallThickness = (outerDiameter - innerDiameter) / 2;
  generator.drawDimension(
    centerX + scaledInnerRadius,
    centerY,
    centerX + scaledOuterRadius,
    centerY,
    `w=${wallThickness.toFixed(1)}mm`,
    10
  );
  
  // Concentricity tolerance
  generator.drawGeometricTolerance(
    centerX,
    centerY + scaledOuterRadius + 60,
    'concentricity',
    '0.05',
    'A'
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW (EDGE)');
  
  // Scale to fit
  const scale = Math.min(width / outerDiameter, height / thickness) * 0.6;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10);
  
  const rectX = x + (width - scaledOD) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Outer rectangle
  generator.drawRectangle(rectX, rectY, scaledOD, scaledThickness, 'visible');
  
  // Inner hollow (hidden lines to show it's hollow)
  const hollowX = rectX + (scaledOD - scaledID) / 2;
  generator.drawRectangle(hollowX, rectY, scaledID, scaledThickness, 'hidden');
  
  // Centerline
  generator.drawLine(
    rectX - 20,
    y + height / 2,
    rectX + scaledOD + 20,
    y + height / 2,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledOD,
    rectY + scaledThickness + 30,
    `OD=${outerDiameter}mm`,
    5
  );
  
  generator.drawDimension(
    rectX + scaledOD + 30,
    rectY,
    rectX + scaledOD + 30,
    rectY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width / outerDiameter, height / thickness) * 0.6;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  const scaledThickness = Math.max(thickness * scale, 10);
  
  const rectX = x + (width - scaledOD) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  const hollowX = rectX + (scaledOD - scaledID) / 2;
  
  // Draw cross-section with hatching
  const scope = generator.getScope();
  
  // Left wall
  generator.drawRectangle(rectX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 'visible');
  generator.drawHatching(rectX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 45, 4);
  
  // Right wall  
  const rightX = rectX + (scaledOD + scaledID) / 2;
  generator.drawRectangle(rightX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 'visible');
  generator.drawHatching(rightX, rectY, (scaledOD - scaledID) / 2, scaledThickness, 45, 4);
  
  // Hollow center (no hatching)
  generator.drawRectangle(hollowX, rectY, scaledID, scaledThickness, 'visible');
  
  // Centerlines
  generator.drawLine(
    x + width / 2,
    rectY - 20,
    x + width / 2,
    rectY + scaledThickness + 20,
    'center'
  );
  
  // Section arrows
  generator.drawSectionArrow(rectX - 40, rectY + scaledThickness / 2, 'A', 'right');
  generator.drawSectionArrow(rectX + scaledOD + 40, rectY + scaledThickness / 2, 'A', 'left');
  
  // Add dimension for wall thickness
  const wallThickness = (outerDiameter - innerDiameter) / 2;
  generator.drawDimension(
    rectX,
    rectY - 30,
    hollowX,
    rectY - 30,
    `w=${wallThickness.toFixed(1)}mm`,
    5
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale
  const scale = Math.min(width, height) * 0.5 / outerDiameter;
  const scaledOuterRadius = outerDiameter * scale / 2;
  const scaledInnerRadius = innerDiameter * scale / 2;
  const scaledThickness = Math.max(thickness * scale, 5);
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw bottom outer ellipse
  const bottomOuterEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY + scaledThickness / 2],
    size: [scaledOuterRadius * 2, scaledOuterRadius * 0.866],
  });
  bottomOuterEllipse.strokeColor = new scope.Color('#FFFFFF');
  bottomOuterEllipse.strokeWidth = 2;
  
  // Draw bottom inner ellipse
  const bottomInnerEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY + scaledThickness / 2],
    size: [scaledInnerRadius * 2, scaledInnerRadius * 0.866],
  });
  bottomInnerEllipse.strokeColor = new scope.Color('#B0B0B0');
  bottomInnerEllipse.strokeWidth = 1;
  bottomInnerEllipse.dashArray = [5, 3];
  
  // Draw top outer ellipse
  const topOuterEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY - scaledThickness / 2],
    size: [scaledOuterRadius * 2, scaledOuterRadius * 0.866],
  });
  topOuterEllipse.strokeColor = new scope.Color('#FFFFFF');
  topOuterEllipse.strokeWidth = 2;
  
  // Draw top inner ellipse
  const topInnerEllipse = new scope.Path.Ellipse({
    center: [centerX, centerY - scaledThickness / 2],
    size: [scaledInnerRadius * 2, scaledInnerRadius * 0.866],
  });
  topInnerEllipse.strokeColor = new scope.Color('#FFFFFF');
  topInnerEllipse.strokeWidth = 2;
  
  // Draw outer connecting edges
  const leftOuterEdge = new scope.Path.Line(
    new scope.Point(centerX - scaledOuterRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX - scaledOuterRadius, centerY + scaledThickness / 2)
  );
  leftOuterEdge.strokeColor = new scope.Color('#FFFFFF');
  leftOuterEdge.strokeWidth = 2;
  
  const rightOuterEdge = new scope.Path.Line(
    new scope.Point(centerX + scaledOuterRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX + scaledOuterRadius, centerY + scaledThickness / 2)
  );
  rightOuterEdge.strokeColor = new scope.Color('#FFFFFF');
  rightOuterEdge.strokeWidth = 2;
  
  // Draw inner connecting edges
  const leftInnerEdge = new scope.Path.Line(
    new scope.Point(centerX - scaledInnerRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX - scaledInnerRadius, centerY + scaledThickness / 2)
  );
  leftInnerEdge.strokeColor = new scope.Color('#FFFFFF');
  leftInnerEdge.strokeWidth = 2;
  
  const rightInnerEdge = new scope.Path.Line(
    new scope.Point(centerX + scaledInnerRadius, centerY - scaledThickness / 2),
    new scope.Point(centerX + scaledInnerRadius, centerY + scaledThickness / 2)
  );
  rightInnerEdge.strokeColor = new scope.Color('#FFFFFF');
  rightInnerEdge.strokeWidth = 2;
}