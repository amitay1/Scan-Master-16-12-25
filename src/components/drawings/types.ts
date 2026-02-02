/**
 * Dynamic Calibration Block Drawing Types
 * Defines all interfaces for fully dynamic SVG technical drawings
 */

import { CalibrationBlockType } from '@/types/techniqueSheet';

// ==================== DIMENSION INTERFACES ====================

export interface BlockDimensions {
  /** Block length in mm (X-axis) */
  length: number;
  /** Block width in mm (Y-axis) */
  width: number;
  /** Block height/thickness in mm (Z-axis) */
  height: number;
  /** Outer diameter for cylindrical blocks (mm) */
  diameter?: number;
  /** Inner diameter for hollow cylinders (mm) */
  innerDiameter?: number;
  /** Wall thickness for hollow parts (mm) */
  wallThickness?: number;
  /** Radius for curved surfaces (mm) */
  radius?: number;
  /** Angle for angle beam blocks (degrees) */
  angle?: number;
}

export interface FBHData {
  /** FBH size string (e.g., "3/64", "5/64") */
  size: string;
  /** Calculated diameter in mm */
  diameter: number;
  /** Depth from surface in mm (metal travel distance) */
  depth: number;
  /** Position within block */
  position: {
    x: number;
    y: number;
    z?: number;
  };
  /** Optional label override */
  label?: string;
}

export interface NotchData {
  /** Notch type: ID (inner), OD (outer), axial */
  type: 'ID' | 'OD' | 'axial';
  /** Angular position in degrees */
  angle: number;
  /** Notch depth in mm */
  depth: number;
  /** Notch width in mm */
  width: number;
  /** Notch length in mm */
  length?: number;
}

// ==================== SCALE & VIEWBOX INTERFACES ====================

export interface ScaleConfig {
  /** Calculated scale factor */
  factor: number;
  /** Original dimensions before scaling */
  original: { width: number; height: number };
  /** Scaled dimensions */
  scaled: { width: number; height: number };
  /** Scale display string (e.g., "1:2", "2:1") */
  displayString: string;
}

export interface ViewBoxConfig {
  /** ViewBox width in SVG units */
  width: number;
  /** ViewBox height in SVG units */
  height: number;
  /** Padding from edges */
  padding: number;
  /** Available drawing area after padding */
  drawingArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ==================== MAIN PROPS INTERFACE ====================

export interface DynamicDrawingProps {
  /** Block type determines which drawing to render */
  blockType: CalibrationBlockType;
  
  /** Container width in pixels (default: 400) */
  width?: number;
  
  /** Container height in pixels (default: 300) */
  height?: number;
  
  /** Block dimensions - all measurements in mm */
  dimensions?: Partial<BlockDimensions>;
  
  /** FBH (Flat Bottom Hole) data array */
  fbhData?: FBHData[];
  
  /** Notch data for notched blocks */
  notchData?: NotchData[];
  
  /** Material specification string */
  material?: string;
  
  /** Block serial number */
  serialNumber?: string;
  
  /** Custom part number override */
  partNumber?: string;
  
  /** Whether to show dimension lines (default: true) */
  showDimensions?: boolean;
  
  /** Whether to show grid background (default: false) */
  showGrid?: boolean;
  
  /** Manual scale override (auto-calculated if not provided) */
  scale?: number;
  
  /** Tolerance display format */
  toleranceFormat?: 'decimal' | 'fractional';
  
  /** Whether block is editable (highlights interactive elements) */
  editable?: boolean;
  
