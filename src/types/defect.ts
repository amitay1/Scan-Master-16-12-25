/**
 * AI Defect Advisor Types
 * Types for defect classification and analysis
 */

// Defect types in UT inspection
export type DefectType =
  | "crack"
  | "porosity"
  | "inclusion"
  | "void"
  | "delamination"
  | "lack_of_fusion"
  | "lack_of_penetration"
  | "shrinkage"
  | "lamination"
  | "segregation"
  | "hydrogen_flake"
  | "forging_lap"
  | "seam"
  | "unknown";

// Signal shape types
export type SignalShape =
  | "sharp_narrow"
  | "sharp_wide"
  | "rounded"
  | "irregular"
  | "multiple_peaks"
  | "diffuse"
  | "flat_topped";

// Signal behavior when probe moves
export type SignalBehavior =
  | "stationary"
  | "moves_with_probe"
  | "disappears"
  | "changes_amplitude"
  | "splits";

// Indication input data
export interface IndicationData {
  // Basic measurements
  amplitude: number;           // % FSH or % DAC
  amplitudeReference: "fsh" | "dac";
  depth: number;               // mm

  // Signal characteristics
  signalShape: SignalShape;
  signalBehavior: SignalBehavior;
  signalWidth?: number;        // mm (6dB width)

  // Back wall effects
  backWallDrop?: number;       // dB drop in back wall
  backWallComplete?: boolean;  // Complete loss of back wall?

  // Angle beam response
  angleResponse?: {
    angle45?: number;          // % DAC at 45°
    angle60?: number;          // % DAC at 60°
    angle70?: number;          // % DAC at 70°
  };

  // Location characteristics
  nearSurface?: boolean;       // Within first 3mm
  nearBackWall?: boolean;      // Within last 3mm
  atMidwall?: boolean;         // In middle section

  // Pattern
  orientation?: "parallel" | "perpendicular" | "random" | "unknown";
  isLinear?: boolean;          // Linear indication?
  linearLength?: number;       // mm

  // Context
  material?: string;
  partType?: string;
  processType?: "forging" | "casting" | "weld" | "wrought" | "other";

  // Additional observations
  notes?: string;
}

// Classification result
export interface DefectClassification {
  primaryType: DefectType;
  confidence: number;          // 0-100%
  alternativeTypes: {
    type: DefectType;
    confidence: number;
  }[];

  // Reasoning
  reasons: string[];
  matchingCharacteristics: string[];
  conflictingCharacteristics: string[];

  // Recommendation
  recommendation: "accept" | "reject" | "retest" | "evaluate_further";
  recommendationReason: string;

  // Additional guidance
  suggestedActions: string[];
  references: string[];        // Standard references
}

// Defect type characteristics (for matching)
export interface DefectCharacteristics {
  type: DefectType;
  typicalSignalShapes: SignalShape[];
  typicalBehaviors: SignalBehavior[];
  backWallEffect: "none" | "partial_drop" | "complete_loss" | "variable";
  typicalLocations: ("surface" | "subsurface" | "midwall" | "backwall")[];
  typicalOrientation: ("parallel" | "perpendicular" | "random")[];
  processAssociation: ("forging" | "casting" | "weld" | "wrought" | "any")[];
  description: string;
}

