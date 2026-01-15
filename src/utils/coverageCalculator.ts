/**
 * Smart Coverage Calculator
 * Physics-based calculations for UT scan coverage
 */

import type {
  CoverageInput,
  CoverageResult,
  DeadZone,
  BeamProfile,
  ProbeConfig,
  MaterialAcoustics,
  OptimizationOptions,
  OptimizationResult,
  PartDimensions,
} from "@/types/coverage";
import { MATERIAL_ACOUSTICS } from "@/types/coverage";

/**
 * Calculate near field distance (N)
 * N = D² × f / (4 × v) where:
 * - D = element diameter (mm)
 * - f = frequency (MHz)
 * - v = velocity (mm/μs = m/s / 1000)
 */
export function calculateNearField(
  diameter: number, // mm
  frequency: number, // MHz
  velocity: number = 5920 // m/s (default: steel)
): number {
  const velocityMmUs = velocity / 1000; // Convert to mm/μs
  return (diameter * diameter * frequency) / (4 * velocityMmUs);
}

/**
 * Calculate beam divergence half-angle (θ)
 * sin(θ) = 1.22 × λ / D where:
 * - λ = wavelength = v / f
 * - D = element diameter
 */
export function calculateBeamDivergence(
  diameter: number, // mm
  frequency: number, // MHz
  velocity: number = 5920 // m/s
): number {
  const wavelength = velocity / (frequency * 1000); // mm
  const sinTheta = (1.22 * wavelength) / diameter;
  // Clamp to valid range for arcsin
  const clampedSin = Math.min(Math.max(sinTheta, -1), 1);
  return Math.asin(clampedSin) * (180 / Math.PI); // Convert to degrees
}

/**
 * Calculate beam diameter at a specific depth
 * In far field: D_beam = D + 2 × depth × tan(θ)
 * In near field: D_beam ≈ D (approximately)
 */
export function calculateBeamDiameterAtDepth(
  probe: ProbeConfig,
  depth: number, // mm
  nearField: number // mm
): number {
  if (depth < nearField) {
    // In near field - beam diameter is approximately element diameter
    // but with some variation due to interference
    return probe.elementDiameter * (0.9 + 0.1 * (depth / nearField));
  } else {
    // In far field - beam spreads
    const divergenceRad = (probe.beamDivergence * Math.PI) / 180;
    return probe.elementDiameter + 2 * (depth - nearField) * Math.tan(divergenceRad);
  }
}

/**
 * Calculate relative sensitivity at a depth
 * Sensitivity drops in near field due to interference,
 * then decreases with distance in far field
 */
export function calculateSensitivityAtDepth(
  depth: number,
  nearField: number,
  focusDepth?: number // mm (for focused probes)
): number {
  if (focusDepth) {
    // Focused probe - peak sensitivity at focus
    const distFromFocus = Math.abs(depth - focusDepth);
    return Math.max(0.3, 1 - (distFromFocus / focusDepth) * 0.5);
  }

  if (depth < nearField * 0.2) {
    // Very close to surface - sensitivity issues
    return 0.6;
  } else if (depth < nearField) {
    // In near field - variable sensitivity
    return 0.7 + 0.3 * (depth / nearField);
  } else {
    // In far field - gradual decrease
    const relativeDepth = (depth - nearField) / nearField;
    return Math.max(0.3, 1 - relativeDepth * 0.1);
  }
}

/**
 * Generate beam profiles at multiple depths
 */
export function generateBeamProfiles(
  probe: ProbeConfig,
  maxDepth: number,
  stepSize: number = 1
): BeamProfile[] {
  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );

  const profiles: BeamProfile[] = [];
  for (let depth = stepSize; depth <= maxDepth; depth += stepSize) {
    profiles.push({
      depth,
      beamDiameter: calculateBeamDiameterAtDepth(probe, depth, nearField),
      sensitivity: calculateSensitivityAtDepth(depth, nearField, probe.focusDepth),
      inNearField: depth < nearField,
    });
  }

  return profiles;
}

/**
 * Calculate optimal scan index for coverage
 * Index should be ≤ beam diameter at deepest point × (1 - overlap/100)
 */
