// Types for full UT Inspection Report (19 pages)

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
}

export interface InspectionReportData {
  // Cover Page (Page 1)
  documentNo: string;
  currentRevision: string;
  revisionDate: string;
  customerName: string;
  poNumber: string;
  itemDescription: string;
  materialGrade: string;
  workOrderNumber: string;
  poSerialNumber: string;
  quantity: string;
  
  // Sample Details
  samplePoSlNo: string;
  sampleSerialNo: string;
  sampleQuantity: string;
  thickness: string;
  
  // Testing Details
  typeOfScan: string;
  testingEquipment: string;
  tcgApplied: string; // "Yes" or "No"
  testStandard: string;
  
  // Observations
  observations: string;
  results: string; // "Accepted" or "Rejected"
  
  // Signatures
  approvedBy: string;
  
  // Part Diagram (Page 2)
  partDiagramImage?: string; // Base64 or URL
  
  // Probe Details (Page 3)
  probeDetails: ProbeDetails[];
  
  // Scans (Pages 4-18)
  scans: ScanData[];
  
  // Remarks (Page 19)
  remarks: string[];
}
