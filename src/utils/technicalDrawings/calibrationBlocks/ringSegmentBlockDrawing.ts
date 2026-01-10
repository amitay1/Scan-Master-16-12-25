/**
 * Ring Segment Block Drawing Module
 *
 * Paper.js-based drawing utilities for generating technical drawings
 * of ring segment calibration blocks, including:
 * - Top view (arc segment with holes)
 * - Section views (A-A, B-B cross-sections)
 * - Dimension annotations
 * - Hole table
 * - Title block
 *
 * Uses the existing TechnicalDrawingGenerator infrastructure
 * with extended arc drawing capabilities.
 */

import paper from 'paper';
import type { TechnicalDrawingGenerator } from '../TechnicalDrawingGenerator';
import type {
  ResolvedRingSegmentBlock,
  ResolvedHole,
  RingSegmentGeometry,
  CalculatedGeometry,
} from '@/types/ringSegmentBlock.types';
import {
  polarToCartesian,
  degreesToRadians,
  generateArcPath,
  generateArcSegmentPath,
} from '@/utils/ringSegmentBlock/geometry';

// ============================================================================
// DRAWING CONFIGURATION
// ============================================================================

export interface RingSegmentDrawingConfig {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Padding from edges in pixels */
  padding: number;
  /** Scale factor (pixels per mm) */
  scale: number;
  /** Line widths for different line types */
  lineWidths: {
    visible: number;
    hidden: number;
    center: number;
    dimension: number;
    thin: number;
  };
  /** Colors */
  colors: {
    outline: string;
    hidden: string;
    centerline: string;
    dimension: string;
    holeLabel: string;
    hatching: string;
    text: string;
  };
  /** Font sizes */
  fontSizes: {
    title: number;
    viewLabel: number;
    dimension: number;
    holeLabel: number;
    tableHeader: number;
    tableCell: number;
  };
}

export const DEFAULT_DRAWING_CONFIG: RingSegmentDrawingConfig = {
  width: 1200,
  height: 900,
  padding: 40,
  scale: 1,
  lineWidths: {
    visible: 0.7,
    hidden: 0.5,
    center: 0.35,
    dimension: 0.35,
    thin: 0.25,
  },
  colors: {
    outline: '#000000',
    hidden: '#666666',
    centerline: '#000000',
    dimension: '#000000',
    holeLabel: '#CC0000',
    hatching: '#666666',
    text: '#000000',
  },
  fontSizes: {
    title: 16,
    viewLabel: 14,
    dimension: 10,
    holeLabel: 12,
    tableHeader: 11,
    tableCell: 10,
  },
};

// ============================================================================
// ARC DRAWING FUNCTIONS (Paper.js)
// ============================================================================

/**
 * Draw an arc segment outline using Paper.js
 *
 * @param scope - Paper.js scope
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param innerRadius - Inner arc radius (pixels)
 * @param outerRadius - Outer arc radius (pixels)
 * @param startAngleDeg - Start angle in degrees
 * @param endAngleDeg - End angle in degrees
 * @param config - Drawing configuration
 */
export function drawArcSegmentOutline(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): paper.Path {
  const path = new scope.Path();
  path.strokeColor = new scope.Color(config.colors.outline);
  path.strokeWidth = config.lineWidths.visible;
  path.fillColor = null;

  // Generate points for outer arc
  const numPoints = 50;
  const angleStep = (endAngleDeg - startAngleDeg) / (numPoints - 1);

  // Outer arc (start to end)
  for (let i = 0; i < numPoints; i++) {
    const angle = startAngleDeg + i * angleStep;
    const pt = polarToCartesian(centerX, centerY, outerRadius, angle);
    path.add(new scope.Point(pt.x, pt.y));
  }

  // Line from outer end to inner end
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngleDeg);
  path.add(new scope.Point(innerEnd.x, innerEnd.y));

  // Inner arc (end to start)
  for (let i = numPoints - 1; i >= 0; i--) {
    const angle = startAngleDeg + i * angleStep;
    const pt = polarToCartesian(centerX, centerY, innerRadius, angle);
    path.add(new scope.Point(pt.x, pt.y));
  }

  // Line from inner start to outer start (closes the path)
  path.closed = true;

  return path;
}

/**
 * Draw centerlines through the arc segment
 */
