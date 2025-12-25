/**
 * Ellipse Technical Drawing Module
 * Generates 2-view technical drawings for elliptical parts
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

  // SIDE VIEW (Edge/Section view)
  drawSideView(generator, minorAxis, thickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  majorAxis: number,
  minorAxis: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
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
  generator.drawText(centerX - focalDistance, centerY - 15, 'F1', 10, '#FFD700');
  generator.drawText(centerX + focalDistance, centerY - 15, 'F2', 10, '#FFD700');

  // Dimensions
  generator.drawDimension(
    centerX - scaledMajor / 2,
    centerY + scaledMinor / 2 + 30,
    centerX + scaledMajor / 2,
    centerY + scaledMinor / 2 + 30,
    `a=${majorAxis}mm`,
    5
  );

  generator.drawDimension(
    centerX + scaledMajor / 2 + 30,
    centerY - scaledMinor / 2,
    centerX + scaledMajor / 2 + 30,
    centerY + scaledMinor / 2,
    `b=${minorAxis}mm`,
    5
  );

  // Eccentricity annotation
  generator.drawText(
    x + width / 2,
    y + height - 10,
    `e=${eccentricity.toFixed(3)}`,
    10,
    '#FFFFFF'
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  minorAxis: number,
  thickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const scale = Math.min(width / minorAxis, height / thickness) * 0.6;
  const scaledMinor = minorAxis * scale;
  const scaledThickness = Math.max(thickness * scale, 10);

  const rectX = x + (width - scaledMinor) / 2;
  const rectY = y + (height - scaledThickness) / 2;

  // Edge view rectangle with hatching
  generator.drawRectangle(rectX, rectY, scaledMinor, scaledThickness, 'visible');
  generator.drawHatching(rectX, rectY, scaledMinor, scaledThickness, 45, 6);

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

  generator.drawDimension(
    rectX + scaledMinor + 30,
    rectY,
    rectX + scaledMinor + 30,
    rectY + scaledThickness,
    `t=${thickness}mm`,
    5
  );

  generator.drawText(
    x + width / 2,
    rectY + scaledThickness / 2,
    'SOLID',
    10,
    '#FFFFFF'
  );
}
