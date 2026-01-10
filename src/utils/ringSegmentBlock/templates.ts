/**
 * Ring Segment Calibration Block Templates
 *
 * Pre-defined standard block templates for EN and ASTM standards.
 * These templates define the default geometry and hole configurations
 * that can be adapted to specific part dimensions by the resolver.
 */

import type {
  RingSegmentBlockTemplate,
  CurvedHolePosition,
  HoleFeature,
} from '@/types/ringSegmentBlock.types';

// ============================================================================
// EN 10228-3 DAC REFERENCE BLOCK (SDH)
// ============================================================================

/**
 * EN 10228-3 DAC Reference Block
 *
 * Ring segment with Side Drilled Holes (SDH) for DAC calibration
 * Used for angle beam testing of forged rings and tubes per BS EN 10228-3
 *
 * Default geometry: 400mm OD, 250mm ID, 125mm width, 120° segment
 * Reflectors: 4 × SDH Ø3.0mm at various radial depths
 */
export const EN_10228_DAC_REF_BLOCK: RingSegmentBlockTemplate = {
  id: 'EN_10228_DAC_REF_BLOCK',
  name: 'EN 10228-3 DAC Reference Block',
  standardReference: 'BS EN 10228-3',
  standardFamily: 'EN',
  description:
    'Ring segment reference block with Side Drilled Holes (SDH) for Distance-Amplitude Correction (DAC) calibration. Used for angle beam ultrasonic testing of forged rings and tubes.',

  geometry: {
    shape: 'ring_segment',
    outerDiameterMm: 400,
    innerDiameterMm: 250,
    axialWidthMm: 125,
    segmentAngleDeg: 120,
    edgeMarginMm: 15,
    minHoleSpacingMm: 20,
  },

  holePositions: [
    {
      label: 'A',
      angleOnArcDeg: 15,
      axialPositionMm: 25,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'B',
      angleOnArcDeg: 45,
      axialPositionMm: 50,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'C',
      angleOnArcDeg: 75,
      axialPositionMm: 75,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'D',
      angleOnArcDeg: 105,
      axialPositionMm: 100,
      depthDefinition: 'radial_depth',
    },
  ] as CurvedHolePosition[],

  holeFeatures: [
    {
      label: 'A',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 15, // Near OD surface (shallow)
    },
    {
      label: 'B',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 35, // ~47% into wall
    },
    {
      label: 'C',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 55, // ~73% into wall
    },
    {
      label: 'D',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 70, // Near ID surface (deep)
    },
  ] as HoleFeature[],

  axialOrigin: 'left',

  notes: [
    'Holes are side-drilled (SDH) parallel to the axial direction',
    'Depths are measured radially from the OD surface',
    'Minimum 4 reflectors required for full DAC curve coverage',
    'Block material should match part material (same acoustic properties)',
    'Surface finish: Ra ≤ 6.3 μm on scanning surface',
  ],
};

// ============================================================================
// ASTM E428 FBH REFERENCE BLOCK
// ============================================================================

/**
 * ASTM E428 FBH Reference Block
 *
 * Ring segment with Flat Bottom Holes (FBH) for amplitude calibration
 * Based on ASTM E428 area-amplitude reference blocks adapted for curved parts
 *
 * Default geometry: 300mm OD, 200mm ID, 100mm width, 90° segment
 * Reflectors: 3 × FBH Ø1/8" (3.175mm) at various depths
 */
export const ASTM_E428_FBH_BLOCK: RingSegmentBlockTemplate = {
  id: 'ASTM_E428_FBH_BLOCK',
  name: 'ASTM E428 FBH Reference Block',
  standardReference: 'ASTM E428',
  standardFamily: 'ASTM',
  description:
    'Ring segment reference block with Flat Bottom Holes (FBH) for area-amplitude calibration. Adapted from ASTM E428 for curved parts testing.',

  geometry: {
    shape: 'ring_segment',
    outerDiameterMm: 300,
    innerDiameterMm: 200,
    axialWidthMm: 100,
    segmentAngleDeg: 90,
    edgeMarginMm: 12.7, // 0.5 inch
    minHoleSpacingMm: 25.4, // 1 inch
  },

  holePositions: [
    {
      label: 'A',
      angleOnArcDeg: 22.5,
      axialPositionMm: 25,
      depthDefinition: 'along_drill_axis',
    },
    {
      label: 'B',
      angleOnArcDeg: 45,
      axialPositionMm: 50,
      depthDefinition: 'along_drill_axis',
    },
    {
      label: 'C',
      angleOnArcDeg: 67.5,
      axialPositionMm: 75,
      depthDefinition: 'along_drill_axis',
    },
  ] as CurvedHolePosition[],

  holeFeatures: [
    {
      label: 'A',
      reflectorType: 'FBH',
      diameterMm: 3.175, // 1/8 inch
      depthMm: 12.7, // 0.5 inch (25% of wall)
    },
    {
      label: 'B',
      reflectorType: 'FBH',
      diameterMm: 3.175, // 1/8 inch
      depthMm: 25.4, // 1 inch (50% of wall)
    },
    {
      label: 'C',
      reflectorType: 'FBH',
      diameterMm: 3.175, // 1/8 inch
      depthMm: 38.1, // 1.5 inch (75% of wall)
    },
  ] as HoleFeature[],

  axialOrigin: 'left',

  notes: [
    'FBH drilled perpendicular to curved OD surface',
    'Depths measured along drill axis (not radially)',
    'Standard FBH diameter: 1/8" (3.175mm) per ASTM E428',
    'Minimum 3 reflectors for adequate depth coverage',
    'Block material per ASTM E428 Section 5',
  ],
};