export function drawArcCenterlines(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): paper.Group {
  const group = new scope.Group();
  const midAngle = (startAngleDeg + endAngleDeg) / 2;

  // Radial centerline (from center through mid-angle)
  const innerPt = polarToCartesian(centerX, centerY, 0, midAngle);
  const outerPt = polarToCartesian(centerX, centerY, outerRadius + 20, midAngle);

  const radialLine = new scope.Path.Line(
    new scope.Point(innerPt.x, innerPt.y),
    new scope.Point(outerPt.x, outerPt.y)
  );
  radialLine.strokeColor = new scope.Color(config.colors.centerline);
  radialLine.strokeWidth = config.lineWidths.center;
  radialLine.dashArray = [12, 3, 2, 3];
  group.addChild(radialLine);

  return group;
}

/**
 * Draw a hole circle on the arc with label
 */
export function drawHoleOnArc(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  hole: ResolvedHole,
  geometry: RingSegmentGeometry,
  calc: CalculatedGeometry,
  scale: number,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): paper.Group {
  const group = new scope.Group();

  // Calculate hole position on mean radius
  const radius = calc.meanRadiusMm * scale;
  const holePt = polarToCartesian(centerX, centerY, radius, hole.angleOnArcDeg);

  // Draw hole circle
  const holeRadius = (hole.diameterMm / 2) * scale;
  const holeCircle = new scope.Path.Circle(
    new scope.Point(holePt.x, holePt.y),
    Math.max(holeRadius, 3) // Minimum visible size
  );
  holeCircle.strokeColor = new scope.Color(config.colors.outline);
  holeCircle.strokeWidth = config.lineWidths.visible;
  holeCircle.fillColor = new scope.Color('#ffffff');
  group.addChild(holeCircle);

  // Draw hole label (offset from hole)
  const labelRadius = radius + 25;
  const labelPt = polarToCartesian(centerX, centerY, labelRadius, hole.angleOnArcDeg);

  const label = new scope.PointText(new scope.Point(labelPt.x, labelPt.y));
  label.content = hole.label;
  label.fillColor = new scope.Color(config.colors.holeLabel);
  label.fontSize = config.fontSizes.holeLabel;
  label.fontWeight = 'bold';
  label.justification = 'center';
  group.addChild(label);

  // Draw leader line from label to hole
  const leaderLine = new scope.Path.Line(
    new scope.Point(holePt.x, holePt.y),
    new scope.Point(labelPt.x, labelPt.y)
  );
  leaderLine.strokeColor = new scope.Color(config.colors.dimension);
  leaderLine.strokeWidth = config.lineWidths.thin;
  group.addChild(leaderLine);

  return group;
}

/**
 * Draw angle dimension arc with arrows
 */
export function drawAngleDimension(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  label: string,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): paper.Group {
  const group = new scope.Group();

  // Draw arc for dimension
  const dimPath = new scope.Path();
  dimPath.strokeColor = new scope.Color(config.colors.dimension);
  dimPath.strokeWidth = config.lineWidths.dimension;

  const numPoints = 30;
  const angleStep = (endAngleDeg - startAngleDeg) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngleDeg + i * angleStep;
    const pt = polarToCartesian(centerX, centerY, radius, angle);
    dimPath.add(new scope.Point(pt.x, pt.y));
  }
  group.addChild(dimPath);

  // Draw arrows at both ends
  const arrowSize = 8;
  drawDimensionArrow(scope, group, centerX, centerY, radius, startAngleDeg, true, arrowSize, config);
  drawDimensionArrow(scope, group, centerX, centerY, radius, endAngleDeg, false, arrowSize, config);

  // Draw label at mid-angle
  const midAngle = (startAngleDeg + endAngleDeg) / 2;
  const labelPt = polarToCartesian(centerX, centerY, radius + 15, midAngle);

  const text = new scope.PointText(new scope.Point(labelPt.x, labelPt.y));
  text.content = label;
  text.fillColor = new scope.Color(config.colors.dimension);
  text.fontSize = config.fontSizes.dimension;
  text.fontWeight = 'bold';
  text.justification = 'center';
  group.addChild(text);

  return group;
}

/**
 * Draw dimension arrow at angle position
 */
function drawDimensionArrow(
  scope: paper.PaperScope,
  group: paper.Group,
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
  atStart: boolean,
  size: number,
  config: RingSegmentDrawingConfig
): void {
  const pt = polarToCartesian(centerX, centerY, radius, angleDeg);

  // Calculate tangent direction
  const tangentAngle = angleDeg + (atStart ? 90 : -90);
  const tangentRad = degreesToRadians(tangentAngle - 90);

  const arrow = new scope.Path();
  arrow.add(new scope.Point(pt.x, pt.y));
  arrow.add(
    new scope.Point(
      pt.x - size * Math.cos(tangentRad - Math.PI / 6),
      pt.y - size * Math.sin(tangentRad - Math.PI / 6)
    )
  );
  arrow.add(
    new scope.Point(
      pt.x - size * Math.cos(tangentRad + Math.PI / 6),
      pt.y - size * Math.sin(tangentRad + Math.PI / 6)
    )
  );
  arrow.closed = true;
  arrow.fillColor = new scope.Color(config.colors.dimension);
  group.addChild(arrow);
}

