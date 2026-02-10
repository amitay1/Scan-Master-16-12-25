/**
 * Arc Geometry Calculations for Ring Segment Calibration Blocks
 *
 * Provides utility functions for calculating positions, angles, and
 * projections for ring segment calibration blocks.
 *
 * Coordinate System Convention:
 * - X: Radial direction (positive outward from center)
 * - Y: Axial direction (along cylinder axis)
 * - Z: Tangential direction (CCW positive when viewed from +Y)
 *
 * Angle Convention:
 * - 0° is the starting cut face of the segment
 * - Angles increase counter-clockwise (CCW) when viewed from +Z axis
 */

import type {
  RingSegmentGeometry,
  CalculatedGeometry,
  CurvedHolePosition,
  HoleFeature,
  ResolvedHole,
  AxialOrigin,
} from '@/types/ringSegmentBlock.types';

// ============================================================================
// BASIC GEOMETRY CALCULATIONS
// ============================================================================

/**
 * Calculate wall thickness from OD and ID
 */
export function calculateWallThickness(
  outerDiameterMm: number,
  innerDiameterMm: number
): number {
  return (outerDiameterMm - innerDiameterMm) / 2;
}

/**
 * Calculate mean radius (midpoint of wall)
 */
export function calculateMeanRadius(
  outerDiameterMm: number,
  innerDiameterMm: number
): number {
  return (outerDiameterMm / 2 + innerDiameterMm / 2) / 2;
}

/**
 * Calculate arc length at a given radius for a given angle
 * @param radiusMm - Radius in mm
 * @param angleDeg - Angle in degrees
 * @returns Arc length in mm
 */
export function calculateArcLength(radiusMm: number, angleDeg: number): number {
  const angleRad = degreesToRadians(angleDeg);
  return radiusMm * angleRad;
}

/**
 * Calculate angle from arc length and radius
 * @param radiusMm - Radius in mm
 * @param arcLengthMm - Arc length in mm
 * @returns Angle in degrees
 */
export function calculateAngleFromArcLength(
  radiusMm: number,
  arcLengthMm: number
): number {
  if (radiusMm <= 0) {
    return 0;
  }
  const angleRad = arcLengthMm / radiusMm;
  return radiansToDegrees(angleRad);
}

/**
 * Calculate all derived geometry values from base geometry
 */
export function calculateDerivedGeometry(
  geometry: RingSegmentGeometry
): CalculatedGeometry {
  const wallThicknessMm = calculateWallThickness(
    geometry.outerDiameterMm,
    geometry.innerDiameterMm
  );
  const outerRadiusMm = geometry.outerDiameterMm / 2;
  const innerRadiusMm = geometry.innerDiameterMm / 2;
  const meanRadiusMm = (outerRadiusMm + innerRadiusMm) / 2;
  const arcLengthMm = calculateArcLength(meanRadiusMm, geometry.segmentAngleDeg);

  return {
    wallThicknessMm,
    meanRadiusMm,
    outerRadiusMm,
    innerRadiusMm,
    arcLengthMm,
  };
}

// ============================================================================
// COORDINATE TRANSFORMATIONS
// ============================================================================

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert polar coordinates to Cartesian (for top view)
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Distance from center
 * @param angleDeg - Angle in degrees (0° = start cut face, CCW positive)
 * @returns Cartesian {x, y} coordinates
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  // Adjust angle: 0° at top (negative Y), increasing CCW
  // In SVG/Canvas: Y increases downward, so we negate
  const angleRad = degreesToRadians(angleDeg - 90);
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

/**
 * Convert Cartesian coordinates to polar
 */
export function cartesianToPolar(
  x: number,
  y: number,
  centerX: number,
  centerY: number
): { radius: number; angleDeg: number } {
  const dx = x - centerX;
  const dy = y - centerY;
  const radius = Math.sqrt(dx * dx + dy * dy);
  let angleDeg = radiansToDegrees(Math.atan2(dy, dx)) + 90;
  if (angleDeg < 0) angleDeg += 360;
  return { radius, angleDeg };
}

/**
 * Calculate 3D Cartesian coordinates for a hole position on the arc
 *
 * @param holePosition - Hole position on arc
 * @param geometry - Block geometry
 * @param holeFeature - Hole feature (for depth)
 * @returns 3D coordinates {x, y, z}
 */
export function calculateHole3DPosition(
  holePosition: CurvedHolePosition,
  geometry: RingSegmentGeometry,
  holeFeature: HoleFeature
): { x: number; y: number; z: number } {
  const calc = calculateDerivedGeometry(geometry);
  const angleRad = degreesToRadians(holePosition.angleOnArcDeg);

  // Hole is drilled from OD surface, at mean radius for SDH
  // For FBH, hole is typically at a specific depth from surface
  const holeRadiusMm = calc.outerRadiusMm - holeFeature.depthMm;

  return {
    x: holeRadiusMm * Math.cos(angleRad),
    y: holePosition.axialPositionMm,
    z: holeRadiusMm * Math.sin(angleRad),
  };
}

// ============================================================================
// VIEW PROJECTIONS
// ============================================================================

/**
 * Project a hole position to top view coordinates
 *
 * Top view shows the arc segment from above (along Y axis)
 * X-Z plane projection
 *
 * @param hole - Resolved hole with 3D position
 * @param geometry - Block geometry
 * @param viewConfig - View configuration (center, scale)
 */
