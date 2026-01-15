/**
 * Digital Twin Integration Types
 * Link UT inspection results to 3D part visualization
 */

// 3D Position
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// Indication location on part
export interface IndicationLocation {
  id: string;
  position: Position3D;  // mm from origin
  depth: number;         // mm from surface
  surfacePoint: Position3D; // Surface entry point
  normalVector?: Position3D; // Surface normal at entry

  // Extent
  length?: number;       // mm (for linear indications)
  width?: number;        // mm
  orientation?: number;  // degrees from reference

  // Association
  scanDirection?: string; // A-L scan direction
  scanId?: string;       // Reference to scan data
}

// Indication severity for visualization
export type IndicationSeverity = "acceptable" | "recordable" | "rejectable";

// Mapped indication with classification
export interface MappedIndication {
  id: string;
  location: IndicationLocation;

  // UT Data
  amplitude: number;     // % DAC
  defectType?: string;   // From classifier
  confidence?: number;   // Classification confidence

  // Status
  severity: IndicationSeverity;
  isEvaluated: boolean;
  evaluatedBy?: string;
  evaluationDate?: string;
  notes?: string;

  // Visual
  color?: string;        // Override color
  visible: boolean;
}

// Part zone definition
export interface PartZone {
  id: string;
  name: string;
  type: "critical" | "standard" | "low_priority";
  vertices: Position3D[]; // Boundary polygon
  acceptanceClass?: string;
  notes?: string;
}

// Scan coverage region
export interface ScanCoverage {
  id: string;
  scanDirection: string;
  coveredRegion: Position3D[]; // Boundary
  coveragePercent: number;
  inspectionDate?: string;
}

// Digital Twin state
export interface DigitalTwinState {
  // Part info
  partId: string;
  partNumber: string;
  serialNumber?: string;

  // Geometry
  modelUrl?: string;     // URL to 3D model file
  modelType?: "step" | "stl" | "obj" | "gltf";
  boundingBox: {
    min: Position3D;
    max: Position3D;
  };

  // Indications
  indications: MappedIndication[];

  // Zones
  zones: PartZone[];

  // Coverage
  scanCoverage: ScanCoverage[];

  // View settings
  viewSettings: ViewSettings;

  // Statistics
  stats: TwinStats;
}

// View settings
export interface ViewSettings {
  showIndications: boolean;
  showZones: boolean;
  showCoverage: boolean;
  showMesh: boolean;
  showWireframe: boolean;
  indicationScale: number;  // Scale factor for indication markers
  transparency: number;     // Part transparency 0-1

  // Filters
  severityFilter: IndicationSeverity[];
  minAmplitude?: number;
  maxAmplitude?: number;
  defectTypeFilter?: string[];

  // Colors
  acceptableColor: string;
  recordableColor: string;
  rejectableColor: string;
  zoneColors: {
    critical: string;
    standard: string;
    low_priority: string;
  };
}

// Statistics
export interface TwinStats {
  totalIndications: number;
  acceptableCount: number;
  recordableCount: number;
  rejectableCount: number;
  coveragePercent: number;
  zonesInspected: number;
  totalZones: number;
}

// Import format for indications
export interface IndicationImport {
  x: number;
  y: number;
  z?: number;
  depth: number;
  amplitude: number;
  scanDirection?: string;
  length?: number;
  notes?: string;
}

// Export format for reports
export interface TwinExportData {
  partInfo: {
    partNumber: string;
    serialNumber?: string;
    inspectionDate: string;
  };
  summary: TwinStats;
  indications: {
    id: string;
    location: string;  // Formatted location
    amplitude: number;
    severity: string;
    defectType?: string;
    notes?: string;
  }[];
  coverageMap?: string; // Base64 image
}

// Default view settings
export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  showIndications: true,
  showZones: true,
  showCoverage: false,
  showMesh: true,
  showWireframe: false,
  indicationScale: 1,
  transparency: 0.3,
  severityFilter: ["acceptable", "recordable", "rejectable"],
  acceptableColor: "#22c55e",  // green
  recordableColor: "#eab308",  // yellow
  rejectableColor: "#ef4444",  // red
  zoneColors: {
    critical: "#ef4444",
    standard: "#3b82f6",
    low_priority: "#6b7280",
  },
};

// Severity thresholds
export const SEVERITY_THRESHOLDS = {
  recordable: 50,   // % DAC
  rejectable: 100,  // % DAC
};

// Calculate severity from amplitude
export function calculateSeverity(amplitude: number): IndicationSeverity {
  if (amplitude >= SEVERITY_THRESHOLDS.rejectable) return "rejectable";
  if (amplitude >= SEVERITY_THRESHOLDS.recordable) return "recordable";
  return "acceptable";
}
