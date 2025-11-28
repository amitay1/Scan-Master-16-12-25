/**
 * Irregular/Custom Shape Technical Drawing Module
 * Generates multi-view technical drawings for custom irregular parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawIrregularTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const maxLength = dimensions.length || 120;
  const maxWidth = dimensions.width || 80;
  const maxThickness = dimensions.thickness || 40;
  
  // FRONT VIEW (Custom profile)
  drawFrontView(generator, maxLength, maxThickness, layout.frontView);
  
  // TOP VIEW (Custom shape)
  drawTopView(generator, maxLength, maxWidth, layout.topView);
  
  // SIDE VIEW (Custom profile)
  drawSideView(generator, maxWidth, maxThickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, maxLength, maxWidth, maxThickness, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  maxLength: number,
  maxThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width / maxLength, height / maxThickness) * 0.6;
  const scaledLength = maxLength * scale;
  const scaledThickness = maxThickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw custom irregular shape (example: bracket-like shape)
  const path = new scope.Path();
  
  const leftEnd = centerX - scaledLength / 2;
  const rightEnd = centerX + scaledLength / 2;
  const topEdge = centerY - scaledThickness / 2;
  const bottomEdge = centerY + scaledThickness / 2;
  
  // Create custom bracket profile with holes and cutouts
  path.add(new scope.Point(leftEnd, bottomEdge));
  path.add(new scope.Point(leftEnd, topEdge + scaledThickness * 0.3));
  path.add(new scope.Point(leftEnd + scaledLength * 0.2, topEdge));
  path.add(new scope.Point(centerX - scaledLength * 0.1, topEdge));
  
  // Notch in middle
  path.add(new scope.Point(centerX - scaledLength * 0.1, topEdge + scaledThickness * 0.2));
  path.add(new scope.Point(centerX + scaledLength * 0.1, topEdge + scaledThickness * 0.2));
  path.add(new scope.Point(centerX + scaledLength * 0.1, topEdge));
  
  path.add(new scope.Point(rightEnd - scaledLength * 0.3, topEdge));
  path.add(new scope.Point(rightEnd, centerY));
  path.add(new scope.Point(rightEnd, bottomEdge));
  
  // Bottom profile with step
  path.add(new scope.Point(centerX + scaledLength * 0.2, bottomEdge));
  path.add(new scope.Point(centerX + scaledLength * 0.2, bottomEdge - scaledThickness * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.2, bottomEdge - scaledThickness * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.2, bottomEdge));
  
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Add mounting holes
  const hole1 = new scope.Path.Circle({
    center: [leftEnd + scaledLength * 0.15, centerY],
    radius: scaledThickness * 0.1
  });
  hole1.strokeColor = new scope.Color('#FFFFFF');
  hole1.strokeWidth = 2;
  
  const hole2 = new scope.Path.Circle({
    center: [rightEnd - scaledLength * 0.15, centerY],
    radius: scaledThickness * 0.1
  });
  hole2.strokeColor = new scope.Color('#FFFFFF');
  hole2.strokeWidth = 2;
  
  // Centerlines for holes
  generator.drawLine(
    leftEnd + scaledLength * 0.15 - 15,
    centerY,
    leftEnd + scaledLength * 0.15 + 15,
    centerY,
    'center'
  );
  generator.drawLine(
    leftEnd + scaledLength * 0.15,
    centerY - 15,
    leftEnd + scaledLength * 0.15,
    centerY + 15,
    'center'
  );
  
  generator.drawLine(
    rightEnd - scaledLength * 0.15 - 15,
    centerY,
    rightEnd - scaledLength * 0.15 + 15,
    centerY,
    'center'
  );
  generator.drawLine(
    rightEnd - scaledLength * 0.15,
    centerY - 15,
    rightEnd - scaledLength * 0.15,
    centerY + 15,
    'center'
  );
  
  // Overall dimensions
  generator.drawDimensionWithTolerance(
    leftEnd,
    bottomEdge + 30,
    rightEnd,
    bottomEdge + 30,
    `${maxLength}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `${maxThickness}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Hole dimensions
  generator.drawText(
    leftEnd + scaledLength * 0.15,
    centerY - scaledThickness * 0.15,
    '2×Ø10',
    '10px'
  );
  
  // Surface finish
  generator.drawSurfaceFinish(centerX, topEdge - 10, 'machined', '3.2');
  
  // Note about custom shape
  generator.drawText(centerX, y + height - 5, 'CUSTOM BRACKET - ALL DIMS IN MM', '10px');
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  maxLength: number,
  maxWidth: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(width / maxLength, height / maxWidth) * 0.6;
  const scaledLength = maxLength * scale;
  const scaledWidth = maxWidth * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw custom shape from top
  const path = new scope.Path();
  
  const leftEnd = centerX - scaledLength / 2;
  const rightEnd = centerX + scaledLength / 2;
  const topEdge = centerY - scaledWidth / 2;
  const bottomEdge = centerY + scaledWidth / 2;
  
  // Create L-shaped profile with cutouts
  path.add(new scope.Point(leftEnd, bottomEdge));
  path.add(new scope.Point(leftEnd, topEdge));
  path.add(new scope.Point(centerX, topEdge));
  
  // Angled cut
  path.add(new scope.Point(centerX + scaledLength * 0.2, topEdge + scaledWidth * 0.3));
  path.add(new scope.Point(rightEnd, topEdge + scaledWidth * 0.3));
  path.add(new scope.Point(rightEnd, bottomEdge));
  
  // Bottom with notch
  path.add(new scope.Point(centerX + scaledLength * 0.1, bottomEdge));
  path.add(new scope.Point(centerX + scaledLength * 0.1, bottomEdge - scaledWidth * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.1, bottomEdge - scaledWidth * 0.2));
  path.add(new scope.Point(centerX - scaledLength * 0.1, bottomEdge));
  
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Show mounting holes from top
  const hole1 = new scope.Path.Circle({
    center: [leftEnd + scaledLength * 0.15, centerY - scaledWidth * 0.2],
    radius: scaledLength * 0.03
  });
  hole1.strokeColor = new scope.Color('#FFFFFF');
  hole1.strokeWidth = 2;
  
  const hole2 = new scope.Path.Circle({
    center: [rightEnd - scaledLength * 0.15, centerY],
    radius: scaledLength * 0.03
  });
  hole2.strokeColor = new scope.Color('#FFFFFF');
  hole2.strokeWidth = 2;
  
  // Centerlines
  generator.drawLine(leftEnd - 20, centerY, rightEnd + 20, centerY, 'center');
  generator.drawLine(centerX, topEdge - 20, centerX, bottomEdge + 20, 'center');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    leftEnd,
    bottomEdge + 30,
    rightEnd,
    bottomEdge + 30,
    `${maxLength}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `${maxWidth}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Angular dimension for angled cut
  generator.drawText(
    centerX + scaledLength * 0.1,
    topEdge + scaledWidth * 0.15,
    '30°',
    '10px'
  );
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  maxWidth: number,
  maxThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SIDE VIEW');
  
  // Scale to fit
  const scale = Math.min(width / maxWidth, height / maxThickness) * 0.6;
  const scaledWidth = maxWidth * scale;
  const scaledThickness = maxThickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw side profile
  const path = new scope.Path();
  
  const leftEdge = centerX - scaledWidth / 2;
  const rightEdge = centerX + scaledWidth / 2;
  const topEdge = centerY - scaledThickness / 2;
  const bottomEdge = centerY + scaledThickness / 2;
  
  // T-shaped side profile
  path.add(new scope.Point(leftEdge, bottomEdge));
  path.add(new scope.Point(leftEdge, centerY));
  path.add(new scope.Point(leftEdge + scaledWidth * 0.3, centerY));
  path.add(new scope.Point(leftEdge + scaledWidth * 0.3, topEdge));
  path.add(new scope.Point(rightEdge - scaledWidth * 0.3, topEdge));
  path.add(new scope.Point(rightEdge - scaledWidth * 0.3, centerY));
  path.add(new scope.Point(rightEdge, centerY));
  path.add(new scope.Point(rightEdge, bottomEdge));
  
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Show hole in side view (hidden line)
  const hiddenCircle = new scope.Path.Circle({
    center: [centerX, centerY - scaledThickness * 0.15],
    radius: scaledThickness * 0.1
  });
  hiddenCircle.strokeColor = new scope.Color('#B0B0B0');
  hiddenCircle.strokeWidth = 1;
  hiddenCircle.dashArray = [5, 3];
  
  // Centerlines
  generator.drawLine(leftEdge - 20, centerY, rightEdge + 20, centerY, 'center');
  generator.drawLine(centerX, topEdge - 20, centerX, bottomEdge + 20, 'center');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    leftEdge,
    bottomEdge + 30,
    rightEdge,
    bottomEdge + 30,
    `${maxWidth}`,
    '+0.3',
    '-0.3',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rightEdge + 30,
    topEdge,
    rightEdge + 30,
    bottomEdge,
    `${maxThickness}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Step dimension
  generator.drawDimension(
    leftEdge + scaledWidth * 0.3,
    centerY + 20,
    rightEdge - scaledWidth * 0.3,
    centerY + 20,
    `${(maxWidth * 0.4).toFixed(1)}`,
    5
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  maxLength: number,
  maxWidth: number,
  maxThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'ISOMETRIC VIEW');
  
  // Scale
  const maxDim = Math.max(maxLength, maxWidth, maxThickness);
  const scale = Math.min(width, height) * 0.4 / maxDim;
  
  const scaledLength = maxLength * scale;
  const scaledWidth = maxWidth * scale;
  const scaledThickness = maxThickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw simplified isometric representation
  const angle = 30 * Math.PI / 180;
  
  // Helper functions for isometric projection
  const iso_x = (x: number, z: number) => centerX + x * Math.cos(angle) - z * Math.cos(angle);
  const iso_y = (x: number, y: number, z: number) => centerY - y + x * Math.sin(angle) + z * Math.sin(angle);
  
  // Draw basic shape outline
  const outline = new scope.Path();
  
  // Front face (custom shape)
  const frontFace = [
    [iso_x(-scaledLength/2, scaledWidth/2), iso_y(-scaledLength/2, -scaledThickness/2, scaledWidth/2)],
    [iso_x(-scaledLength/2, scaledWidth/2), iso_y(-scaledLength/2, scaledThickness/2, scaledWidth/2)],
    [iso_x(scaledLength/2, scaledWidth/2), iso_y(scaledLength/2, scaledThickness/2, scaledWidth/2)],
    [iso_x(scaledLength/2, scaledWidth/2), iso_y(scaledLength/2, 0, scaledWidth/2)],
    [iso_x(0, scaledWidth/2), iso_y(0, -scaledThickness/2, scaledWidth/2)],
    [iso_x(-scaledLength/2, scaledWidth/2), iso_y(-scaledLength/2, -scaledThickness/2, scaledWidth/2)]
  ];
  
  frontFace.forEach((point, i) => {
    if (i === 0) {
      outline.moveTo(point[0], point[1]);
    } else {
      outline.lineTo(point[0], point[1]);
    }
  });
  outline.strokeColor = new scope.Color('#FFFFFF');
  outline.strokeWidth = 2;
  
  // Top edges
  const topEdges = new scope.Path();
  topEdges.add(new scope.Point(iso_x(-scaledLength/2, scaledWidth/2), iso_y(-scaledLength/2, -scaledThickness/2, scaledWidth/2)));
  topEdges.add(new scope.Point(iso_x(-scaledLength/2, -scaledWidth/2), iso_y(-scaledLength/2, -scaledThickness/2, -scaledWidth/2)));
  topEdges.strokeColor = new scope.Color('#FFFFFF');
  topEdges.strokeWidth = 2;
  
  const topEdge2 = new scope.Path();
  topEdge2.add(new scope.Point(iso_x(0, scaledWidth/2), iso_y(0, -scaledThickness/2, scaledWidth/2)));
  topEdge2.add(new scope.Point(iso_x(0, -scaledWidth/2), iso_y(0, -scaledThickness/2, -scaledWidth/2)));
  topEdge2.strokeColor = new scope.Color('#FFFFFF');
  topEdge2.strokeWidth = 2;
  
  // Back edges (hidden)
  const backEdges = new scope.Path();
  backEdges.add(new scope.Point(iso_x(-scaledLength/2, -scaledWidth/2), iso_y(-scaledLength/2, -scaledThickness/2, -scaledWidth/2)));
  backEdges.add(new scope.Point(iso_x(-scaledLength/2, -scaledWidth/2), iso_y(-scaledLength/2, scaledThickness/2, -scaledWidth/2)));
  backEdges.strokeColor = new scope.Color('#B0B0B0');
  backEdges.strokeWidth = 1;
  backEdges.dashArray = [5, 3];
  
  // Add note
  generator.drawText(
    centerX,
    y + height - 10,
    'CUSTOM PART - SIMPLIFIED VIEW',
    '10px'
  );
}