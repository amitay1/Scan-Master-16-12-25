// @ts-nocheck
/**
 * Forging Technical Drawing Module
 * Generates 2-view technical drawings for complex irregular forged parts
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

  // SIDE VIEW (Section with hatching)
  drawSideView(generator, maxWidth, maxThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  maxLength: number,
  maxThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
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
  path.strokeColor = new scope.Color('#000000');
  path.strokeWidth = 2;

  // Add forge flow lines (characteristic of forged parts)
  for (let i = 0; i < 5; i++) {
    const flowLine = new scope.Path();
    const yOffset = centerY - scaledThickness * 0.3 + (i * scaledThickness * 0.15);
    flowLine.add(new scope.Point(leftEnd + scaledLength * 0.1, yOffset));

    // Create curved flow line
    const points = [];
    for (let xPos = 0; xPos <= 1; xPos += 0.1) {
      const posX = leftEnd + scaledLength * 0.1 + xPos * scaledLength * 0.8;
      const yVariation = Math.sin(xPos * Math.PI) * scaledThickness * 0.05;
      points.push(new scope.Point(posX, yOffset + yVariation));
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
  generator.drawDimension(
    leftEnd,
    bottomEdge + 30,
    rightEnd,
    bottomEdge + 30,
    `L=${maxLength}mm`,
    5
  );

  generator.drawDimension(
    rightEnd + 30,
    topEdge,
    rightEnd + 30,
    bottomEdge,
    `H=${maxThickness}mm`,
    5
  );

  // Add forging note
  generator.drawText(centerX, y + height - 5, 'FORGED PART - DRAFT ANGLE 7°', 10, '#000000');
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  maxWidth: number,
  maxThickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
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

  for (const point of points) {
    path.add(point);
  }
  path.closed = true;
  path.strokeColor = new scope.Color('#000000');
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

  // Centerlines
  generator.drawLine(centerX, centerY - scaledThickness / 2 - 30, centerX, centerY + scaledThickness / 2 + 30, 'center');
  generator.drawLine(centerX - scaledWidth / 2 - 20, centerY, centerX + scaledWidth / 2 + 20, centerY, 'center');

  // Dimensions
  generator.drawDimension(
    centerX - scaledWidth / 2,
    centerY + scaledThickness / 2 + 40,
    centerX + scaledWidth / 2,
    centerY + scaledThickness / 2 + 40,
    `W=${maxWidth}mm`,
    5
  );

  generator.drawDimension(
    centerX + scaledWidth / 2 + 30,
    centerY - scaledThickness / 2 - scaledThickness * 0.1,
    centerX + scaledWidth / 2 + 30,
    centerY + scaledThickness / 2 + scaledThickness * 0.05,
    `H=${maxThickness}mm`,
    5
  );

  generator.drawText(
    centerX,
    centerY,
    'SOLID',
    10,
    '#000000'
  );
}
