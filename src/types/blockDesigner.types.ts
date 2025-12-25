/**
 * Block Designer Types
 * Types for the custom calibration block designer with free-form shape building
 * and interactive hole placement.
 */

// ==================== HOLE INTERFACES ====================

/** Standard FBH sizes (imperial fractions) */
export const FBH_SIZES = [
  '1/64',
  '2/64',
  '3/64',
  '4/64',
  '5/64',
  '6/64',
  '7/64',
  '8/64',
] as const;

export type FBHSize = (typeof FBH_SIZES)[number];

/** Convert FBH size string to diameter in mm */
export function fbhSizeToDiameter(size: FBHSize | string): number {
  const match = size.match(/(\d+)\/(\d+)/);
  if (match) {
    const numerator = parseInt(match[1], 10);
    const denominator = parseInt(match[2], 10);
    // Convert from inches to mm (1 inch = 25.4 mm)
    return (numerator / denominator) * 25.4;
  }
  // Fallback: try parsing as decimal mm
  const decimal = parseFloat(size);
  return isNaN(decimal) ? 1.5 : decimal;
}

/** Which surface of the block the hole is placed on */
export type HoleSurface = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

/** Hole type for angle beam calibration */
export type HoleType = 'fbh' | 'sdh' | 'through';

/** A single hole in the block design */
export interface DesignerHole {
  /** Unique identifier */
  id: string;
  /** Hole type: FBH (flat bottom), SDH (side drilled), or through hole */
  type: HoleType;
  /** FBH size string (e.g., "3/64", "5/64") - only for FBH type */
  size: FBHSize | string;
  /** Calculated diameter in mm */
  diameter: number;
  /** Depth from surface in mm (FBH) or hole length (SDH) */
  depth: number;
  /** Position in block local coordinates (mm) */
  position: {
    x: number;
    y: number;
    z: number;
  };
  /** Which surface the hole was placed on */
  surface: HoleSurface;
  /** Optional custom label */
  label?: string;
  /** For SDH: distance from scanning surface (mm) */
  depthFromSurface?: number;
}

// ==================== SDH (SIDE DRILLED HOLE) ====================

/** Standard SDH diameters (mm) per ASTM E2375 */
export const SDH_DIAMETERS = [1.5, 2.0, 3.0, 4.0, 5.0, 6.0] as const;

export type SDHDiameter = (typeof SDH_DIAMETERS)[number];

/** SDH hole configuration for angle beam calibration */
export interface SDHConfig {
  /** Diameter in mm */
  diameter: SDHDiameter | number;
  /** Distance from scanning surface to hole center (mm) */
  depthFromSurface: number;
  /** Hole length - typically runs full width of block (mm) */
  length: number;
  /** Position along block length (mm) */
  xPosition: number;
}

// ==================== NOTCH TYPES ====================

/** Notch types for angle beam calibration */
export type NotchType = 'rectangular' | 'v_notch' | 'semicircular';

/** Notch orientation - which surface it's cut into */
export type NotchSurface = 'top' | 'bottom' | 'id' | 'od';

/** A notch in the calibration block */
export interface DesignerNotch {
  /** Unique identifier */
  id: string;
  /** Notch type */
  type: NotchType;
  /** Which surface the notch is on */
  surface: NotchSurface;
  /** Position along block length (mm) */
  xPosition: number;
  /** Notch width (mm) - opening at surface */
  width: number;
  /** Notch depth (mm) - how deep into the material */
  depth: number;
  /** For V-notch: included angle in degrees (typically 60° or 90°) */
  vAngle?: number;
  /** Optional custom label */
  label?: string;
}

/** Standard notch configurations per AWS D1.1 and other standards */
export const STANDARD_NOTCHES = {
  aws_1_5mm: { type: 'rectangular' as NotchType, width: 1.5, depth: 1.5, label: 'AWS 1.5mm' },
  aws_3mm: { type: 'rectangular' as NotchType, width: 3.0, depth: 3.0, label: 'AWS 3mm' },
  ten_percent: { type: 'rectangular' as NotchType, width: 2.0, depth: 0, label: '10% Wall' }, // depth calculated from wall
  v_notch_60: { type: 'v_notch' as NotchType, width: 2.0, depth: 1.5, vAngle: 60, label: 'V-60°' },
  v_notch_90: { type: 'v_notch' as NotchType, width: 2.0, depth: 1.5, vAngle: 90, label: 'V-90°' },
} as const;

// ==================== RADIUS SURFACE ====================

