/**
 * Cone Technical Drawing Module
 * Generates 2-view technical drawings for conical parts
 * Supports solid and hollow (truncated) configurations
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawConeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // Ensure valid dimensions to prevent division by zero
  const baseDiameter = Math.max(dimensions.coneBottomDiameter || dimensions.diameter || dimensions.width || 100, 1);
  const height = Math.max(dimensions.coneHeight || dimensions.length || (dimensions.thickness || 15) * 10 || 150, 1);
  // Always create a truncated cone (frustum) with open top - default to 30% of base diameter
  const defaultTopDiameter = baseDiameter * 0.3;
  const topDiameter = dimensions.coneTopDiameter ?? dimensions.innerDiameter ?? defaultTopDiameter;
  const isHollow = dimensions.isHollow;
  const wallThickness = dimensions.wallThickness || 10;

  // FRONT VIEW (Triangle/Trapezoid)
  drawFrontView(generator, baseDiameter, topDiameter, height, isHollow, wallThickness, layout.frontView);

  // SIDE VIEW (Section with hatching)
  drawSideView(generator, baseDiameter, topDiameter, height, isHollow, wallThickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  height: number,
  isHollow?: boolean,
  wallThickness?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
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
  conePath.strokeColor = new scope.Color('#000000');
  conePath.strokeWidth = 2;

  // Draw inner profile if hollow
  if (isHollow && wallThickness) {
    const scaledWall = wallThickness * scale;
    const innerBaseDiameter = Math.max(baseDiameter - 2 * wallThickness, 0);
    const innerTopDiameter = Math.max(topDiameter - 2 * wallThickness, 0);
    const scaledInnerBase = innerBaseDiameter * scale;
    const scaledInnerTop = innerTopDiameter * scale;

    const innerPath = new scope.Path();
    innerPath.add(new scope.Point(centerX - scaledInnerBase / 2, bottomY));
    innerPath.add(new scope.Point(centerX - scaledInnerTop / 2, topY));
    innerPath.add(new scope.Point(centerX + scaledInnerTop / 2, topY));
    innerPath.add(new scope.Point(centerX + scaledInnerBase / 2, bottomY));
    innerPath.strokeColor = new scope.Color('#B0B0B0');
    innerPath.strokeWidth = 1.5;
    innerPath.dashArray = [5, 3];
  }

  // Centerlines
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');
  generator.drawLine(centerX - scaledBase / 2 - 20, centerY, centerX + scaledBase / 2 + 20, centerY, 'center');

  // Dimensions
  generator.drawDimension(
    centerX - scaledBase / 2,
    bottomY + 30,
    centerX + scaledBase / 2,
    bottomY + 30,
    `Ø${baseDiameter}mm`,
    5
  );

  if (topDiameter > 0) {
    generator.drawDimension(
      centerX - scaledTop / 2,
      topY - 30,
      centerX + scaledTop / 2,
      topY - 30,
      `Ø${topDiameter}mm`,
      5
    );
  }

  generator.drawDimension(
    centerX + scaledBase / 2 + 30,
    bottomY,
    centerX + scaledBase / 2 + 30,
    topY,
    `H=${height}mm`,
    5
  );

  // Taper angle calculation
  const taperAngle = Math.atan((baseDiameter - topDiameter) / 2 / height) * (180 / Math.PI);
  generator.drawText(centerX, bottomY + 55, `Taper: ${taperAngle.toFixed(1)}°`, 10, '#000000');
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  baseDiameter: number,
  topDiameter: number,
  height: number,
  isHollow?: boolean,
  wallThickness?: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height: viewHeight } = viewConfig;
  const scope = generator.getScope();

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

  if (isHollow && wallThickness) {
    const scaledWall = wallThickness * scale;
    const innerBaseDiameter = Math.max(baseDiameter - 2 * wallThickness, 0);
    const innerTopDiameter = Math.max(topDiameter - 2 * wallThickness, 0);
    const scaledInnerBase = innerBaseDiameter * scale;
    const scaledInnerTop = innerTopDiameter * scale;

    // Draw outer profile
    const outerPath = new scope.Path();
    outerPath.add(new scope.Point(centerX - scaledBase / 2, bottomY));
    outerPath.add(new scope.Point(centerX - scaledTop / 2, topY));
    outerPath.add(new scope.Point(centerX + scaledTop / 2, topY));
    outerPath.add(new scope.Point(centerX + scaledBase / 2, bottomY));
    outerPath.closed = true;
    outerPath.strokeColor = new scope.Color('#000000');
    outerPath.strokeWidth = 2;

    // Draw inner profile
    const innerPath = new scope.Path();
    innerPath.add(new scope.Point(centerX - scaledInnerBase / 2, bottomY));
    innerPath.add(new scope.Point(centerX - scaledInnerTop / 2, topY));
    innerPath.add(new scope.Point(centerX + scaledInnerTop / 2, topY));
    innerPath.add(new scope.Point(centerX + scaledInnerBase / 2, bottomY));
    innerPath.closed = true;
    innerPath.strokeColor = new scope.Color('#000000');
    innerPath.strokeWidth = 2;

    // Hatching for left wall
    generator.drawHatching(
      centerX - scaledBase / 2,
      topY,
      (scaledBase - scaledInnerBase) / 2,
      scaledHeight,
      45, 4
    );

    // Hatching for right wall
    generator.drawHatching(
      centerX + scaledInnerBase / 2,
      topY,
      (scaledBase - scaledInnerBase) / 2,
      scaledHeight,
      45, 4
    );

    // Wall thickness dimension
    generator.drawText(
      centerX,
      centerY,
      `t=${wallThickness}mm`,
      10,
      '#000000'
    );
  } else {
    // Solid cone - full hatching
    const hatchArea = {
      x: centerX - scaledBase / 2,
      y: topY,
      width: scaledBase,
      height: scaledHeight
    };

    generator.drawHatching(
      hatchArea.x,
      hatchArea.y,
      hatchArea.width,
      hatchArea.height,
      45, 6
    );

    // Outer profile
    const conePath = new scope.Path();
    conePath.add(new scope.Point(centerX - scaledBase / 2, bottomY));
    conePath.add(new scope.Point(centerX - scaledTop / 2, topY));
    conePath.add(new scope.Point(centerX + scaledTop / 2, topY));
    conePath.add(new scope.Point(centerX + scaledBase / 2, bottomY));
    conePath.closed = true;
    conePath.strokeColor = new scope.Color('#000000');
    conePath.strokeWidth = 2;

    generator.drawText(centerX, centerY, 'SOLID', 10, '#000000');
  }

  // Centerline
  generator.drawLine(centerX, topY - 20, centerX, bottomY + 20, 'center');
}
