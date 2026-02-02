// @ts-nocheck
/**
 * DAC (Distance-Amplitude Correction) Calculator
 *
 * Generates DAC curves for ultrasonic inspection based on:
 * - Material properties (attenuation, velocity)
 * - Reference reflector characteristics (FBH size, depth)
 * - Equipment settings (frequency, gain)
 *
 * Also provides TCG (Time-Corrected Gain) conversion.
 *
 * Physics Reference:
 * - Distance law: 20 * log10(d2/d1)
 * - Material attenuation: α * Δd (dB/mm)
 * - Transfer correction: part-to-block amplitude difference
 */

import type {
  MaterialType,
  DACCurve,
  DACPoint,
  TCGCurve,
  TCGPoint,
} from '@/types/techniqueSheet';

// ============================================================================
// Material Attenuation Coefficients
// ============================================================================

/**
 * Material attenuation coefficients in dB/mm at 5 MHz
 * Values are approximate and should be verified for specific materials
 */
const MATERIAL_ATTENUATION: Record<MaterialType, number> = {
  aluminum: 0.002,        // Very low attenuation
  steel: 0.008,           // Low-medium attenuation
  stainless_steel: 0.015, // Higher due to grain structure
  titanium: 0.010,        // Medium attenuation
  magnesium: 0.004,       // Low attenuation
  custom: 0.010,          // Default for unknown materials
};

/**
 * Material acoustic velocities in m/s (longitudinal wave)
 */
const MATERIAL_VELOCITY: Record<MaterialType, number> = {
  aluminum: 6320,
  steel: 5920,
  stainless_steel: 5740,
  titanium: 6100,
  magnesium: 5770,
  custom: 5900,
};

/**
 * Frequency scaling factor for attenuation
 * Attenuation increases with frequency (approximately linear for metals)
 */
function getAttenuationAtFrequency(
  baseAttenuation: number,
  baseFrequency: number,
  targetFrequency: number
): number {
  return baseAttenuation * (targetFrequency / baseFrequency);
}

// ============================================================================
// DAC Curve Generation
// ============================================================================

export interface DACCalculatorInput {
  material: MaterialType;
  velocity?: number;              // Override material default (m/s)
  frequency: number;              // MHz
  fbhDiameters: string[];         // FBH sizes (e.g., "3/64", "5/64")
  depths: number[];               // Metal travel distances (mm)
  referenceDepth: number;         // Reference point depth (mm)
  referenceAmplitude: number;     // Reference amplitude (% FSH)
  referenceGain: number;          // Reference gain (dB)
  blockTransferCorrection?: number; // Block-to-part correction (dB)
}

export interface DACCalculatorOutput {
  curve: DACCurve;
  tcgCurve: TCGCurve;
  rawData: {
    depths: number[];
    amplitudes: number[];
    gains: number[];
  };
}

/**
 * Convert fractional FBH size to decimal inches
 */
function parseFBHSize(size: string): number {
  // Handle formats like "3/64", "5/64", "1/8", etc.
  if (size.includes('/')) {
    const [num, denom] = size.split('/').map(Number);
    return num / denom;
  }
  return parseFloat(size);
}

/**
 * Calculate amplitude at depth relative to reference
 * Using distance-squared law and material attenuation
 */
function calculateAmplitudeAtDepth(
  depth: number,
  referenceDepth: number,
  referenceAmplitude: number,
  attenuation: number // dB/mm
): { amplitude: number; gainCorrection: number } {
  if (depth <= 0) {
    return { amplitude: referenceAmplitude, gainCorrection: 0 };
  }

  // Distance law: amplitude decreases with square of distance
  // ΔdB = 20 * log10(d2/d1)
  const distanceLawdB = 20 * Math.log10(depth / referenceDepth);

  // Material attenuation: adds to loss over distance
  const attenuationLossdB = attenuation * Math.abs(depth - referenceDepth);

  // Total loss
  const totalLossdB = distanceLawdB + attenuationLossdB;

  // Calculate amplitude (inverse of loss in dB)
  // amplitude2 = amplitude1 * 10^(-loss/20)
  const amplitudeRatio = Math.pow(10, -totalLossdB / 20);
  const amplitude = referenceAmplitude * amplitudeRatio;

  // Gain correction needed to bring back to reference amplitude
  const gainCorrection = totalLossdB;

  return {
    amplitude: Math.max(0, Math.min(100, amplitude)),
    gainCorrection,
  };
}