export function calculateOptimalIndex(
  probe: ProbeConfig,
  maxDepth: number,
  overlapPercent: number = 15 // 15% is typical
): number {
  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );

  const beamAtMaxDepth = calculateBeamDiameterAtDepth(probe, maxDepth, nearField);
  const overlapFactor = 1 - overlapPercent / 100;

  return beamAtMaxDepth * overlapFactor;
}

/**
 * Identify dead zones in the inspection
 */
export function identifyDeadZones(
  probe: ProbeConfig,
  dimensions: PartDimensions,
  waterPath?: number
): DeadZone[] {
  const deadZones: DeadZone[] = [];
  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );

  // Near-surface dead zone (front surface noise)
  const nearSurfaceDepth = waterPath
    ? 0.5 // Immersion has smaller dead zone
    : Math.min(3, nearField * 0.1); // Contact has larger dead zone

  deadZones.push({
    type: "near_surface",
    startDepth: 0,
    endDepth: nearSurfaceDepth,
    reason: waterPath
      ? "Front surface interface reflection"
      : "Near-surface resolution limit and front surface noise",
  });

  // Back wall dead zone
  const backWallDeadZone = Math.min(2, dimensions.thickness * 0.02);
  deadZones.push({
    type: "back_wall",
    startDepth: dimensions.thickness - backWallDeadZone,
    endDepth: dimensions.thickness,
    reason: "Back wall echo and interface effects",
  });

  // Edge effects for non-infinite surfaces
  if (dimensions.length && dimensions.width) {
    if (dimensions.length < probe.elementDiameter * 3 ||
        dimensions.width < probe.elementDiameter * 3) {
      deadZones.push({
        type: "edge",
        startDepth: 0,
        endDepth: dimensions.thickness,
        location: "Part edges",
        reason: "Edge effects - beam wrapping and mode conversion",
      });
    }
  }

  return deadZones;
}

/**
 * Generate 2D heatmap data for coverage visualization
 */
export function generateCoverageHeatmap(
  input: CoverageInput,
  resolution: { x: number; y: number } = { x: 1, y: 1 }
): { data: number[][]; xSize: number; ySize: number } {
  const { dimensions, probe, scanIndex } = input;
  const width = dimensions.width || dimensions.length || 100;
  const depth = dimensions.thickness;

  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );

  const xSteps = Math.ceil(width / resolution.x);
  const ySteps = Math.ceil(depth / resolution.y);

  const data: number[][] = [];

  // For each depth level
  for (let yi = 0; yi < ySteps; yi++) {
    const currentDepth = (yi + 0.5) * resolution.y;
    const beamDiameter = calculateBeamDiameterAtDepth(probe, currentDepth, nearField);
    const sensitivity = calculateSensitivityAtDepth(currentDepth, nearField, probe.focusDepth);

    const row: number[] = [];

    // For each x position, calculate coverage from all scan passes
    for (let xi = 0; xi < xSteps; xi++) {
      const xPos = (xi + 0.5) * resolution.x;

      // Find coverage from the nearest scan pass(es)
      let maxCoverage = 0;

      // Calculate number of passes
      const numPasses = Math.ceil(width / scanIndex);

      for (let pass = 0; pass < numPasses; pass++) {
        const passCenter = pass * scanIndex + scanIndex / 2;
        const distFromCenter = Math.abs(xPos - passCenter);

        // Coverage decreases with distance from beam center
        if (distFromCenter < beamDiameter / 2) {
          // Within beam - calculate coverage based on beam profile
          const relativePos = distFromCenter / (beamDiameter / 2);
          // Gaussian-like beam profile
          const beamCoverage = Math.exp(-2 * relativePos * relativePos);
          const totalCoverage = beamCoverage * sensitivity;
          maxCoverage = Math.max(maxCoverage, totalCoverage);
        }
      }

      row.push(maxCoverage);
    }

    data.push(row);
  }

  return { data, xSize: xSteps, ySize: ySteps };
}

/**
 * Main coverage calculation function
 */