/**
 * Draw radial dimension line (OD or ID)
 */
export function drawRadialDimension(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
  label: string,
  offset: number = 30,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): paper.Group {
  const group = new scope.Group();

  // Draw extension lines
  const startPt = polarToCartesian(centerX, centerY, radius, angleDeg);
  const endPt = polarToCartesian(centerX, centerY, radius + offset, angleDeg);

  const extLine = new scope.Path.Line(
    new scope.Point(startPt.x, startPt.y),
    new scope.Point(endPt.x, endPt.y)
  );
  extLine.strokeColor = new scope.Color(config.colors.dimension);
  extLine.strokeWidth = config.lineWidths.dimension;
  group.addChild(extLine);

  // Draw label
  const labelPt = polarToCartesian(centerX, centerY, radius + offset + 15, angleDeg);
  const text = new scope.PointText(new scope.Point(labelPt.x, labelPt.y));
  text.content = label;
  text.fillColor = new scope.Color(config.colors.dimension);
  text.fontSize = config.fontSizes.dimension;
  text.fontWeight = 'bold';
  text.justification = 'center';
  group.addChild(text);

  return group;
}

// ============================================================================
// SECTION VIEW DRAWING
// ============================================================================

/**
 * Draw section view (radial-axial cross-section)
 *
 * Shows wall thickness with hatching and hole depths
 */
export function drawSectionView(
  generator: TechnicalDrawingGenerator,
  block: ResolvedRingSegmentBlock,
  originX: number,
  originY: number,
  scale: number,
  viewLabel: string = 'SECTION A-A',
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): void {
  const { geometry, calculatedGeometry, holes } = block;
  const scope = generator.getScope();

  // Section dimensions
  const wallWidth = calculatedGeometry.wallThicknessMm * scale;
  const axialHeight = geometry.axialWidthMm * scale;

  // Draw view label
  generator.drawViewLabel(originX + wallWidth / 2, originY - 20, viewLabel);

  // Draw outer rectangle (wall section)
  generator.drawRectangle(originX, originY, wallWidth, axialHeight, 'visible');

  // Draw hatching
  generator.drawHatching(originX, originY, wallWidth, axialHeight, 45, 4);

  // Draw centerline (vertical through middle)
  generator.drawLine(
    originX + wallWidth / 2,
    originY - 15,
    originX + wallWidth / 2,
    originY + axialHeight + 15,
    'center'
  );

  // Draw holes as circles/semicircles on section
  for (const hole of holes) {
    const holeX = originX + hole.depthMm * scale;
    const holeY = originY + hole.axialPositionMm * scale;
    const holeRadius = (hole.diameterMm / 2) * scale;

    // Draw hole circle
    const holeCircle = new scope.Path.Circle(
      new scope.Point(holeX, holeY),
      Math.max(holeRadius, 2)
    );
    holeCircle.strokeColor = new scope.Color(config.colors.outline);
    holeCircle.strokeWidth = config.lineWidths.visible;
    holeCircle.fillColor = new scope.Color('#ffffff');

    // Draw hole label
    const labelText = new scope.PointText(new scope.Point(holeX + holeRadius + 10, holeY + 4));
    labelText.content = hole.label;
    labelText.fillColor = new scope.Color(config.colors.holeLabel);
    labelText.fontSize = config.fontSizes.holeLabel;
    labelText.fontWeight = 'bold';
  }

  // Draw dimensions
  // Wall thickness dimension
  generator.drawDimension(
    originX,
    originY + axialHeight + 30,
    originX + wallWidth,
    originY + axialHeight + 30,
    `${calculatedGeometry.wallThicknessMm.toFixed(1)}`,
    5
  );

  // Axial width dimension
  generator.drawDimension(
    originX + wallWidth + 30,
    originY,
    originX + wallWidth + 30,
    originY + axialHeight,
    `${geometry.axialWidthMm}`,
    5
  );
}

// ============================================================================
// HOLE TABLE DRAWING
// ============================================================================

/**
 * Draw hole specification table
 */