/** Radius surface for IIW-style blocks */
export interface RadiusSurface {
  /** Enable radius surface */
  enabled: boolean;
  /** Radius in mm (100mm for IIW V1, 25mm for IIW V2) */
  radius: number;
  /** Position: which end of the block */
  position: 'left' | 'right' | 'both';
}

// ==================== REFERENCE FEATURES ====================

/** Angle reference marking */
export interface AngleReference {
  /** Enable angle reference */
  enabled: boolean;
  /** Angle in degrees */
  angle: number;
  /** Position along block */
  xPosition: number;
}

/** Scale/ruler marking on block surface */
export interface ScaleMarking {
  /** Enable scale */
  enabled: boolean;
  /** Increment in mm */
  increment: number;
  /** Total length covered */
  length: number;
}

// ==================== SHAPE INTERFACES ====================

/** Curvature type for surfaces */
export type CurvatureType = 'flat' | 'convex' | 'concave';

/** Surface curvature configuration */
export interface SurfaceCurvature {
  type: CurvatureType;
  /** Radius in mm (0 = flat, ignored when type is 'flat') */
  radius: number;
}

/** Block geometry type */
export type BlockGeometryType = 'rectangular' | 'cylinder' | 'tube' | 'curved_block' | 'iiw_block';

/** Custom block shape configuration */
export interface CustomBlockShape {
  /** Geometry type */
  geometryType: BlockGeometryType;

  // Base dimensions (mm) - for rectangular blocks
  /** Block length - X-axis */
  length: number;
  /** Block width - Y-axis */
  width: number;
  /** Block height/thickness - Z-axis */
  height: number;

  // Cylinder/Tube dimensions
  /** Outer diameter for cylindrical shapes (mm) */
  outerDiameter: number;
  /** Inner diameter for tubes (mm), 0 for solid cylinder */
  innerDiameter: number;
  /** Cylinder length/height (mm) */
  cylinderLength: number;

  // Surface curvature (for rectangular blocks)
  /** Top surface curvature */
  topCurvature: SurfaceCurvature;
  /** Front surface curvature */
  frontCurvature: SurfaceCurvature;

  // Corner options
  /** Corner fillet radius in mm (0 = sharp corners) */
  cornerRadius: number;

  // Angle beam calibration features
  /** Radius surface for IIW-style blocks */
  radiusSurface: RadiusSurface;
  /** Angle reference markings */
  angleReferences: AngleReference[];
  /** Scale/ruler markings */
  scaleMarking: ScaleMarking;
}

/** Block material options */
export type BlockMaterial = 'steel' | 'aluminum' | 'titanium';

/** Material display properties */
export const MATERIAL_PROPERTIES: Record<
  BlockMaterial,
  { label: string; color: string; velocity: number }
> = {
  steel: { label: 'Steel', color: '#8e9aaf', velocity: 5920 },
  aluminum: { label: 'Aluminum', color: '#c9d1d9', velocity: 6320 },
  titanium: { label: 'Titanium', color: '#6b7280', velocity: 6100 },
};

// ==================== STATE INTERFACES ====================

/** View mode for the designer */
export type ViewMode = '3d' | '2d' | 'split';

/** Interaction mode for the 3D canvas */
export type InteractionMode = 'select' | 'place';

/** Main designer state */
export interface BlockDesignerState {
  /** Custom block shape configuration */
  blockShape: CustomBlockShape;
  /** Block material */
  blockMaterial: BlockMaterial;
  /** Array of holes placed on the block (FBH, SDH, through) */
  holes: DesignerHole[];
  /** Array of notches on the block */
  notches: DesignerNotch[];
  /** Currently selected hole ID (null if none) */
  selectedHoleId: string | null;
  /** Currently selected notch ID (null if none) */
  selectedNotchId: string | null;
  /** Current view mode */
  viewMode: ViewMode;
  /** Current interaction mode */
  interactionMode: InteractionMode;
  /** Current placement mode - what type of feature to place */
  placementMode: 'fbh' | 'sdh' | 'notch';
  /** Undo history stack */
  undoStack: BlockDesignerState[];
  /** Redo history stack */
  redoStack: BlockDesignerState[];
}

/** Actions available in the designer context */
export interface BlockDesignerActions {
  // Shape actions
  setBlockShape: (shape: Partial<CustomBlockShape>) => void;
  setBlockMaterial: (material: BlockMaterial) => void;
  resetShape: () => void;
  loadPreset: (preset: ShapePreset) => void;