// ============================================================================
// TUV STYLE REFERENCE BLOCK (BASED ON TUV-17)
// ============================================================================

/**
 * TUV Style Reference Block
 *
 * Based on TUV certification requirements, similar to TUV-17 technical card
 * Ring segment with SDH for circumferential shear wave inspection
 *
 * Default geometry: 350mm OD, 200mm ID, 125mm width, 120° segment
 * Reflectors: 4 × SDH Ø3.0mm
 */
export const TUV_STYLE_REF_BLOCK: RingSegmentBlockTemplate = {
  id: 'TUV_STYLE_REF_BLOCK',
  name: 'TUV Style Reference Block',
  standardReference: 'TUV Certification Requirements',
  standardFamily: 'TUV',
  description:
    'Ring segment reference block per TUV certification requirements for circumferential shear wave inspection of tubes and cylinders.',

  geometry: {
    shape: 'ring_segment',
    outerDiameterMm: 350,
    innerDiameterMm: 200,
    axialWidthMm: 125,
    segmentAngleDeg: 120,
    edgeMarginMm: 15,
    minHoleSpacingMm: 20,
  },

  holePositions: [
    {
      label: 'A',
      angleOnArcDeg: 15,
      axialPositionMm: 31.25,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'B',
      angleOnArcDeg: 45,
      axialPositionMm: 62.5,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'C',
      angleOnArcDeg: 75,
      axialPositionMm: 93.75,
      depthDefinition: 'radial_depth',
    },
    {
      label: 'D',
      angleOnArcDeg: 105,
      axialPositionMm: 31.25,
      depthDefinition: 'radial_depth',
    },
  ] as CurvedHolePosition[],

  holeFeatures: [
    {
      label: 'A',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 15,
    },
    {
      label: 'B',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 37.5,
    },
    {
      label: 'C',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 60,
    },
    {
      label: 'D',
      reflectorType: 'SDH',
      diameterMm: 3.0,
      depthMm: 15,
    },
  ] as HoleFeature[],

  axialOrigin: 'left',

  notes: [
    'Per TUV certification requirements',
    'SDH parallel to cylinder axis',
    'Suitable for circumferential shear wave inspection',
    'Applicable for tubes, cylinders, cones, spheres',
    'Reference: Voir rapport 5394 pour Coupe A-A et B-B',
  ],
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Map of all available templates by ID
 */
export const RING_SEGMENT_TEMPLATES: Record<string, RingSegmentBlockTemplate> = {
  EN_10228_DAC_REF_BLOCK,
  ASTM_E428_FBH_BLOCK,
  TUV_STYLE_REF_BLOCK,
};

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): RingSegmentBlockTemplate | null {
  return RING_SEGMENT_TEMPLATES[templateId] || null;
}

/**
 * Get all available template IDs
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(RING_SEGMENT_TEMPLATES);
}

/**
 * Get templates by standard family
 */
export function getTemplatesByStandard(
  family: 'EN' | 'ASTM' | 'TUV' | 'CUSTOM'
): RingSegmentBlockTemplate[] {
  return Object.values(RING_SEGMENT_TEMPLATES).filter(
    (template) => template.standardFamily === family
  );
}

/**
 * Template selector options for UI dropdown
 */
export const TEMPLATE_OPTIONS = [
  {
    id: 'EN_10228_DAC_REF_BLOCK',
    label: 'EN 10228-3 DAC (SDH)',
    description: '4×SDH Ø3mm, 120° segment',
    standard: 'EN',
  },
  {
    id: 'ASTM_E428_FBH_BLOCK',
    label: 'ASTM E428 FBH',
    description: '3×FBH Ø3.175mm (1/8"), 90° segment',
    standard: 'ASTM',
  },
  {
    id: 'TUV_STYLE_REF_BLOCK',
    label: 'TUV Style (SDH)',
    description: '4×SDH Ø3mm, 120° segment',
    standard: 'TUV',
  },
] as const;

// ============================================================================
// TEMPLATE FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a custom template from base parameters
 */
export function createCustomTemplate(
  id: string,
  name: string,
  geometry: RingSegmentBlockTemplate['geometry'],
  holePositions: CurvedHolePosition[],
  holeFeatures: HoleFeature[]
): RingSegmentBlockTemplate {
  return {
    id,
    name,
    standardReference: 'Custom',
    standardFamily: 'CUSTOM',
    description: `Custom ring segment reference block: ${name}`,
    geometry,
    holePositions,
    holeFeatures,
    axialOrigin: 'left',
    notes: ['Custom block configuration'],
  };
}

/**
 * Clone an existing template with modifications
 */
export function cloneTemplate(
  baseTemplateId: string,
  modifications: Partial<Omit<RingSegmentBlockTemplate, 'id'>> & { id: string }
): RingSegmentBlockTemplate | null {
  const base = getTemplate(baseTemplateId);
  if (!base) return null;

  return {
    ...base,
    ...modifications,
    geometry: {
      ...base.geometry,
      ...(modifications.geometry || {}),
    },
    holePositions: modifications.holePositions || base.holePositions,
    holeFeatures: modifications.holeFeatures || base.holeFeatures,
  };
}
