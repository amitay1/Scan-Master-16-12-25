// Types for full UT Inspection Report (TÜV/Metalscan format)

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

// Equipment/Generator details (TÜV format)
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
}

// Surface condition options (TÜV format)
export type SurfaceCondition = 'worked' | 'raw' | 'finished' | 'welded' | 'other';

// Test type options
export type TestType = 'RT' | 'MT' | 'UT' | 'PT' | 'OT';

// Indication record for the indications table (TÜV Page 2)
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
  customerAddress: string; // NEW: Customer address
  poNumber: string; // Customer order
  metalscanOrderNumber?: string; // Internal order number (if different)

  // Part Information
  itemDescription: string;
  partNumber: string; // P/N
  lotNumber: string; // LOTTO
  drawingNumber: string; // NEW: N° de plan / Drawing number
  technicalSheetRef: string; // NEW: Fiche Technique reference

  // Material Information
  materialGrade: string;
  castNumber: string; // NEW: Numéro de coulée / Cast/Melt number
  heatTreatmentCondition: string; // NEW: Heat treatment condition
  surfaceRoughness: string; // NEW: Rugosité (Ra) e.g., "< 3.2µm"
  surfaceConditions: SurfaceCondition[]; // NEW: Checkboxes for surface state

  // Quantity Information
  workOrderNumber: string;
  poSerialNumber: string;
  quantity: string;

  // Sample Details
  samplePoSlNo: string;
  sampleSerialNo: string;
  sampleQuantity: string;
  individualNumbers: string; // NEW: Numéros individuels e.g., "N°2 à 16"
  thickness: string;

  // Test Type Selection (NEW)
  testTypes: TestType[]; // Checkboxes: RT, MT, UT, PT, OT

  // Testing Details
  typeOfScan: string;
  testingEquipment: string;
  tcgApplied: string; // "Yes" or "No"
  testStandard: string;
  testExtension?: string; // NEW: Test scope/extension (e.g., "100%", "Sample basis")

  // Equipment Details (NEW - full section)
  equipmentDetails: EquipmentDetails;

  // Applicable Documents (NEW)
  applicableDocuments: ApplicableDocument[];

  // Results Summary (NEW)
  resultsSummary: ResultsSummary;

  // Observations
  observations: string;
  results: string; // "Accepted" or "Rejected"

  // Inspector Certification (NEW)
  inspectorCertification: InspectorCertification;

  // Signatures (NEW - structured)
  signatures: SignatureRecord[];

  // Legacy field for backward compatibility
  approvedBy: string;

  // === Part Diagram (Page 2) ===
  partDiagramImage?: string; // Base64 or URL

  // === Indications Table (NEW - Page 2/3) ===
  indications: IndicationRecord[];

  // === Probe Details (Page 3) ===
  probeDetails: ProbeDetails[];

  // === Scans (Pages 4-18) ===
  scans: ScanData[];

  // === Remarks (Page 19) ===
  remarks: string[];
}

// Default values for new report
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
