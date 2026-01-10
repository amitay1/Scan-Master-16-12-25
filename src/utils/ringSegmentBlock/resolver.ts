/**
 * Ring Segment Block Resolver
 *
 * The resolver takes a template and optional part dimensions override,
 * validates the configuration, applies thin-wall policy, and produces
 * a fully resolved block ready for rendering.
 *
 * This is the main entry point for creating parametric ring segment blocks.
 */

import type {
  RingSegmentBlockTemplate,
  RingSegmentGeometry,
  PartDimensionsOverride,
  ResolvedRingSegmentBlock,
  ResolvedHole,
  CurvedHolePosition,
  HoleFeature,
  ValidationWarning,
  ThinWallPolicy,
  AxialOrigin,
} from '@/types/ringSegmentBlock.types';

import {
  calculateDerivedGeometry,
  calculateHole3DPosition,
  polarToCartesian,
  calculateMeanRadius,
  calculateWallThickness,
  resolveAxialPosition,
} from './geometry';

import { getTemplate, RING_SEGMENT_TEMPLATES } from './templates';

import {
  validateGeometry,
  validateHolePositions,
  applyThinWallPolicy,
  defaultThinWallPolicy,
} from './validator';

// ============================================================================
// MAIN RESOLVER FUNCTION
// ============================================================================

/**
 * Resolve a ring segment block from template and optional part dimensions
 *
 * This is the main entry point for creating a parametric block.
 *
 * @param templateId - ID of the template to use
 * @param partDimensions - Optional override dimensions from the part being tested
 * @param policy - Optional thin-wall policy (uses default if not provided)
 * @returns Fully resolved block ready for rendering
 * @throws Error if template not found or validation fails critically
 */
export function resolveRingSegmentBlock(
  templateId: string,
  partDimensions?: PartDimensionsOverride,
  policy: ThinWallPolicy = defaultThinWallPolicy
): ResolvedRingSegmentBlock {
  // 1. Get the template
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 2. Merge template geometry with part dimensions override
  const geometry = mergeGeometry(template.geometry, partDimensions);

  // 3. Validate geometry
  const geoResult = validateGeometry(geometry);
  if (!geoResult.isValid) {
    const errorMessages = geoResult.errors.map((e) => e.message).join('; ');
    throw new Error(`Invalid geometry: ${errorMessages}`);
  }

  // 4. Scale hole positions if part dimensions differ from template
  const scaledPositions = scaleHolePositions(
    template.holePositions,
    template.geometry,
    geometry
  );

  // 5. Validate hole positions
  const posResult = validateHolePositions(scaledPositions, template.holeFeatures, geometry);

  // 6. Apply thin-wall policy
  const wallThickness = calculateWallThickness(
    geometry.outerDiameterMm,
    geometry.innerDiameterMm
  );
  const thinWallResult = applyThinWallPolicy(
    template.holeFeatures,
    wallThickness,
    template.standardFamily,
    policy
  );

  // 7. Collect all warnings
  const allWarnings: ValidationWarning[] = [
    ...posResult.errors,
    ...posResult.warnings,
    ...thinWallResult.warnings,
  ];

  // Add warning if part dimensions override was used
  if (partDimensions && hasAnyOverride(partDimensions)) {
    allWarnings.unshift({
      level: 'info',
      code: 'PART_DIMS_OVERRIDE',
      message: 'Block dimensions adapted to match part geometry',
      suggestion: 'Review that hole positions are appropriate for the scaled block',
    });
  }

  // 8. Merge positions and features into resolved holes
  const resolvedHoles = mergeToResolvedHoles(
    scaledPositions,
    thinWallResult.adjustedFeatures,
    template.holeFeatures,
    geometry,
    template.axialOrigin
  );

  // 9. Calculate derived geometry
  const calculatedGeometry = calculateDerivedGeometry(geometry);

  // 10. Build and return resolved block
  return {
    templateId: template.id,
    templateName: template.name,
    standardReference: template.standardReference,
    geometry,
    calculatedGeometry,
    holes: resolvedHoles,
    warnings: allWarnings,
    isCompliant: thinWallResult.isCompliant && posResult.isValid,
    axialOrigin: template.axialOrigin,
  };
}

// ============================================================================
// GEOMETRY MERGING
// ============================================================================

/**
 * Merge template geometry with part dimensions override
 */
function mergeGeometry(
  templateGeometry: RingSegmentGeometry,
  partDimensions?: PartDimensionsOverride
): RingSegmentGeometry {
  if (!partDimensions) {
    return { ...templateGeometry };
  }

  return {
    ...templateGeometry,
    outerDiameterMm: partDimensions.outerDiameterMm ?? templateGeometry.outerDiameterMm,
    innerDiameterMm: partDimensions.innerDiameterMm ?? templateGeometry.innerDiameterMm,
    axialWidthMm: partDimensions.axialWidthMm ?? templateGeometry.axialWidthMm,
    segmentAngleDeg: partDimensions.segmentAngleDeg ?? templateGeometry.segmentAngleDeg,
  };
}

/**
 * Check if any override value is provided
 */
function hasAnyOverride(override: PartDimensionsOverride): boolean {
  return (
    override.outerDiameterMm !== undefined ||
    override.innerDiameterMm !== undefined ||
    override.axialWidthMm !== undefined ||
    override.segmentAngleDeg !== undefined
  );
}

// ============================================================================
// HOLE POSITION SCALING
// ============================================================================

/**
 * Scale hole positions when part dimensions differ from template
 *
 * Angular positions are preserved (same arc position ratio)
 * Axial positions are scaled proportionally
 */