export function drawHoleTable(
  generator: TechnicalDrawingGenerator,
  block: ResolvedRingSegmentBlock,
  originX: number,
  originY: number,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): void {
  const scope = generator.getScope();
  const { holes } = block;

  // Table dimensions
  const colWidths = [40, 50, 60, 60, 70, 70, 100]; // ID, Type, Dia, Depth, Angle, Axial, Definition
  const rowHeight = 20;
  const headerHeight = 25;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  // Draw table outline
  const totalHeight = headerHeight + holes.length * rowHeight;
  generator.drawRectangle(originX, originY, totalWidth, totalHeight, 'visible');

  // Draw header row
  generator.drawLine(originX, originY + headerHeight, originX + totalWidth, originY + headerHeight, 'visible');

  // Draw column separators
  let x = originX;
  for (let i = 0; i < colWidths.length - 1; i++) {
    x += colWidths[i];
    generator.drawLine(x, originY, x, originY + totalHeight, 'visible');
  }

  // Draw row separators
  for (let i = 1; i < holes.length; i++) {
    const y = originY + headerHeight + i * rowHeight;
    generator.drawLine(originX, y, originX + totalWidth, y, 'visible');
  }

  // Draw header text
  const headers = ['ID', 'Type', 'Dia (mm)', 'Depth (mm)', 'Angle (°)', 'Axial (mm)', 'Definition'];
  x = originX;
  for (let i = 0; i < headers.length; i++) {
    const text = new scope.PointText(new scope.Point(x + colWidths[i] / 2, originY + headerHeight / 2 + 4));
    text.content = headers[i];
    text.fillColor = new scope.Color(config.colors.text);
    text.fontSize = config.fontSizes.tableHeader;
    text.fontWeight = 'bold';
    text.justification = 'center';
    x += colWidths[i];
  }

  // Draw hole data rows
  for (let row = 0; row < holes.length; row++) {
    const hole = holes[row];
    const y = originY + headerHeight + row * rowHeight + rowHeight / 2 + 4;

    const values = [
      hole.label,
      hole.reflectorType,
      hole.diameterMm.toFixed(2),
      hole.depthMm.toFixed(1),
      hole.angleOnArcDeg.toFixed(1),
      hole.axialPositionMm.toFixed(1),
      hole.depthDefinition === 'radial_depth' ? 'Radial' : 'Drill Axis',
    ];

    x = originX;
    for (let col = 0; col < values.length; col++) {
      const text = new scope.PointText(new scope.Point(x + colWidths[col] / 2, y));
      text.content = values[col];
      text.fillColor = new scope.Color(config.colors.text);
      text.fontSize = config.fontSizes.tableCell;
      text.justification = 'center';
      x += colWidths[col];
    }
  }
}

// ============================================================================
// TITLE BLOCK DRAWING
// ============================================================================

/**
 * Draw title block
 */
export function drawTitleBlock(
  generator: TechnicalDrawingGenerator,
  block: ResolvedRingSegmentBlock,
  originX: number,
  originY: number,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): void {
  const scope = generator.getScope();
  const width = 200;
  const height = 80;

  // Draw border
  generator.drawRectangle(originX, originY, width, height, 'visible');

  // Draw dividers
  generator.drawLine(originX, originY + 25, originX + width, originY + 25, 'visible');
  generator.drawLine(originX, originY + 50, originX + width, originY + 50, 'visible');
  generator.drawLine(originX + width / 2, originY + 25, originX + width / 2, originY + 50, 'visible');

  // Title
  const title = new scope.PointText(new scope.Point(originX + width / 2, originY + 16));
  title.content = 'SCAN MASTER';
  title.fillColor = new scope.Color(config.colors.text);
  title.fontSize = config.fontSizes.title;
  title.fontWeight = 'bold';
  title.justification = 'center';

  // Block name
  const blockName = new scope.PointText(new scope.Point(originX + width / 4, originY + 40));
  blockName.content = block.templateName;
  blockName.fillColor = new scope.Color(config.colors.text);
  blockName.fontSize = config.fontSizes.tableCell;
  blockName.justification = 'center';

  // Standard reference
  const standard = new scope.PointText(new scope.Point(originX + (3 * width) / 4, originY + 40));
  standard.content = block.standardReference;
  standard.fillColor = new scope.Color(config.colors.text);
  standard.fontSize = config.fontSizes.tableCell;
  standard.justification = 'center';

  // Dimensions summary
  const dimText = `OD=${block.geometry.outerDiameterMm}mm  ID=${block.geometry.innerDiameterMm}mm  ${block.geometry.segmentAngleDeg}°`;
  const dims = new scope.PointText(new scope.Point(originX + width / 2, originY + 68));
  dims.content = dimText;
  dims.fillColor = new scope.Color(config.colors.text);
  dims.fontSize = config.fontSizes.tableCell;
  dims.justification = 'center';
}

