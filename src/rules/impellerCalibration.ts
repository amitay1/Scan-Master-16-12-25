/**
 * Impeller and Blisk Calibration Standards
 *
 * Industry-standard calibration requirements for aerospace rotating components.
 * Based on:
 * - AMS-STD-2154 Class AAA (aerospace)
 * - PW NDIP-1226/1227 (V2500 HPT)
 * - GE C26 (commercial)
 * - RR RRES 90061 (Rolls-Royce)
 * - ASTM E2375 (general forging inspection)
 *
 * Impeller Geometry:
 * - Hub: Central bore region (typically 30% of OD), full height
 * - Web: Intermediate region (30-60% of OD), reduced height (~60%)
 * - Rim: Outer region (60-100% of OD), minimum height (~30%)
 *
 * Critical areas: Bore ID surface, web transitions, fillet radii
 */

// ============================================================================
// IMPELLER ZONE DEFINITIONS
// ============================================================================

export interface ImpellerZone {
  id: string;
  name: string;
  radiusRatioMin: number; // Fraction of OD (0-1)
  radiusRatioMax: number;
  heightRatio: number;    // Fraction of total height (0-1)
  criticality: 'extreme' | 'high' | 'medium';
  inspectionMethod: string;
  notes: string;
}

/**
 * Standard impeller zones per aerospace industry practice
 */
export const IMPELLER_ZONES: ImpellerZone[] = [
  {
    id: 'hub',
    name: 'Hub (Bore Region)',
    radiusRatioMin: 0,
    radiusRatioMax: 0.30,
    heightRatio: 1.0,
    criticality: 'extreme',
    inspectionMethod: 'Circumferential shear wave 45° from bore ID',
    notes: 'Highest stress concentration. 100% coverage required. Use cylinder notched block.'
  },
  {
    id: 'web',
    name: 'Web (Intermediate)',
    radiusRatioMin: 0.30,
    radiusRatioMax: 0.60,
    heightRatio: 0.6,
    criticality: 'high',
    inspectionMethod: 'Radial straight beam from OD + axial from faces',
    notes: 'Transition region. Check fillet radii. May need angle beam for web roots.'
  },
  {
    id: 'rim',
    name: 'Rim (Outer)',
    radiusRatioMin: 0.60,
    radiusRatioMax: 1.0,
    heightRatio: 0.3,
    criticality: 'medium',
    inspectionMethod: 'Radial straight beam from OD + circumferential',
    notes: 'Thinnest section. Blade attachment features if present.'
  }
];

/**
 * Blisk-specific zones (in addition to impeller zones)
 */
export const BLISK_ZONES: ImpellerZone[] = [
  ...IMPELLER_ZONES,
  {
    id: 'blade_root',
    name: 'Blade Root Fillet',
    radiusRatioMin: 1.0,
    radiusRatioMax: 1.15, // Blade extends beyond disk OD
    heightRatio: 0.25,
    criticality: 'extreme',
    inspectionMethod: 'Focused beam 5-10 MHz, multi-angle',
    notes: 'CRITICAL: Highest stress in entire component. Requires specialized focused probes.'
  },
  {
    id: 'blade_body',
    name: 'Blade Airfoil',
    radiusRatioMin: 1.0,
    radiusRatioMax: 1.5, // Full blade extent
    heightRatio: 0.1,
    criticality: 'high',
    inspectionMethod: 'Through-transmission or pitch-catch',
    notes: 'Thin airfoil section. Surface wave techniques may be required.'
  }
];

// ============================================================================
// FBH REFERENCE STANDARDS
// ============================================================================

export interface FBHHoleSpec {
  id: string;
  depthInches: number;
  depthMm: number;
  diameterNumber: number; // #1, #2, #3, etc.
  diameterInches: number;
  diameterMm: number;
  used: boolean;
  purpose: string;
}

/**
 * Convert FBH number to diameter in inches and mm
 * FBH # = diameter in 64ths of an inch
 * #1 = 1/64" = 0.015625" = 0.39688mm
 * #2 = 2/64" = 0.03125" = 0.79375mm
 */
