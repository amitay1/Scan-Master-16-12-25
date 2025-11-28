/**
 * Tube (Hollow Cylinder) Technical Drawing Module
 * Generates multi-view technical drawings for tubular parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawTubeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const outerDiameter = dimensions.diameter || dimensions.outerDiameter || 50;
  const wallThickness = dimensions.wallThickness || dimensions.thickness || 5;
  const innerDiameter = outerDiameter - (2 * wallThickness);
  const length = dimensions.length;
  
  // FRONT VIEW (Length × OD with inner rectangle)
  drawFrontView(generator, length, outerDiameter, innerDiameter, layout.frontView);
  
  // TOP VIEW (Concentric circles)
  drawTopView(generator, outerDiameter, innerDiameter, wallThickness, layout.topView);
  
  // SECTION A-A (with hatching in wall)
  drawSectionView(generator, length, outerDiameter, innerDiameter, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, length, outerDiameter, innerDiameter, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width / length, height / outerDiameter) * 0.6;
  const scaledLength = length * scale;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  
  const outerX = x + (width - scaledLength) / 2;
  const outerY = y + (height - scaledOD) / 2;
  
  const innerX = outerX;
  const innerY = outerY + (scaledOD - scaledID) / 2;
  
  // Outer rectangle
  generator.drawRectangle(outerX, outerY, scaledLength, scaledOD, 'visible');
  
  // Inner rectangle (hidden lines)
  generator.drawRectangle(innerX, innerY, scaledLength, scaledID, 'hidden');
  
  // Centerlines
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  generator.drawLine(
    outerX - 20,
    centerY,
    outerX + scaledLength + 20,
    centerY,
    'center'
  );
  
  generator.drawLine(
    centerX,
    outerY - 20,
    centerX,
    outerY + scaledOD + 20,
    'center'
  );
  
  // Dimensions
  generator.drawDimension(
    outerX,
    outerY + scaledOD + 35,
    outerX + scaledLength,
    outerY + scaledOD + 35,
    `L=${length}mm`,
    5
  );
  
  generator.drawDimension(
    outerX + scaledLength + 35,
    outerY,
    outerX + scaledLength + 35,
    outerY + scaledOD,
    `OD=${outerDiameter}mm`,
    5
  );
  
  generator.drawDimension(
    outerX + scaledLength + 55,
    innerY,
    outerX + scaledLength + 55,
    innerY + scaledID,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  innerDiameter: number,
  wallThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width, height) / outerDiameter * 0.5;
  const scaledOuterRadius = (outerDiameter / 2) * scale;
  const scaledInnerRadius = (innerDiameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Outer circle
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');
  
  // Inner circle (hollow)
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
  
  // Dimensions
  generator.drawDimension(
    centerX - scaledOuterRadius,
    centerY - scaledOuterRadius - 30,
    centerX + scaledOuterRadius,
    centerY - scaledOuterRadius - 30,
    `OD=${outerDiameter}mm`,
    5
  );
  
  generator.drawDimension(
    centerX - scaledInnerRadius,
    centerY + scaledInnerRadius + 25,
    centerX + scaledInnerRadius,
    centerY + scaledInnerRadius + 25,
    `ID=${innerDiameter.toFixed(1)}mm`,
    5
  );
  
  // Wall thickness indicator
  const scope = generator.getScope();
  const wallLine = new scope.Path.Line(
    new scope.Point(centerX + scaledInnerRadius, centerY),
    new scope.Point(centerX + scaledOuterRadius, centerY)
  );
  wallLine.strokeColor = new scope.Color('#FFD700');
  wallLine.strokeWidth = 1.5;
  
  generator.drawText(
    centerX + (scaledInnerRadius + scaledOuterRadius) / 2,
    centerY - 10,
    `t=${wallThickness}mm`,
    10,
    '#FFD700'
  );
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  length: number,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width / length, height / outerDiameter) * 0.6;
  const scaledLength = length * scale;
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  
  const outerX = x + (width - scaledLength) / 2;
  const outerY = y + (height - scaledOD) / 2;
  
  const innerX = outerX;
  const innerY = outerY + (scaledOD - scaledID) / 2;
  
  // Outer rectangle
  generator.drawRectangle(outerX, outerY, scaledLength, scaledOD, 'visible');
  
  // Inner rectangle (cut through)
  generator.drawRectangle(innerX, innerY, scaledLength, scaledID, 'visible');
  
  // Hatching in wall (top and bottom)
  const wallThickness = (scaledOD - scaledID) / 2;
  generator.drawHatching(outerX, outerY, scaledLength, wallThickness, 45, 6);
  generator.drawHatching(outerX, outerY + wallThickness + scaledID, scaledLength, wallThickness, 45, 6);
  
  // Centerlines
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  generator.drawLine(
    outerX - 20,
    centerY,
    outerX + scaledLength + 20,
    centerY,
    'center'
  );
  
  // Text label - HIGH CONTRAST
  generator.drawText(
    centerX,
    innerY + scaledID / 2,
    'HOLLOW',
    10,
    '#FFFFFF'
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  length: number,
  outerDiameter: number,
  innerDiameter: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Scale to fit
  const maxDim = Math.max(length, outerDiameter);
  const scale = Math.min(width, height) / maxDim * 0.5;
  
  const scaledLength = length * scale;
  const scaledOuterRadius = (outerDiameter / 2) * scale;
  const scaledInnerRadius = (innerDiameter / 2) * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const scope = generator.getScope();
  
  // Front outer ellipse
  const frontOuterEllipse = new scope.Path.Ellipse({
    center: [centerX - scaledLength / 3, centerY + scaledOuterRadius / 3],
    radius: [scaledOuterRadius, scaledOuterRadius / 2]
  });
  frontOuterEllipse.strokeColor = new scope.Color('#FFFFFF');
  frontOuterEllipse.strokeWidth = 2;
  frontOuterEllipse.fillColor = new scope.Color('#505050');
  
  // Front inner ellipse (hollow)
  const frontInnerEllipse = new scope.Path.Ellipse({
    center: [centerX - scaledLength / 3, centerY + scaledOuterRadius / 3],
    radius: [scaledInnerRadius, scaledInnerRadius / 2]
  });
  frontInnerEllipse.strokeColor = new scope.Color('#FFFFFF');
  frontInnerEllipse.strokeWidth = 1.5;
  frontInnerEllipse.fillColor = new scope.Color('#202020');
  
  // Back outer ellipse
  const backOuterEllipse = new scope.Path.Ellipse({
    center: [centerX + scaledLength / 3, centerY - scaledOuterRadius / 3],
    radius: [scaledOuterRadius, scaledOuterRadius / 2]
  });
  backOuterEllipse.strokeColor = new scope.Color('#FFFFFF');
  backOuterEllipse.strokeWidth = 2;
  backOuterEllipse.fillColor = new scope.Color('#E8E8E8');
  
  // Outer side lines
  generator.drawLine(
    centerX - scaledLength / 3 - scaledOuterRadius,
    centerY + scaledOuterRadius / 3,
    centerX + scaledLength / 3 - scaledOuterRadius,
    centerY - scaledOuterRadius / 3,
    'visible'
  );
  
  generator.drawLine(
    centerX - scaledLength / 3 + scaledOuterRadius,
    centerY + scaledOuterRadius / 3,
    centerX + scaledLength / 3 + scaledOuterRadius,
    centerY - scaledOuterRadius / 3,
    'visible'
  );
  
  // Inner side lines (hidden)
  generator.drawLine(
    centerX - scaledLength / 3 - scaledInnerRadius,
    centerY + scaledOuterRadius / 3,
    centerX + scaledLength / 3 - scaledInnerRadius,
    centerY - scaledOuterRadius / 3,
    'hidden'
  );
  
  generator.drawLine(
    centerX - scaledLength / 3 + scaledInnerRadius,
    centerY + scaledOuterRadius / 3,
    centerX + scaledLength / 3 + scaledInnerRadius,
    centerY - scaledOuterRadius / 3,
    'hidden'
  );
}