/**
 * Generate DAC curve points
 */
export function calculateDACCurve(input: DACCalculatorInput): DACCalculatorOutput {
  const {
    material,
    velocity = MATERIAL_VELOCITY[material],
    frequency,
    fbhDiameters,
    depths,
    referenceDepth,
    referenceAmplitude,
    referenceGain,
    blockTransferCorrection = 0,
  } = input;

  // Get attenuation coefficient for this material and frequency
  const baseAttenuation = MATERIAL_ATTENUATION[material];
  const attenuation = getAttenuationAtFrequency(baseAttenuation, 5, frequency);

  // Sort depths
  const sortedDepths = [...depths].sort((a, b) => a - b);

  // Calculate DAC points
  const points: DACPoint[] = sortedDepths.map((depth, index) => {
    const { amplitude, gainCorrection } = calculateAmplitudeAtDepth(
      depth,
      referenceDepth,
      referenceAmplitude,
      attenuation
    );

    return {
      depth,
      amplitude,
      gain: referenceGain + gainCorrection + blockTransferCorrection,
      fbhSize: fbhDiameters[Math.min(index, fbhDiameters.length - 1)],
    };
  });

  // Generate equation string for documentation
  const equation = generateDACEquation(referenceDepth, referenceAmplitude, attenuation);

  // Build DAC curve object
  const curve: DACCurve = {
    id: `DAC-${Date.now()}`,
    name: `DAC ${material} ${frequency}MHz`,
    material,
    frequency,
    velocity,
    points,
    attenuation,
    transferCorrection: blockTransferCorrection,
    equation,
    recordingLevel: 50, // Default 50% DAC
    rejectionLevel: 100, // Default 100% DAC
  };

  // Generate TCG curve from DAC
  const tcgCurve = convertDACtoTCG(curve, 80); // 80% FSH target

  // Raw data for plotting
  const rawData = {
    depths: points.map((p) => p.depth),
    amplitudes: points.map((p) => p.amplitude),
    gains: points.map((p) => p.gain),
  };

  return { curve, tcgCurve, rawData };
}

/**
 * Generate DAC equation string for documentation
 */
function generateDACEquation(
  referenceDepth: number,
  referenceAmplitude: number,
  attenuation: number
): string {
  return `A(d) = ${referenceAmplitude.toFixed(1)} × (${referenceDepth.toFixed(1)}/d)² × 10^(-${attenuation.toFixed(4)} × |d - ${referenceDepth.toFixed(1)}| / 20)`;
}

// ============================================================================
// TCG (Time-Corrected Gain) Calculation
// ============================================================================

/**
 * Convert depth to time (μs)
 */
function depthToTime(depth: number, velocity: number): number {
  // Round trip time: t = 2d/v
  return (2 * depth * 1000) / velocity; // Convert m/s to mm/μs
}

/**
 * Convert DAC curve to TCG curve
 */
export function convertDACtoTCG(
  dacCurve: DACCurve,
  targetAmplitude: number = 80
): TCGCurve {
  const { points, velocity, id } = dacCurve;

  // Calculate gain adjustments to achieve target amplitude
  const tcgPoints: TCGPoint[] = points.map((point) => {
    const time = depthToTime(point.depth, velocity);

    // Gain needed to bring amplitude to target
    // ΔG = 20 * log10(target/actual)
    const gainAdjustment =
      point.amplitude > 0
        ? 20 * Math.log10(targetAmplitude / point.amplitude)
        : 0;

    return {
      time,
      gain: gainAdjustment,
    };
  });

  // Calculate gate range
  const gateStart = tcgPoints.length > 0 ? tcgPoints[0].time : 0;
  const gateEnd =
    tcgPoints.length > 0 ? tcgPoints[tcgPoints.length - 1].time : 100;

  // Total correction range
  const totalCorrection =
    tcgPoints.length > 0
      ? tcgPoints[tcgPoints.length - 1].gain - tcgPoints[0].gain
      : 0;

  return {
    id: `TCG-${Date.now()}`,
    basedOnDAC: id,
    targetAmplitude,
    points: tcgPoints,
    gateStart,
    gateEnd,
    totalCorrection,
  };
}

// ============================================================================
// Interpolation Utilities
// ============================================================================