// Defect database
export const DEFECT_CHARACTERISTICS: DefectCharacteristics[] = [
  {
    type: "crack",
    typicalSignalShapes: ["sharp_narrow", "sharp_wide"],
    typicalBehaviors: ["stationary", "changes_amplitude"],
    backWallEffect: "partial_drop",
    typicalLocations: ["surface", "subsurface"],
    typicalOrientation: ["perpendicular"],
    processAssociation: ["any"],
    description: "Planar discontinuity with sharp edges, typically perpendicular to the surface",
  },
  {
    type: "porosity",
    typicalSignalShapes: ["rounded", "multiple_peaks"],
    typicalBehaviors: ["stationary", "changes_amplitude"],
    backWallEffect: "none",
    typicalLocations: ["midwall", "subsurface"],
    typicalOrientation: ["random"],
    processAssociation: ["casting", "weld"],
    description: "Spherical or elongated gas pockets, scattered or clustered",
  },
  {
    type: "inclusion",
    typicalSignalShapes: ["rounded", "irregular"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "none",
    typicalLocations: ["midwall"],
    typicalOrientation: ["random", "parallel"],
    processAssociation: ["forging", "casting", "wrought"],
    description: "Foreign material trapped during solidification",
  },
  {
    type: "void",
    typicalSignalShapes: ["sharp_wide", "rounded"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "partial_drop",
    typicalLocations: ["midwall"],
    typicalOrientation: ["random"],
    processAssociation: ["casting"],
    description: "Large cavity from shrinkage or gas",
  },
  {
    type: "delamination",
    typicalSignalShapes: ["flat_topped", "sharp_wide"],
    typicalBehaviors: ["stationary", "moves_with_probe"],
    backWallEffect: "complete_loss",
    typicalLocations: ["midwall"],
    typicalOrientation: ["parallel"],
    processAssociation: ["wrought", "forging"],
    description: "Planar separation parallel to rolling/forging direction",
  },
  {
    type: "lack_of_fusion",
    typicalSignalShapes: ["sharp_narrow", "flat_topped"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "partial_drop",
    typicalLocations: ["subsurface", "midwall"],
    typicalOrientation: ["parallel"],
    processAssociation: ["weld"],
    description: "Incomplete fusion between weld passes or base metal",
  },
  {
    type: "lack_of_penetration",
    typicalSignalShapes: ["sharp_narrow"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "none",
    typicalLocations: ["backwall"],
    typicalOrientation: ["parallel"],
    processAssociation: ["weld"],
    description: "Incomplete joint penetration at weld root",
  },
  {
    type: "shrinkage",
    typicalSignalShapes: ["irregular", "diffuse"],
    typicalBehaviors: ["changes_amplitude"],
    backWallEffect: "variable",
    typicalLocations: ["midwall"],
    typicalOrientation: ["random"],
    processAssociation: ["casting"],
    description: "Cavities from solidification shrinkage",
  },
  {
    type: "lamination",
    typicalSignalShapes: ["flat_topped"],
    typicalBehaviors: ["moves_with_probe"],
    backWallEffect: "complete_loss",
    typicalLocations: ["midwall"],
    typicalOrientation: ["parallel"],
    processAssociation: ["wrought"],
    description: "Planar separation from rolling",
  },
  {
    type: "segregation",
    typicalSignalShapes: ["diffuse", "irregular"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "none",
    typicalLocations: ["midwall"],
    typicalOrientation: ["parallel"],
    processAssociation: ["forging", "wrought"],
    description: "Compositional variation affecting acoustic properties",
  },
  {
    type: "hydrogen_flake",
    typicalSignalShapes: ["sharp_narrow", "multiple_peaks"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "partial_drop",
    typicalLocations: ["midwall"],
    typicalOrientation: ["parallel", "random"],
    processAssociation: ["forging"],
    description: "Internal cracks from hydrogen during cooling",
  },
  {
    type: "forging_lap",
    typicalSignalShapes: ["sharp_narrow"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "none",
    typicalLocations: ["surface", "subsurface"],
    typicalOrientation: ["parallel"],
    processAssociation: ["forging"],
    description: "Surface fold from forging process",
  },
  {
    type: "seam",
    typicalSignalShapes: ["sharp_narrow"],
    typicalBehaviors: ["stationary"],
    backWallEffect: "none",
    typicalLocations: ["surface"],
    typicalOrientation: ["parallel"],
    processAssociation: ["wrought"],
    description: "Longitudinal surface crack from rolling",
  },
];

// Labels for UI
export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  crack: "Crack",
  porosity: "Porosity",
  inclusion: "Inclusion",
  void: "Void",
  delamination: "Delamination",
  lack_of_fusion: "Lack of Fusion",
  lack_of_penetration: "Lack of Penetration",
  shrinkage: "Shrinkage",
  lamination: "Lamination",
  segregation: "Segregation",
  hydrogen_flake: "Hydrogen Flake",
  forging_lap: "Forging Lap",
  seam: "Seam",
  unknown: "Unknown",
};

export const SIGNAL_SHAPE_LABELS: Record<SignalShape, string> = {
  sharp_narrow: "Sharp & Narrow",
  sharp_wide: "Sharp & Wide",
  rounded: "Rounded",
  irregular: "Irregular",
  multiple_peaks: "Multiple Peaks",
  diffuse: "Diffuse",
  flat_topped: "Flat Topped",
};

export const SIGNAL_BEHAVIOR_LABELS: Record<SignalBehavior, string> = {
  stationary: "Stationary",
  moves_with_probe: "Moves with Probe",
  disappears: "Disappears",
  changes_amplitude: "Changes Amplitude",
  splits: "Splits",
};
