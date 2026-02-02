// TypeScript interfaces for ScanMaster CAD Engine Integration

export interface ScanMasterCADRequest {
  shapeType: "calibration_block" | "flat_block" | "fbh_block" | "test_block";
  parameters: {
    length: number;    // Block length in mm
    width: number;     // Block width in mm
    height: number;    // Block height in mm
  };
  calibrationData: {
    // Data from Calibration tab
    fbhSizes?: string;           // "3/64, 1/8, 1/4" or "auto" for smart selection
    metalTravelDistance?: number; // Metal travel distance (mm)
    blockDimensions?: {          // Block dimensions
      L: number;
      W: number;
      H: number;
    };
    standardType?: string;       // "MIL-STD-2154" | "ASTM-A388" | "ASME-V"

    // Data from Inspection Setup tab
    material?: string;           // "aluminum" | "steel" | "stainless_steel" | "titanium"
    partThickness?: number;      // Part thickness in mm
    partType?: string;           // Part type
    isHollow?: boolean;          // Is the part hollow
    acceptanceClass?: string;    // "AAA" | "AA" | "A" | "B" | "C"

    // Data from Equipment tab
    probeType?: string;          // "contact" | "ultrasonic" | "immersion"
    frequency?: number;          // Frequency in MHz
    inspectionType?: string;     // "straight_beam" | "angle_beam"
  };
  metadata?: {
    userId?: string;
    projectId?: string;
    partName?: string;
  };
}

export interface HoleDetail {
  idNum: string;         // "2154/3/0100"
  diameter: number;      // Diameter in mm
  depth: number;         // Depth in mm
  position: {
    x: number;
    y: number;
    z: number;
  };
  tolerance: string;     // "±0.05mm"
  note: string;          // FBH description
}

export interface ScanningDirections {
  hasDirections: boolean;
  geometryType: string;          // e.g., "Flat", "Cylindrical", "Complex"
  primaryDirection: string;      // e.g., "Axial", "Radial", "Circumferential"
  scanPattern: string;           // e.g., "Linear", "Raster", "Spiral"
  arrowCount: number;            // Number of direction arrows in the visualization
  coverageRequirement: string;   // e.g., "100%", "Full Coverage"
  numPasses: number;             // Number of scan passes required
  overlapPercent: number;        // Overlap percentage between passes
  standards?: string[];          // Applicable standards (e.g., ["MIL-STD-2154", "ASTM E164"])
}

export interface DrillingReport {
  totalHoles: number;
  drillingMethod: string;
  standardsCompliance: string;
  confidenceScore: number; // 0.0-1.0
  
  holeDetails: HoleDetail[];
  
  drillingStatistics: {
    uniqueDiameters: number;
    averageDepth: number;
    totalVolume: number;   // Total volume of holes
  };
  
  /** Scanning directions information for UT inspection */
  scanningDirections?: ScanningDirections;
}

export interface ScanMasterCADResponse {
  success: boolean;
  outputPath: string;          // Path to STEP file
  stepUrl?: string;            // URL for downloading the STEP file (browser)
  executionTime: number;       // Execution time in seconds
  message: string;
  partInfo: {
    originalShapeType: string;
    cadEngineType: string;
    hasDrilledHoles: boolean;
    holesCount: number;
    fileSize: number;          // File size in bytes

    // Detailed drilling report
    drillingReport?: DrillingReport;
  };
}

// Interfaces for existing tabs
export interface CalibrationTabFields {
  fbhSizes: string;           // Input text - "3/64, 1/8, 1/4" or dropdown
  metalTravelDistance: number; // Input number in mm
  blockDimensions: {          // 3 separate inputs
    L: number;                // Length
    W: number;                // Width
    H: number;                // Height
  };
  standardType: string;       // Select dropdown
  /** Recommended calibration block type from the recommender system */
  recommendedBlockType?: 'flat_block' | 'curved_block' | 'cylinder_fbh' | 'solid_cylinder_fbh' | 'cylinder_notched' | 'angle_beam' | 'iiw_block' | 'step_wedge' | 'iow_block' | 'custom';
}

export interface InspectionSetupTabFields {
  material: string;           // Select: aluminum/steel/stainless_steel/titanium
  partThickness: number;      // Input number in mm
  partType: string;           // Input text or select
  isHollow: boolean;          // Checkbox
  acceptanceClass: string;    // Select: AAA/AA/A/B/C
}

export interface EquipmentTabFields {
  probeType: string;          // Select: contact/ultrasonic/immersion
  frequency: number;          // Input number in MHz
  inspectionType: string;     // Radio buttons: straight_beam/angle_beam
  /** Beam type: straight (0°) or angle (45°, 60°, 70°) */
  beamType?: 'straight' | 'angle';
  /** Angle for angle beam inspection */
  angleBeamAngle?: 45 | 60 | 70;
}

// User messages
export interface SuccessMessage {
  title: string;
  details: {
    fileName: string;
    fileSize: string;      // "20.1 KB"
    holesCount: number;
    executionTime: string; // "0.15 seconds"
    confidence: string;    // "95% confidence"
  };
  actions: {
    downloadStep: () => void;
    viewReport: () => void;
    createAnother: () => void;
  };
}

// Loading states
export enum LoadingState {
  IDLE = "Create Calibration Block + STEP",
  PROCESSING = "Processing calibration data...",
  CALCULATING = "Calculating FBH hole positions...",
  DRILLING = "Drilling holes...",
  GENERATING = "Generating STEP file...",
  FINISHING = "Preparing file for download..."
}

// Parameters for drilling report display
export interface DrillingReportDisplay {
  totalHoles: number;
  method: string;           // "Standards-based FBH drilling"
  compliance: string;       // "MIL-STD-2154, ASTM A388/A388M"

  holes: Array<{
    id: string;             // "2154/3/0100"
    diameter: string;       // "0.79mm"
    depth: string;          // "25.4mm"
    description: string;    // "Standard depth reference"
  }>;

  statistics: {
    averageDepth: string;   // "17.95mm"
    totalVolume: string;    // "26.4 mm³"
  };
}