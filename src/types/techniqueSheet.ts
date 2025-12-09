export type StandardType = 
  | "AMS-STD-2154E"
  | "ASTM-A388"
  | "BS-EN-10228-3"
  | "BS-EN-10228-4";

export type MaterialType = "aluminum" | "steel" | "stainless_steel" | "titanium" | "magnesium" | "custom";

export type PartGeometry =
  // Basic Geometries (ASTM E2375 Wrought Products)
  | "box"           // Plates, sheets, bars, blocks, billets
  | "cylinder"      // Round bars, shafts, disks
  | "tube"          // Tubes, pipes, rings, sleeves, bushings
  | "rectangular_tube"  // Rectangular & square tubes
  | "hexagon"       // Hex bars
  | "sphere"        // Spheres
  | "cone"          // Cones

  // Legacy support (will be mapped to base shapes)
  | "plate" | "sheet" | "slab" | "flat_bar" | "rectangular_bar" | "square_bar" | "billet" | "block"
  | "round_bar" | "shaft" | "disk" | "disk_forging" | "hub"
  | "pipe" | "ring" | "ring_forging" | "sleeve" | "bushing" | "square_tube"
  | "hex_bar"
  | "forging" | "round_forging_stock" | "rectangular_forging_stock" | "near_net_forging"
  | "machined_component" | "bar" | "custom";

export type AcceptanceClass = "AAA" | "AA" | "A" | "B" | "C";

export type CalibrationBlockType = "flat_block" | "curved_block" | "cylinder_notched" | "cylinder_fbh" | "solid_cylinder_fbh" | "angle_beam" | "iiv_block" | "step_wedge" | "iow_block" | "custom";

// Coupling method for scan parameters
export type CouplingMethod = "regular" | "bubbler" | "phased_array";

// Phased Array scan types
export interface PhasedArrayScanTypes {
  sScan?: boolean;
  linearScan?: boolean;
  compoundScan?: boolean;
}

// Phased Array settings (for Scan Parameters tab)
export interface PhasedArraySettings {
  refractedAngleStart?: number;    // Start angle in degrees (e.g., 40°)
  refractedAngleEnd?: number;      // End angle in degrees (e.g., 70°)
  scanTypes?: PhasedArrayScanTypes;
  focusLaws?: string;
  aperture?: number;               // Number of active elements
}

export interface InspectionSetupData {
  partNumber: string;
  partName: string;
  material: MaterialType | "";
  customMaterialName?: string;
  materialSpec: string;
  partType: PartGeometry | "";
  customShapeDescription?: string;
  customShapeImage?: string; // Image upload for custom shapes
  customShapeParameters?: {
    dimension1?: { label: string; value: number };
    dimension2?: { label: string; value: number };
    dimension3?: { label: string; value: number };
    dimension4?: { label: string; value: number };
  };
  partThickness: number;
  partLength: number;
  partWidth: number;
  diameter?: number;
  
  // Hollow/Hole parameters (for tubes, hollow cylinders, etc.)
  isHollow?: boolean;
  innerDiameter?: number;
  innerLength?: number;
  innerWidth?: number;
  wallThickness?: number;

  // Cone-specific parameters
  coneTopDiameter?: number;      // Top diameter (smaller end, 0 = pointed)
  coneBottomDiameter?: number;   // Bottom diameter (base, larger end)
  coneHeight?: number;           // Height of the cone
}

export interface EquipmentData {
  manufacturer: string;
  model: string;
  serialNumber: string;
  softwareVersion?: string;        // Software version (for PA equipment)
  probeModel?: string;             // Probe model identifier
  frequency: string;
  transducerType: string;
  transducerDiameter: number;
  couplant: string;
  verticalLinearity: number;
  horizontalLinearity: number;
  entrySurfaceResolution: number;
  backSurfaceResolution: number;
  // Phased Array specific fields
  numberOfElements?: number;       // Number of elements in PA probe (e.g., 32, 64)
  elementPitch?: number;           // Distance between elements in mm
  wedgeModel?: string;             // Wedge model identifier
}

// FBH Hole data structure for calibration blocks
export interface FBHHoleData {
  id: number;
  partNumber: string;
  deltaType: string;         // Δ type: 'area', 'distance', 'dac', 'tcg', 'ref'
  diameterInch: string;      // ØFBH inch (e.g., "3/64")
  diameterMm: number;        // ØFBH mm (e.g., 1.19)
  distanceB: number;         // B - distance from bottom (mm)
  metalTravelH: number;      // H - metal travel depth (mm)
}

export interface CalibrationData {
  standardType: CalibrationBlockType | "";
  referenceMaterial: string;
  fbhSizes: string;           // Legacy: comma-separated FBH sizes string
  fbhHoles?: FBHHoleData[];   // New: structured FBH hole data array
  metalTravelDistance: number;
  blockDimensions: string;
  blockSerialNumber: string;
  lastCalibrationDate: string;
}

export interface ScanParametersData {
  scanMethod: string;
  scanType: string;
  scanSpeed: number;
  scanIndex: number;
  coverage: number;
  scanPattern: string;
  waterPath?: number;
  pulseRepetitionRate: number;
  gainSettings: string;
  alarmGateSettings: string;
  // Coupling method (Regular/Bubbler/Phased Array)
  couplingMethod?: CouplingMethod;
  // Phased Array settings (when couplingMethod = 'phased_array')
  phasedArray?: PhasedArraySettings;
}

export interface AcceptanceCriteriaData {
  acceptanceClass: AcceptanceClass | "";
  singleDiscontinuity: string;
  multipleDiscontinuities: string;
  linearDiscontinuity: string;
  backReflectionLoss: number;
  noiseLevel: string;
  specialRequirements: string;
}

export interface DocumentationData {
  inspectorName: string;
  inspectorCertification: string;
  inspectorLevel: string;
  certifyingOrganization: string;
  inspectionDate: string;
  procedureNumber: string;
  drawingReference: string;
  revision: string;
  additionalNotes: string;
  approvalRequired: boolean;
}

export interface CalibrationRecommendation {
  standardType: string;
  referenceFigure: string;
  material: string;
  fbhSizes: string[];
  metalTravel: {
    distances: number[];
    tolerance: string;
  };
  frequency: number;
  transducerDiameter: string;
  reasoning: {
    material: string;
    blockType: string;
    fbh: string;
    frequency: string;
    travel: string;
  };
  confidence: number;
  visualization3D: {
    blockDimensions: [number, number, number];
    fbhPositions: Array<{
      size: string;
      depth: number;
      coordinates: [number, number, number];
    }>;
  };
}

export interface TechniqueSheet {
  id: string;
  standardName: StandardType;
  standardVersion: string;
  createdDate: string;
  modifiedDate: string;
  status: "draft" | "complete" | "approved";
  
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  
  calibrationRecommendation?: CalibrationRecommendation;
  
  metadata: {
    completionPercent: number;
    lastModifiedBy: string;
  };
}
