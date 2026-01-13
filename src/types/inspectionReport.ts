// Types for full UT Inspection Report (TÜV/Metalscan format + AMS-STD-2154 Aerospace Forging)

export interface ScanData {
  id: string;
  scanNumber: number;
  scanType: string; // e.g., "A Direction- 0°"
  direction: string; // e.g., "A Direction", "Circumferential, Clockwise"
  scanLength: string; // e.g., "360 degree"
  indexLength: string; // e.g., "360 mm"
  probeType: string; // e.g., "PAUT", "Normal, 1 MHz", "Angle 38°, 2 MHz"
  numberOfElements: string; // e.g., "128", "1"

  // Images
  cScanImage?: string; // Base64 or URL
  aScanImage?: string; // Base64 or URL

  // Parameters
  gain?: string;
  range?: string;
  velocity?: string;
  pulseRepetitionFrequency?: string;
  samplingFrequency?: string;
  additionalParams?: Record<string, string>;
}

export interface ProbeDetails {
  probeDescription: string; // e.g., "128ele, PAUT, 0 degree, SL NO.1551801001"
  frequency: string; // e.g., "2.25 MHz"
  make: string; // e.g., "Imasonic"
  waveMode: string; // e.g., "Longitudinal", "Shear"
  scanningDirections: string; // e.g., "A Direction"
  pageNumber: number;
  serialNumber?: string; // Probe serial number
  calibrationDate?: string; // Last calibration date
}

// ============================================
// AEROSPACE FORGING UT SPECIFIC TYPES
// ============================================

// Environmental Conditions (ASTM/NASA requirements)
export interface EnvironmentalConditions {
  ambientTemperature: string; // e.g., "22°C"
  partTemperature: string; // e.g., "20°C"
  humidity: string; // e.g., "45%"
  lightingConditions: string; // e.g., "500 lux"
}

// Couplant Details (AMS-STD-2154 requirement)
export interface CouplantDetails {
  couplantType: string; // e.g., "Glycerin", "Water", "Gel", "Oil"
  couplantManufacturer: string;
  couplantBatchNumber?: string;
  sulfurContent: string; // e.g., "< 250 ppm" (for nickel alloys)
  halideContent: string; // e.g., "< 250 ppm" (for stainless steel)
}

// Sensitivity & Calibration Settings (AMS-STD-2154)
export interface SensitivitySettings {
  // Reference Level
  referenceFbhSize: string; // e.g., "3/64\"", "1/64\"", "5/64\""
  referenceFbhDepth: string; // e.g., "25 mm"
  referenceLevel: string; // dB at which FBH = 80% FSH

  // Scanning Sensitivity
  scanningSensitivity: string; // Additional dB for scanning (e.g., "+6 dB")
  recordingLevel: string; // % FSH for recording (e.g., "20%", "50%")
  rejectionLevel: string; // % FSH for rejection (e.g., "100%")

  // DAC/TCG
  dacApplied: boolean;
  tcgApplied: boolean;
  dacCurveImage?: string; // Base64 image of DAC curve
}

// Transfer Correction (Critical for forgings)
export interface TransferCorrection {
  calibrationBlockBwe: string; // Back Wall Echo on cal block (% FSH)
  partBweAtSameThickness: string; // BWE on part at same thickness
  transferCorrectionValue: string; // dB difference
  correctionApplied: boolean;
}

// Back Wall Echo Monitoring (ASTM A388)
export interface BweMonitoring {
  bweMonitoringActive: boolean;
  bweAttenuationThreshold: string; // e.g., "50%" - max allowed drop
  bweLossRecorded: string; // Actual BWE loss during scan
  bweGateStart: string; // Gate start position
  bweGateEnd: string; // Gate end position
}

// Forging-specific information
export type ForgingType = 'ring' | 'disc' | 'bar' | 'billet' | 'shaft' | 'block' | 'custom';

export interface ForgingDetails {
  forgingType: ForgingType;
  grainFlowDirection: string; // e.g., "Axial", "Radial", "Circumferential"
  forgingRatio: string; // e.g., "4:1"
  minimumThicknessAfterMachining: string;

  // Multi-direction inspection (required for forgings)
  axialInspection: boolean;
  radialInspection: boolean;
  circumferentialInspection: boolean;
  angleBeamApplied: boolean;
  angleBeamAngle?: string; // e.g., "45°", "60°"
}

// Zoning Requirements (for thick parts > 18")
export interface InspectionZone {
  zoneNumber: number;
  zoneName: string; // e.g., "Near Surface", "Mid-wall", "Far Surface"
  startDepth: string; // mm
  endDepth: string; // mm
  fbhSizeForZone: string; // FBH size for this zone
  sensitivityForZone: string; // dB
}