export function fbhNumberToDiameter(fbhNumber: number): { inches: number; mm: number } {
  const inches = fbhNumber / 64;
  const mm = inches * 25.4;
  return { inches, mm };
}

/**
 * Industry-standard FBH hole configuration for impeller bore blocks
 * Based on PW IAE2P16675 and similar aerospace standards
 */
export const IMPELLER_BORE_FBH_HOLES: FBHHoleSpec[] = [
  // Shallow holes (often omitted for impellers due to near-surface dead zone)
  { id: 'J', depthInches: 0.125, depthMm: 3.175, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: false, purpose: 'Near-surface (often omitted)' },
  { id: 'K', depthInches: 0.188, depthMm: 4.775, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: false, purpose: 'Near-surface (often omitted)' },

  // Active calibration holes
  { id: 'L', depthInches: 0.250, depthMm: 6.35, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 1' },
  { id: 'M', depthInches: 0.375, depthMm: 9.525, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 2' },
  { id: 'N', depthInches: 0.500, depthMm: 12.7, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 3' },
  { id: 'P', depthInches: 0.625, depthMm: 15.875, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 4' },
  { id: 'Q', depthInches: 0.750, depthMm: 19.05, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 5' },
  { id: 'R', depthInches: 0.875, depthMm: 22.225, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 6' },
  { id: 'S', depthInches: 1.000, depthMm: 25.4, diameterNumber: 1, diameterInches: 0.015625, diameterMm: 0.39688, used: true, purpose: 'DAC point 7 (deepest)' }
];

/**
 * Get active FBH holes for calibration
 */
export function getActiveFBHHoles(): FBHHoleSpec[] {
  return IMPELLER_BORE_FBH_HOLES.filter(h => h.used);
}

// ============================================================================
// CALIBRATION BLOCK SPECIFICATIONS
// ============================================================================

export interface ImpellerCalibrationBlock {
  type: 'angle_beam' | 'straight_beam' | 'combined';
  category: 'cylinder_notched' | 'flat_fbh' | 'curved_fbh';
  angleType: number; // degrees (0 for straight beam, 45 for typical angle)
  fbhSize: number;   // FBH number
  material: string;
  applicableZones: string[];
  holes: FBHHoleSpec[];
  standard: string;
  notes: string;
}

/**
 * Generic 45° angle beam calibration block for impeller bores
 * Acoustic equivalent to powdered nickel (Inconel 718/Waspaloy)
 */
export const IMPELLER_BORE_ANGLE_BLOCK: ImpellerCalibrationBlock = {
  type: 'angle_beam',
  category: 'cylinder_notched',
  angleType: 45,
  fbhSize: 1,
  material: 'Powdered Nickel equivalent (IN718 acoustic properties)',
  applicableZones: ['hub', 'web'],
  holes: IMPELLER_BORE_FBH_HOLES,
  standard: 'AMS-STD-2154 Class AAA / ASTM E2375 Figure 5',
  notes: 'Primary block for bore inspection. 45° circumferential shear wave.'
};

/**
 * Flat FBH block for web and rim straight beam inspection
 */
export const IMPELLER_BODY_FLAT_BLOCK: ImpellerCalibrationBlock = {
  type: 'straight_beam',
  category: 'flat_fbh',
  angleType: 0,
  fbhSize: 3, // Larger holes for thicker sections
  material: 'Acoustic equivalent to inspection material',
  applicableZones: ['web', 'rim'],
  holes: [
    { id: 'A', depthInches: 0.25, depthMm: 6.35, diameterNumber: 3, diameterInches: 0.046875, diameterMm: 1.19, used: true, purpose: 'DAC near-surface' },
    { id: 'B', depthInches: 0.50, depthMm: 12.7, diameterNumber: 3, diameterInches: 0.046875, diameterMm: 1.19, used: true, purpose: 'DAC mid-depth' },
    { id: 'C', depthInches: 1.00, depthMm: 25.4, diameterNumber: 3, diameterInches: 0.046875, diameterMm: 1.19, used: true, purpose: 'DAC full-depth' },
    { id: 'D', depthInches: 1.50, depthMm: 38.1, diameterNumber: 3, diameterInches: 0.046875, diameterMm: 1.19, used: true, purpose: 'DAC extended' }
  ],
  standard: 'AMS-STD-2154 Class AAA / ASTM E127 Figure 4',
  notes: 'For radial/axial straight beam inspection of web and rim sections.'
};

// ============================================================================
// SCAN PARAMETERS
// ============================================================================

export interface ImpellerScanParameters {
  zone: string;
  waveType: 'shear' | 'longitudinal';
  refractedAngle: number; // degrees
  scanIncrement: number;  // mm
  indexIncrement: number; // mm per revolution
  waterPath?: number;     // mm (immersion only)
  targetAmplitude: number; // %FSH
  tolerance: number;       // dB
  notes: string;
}

/**
 * Standard scan parameters for impeller inspection
 * Based on aerospace best practices (PW, GE, RR)
 */
export const IMPELLER_SCAN_PARAMETERS: ImpellerScanParameters[] = [
  {
    zone: 'hub',
    waveType: 'shear',
    refractedAngle: 45,
    scanIncrement: 0.508, // 0.020" = 0.508mm
    indexIncrement: 0.508,
    waterPath: 203.2, // 8" = 203.2mm
    targetAmplitude: 80,
    tolerance: 1.0,
    notes: 'Circumferential shear wave. ±45° directions required for full coverage.'
  },
  {
    zone: 'web',
    waveType: 'longitudinal',
    refractedAngle: 0,
    scanIncrement: 1.0,
    indexIncrement: 1.0,
    waterPath: 76.2, // 3" typical
    targetAmplitude: 80,
    tolerance: 2.0,
    notes: 'Straight beam from flat faces. Axial and radial coverage.'
  },
  {
    zone: 'rim',
    waveType: 'longitudinal',
    refractedAngle: 0,
    scanIncrement: 0.5,
    indexIncrement: 0.5,
    waterPath: 50.8, // 2" typical for thin rim
    targetAmplitude: 80,
    tolerance: 2.0,
    notes: 'Straight beam from circumference. High frequency for thin section.'
  }
];

// ============================================================================
// REJECTION CRITERIA
// ============================================================================

export interface ImpellerRejectionCriteria {
  standard: string;
  acceptanceClass: string;
  amplitudeCriteria: {
    minPixelGrouping: number;
    calibrationAmplitude: number; // %FSH
    rejectThreshold: number;      // %FSH
    evaluationThreshold: number;  // %FSH
    depthTolerance: number;       // mm
  };
  tofCriteria: {
    minPixelGrouping: number;
    minAdjacentScanLines: number;
    snrThreshold: number;
    lowNoiseThreshold: number;   // %FSH
    lowNoiseRejectionLevel: number; // %FSH
  };
  disposition: string;
}

/**
 * AMS-STD-2154 Class AAA rejection criteria for impeller/blisk
 * Most stringent aerospace requirements
 */
export const IMPELLER_CLASS_AAA_CRITERIA: ImpellerRejectionCriteria = {
  standard: 'AMS-STD-2154 Class AAA',
  acceptanceClass: 'AAA',
  amplitudeCriteria: {
    minPixelGrouping: 3,
    calibrationAmplitude: 80,   // #1 FBH at 80%FSH
    rejectThreshold: 20,        // 25% of calibration (20%FSH)
    evaluationThreshold: 15,    // ~19% of calibration
    depthTolerance: 0.635       // 0.025" = 0.635mm
  },
  tofCriteria: {
    minPixelGrouping: 15,
    minAdjacentScanLines: 3,
    snrThreshold: 1.5,          // SNR ≥ 1.5:1
    lowNoiseThreshold: 5.0,     // %FSH
    lowNoiseRejectionLevel: 7.5 // %FSH
  },
  disposition: 'Rejectable parts must be returned to OEM for disposition'
};

// ============================================================================
// MATERIAL VELOCITY DATABASE (for Snell's Law calculations)
// ============================================================================

export interface ImpellerMaterialVelocity {
  name: string;
  specification: string;
  longitudinal: number; // m/s
  shear: number;        // m/s
  density: number;      // kg/m³
  acousticImpedance: number; // MRayl
  typical_use: string;
}

/**
 * Acoustic properties for common impeller/blisk materials
 * Values from ASM Handbook, ASTM E1065, and OEM calibration standards
 */
export const IMPELLER_MATERIAL_VELOCITIES: Record<string, ImpellerMaterialVelocity> = {
  'inconel_718': {
    name: 'Inconel 718',
    specification: 'AMS 5662/5663',
    longitudinal: 5840,
    shear: 3020,
    density: 8192,
    acousticImpedance: 47.8,
    typical_use: 'HPT disks, compressor impellers'
  },
  'waspaloy': {
    name: 'Waspaloy',
    specification: 'AMS 5544',
    longitudinal: 5800,
    shear: 3010,
    density: 8190,
    acousticImpedance: 47.5,
    typical_use: 'Turbine disks, high-temp components'
  },
  'powdered_nickel': {
    name: 'Powdered Nickel (PM)',
    specification: 'Various (OEM specific)',
    longitudinal: 5750,
    shear: 3000,
    density: 8100,
    acousticImpedance: 46.6,
    typical_use: 'HPT disks (near-net shape)'
  },
  'inconel_625': {
    name: 'Inconel 625',
    specification: 'AMS 5666',
    longitudinal: 5820,
    shear: 3050,
    density: 8440,
    acousticImpedance: 49.1,
    typical_use: 'Combustor components, casings'
  },
  'rene_41': {
    name: 'René 41',
    specification: 'AMS 5545',
    longitudinal: 5790,
    shear: 3040,
    density: 8250,
    acousticImpedance: 47.8,
    typical_use: 'Turbine components'
  },
  'ti_6al_4v': {
    name: 'Ti-6Al-4V',
    specification: 'AMS 4928',
    longitudinal: 6100,
    shear: 3120,
    density: 4430,
    acousticImpedance: 27.0,
    typical_use: 'Fan blades, compressor disks'
  },
  'ti_17': {
    name: 'Ti-17 (Ti-5Al-2Sn-2Zr-4Mo-4Cr)',
    specification: 'AMS 4995',
    longitudinal: 6050,
    shear: 3100,
    density: 4650,
    acousticImpedance: 28.1,
    typical_use: 'Compressor disks, fan hubs'
  }
};

/**
 * Calculate incident angle for water-to-metal shear wave
 * Using Snell's Law: sin(θi)/sin(θr) = V1/V2
 */
export function calculateIncidentAngle(
  targetRefractedAngle: number,
  materialShearVelocity: number,
  waterVelocity: number = 1480
): number {
  const refractedRad = (targetRefractedAngle * Math.PI) / 180;
  const sinIncident = (Math.sin(refractedRad) * waterVelocity) / materialShearVelocity;

  if (sinIncident > 1) {
    throw new Error(`Cannot achieve ${targetRefractedAngle}° refracted angle - exceeds critical angle`);
  }

  const incidentRad = Math.asin(sinIncident);
  return (incidentRad * 180) / Math.PI;
}

/**
 * Calculate critical angles for a material
 */
export function calculateCriticalAngles(
  materialLongitudinal: number,
  materialShear: number,
  waterVelocity: number = 1480
): { firstCritical: number; secondCritical: number } {
  // First critical angle: longitudinal wave in material
  const sinFirst = waterVelocity / materialLongitudinal;
  const firstCritical = sinFirst <= 1 ? Math.asin(sinFirst) * (180 / Math.PI) : 90;

  // Second critical angle: shear wave in material
  const sinSecond = waterVelocity / materialShear;
  const secondCritical = sinSecond <= 1 ? Math.asin(sinSecond) * (180 / Math.PI) : 90;

  return { firstCritical, secondCritical };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get recommended calibration block for impeller/blisk based on zone
 */
export function getImpellerCalibrationBlock(
  zone: 'hub' | 'web' | 'rim' | 'blade_root' | 'all'
): ImpellerCalibrationBlock {
  if (zone === 'hub' || zone === 'blade_root') {
    return IMPELLER_BORE_ANGLE_BLOCK;
  }
  return IMPELLER_BODY_FLAT_BLOCK;
}

/**
 * Get scan parameters for a specific zone
 */
export function getZoneScanParameters(zone: string): ImpellerScanParameters | undefined {
  return IMPELLER_SCAN_PARAMETERS.find(p => p.zone === zone);
}

/**
 * Calculate impeller zone dimensions based on OD
 */
export function calculateImpellerZones(outerDiameter: number, thickness: number): {
  hub: { radiusMin: number; radiusMax: number; height: number };
  web: { radiusMin: number; radiusMax: number; height: number };
  rim: { radiusMin: number; radiusMax: number; height: number };
} {
  return {
    hub: {
      radiusMin: 0,
      radiusMax: outerDiameter * 0.15, // Hub is 30% of OD diameter, so 15% of OD radius
      height: thickness
    },
    web: {
      radiusMin: outerDiameter * 0.15,
      radiusMax: outerDiameter * 0.30, // Web is 30-60% of OD diameter
      height: thickness * 0.6
    },
    rim: {
      radiusMin: outerDiameter * 0.30,
      radiusMax: outerDiameter * 0.50, // Rim is 60-100% of OD diameter
      height: thickness * 0.3
    }
  };
}

/**
 * Generate calibration recommendation for impeller
 */
export function generateImpellerCalibrationRecommendation(
  outerDiameter: number,
  thickness: number,
  material: string,
  hasBore: boolean
): {
  primaryBlock: string;
  alternativeBlock?: string;
  zones: string[];
  warnings: string[];
  notes: string[];
} {
  const warnings: string[] = [];
  const notes: string[] = [];
  const zones: string[] = ['hub', 'web', 'rim'];

  // Primary recommendation
  let primaryBlock = 'flat_fbh';
  let alternativeBlock: string | undefined;

  if (hasBore) {
    primaryBlock = 'cylinder_notched';
    alternativeBlock = 'flat_fbh';
    notes.push('Bore inspection requires 45° angle beam with cylinder notched block (Figure 5)');
    notes.push('Web and rim can use flat FBH block (Figure 4) for straight beam');
  }

  // Material-specific warnings
  const materialLower = material.toLowerCase();
  if (materialLower.includes('nickel') || materialLower.includes('inconel') || materialLower.includes('waspaloy')) {
    notes.push('Nickel superalloy: Use acoustic equivalent calibration block (IN718 or PM Nickel)');
  }
  if (materialLower.includes('titanium') || materialLower.includes('ti-')) {
    warnings.push('Titanium: Higher attenuation - may require frequency adjustment');
    notes.push('Consider dual-frequency approach: 5 MHz for near-surface, 2.25 MHz for full penetration');
  }

  // Geometry warnings
  if (outerDiameter > 500) {
    warnings.push('Large impeller (>500mm OD): Ensure calibration block covers full sound path range');
  }
  if (thickness > 100) {
    warnings.push('Thick impeller (>100mm): Multi-zone gate settings required');
    notes.push('Hub zone requires full-depth coverage with DAC');
  }

  // Standard compliance
  notes.push('Class AAA per AMS-STD-2154 recommended for all aerospace impellers/blisks');
  notes.push('Rejection threshold: 20% FSH (25% of 80% FSH calibration)');

  return {
    primaryBlock,
    alternativeBlock,
    zones,
    warnings,
    notes
  };
}