  /** Callback when a dimension is clicked (for editing) */
  onDimensionClick?: (dimensionKey: string, currentValue: number) => void;
}

// ==================== DEFAULT VALUES ====================

export const DEFAULT_DIMENSIONS: Record<CalibrationBlockType, BlockDimensions> = {
  'flat_block': { length: 200, width: 100, height: 50 },
  'curved_block': { length: 220, width: 100, height: 40, radius: 150 },
  'cylinder_fbh': { length: 150, width: 150, height: 100, diameter: 150, innerDiameter: 90, wallThickness: 30 },
  'solid_cylinder_fbh': { length: 50.8, width: 50.8, height: 100, diameter: 50.8, innerDiameter: 0, wallThickness: 25.4 },
  'angle_beam': { length: 100, width: 100, height: 50, angle: 45 },
  'cylinder_notched': { length: 120, width: 100, height: 100, diameter: 100, innerDiameter: 60, wallThickness: 20 },
  'iiw_block': { length: 300, width: 40, height: 100 },
  'step_wedge': { length: 200, width: 60, height: 50 },
  'iow_block': { length: 300, width: 100, height: 40 },
  'custom': { length: 150, width: 75, height: 50 }
};

export const DEFAULT_FBH_DATA: FBHData[] = [
  { size: '3/64', diameter: 1.19, depth: 15, position: { x: 50, y: 50 } },
  { size: '5/64', diameter: 1.98, depth: 25, position: { x: 100, y: 50 } },
  { size: '8/64', diameter: 3.18, depth: 35, position: { x: 150, y: 50 } }
];

// ==================== SCALE CONSTANTS ====================

/** Minimum allowed scale factor */
export const MIN_SCALE = 0.3;

/** Maximum allowed scale factor */
export const MAX_SCALE = 3.0;

/** Target drawing area percentage of viewbox */
export const TARGET_FILL_RATIO = 0.7;

/** Minimum dimension in mm before warning */
export const MIN_DIMENSION_MM = 10;

/** Maximum dimension in mm before warning */
export const MAX_DIMENSION_MM = 500;

// ==================== HELPER FUNCTIONS ====================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate auto-scale factor to fit dimensions within viewbox
 * Accepts either a simple {width, height} object or a full ViewBoxConfig
 */
export function calculateAutoScale(
  dimensions: Partial<BlockDimensions> | undefined,
  viewBox: ViewBoxConfig | { width: number; height: number },
  targetFillRatio: number = TARGET_FILL_RATIO
): ScaleConfig {
  // Handle undefined dimensions with safe defaults
  const safeDimensions = dimensions || { length: 100, width: 50, height: 25 };
  
  const length = safeDimensions.length || 100;
  const width = safeDimensions.width || 50;
  const height = safeDimensions.height || 25;
  
  // Determine the largest dimension we need to fit
  // For most views, we show length × width (top view) and length × height (front view)
  const maxHorizontal = Math.max(length, width);
  const maxVertical = Math.max(width, height);
  
  // Calculate available space - handle both ViewBoxConfig and simple {width, height}
  const viewBoxWidth = 'drawingArea' in viewBox ? viewBox.drawingArea.width : viewBox.width;
  const viewBoxHeight = 'drawingArea' in viewBox ? viewBox.drawingArea.height : viewBox.height;
  const availableWidth = viewBoxWidth * targetFillRatio;
  const availableHeight = viewBoxHeight * targetFillRatio;
  
  // Calculate scale factors for each axis
  const scaleX = availableWidth / maxHorizontal;
  const scaleY = availableHeight / maxVertical;
  
  // Use the smaller scale to ensure both dimensions fit
  let factor = Math.min(scaleX, scaleY);
  
  // Clamp to safe range
  factor = clamp(factor, MIN_SCALE, MAX_SCALE);
  
  // Log warning for extreme dimensions
  const maxDim = Math.max(length, width, height);
  if (maxDim < MIN_DIMENSION_MM) {
    console.warn(`[CalibrationDrawing] Dimensions very small (${maxDim}mm). Scale: ${factor.toFixed(2)}`);
  }
  if (maxDim > MAX_DIMENSION_MM) {
    console.warn(`[CalibrationDrawing] Dimensions very large (${maxDim}mm). Scale: ${factor.toFixed(2)}`);
  }
  
  // Calculate display string (1:2 means drawing is half size)
  let displayString: string;
  if (factor >= 1) {
    const ratio = Math.round(factor);
    displayString = ratio === 1 ? '1:1' : `${ratio}:1`;
  } else {
    const ratio = Math.round(1 / factor);
    displayString = `1:${ratio}`;
  }
  
  return {
    factor,
    original: { width: maxHorizontal, height: maxVertical },
    scaled: { width: maxHorizontal * factor, height: maxVertical * factor },
    displayString
  };
}

/**
 * Convert fractional FBH size to diameter in mm
 */
export function fbhSizeToMm(size: string): number {
  // Parse fractional sizes like "3/64", "5/64", "8/64"
  const match = size.match(/(\d+)\/(\d+)/);
  if (match) {
    const numerator = parseInt(match[1], 10);
    const denominator = parseInt(match[2], 10);
    // Convert from inches to mm (1 inch = 25.4 mm)
    return (numerator / denominator) * 25.4;
  }
  // Try parsing as decimal mm
  const decimal = parseFloat(size);
  return isNaN(decimal) ? 1.5 : decimal;
}

/**
 * Format dimension value with tolerance
 */
export function formatDimension(
  value: number,
  tolerance?: number,
  format: 'decimal' | 'fractional' = 'decimal'
): string {
  if (format === 'fractional') {
    // TODO: Implement fractional formatting
    return `${value.toFixed(1)}`;
  }
  
  const formatted = value.toFixed(1);
  if (tolerance) {
    return `${formatted} ±${tolerance.toFixed(2)}`;
  }
  return formatted;
}

/**
 * Check if FBH position is within block bounds
 */
export function validateFbhPosition(
  fbh: FBHData,
  dimensions: BlockDimensions
): { valid: boolean; warning?: string } {
  const margin = fbh.diameter / 2;
  
  if (fbh.position.x - margin < 0 || fbh.position.x + margin > dimensions.length) {
    return { valid: false, warning: `FBH at x=${fbh.position.x} is outside block bounds` };
  }
  
  if (fbh.position.y - margin < 0 || fbh.position.y + margin > dimensions.width) {
    return { valid: false, warning: `FBH at y=${fbh.position.y} is outside block bounds` };
  }
  
  if (fbh.depth > dimensions.height) {
    return { valid: false, warning: `FBH depth ${fbh.depth}mm exceeds block height ${dimensions.height}mm` };
  }
  
  return { valid: true };
}