export interface ZoningRequirements {
  zoningRequired: boolean;
  numberOfZones: number;
  deadZone: string; // Near surface dead zone (mm)
  zones: InspectionZone[];
}

// Scan Index & Coverage (ASME V / ASTM E2375)
export interface ScanCoverage {
  scanIndex: string; // mm between passes
  overlapPercentage: string; // e.g., "10%", "15%"
  beamSpotSize: string; // mm
  consecutivePassDetection: boolean; // Detection on 3 consecutive passes
  coveragePercentage: string; // e.g., "100%"
  excludedZones?: string; // Areas not scanned with reason
}

// Test Location & Timing
export interface TestLocationTiming {
  inspectionLocation: string; // e.g., "Plant", "Field", "Customer site"
  facilityName: string;
  testDate: string;
  testStartTime: string;
  testEndTime: string;
  inspectionDuration: string; // Calculated or entered
}

// ============================================
// EXISTING TYPES (Updated)
// ============================================

// Equipment/Generator details (TÜV format + Aerospace additions)
export interface EquipmentDetails {
  // Ultrasonic Generator
  generatorMake: string; // e.g., "METALSCAN"
  generatorModel: string; // e.g., "DIGIT2"
  generatorSerial: string; // e.g., "n°207"
  generatorCalibrationDate: string;

  // Immersion Transducer (if applicable)
  immersionTransducerModel: string; // e.g., "AERO C"
  immersionTransducerSerial: string; // e.g., "061303-5"
  immersionTransducerCalibrationDate: string;

  // Contact Transducer (if applicable)
  contactTransducerModel: string;
  contactTransducerSerial: string;
  contactTransducerCalibrationDate: string;

  // Scan parameters
  frequency: string; // e.g., "5 MHz"
  probeDiameter: string; // e.g., "19 mm"
  waterPath: string; // e.g., "160 mm" (for immersion)

  // Software
  softwareName: string; // e.g., "Winscan"
  softwareVersion: string; // e.g., "v4.1.3"
  utConfigName: string; // e.g., "Forgital_FMDL"

  // Calibration Block Info (ASTM E127)
  calibrationBlockSerial: string;
  calibrationBlockMaterial: string;
  calibrationBlockThickness: string;
  nistTraceability: boolean;
  calibrationValidUntil: string;
}

// Surface condition options (TÜV format)
export type SurfaceCondition = 'worked' | 'raw' | 'finished' | 'welded' | 'machined' | 'as-forged' | 'other';

// Test type options
export type TestType = 'RT' | 'MT' | 'UT' | 'PT' | 'OT';

// Indication record for the indications table (TÜV Page 2 + FBH equivalent)
export interface IndicationRecord {
  id: string;
  scanId: string; // Reference to scan S/N
  indicationNumber: number;
  xDistance: string; // Distance from 0 on X axis
  yDistance: string; // Distance from 0 on Y axis
  xExtension: string; // Size/extension on X axis
  yExtension: string; // Size/extension on Y axis
  amplitude: string; // Max signal amplitude (dB or %)
  soundPath: string; // Distance from surface (depth)
  assessment: 'accept' | 'reject' | 'record'; // Judgment
  notes?: string;

  // FBH Equivalent (AMS-STD-2154)
  fbhEquivalentSize?: string; // e.g., "< 1/64\"", "2/64\" equiv"
  depthZone?: string; // Which zone the indication is in
  amplitudeVsReference?: string; // dB relative to reference FBH
}

// Inspector certification details (EN 4179, NAS 410, SNT-TC-1A)
export interface InspectorCertification {
  name: string;
  level: 'I' | 'II' | 'III'; // UT Level
  certificationStandard: string; // e.g., "EN 4179", "NAS 410", "SNT-TC-1A", "ISO 9712"
  certificateNumber: string;
  expiryDate: string;
  employer?: string;
}

// Signature record
export interface SignatureRecord {
  role: 'preparedBy' | 'approvedBy' | 'witness';
  name: string;
  title?: string;
  date: string;
  signature?: string; // Base64 image of signature
  company?: string; // For witness - customer or third party name
}

// Results summary (TÜV format)
export interface ResultsSummary {
  partsInspected: number;
  conformingParts: number;
  nonConformingParts: number;
  conformingSerials: string; // e.g., "17/47/4/0 --- n°2 à n°16"
  nonConformingSerials: string;
}

