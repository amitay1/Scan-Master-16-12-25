/**
 * Shear Wave Calibration Block Database
 * 
 * Based on ASME piping inspection requirements for curved surfaces.
 * Covers diameter range 24mm - 500mm+ with 7 Masters (6 curved + 1 flat).
 * 
 * KEY RULES (ASME-compliant):
 * 1. Curvature Rule:
 *    - OD ≤ 500mm → use CURVED block
 *    - OD > 500mm → use FLAT block
 * 
 * 2. Diameter Range Rule:
 *    - Each curved block covers: 0.9·Dblock ≤ Dpart ≤ 1.5·Dblock
 *    - This allows one block to serve multiple part diameters
 * 
 * 3. Thickness Rule:
 *    - Block thickness must be within ±25% of part thickness
 *    - 0.75·Tpart ≤ Tblock ≤ 1.25·Tpart
 * 
 * 4. Reflector Configuration:
 *    - PIPING_NOTCH: 4 notches (OD/ID × axial/circumferential)
 *    - PIPING_SDH: Side drilled holes for piping
 *    - BASIC_SDH: Standard SDH configuration
 */

import { CalibrationBlockSpec, Notch, SDHHole, CylindricalBlockGeometry } from '@/types/calibrationBlocks';
import { PartGeometry } from '@/types/techniqueSheet';

// ============================================================================
// REFLECTOR CONFIGURATION TYPES
// ============================================================================

export type ReflectorConfig = 
  | 'PIPING_NOTCH'   // 4 notches per ASME piping standard
  | 'PIPING_SDH'     // SDH configuration for piping
  | 'BASIC_SDH';     // Standard SDH configuration

export interface PipingNotchConfiguration {
  type: 'PIPING_NOTCH';
  /** Depth as percentage of wall thickness (typically 10%) */
  depthPercent: number;
  /** Notch width in mm */
  widthMm: number;
  /** Minimum notch length in mm */
  lengthMm: number;
  /** Notch count (always 4 for piping: OD/ID × axial/circumferential) */
  count: 4;
}

export interface ShearWaveCalibrationBlock extends Omit<CalibrationBlockSpec, 'geometry'> {
  // Block identification
  master_id: string;
  block_type: 'CURVED' | 'FLAT';
  
  // Diameter specifications
  nominal_Dblock_mm: number;
  Dpart_min_mm: number;  // 0.9 × nominal
  Dpart_max_mm: number;  // 1.5 × nominal
  
  // Thickness specifications
  nominal_thickness_mm: number;
  thickness_tolerance_percent: 25;  // ±25% per ASME
  
  // Geometry (always cylindrical for shear wave blocks)
  geometry: CylindricalBlockGeometry;
  
  // Reflector configuration
  reflector_config: ReflectorConfig;
  piping_notch_spec?: PipingNotchConfiguration;
  
  // Wedge constraints
  wedge_constraints: {
    /** Minimum wedge radius/OD that can be used with this block */
    min_wedge_od_mm: number;
    /** Description of wedge limitations */
    constraint_note: string;
  };
  
  // Application rules
  application_rules: {
    /** Primary scan type this block is designed for */
    scan_type: 'circumferential_shear' | 'angle_beam_general';
    /** Minimum angle for angle beam (degrees) */
    min_angle_deg?: number;
    /** Maximum angle for angle beam (degrees) */
    max_angle_deg?: number;
  };
}

// ============================================================================
// STANDARD PIPING NOTCH SPECIFICATION (ASME)
// ============================================================================

