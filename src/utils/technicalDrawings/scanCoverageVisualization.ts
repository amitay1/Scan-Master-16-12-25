// @ts-nocheck
/**
 * Professional Scan Coverage Visualization Module
 * Generates aerospace-grade color-coded coverage zones for ultrasonic inspection technical drawings
 * Compliant with ultrasonic testing physics and beam propagation principles
 * 
 * THIS IS PRODUCTION CODE FOR AEROSPACE DOCUMENTATION - ZERO TOLERANCE FOR ERRORS
 */

import paper from 'paper';
import { TechnicalDrawingGenerator } from './TechnicalDrawingGenerator';

// Professional color gradient for depth zones (matches CAD standards)
export const SCAN_DEPTH_COLORS = [
  { depth: 0.0, color: '#FF0000', label: 'Surface' },           // Red - surface
  { depth: 0.125, color: '#FF4500', label: 'Near Surface' },    // Red-Orange
  { depth: 0.25, color: '#FFA500', label: 'Shallow' },          // Orange
  { depth: 0.375, color: '#000000', label: 'Upper Mid' },       // Gold
  { depth: 0.50, color: '#00FF00', label: 'Mid Depth' },        // Green
  { depth: 0.625, color: '#00CED1', label: 'Lower Mid' },       // Dark Turquoise
  { depth: 0.75, color: '#0000FF', label: 'Deep' },             // Blue
  { depth: 0.875, color: '#4B0082', label: 'Very Deep' },       // Indigo
  { depth: 1.0, color: '#9400D3', label: 'Back Wall' }          // Violet
];

// Professional scan zone types based on ultrasonic beam types
export enum ScanType {
  LONGITUDINAL_0 = 'Longitudinal waves',
  SHEAR_45 = 'Shear waves 45°',
  SHEAR_60 = 'Shear waves 60°',
  SHEAR_70 = 'Shear waves 70°',
  AXIAL_SHEAR = 'Axial shear waves',
  CIRCUMFERENTIAL = 'Circumferential waves',
  RADIAL = 'Radial waves',
  SURFACE_WAVE = 'Surface waves',
  LAMB_WAVE = 'Lamb waves'
}

// Mapping from UI select values to ScanType enum
export const UI_SCANTYPE_MAPPING: Record<string, ScanType> = {
  'LONGITUDINAL_0': ScanType.LONGITUDINAL_0,
  'SHEAR_45': ScanType.SHEAR_45,
  'SHEAR_60': ScanType.SHEAR_60,
  'SHEAR_70': ScanType.SHEAR_70,
  'AXIAL': ScanType.AXIAL_SHEAR,
  'CIRCUMFERENTIAL': ScanType.CIRCUMFERENTIAL,
  'RADIAL': ScanType.RADIAL,
  'SURFACE_WAVE': ScanType.SURFACE_WAVE,
  'LAMB_WAVE': ScanType.LAMB_WAVE
};

// Scan direction types
export enum ScanDirection {
  CLOCKWISE = 'Clockwise',
  COUNTER_CLOCKWISE = 'Counter clockwise',
  BIDIRECTIONAL = 'Bidirectional',
  NONE = ''
}

// Beam angle properties for different scan types
export const BEAM_ANGLES = {
  [ScanType.LONGITUDINAL_0]: 0,
  [ScanType.SHEAR_45]: 45,
  [ScanType.SHEAR_60]: 60,
  [ScanType.SHEAR_70]: 70,
  [ScanType.AXIAL_SHEAR]: 45,
  [ScanType.SURFACE_WAVE]: 90,
  [ScanType.LAMB_WAVE]: 0,
  [ScanType.CIRCUMFERENTIAL]: 0,
  [ScanType.RADIAL]: 0
};

// Professional zone definition interface
export interface ScanZone {
  id: string;
  label: string;                 // A, B, C, D, etc.
  scanType: ScanType;            // Type of ultrasonic wave
  direction?: ScanDirection;      // Scan direction if applicable
  depthStart: number;            // Normalized depth (0-1)
  depthEnd: number;              // Normalized depth (0-1)
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  opacity: number;
  type: 'rectangular' | 'circular' | 'annular' | 'sector' | 'custom';
  path?: paper.Path;
  actualInnerRadius?: number;     // For annular zones
  actualOuterRadius?: number;     // For annular zones
  angle?: number;                 // For hatching pattern angle
}

// Scan list table entry
export interface ScanListEntry {
  zone: string;
  scanType: string;
  direction?: string;
  coverage: string;
  notes?: string;
  color: string;  // Added color field for zone color
}

// Legend position options
export interface LegendPosition {
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
}

/**
 * Get color for a specific depth value
 */
export function getDepthColor(normalizedDepth: number): string {
  // Clamp depth to 0-1 range
  const depth = Math.max(0, Math.min(1, normalizedDepth));
  
  // Find the two colors to interpolate between
  for (let i = 1; i < SCAN_DEPTH_COLORS.length; i++) {
    if (depth <= SCAN_DEPTH_COLORS[i].depth) {
      const prev = SCAN_DEPTH_COLORS[i - 1];
      const next = SCAN_DEPTH_COLORS[i];
      
      // Linear interpolation between colors
      const t = (depth - prev.depth) / (next.depth - prev.depth);
      return interpolateColor(prev.color, next.color, t);
    }
  }
  
  return SCAN_DEPTH_COLORS[SCAN_DEPTH_COLORS.length - 1].color;
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
  
  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Generate zone labels (A, B, C, ... Z, AA, AB, ...)
 */
function generateZoneLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  }
  const firstLetter = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const secondLetter = String.fromCharCode(65 + (index % 26));
  return firstLetter + secondLetter; // AA, AB, etc.
}

/**
 * Create professional hatching pattern with diagonal lines at specified angle
 */