// Applicable documents/standards
export interface ApplicableDocument {
  id: string;
  documentNumber: string; // e.g., "I-07.05.110"
  revision: string; // e.g., "rev15"
  title?: string;
}

export interface InspectionReportData {
  // === Cover Page (Page 1) ===

  // Document Information
  documentNo: string;
  currentRevision: string;
  revisionDate: string;
  batchNumber?: string; // Lotto Bytest N°
  jobNumber?: string; // OC-Commessa / OC-Job n°
  issueDate: string;

  // Customer Information
  customerName: string;
  customerAddress: string;
  poNumber: string; // Customer order
  metalscanOrderNumber?: string; // Internal order number (if different)

  // Part Information
  itemDescription: string;
  partNumber: string; // P/N
  lotNumber: string; // LOTTO
  drawingNumber: string; // N° de plan / Drawing number
  technicalSheetRef: string; // Fiche Technique reference

  // Material Information
  materialGrade: string;
  castNumber: string; // Numéro de coulée / Cast/Melt number (Heat Number)
  heatTreatmentCondition: string; // Heat treatment condition
  surfaceRoughness: string; // Rugosité (Ra) e.g., "< 3.2µm"
  surfaceConditions: SurfaceCondition[]; // Checkboxes for surface state

  // Quantity Information
  workOrderNumber: string;
  poSerialNumber: string;
  quantity: string;

  // Sample Details
  samplePoSlNo: string;
  sampleSerialNo: string;
  sampleQuantity: string;
  individualNumbers: string; // Numéros individuels e.g., "N°2 à 16"
  thickness: string;

  // Test Type Selection
  testTypes: TestType[]; // Checkboxes: RT, MT, UT, PT, OT

  // Testing Details
  typeOfScan: string;
  testingEquipment: string;
  tcgApplied: string; // "Yes" or "No"
  testStandard: string;
  testExtension?: string; // Test scope/extension (e.g., "100%", "Sample basis")

  // === AEROSPACE FORGING UT ADDITIONS ===

  // Test Location & Timing
  testLocationTiming: TestLocationTiming;

  // Environmental Conditions
  environmentalConditions: EnvironmentalConditions;

  // Couplant Details
  couplantDetails: CouplantDetails;

  // Forging-Specific Information
  forgingDetails: ForgingDetails;

  // Sensitivity & Calibration
  sensitivitySettings: SensitivitySettings;

  // Transfer Correction
  transferCorrection: TransferCorrection;

  // BWE Monitoring
  bweMonitoring: BweMonitoring;

  // Zoning Requirements
  zoningRequirements: ZoningRequirements;

  // Scan Coverage
  scanCoverage: ScanCoverage;

  // === EXISTING SECTIONS ===

  // Equipment Details
  equipmentDetails: EquipmentDetails;

  // Applicable Documents
  applicableDocuments: ApplicableDocument[];

  // Results Summary
  resultsSummary: ResultsSummary;

  // Observations
  observations: string;
  results: string; // "Accepted" or "Rejected"

  // Inspector Certification
  inspectorCertification: InspectorCertification;

  // Signatures
  signatures: SignatureRecord[];

  // Legacy field for backward compatibility
  approvedBy: string;

  // === Part Diagram (Page 2) ===
  partDiagramImage?: string; // Base64 or URL

  // === Indications Table (Page 2/3) ===
  indications: IndicationRecord[];

  // === Probe Details (Page 3) ===
  probeDetails: ProbeDetails[];

  // === Scans (Pages 4-18) ===
  scans: ScanData[];

  // === Remarks (Page 19) ===
  remarks: string[];
}

// ============================================
// DEFAULT VALUES
// ============================================

export const getDefaultEnvironmentalConditions = (): EnvironmentalConditions => ({
  ambientTemperature: '',
  partTemperature: '',
  humidity: '',
  lightingConditions: '',
});

export const getDefaultCouplantDetails = (): CouplantDetails => ({
  couplantType: '',
  couplantManufacturer: '',
  couplantBatchNumber: '',
  sulfurContent: '< 250 ppm',
  halideContent: '< 250 ppm',
});

export const getDefaultSensitivitySettings = (): SensitivitySettings => ({
  referenceFbhSize: '3/64"',
  referenceFbhDepth: '',
  referenceLevel: '',
  scanningSensitivity: '+6 dB',
  recordingLevel: '20%',
  rejectionLevel: '100%',
  dacApplied: false,
  tcgApplied: false,
});

export const getDefaultTransferCorrection = (): TransferCorrection => ({
  calibrationBlockBwe: '80%',
  partBweAtSameThickness: '',
  transferCorrectionValue: '',
  correctionApplied: false,
});

