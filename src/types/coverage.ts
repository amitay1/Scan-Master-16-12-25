/**
 * Smart Coverage Calculator Types
 */

// Part geometry types
export type PartGeometryType =
  | "flat_plate"
  | "cylinder"
  | "tube"
  | "curved_surface"
  | "complex";

// Beam type
export type BeamType = "straight" | "angle_45" | "angle_60" | "angle_70";

// Probe configuration
export interface ProbeConfig {
  frequency: number; // MHz
  elementDiameter: number; // mm
  nearField: number; // mm (N)
  beamDivergence: number; // degrees (half angle)
  beamType: BeamType;
  focusDepth?: number; // mm (for focused probes)
}

// Part dimensions
export interface PartDimensions {
  thickness: number; // mm
  length?: number; // mm
  width?: number; // mm
  outerDiameter?: number; // mm (for cylinders/tubes)
  innerDiameter?: number; // mm (for tubes)
  curvatureRadius?: number; // mm (for curved surfaces)
}

// Coverage input parameters
export interface CoverageInput {
  partGeometry: PartGeometryType;
  dimensions: PartDimensions;
  probe: ProbeConfig;
  scanIndex: number; // mm (distance between scan passes)
  scanSpeed?: number; // mm/s
  waterPath?: number; // mm (for immersion)
  overlap?: number; // percentage (0-100)
}

// Dead zone info
export interface DeadZone {
  type: "near_surface" | "back_wall" | "edge" | "shadow" | "beam_spread";
  startDepth: number; // mm
  endDepth: number; // mm
  location?: string; // description
  reason: string;
}

// Coverage result
export interface CoverageResult {
  overallCoverage: number; // percentage (0-100)
  effectiveCoverage: number; // percentage excluding dead zones
  numPasses: number; // number of scan passes required
  optimalIndex: number; // recommended scan index in mm
  scanTime?: number; // estimated time in seconds
  deadZones: DeadZone[];
  warnings: string[];
  recommendations: string[];

  // Beam geometry at depth
  beamProfileAtDepths: BeamProfile[];

  // Heatmap data for visualization
  heatmapData: number[][]; // 2D array of coverage values (0-1)
  heatmapResolution: {
    xStep: number; // mm per pixel
    yStep: number; // mm per pixel (depth)
  };
}

// Beam profile at a specific depth
export interface BeamProfile {
  depth: number; // mm
  beamDiameter: number; // mm (effective beam width at this depth)
  sensitivity: number; // relative sensitivity (1.0 at focus)
  inNearField: boolean;
}

// Material acoustic properties (affects beam calculations)
export interface MaterialAcoustics {
  velocity: number; // m/s (longitudinal wave velocity)
  attenuationCoeff?: number; // dB/mm/MHz
  scatterFactor?: number; // 0-1 (grain scatter contribution)
}

// Common probe presets
export interface ProbePreset {
  id: string;
  name: string;
  frequency: number;
  diameter: number;
  type: "contact" | "immersion" | "delay_line";
  beamType: BeamType;
}

// Coverage optimization options
export interface OptimizationOptions {
  targetCoverage: number; // target percentage (e.g., 100)
  maxPasses?: number; // maximum allowed passes
  preferSpeed?: boolean; // optimize for faster scanning
  includeNearSurface?: boolean; // include near-surface zone in coverage
  minSensitivity?: number; // minimum relative sensitivity required
}

// Optimization result
export interface OptimizationResult {
  optimalIndex: number; // mm
  optimalOverlap: number; // percentage
  achievedCoverage: number; // percentage
  passCount: number;
  timeEstimate?: number; // seconds
  tradeoffs: string[]; // explanation of any tradeoffs made
}

// Standard probe presets
export const PROBE_PRESETS: ProbePreset[] = [
  {
    id: "contact_5_12",
    name: "5 MHz 12.7mm Contact",
    frequency: 5,
    diameter: 12.7,
    type: "contact",
    beamType: "straight",
  },
  {
    id: "contact_5_19",
    name: "5 MHz 19mm Contact",
    frequency: 5,
    diameter: 19,
    type: "contact",
    beamType: "straight",
  },
  {
    id: "immersion_5_19",
    name: "5 MHz 19mm Immersion",
    frequency: 5,
    diameter: 19,
    type: "immersion",
    beamType: "straight",
  },
  {
    id: "immersion_10_12",
    name: "10 MHz 12.7mm Immersion",
    frequency: 10,
    diameter: 12.7,
    type: "immersion",
    beamType: "straight",
  },
  {
    id: "angle_45_5",
    name: "5 MHz 45° Angle Beam",
    frequency: 5,
    diameter: 12.7,
    type: "contact",
    beamType: "angle_45",
  },
  {
    id: "angle_60_5",
    name: "5 MHz 60° Angle Beam",
    frequency: 5,
    diameter: 12.7,
    type: "contact",
    beamType: "angle_60",
  },
];

// Common material acoustics
export const MATERIAL_ACOUSTICS: Record<string, MaterialAcoustics> = {
  steel: {
    velocity: 5920,
    attenuationCoeff: 0.01,
    scatterFactor: 0.1,
  },
  aluminum: {
    velocity: 6320,
    attenuationCoeff: 0.005,
    scatterFactor: 0.05,
  },
  titanium: {
    velocity: 6100,
    attenuationCoeff: 0.02,
    scatterFactor: 0.15,
  },
  stainless_steel: {
    velocity: 5790,
    attenuationCoeff: 0.015,
    scatterFactor: 0.12,
  },
  nickel_alloy: {
    velocity: 5820,
    attenuationCoeff: 0.018,
    scatterFactor: 0.14,
  },
  water: {
    velocity: 1480,
    attenuationCoeff: 0.0001,
  },
};