export function calculateCoverage(input: CoverageInput): CoverageResult {
  const { dimensions, probe, scanIndex, scanSpeed } = input;
  const width = dimensions.width || dimensions.length || 100;
  const length = dimensions.length || dimensions.width || 100;

  // Calculate or use provided beam parameters
  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );

  const beamDivergence = probe.beamDivergence || calculateBeamDivergence(
    probe.elementDiameter,
    probe.frequency
  );

  // Generate beam profiles
  const beamProfiles = generateBeamProfiles(
    { ...probe, nearField, beamDivergence },
    dimensions.thickness
  );

  // Identify dead zones
  const deadZones = identifyDeadZones(
    { ...probe, nearField },
    dimensions,
    input.waterPath
  );

  // Calculate coverage heatmap
  const heatmapResult = generateCoverageHeatmap({
    ...input,
    probe: { ...probe, nearField, beamDivergence },
  });

  // Calculate overall coverage percentage
  let coveredCells = 0;
  let totalCells = 0;
  const minCoverageThreshold = 0.5; // 50% minimum intensity considered "covered"

  for (const row of heatmapResult.data) {
    for (const value of row) {
      totalCells++;
      if (value >= minCoverageThreshold) {
        coveredCells++;
      }
    }
  }

  const overallCoverage = (coveredCells / totalCells) * 100;

  // Calculate effective coverage (excluding dead zones)
  const deadZoneDepth = deadZones.reduce((sum, dz) => sum + (dz.endDepth - dz.startDepth), 0);
  const effectiveThickness = dimensions.thickness - deadZoneDepth;
  const effectiveCoverage = overallCoverage * (effectiveThickness / dimensions.thickness);

  // Calculate number of passes
  const numPasses = Math.ceil(width / scanIndex);

  // Calculate optimal index for this configuration
  const optimalIndex = calculateOptimalIndex(
    { ...probe, nearField, beamDivergence },
    dimensions.thickness,
    input.overlap || 15
  );

  // Calculate scan time if speed is provided
  let scanTime: number | undefined;
  if (scanSpeed) {
    const totalDistance = numPasses * length;
    scanTime = totalDistance / scanSpeed;
  }

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (scanIndex > optimalIndex * 1.5) {
    warnings.push(
      `Scan index (${scanIndex.toFixed(1)}mm) is significantly larger than optimal ` +
      `(${optimalIndex.toFixed(1)}mm). Coverage gaps likely.`
    );
  }

  if (dimensions.thickness > nearField * 4) {
    warnings.push(
      `Part thickness (${dimensions.thickness}mm) is very large compared to near field ` +
      `(${nearField.toFixed(1)}mm). Beam spread may cause sensitivity loss at depth.`
    );
    recommendations.push("Consider using a larger diameter transducer for improved depth penetration.");
  }

  if (overallCoverage < 100) {
    recommendations.push(
      `Reduce scan index to ${optimalIndex.toFixed(1)}mm or less to achieve 100% coverage.`
    );
  }

  if (probe.frequency > 10 && dimensions.thickness > 50) {
    recommendations.push(
      "High frequency may limit penetration depth. Consider lower frequency for thick parts."
    );
  }

  return {
    overallCoverage,
    effectiveCoverage,
    numPasses,
    optimalIndex,
    scanTime,
    deadZones,
    warnings,
    recommendations,
    beamProfileAtDepths: beamProfiles,
    heatmapData: heatmapResult.data,
    heatmapResolution: { xStep: 1, yStep: 1 },
  };
}

/**
 * Optimize scan parameters for target coverage
 */
