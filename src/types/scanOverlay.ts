// ============================================================================
// CUSTOM DRAWING OVERLAY TYPES
// For user-uploaded drawings with scan direction arrows
// ============================================================================

import type { PartGeometry } from './techniqueSheet';

/**
 * Scan arrow overlay on custom drawing
 * Position is normalized (0-1) for scale independence
 */
export interface ScanArrow {
  /** Scan direction code (A, B, C, etc.) */
  direction: string;
  /** X position normalized 0-1 (left to right) */
  x: number;
  /** Y position normalized 0-1 (top to bottom) */
  y: number;
  /** Arrow angle in degrees (0 = right, 90 = down) */
  angle: number;
  /** Arrow length normalized 0-1 */
  length: number;
  /** Whether arrow is visible (synced with scan details table) */
  visible: boolean;
  /** Arrow color */
  color: string;
  /** Label text (e.g., "A, LW 0°") */
  label: string;
}

/**
 * Result from Ollama vision analysis
 */
export interface GeometryAnalysis {
  /** Detected geometry type */
  geometry: PartGeometry | 'unknown';
  /** Confidence score 0-1 */
  confidence: number;
  /** AI reasoning for the detection */
  reasoning: string;
  /** Raw response from AI (for debugging) */
  rawResponse?: string;
}

/**
 * Complete custom drawing data with overlay
 */
export interface CustomDrawingData {
  /** Base64 encoded image */
  image: string;
  /** Original image width in pixels */
  imageWidth: number;
  /** Original image height in pixels */
  imageHeight: number;
  /** Geometry detected by AI (if available) */
  detectedGeometry?: PartGeometry | 'unknown';
  /** AI confidence score */
  aiConfidence?: number;
  /** Geometry confirmed/selected by user */
  userConfirmedGeometry: PartGeometry;
  /** Scan arrows overlay */
  arrows: ScanArrow[];
  /** ISO timestamp of last modification */
  lastModified: string;
}

/**
 * Ollama server status
 */
export interface OllamaStatus {
  /** Whether Ollama server is available */
  available: boolean;
  /** List of available vision models */
  models: string[];
  /** Error message if unavailable */
  error?: string;
}

/**
 * Arrow template for a specific geometry
 * Used to generate default arrow positions
 */
export interface ArrowTemplate {
  direction: string;
  /** Default X position (normalized 0-1) */
  defaultX: number;
  /** Default Y position (normalized 0-1) */
  defaultY: number;
  /** Default angle in degrees */
  defaultAngle: number;
  /** Default length (normalized 0-1) */
  defaultLength: number;
  /** Whether enabled by default for this geometry */
  defaultEnabled: boolean;
  /** Arrow color */
  color: string;
  /** Label text */
  label: string;
}

/**
 * Configuration for arrow templates per geometry
 */
export type ArrowTemplateConfig = Record<PartGeometry | string, ArrowTemplate[]>;