const STANDARD_PIPING_NOTCH: PipingNotchConfiguration = {
  type: 'PIPING_NOTCH',
  depthPercent: 10,      // 10% of wall thickness
  widthMm: 6.35,         // 1/4" width
  lengthMm: 25.4,        // 1" minimum length
  count: 4,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate diameter range based on ASME 0.9-1.5 rule
 */
function calculateDiameterRange(nominalDiameter: number): { min: number; max: number } {
  return {
    min: Math.round(nominalDiameter * 0.9 * 10) / 10,
    max: Math.round(nominalDiameter * 1.5 * 10) / 10,
  };
}

/**
 * Generate notch specifications for piping block
 */
function generatePipingNotches(
  outerDiameter: number,
  innerDiameter: number,
  wallThickness: number,
  config: PipingNotchConfiguration = STANDARD_PIPING_NOTCH
): Notch[] {
  const notchDepth = wallThickness * (config.depthPercent / 100);
  
  return [
    // OD Axial notch (0°)
    {
      type: 'rectangular' as const,
      widthMm: config.widthMm,
      depthMm: notchDepth,
      lengthMm: config.lengthMm,
      position: 'od' as const,
      orientationDeg: 0,
    },
    // OD Circumferential notch (90°)
    {
      type: 'rectangular' as const,
      widthMm: config.widthMm,
      depthMm: notchDepth,
      lengthMm: config.lengthMm,
      position: 'od' as const,
      orientationDeg: 90,
    },
    // ID Axial notch (0°)
    {
      type: 'rectangular' as const,
      widthMm: config.widthMm,
      depthMm: notchDepth,
      lengthMm: config.lengthMm,
      position: 'id' as const,
      orientationDeg: 0,
    },
    // ID Circumferential notch (90°)
    {
      type: 'rectangular' as const,
      widthMm: config.widthMm,
      depthMm: notchDepth,
      lengthMm: config.lengthMm,
      position: 'id' as const,
      orientationDeg: 90,
    },
  ];
}

// ============================================================================
// 7 MASTERS DATABASE (6 CURVED + 1 FLAT)
// ============================================================================

/**
 * Master SW_CURV_026: Smallest curved block
 * Covers: 23.9mm - 39.8mm diameter parts
 */
const SW_CURV_026: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_026',
  id: 'shear_wave_curved_026',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 26.5,
  Dpart_min_mm: 23.9,
  Dpart_max_mm: 39.8,
  
  nominal_thickness_mm: 5.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 26.5,
    innerDiameterMm: 16.5,  // Wall thickness = 5mm
    lengthMm: 150,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(26.5, 16.5, 5.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 20,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD (no undersized wedge)',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_CURV_044: Small curved block
 * Covers: 39.8mm - 66.3mm diameter parts
 */
const SW_CURV_044: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_044',
  id: 'shear_wave_curved_044',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 44.2,
  Dpart_min_mm: 39.8,
  Dpart_max_mm: 66.3,
  
  nominal_thickness_mm: 8.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 44.2,
    innerDiameterMm: 28.2,  // Wall thickness = 8mm
    lengthMm: 200,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(44.2, 28.2, 8.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 35,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_CURV_074: Medium curved block
 * Covers: 66.3mm - 110.5mm diameter parts
 */
const SW_CURV_074: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_074',
  id: 'shear_wave_curved_074',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 73.7,
  Dpart_min_mm: 66.3,
  Dpart_max_mm: 110.5,
  
  nominal_thickness_mm: 12.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 73.7,
    innerDiameterMm: 49.7,  // Wall thickness = 12mm
    lengthMm: 250,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(73.7, 49.7, 12.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 60,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_CURV_123: Large curved block
 * Covers: 110.5mm - 184.2mm diameter parts
 */
const SW_CURV_123: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_123',
  id: 'shear_wave_curved_123',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 122.8,
  Dpart_min_mm: 110.5,
  Dpart_max_mm: 184.2,
  
  nominal_thickness_mm: 18.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 122.8,
    innerDiameterMm: 86.8,  // Wall thickness = 18mm
    lengthMm: 300,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(122.8, 86.8, 18.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 100,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_CURV_205: Extra-large curved block
 * Covers: 184.2mm - 307.0mm diameter parts
 */
const SW_CURV_205: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_205',
  id: 'shear_wave_curved_205',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 204.7,
  Dpart_min_mm: 184.2,
  Dpart_max_mm: 307.0,
  
  nominal_thickness_mm: 25.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 204.7,
    innerDiameterMm: 154.7,  // Wall thickness = 25mm
    lengthMm: 400,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(204.7, 154.7, 25.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 180,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_CURV_341: Maximum curved block
 * Covers: 307.0mm - 511.7mm diameter parts (up to flat threshold)
 */
const SW_CURV_341: ShearWaveCalibrationBlock = {
  master_id: 'SW_CURV_341',
  id: 'shear_wave_curved_341',
  block_type: 'CURVED',
  category: 'cylinder_notched',
  standardReference: 'ASME Section V Article 4 / T-434.3',
  
  nominal_Dblock_mm: 341.2,
  Dpart_min_mm: 307.0,
  Dpart_max_mm: 511.7,
  
  nominal_thickness_mm: 35.0,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'cylindrical',
    outerDiameterMm: 341.2,
    innerDiameterMm: 271.2,  // Wall thickness = 35mm
    lengthMm: 500,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: generatePipingNotches(341.2, 271.2, 35.0),
  
  wedge_constraints: {
    min_wedge_od_mm: 300,
    constraint_note: 'Wedge radius must not be significantly smaller than block OD',
  },
  
  application_rules: {
    scan_type: 'circumferential_shear',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

/**
 * Master SW_FLAT: Flat block for large diameter parts
 * Covers: >500mm diameter parts (curvature negligible)
 */
const SW_FLAT: Omit<ShearWaveCalibrationBlock, 'geometry'> & { 
  geometry: { 
    type: 'flat'; 
    lengthMm: number; 
    widthMm: number; 
    heightMm: number;
  } 
} = {
  master_id: 'SW_FLAT',
  id: 'shear_wave_flat',
  block_type: 'FLAT',
  category: 'flat_fbh',
  standardReference: 'ASME Section V Article 4 / T-434.1',
  
  nominal_Dblock_mm: 999999,  // "Infinite" diameter (flat surface)
  Dpart_min_mm: 500,
  Dpart_max_mm: 999999,
  
  nominal_thickness_mm: 50,
  thickness_tolerance_percent: 25,
  
  geometry: {
    type: 'flat',
    lengthMm: 500,
    widthMm: 300,
    heightMm: 50,
  },
  
  reflector_config: 'PIPING_NOTCH',
  piping_notch_spec: STANDARD_PIPING_NOTCH,
  notches: [
    // Surface notches (simplified for flat block)
    {
      type: 'rectangular' as const,
      widthMm: 6.35,
      depthMm: 5.0,  // 10% of nominal thickness
      lengthMm: 25.4,
      position: 'surface' as const,
      orientationDeg: 0,
    },
    {
      type: 'rectangular' as const,
      widthMm: 6.35,
      depthMm: 5.0,
      lengthMm: 25.4,
      position: 'surface' as const,
      orientationDeg: 90,
    },
  ],
  
  wedge_constraints: {
    min_wedge_od_mm: 0,
    constraint_note: 'Flat surface - any wedge size acceptable',
  },
  
  application_rules: {
    scan_type: 'angle_beam_general',
    min_angle_deg: 45,
    max_angle_deg: 70,
  },
  
  material: {
    specification: 'Steel per ASTM A36 or equivalent',
    requiredMatch: 'similar',
    surfaceFinish: 125,
  },
  
  applicablePartTypes: [
    'plate',
    'sheet',
    'tube',
    'pipe',
    'ring',
    'round_bar',
    'cylinder',
  ],
  
  beamTypes: ['angle'],
  angleBeamAngles: [45, 60, 70],
  
  visualization: {
    drawing2D: {
      frontView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
      topView: { viewBox: '0 0 100 100', paths: [], dimensionLines: [], labels: [] },
    },
    model3D: {
      vertices: [],
      faces: [],
      holePositions: [],
    },
    dimensions: [],
  },
};

// ============================================================================
// EXPORTED DATABASE
// ============================================================================

/**
 * Complete database of 7 shear wave calibration masters
 * Covers continuous diameter range from 24mm to 500mm+ with no gaps
 */
export const SHEAR_WAVE_MASTERS: ShearWaveCalibrationBlock[] = [
  SW_CURV_026,
  SW_CURV_044,
  SW_CURV_074,
  SW_CURV_123,
  SW_CURV_205,
  SW_CURV_341,
  SW_FLAT as any,  // Type cast needed due to geometry difference
];

/**
 * Quick lookup by master ID
 */
export const SHEAR_WAVE_MASTERS_MAP = new Map<string, ShearWaveCalibrationBlock>(
  SHEAR_WAVE_MASTERS.map(block => [block.master_id, block])
);

// ============================================================================
// SELECTION FUNCTIONS
// ============================================================================

export interface ShearWaveBlockSelectionCriteria {
  /** Part outer diameter in mm */
  part_od_mm: number;
  /** Part wall thickness in mm */
  part_thickness_mm: number;
  /** Part geometry type */
  part_geometry: PartGeometry;
  /** Angle beam angle (if applicable) */
  angle_deg?: number;
}

/**
 * Select the appropriate shear wave calibration block based on ASME rules
 * 
 * Algorithm:
 * 1. If OD > 500mm → return SW_FLAT
 * 2. Find first curved block where: 0.9·Dblock ≤ OD ≤ 1.5·Dblock
 * 3. Verify thickness compatibility: 0.75·Tpart ≤ Tblock ≤ 1.25·Tpart
 * 4. Return best match with reasoning
 */
export function selectShearWaveBlock(
  criteria: ShearWaveBlockSelectionCriteria
): {
  block: ShearWaveCalibrationBlock | null;
  reasoning: string;
  matchQuality: 'perfect' | 'acceptable' | 'marginal' | 'none';
} {
  const { part_od_mm, part_thickness_mm, part_geometry } = criteria;

  // Rule 1: Large diameter → flat block
  if (part_od_mm > 500) {
    const flatBlock = SHEAR_WAVE_MASTERS_MAP.get('SW_FLAT');
    if (!flatBlock) {
      return {
        block: null,
        reasoning: 'Part OD > 500mm requires flat block, but SW_FLAT not found in database',
        matchQuality: 'none',
      };
    }

    // Check thickness compatibility
    const thicknessOk = checkThicknessCompatibility(part_thickness_mm, flatBlock.nominal_thickness_mm);
    
    return {
      block: flatBlock,
      reasoning: `Part OD ${part_od_mm}mm > 500mm threshold. ASME requires flat calibration block (curvature negligible). ${thicknessOk.message}`,
      matchQuality: thicknessOk.compatible ? 'perfect' : 'marginal',
    };
  }

  // Rule 2: Find curved block with diameter match
  const candidates = SHEAR_WAVE_MASTERS.filter(block => {
    if (block.block_type === 'FLAT') return false;
    
    // Check if part OD falls within block's coverage range
    const inDiameterRange = 
      part_od_mm >= block.Dpart_min_mm && 
      part_od_mm <= block.Dpart_max_mm;
    
    // Check if part geometry is applicable
    const geometryMatch = block.applicablePartTypes.includes(part_geometry);
    
    return inDiameterRange && geometryMatch;
  });

  if (candidates.length === 0) {
    return {
      block: null,
      reasoning: `No curved block found for OD ${part_od_mm}mm and geometry ${part_geometry}. Expected range: 24-500mm.`,
      matchQuality: 'none',
    };
  }

  // Rule 3: Pick the block closest to nominal (best fit)
  let bestBlock = candidates[0];
  let bestScore = Math.abs(bestBlock.nominal_Dblock_mm - part_od_mm);

  for (const candidate of candidates) {
    const score = Math.abs(candidate.nominal_Dblock_mm - part_od_mm);
    if (score < bestScore) {
      bestScore = score;
      bestBlock = candidate;
    }
  }

  // Rule 4: Check thickness compatibility
  const thicknessCheck = checkThicknessCompatibility(part_thickness_mm, bestBlock.nominal_thickness_mm);

  const reasoning = `Selected ${bestBlock.master_id} (OD ${bestBlock.nominal_Dblock_mm}mm) for part OD ${part_od_mm}mm. ` +
    `Coverage: ${bestBlock.Dpart_min_mm}-${bestBlock.Dpart_max_mm}mm (ASME 0.9-1.5 rule). ` +
    `${thicknessCheck.message}`;

  return {
    block: bestBlock,
    reasoning,
    matchQuality: thicknessCheck.compatible ? 'perfect' : (thicknessCheck.marginal ? 'marginal' : 'acceptable'),
  };
}

/**
 * Check if block thickness is compatible with part thickness (±25% rule)
 */
function checkThicknessCompatibility(
  partThickness: number,
  blockThickness: number
): {
  compatible: boolean;
  marginal: boolean;
  message: string;
} {
  const minThickness = partThickness * 0.75;
  const maxThickness = partThickness * 1.25;
  const deviation = Math.abs(blockThickness - partThickness);
  const deviationPercent = (deviation / partThickness) * 100;

  if (blockThickness >= minThickness && blockThickness <= maxThickness) {
    return {
      compatible: true,
      marginal: false,
      message: `Thickness: Block ${blockThickness}mm within ±25% of part ${partThickness}mm (✓ ASME compliant).`,
    };
  } else if (deviationPercent <= 35) {
    return {
      compatible: false,
      marginal: true,
      message: `Thickness: Block ${blockThickness}mm outside ±25% limit but within 35% (marginal - review procedure).`,
    };
  } else {
    return {
      compatible: false,
      marginal: false,
      message: `Thickness: Block ${blockThickness}mm incompatible with part ${partThickness}mm (deviation ${deviationPercent.toFixed(1)}% > 25% limit).`,
    };
  }
}

/**
 * Get all blocks that could potentially work for a given diameter
 * (useful for showing options to user)
 */
export function getCompatibleShearWaveBlocks(
  part_od_mm: number,
  part_geometry: PartGeometry
): ShearWaveCalibrationBlock[] {
  if (part_od_mm > 500) {
    const flat = SHEAR_WAVE_MASTERS_MAP.get('SW_FLAT');
    return flat ? [flat] : [];
  }

  return SHEAR_WAVE_MASTERS.filter(block => {
    if (block.block_type === 'FLAT') return false;

    const inRange = part_od_mm >= block.Dpart_min_mm && part_od_mm <= block.Dpart_max_mm;
    const geometryOk = block.applicablePartTypes.includes(part_geometry);

    return inRange && geometryOk;
  });
}

// ============================================================================
// TUBE REFERENCE STANDARDS (±10% OD TOLERANCE)
// ============================================================================

/**
 * 8-Model Reference Standard Lookup Table for Tubes
 *
 * Based on shear wave calibration requirements where:
 * - OD tolerance: ±10% (part OD must be within ±10% of standard OD)
 * - Thickness tolerance: ±25% (same as ASME rule)
 *
 * Each model covers a specific OD range with no gaps.
 */
export interface TubeReferenceStandard {
  /** Model number (1-8) */
  model: number;
  /** Nominal reference standard OD in mm */
  nominal_od: number;
  /** Minimum part OD covered (nominal × 0.9) */
  min_od: number;
  /** Maximum part OD covered (nominal × 1.1) */
  max_od: number;
  /** Recommended block type */
  recommendedBlockType: 'curved' | 'flat';
  /** Alternative block type (requires Level III approval) */
  alternativeBlockType: 'curved' | 'flat';
}

export const TUBE_REFERENCE_STANDARDS_10PCT: TubeReferenceStandard[] = [
  { model: 1, nominal_od: 200, min_od: 180, max_od: 220, recommendedBlockType: 'curved', alternativeBlockType: 'flat' },
  { model: 2, nominal_od: 250, min_od: 225, max_od: 275, recommendedBlockType: 'curved', alternativeBlockType: 'flat' },
  { model: 3, nominal_od: 310, min_od: 279, max_od: 341, recommendedBlockType: 'curved', alternativeBlockType: 'flat' },
  { model: 4, nominal_od: 380, min_od: 342, max_od: 418, recommendedBlockType: 'curved', alternativeBlockType: 'flat' },
  { model: 5, nominal_od: 460, min_od: 418, max_od: 506, recommendedBlockType: 'curved', alternativeBlockType: 'flat' },
  { model: 6, nominal_od: 556, min_od: 506, max_od: 612, recommendedBlockType: 'flat', alternativeBlockType: 'curved' },
  { model: 7, nominal_od: 670, min_od: 603, max_od: 737, recommendedBlockType: 'flat', alternativeBlockType: 'curved' },
  { model: 8, nominal_od: 810, min_od: 729, max_od: 891, recommendedBlockType: 'flat', alternativeBlockType: 'curved' },
];

export interface TubeReferenceStandardSelection {
  /** Selected standard */
  standard: TubeReferenceStandard;
  /** Reasoning for selection */
  reasoning: string;
  /** Whether curved block is recommended (vs flat) */
  curvedRecommended: boolean;
  /** Whether flat block is available as alternative */
  flatAvailable: boolean;
  /** Level III approval required for alternative */
  alternativeRequiresLevel3: boolean;
}

/**
 * Select the appropriate tube reference standard based on part OD
 *
 * Algorithm:
 * 1. Find standard where: min_od ≤ part_od ≤ max_od
 * 2. If multiple matches, pick closest to nominal
 * 3. Determine recommended block type based on OD (curved for ≤500mm, flat for >500mm)
 *
 * @param partOD Part outer diameter in mm
 * @returns Selection result or null if no match found
 */
export function selectTubeReferenceStandard(partOD: number): TubeReferenceStandardSelection | null {
  // Find all matching standards
  const matches = TUBE_REFERENCE_STANDARDS_10PCT.filter(
    std => partOD >= std.min_od && partOD <= std.max_od
  );

  if (matches.length === 0) {
    return null;
  }

  // Pick the closest match to nominal
  let bestMatch = matches[0];
  let bestDiff = Math.abs(bestMatch.nominal_od - partOD);

  for (const match of matches) {
    const diff = Math.abs(match.nominal_od - partOD);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = match;
    }
  }

  // Determine block type recommendation
  const curvedRecommended = bestMatch.recommendedBlockType === 'curved';

  const reasoning = curvedRecommended
    ? `Part OD ${partOD}mm within ±10% of Model ${bestMatch.model} (${bestMatch.nominal_od}mm). Curved block recommended for OD ≤ 500mm.`
    : `Part OD ${partOD}mm within ±10% of Model ${bestMatch.model} (${bestMatch.nominal_od}mm). Flat block recommended for OD > 500mm (curvature negligible).`;

  return {
    standard: bestMatch,
    reasoning,
    curvedRecommended,
    flatAvailable: true,
    alternativeRequiresLevel3: true,
  };
}

/**
 * Get all tube reference standards that could apply for a given OD
 * (useful for showing options to user)
 */
export function getCompatibleTubeReferenceStandards(partOD: number): TubeReferenceStandard[] {
  return TUBE_REFERENCE_STANDARDS_10PCT.filter(
    std => partOD >= std.min_od && partOD <= std.max_od
  );
}
