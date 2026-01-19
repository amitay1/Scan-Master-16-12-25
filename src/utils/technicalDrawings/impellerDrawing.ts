/**
 * Impeller Technical Drawing Module
 * Generates 2-view technical drawings for impeller parts
 * Shows stepped disk profile with hub, web, and rim sections
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawImpellerTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  // Ensure valid dimensions
  const outerDiameter = Math.max(dimensions.diameter || dimensions.outerDiameter || 200, 1);
  const thickness = Math.max(dimensions.thickness || dimensions.length || 60, 1);

  // Impeller has 3 zones: hub (center), web (middle), rim (outer)
  // Hub: small radius, tall | Web: medium radius, medium height | Rim: large radius, short
  const hubDiameter = outerDiameter * 0.3;   // Hub is 30% of OD
  const webDiameter = outerDiameter * 0.6;   // Web is 60% of OD
  const rimDiameter = outerDiameter;         // Rim is full OD

  const hubHeight = thickness;               // Hub is full height
  const webHeight = thickness * 0.6;         // Web is 60% height
  const rimHeight = thickness * 0.3;         // Rim is 30% height

  // Inner bore if provided
  const innerDiameter = dimensions.innerDiameter || hubDiameter * 0.4;

  // FRONT VIEW (Concentric circles showing zones)
  drawFrontView(generator, outerDiameter, hubDiameter, webDiameter, innerDiameter, layout.frontView);

  // SIDE VIEW (Stepped profile cross-section)
  drawSideView(generator, hubDiameter, webDiameter, rimDiameter, hubHeight, webHeight, rimHeight, innerDiameter, layout.sideView);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  outerDiameter: number,
  hubDiameter: number,
  webDiameter: number,
  innerDiameter: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');

  // Scale to fit
  const scale = Math.min(width, height) * 0.55 / outerDiameter;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Draw concentric circles for each zone
  const scaledOuterRadius = (outerDiameter * scale) / 2;
  const scaledWebRadius = (webDiameter * scale) / 2;
  const scaledHubRadius = (hubDiameter * scale) / 2;
  const scaledInnerRadius = (innerDiameter * scale) / 2;

  // Rim (outer circle)
  generator.drawCircle(centerX, centerY, scaledOuterRadius, 'visible');

  // Web zone boundary (dashed to show internal feature)
  generator.drawCircle(centerX, centerY, scaledWebRadius, 'hidden');

  // Hub zone boundary
  generator.drawCircle(centerX, centerY, scaledHubRadius, 'visible');

  // Center bore
  generator.drawCircle(centerX, centerY, scaledInnerRadius, 'visible');

  // Centerlines
  generator.drawLine(
    centerX - scaledOuterRadius - 25,
    centerY,
    centerX + scaledOuterRadius + 25,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    centerY - scaledOuterRadius - 25,
    centerX,
    centerY + scaledOuterRadius + 25,
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

  // Dimensions
  generator.drawDimension(
    centerX - scaledOuterRadius,
    centerY + scaledOuterRadius + 35,
    centerX + scaledOuterRadius,
    centerY + scaledOuterRadius + 35,
    `Ø${outerDiameter}mm (RIM)`,
    5
  );

  generator.drawDimension(
    centerX - scaledHubRadius,
    centerY - scaledOuterRadius - 35,
    centerX + scaledHubRadius,
    centerY - scaledOuterRadius - 35,
    `Ø${hubDiameter.toFixed(0)}mm (HUB)`,
    5
  );

  // Zone labels
  generator.drawText(centerX, centerY - 5, 'IMPELLER', 11, '#E74C3C');
  generator.drawText(centerX, centerY + 10, '(STEPPED PROFILE)', 8, '#666666');
}

function drawSideView(
  generator: TechnicalDrawingGenerator,
  hubDiameter: number,
  webDiameter: number,
  rimDiameter: number,
  hubHeight: number,
  webHeight: number,
  rimHeight: number,
  innerDiameter: number,
  viewConfig?: { x: number; y: number; width: number; height: number }
) {
  if (!viewConfig) return;
  const { x, y, width, height } = viewConfig;

  // View label
  generator.drawViewLabel(x + width / 2, y, 'SECTION A-A');

  // Scale to fit
  const maxWidth = rimDiameter;
  const maxHeight = hubHeight;
  const scale = Math.min((width * 0.6) / maxWidth, (height * 0.6) / maxHeight);

  const centerX = x + width / 2;
  const bottomY = y + height / 2 + (maxHeight * scale) / 2;

  // Scaled dimensions
  const sHubR = (hubDiameter * scale) / 2;
  const sWebR = (webDiameter * scale) / 2;
  const sRimR = (rimDiameter * scale) / 2;
  const sInnerR = (innerDiameter * scale) / 2;

  const sHubH = Math.max(hubHeight * scale, 15);
  const sWebH = Math.max(webHeight * scale, 10);
  const sRimH = Math.max(rimHeight * scale, 6);

  // Draw stepped profile (left half - solid material with hatching)
  // The profile is symmetric, so we draw both sides

  // Hub section (center, tallest)
  const hubLeft = centerX - sHubR;
  const hubRight = centerX + sHubR;
  const hubTop = bottomY - sHubH;

  // Draw hub walls (excluding bore)
  // Left hub wall
  generator.drawRectangle(hubLeft, hubTop, sHubR - sInnerR, sHubH, 'visible');
  generator.drawHatching(hubLeft, hubTop, sHubR - sInnerR, sHubH, 45, 3);

  // Right hub wall
  generator.drawRectangle(centerX + sInnerR, hubTop, sHubR - sInnerR, sHubH, 'visible');
  generator.drawHatching(centerX + sInnerR, hubTop, sHubR - sInnerR, sHubH, 45, 3);

  // Center bore (empty)
  generator.drawRectangle(centerX - sInnerR, hubTop, sInnerR * 2, sHubH, 'visible');

  // Web section (intermediate height)
  const webTop = bottomY - sWebH;

  // Left web extension
  generator.drawRectangle(centerX - sWebR, webTop, sWebR - sHubR, sWebH, 'visible');
  generator.drawHatching(centerX - sWebR, webTop, sWebR - sHubR, sWebH, 45, 3);

  // Right web extension
  generator.drawRectangle(hubRight, webTop, sWebR - sHubR, sWebH, 'visible');
  generator.drawHatching(hubRight, webTop, sWebR - sHubR, sWebH, 45, 3);

  // Rim section (outer, shortest)
  const rimTop = bottomY - sRimH;

  // Left rim
  generator.drawRectangle(centerX - sRimR, rimTop, sRimR - sWebR, sRimH, 'visible');
  generator.drawHatching(centerX - sRimR, rimTop, sRimR - sWebR, sRimH, 45, 3);

  // Right rim
  generator.drawRectangle(centerX + sWebR, rimTop, sRimR - sWebR, sRimH, 'visible');
  generator.drawHatching(centerX + sWebR, rimTop, sRimR - sWebR, sRimH, 45, 3);

  // Draw step outlines (connecting lines)
  // Left side profile
  generator.drawLine(centerX - sRimR, rimTop, centerX - sRimR, bottomY, 'visible');
  generator.drawLine(centerX - sRimR, rimTop, centerX - sWebR, rimTop, 'visible');
  generator.drawLine(centerX - sWebR, rimTop, centerX - sWebR, webTop, 'visible');
  generator.drawLine(centerX - sWebR, webTop, centerX - sHubR, webTop, 'visible');
  generator.drawLine(centerX - sHubR, webTop, centerX - sHubR, hubTop, 'visible');
  generator.drawLine(centerX - sHubR, hubTop, centerX - sInnerR, hubTop, 'visible');

  // Right side profile
  generator.drawLine(centerX + sRimR, rimTop, centerX + sRimR, bottomY, 'visible');
  generator.drawLine(centerX + sRimR, rimTop, centerX + sWebR, rimTop, 'visible');
  generator.drawLine(centerX + sWebR, rimTop, centerX + sWebR, webTop, 'visible');
  generator.drawLine(centerX + sWebR, webTop, centerX + sHubR, webTop, 'visible');
  generator.drawLine(centerX + sHubR, webTop, centerX + sHubR, hubTop, 'visible');
  generator.drawLine(centerX + sHubR, hubTop, centerX + sInnerR, hubTop, 'visible');

  // Bottom line
  generator.drawLine(centerX - sRimR, bottomY, centerX + sRimR, bottomY, 'visible');

  // Centerline
  generator.drawLine(centerX, hubTop - 25, centerX, bottomY + 25, 'center');

  // Dimensions
  // Overall diameter
  generator.drawDimension(
    centerX - sRimR,
    bottomY + 30,
    centerX + sRimR,
    bottomY + 30,
    `Ø${rimDiameter}mm`,
    5
  );

  // Hub height (total)
  generator.drawDimension(
    centerX + sRimR + 25,
    hubTop,
    centerX + sRimR + 25,
    bottomY,
    `H=${hubHeight.toFixed(1)}mm`,
    5
  );

  // Zone labels
  generator.drawText(centerX - sRimR + 15, rimTop + sRimH/2, 'RIM', 8, '#666666');
  generator.drawText(centerX - sWebR + 20, webTop + sWebH/2 - 3, 'WEB', 8, '#666666');
  generator.drawText(centerX - sHubR + 10, hubTop + sHubH/2, 'HUB', 8, '#666666');
}
