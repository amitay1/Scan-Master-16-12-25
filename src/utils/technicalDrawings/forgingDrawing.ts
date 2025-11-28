/**
 * Forging Technical Drawing Module
 * Generates multi-view technical drawings for complex irregular forged parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawForgingTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const maxLength = dimensions.length || 150;
  const maxWidth = dimensions.width || 100;
  const maxThickness = dimensions.thickness || 60;
  
  // FRONT VIEW (Complex profile)
  drawFrontView(generator, maxLength, maxThickness, layout.frontView);
  
  // TOP VIEW (Irregular shape)
  drawTopView(generator, maxLength, maxWidth, layout.topView);
  
  // SECTION A-A (with hatching)
  drawSectionView(generator, maxWidth, maxThickness, layout.sideView);
  
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
  
  // Draw complex forged profile (hub with tapered ends)
  const path = new scope.Path();
  
  // Start from left taper
  const leftEnd = centerX - scaledLength / 2;
  const rightEnd = centerX + scaledLength / 2;
  const topEdge = centerY - scaledThickness / 2;
  const bottomEdge = centerY + scaledThickness / 2;
  
  // Create irregular forged shape with hub in center
  path.add(new scope.Point(leftEnd, centerY - scaledThickness * 0.2));
  
  // Left transition to hub
  path.add(new scope.Point(leftEnd + scaledLength * 0.15, centerY - scaledThickness * 0.3));
  path.add(new scope.Point(leftEnd + scaledLength * 0.25, topEdge));
  
  // Hub section (thicker middle)
  path.add(new scope.Point(rightEnd - scaledLength * 0.25, topEdge));
  
  // Right transition
  path.add(new scope.Point(rightEnd - scaledLength * 0.15, centerY - scaledThickness * 0.3));
  path.add(new scope.Point(rightEnd, centerY - scaledThickness * 0.2));
  
  // Bottom profile (mirror with variations)
  path.add(new scope.Point(rightEnd, centerY + scaledThickness * 0.2));
  path.add(new scope.Point(rightEnd - scaledLength * 0.15, centerY + scaledThickness * 0.3));
  path.add(new scope.Point(rightEnd - scaledLength * 0.25, bottomEdge));
  
  // Hub bottom
  path.add(new scope.Point(leftEnd + scaledLength * 0.25, bottomEdge));
  path.add(new scope.Point(leftEnd + scaledLength * 0.15, centerY + scaledThickness * 0.3));
  path.add(new scope.Point(leftEnd, centerY + scaledThickness * 0.2));
  
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Add forge flow lines (characteristic of forged parts)
  for (let i = 0; i < 5; i++) {
    const flowLine = new scope.Path();
    const yOffset = centerY - scaledThickness * 0.3 + (i * scaledThickness * 0.15);
    flowLine.add(new scope.Point(leftEnd + scaledLength * 0.1, yOffset));
    
    // Create curved flow line
    const points = [];
    for (let x = 0; x <= 1; x += 0.1) {
      const xPos = leftEnd + scaledLength * 0.1 + x * scaledLength * 0.8;
      const yVariation = Math.sin(x * Math.PI) * scaledThickness * 0.05;
      points.push(new scope.Point(xPos, yOffset + yVariation));
    }
    
    flowLine.add(points);
    flowLine.strokeColor = new scope.Color('#B0B0B0');
    flowLine.strokeWidth = 0.5;
    flowLine.dashArray = [3, 2];
  }
  
  // Centerlines
  generator.drawLine(leftEnd - 20, centerY, rightEnd + 20, centerY, 'center');
  generator.drawLine(centerX, topEdge - 20, centerX, bottomEdge + 20, 'center');
  
  // Critical dimensions
  generator.drawDimensionWithTolerance(
    leftEnd,
    bottomEdge + 30,
    rightEnd,
    bottomEdge + 30,
    `${maxLength}`,
    '+1.0',
    '-1.0',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `${maxThickness}`,
    '+0.8',
    '-0.8',
    5
  );
  
  // Surface roughness for forged part
  generator.drawSurfaceFinish(centerX, topEdge - 10, 'asCast', '25');
  
  // Add forging note
  generator.drawText(centerX, y + height - 5, 'FORGED PART - DRAFT ANGLE 7°', '10px');
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
  
  // Draw irregular forged shape from top
  const path = new scope.Path();
  
  const leftEnd = centerX - scaledLength / 2;
  const rightEnd = centerX + scaledLength / 2;
  const topEdge = centerY - scaledWidth / 2;
  const bottomEdge = centerY + scaledWidth / 2;
  
  // Create organic forged shape
  path.add(new scope.Point(leftEnd, centerY));
  
  // Top curve with bulge
  const topCurve = [];
  for (let t = 0; t <= 1; t += 0.1) {
    const xPos = leftEnd + t * scaledLength;
    const yPos = topEdge + Math.sin(t * Math.PI) * scaledWidth * 0.2;
    topCurve.push(new scope.Point(xPos, yPos));
  }
  path.add(topCurve);
  
  path.add(new scope.Point(rightEnd, centerY));
  
  // Bottom curve with different profile
  const bottomCurve = [];
  for (let t = 1; t >= 0; t -= 0.1) {
    const xPos = leftEnd + t * scaledLength;
    const yPos = bottomEdge - Math.sin(t * Math.PI * 0.8) * scaledWidth * 0.15;
    bottomCurve.push(new scope.Point(xPos, yPos));
  }
  path.add(bottomCurve);
  
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Add parting line (characteristic of forged parts)
  const partingLine = new scope.Path();
  partingLine.add(new scope.Point(leftEnd - 10, centerY));
  partingLine.add(new scope.Point(rightEnd + 10, centerY));
  partingLine.strokeColor = new scope.Color('#FFD700');
  partingLine.strokeWidth = 1;
  partingLine.dashArray = [10, 5];
  
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
    '+1.0',
    '-1.0',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `${maxWidth}`,
    '+0.8',
    '-0.8',
    5
  );
  
  // Add note about parting line
  generator.drawText(centerX, centerY - 5, 'P.L.', '8px');
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  maxWidth: number,
  maxThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(width / maxWidth, height / maxThickness) * 0.6;
  const scaledWidth = maxWidth * scale;
  const scaledThickness = maxThickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw irregular cross-section
  const path = new scope.Path();
  
  // Create bulged/irregular section typical of forgings
  const points = [
    new scope.Point(centerX - scaledWidth / 2, centerY),
    new scope.Point(centerX - scaledWidth / 2 + scaledWidth * 0.1, centerY - scaledThickness / 2),
    new scope.Point(centerX - scaledWidth * 0.2, centerY - scaledThickness / 2 - scaledThickness * 0.1),
    new scope.Point(centerX + scaledWidth * 0.2, centerY - scaledThickness / 2 - scaledThickness * 0.1),
    new scope.Point(centerX + scaledWidth / 2 - scaledWidth * 0.1, centerY - scaledThickness / 2),
    new scope.Point(centerX + scaledWidth / 2, centerY),
    new scope.Point(centerX + scaledWidth / 2 - scaledWidth * 0.1, centerY + scaledThickness / 2),
    new scope.Point(centerX + scaledWidth * 0.2, centerY + scaledThickness / 2 + scaledThickness * 0.05),
    new scope.Point(centerX - scaledWidth * 0.2, centerY + scaledThickness / 2 + scaledThickness * 0.05),
    new scope.Point(centerX - scaledWidth / 2 + scaledWidth * 0.1, centerY + scaledThickness / 2),
  ];
  
  path.add(points);
  path.closed = true;
  path.strokeColor = new scope.Color('#FFFFFF');
  path.strokeWidth = 2;
  
  // Add hatching
  generator.drawHatching(
    centerX - scaledWidth / 2,
    centerY - scaledThickness / 2 - scaledThickness * 0.1,
    scaledWidth,
    scaledThickness + scaledThickness * 0.15,
    45,
    6
  );
  
  // Section arrows
  generator.drawSectionArrow(centerX - scaledWidth / 2 - 40, centerY, 'A', 'right');
  generator.drawSectionArrow(centerX + scaledWidth / 2 + 40, centerY, 'A', 'left');
  
  // Centerlines
  generator.drawLine(centerX, centerY - scaledThickness / 2 - 30, centerX, centerY + scaledThickness / 2 + 30, 'center');
  generator.drawLine(centerX - scaledWidth / 2 - 20, centerY, centerX + scaledWidth / 2 + 20, centerY, 'center');
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
  
  // Note about complexity
  generator.drawText(
    x + width / 2,
    y + height / 2,
    'COMPLEX FORGED SHAPE',
    '14px'
  );
  
  generator.drawText(
    x + width / 2,
    y + height / 2 + 20,
    'See 2D views for details',
    '12px'
  );
  
  generator.drawText(
    x + width / 2,
    y + height / 2 + 40,
    'Refer to 3D model file',
    '10px'
  );
  
  // Draw simplified representation
  const scale = Math.min(width, height) * 0.4 / Math.max(maxLength, maxWidth, maxThickness);
  const scaledLength = maxLength * scale;
  const scaledWidth = maxWidth * scale;
  const scaledThickness = maxThickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height - 60;
  
  // Draw bounding box in isometric
  const angle = 30 * Math.PI / 180;
  
  // Create simplified forged shape outline
  const outline = new scope.Path();
  
  // Calculate isometric points for irregular shape
  const iso_x = (x: number, z: number) => centerX + x * Math.cos(angle) - z * Math.cos(angle);
  const iso_y = (x: number, y: number, z: number) => centerY - y + x * Math.sin(angle) + z * Math.sin(angle);
  
  // Draw simplified profile
  outline.add(new scope.Point(iso_x(-scaledLength/2, -scaledWidth/2), iso_y(-scaledLength/2, 0, -scaledWidth/2)));
  outline.add(new scope.Point(iso_x(scaledLength/2, -scaledWidth/2), iso_y(scaledLength/2, 0, -scaledWidth/2)));
  outline.add(new scope.Point(iso_x(scaledLength/2, scaledWidth/2), iso_y(scaledLength/2, 0, scaledWidth/2)));
  outline.add(new scope.Point(iso_x(-scaledLength/2, scaledWidth/2), iso_y(-scaledLength/2, 0, scaledWidth/2)));
  outline.closed = true;
  outline.strokeColor = new scope.Color('#808080');
  outline.strokeWidth = 1;
  outline.dashArray = [5, 5];
}