function scaleHolePositions(
  positions: CurvedHolePosition[],
  templateGeometry: RingSegmentGeometry,
  targetGeometry: RingSegmentGeometry
): CurvedHolePosition[] {
  // Calculate scale factors
  const angleScale = targetGeometry.segmentAngleDeg / templateGeometry.segmentAngleDeg;
  const axialScale = targetGeometry.axialWidthMm / templateGeometry.axialWidthMm;

  return positions.map((pos) => ({
    ...pos,
    // Scale angle position (keep same relative position in arc)
    angleOnArcDeg: pos.angleOnArcDeg * angleScale,
    // Scale axial position
    axialPositionMm: pos.axialPositionMm * axialScale,
  }));
}

// ============================================================================
// HOLE RESOLUTION
// ============================================================================

/**
 * Merge hole positions and features into fully resolved holes
 *
 * Links positions to features by label and calculates all coordinates
 */
function mergeToResolvedHoles(
  positions: CurvedHolePosition[],
  adjustedFeatures: HoleFeature[],
  originalFeatures: HoleFeature[],
  geometry: RingSegmentGeometry,
  axialOrigin: AxialOrigin
): ResolvedHole[] {
  const resolvedHoles: ResolvedHole[] = [];

  for (const position of positions) {
    // Find matching adjusted feature
    const adjustedFeature = adjustedFeatures.find((f) => f.label === position.label);
    if (!adjustedFeature) {
      // This hole was removed by thin-wall policy
      continue;
    }

    // Find original feature for comparison
    const originalFeature = originalFeatures.find((f) => f.label === position.label);
    const originalDepth = originalFeature?.depthMm ?? adjustedFeature.depthMm;
    const wasAdjusted = adjustedFeature.depthMm !== originalDepth;

    // Calculate 3D position
    const cartesian = calculateHole3DPosition(position, geometry, adjustedFeature);

    // Calculate top view position
    const calc = calculateDerivedGeometry(geometry);
    const topViewPosition = polarToCartesian(0, 0, calc.meanRadiusMm, position.angleOnArcDeg);

    // Calculate section view position (radial-axial plane)
    const resolvedAxialPos = resolveAxialPosition(
      position.axialPositionMm,
      geometry.axialWidthMm,
      axialOrigin
    );
    const sectionViewPosition = {
      x: adjustedFeature.depthMm, // Depth becomes X in section view
      y: resolvedAxialPos, // Axial position becomes Y
    };

    resolvedHoles.push({
      label: position.label,
      reflectorType: adjustedFeature.reflectorType,
      diameterMm: adjustedFeature.diameterMm,
      depthMm: adjustedFeature.depthMm,
      originalDepthMm: originalDepth,
      angleOnArcDeg: position.angleOnArcDeg,
      axialPositionMm: position.axialPositionMm,
      depthDefinition: position.depthDefinition,
      wasAdjusted,
      cartesian,
      topViewPosition,
      sectionViewPosition,
    });
  }

  // Sort by angle for consistent ordering
  return resolvedHoles.sort((a, b) => a.angleOnArcDeg - b.angleOnArcDeg);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick resolve with default EN template
 */
export function resolveENBlock(
  partDimensions?: PartDimensionsOverride
): ResolvedRingSegmentBlock {
  return resolveRingSegmentBlock('EN_10228_DAC_REF_BLOCK', partDimensions);
}

/**
 * Quick resolve with default ASTM template
 */
export function resolveASTMBlock(
  partDimensions?: PartDimensionsOverride
): ResolvedRingSegmentBlock {
  return resolveRingSegmentBlock('ASTM_E428_FBH_BLOCK', partDimensions);
}

/**
 * Quick resolve with TUV style template
 */
export function resolveTUVBlock(
  partDimensions?: PartDimensionsOverride
): ResolvedRingSegmentBlock {
  return resolveRingSegmentBlock('TUV_STYLE_REF_BLOCK', partDimensions);
}

/**
 * Get list of available templates for UI
 */
export function getAvailableTemplates(): Array<{
  id: string;
  name: string;
  standardReference: string;
  standardFamily: string;
}> {
  return Object.values(RING_SEGMENT_TEMPLATES).map((template) => ({
    id: template.id,
    name: template.name,
    standardReference: template.standardReference,
    standardFamily: template.standardFamily,
  }));
}

/**
 * Validate part dimensions before resolving
 *
 * Useful for form validation in UI
 */
export function validatePartDimensions(
  dims: PartDimensionsOverride
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (dims.outerDiameterMm !== undefined && dims.outerDiameterMm <= 0) {
    errors.push('Outer diameter must be positive');
  }

  if (dims.innerDiameterMm !== undefined && dims.innerDiameterMm < 0) {
    errors.push('Inner diameter cannot be negative');
  }

  if (
    dims.outerDiameterMm !== undefined &&
    dims.innerDiameterMm !== undefined &&
    dims.outerDiameterMm <= dims.innerDiameterMm
  ) {
    errors.push('Outer diameter must be greater than inner diameter');
  }

  if (dims.axialWidthMm !== undefined && dims.axialWidthMm <= 0) {
    errors.push('Axial width must be positive');
  }

  if (dims.segmentAngleDeg !== undefined) {
    if (dims.segmentAngleDeg < 30) {
      errors.push('Segment angle must be at least 30°');
    }
    if (dims.segmentAngleDeg > 180) {
      errors.push('Segment angle cannot exceed 180°');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// INDEX EXPORT
// ============================================================================

export {
  getTemplate,
  RING_SEGMENT_TEMPLATES,
  defaultThinWallPolicy,
};