export function projectToTopView(
  hole: ResolvedHole,
  geometry: RingSegmentGeometry,
  viewConfig: { centerX: number; centerY: number; scale: number }
): { x: number; y: number } {
  const calc = calculateDerivedGeometry(geometry);
  const angleRad = degreesToRadians(hole.angleOnArcDeg);

  // Position on mean radius for top view
  const radius = calc.meanRadiusMm * viewConfig.scale;

  // Project to 2D (X-Z plane, Z maps to Y in view)
  const x = viewConfig.centerX + radius * Math.sin(angleRad);
  const y = viewConfig.centerY - radius * Math.cos(angleRad);

  return { x, y };
}

/**
 * Project a hole position to section view coordinates (radial-axial section)
 *
 * Section view shows a cut through the arc at a specific angle
 * Shows wall thickness (radial) vs axial position
 *
 * @param hole - Resolved hole
 * @param geometry - Block geometry
 * @param viewConfig - View configuration
 */
export function projectToSectionView(
  hole: ResolvedHole,
  geometry: RingSegmentGeometry,
  viewConfig: { originX: number; originY: number; scale: number }
): { x: number; y: number } {
  const calc = calculateDerivedGeometry(geometry);

  // In section view:
  // X axis = radial direction (0 at ID, wallThickness at OD)
  // Y axis = axial direction (0 at left edge, axialWidth at right)

  // Hole radial position (distance from OD surface = depth)
  const radialPositionFromID = calc.wallThicknessMm - hole.depthMm;

  return {
    x: viewConfig.originX + radialPositionFromID * viewConfig.scale,
    y: viewConfig.originY + hole.axialPositionMm * viewConfig.scale,
  };
}

// ============================================================================
// HOLE POSITION UTILITIES
// ============================================================================

/**
 * Calculate axial position based on origin setting
 */
export function resolveAxialPosition(
  positionMm: number,
  axialWidthMm: number,
  origin: AxialOrigin
): number {
  switch (origin) {
    case 'left':
      return positionMm;
    case 'right':
      return axialWidthMm - positionMm;
    case 'center':
      return axialWidthMm / 2 + positionMm;
    default:
      return positionMm;
  }
}

/**
 * Calculate distance between two holes on arc (arc distance)
 */
export function calculateHoleArcDistance(
  hole1AngleDeg: number,
  hole2AngleDeg: number,
  radiusMm: number
): number {
  const angleDiff = Math.abs(hole2AngleDeg - hole1AngleDeg);
  return calculateArcLength(radiusMm, angleDiff);
}

/**
 * Calculate Euclidean distance between two holes in 3D
 */
export function calculateHole3DDistance(
  hole1: { x: number; y: number; z: number },
  hole2: { x: number; y: number; z: number }
): number {
  const dx = hole2.x - hole1.x;
  const dy = hole2.y - hole1.y;
  const dz = hole2.z - hole1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ============================================================================
// ARC DRAWING HELPERS
// ============================================================================

/**
 * Generate points along an arc for drawing
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Arc radius
 * @param startAngleDeg - Start angle in degrees
 * @param endAngleDeg - End angle in degrees
 * @param numPoints - Number of points to generate
 * @returns Array of {x, y} points
 */
export function generateArcPoints(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  numPoints: number = 50
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const angleStep = (endAngleDeg - startAngleDeg) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const angleDeg = startAngleDeg + i * angleStep;
    points.push(polarToCartesian(centerX, centerY, radius, angleDeg));
  }

  return points;
}

/**
 * Generate SVG arc path data
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Arc radius
 * @param startAngleDeg - Start angle in degrees
 * @param endAngleDeg - End angle in degrees
 * @returns SVG path d attribute
 */
export function generateArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, startAngleDeg);
  const end = polarToCartesian(centerX, centerY, radius, endAngleDeg);

  const angleDiff = endAngleDeg - startAngleDeg;
  const largeArcFlag = Math.abs(angleDiff) > 180 ? 1 : 0;
  const sweepFlag = angleDiff > 0 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

/**
 * Generate closed arc segment path (for filled shapes)
 * Creates a path from outer arc to inner arc forming a closed ring segment
 */
export function generateArcSegmentPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngleDeg);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngleDeg);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngleDeg);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngleDeg);

  const angleDiff = endAngleDeg - startAngleDeg;
  const largeArcFlag = Math.abs(angleDiff) > 180 ? 1 : 0;
  const sweepFlagOuter = angleDiff > 0 ? 1 : 0;
  const sweepFlagInner = angleDiff > 0 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} ${sweepFlagOuter} ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} ${sweepFlagInner} ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

// ============================================================================
// SCALE CALCULATIONS
// ============================================================================

/**
 * Calculate optimal scale to fit geometry within viewport
 */
export function calculateOptimalScale(
  geometry: RingSegmentGeometry,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 40
): number {
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;

  // For top view, the arc fits within OD x OD bounding box
  // But for arc segment, it's smaller depending on angle
  const boundingWidth = geometry.outerDiameterMm;
  const boundingHeight = geometry.outerDiameterMm;

  const scaleX = availableWidth / boundingWidth;
  const scaleY = availableHeight / boundingHeight;

  return Math.min(scaleX, scaleY);
}

/**
 * Calculate bounding box for arc segment
 */
export function calculateArcBoundingBox(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  // Generate points along arc and find extremes
  const points = generateArcPoints(centerX, centerY, radius, startAngleDeg, endAngleDeg, 100);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