  // Hole actions (FBH, SDH, through)
  addHole: (hole: Omit<DesignerHole, 'id'>) => void;
  updateHole: (id: string, updates: Partial<DesignerHole>) => void;
  deleteHole: (id: string) => void;
  selectHole: (id: string | null) => void;
  moveHole: (id: string, position: { x: number; y: number; z: number }) => void;
  clearAllHoles: () => void;

  // Notch actions
  addNotch: (notch: Omit<DesignerNotch, 'id'>) => void;
  updateNotch: (id: string, updates: Partial<DesignerNotch>) => void;
  deleteNotch: (id: string) => void;
  selectNotch: (id: string | null) => void;
  clearAllNotches: () => void;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setPlacementMode: (mode: 'fbh' | 'sdh' | 'notch') => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// ==================== PRESET INTERFACES ====================

/** Shape preset identifier */
export type ShapePreset =
  | 'flat_block'
  | 'curved_block'
  | 'cylinder'
  | 'tube'
  | 'iiw_v1'
  | 'iiw_v2'
  | 'aws_dsc'
  | 'sdh_block';

/** Default values for new shape properties */
const DEFAULT_RADIUS_SURFACE: RadiusSurface = {
  enabled: false,
  radius: 100,
  position: 'right',
};

const DEFAULT_SCALE_MARKING: ScaleMarking = {
  enabled: false,
  increment: 10,
  length: 100,
};

/** Preset configurations */
export const SHAPE_PRESETS: Record<ShapePreset, { label: string; shape: CustomBlockShape; description?: string }> = {
  flat_block: {
    label: 'Flat Block',
    description: 'Standard rectangular calibration block',
    shape: {
      geometryType: 'rectangular',
      length: 200,
      width: 100,
      height: 50,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { ...DEFAULT_RADIUS_SURFACE },
      angleReferences: [],
      scaleMarking: { ...DEFAULT_SCALE_MARKING },
    },
  },
  curved_block: {
    label: 'Curved Block',
    description: 'Block with curved top surface',
    shape: {
      geometryType: 'curved_block',
      length: 220,
      width: 100,
      height: 40,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'convex', radius: 150 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { ...DEFAULT_RADIUS_SURFACE },
      angleReferences: [],
      scaleMarking: { ...DEFAULT_SCALE_MARKING },
    },
  },
  cylinder: {
    label: 'Solid Cylinder',
    description: 'Solid cylindrical calibration block',
    shape: {
      geometryType: 'cylinder',
      length: 100,
      width: 100,
      height: 150,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { ...DEFAULT_RADIUS_SURFACE },
      angleReferences: [],
      scaleMarking: { ...DEFAULT_SCALE_MARKING },
    },
  },
  tube: {
    label: 'Hollow Tube',
    description: 'Pipe/tube calibration block with ID/OD',
    shape: {
      geometryType: 'tube',
      length: 100,
      width: 100,
      height: 150,
      outerDiameter: 100,
      innerDiameter: 60,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { ...DEFAULT_RADIUS_SURFACE },
      angleReferences: [],
      scaleMarking: { ...DEFAULT_SCALE_MARKING },
    },
  },
  iiw_v1: {
    label: 'IIW V1 Block',
    description: 'IIW Type 1 - 300×100×25mm with 100mm radius end',
    shape: {
      geometryType: 'iiw_block',
      length: 300,
      width: 25,
      height: 100,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { enabled: true, radius: 100, position: 'right' },
      angleReferences: [
        { enabled: true, angle: 45, xPosition: 100 },
        { enabled: true, angle: 60, xPosition: 150 },
        { enabled: true, angle: 70, xPosition: 200 },
      ],
      scaleMarking: { enabled: true, increment: 10, length: 200 },
    },
  },
  iiw_v2: {
    label: 'IIW V2 Block',
    description: 'IIW Type 2 - Miniature 127×50.8×12.7mm with 25mm radius end',
    shape: {
      geometryType: 'iiw_block',
      length: 127,
      width: 12.7,
      height: 50.8,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { enabled: true, radius: 25, position: 'right' },
      angleReferences: [
        { enabled: true, angle: 45, xPosition: 40 },
        { enabled: true, angle: 60, xPosition: 70 },
      ],
      scaleMarking: { enabled: true, increment: 5, length: 100 },
    },
  },
  aws_dsc: {
    label: 'AWS DSC Block',
    description: 'AWS Distance & Sensitivity Calibration block with dual radius ends',
    shape: {
      geometryType: 'iiw_block',
      length: 190,
      width: 50,
      height: 75,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { enabled: true, radius: 50, position: 'both' },
      angleReferences: [
        { enabled: true, angle: 45, xPosition: 50 },
        { enabled: true, angle: 60, xPosition: 100 },
        { enabled: true, angle: 70, xPosition: 140 },
      ],
      scaleMarking: { enabled: true, increment: 5, length: 150 },
    },
  },
  sdh_block: {
    label: 'SDH Block',
    description: 'Block for Side Drilled Hole angle beam calibration',
    shape: {
      geometryType: 'rectangular',
      length: 250,
      width: 50,
      height: 75,
      outerDiameter: 100,
      innerDiameter: 0,
      cylinderLength: 150,
      topCurvature: { type: 'flat', radius: 0 },
      frontCurvature: { type: 'flat', radius: 0 },
      cornerRadius: 0,
      radiusSurface: { ...DEFAULT_RADIUS_SURFACE },
      angleReferences: [],
      scaleMarking: { enabled: true, increment: 10, length: 200 },
    },
  },
};

// ==================== DEFAULT VALUES ====================

export const DEFAULT_BLOCK_SHAPE: CustomBlockShape = {
  geometryType: 'rectangular',
  length: 200,
  width: 100,
  height: 50,
  outerDiameter: 100,
  innerDiameter: 0,
  cylinderLength: 150,
  topCurvature: { type: 'flat', radius: 0 },
  frontCurvature: { type: 'flat', radius: 0 },
  cornerRadius: 0,
  radiusSurface: { enabled: false, radius: 100, position: 'right' },
  angleReferences: [],
  scaleMarking: { enabled: false, increment: 10, length: 100 },
};

export const DEFAULT_HOLE: Omit<DesignerHole, 'id' | 'position' | 'surface'> = {
  type: 'fbh',
  size: '5/64',
  diameter: fbhSizeToDiameter('5/64'),
  depth: 25,
};

export const DEFAULT_SDH: Omit<DesignerHole, 'id' | 'position' | 'surface'> = {
  type: 'sdh',
  size: '3mm',
  diameter: 3.0,
  depth: 50, // SDH length (runs full width)
  depthFromSurface: 25, // Distance from scanning surface
};

export const DEFAULT_NOTCH: Omit<DesignerNotch, 'id'> = {
  type: 'rectangular',
  surface: 'bottom',
  xPosition: 50,
  width: 1.5,
  depth: 1.5,
};

/** Generate a unique notch ID */
export function generateNotchId(): string {
  return `notch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate a hole placement */
export function validateHolePlacement(
  hole: DesignerHole,
  blockShape: CustomBlockShape,
  existingHoles: DesignerHole[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const margin = hole.diameter / 2;

  // Check bounds based on surface
  switch (hole.surface) {
    case 'top':
    case 'bottom':
      if (hole.position.x - margin < 0 || hole.position.x + margin > blockShape.length) {
        errors.push(`Hole X position (${hole.position.x.toFixed(1)}mm) is outside block bounds`);
      }
      if (hole.position.y - margin < 0 || hole.position.y + margin > blockShape.width) {
        errors.push(`Hole Y position (${hole.position.y.toFixed(1)}mm) is outside block bounds`);
      }
      if (hole.depth > blockShape.height) {
        errors.push(`Hole depth (${hole.depth}mm) exceeds block height (${blockShape.height}mm)`);
      }
      break;
    case 'front':
    case 'back':
      if (hole.position.x - margin < 0 || hole.position.x + margin > blockShape.length) {
        errors.push(`Hole X position is outside block bounds`);
      }
      if (hole.depth > blockShape.width) {
        errors.push(`Hole depth exceeds block width`);
      }
      break;
    case 'left':
    case 'right':
      if (hole.position.y - margin < 0 || hole.position.y + margin > blockShape.width) {
        errors.push(`Hole Y position is outside block bounds`);
      }
      if (hole.depth > blockShape.length) {
        errors.push(`Hole depth exceeds block length`);
      }
      break;
  }

  // Check for overlaps with existing holes
  const minSpacing = 2; // mm minimum between holes
  for (const existing of existingHoles) {
    if (existing.id === hole.id) continue;
    if (existing.surface !== hole.surface) continue;

    const dx = hole.position.x - existing.position.x;
    const dy = hole.position.y - existing.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (hole.diameter + existing.diameter) / 2 + minSpacing;

    if (distance < minDistance) {
      warnings.push(
        `Hole is very close to hole "${existing.label || existing.id}" (${distance.toFixed(1)}mm apart)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Generate a unique hole ID */
export function generateHoleId(): string {
  return `hole_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