// ============================================================================
// COMPLETE DRAWING FUNCTION
// ============================================================================

/**
 * Draw complete ring segment block technical drawing
 *
 * This is the main entry point for rendering a resolved block
 */
export function drawRingSegmentBlock(
  generator: TechnicalDrawingGenerator,
  block: ResolvedRingSegmentBlock,
  config: RingSegmentDrawingConfig = DEFAULT_DRAWING_CONFIG
): void {
  const scope = generator.getScope();
  const { geometry, calculatedGeometry, holes } = block;

  // Clear any existing content
  generator.clear();

  // Calculate layout regions
  const topViewRegion = {
    x: config.padding,
    y: config.padding,
    width: (config.width - config.padding * 3) / 2,
    height: (config.height - config.padding * 3) / 2,
  };

  const sectionViewRegion = {
    x: topViewRegion.x + topViewRegion.width + config.padding,
    y: config.padding,
    width: (config.width - config.padding * 3) / 2,
    height: (config.height - config.padding * 3) / 2,
  };

  const tableRegion = {
    x: config.padding,
    y: topViewRegion.y + topViewRegion.height + config.padding,
    width: config.width - config.padding * 2 - 220,
    height: 150,
  };

  const titleBlockRegion = {
    x: config.width - config.padding - 200,
    y: config.height - config.padding - 80,
    width: 200,
    height: 80,
  };

  // Calculate scale for top view
  const topViewScale = Math.min(
    (topViewRegion.width - 80) / geometry.outerDiameterMm,
    (topViewRegion.height - 80) / geometry.outerDiameterMm
  );

  const topViewCenterX = topViewRegion.x + topViewRegion.width / 2;
  const topViewCenterY = topViewRegion.y + topViewRegion.height / 2;

  // Draw top view label
  generator.drawViewLabel(topViewCenterX, topViewRegion.y + 15, 'TOP VIEW');

  // Draw arc segment outline
  const innerRadius = calculatedGeometry.innerRadiusMm * topViewScale;
  const outerRadius = calculatedGeometry.outerRadiusMm * topViewScale;

  drawArcSegmentOutline(
    scope,
    topViewCenterX,
    topViewCenterY,
    innerRadius,
    outerRadius,
    0,
    geometry.segmentAngleDeg,
    config
  );

  // Draw centerlines
  drawArcCenterlines(
    scope,
    topViewCenterX,
    topViewCenterY,
    outerRadius,
    0,
    geometry.segmentAngleDeg,
    config
  );

  // Draw holes on arc
  for (const hole of holes) {
    drawHoleOnArc(
      scope,
      topViewCenterX,
      topViewCenterY,
      hole,
      geometry,
      calculatedGeometry,
      topViewScale,
      config
    );
  }

  // Draw angle dimension
  drawAngleDimension(
    scope,
    topViewCenterX,
    topViewCenterY,
    outerRadius + 40,
    0,
    geometry.segmentAngleDeg,
    `${geometry.segmentAngleDeg}°`,
    config
  );

  // Draw OD/ID dimensions
  drawRadialDimension(
    scope,
    topViewCenterX,
    topViewCenterY,
    outerRadius,
    geometry.segmentAngleDeg / 2 + 30,
    `OD=${geometry.outerDiameterMm}`,
    20,
    config
  );

  drawRadialDimension(
    scope,
    topViewCenterX,
    topViewCenterY,
    innerRadius,
    geometry.segmentAngleDeg / 2 - 30,
    `ID=${geometry.innerDiameterMm}`,
    -30,
    config
  );

  // Calculate scale for section view
  const sectionScale = Math.min(
    (sectionViewRegion.width - 80) / calculatedGeometry.wallThicknessMm,
    (sectionViewRegion.height - 80) / geometry.axialWidthMm
  );

  // Draw section view
  drawSectionView(
    generator,
    block,
    sectionViewRegion.x + 40,
    sectionViewRegion.y + 40,
    sectionScale,
    'SECTION A-A',
    config
  );

  // Draw hole table
  drawHoleTable(generator, block, tableRegion.x, tableRegion.y, config);

  // Draw title block
  drawTitleBlock(generator, block, titleBlockRegion.x, titleBlockRegion.y, config);

  // Render
  generator.render();
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export drawing to SVG string
 */
export function exportToSVG(generator: TechnicalDrawingGenerator): string {
  return generator.exportToSVG();
}