export function createHatchingPattern(
  bounds: { x: number; y: number; width: number; height: number },
  angle: number = 45,
  spacing: number = 8,
  strokeWidth: number = 1.5,
  color: string = '#000000',
  opacity: number = 0.3,
  scope?: any
): paper.Group {
  // Use provided scope or default to global paper
  const paperScope = scope || paper;
  const group = new paperScope.Group();
  const rect = new paperScope.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  const clipPath = new paperScope.Path.Rectangle(rect);
  
  // Calculate diagonal length to ensure complete coverage
  const diagonal = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height);
  const numLines = Math.ceil(diagonal / spacing) * 2;
  
  // Create diagonal lines
  for (let i = -numLines / 2; i <= numLines / 2; i++) {
    const offset = i * spacing;
    const line = new paperScope.Path.Line(
      new paperScope.Point(bounds.x - diagonal, bounds.y + bounds.height / 2 + offset),
      new paperScope.Point(bounds.x + bounds.width + diagonal, bounds.y + bounds.height / 2 + offset)
    );
    
    // Rotate line around center
    const center = new paperScope.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    line.rotate(angle, center);
    
    line.strokeColor = new paperScope.Color(color);
    line.strokeWidth = strokeWidth;
    line.opacity = opacity;
    line.dashArray = [0, 0]; // Solid lines for professional look
    
    group.addChild(line);
  }
  
  // Clip to bounds
  group.clipped = true;
  group.clipMask = clipPath;
  
  return group;
}

/**
 * Calculate scan zones for PLATE geometry
 */
