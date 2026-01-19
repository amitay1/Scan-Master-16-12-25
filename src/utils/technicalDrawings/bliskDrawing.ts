/**
 * Blisk Technical Drawing Module
 * Generates 2-view technical drawings for Blisk (Bladed Disk) parts
 * Shows hollow disk with integrated blades on the rim
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawBliskTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // Ensure valid dimensions
  const outerDiameter = Math.max(dimensions.diameter || dimensions.outerDiameter || 250, 1);
  const thickness = Math.max(dimensions.thickness || dimensions.length || 40, 1);

  // Blisk has a center bore (hollow) - typically 30-50% of OD
  let innerDiameter: number;
  if (dimensions.innerDiameter && dimensions.innerDiameter > 0) {
    innerDiameter = dimensions.innerDiameter;
  } else if (dimensions.wallThickness && dimensions.wallThickness > 0) {
    innerDiameter = outerDiameter - (2 * dimensions.wallThickness);
  } else {
    innerDiameter = outerDiameter * 0.35; // Default bore is 35% of OD
  }

  // Blade envelope extends beyond disk OD
  const bladeEnvelopeDiameter = outerDiameter * 1.15; // Blades extend 15% beyond disk
  const diskDiameter = outerDiameter * 0.85; // Disk body is 85% of total

  // FRONT VIEW (Disk with blade envelope and center bore)
  drawFrontView(generator, bladeEnvelopeDiameter, diskDiameter, innerDiameter, layout.frontView);

  // SIDE VIEW (Cross-section with hollow center and blade profile)
  drawSideView(generator, bladeEnvelopeDiameter, diskDiameter, innerDiameter, thickness, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  bladeEnvelopeDiameter: number,
  diskDiameter: number,
  innerDiameter: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width, height) * 0.5 / bladeEnvelopeDiameter;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const scaledBladeR = (bladeEnvelopeDiameter * scale) / 2;
  const scaledDiskR = (diskDiameter * scale) / 2;
  const scaledInnerR = (innerDiameter * scale) / 2;

  // Blade envelope (dashed - represents blade tips)
  generator.drawCircle(centerX, centerY, scaledBladeR, 'hidden');

  // Disk body
  generator.drawCircle(centerX, centerY, scaledDiskR, 'visible');

  // Center bore
  generator.drawCircle(centerX, centerY, scaledInnerR, 'visible');

  // Draw blade indicators (radial lines representing blades)
  const numBlades = 12; // Typical blade count indicator
  for (let i = 0; i < numBlades; i++) {
    const angle = (i / numBlades) * Math.PI * 2;
    const innerX = centerX + Math.cos(angle) * scaledDiskR;
    const innerY = centerY + Math.sin(angle) * scaledDiskR;
    const outerX = centerX + Math.cos(angle) * scaledBladeR;
    const outerY = centerY + Math.sin(angle) * scaledBladeR;
    generator.drawLine(innerX, innerY, outerX, outerY, 'visible');
  }

  // Centerlines
  generator.drawLine(
    centerX - scaledBladeR - 25,
    centerY,
    centerX + scaledBladeR + 25,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    centerY - scaledBladeR - 25,
    centerX,
    centerY + scaledBladeR + 25,
    'center'
  );

  // Dimensions
  generator.drawDimension(
    centerX - scaledBladeR,
    centerY + scaledBladeR + 40,
    centerX + scaledBladeR,
    centerY + scaledBladeR + 40,
    `Ø${bladeEnvelopeDiameter.toFixed(0)}mm (BLADE TIP)`,
    5
  );

  generator.drawDimension(
    centerX - scaledDiskR,
    centerY + scaledBladeR + 60,
    centerX + scaledDiskR,
    centerY + scaledBladeR + 60,
    `Ø${diskDiameter.toFixed(0)}mm (DISK)`,
    5
  );

  generator.drawDimension(
    centerX - scaledInnerR,
    centerY - scaledBladeR - 35,
    centerX + scaledInnerR,
    centerY - scaledBladeR - 35,
    `Ø${innerDiameter.toFixed(0)}mm (BORE)`,
    5
  );

  // Type label
  generator.drawText(centerX, centerY - 5, 'BLISK', 11, '#2980B9');
  generator.drawText(centerX, centerY + 10, '(BLADED DISK)', 8, '#666666');
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  bladeEnvelopeDiameter: number,
  diskDiameter: number,
  innerDiameter: number,
  thickness: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const bladeHeight = thickness * 1.2; // Blades are slightly taller than disk
  const scale = Math.min((width * 0.55) / bladeEnvelopeDiameter, (height * 0.55) / bladeHeight);

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const scaledBladeR = (bladeEnvelopeDiameter * scale) / 2;
  const scaledDiskR = (diskDiameter * scale) / 2;
  const scaledInnerR = (innerDiameter * scale) / 2;
  const scaledThickness = Math.max(thickness * scale, 12);
  const scaledBladeH = Math.max(bladeHeight * scale, 15);

  // Vertical centering
  const top = centerY - scaledBladeH / 2;
  const bottom = centerY + scaledBladeH / 2;
  const diskTop = centerY - scaledThickness / 2;
  const diskBottom = centerY + scaledThickness / 2;

  // Draw disk body with hollow center (cross-section)
  // Left disk wall (solid material)
  const leftDiskX = centerX - scaledDiskR;
  const wallWidth = scaledDiskR - scaledInnerR;
  generator.drawRectangle(leftDiskX, diskTop, wallWidth, scaledThickness, 'visible');
  generator.drawHatching(leftDiskX, diskTop, wallWidth, scaledThickness, 45, 3);

  // Right disk wall (solid material)
  generator.drawRectangle(centerX + scaledInnerR, diskTop, wallWidth, scaledThickness, 'visible');
  generator.drawHatching(centerX + scaledInnerR, diskTop, wallWidth, scaledThickness, 45, 3);

  // Center bore (empty)
  generator.drawRectangle(centerX - scaledInnerR, diskTop, scaledInnerR * 2, scaledThickness, 'visible');

  // Draw blade profiles on both sides (extending beyond disk)
  const bladeWidth = (scaledBladeR - scaledDiskR);
  const bladeThickness = scaledThickness * 0.15; // Blades are thin

  // Left blades (shown as a simplified envelope)
  generator.drawRectangle(centerX - scaledBladeR, centerY - bladeThickness/2, bladeWidth, bladeThickness, 'visible');

  // Right blades
  generator.drawRectangle(centerX + scaledDiskR, centerY - bladeThickness/2, bladeWidth, bladeThickness, 'visible');

  // Connect blade to disk (fillet representation)
  generator.drawLine(centerX - scaledDiskR, diskTop, centerX - scaledBladeR, centerY - bladeThickness/2, 'visible');
  generator.drawLine(centerX - scaledDiskR, diskBottom, centerX - scaledBladeR, centerY + bladeThickness/2, 'visible');
  generator.drawLine(centerX + scaledDiskR, diskTop, centerX + scaledBladeR, centerY - bladeThickness/2, 'visible');
  generator.drawLine(centerX + scaledDiskR, diskBottom, centerX + scaledBladeR, centerY + bladeThickness/2, 'visible');

  // Outline of blade envelope
  generator.drawLine(centerX - scaledBladeR, centerY - bladeThickness/2, centerX - scaledBladeR, centerY + bladeThickness/2, 'visible');
  generator.drawLine(centerX + scaledBladeR, centerY - bladeThickness/2, centerX + scaledBladeR, centerY + bladeThickness/2, 'visible');

  // Centerline
  generator.drawLine(centerX, diskTop - 30, centerX, diskBottom + 30, 'center');

  // Dimensions
  // Overall diameter with blades
  generator.drawDimension(
    centerX - scaledBladeR,
    diskBottom + 35,
    centerX + scaledBladeR,
    diskBottom + 35,
    `Ø${bladeEnvelopeDiameter.toFixed(0)}mm`,
    5
  );

  // Disk thickness
  generator.drawDimension(
    centerX + scaledBladeR + 25,
    diskTop,
    centerX + scaledBladeR + 25,
    diskBottom,
    `t=${thickness}mm`,
    5
  );

  // Wall thickness
  const wallThickness = (diskDiameter - innerDiameter) / 2;
  generator.drawDimension(
    leftDiskX,
    diskTop - 25,
    centerX - scaledInnerR,
    diskTop - 25,
    `w=${wallThickness.toFixed(1)}mm`,
    5
  );

  // Zone labels
  generator.drawText(centerX - scaledBladeR - 20, centerY, 'BLADE', 7, '#666666');
  generator.drawText(centerX - (scaledDiskR + scaledInnerR) / 2, centerY, 'DISK', 7, '#666666');
  generator.drawText(centerX, centerY, 'BORE', 7, '#666666');
}