export function optimizeForCoverage(
  input: CoverageInput,
  options: OptimizationOptions
): OptimizationResult {
  const { dimensions, probe } = input;
  const { targetCoverage, maxPasses, preferSpeed } = options;

  const nearField = probe.nearField || calculateNearField(
    probe.elementDiameter,
    probe.frequency
  );
  const beamDivergence = probe.beamDivergence || calculateBeamDivergence(
    probe.elementDiameter,
    probe.frequency
  );

  const updatedProbe = { ...probe, nearField, beamDivergence };

  // Try different overlaps to find optimal settings
  const overlaps = [10, 15, 20, 25, 30, 40, 50];
  let bestResult: OptimizationResult | null = null;

  for (const overlap of overlaps) {
    const optIndex = calculateOptimalIndex(updatedProbe, dimensions.thickness, overlap);
    const width = dimensions.width || dimensions.length || 100;
    const passCount = Math.ceil(width / optIndex);

    // Check if within constraints
    if (maxPasses && passCount > maxPasses) {
      continue;
    }

    // Calculate coverage with this configuration
    const result = calculateCoverage({
      ...input,
      scanIndex: optIndex,
      overlap,
      probe: updatedProbe,
    });

    if (result.overallCoverage >= targetCoverage) {
      const timeEstimate = input.scanSpeed
        ? (passCount * (dimensions.length || 100)) / input.scanSpeed
        : undefined;

      const candidate: OptimizationResult = {
        optimalIndex: optIndex,
        optimalOverlap: overlap,
        achievedCoverage: result.overallCoverage,
        passCount,
        timeEstimate,
        tradeoffs: [],
      };

      // If preferring speed, pick first valid solution (less overlap = faster)
      if (preferSpeed) {
        return candidate;
      }

      // Otherwise, prefer higher coverage
      if (!bestResult || result.overallCoverage > bestResult.achievedCoverage) {
        bestResult = candidate;
      }
    }
  }

  if (bestResult) {
    return bestResult;
  }

  // If no solution meets target, return best effort
  const defaultOverlap = 25;
  const defaultIndex = calculateOptimalIndex(updatedProbe, dimensions.thickness, defaultOverlap);
  const width = dimensions.width || dimensions.length || 100;

  return {
    optimalIndex: defaultIndex,
    optimalOverlap: defaultOverlap,
    achievedCoverage: calculateCoverage({
      ...input,
      scanIndex: defaultIndex,
      overlap: defaultOverlap,
      probe: updatedProbe,
    }).overallCoverage,
    passCount: Math.ceil(width / defaultIndex),
    tradeoffs: [
      `Target coverage of ${targetCoverage}% may not be achievable with current probe configuration.`,
      "Consider using a larger probe diameter or adjusting scan parameters.",
    ],
  };
}

/**
 * Quick helper to get recommended settings for a part
 */
export function getRecommendedSettings(
  partThickness: number,
  material: string = "steel",
  targetCoverage: number = 100
): {
  recommendedFrequency: number;
  recommendedDiameter: number;
  recommendedIndex: number;
  recommendedOverlap: number;
} {
  const acoustics = MATERIAL_ACOUSTICS[material] || MATERIAL_ACOUSTICS.steel;

  // Frequency selection based on thickness
  let recommendedFrequency: number;
  if (partThickness < 10) {
    recommendedFrequency = 10;
  } else if (partThickness < 25) {
    recommendedFrequency = 5;
  } else if (partThickness < 75) {
    recommendedFrequency = 2.25;
  } else {
    recommendedFrequency = 1;
  }

  // Diameter selection - larger for thicker parts
  let recommendedDiameter: number;
  if (partThickness < 15) {
    recommendedDiameter = 9.5;
  } else if (partThickness < 50) {
    recommendedDiameter = 12.7;
  } else {
    recommendedDiameter = 19.05;
  }

  // Calculate near field and optimal index
  const nearField = calculateNearField(
    recommendedDiameter,
    recommendedFrequency,
    acoustics.velocity
  );

  const beamDivergence = calculateBeamDivergence(
    recommendedDiameter,
    recommendedFrequency,
    acoustics.velocity
  );

  const recommendedOverlap = targetCoverage >= 100 ? 20 : 15;
  const recommendedIndex = calculateOptimalIndex(
    {
      frequency: recommendedFrequency,
      elementDiameter: recommendedDiameter,
      nearField,
      beamDivergence,
      beamType: "straight",
    },
    partThickness,
    recommendedOverlap
  );

  return {
    recommendedFrequency,
    recommendedDiameter,
    recommendedIndex: Math.round(recommendedIndex * 10) / 10, // Round to 0.1mm
    recommendedOverlap,
  };
}