export const getDefaultBweMonitoring = (): BweMonitoring => ({
  bweMonitoringActive: true,
  bweAttenuationThreshold: '50%',
  bweLossRecorded: '',
  bweGateStart: '',
  bweGateEnd: '',
});

export const getDefaultForgingDetails = (): ForgingDetails => ({
  forgingType: 'ring',
  grainFlowDirection: '',
  forgingRatio: '',
  minimumThicknessAfterMachining: '',
  axialInspection: true,
  radialInspection: true,
  circumferentialInspection: false,
  angleBeamApplied: false,
});

export const getDefaultZoningRequirements = (): ZoningRequirements => ({
  zoningRequired: false,
  numberOfZones: 1,
  deadZone: '',
  zones: [],
});

export const getDefaultScanCoverage = (): ScanCoverage => ({
  scanIndex: '',
  overlapPercentage: '10%',
  beamSpotSize: '',
  consecutivePassDetection: false,
  coveragePercentage: '100%',
  excludedZones: '',
});

export const getDefaultTestLocationTiming = (): TestLocationTiming => ({
  inspectionLocation: '',
  facilityName: '',
  testDate: new Date().toISOString().split('T')[0],
  testStartTime: '',
  testEndTime: '',
  inspectionDuration: '',
});

export const getDefaultEquipmentDetails = (): EquipmentDetails => ({
  generatorMake: '',
  generatorModel: '',
  generatorSerial: '',
  generatorCalibrationDate: '',
  immersionTransducerModel: '',
  immersionTransducerSerial: '',
  immersionTransducerCalibrationDate: '',
  contactTransducerModel: '',
  contactTransducerSerial: '',
  contactTransducerCalibrationDate: '',
  frequency: '',
  probeDiameter: '',
  waterPath: '',
  softwareName: '',
  softwareVersion: '',
  utConfigName: '',
  calibrationBlockSerial: '',
  calibrationBlockMaterial: '',
  calibrationBlockThickness: '',
  nistTraceability: false,
  calibrationValidUntil: '',
});

export const getDefaultInspectorCertification = (): InspectorCertification => ({
  name: '',
  level: 'II',
  certificationStandard: 'EN 4179',
  certificateNumber: '',
  expiryDate: '',
});

export const getDefaultResultsSummary = (): ResultsSummary => ({
  partsInspected: 0,
  conformingParts: 0,
  nonConformingParts: 0,
  conformingSerials: '',
  nonConformingSerials: '',
});

export const getDefaultInspectionReportData = (): InspectionReportData => ({
  documentNo: '',
  currentRevision: '0',
  revisionDate: new Date().toISOString().split('T')[0],
  batchNumber: '',
  jobNumber: '',
  issueDate: new Date().toISOString().split('T')[0],
  customerName: '',
  customerAddress: '',
  poNumber: '',
  metalscanOrderNumber: '',
  itemDescription: '',
  partNumber: '',
  lotNumber: '',
  drawingNumber: '',
  technicalSheetRef: '',
  materialGrade: '',
  castNumber: '',
  heatTreatmentCondition: '',
  surfaceRoughness: '',
  surfaceConditions: [],
  workOrderNumber: '',
  poSerialNumber: '',
  quantity: '',
  samplePoSlNo: '',
  sampleSerialNo: '',
  sampleQuantity: '',
  individualNumbers: '',
  thickness: '',
  testTypes: ['UT'],
  typeOfScan: '',
  testingEquipment: '',
  tcgApplied: 'No',
  testStandard: '',
  testExtension: '100%',

  // Aerospace Forging UT defaults
  testLocationTiming: getDefaultTestLocationTiming(),
  environmentalConditions: getDefaultEnvironmentalConditions(),
  couplantDetails: getDefaultCouplantDetails(),
  forgingDetails: getDefaultForgingDetails(),
  sensitivitySettings: getDefaultSensitivitySettings(),
  transferCorrection: getDefaultTransferCorrection(),
  bweMonitoring: getDefaultBweMonitoring(),
  zoningRequirements: getDefaultZoningRequirements(),
  scanCoverage: getDefaultScanCoverage(),

  // Existing defaults
  equipmentDetails: getDefaultEquipmentDetails(),
  applicableDocuments: [],
  resultsSummary: getDefaultResultsSummary(),
  observations: '',
  results: '',
  inspectorCertification: getDefaultInspectorCertification(),
  signatures: [],
  approvedBy: '',
  partDiagramImage: undefined,
  indications: [],
  probeDetails: [],
  scans: [],
  remarks: [],
});
