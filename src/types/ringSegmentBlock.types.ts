/**
 * Ring Segment Calibration Block Type Definitions
 *
 * Types for parametric ring segment reference blocks used in angle beam
 * ultrasonic testing of curved parts (tubes, cylinders, rings).
 *
 * Based on EN 10228-3/4, ASTM E428, and TUV standards.
 *
 * Architecture follows three-layer separation:
 * - Template Layer: Standard block definitions
 * - Resolver Layer: Template + part dims → resolved block
 * - Renderer Layer: Draws resolved block (no business logic)
 */

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * Block shape type
 */
export type BlockShape = 'ring_segment' | 'full_ring' | 'solid_cylinder' | 'rectangular';

/**
 * Depth definition method for holes
 * - radial_depth: Depth measured radially into wall (perpendicular to curved surface)
 * - along_drill_axis: Depth measured along the drill axis (may not be radial)
 */
export type DepthDefinition = 'radial_depth' | 'along_drill_axis';

/**
 * Axial origin for hole position measurements
 * - left: Measure from left edge of block
 * - right: Measure from right edge of block
 * - center: Measure from center of block
 */
export type AxialOrigin = 'left' | 'right' | 'center';

/**
 * Reflector type
 * - SDH: Side Drilled Hole (for DAC calibration)
 * - FBH: Flat Bottom Hole (for distance/amplitude calibration)
 */
export type ReflectorType = 'SDH' | 'FBH';

/**
 * Hole label (A through H)
 */
export type HoleLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/**
 * Standard family for block templates
 */
export type StandardFamily = 'EN' | 'ASTM' | 'TUV' | 'CUSTOM';

// ============================================================================
// GEOMETRY INTERFACES
// ============================================================================

/**
 * Ring segment geometry specification
 * Defines the arc-shaped calibration block dimensions
 */
export interface RingSegmentGeometry {
  /** Shape type identifier */
  shape: 'ring_segment';
  /** Outer diameter in mm */
  outerDiameterMm: number;
  /** Inner diameter in mm */
  innerDiameterMm: number;
  /** Axial width (length along cylinder axis) in mm */
  axialWidthMm: number;
  /** Arc segment angle in degrees (e.g., 90, 120) */
  segmentAngleDeg: number;
  /** Minimum edge margin in mm (distance from edges) */
  edgeMarginMm: number;
  /** Minimum spacing between holes in mm */
  minHoleSpacingMm: number;
}

/**
 * Calculated geometry values (derived from RingSegmentGeometry)
 */
export interface CalculatedGeometry {
  /** Wall thickness: (OD - ID) / 2 */
  wallThicknessMm: number;
  /** Mean radius: (OD/2 + ID/2) / 2 */
  meanRadiusMm: number;
  /** Outer radius: OD / 2 */
  outerRadiusMm: number;
  /** Inner radius: ID / 2 */
  innerRadiusMm: number;
  /** Arc length at mean radius */
  arcLengthMm: number;
}

// ============================================================================
// HOLE POSITION AND FEATURE INTERFACES
// ============================================================================

/**
 * Curved hole position on arc segment
 *
 * Angle convention:
 * - angleOnArcDeg: 0° is the starting cut face of the segment
 * - Angle increases counter-clockwise (CCW) when viewed from +Z axis
 */
export interface CurvedHolePosition {
  /** Hole label (A, B, C, etc.) */
  label: HoleLabel;
  /** Angular position on arc in degrees (0° = start cut face, CCW from +Z) */
  angleOnArcDeg: number;
  /** Distance from axial origin in mm */
  axialPositionMm: number;
  /** How the depth is defined */
  depthDefinition: DepthDefinition;
}

/**
 * Hole feature specification (diameter, depth, type)
 * Linked to CurvedHolePosition by label (no data duplication)
 */
export interface HoleFeature {
  /** Hole label - links to CurvedHolePosition */
  label: HoleLabel;
  /** Reflector type (SDH or FBH) */
  reflectorType: ReflectorType;
  /** Hole diameter in mm */
  diameterMm: number;
  /** Hole depth in mm */
  depthMm: number;
}

/**
 * Resolved hole with all calculated positions
 * Result of merging CurvedHolePosition + HoleFeature + geometry calculations
 */
