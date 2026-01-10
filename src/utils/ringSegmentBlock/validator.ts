/**
 * Ring Segment Block Validator
 *
 * Provides validation functions for ring segment calibration blocks:
 * - Geometry validation (OD > ID, valid angles, etc.)
 * - Hole position validation (within margins, proper spacing)
 * - Thin-wall policy enforcement (depth adjustments, fallback depths)
 */

import type {
  RingSegmentGeometry,
  CurvedHolePosition,
  HoleFeature,
  ValidationWarning,
  GeometryValidationResult,
  HoleValidationResult,
  ThinWallPolicy,
  ThinWallPolicyResult,
  StandardFamily,
  DEFAULT_THIN_WALL_POLICY,
} from '@/types/ringSegmentBlock.types';

import {
  calculateWallThickness,
  calculateArcLength,
  calculateMeanRadius,
  calculateHoleArcDistance,
  calculateDerivedGeometry,
} from './geometry';

// ============================================================================
// GEOMETRY VALIDATION
// ============================================================================

/**
 * Validate ring segment geometry
 *
 * Checks:
 * - OD > ID
 * - Segment angle between 30° and 180°
 * - Axial width > 0
 * - Valid margins and spacing values
 */
export function validateGeometry(
  geometry: RingSegmentGeometry
): GeometryValidationResult {
  const errors: ValidationWarning[] = [];

  // Check OD > ID
  if (geometry.outerDiameterMm <= geometry.innerDiameterMm) {
    errors.push({
      level: 'error',
      code: 'GEOMETRY_INVALID_OD_ID',
      message: `Outer diameter (${geometry.outerDiameterMm}mm) must be greater than inner diameter (${geometry.innerDiameterMm}mm)`,
      suggestion: 'Increase OD or decrease ID to create valid wall thickness',
    });
  }

  // Check segment angle range
  if (geometry.segmentAngleDeg < 30 || geometry.segmentAngleDeg > 180) {
    errors.push({
      level: 'error',
      code: 'GEOMETRY_INVALID_ANGLE',
      message: `Segment angle (${geometry.segmentAngleDeg}°) must be between 30° and 180°`,
      suggestion: 'Use an angle between 30° and 180° for a valid arc segment',
    });
  }

  // Check axial width
  if (geometry.axialWidthMm <= 0) {
    errors.push({
      level: 'error',
      code: 'GEOMETRY_INVALID_WIDTH',
      message: `Axial width (${geometry.axialWidthMm}mm) must be greater than 0`,
      suggestion: 'Specify a positive axial width',
    });
  }

  // Check edge margin is reasonable
  if (geometry.edgeMarginMm < 0) {
    errors.push({
      level: 'error',
      code: 'GEOMETRY_INVALID_WIDTH',
      message: `Edge margin (${geometry.edgeMarginMm}mm) cannot be negative`,
      suggestion: 'Use a positive edge margin',
    });
  }

  // Check minimum hole spacing
  if (geometry.minHoleSpacingMm < 0) {
    errors.push({
      level: 'error',
      code: 'GEOMETRY_INVALID_WIDTH',
      message: `Minimum hole spacing (${geometry.minHoleSpacingMm}mm) cannot be negative`,
      suggestion: 'Use a positive minimum hole spacing',
    });
  }

  // Calculate derived values if geometry is valid
  let calculatedGeometry = undefined;
  if (errors.length === 0) {
    calculatedGeometry = calculateDerivedGeometry(geometry);
  }

  return {
    isValid: errors.length === 0,
    errors,
    calculatedGeometry,
  };
}

// ============================================================================
// HOLE POSITION VALIDATION
// ============================================================================

/**
 * Validate hole positions within the block geometry
 *
 * Checks:
 * - All holes within angular edge margins
 * - All holes within axial edge margins
 * - Minimum spacing between adjacent holes on arc
 * - No overlapping holes
 */