/**
 * Interpolate DAC amplitude at any depth
 */
export function interpolateDACAmplitude(curve: DACCurve, depth: number): number {
  const { points } = curve;

  if (points.length === 0) return 0;
  if (depth <= points[0].depth) return points[0].amplitude;
  if (depth >= points[points.length - 1].depth) {
    return points[points.length - 1].amplitude;
  }

  // Find bracketing points
  for (let i = 0; i < points.length - 1; i++) {
    if (depth >= points[i].depth && depth <= points[i + 1].depth) {
      // Linear interpolation
      const t =
        (depth - points[i].depth) / (points[i + 1].depth - points[i].depth);
      return points[i].amplitude + t * (points[i + 1].amplitude - points[i].amplitude);
    }
  }

  return points[points.length - 1].amplitude;
}

/**
 * Interpolate TCG gain at any time
 */
export function interpolateTCGGain(curve: TCGCurve, time: number): number {
  const { points } = curve;

  if (points.length === 0) return 0;
  if (time <= points[0].time) return points[0].gain;
  if (time >= points[points.length - 1].time) {
    return points[points.length - 1].gain;
  }

  // Find bracketing points
  for (let i = 0; i < points.length - 1; i++) {
    if (time >= points[i].time && time <= points[i + 1].time) {
      const t = (time - points[i].time) / (points[i + 1].time - points[i].time);
      return points[i].gain + t * (points[i + 1].gain - points[i].gain);
    }
  }

  return points[points.length - 1].gain;
}

// ============================================================================
// Evaluation Utilities
// ============================================================================

/**
 * Evaluate an indication against DAC
 * Returns indication amplitude as % of DAC
 */
export function evaluateAgainstDAC(
  curve: DACCurve,
  indicationDepth: number,
  indicationAmplitude: number
): {
  percentDAC: number;
  isAcceptable: boolean;
  isRecordable: boolean;
} {
  const dacAmplitude = interpolateDACAmplitude(curve, indicationDepth);

  if (dacAmplitude === 0) {
    return { percentDAC: 0, isAcceptable: true, isRecordable: false };
  }

  const percentDAC = (indicationAmplitude / dacAmplitude) * 100;

  return {
    percentDAC,
    isAcceptable: percentDAC <= curve.rejectionLevel,
    isRecordable: percentDAC >= curve.recordingLevel,
  };
}

// ============================================================================
// Standard DAC Configurations
// ============================================================================

/**
 * Generate standard DAC for AMS-STD-2154
 */
export function generateAMSDAC(
  material: MaterialType,
  frequency: number,
  thickness: number
): DACCalculatorOutput {
  // AMS standard depths: T, T/2, and optional 3T/4
  const depths: number[] = [];

  if (thickness <= 25) {
    depths.push(thickness / 2, thickness);
  } else if (thickness <= 75) {
    depths.push(thickness / 4, thickness / 2, (3 * thickness) / 4, thickness);
  } else {
    depths.push(
      thickness / 4,
      thickness / 2,
      (3 * thickness) / 4,
      thickness,
      thickness + thickness / 2
    );
  }

  // Standard FBH sizes per AMS Table VI
  const fbhSizes = getFBHSizesForThickness(thickness);

  return calculateDACCurve({
    material,
    frequency,
    fbhDiameters: fbhSizes,
    depths,
    referenceDepth: thickness / 2,
    referenceAmplitude: 80,
    referenceGain: 0,
  });
}

/**
 * Get FBH sizes based on thickness (simplified AMS Table VI)
 */
function getFBHSizesForThickness(thickness: number): string[] {
  if (thickness <= 12.7) {
    return ['1/64', '2/64', '3/64'];
  } else if (thickness <= 25.4) {
    return ['2/64', '3/64', '4/64'];
  } else if (thickness <= 50.8) {
    return ['3/64', '4/64', '5/64'];
  } else if (thickness <= 76.2) {
    return ['4/64', '5/64', '6/64'];
  } else {
    return ['5/64', '6/64', '8/64'];
  }
}

// ============================================================================
// Export Default Presets
// ============================================================================

export const DAC_PRESETS = {
  'AMS-STD-2154E': generateAMSDAC,
};

export {
  MATERIAL_ATTENUATION,
  MATERIAL_VELOCITY,
  parseFBHSize,
  depthToTime,
};
