export type StandardType = 
  | "AMS-STD-2154E"
  | "ASTM-A388"
  | "BS-EN-10228-3"
  | "BS-EN-10228-4";

export type MaterialType = "aluminum" | "steel" | "stainless_steel" | "titanium" | "magnesium" | "custom";

export type PartGeometry = 
  // Basic Geometries
  | "box"           // Plates, sheets, bars, blocks, billets
  | "cylinder"      // Round bars, shafts, disks
  | "tube"          // Tubes, pipes, rings, sleeves, bushings
  | "rectangular_tube"  // Rectangular & square tubes
  | "hexagon"       // Hex bars
  | "sphere"        // Spheres
  | "cone"          // Cones
  | "pyramid"       // Pyramids
  | "ellipse"       // Elliptical shapes
  | "irregular"     // Custom irregular shapes
  
  // Structural Profiles
  | "l_profile"     // L-shaped extrusions (angle)
  | "t_profile"     // T-shaped extrusions
  | "i_profile"     // I-beams
  | "u_profile"     // U-channels
  | "z_profile"     // Z-sections
  
  // Legacy support (will be mapped to base shapes)
  | "plate" | "sheet" | "slab" | "flat_bar" | "rectangular_bar" | "square_bar" | "billet" | "block"
  | "round_bar" | "shaft" | "disk" | "disk_forging" | "hub"
  | "pipe" | "ring" | "ring_forging" | "sleeve" | "bushing" | "square_tube"
  | "hex_bar"
  | "extrusion_l" | "extrusion_angle" | "extrusion_t" | "extrusion_i" 
  | "extrusion_u" | "extrusion_channel" | "z_section"
  | "forging" | "round_forging_stock" | "rectangular_forging_stock" | "near_net_forging"
  | "machined_component" | "custom_profile" | "bar" | "custom";

export type AcceptanceClass = "AAA" | "AA" | "A" | "B" | "C";

export type CalibrationBlockType = "flat_block" | "curved_block" | "cylinder_notched" | "cylinder_fbh" | "angle_beam" | "iiv_block" | "step_wedge" | "iow_block" | "custom";

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
}

export interface EquipmentData {
  manufacturer: string;
  model: string;
  serialNumber: string;
  frequency: string;
  transducerType: string;
  transducerDiameter: number;
  couplant: string;
  verticalLinearity: number;
  horizontalLinearity: number;
  entrySurfaceResolution: number;
  backSurfaceResolution: number;
}

export interface CalibrationData {
  standardType: CalibrationBlockType | "";
  referenceMaterial: string;
  fbhSizes: string;
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
