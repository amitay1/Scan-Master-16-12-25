/**
 * Pratt & Whitney Approved Calibration Blocks
 *
 * Source: NDIP-1226 Section 2.1, NDIP-1227 Section 2.1
 */

export interface PWCalibrationBlock {
  partNumber: string;
  description: string;
  angleType: '45-degree' | '0-degree' | 'variable';
  fbhSize: number; // FBH number (1, 2, 3, etc.)
  holes: PWCalibrationHole[];
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
  };
  material: string;
  source: string;
  recertificationInterval: string;
  holderPartNumber?: string;
}

export interface PWCalibrationHole {
  id: string; // J, K, L, M, N, P, Q, R, S
  depth: number; // inches from sound entry surface
  diameter: number; // inches
  used: boolean; // Whether used in calibration
}

/**
 * IAE2P16675 - 45° Angle Calibration Block
 * Primary calibration standard for V2500 HPT disk inspection
 *
 * Contains #1 FBH at various depths incorporated into 45° angle side
 * Holes L through S are used (J & K omitted per NDIP Section 5.1.1.7.1)
 */
export const PW_ANGLE_CALIBRATION_BLOCK: PWCalibrationBlock = {
  partNumber: 'IAE2P16675',
  description: '45-degree Angle Calibration Block with #1 FBH',
  angleType: '45-degree',
  fbhSize: 1, // #1 FBH (1/64")
  material: 'Powdered Nickel equivalent',
  source: 'Pratt & Whitney MPE-NDE',
  recertificationInterval: 'Yearly at PW NDE',
  holderPartNumber: 'IAE2P16674', // Optional holder

  // Hole configuration from Figure 1 in NDIP
  holes: [
    { id: 'J', depth: 0.125, diameter: 0.015625, used: false }, // Omitted
    { id: 'K', depth: 0.188, diameter: 0.015625, used: false }, // Omitted
    { id: 'L', depth: 0.250, diameter: 0.015625, used: true },
    { id: 'M', depth: 0.375, diameter: 0.015625, used: true },
    { id: 'N', depth: 0.500, diameter: 0.015625, used: true },
    { id: 'P', depth: 0.625, diameter: 0.015625, used: true },
    { id: 'Q', depth: 0.750, diameter: 0.015625, used: true },
    { id: 'R', depth: 0.875, diameter: 0.015625, used: true },
    { id: 'S', depth: 1.000, diameter: 0.015625, used: true },
  ],

  // Block dimensions from Figure 1
  dimensions: {
    length: 8.0, // inches (±0.015)
    width: 2.479, // inches (±0.015)
    height: 1.085, // inches (±0.015)
  },
};

/**
 * Calibration Block Holder
 */
export const PW_CALIBRATION_BLOCK_HOLDER = {
  partNumber: 'IAE2P16674',
  description: '45-degree Calibration Block Holder',
  optional: true, // Per NDIP Section 2.2
};

/**
 * Get active calibration holes (used during calibration)
 */
export function getActiveCalibrationHoles(
  block: PWCalibrationBlock
): PWCalibrationHole[] {
  return block.holes.filter((hole) => hole.used);
}

/**
 * Calculate DAC points based on active holes
 */
export interface DACPoint {
  holeId: string;
  depth: number; // inches
  targetAmplitude: number; // %FSH
  gainOffset: number; // dB - calibration standard specific
}

export function generateDACPoints(
  block: PWCalibrationBlock,
  targetAmplitude: number = 80,
  curvatureCorrection: number = 0, // dB - supplied by PW per transducer/system
  blockGainOffset: number = 0 // dB - from calibration card
): DACPoint[] {
  const activeHoles = getActiveCalibrationHoles(block);

  return activeHoles.map((hole) => ({
    holeId: hole.id,
    depth: hole.depth,
    targetAmplitude,
    gainOffset: curvatureCorrection + blockGainOffset,
  }));
}

/**
 * Post-calibration verification
 * Per NDIP Section 5.1.5
 */
export interface PostCalibrationResult {
  passed: boolean;
  deviations: { holeId: string; deviation: number }[];
  action: 'none' | 'rescan_rejectable' | 'rescan_all';
}

export function verifyPostCalibration(
  measurements: { holeId: string; amplitudeDb: number }[],
  initialCalibrationDb: number,
  toleranceDb: number = 2.0
): PostCalibrationResult {
  const deviations = measurements.map((m) => ({
    holeId: m.holeId,
    deviation: m.amplitudeDb - initialCalibrationDb,
  }));

  const exceedsTolerance = deviations.some(
    (d) => Math.abs(d.deviation) > toleranceDb
  );
  const belowTolerance = deviations.some((d) => d.deviation < -toleranceDb);
  const aboveTolerance = deviations.some((d) => d.deviation > toleranceDb);

  let action: PostCalibrationResult['action'] = 'none';
  if (aboveTolerance) {
    // Section 5.1.5.1.1 - rescan surfaces with rejectable indications
    action = 'rescan_rejectable';
  } else if (belowTolerance) {
    // Section 5.1.5.1.2 - rescan all surfaces since last successful calibration
    action = 'rescan_all';
  }

  return {
    passed: !exceedsTolerance,
    deviations,
    action,
  };
}

/**
 * Post-calibration triggers
 * Per NDIP Section 5.1.5.3
 */
export const POST_CALIBRATION_TRIGGERS = [
  'Prior to shift change',
  'Prior to part number change',
  'Prior to transducer change',
  'Immediately following unexpected interruption (e.g., power outage)',
];