export interface ResolvedHole {
  /** Hole label */
  label: HoleLabel;
  /** Reflector type */
  reflectorType: ReflectorType;
  /** Hole diameter in mm */
  diameterMm: number;
  /** Resolved depth in mm (after thin-wall policy) */
  depthMm: number;
  /** Original depth from template (before adjustments) */
  originalDepthMm: number;
  /** Angular position on arc */
  angleOnArcDeg: number;
  /** Axial position */
  axialPositionMm: number;
  /** Depth definition method */
  depthDefinition: DepthDefinition;
  /** Whether depth was adjusted due to thin-wall policy */
  wasAdjusted: boolean;

  // Calculated 3D coordinates (for rendering)
  /** 3D Cartesian coordinates */
  cartesian: { x: number; y: number; z: number };
  /** 2D coordinates for top view */
  topViewPosition: { x: number; y: number };
  /** 2D coordinates for section A-A view */
  sectionViewPosition: { x: number; y: number };
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

/**
 * Ring segment block template definition
 * Defines a standard calibration block per EN/ASTM/TUV specifications
 */
export interface RingSegmentBlockTemplate {
  /** Unique template identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Standard reference (e.g., "BS EN 10228-3") */
  standardReference: string;
  /** Standard family */
  standardFamily: StandardFamily;
  /** Template description */
  description: string;
  /** Block geometry specification */
  geometry: RingSegmentGeometry;
  /** Hole positions (where holes are placed) */
  holePositions: CurvedHolePosition[];
  /** Hole features (what type/size holes are) */
  holeFeatures: HoleFeature[];
  /** Axial origin for measurements */
  axialOrigin: AxialOrigin;
  /** Additional notes */
  notes: string[];
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * Validation warning/error
 */
export interface ValidationWarning {
  /** Severity level */
  level: 'info' | 'warning' | 'error';
  /** Warning code for programmatic handling */
  code: ValidationCode;
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Validation codes
 */
export type ValidationCode =
  | 'GEOMETRY_INVALID_OD_ID'
  | 'GEOMETRY_INVALID_ANGLE'
  | 'GEOMETRY_INVALID_WIDTH'
  | 'HOLE_OUTSIDE_MARGINS'
  | 'HOLE_SPACING_TOO_SMALL'
  | 'ARC_LENGTH_INSUFFICIENT'
  | 'THIN_WALL_DEPTH_ADJUSTED'
  | 'THIN_WALL_REFLECTOR_REMOVED'
  | 'THIN_WALL_FALLBACK_APPLIED'
  | 'COMPLIANCE_ERROR_TOO_THIN'
  | 'MINIMUM_REFLECTORS_NOT_MET'
  | 'PART_DIMS_OVERRIDE';

/**
 * Geometry validation result
 */
export interface GeometryValidationResult {
  isValid: boolean;
  errors: ValidationWarning[];
  calculatedGeometry?: CalculatedGeometry;
}

/**
 * Hole validation result
 */
export interface HoleValidationResult {
  isValid: boolean;
  errors: ValidationWarning[];
  warnings: ValidationWarning[];
}

// ============================================================================
// THIN-WALL POLICY INTERFACES
// ============================================================================

/**
 * Thin-wall policy configuration
 * Defines how to handle blocks with thin walls
 */
export interface ThinWallPolicy {
  /** Safety margin from inner surface in mm (default: 2mm) */
  safetyMarginMm: number;
  /** Minimum number of reflectors required by standard */
  minimumReflectors: {
    EN: number;   // 3
    ASTM: number; // 2
  };
  /** Fallback depth ratios as fraction of wall thickness */
  fallbackDepthRatios: readonly [number, number, number]; // [0.2, 0.5, 0.8]
}

/**
 * Default thin-wall policy
 */
export const DEFAULT_THIN_WALL_POLICY: ThinWallPolicy = {
  safetyMarginMm: 2,
  minimumReflectors: {
    EN: 3,
    ASTM: 2,
  },
  fallbackDepthRatios: [0.2, 0.5, 0.8] as const,
};

/**
 * Result of applying thin-wall policy
 */
export interface ThinWallPolicyResult {
  /** Adjusted hole features */
  adjustedFeatures: HoleFeature[];
  /** Warnings generated */
  warnings: ValidationWarning[];
  /** Whether the configuration is compliant */
  isCompliant: boolean;
}

// ============================================================================
// RESOLVED BLOCK INTERFACES
// ============================================================================

/**
 * Fully resolved ring segment block
 * Output of the resolver - ready for rendering
 */
export interface ResolvedRingSegmentBlock {
  /** Template ID used */
  templateId: string;
  /** Template name */
  templateName: string;
  /** Standard reference */
  standardReference: string;
  /** Resolved geometry (with any overrides applied) */
  geometry: RingSegmentGeometry;
  /** Calculated geometry values */
  calculatedGeometry: CalculatedGeometry;
  /** Resolved holes with all positions calculated */
  holes: ResolvedHole[];
  /** All warnings/info generated during resolution */
  warnings: ValidationWarning[];
  /** Whether the block is compliant with the standard */
  isCompliant: boolean;
  /** Axial origin for reference */
  axialOrigin: AxialOrigin;
}

// ============================================================================
// UI/RENDERER INTERFACES
// ============================================================================

/**
 * Drawing view type
 */
export type DrawingViewType = 'top' | 'sectionAA' | 'sectionBB' | 'isometric';

/**
 * Drawing configuration
 */
export interface DrawingConfig {
  /** Canvas/viewport width in pixels */
  width: number;
  /** Canvas/viewport height in pixels */
  height: number;
  /** Scale factor (pixels per mm) */
  scale: number;
  /** Padding in pixels */
  padding: number;
  /** Whether to show dimensions */
  showDimensions: boolean;
  /** Whether to show centerlines */
  showCenterlines: boolean;
  /** Whether to show hole labels */
  showHoleLabels: boolean;
}

/**
 * Hole table row data
 */
export interface HoleTableRow {
  label: HoleLabel;
  type: ReflectorType;
  diameterMm: number;
  depthMm: number;
  angleOnArcDeg: number;
  axialPositionMm: number;
  depthDefinition: DepthDefinition;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: 'svg' | 'pdf' | 'dxf' | 'png';
  /** Include title block */
  includeTitleBlock: boolean;
  /** Include hole table */
  includeHoleTable: boolean;
  /** Paper size for PDF */
  paperSize?: 'A4' | 'A3' | 'Letter';
  /** DPI for raster exports */
  dpi?: number;
}

// ============================================================================
// PART DIMENSIONS OVERRIDE INTERFACE
// ============================================================================

/**
 * Part dimensions override
 * Used to adapt template to specific part being tested
 */
export interface PartDimensionsOverride {
  /** Override outer diameter */
  outerDiameterMm?: number;
  /** Override inner diameter */
  innerDiameterMm?: number;
  /** Override axial width */
  axialWidthMm?: number;
  /** Override segment angle */
  segmentAngleDeg?: number;
}

// ============================================================================
// CALIBRATION BLOCK RECOMMENDER TYPES
// ============================================================================

/**
 * Part geometry classification for recommender
 */
export type PartGeometryClass =
  | 'flat'           // Plates, blocks, bars
  | 'solid_round'    // Solid cylinders, shafts
  | 'hollow_round'   // Tubes, pipes, rings
  | 'complex';       // Cones, spheres, custom

/**
 * Curvature assessment result
 */
export interface CurvatureAssessment {
  /** Part geometry class */
  geometryClass: PartGeometryClass;
  /** Whether surface is effectively flat (R >= 10*L) */
  isFlatEnough: boolean;
  /** Surface radius in mm (if curved) */
  surfaceRadiusMm: number;
  /** Probe contact length in mm (default ~25mm for angle beam) */
  contactLengthMm: number;
  /** Recommendation */
  recommendation: 'flat_block' | 'ring_segment' | 'custom';
}

/**
 * Calibration block recommendation
 */
export interface CalibrationBlockRecommendation {
  /** For system calibration (V1/V2/IIW) */
  systemBlock: {
    recommended: string;
    alternatives: string[];
    reason: string;
  };
  /** For sensitivity calibration (DAC/TCG reference) */
  referenceBlock: {
    recommended: string;
    alternatives: string[];
    reason: string;
    templateId?: string;  // If ring_segment is recommended
  };
  /** Any warnings about the recommendation */
  warnings: string[];
}