export function calculatePlateZones(
  width: number,
  height: number,
  thickness: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Plates get vertical zones from top to bottom
  for (let i = 0; i < numZones; i++) {
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    // Use provided scanType or default based on zone position
    const zoneType = scanType || (i === 0 || i === numZones - 1 ? ScanType.LONGITUDINAL_0 : ScanType.SHEAR_45);
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: zoneType,
      direction: i % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
      depthStart,
      depthEnd,
      bounds: {
        x: 0,
        y: height * depthStart,
        width: width,
        height: height / numZones
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'rectangular',
      angle: BEAM_ANGLES[zoneType] || 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for BAR geometry
 */
export function calculateBarZones(
  width: number,
  height: number,
  thickness: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  // Bars are similar to plates but with different scan patterns
  const zones: ScanZone[] = [];
  
  for (let i = 0; i < numZones; i++) {
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    // Use provided scanType or default based on zone position
    const zoneType = scanType || (i < 2 ? ScanType.LONGITUDINAL_0 : ScanType.SHEAR_45);
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: zoneType,
      depthStart,
      depthEnd,
      bounds: {
        x: 0,
        y: height * depthStart,
        width: width,
        height: height / numZones
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'rectangular',
      angle: BEAM_ANGLES[zoneType] || 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for DISK geometry
 */
export function calculateDiskZones(
  diameter: number,
  thickness: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const radius = diameter / 2;
  
  // Concentric circular zones from outer to inner
  for (let i = 0; i < numZones; i++) {
    const outerRadius = radius * (1 - i / numZones);
    const innerRadius = radius * (1 - (i + 1) / numZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    // Use provided scanType or default based on zone position
    const zoneType = scanType || (i === 0 ? ScanType.CIRCUMFERENTIAL : ScanType.RADIAL);
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: zoneType,
      depthStart,
      depthEnd,
      bounds: {
        x: -radius,
        y: -radius,
        width: diameter,
        height: diameter
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'annular',
      actualInnerRadius: innerRadius,
      actualOuterRadius: outerRadius,
      angle: BEAM_ANGLES[zoneType] || 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for RING geometry
 */
export function calculateRingZones(
  outerDiameter: number,
  innerDiameter: number,
  thickness: number,
  numZones: number = 4,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const outerRadius = outerDiameter / 2;
  const innerRadius = innerDiameter / 2;
  const wallThickness = outerRadius - innerRadius;
  
  // Radial zones from outer to inner wall
  for (let i = 0; i < numZones; i++) {
    const zoneOuterRadius = outerRadius - (wallThickness * i / numZones);
    const zoneInnerRadius = outerRadius - (wallThickness * (i + 1) / numZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.CIRCUMFERENTIAL : ScanType.RADIAL,
      direction: i % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
      depthStart,
      depthEnd,
      bounds: {
        x: -outerRadius,
        y: -outerRadius,
        width: outerDiameter,
        height: outerDiameter
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'annular',
      actualInnerRadius: Math.max(zoneInnerRadius, innerRadius),
      actualOuterRadius: zoneOuterRadius,
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for TUBE geometry
 */
export function calculateTubeZones(
  outerDiameter: number,
  innerDiameter: number,
  length: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const outerRadius = outerDiameter / 2;
  const innerRadius = innerDiameter / 2;
  const wallThickness = outerRadius - innerRadius;
  
  // Wall thickness zones
  for (let i = 0; i < numZones; i++) {
    const zoneOuterRadius = outerRadius - (wallThickness * i / numZones);
    const zoneInnerRadius = outerRadius - (wallThickness * (i + 1) / numZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.CIRCUMFERENTIAL : 
               i === numZones - 1 ? ScanType.AXIAL_SHEAR : ScanType.RADIAL,
      direction: i % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
      depthStart,
      depthEnd,
      bounds: {
        x: -outerRadius,
        y: -outerRadius,
        width: outerDiameter,
        height: outerDiameter
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'annular',
      actualInnerRadius: Math.max(zoneInnerRadius, innerRadius),
      actualOuterRadius: zoneOuterRadius,
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for CYLINDER geometry
 */
export function calculateCylinderZones(
  diameter: number,
  length: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const radius = diameter / 2;
  
  // Create both radial and axial zones
  const radialZones = Math.ceil(numZones / 2);
  const axialZones = Math.floor(numZones / 2);
  
  // Radial zones (from surface to center)
  for (let i = 0; i < radialZones; i++) {
    const outerRadius = radius * (1 - i / radialZones);
    const innerRadius = radius * (1 - (i + 1) / radialZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.CIRCUMFERENTIAL : ScanType.RADIAL,
      depthStart,
      depthEnd,
      bounds: {
        x: -radius,
        y: -radius,
        width: diameter,
        height: diameter
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'annular',
      actualInnerRadius: innerRadius,
      actualOuterRadius: outerRadius,
      angle: 45
    });
  }
  
  // Axial zones (along length)
  for (let i = 0; i < axialZones; i++) {
    const startPos = i / axialZones;
    const endPos = (i + 1) / axialZones;
    
    zones.push({
      id: `zone-${radialZones + i}`,
      label: generateZoneLabel(radialZones + i),
      scanType: ScanType.AXIAL_SHEAR,
      direction: i % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
      depthStart: 0.5 + startPos * 0.5,
      depthEnd: 0.5 + endPos * 0.5,
      bounds: {
        x: 0,
        y: length * startPos,
        width: diameter,
        height: length / axialZones
      },
      color: getDepthColor(0.5 + (startPos + endPos) / 4),
      opacity: 0.7,
      type: 'rectangular',
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for RECTANGULAR TUBE geometry
 */
export function calculateRectangularTubeZones(
  width: number,
  height: number,
  wallThickness: number,
  length: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Create zones for each wall
  const zonesPerWall = Math.ceil(numZones / 4);
  
  // Top wall zones
  for (let i = 0; i < zonesPerWall; i++) {
    zones.push({
      id: `zone-top-${i}`,
      label: generateZoneLabel(i),
      scanType: ScanType.LONGITUDINAL_0,
      depthStart: i / zonesPerWall,
      depthEnd: (i + 1) / zonesPerWall,
      bounds: {
        x: 0,
        y: 0,
        width: width,
        height: wallThickness
      },
      color: getDepthColor(i / zonesPerWall),
      opacity: 0.7,
      type: 'rectangular',
      angle: 45
    });
  }
  
  // Bottom wall zones
  for (let i = 0; i < zonesPerWall; i++) {
    zones.push({
      id: `zone-bottom-${i}`,
      label: generateZoneLabel(zonesPerWall + i),
      scanType: ScanType.LONGITUDINAL_0,
      depthStart: i / zonesPerWall,
      depthEnd: (i + 1) / zonesPerWall,
      bounds: {
        x: 0,
        y: height - wallThickness,
        width: width,
        height: wallThickness
      },
      color: getDepthColor(i / zonesPerWall),
      opacity: 0.7,
      type: 'rectangular',
      angle: -45
    });
  }
  
  // Left wall zones
  for (let i = 0; i < zonesPerWall; i++) {
    zones.push({
      id: `zone-left-${i}`,
      label: generateZoneLabel(2 * zonesPerWall + i),
      scanType: ScanType.SHEAR_45,
      direction: ScanDirection.CLOCKWISE,
      depthStart: i / zonesPerWall,
      depthEnd: (i + 1) / zonesPerWall,
      bounds: {
        x: 0,
        y: wallThickness,
        width: wallThickness,
        height: height - 2 * wallThickness
      },
      color: getDepthColor(i / zonesPerWall),
      opacity: 0.7,
      type: 'rectangular',
      angle: 45
    });
  }
  
  // Right wall zones
  for (let i = 0; i < zonesPerWall; i++) {
    zones.push({
      id: `zone-right-${i}`,
      label: generateZoneLabel(3 * zonesPerWall + i),
      scanType: ScanType.SHEAR_45,
      direction: ScanDirection.COUNTER_CLOCKWISE,
      depthStart: i / zonesPerWall,
      depthEnd: (i + 1) / zonesPerWall,
      bounds: {
        x: width - wallThickness,
        y: wallThickness,
        width: wallThickness,
        height: height - 2 * wallThickness
      },
      color: getDepthColor(i / zonesPerWall),
      opacity: 0.7,
      type: 'rectangular',
      angle: -45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for HEXAGON geometry
 */
export function calculateHexagonZones(
  width: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const radius = width / 2;
  
  // Create hexagonal zones
  for (let i = 0; i < numZones; i++) {
    const outerRadius = radius * (1 - i / numZones);
    const innerRadius = radius * (1 - (i + 1) / numZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i < 2 ? ScanType.LONGITUDINAL_0 : ScanType.SHEAR_60,
      depthStart,
      depthEnd,
      bounds: {
        x: -radius,
        y: -radius,
        width: width,
        height: width
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'custom', // Hexagonal shape
      actualInnerRadius: innerRadius,
      actualOuterRadius: outerRadius,
      angle: 60
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for SPHERE geometry
 */
export function calculateSphereZones(
  diameter: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  const radius = diameter / 2;
  
  // Concentric spherical zones
  for (let i = 0; i < numZones; i++) {
    const outerRadius = radius * (1 - i / numZones);
    const innerRadius = radius * (1 - (i + 1) / numZones);
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.SURFACE_WAVE : ScanType.LONGITUDINAL_0,
      depthStart,
      depthEnd,
      bounds: {
        x: -radius,
        y: -radius,
        width: diameter,
        height: diameter
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'circular',
      actualInnerRadius: innerRadius,
      actualOuterRadius: outerRadius,
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for CONE geometry
 */
export function calculateConeZones(
  baseDiameter: number,
  topDiameter: number,
  height: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Create zones along the height
  for (let i = 0; i < numZones; i++) {
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    const yPos = height * depthStart;
    const zoneHeight = height / numZones;
    
    // Calculate diameter at this height
    const diameterAtHeight = baseDiameter - (baseDiameter - topDiameter) * depthStart;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.CIRCUMFERENTIAL : ScanType.SHEAR_45,
      direction: i % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
      depthStart,
      depthEnd,
      bounds: {
        x: -diameterAtHeight / 2,
        y: yPos,
        width: diameterAtHeight,
        height: zoneHeight
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'custom',
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for PYRAMID geometry
 */
export function calculatePyramidZones(
  baseWidth: number,
  baseLength: number,
  height: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Create horizontal slice zones
  for (let i = 0; i < numZones; i++) {
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    const yPos = height * depthStart;
    const zoneHeight = height / numZones;
    
    // Calculate dimensions at this height (pyramid tapers)
    const widthAtHeight = baseWidth * (1 - depthStart);
    const lengthAtHeight = baseLength * (1 - depthStart);
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i < 2 ? ScanType.LONGITUDINAL_0 : ScanType.SHEAR_45,
      depthStart,
      depthEnd,
      bounds: {
        x: -widthAtHeight / 2,
        y: yPos,
        width: widthAtHeight,
        height: zoneHeight
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'rectangular',
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for ELLIPSE geometry
 */
export function calculateEllipseZones(
  majorAxis: number,
  minorAxis: number,
  thickness: number,
  numZones: number = 5,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Concentric elliptical zones
  for (let i = 0; i < numZones; i++) {
    const scaleFactor = 1 - i / numZones;
    const nextScaleFactor = 1 - (i + 1) / numZones;
    const depthStart = i / numZones;
    const depthEnd = (i + 1) / numZones;
    
    zones.push({
      id: `zone-${i}`,
      label: generateZoneLabel(i),
      scanType: i === 0 ? ScanType.CIRCUMFERENTIAL : ScanType.SHEAR_45,
      depthStart,
      depthEnd,
      bounds: {
        x: -majorAxis / 2,
        y: -minorAxis / 2,
        width: majorAxis,
        height: minorAxis
      },
      color: getDepthColor((depthStart + depthEnd) / 2),
      opacity: 0.7,
      type: 'custom',
      actualOuterRadius: scaleFactor,
      actualInnerRadius: nextScaleFactor,
      angle: 45
    });
  }
  
  return zones;
}

/**
 * Calculate scan zones for FORGING geometry (complex shape)
 */
export function calculateForgingZones(
  width: number,
  height: number,
  thickness: number,
  numZones: number = 8,
  scanType?: ScanType
): ScanZone[] {
  const zones: ScanZone[] = [];
  
  // Complex forging shapes get adaptive grid-based zones
  const gridCols = Math.ceil(Math.sqrt(numZones));
  const gridRows = Math.ceil(numZones / gridCols);
  const cellWidth = width / gridCols;
  const cellHeight = height / gridRows;
  
  let zoneIndex = 0;
  for (let row = 0; row < gridRows && zoneIndex < numZones; row++) {
    for (let col = 0; col < gridCols && zoneIndex < numZones; col++) {
      const depthStart = zoneIndex / numZones;
      const depthEnd = (zoneIndex + 1) / numZones;
      
      zones.push({
        id: `zone-${zoneIndex}`,
        label: generateZoneLabel(zoneIndex),
        scanType: zoneIndex < 2 ? ScanType.LONGITUDINAL_0 : 
                  zoneIndex < 4 ? ScanType.SHEAR_45 :
                  zoneIndex < 6 ? ScanType.SHEAR_60 : ScanType.SHEAR_70,
        direction: col % 2 === 0 ? ScanDirection.CLOCKWISE : ScanDirection.COUNTER_CLOCKWISE,
        depthStart,
        depthEnd,
        bounds: {
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight
        },
        color: getDepthColor((depthStart + depthEnd) / 2),
        opacity: 0.7,
        type: 'rectangular',
        angle: 45 + (row * 15) // Vary angle slightly by row
      });
      
      zoneIndex++;
    }
  }
  
  return zones;
}

/**
 * Calculate scan zones for IRREGULAR geometry
 */
export function calculateIrregularZones(
  width: number,
  height: number,
  thickness: number,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  // For irregular shapes, use adaptive grid approach
  return calculateForgingZones(width, height, thickness, numZones, scanType);
}

/**
 * Calculate scan zones for any geometry type
 */
export function calculateScanZones(
  geometryType: string,
  dimensions: any,
  numZones: number = 6,
  scanType?: ScanType
): ScanZone[] {
  switch (geometryType.toLowerCase()) {
    case 'plate':
      return calculatePlateZones(dimensions.width, dimensions.height, dimensions.thickness, numZones, scanType);
    
    case 'bar':
      return calculateBarZones(dimensions.width, dimensions.height, dimensions.thickness, numZones, scanType);
    
    case 'disk':
    case 'disk_forging':
    case 'impeller':
      return calculateDiskZones(dimensions.diameter || dimensions.width, dimensions.thickness, numZones, scanType);

    case 'blisk':
      // Blisk has inner diameter - treat as ring/hollow disk
      return calculateRingZones(
        dimensions.outerDiameter || dimensions.diameter || dimensions.width,
        dimensions.innerDiameter || ((dimensions.diameter || dimensions.width) * 0.3),
        dimensions.thickness,
        numZones,
        scanType
      );

    case 'ring':
    case 'ring_forging':
      return calculateRingZones(
        dimensions.outerDiameter || dimensions.diameter,
        dimensions.innerDiameter || (dimensions.diameter * 0.5),
        dimensions.thickness,
        numZones,
        scanType
      );

    case 'cylinder':
      return calculateCylinderZones(dimensions.diameter || dimensions.width, dimensions.length, numZones, scanType);
    
    case 'tube':
      return calculateTubeZones(
        dimensions.outerDiameter || dimensions.diameter,
        dimensions.innerDiameter || (dimensions.diameter * 0.7),
        dimensions.length,
        numZones,
        scanType
      );
    
    case 'rectangular_tube':
    case 'rectangulartube':
      return calculateRectangularTubeZones(
        dimensions.width,
        dimensions.height,
        dimensions.wallThickness || dimensions.thickness,
        dimensions.length,
        numZones,
        scanType
      );
    
    case 'hexagon':
      return calculateHexagonZones(dimensions.width, numZones, scanType);
    
    case 'sphere':
      return calculateSphereZones(dimensions.diameter || dimensions.width, numZones, scanType);
    
    case 'cone':
      return calculateConeZones(
        dimensions.baseDiameter || dimensions.diameter,
        dimensions.topDiameter || (dimensions.diameter * 0.5),
        dimensions.height || dimensions.length,
        numZones,
        scanType
      );
    
    case 'pyramid':
      return calculatePyramidZones(
        dimensions.width,
        dimensions.length || dimensions.width,
        dimensions.height || dimensions.width,
        numZones,
        scanType
      );
    
    case 'ellipse':
      return calculateEllipseZones(
        dimensions.majorAxis || dimensions.width,
        dimensions.minorAxis || dimensions.height,
        dimensions.thickness,
        numZones,
        scanType
      );
    
    case 'forging':
      return calculateForgingZones(dimensions.width, dimensions.height, dimensions.thickness, numZones, scanType);
    
    case 'irregular':
      return calculateIrregularZones(dimensions.width, dimensions.height, dimensions.thickness, numZones, scanType);
    
    default:
      // Default to plate zones for unknown geometries
      console.warn(`Unknown geometry type: ${geometryType}, defaulting to plate zones`);
      return calculatePlateZones(dimensions.width || 100, dimensions.height || 100, dimensions.thickness || 10, numZones, scanType);
  }
}

/**
 * Render a professional scan zone with hatching pattern
 */
export function renderScanZone(
  generator: TechnicalDrawingGenerator,
  zone: ScanZone,
  showLabel: boolean = true,
  showHatching: boolean = true,
  showDirectionArrow: boolean = true
): paper.Group {
  const scope = generator.getScope();
  const group = new scope.Group();
  
  // Create zone shape based on type
  let zonePath: paper.Path;
  
  switch (zone.type) {
    case 'rectangular':
      zonePath = new scope.Path.Rectangle(
        new scope.Rectangle(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height)
      );
      break;
      
    case 'circular': {
      const center = new scope.Point(
        zone.bounds.x + zone.bounds.width / 2,
        zone.bounds.y + zone.bounds.height / 2
      );
      zonePath = new scope.Path.Circle(center, zone.actualOuterRadius || zone.bounds.width / 2);
      break;
    }
    
    case 'annular': {
      if (zone.actualInnerRadius !== undefined && zone.actualOuterRadius !== undefined) {
        const center = new scope.Point(
          zone.bounds.x + zone.bounds.width / 2,
          zone.bounds.y + zone.bounds.height / 2
        );
        const outerCircle = new scope.Path.Circle(center, zone.actualOuterRadius);
        const innerCircle = new scope.Path.Circle(center, zone.actualInnerRadius);
        zonePath = outerCircle.subtract(innerCircle);
        innerCircle.remove();
      } else {
        zonePath = new scope.Path.Rectangle(
          new scope.Rectangle(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height)
        );
      }
      break;
    }
    
    default:
      zonePath = new scope.Path.Rectangle(
        new scope.Rectangle(zone.bounds.x, zone.bounds.y, zone.bounds.width, zone.bounds.height)
      );
  }
  
  // Apply zone color and styling  
  zonePath.fillColor = new scope.Color(zone.color);
  zonePath.opacity = zone.opacity;
  zonePath.strokeColor = new scope.Color('#333333');
  zonePath.strokeWidth = 2;
  group.addChild(zonePath);
  
  // Add hatching pattern if enabled
  if (showHatching) {
    const hatching = createHatchingPattern(
      zone.bounds,
      zone.angle || 45,
      8,  // spacing
      1.5, // stroke width
      '#000000',
      0.3,  // opacity
      scope  // Pass the scope to createHatchingPattern
    );
    group.addChild(hatching);
  }
  
  // Add zone label if enabled
  if (showLabel) {
    const labelX = zone.bounds.x + zone.bounds.width / 2;
    const labelY = zone.bounds.y + zone.bounds.height / 2;
    
    // Create label background (white circle)
    const labelBg = new scope.Path.Circle(new scope.Point(labelX, labelY), 15);
    labelBg.fillColor = new scope.Color('#000000');
    labelBg.strokeColor = new scope.Color('#000000');
    labelBg.strokeWidth = 2;
    group.addChild(labelBg);
    
    // Create label text
    const labelText = new scope.PointText(new scope.Point(labelX, labelY + 5));
    labelText.content = zone.label;
    labelText.fillColor = new scope.Color('#000000');
    labelText.fontSize = 14;
    labelText.fontWeight = 'bold';
    labelText.justification = 'center';
    group.addChild(labelText);
  }
  
  // Add scan direction arrow for circular/annular zones when direction is defined
  if (showDirectionArrow && zone.direction && zone.direction !== ScanDirection.NONE) {
    // Only draw directional arrows where it has clear physical meaning
    if (zone.type === 'annular' || zone.type === 'circular') {
      const centerX = zone.bounds.x + zone.bounds.width / 2;
      const centerY = zone.bounds.y + zone.bounds.height / 2;

      // Use mid-wall radius for annular zones, or a scaled radius for solid circular zones
      const baseRadius = zone.actualOuterRadius
        ? (zone.actualInnerRadius !== undefined
            ? (zone.actualInnerRadius + zone.actualOuterRadius) / 2
            : zone.actualOuterRadius * 0.85)
        : (Math.min(zone.bounds.width, zone.bounds.height) / 2) * 0.8;

      const arcExtentDeg = 60; // Short arc segment to indicate direction
      const startAngleDeg = -arcExtentDeg / 2;
      const endAngleDeg = arcExtentDeg / 2;
      const segments = 16;

      const arrowPath = new scope.Path();

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // For clockwise we traverse angles in decreasing order, for counter-clockwise in increasing
        const angleDeg = zone.direction === ScanDirection.CLOCKWISE
          ? startAngleDeg - t * arcExtentDeg
          : startAngleDeg + t * arcExtentDeg;
        const angleRad = (angleDeg * Math.PI) / 180;
        const px = centerX + baseRadius * Math.cos(angleRad);
        const py = centerY + baseRadius * Math.sin(angleRad);
        arrowPath.add(new scope.Point(px, py));
      }

      arrowPath.strokeColor = new scope.Color('#000000');
      arrowPath.strokeWidth = 1.5;

      // Draw arrowhead at the end of the path using the generator's arrow helper
      if (arrowPath.segments.length >= 2) {
        const lastIndex = arrowPath.segments.length - 1;
        const p0 = arrowPath.segments[lastIndex - 1].point;
        const p1 = arrowPath.segments[lastIndex].point;
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        generator.drawArrow(p1.x, p1.y, angle, 10);

        // For bidirectional scans, also draw arrow at the start of the path
        if (zone.direction === ScanDirection.BIDIRECTIONAL) {
          const s0 = arrowPath.segments[1].point;
          const s1 = arrowPath.segments[0].point;
          const startAngle = Math.atan2(s1.y - s0.y, s1.x - s0.x);
          generator.drawArrow(s1.x, s1.y, startAngle, 10);
        }
      }

      group.addChild(arrowPath);
    }
  }
  
  zone.path = group;
  return group;
}

/**
 * Generate professional scan list table
 */
export function generateScanListTable(zones: ScanZone[]): ScanListEntry[] {
  const scanList: ScanListEntry[] = [];
  
  zones.forEach((zone) => {
    const entry: ScanListEntry = {
      zone: zone.label,
      scanType: zone.scanType,
      direction: zone.direction || '',
      coverage: `${(zone.depthStart * 100).toFixed(0)}% - ${(zone.depthEnd * 100).toFixed(0)}%`,
      notes: zone.type === 'annular' ? 'Radial scan' : 
             zone.type === 'circular' ? 'Full coverage' : '',
      color: zone.color  // Include the zone's actual color
    };
    
    scanList.push(entry);
  });
  
  return scanList;
}

/**
 * Render professional scan list table on canvas
 */
export function renderScanListTable(
  generator: TechnicalDrawingGenerator,
  scanList: ScanListEntry[],
  x: number,
  y: number
): void {
  const scope = generator.getScope();
  const rowHeight = 25;
  const colWidths = [60, 200, 150, 100, 150];
  const headers = ['Zone', 'Scan Type', 'Direction', 'Coverage', 'Notes'];
  
  // Draw title
  generator.drawText(x + 200, y - 30, 'SCAN LIST', 18, '#000000');
  
  // Draw header background
  const headerBg = new scope.Path.Rectangle(
    new scope.Rectangle(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
  );
  headerBg.fillColor = new scope.Color('#333333');
  headerBg.opacity = 0.8;
  
  // Draw headers
  let currentX = x;
  headers.forEach((header, index) => {
    generator.drawText(currentX + colWidths[index] / 2, y + rowHeight / 2 + 5, header, '12px', 'bold');
    currentX += colWidths[index];
  });
  
  // Draw table rows
  scanList.forEach((entry, rowIndex) => {
    const rowY = y + (rowIndex + 1) * rowHeight;
    
    // Alternate row background
    if (rowIndex % 2 === 0) {
      const rowBg = new scope.Path.Rectangle(
        new scope.Rectangle(x, rowY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
      );
      rowBg.fillColor = new scope.Color('#F0F0F0');
      rowBg.opacity = 0.3;
    }
    
    // Draw row data
    currentX = x;
    const rowData = [entry.zone, entry.scanType, entry.direction || '-', entry.coverage, entry.notes || '-'];
    
    rowData.forEach((data, colIndex) => {
      // Zone column gets special coloring using the actual zone color
      if (colIndex === 0) {
        const zoneBg = new scope.Path.Circle(
          new scope.Point(currentX + colWidths[colIndex] / 2, rowY + rowHeight / 2),
          12
        );
        zoneBg.fillColor = new scope.Color(entry.color);  // Use the actual zone color
        zoneBg.opacity = 0.6;
        generator.drawText(
          currentX + colWidths[colIndex] / 2,
          rowY + rowHeight / 2 + 5,
          data,
          '12px',
          'bold'
        );
      } else {
        generator.drawText(
          currentX + colWidths[colIndex] / 2,
          rowY + rowHeight / 2 + 5,
          data,
          '11px'
        );
      }
      currentX += colWidths[colIndex];
    });
  });
  
  // Draw table border
  generator.drawRectangle(
    x,
    y,
    colWidths.reduce((a, b) => a + b, 0),
    (scanList.length + 1) * rowHeight,
    'visible'
  );
  
  // Draw column separators
  currentX = x;
  for (let i = 0; i < colWidths.length - 1; i++) {
    currentX += colWidths[i];
    generator.drawLine(
      currentX,
      y,
      currentX,
      y + (scanList.length + 1) * rowHeight,
      'visible'
    );
  }
}

/**
 * Draw gradient fill between two colors
 */
export function drawGradientFill(
  scope: paper.PaperScope,
  path: paper.Path,
  startColor: string,
  endColor: string,
  angle: number = 0
): void {
  const bounds = path.bounds;
  const angleRad = (angle * Math.PI) / 180;
  
  // Calculate gradient points based on angle
  const gradientLength = Math.max(bounds.width, bounds.height);
  const startPoint = new scope.Point(
    bounds.center.x - (gradientLength / 2) * Math.cos(angleRad),
    bounds.center.y - (gradientLength / 2) * Math.sin(angleRad)
  );
  const endPoint = new scope.Point(
    bounds.center.x + (gradientLength / 2) * Math.cos(angleRad),
    bounds.center.y + (gradientLength / 2) * Math.sin(angleRad)
  );
  
  // Create gradient
  const gradient = new scope.Gradient();
  gradient.stops = [
    new scope.GradientStop(new scope.Color(startColor), 0),
    new scope.GradientStop(new scope.Color(endColor), 1)
  ];
  
  path.fillColor = new scope.Color(gradient, startPoint, endPoint);
}

/**
 * Draw a zone with label
 */
export function drawZoneWithLabel(
  generator: TechnicalDrawingGenerator,
  bounds: { x: number; y: number; width: number; height: number },
  color: string,
  label: string,
  opacity: number = 0.4
): void {
  const scope = generator.getScope();
  
  // Create rectangle
  const rect = new scope.Path.Rectangle(
    new scope.Point(bounds.x, bounds.y),
    new scope.Size(bounds.width, bounds.height)
  );
  
  // Apply styling
  rect.fillColor = new scope.Color(color);
  rect.fillColor.alpha = opacity;
  rect.strokeColor = new scope.Color(color);
  rect.strokeColor.alpha = Math.min(1, opacity + 0.3);
  rect.strokeWidth = 1.5;
  
  // Add label - HIGH CONTRAST (scan zone labels must remain black for visibility over color overlays)
  const labelX = bounds.x + bounds.width / 2;
  const labelY = bounds.y + bounds.height / 2;
  generator.drawText(labelX, labelY, label, 12, '#000000');
  
  // Add depth indicator in corner - HIGH CONTRAST
  const depthText = `${(opacity * 100).toFixed(0)}%`;
  generator.drawText(
    bounds.x + bounds.width - 20,
    bounds.y + 15,
    depthText,
    9,
    '#000000'
  );
}

/**
 * Add scan coverage legend
 */
export function addScanLegend(
  generator: TechnicalDrawingGenerator,
  zones: ScanZone[],
  position: LegendPosition
): void {
  const scope = generator.getScope();
  const { x, y, orientation } = position;
  
  // Legend title - HIGH CONTRAST
  generator.drawText(x, y - 10, 'SCAN ZONES', 12, '#000000');
  
  const legendItemSize = 20;
  const spacing = 5;
  const textOffset = 25;
  
  zones.forEach((zone, index) => {
    let itemX = x;
    let itemY = y;
    
    if (orientation === 'vertical') {
      itemY = y + index * (legendItemSize + spacing);
    } else {
      itemX = x + index * (legendItemSize * 3 + spacing);
    }
    
    // Color box
    const box = new scope.Path.Rectangle(
      new scope.Point(itemX, itemY),
      new scope.Size(legendItemSize, legendItemSize)
    );
    box.fillColor = new scope.Color(zone.color);
    box.fillColor.alpha = zone.opacity;
    box.strokeColor = new scope.Color('#000000');
    box.strokeWidth = 1;
    
    // Label
    const labelX = orientation === 'vertical' ? itemX + textOffset : itemX + legendItemSize / 2;
    const labelY = orientation === 'vertical' ? itemY + legendItemSize / 2 : itemY + textOffset;
    generator.drawText(labelX, labelY, zone.label, 10, '#000000');
    
    // Depth range
    const depthText = `${(zone.depthStart * 100).toFixed(0)}-${(zone.depthEnd * 100).toFixed(0)}%`;
    const depthX = orientation === 'vertical' ? itemX + textOffset + 20 : itemX;
    const depthY = orientation === 'vertical' ? itemY + legendItemSize / 2 : itemY + textOffset + 12;
    generator.drawText(depthX, depthY, depthText, 8, '#000000');
  });
}

/**
 * Calculate beam coverage area based on probe position and angle
 */
export function calculateBeamCoverage(
  probeX: number,
  probeY: number,
  beamAngle: number,
  beamSpread: number,
  maxDepth: number
): paper.Path {
  const angleRad = (beamAngle * Math.PI) / 180;
  const spreadRad = (beamSpread * Math.PI) / 180;
  
  // Create a triangle/cone shape representing beam coverage
  const scope = new paper.PaperScope();
  const path = new scope.Path();
  
  // Starting point (probe position)
  path.add(new scope.Point(probeX, probeY));
  
  // Left edge of beam
  const leftAngle = angleRad - spreadRad / 2;
  path.add(new scope.Point(
    probeX + maxDepth * Math.cos(leftAngle),
    probeY + maxDepth * Math.sin(leftAngle)
  ));
  
  // Arc at maximum depth
  const centerAngle = angleRad;
  const rightAngle = angleRad + spreadRad / 2;
  
  // Add arc points for smooth coverage area
  for (let a = leftAngle; a <= rightAngle; a += spreadRad / 10) {
    path.add(new scope.Point(
      probeX + maxDepth * Math.cos(a),
      probeY + maxDepth * Math.sin(a)
    ));
  }
  
  // Right edge of beam
  path.add(new scope.Point(
    probeX + maxDepth * Math.cos(rightAngle),
    probeY + maxDepth * Math.sin(rightAngle)
  ));
  
  // Close the path back to probe
  path.closed = true;
  
  return path;
}

/**
 * Toggle scan coverage visibility
 */
export function toggleScanCoverage(zones: ScanZone[], visible: boolean): void {
  zones.forEach(zone => {
    if (zone.path) {
      zone.path.visible = visible;
    }
  });
}

/**
 * Export scan coverage configuration
 */
export interface ScanCoverageConfig {
  enabled: boolean;
  showLabels: boolean;
  showLegend: boolean;
  opacity: number;
  colorScheme: 'depth' | 'intensity' | 'custom';
  zones: ScanZone[];
}

/**
 * Apply scan coverage to existing drawing
 */
/**
 * Create shape-specific clipping mask for accurate scan coverage
 */
export function createShapeClippingMask(
  generator: TechnicalDrawingGenerator,
  shapeType: 'plate' | 'tube' | 'cylinder' | 'cone' | 'sphere',
  viewType: 'front' | 'top' | 'side' | 'section',
  bounds: { x: number; y: number; width: number; height: number },
  dimensions: any
): paper.Path | null {
  const scope = generator.getScope();
  
  // Create accurate shape masks for different views
  switch (shapeType) {
    case 'tube':
      if (viewType === 'top') {
        // Create annular ring for tube top view
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const outerRadius = bounds.width / 2;
        const wallThickness = dimensions.wallThickness || dimensions.thickness || 5;
        const innerRadius = outerRadius * (dimensions.innerDiameter / dimensions.outerDiameter || 0.8);
        
        const outer = new scope.Path.Circle(new scope.Point(centerX, centerY), outerRadius);
        const inner = new scope.Path.Circle(new scope.Point(centerX, centerY), innerRadius);
        const mask = outer.subtract(inner);
        inner.remove();
        outer.remove();
        return mask as paper.Path;
      } else if (viewType === 'section') {
        // Create hollow rectangle for section view
        const wallThickness = dimensions.wallThickness || dimensions.thickness || 5;
        const wallRatio = 2 * wallThickness / dimensions.outerDiameter;
        
        const outer = new scope.Path.Rectangle(
          new scope.Point(bounds.x, bounds.y),
          new scope.Size(bounds.width, bounds.height)
        );
        const inner = new scope.Path.Rectangle(
          new scope.Point(
            bounds.x + bounds.height * wallRatio / 2,
            bounds.y + bounds.height * wallRatio / 2
          ),
          new scope.Size(
            bounds.width - bounds.height * wallRatio,
            bounds.height * (1 - wallRatio)
          )
        );
        const mask = outer.subtract(inner);
        inner.remove();
        outer.remove();
        return mask as paper.Path;
      }
      break;
      
    case 'cylinder':
      if (viewType === 'top') {
        // Solid circle for cylinder top view
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radius = Math.min(bounds.width, bounds.height) / 2;
        return new scope.Path.Circle(new scope.Point(centerX, centerY), radius);
      }
      break;
      
    case 'cone':
      if (viewType === 'front' || viewType === 'side') {
        // Trapezoid for cone side view
        const path = new scope.Path();
        const topRatio = dimensions.topDiameter / dimensions.bottomDiameter;
        const topWidth = bounds.width * topRatio;
        const topOffset = (bounds.width - topWidth) / 2;
        
        path.add(new scope.Point(bounds.x + topOffset, bounds.y));
        path.add(new scope.Point(bounds.x + bounds.width - topOffset, bounds.y));
        path.add(new scope.Point(bounds.x + bounds.width, bounds.y + bounds.height));
        path.add(new scope.Point(bounds.x, bounds.y + bounds.height));
        path.closed = true;
        return path;
      } else if (viewType === 'top') {
        // Circle for top view
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radius = bounds.width / 2;
        return new scope.Path.Circle(new scope.Point(centerX, centerY), radius);
      }
      break;
      
    case 'sphere': {
      // Always a circle for sphere
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const radius = Math.min(bounds.width, bounds.height) / 2;
      return new scope.Path.Circle(new scope.Point(centerX, centerY), radius);
    }
      
    case 'plate':
      // Rectangle for plate
      return new scope.Path.Rectangle(
        new scope.Point(bounds.x, bounds.y),
        new scope.Size(bounds.width, bounds.height)
      );
  }
  
  // Default to rectangle if no specific shape
  return new scope.Path.Rectangle(
    new scope.Point(bounds.x, bounds.y),
    new scope.Size(bounds.width, bounds.height)
  );
}

export function applyScanCoverage(
  generator: TechnicalDrawingGenerator,
  shapeType: 'plate' | 'tube' | 'cylinder' | 'cone' | 'sphere',
  dimensions: any,
  scanType: ScanType,
  config: Partial<ScanCoverageConfig> = {}
): ScanZone[] {
  const defaultConfig: ScanCoverageConfig = {
    enabled: true,
    showLabels: true,
    showLegend: true,
    opacity: 0.4,
    colorScheme: 'depth',
    zones: []
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // Calculate zones based on shape type
  let zones: ScanZone[] = [];
  
  switch (shapeType) {
    case 'plate':
      zones = calculatePlateZones(
        dimensions.width,
        dimensions.height,
        dimensions.thickness,
        5,  // numZones
        scanType
      );
      break;
      
    case 'tube':
      zones = calculateTubeZones(
        dimensions.outerDiameter,
        dimensions.innerDiameter,
        dimensions.length,
        4,
        scanType
      );
      break;
      
    case 'cylinder':
      zones = calculateCylinderZones(
        dimensions.diameter,
        dimensions.length,
        5,  // numZones
        scanType
      );
      break;
      
    case 'cone':
      zones = calculateConeZones(
        dimensions.baseDiameter,
        dimensions.topDiameter,
        dimensions.height,
        5,  // numZones
        scanType
      );
      break;
      
    case 'sphere':
      zones = calculateSphereZones(
        dimensions.diameter,
        4,  // numZones
        scanType
      );
      break;
  }
  
  // Render zones if enabled
  if (finalConfig.enabled) {
    zones.forEach(zone => {
      zone.opacity = finalConfig.opacity;
      renderScanZone(generator, zone, finalConfig.showLabels);
    });
    
    // Add legend if requested
    if (finalConfig.showLegend && zones.length > 0) {
      const legendPosition: LegendPosition = {
        x: 50,
        y: 50,
        orientation: 'vertical'
      };
      addScanLegend(generator, zones, legendPosition);
    }
  }
  
  return zones;
}

// Extension method for TechnicalDrawingGenerator
export function extendGeneratorWithScanCoverage(generator: TechnicalDrawingGenerator): void {
  // Add getScope method if it doesn't exist
  if (!(generator as any).getScope) {
    (generator as any).getScope = function() {
      return this.scope;
    };
  }
}

/**
 * Render scan zones with accurate clipping to shape boundaries
 */
export function renderClippedScanCoverage(
  generator: TechnicalDrawingGenerator,
  zones: ScanZone[],
  viewType: 'front' | 'top' | 'side' | 'section',
  viewBounds: { x: number; y: number; width: number; height: number },
  clippingMask: paper.Path | null,
  showLabels: boolean = true
): void {
  if (!clippingMask || zones.length === 0) return;
  
  const scope = generator.getScope();
  
  // Create a group to hold all scan zones
  const scanGroup = new scope.Group();
  
  zones.forEach((zone, index) => {
    // Create the zone shape based on view type
    let zonePath: paper.Path;
    
    if (viewType === 'top' && (zone.type === 'circular' || zone.type === 'annular')) {
      // For top views with radial zones
      const centerX = viewBounds.x + viewBounds.width / 2;
      const centerY = viewBounds.y + viewBounds.height / 2;
      
      if (zone.type === 'circular') {
        zonePath = new scope.Path.Circle(
          new scope.Point(centerX, centerY),
          (viewBounds.width / 2) * zone.depthEnd
        );
      } else {
        const outerR = (viewBounds.width / 2) * zone.depthEnd;
        const innerR = (viewBounds.width / 2) * zone.depthStart;
        
        const outerCircle = new scope.Path.Circle(
          new scope.Point(centerX, centerY),
          outerR
        );
        const innerCircle = new scope.Path.Circle(
          new scope.Point(centerX, centerY),
          innerR
        );
        zonePath = outerCircle.subtract(innerCircle) as paper.Path;
        innerCircle.remove();
        outerCircle.remove();
      }
    } else if (viewType === 'front' || viewType === 'side') {
      // For front/side views with depth zones
      const zoneHeight = viewBounds.height / zones.length;
      zonePath = new scope.Path.Rectangle(
        new scope.Point(
          viewBounds.x,
          viewBounds.y + index * zoneHeight
        ),
        new scope.Size(viewBounds.width, zoneHeight)
      );
    } else {
      // Default rectangular zones
      const zoneWidth = viewBounds.width / zones.length;
      zonePath = new scope.Path.Rectangle(
        new scope.Point(
          viewBounds.x + index * zoneWidth,
          viewBounds.y
        ),
        new scope.Size(zoneWidth, viewBounds.height)
      );
    }
    
    // Clip the zone to the shape mask for accurate boundaries
    const clippedZone = zonePath.intersect(clippingMask);
    zonePath.remove();
    
    if (clippedZone && clippedZone.bounds.area > 0) {
      // Apply the depth color gradient with proper opacity
      clippedZone.fillColor = new scope.Color(zone.color);
      clippedZone.fillColor.alpha = zone.opacity || 0.4;
      
      // Subtle stroke for definition
      clippedZone.strokeColor = new scope.Color(zone.color);
      clippedZone.strokeColor.alpha = Math.min(1, (zone.opacity || 0.4) + 0.1);
      clippedZone.strokeWidth = 0.25;
      
      scanGroup.addChild(clippedZone);
      
      // Add label if zone is large enough to show it
      if (showLabels && clippedZone.bounds.width > 15 && clippedZone.bounds.height > 15) {
        const labelSize = Math.min(10, Math.min(clippedZone.bounds.width, clippedZone.bounds.height) / 3);
        generator.drawText(
          clippedZone.bounds.center.x,
          clippedZone.bounds.center.y,
          zone.label,
          labelSize,
          '#000000'
        );
      }
    }
  });
  
  // Place the scan group behind the main drawing elements
  scanGroup.sendToBack();
}

export default {
  SCAN_DEPTH_COLORS,
  ScanType,
  ScanDirection,
  BEAM_ANGLES,
  getDepthColor,
  generateZoneLabel,
  createHatchingPattern,
  calculatePlateZones,
  calculateBarZones,
  calculateDiskZones,
  calculateRingZones,
  calculateTubeZones,
  calculateCylinderZones,
  calculateRectangularTubeZones,
  calculateHexagonZones,
  calculateSphereZones,
  calculateConeZones,
  calculatePyramidZones,
  calculateEllipseZones,
  calculateForgingZones,
  calculateIrregularZones,
  calculateScanZones,
  renderScanZone,
  generateScanListTable,
  renderScanListTable,
  renderClippedScanCoverage,
  createShapeClippingMask,
  drawGradientFill,
  drawZoneWithLabel,
  addScanLegend,
  calculateBeamCoverage,
  toggleScanCoverage,
  applyScanCoverage,
  extendGeneratorWithScanCoverage
};