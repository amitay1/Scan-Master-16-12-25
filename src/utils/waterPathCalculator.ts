/**
 * Water Path Calculator for Immersion UT
 *
 * Calculates the optimal water path (distance from transducer face to part surface)
 * based on the near-field distance in water.
 *
 * Formula:
 *   N_water = D² × f / (4 × V_water_mm_us)
 *   Recommended WP = 1.25 × N_water  (midpoint of 1.0–1.5× range)
 *   Max WP = thickness × (V_water / V_material)  (avoid 2nd water-echo overlap)
 *
 * References: AMS-STD-2154, general immersion UT best practice.
 */

/** Longitudinal velocity of sound in water at ~20 °C (m/s) */
const V_WATER = 1480;
/** Same value in mm/μs (convenient for near-field formula) */
const V_WATER_MM_US = V_WATER / 1000; // 1.48

export interface WaterPathInput {
  /** Transducer element diameter in mm */
  transducerDiameter: number;
  /** Frequency in MHz */
  frequency: number;
  /** Part thickness in mm */
  partThickness: number;
  /** Longitudinal acoustic velocity of the material in m/s */
  materialVelocity?: number;
}

export interface WaterPathResult {
  /** Recommended water path in mm */
  recommended: number;
  /** Minimum water path (1× near field in water) */
  min: number;
  /** Maximum water path (1.5× near field, capped by echo constraint) */
  max: number;
  /** Near-field distance in water in mm */
  nearFieldWater: number;
  /** Human-readable reasoning */
  reasoning: string;
}

/**
 * Calculate optimal water path for immersion UT.
 * Returns null if any required input is missing or invalid.
 */
export function calculateWaterPath(input: WaterPathInput): WaterPathResult | null {
  const { transducerDiameter: D, frequency: f, partThickness: t, materialVelocity } = input;

  // Validate required inputs
  if (!D || D <= 0 || !f || f <= 0 || !t || t <= 0) {
    return null;
  }

  // Near-field distance in water: N = D² × f / (4 × V)
  const nearFieldWater = (D * D * f) / (4 * V_WATER_MM_US);

  // Recommended range: 1.0N – 1.5N
  const wpMin = nearFieldWater;
  const wpRecommended = 1.25 * nearFieldWater;
  let wpMax = 1.5 * nearFieldWater;

  // Upper-bound: avoid second water echo overlapping the first back-wall echo
  // Condition: WP < thickness × (V_water / V_material)
  let reasoning = `Near field in water = ${nearFieldWater.toFixed(1)}mm. Recommended range: ${wpMin.toFixed(1)}–${wpMax.toFixed(1)}mm.`;

  if (materialVelocity && materialVelocity > 0) {
    const echoLimit = t * (V_WATER / materialVelocity);
    if (echoLimit < wpMax) {
      wpMax = echoLimit;
      reasoning += ` Capped at ${echoLimit.toFixed(1)}mm to avoid water-echo overlap.`;
    }
  }

  // Final recommended value clamped within valid range
  const recommended = Math.min(Math.max(wpRecommended, wpMin), wpMax);

  return {
    recommended: Math.round(recommended * 10) / 10, // round to 0.1mm
    min: Math.round(wpMin * 10) / 10,
    max: Math.round(wpMax * 10) / 10,
    nearFieldWater: Math.round(nearFieldWater * 10) / 10,
    reasoning,
  };
}