export function validateHolePositions(
  positions: CurvedHolePosition[],
  features: HoleFeature[],
  geometry: RingSegmentGeometry
): HoleValidationResult {
  const errors: ValidationWarning[] = [];
  const warnings: ValidationWarning[] = [];

  const calc = calculateDerivedGeometry(geometry);
  const angularMargin =
    (geometry.edgeMarginMm / calc.meanRadiusMm) * (180 / Math.PI);

  // Validate each hole position
  for (const position of positions) {
    // Check angular position within margins
    if (position.angleOnArcDeg < angularMargin) {
      errors.push({
        level: 'error',
        code: 'HOLE_OUTSIDE_MARGINS',
        message: `Hole ${position.label} angle (${position.angleOnArcDeg}°) is too close to start edge (margin: ${angularMargin.toFixed(1)}°)`,
        suggestion: `Move hole ${position.label} to at least ${angularMargin.toFixed(1)}° from start`,
      });
    }

    if (position.angleOnArcDeg > geometry.segmentAngleDeg - angularMargin) {
      errors.push({
        level: 'error',
        code: 'HOLE_OUTSIDE_MARGINS',
        message: `Hole ${position.label} angle (${position.angleOnArcDeg}°) is too close to end edge`,
        suggestion: `Move hole ${position.label} to at least ${angularMargin.toFixed(1)}° from end`,
      });
    }

    // Check axial position within margins
    if (position.axialPositionMm < geometry.edgeMarginMm) {
      errors.push({
        level: 'error',
        code: 'HOLE_OUTSIDE_MARGINS',
        message: `Hole ${position.label} axial position (${position.axialPositionMm}mm) is too close to left edge`,
        suggestion: `Move hole ${position.label} to at least ${geometry.edgeMarginMm}mm from left edge`,
      });
    }

    if (position.axialPositionMm > geometry.axialWidthMm - geometry.edgeMarginMm) {
      errors.push({
        level: 'error',
        code: 'HOLE_OUTSIDE_MARGINS',
        message: `Hole ${position.label} axial position (${position.axialPositionMm}mm) is too close to right edge`,
        suggestion: `Move hole ${position.label} to at least ${geometry.edgeMarginMm}mm from right edge`,
      });
    }
  }

  // Check minimum spacing between holes on arc
  const sortedByAngle = [...positions].sort(
    (a, b) => a.angleOnArcDeg - b.angleOnArcDeg
  );

  for (let i = 0; i < sortedByAngle.length - 1; i++) {
    const hole1 = sortedByAngle[i];
    const hole2 = sortedByAngle[i + 1];

    const arcDistance = calculateHoleArcDistance(
      hole1.angleOnArcDeg,
      hole2.angleOnArcDeg,
      calc.meanRadiusMm
    );

    if (arcDistance < geometry.minHoleSpacingMm) {
      warnings.push({
        level: 'warning',
        code: 'HOLE_SPACING_TOO_SMALL',
        message: `Holes ${hole1.label} and ${hole2.label} are ${arcDistance.toFixed(1)}mm apart on arc (minimum: ${geometry.minHoleSpacingMm}mm)`,
        suggestion: 'Consider increasing angular separation between holes',
      });
    }
  }

  // Check arc length is sufficient for all holes
  const requiredArcLength =
    geometry.edgeMarginMm * 2 +
    (positions.length - 1) * geometry.minHoleSpacingMm;

  if (calc.arcLengthMm < requiredArcLength) {
    errors.push({
      level: 'error',
      code: 'ARC_LENGTH_INSUFFICIENT',
      message: `Arc length (${calc.arcLengthMm.toFixed(1)}mm) is too short for ${positions.length} holes with required spacing`,
      suggestion: `Increase segment angle or reduce number of holes. Required: ${requiredArcLength.toFixed(1)}mm`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// THIN-WALL POLICY
// ============================================================================

/**
 * Default thin-wall policy configuration
 */
export const defaultThinWallPolicy: ThinWallPolicy = {
  safetyMarginMm: 2,
  minimumReflectors: {
    EN: 3,
    ASTM: 2,
  },
  fallbackDepthRatios: [0.2, 0.5, 0.8] as const,
};

/**
 * Apply thin-wall policy to hole features
 *
 * If wall thickness is insufficient for standard depths:
 * 1. Attempt to use standard depths (within maxAllowedDepth)
 * 2. Fall back to proportional depths (0.2t, 0.5t, 0.8t)
 * 3. Throw error if even fallback doesn't work
 */
export function applyThinWallPolicy(
  features: HoleFeature[],
  wallThicknessMm: number,
  standardFamily: StandardFamily,
  policy: ThinWallPolicy = defaultThinWallPolicy
): ThinWallPolicyResult {
  const warnings: ValidationWarning[] = [];
  const adjustedFeatures: HoleFeature[] = [];

  const maxAllowedDepth = wallThicknessMm - policy.safetyMarginMm;
  const minReflectors = policy.minimumReflectors[standardFamily as 'EN' | 'ASTM'] || 3;

  let usedFallback = false;
  let removedCount = 0;

  // Check if any depths exceed max allowed
  const exceedsMax = features.some((f) => f.depthMm > maxAllowedDepth);

  if (exceedsMax) {
    // Try to adjust depths
    for (const feature of features) {
      if (feature.depthMm <= maxAllowedDepth) {
        // Depth is OK, keep as-is
        adjustedFeatures.push({ ...feature });
      } else {
        // Need to adjust - try fallback depths
        const fallbackDepths = policy.fallbackDepthRatios.map(
          (ratio) => ratio * wallThicknessMm
        );

        // Find the closest valid fallback depth
        const validFallback = fallbackDepths.filter((d) => d <= maxAllowedDepth);

        if (validFallback.length > 0) {
          // Use the deepest valid fallback
          const newDepth = validFallback[validFallback.length - 1];
          adjustedFeatures.push({
            ...feature,
            depthMm: newDepth,
          });
          usedFallback = true;

          warnings.push({
            level: 'warning',
            code: 'THIN_WALL_DEPTH_ADJUSTED',
            message: `Hole ${feature.label} depth adjusted from ${feature.depthMm}mm to ${newDepth.toFixed(1)}mm due to thin wall`,
            suggestion: `Wall thickness (${wallThicknessMm}mm) limits maximum depth to ${maxAllowedDepth.toFixed(1)}mm`,
          });
        } else {
          // Cannot fit this hole - remove it
          removedCount++;
          warnings.push({
            level: 'warning',
            code: 'THIN_WALL_REFLECTOR_REMOVED',
            message: `Hole ${feature.label} removed - wall too thin for any valid depth`,
            suggestion: `Wall thickness (${wallThicknessMm}mm) is too thin for standard reflector depths`,
          });
        }
      }
    }

    if (usedFallback && removedCount === 0) {
      warnings.push({
        level: 'info',
        code: 'THIN_WALL_FALLBACK_APPLIED',
        message: 'Proportional depths (relative to wall thickness) applied due to thin wall',
        suggestion: `Using depths at ${policy.fallbackDepthRatios.map((r) => `${(r * 100).toFixed(0)}%`).join(', ')} of wall thickness`,
      });
    }
  } else {
    // All depths are within limits - use original features
    adjustedFeatures.push(...features.map((f) => ({ ...f })));
  }

  // Check if we have minimum reflectors
  const isCompliant = adjustedFeatures.length >= minReflectors;

  if (!isCompliant) {
    warnings.push({
      level: 'error',
      code: 'MINIMUM_REFLECTORS_NOT_MET',
      message: `Only ${adjustedFeatures.length} reflector(s) remain after adjustment (minimum: ${minReflectors} for ${standardFamily})`,
      suggestion: 'Increase wall thickness or use a custom block configuration',
    });
  }

  return {
    adjustedFeatures,
    warnings,
    isCompliant,
  };
}

/**
 * Calculate fallback depths for a given wall thickness
 *
 * Returns depths at 0.2t, 0.5t, and 0.8t (where t = wall thickness)
 */
export function calculateFallbackDepths(
  wallThicknessMm: number,
  policy: ThinWallPolicy = defaultThinWallPolicy
): number[] {
  return policy.fallbackDepthRatios.map((ratio) => ratio * wallThicknessMm);
}

/**
 * Check if wall is considered "thin" based on standard depths
 *
 * @param wallThicknessMm - Wall thickness in mm
 * @param standardDepths - Array of standard depths to check against
 * @param policy - Thin-wall policy
 * @returns true if wall is thin (any standard depth exceeds safe maximum)
 */
export function isThinWall(
  wallThicknessMm: number,
  standardDepths: number[],
  policy: ThinWallPolicy = defaultThinWallPolicy
): boolean {
  const maxAllowedDepth = wallThicknessMm - policy.safetyMarginMm;
  return standardDepths.some((depth) => depth > maxAllowedDepth);
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Perform comprehensive validation of block configuration
 *
 * Combines geometry, hole position, and thin-wall validations
 */
export function validateBlockConfiguration(
  geometry: RingSegmentGeometry,
  positions: CurvedHolePosition[],
  features: HoleFeature[],
  standardFamily: StandardFamily,
  policy: ThinWallPolicy = defaultThinWallPolicy
): {
  isValid: boolean;
  errors: ValidationWarning[];
  warnings: ValidationWarning[];
  adjustedFeatures: HoleFeature[];
} {
  const allErrors: ValidationWarning[] = [];
  const allWarnings: ValidationWarning[] = [];

  // 1. Validate geometry
  const geoResult = validateGeometry(geometry);
  allErrors.push(...geoResult.errors);

  if (!geoResult.isValid) {
    return {
      isValid: false,
      errors: allErrors,
      warnings: allWarnings,
      adjustedFeatures: features,
    };
  }

  // 2. Validate hole positions
  const posResult = validateHolePositions(positions, features, geometry);
  allErrors.push(...posResult.errors);
  allWarnings.push(...posResult.warnings);

  // 3. Apply thin-wall policy
  const wallThickness = calculateWallThickness(
    geometry.outerDiameterMm,
    geometry.innerDiameterMm
  );
  const thinWallResult = applyThinWallPolicy(
    features,
    wallThickness,
    standardFamily,
    policy
  );

  // Separate errors from warnings in thin-wall result
  for (const warning of thinWallResult.warnings) {
    if (warning.level === 'error') {
      allErrors.push(warning);
    } else {
      allWarnings.push(warning);
    }
  }

  return {
    isValid: allErrors.length === 0 && thinWallResult.isCompliant,
    errors: allErrors,
    warnings: allWarnings,
    adjustedFeatures: thinWallResult.adjustedFeatures,
  };
}
