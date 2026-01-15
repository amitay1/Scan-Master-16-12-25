/**
 * Pratt & Whitney Reporting Requirements
 *
 * Source: NDIP-1226 Section 9.0, Appendix A
 * Source: NDIP-1227 Section 9.0, Appendix A
 */

/**
 * Standard inspection report fields
 * Per NDIP Section 9.1.1 - 9.1.6
 */
export interface PWInspectionReport {
  // Inspector/Equipment Info (Section 9.1.1)
  inspectorName: string;
  inspectionDate: Date;
  inspectionSystemSN: string;
  transducerSN: string;
  calibrationStandardSN: string;

  // Aircraft Info (Section 9.1.2)
  aircraftSerialNumber: string;
  enginePosition: 'left' | 'right' | '1' | '2';

  // Engine Info (Section 9.1.3)
  engineModel: string;
  engineSerialNumber: string;
  engineTotalTime: number; // hours
  engineTotalCycles: number;

  // Disk Info (Section 9.1.4)
  diskPartNumber: string;
  diskSerialNumber: string;
  diskHeatCode: string;
  timeSinceNew: number; // hours
  cyclesSinceNew: number;
  timeSinceLastInspection?: number;
  cyclesSinceLastInspection?: number;

  // Inspection Results
  inspectionMethod: string;
  result: 'accept' | 'reject';
  indications: PWIndicationReport[];

  // Electronic data files
  dataFiles: {
    amplitudeCScan: string; // filename
    tofCScan: string; // filename
  };
}

/**
 * Rejectable indication report fields
 * Per NDIP Section 9.1.7, Appendix A
 */
export interface PWIndicationReport {
  // Location Info (Sections 9.1.7.14 - 9.1.7.17)
  inspectionSurface: string; // Zone identifier
  indexLocation: number; // inches
  depthAlongSoundPath: number; // inches
  scanLocation: number; // degrees (circumferential)

  // Amplitude Analysis (Sections 9.1.7.18 - 9.1.7.20)
  amplitudePixels: {
    count: number;
    meetsMinimum: boolean; // greater than 2x1; 1x2
  };
  calibrationAmplitude: number; // %FSH (should be 80%)
  peakIndicationAmplitude: number; // %FSH with DAC applied

  // TOF Analysis (Sections 9.1.7.21 - 9.1.7.23)
  tofPixels: {
    count: number;
    overThreeScanlinesMetThreshold: boolean; // >15 pixels over 3+ scan lines
  };
  tofAverageNoiseLevel: number; // %FSH
  tofSignalToNoiseRatio: number; // SNR

  // Electronic data
  aScanPresentation?: string; // filename showing max amplitude
  positionReport?: string; // filename showing indication position
}

/**
 * Required fields for any rejectable indication
 * Per NDIP Section 9.1.7
 */
export const REJECTABLE_INDICATION_FIELDS = [
  { id: '9.1.7.1', field: 'inspectionDate', label: 'Inspection Date' },
  { id: '9.1.7.2', field: 'inspectorName', label: 'Inspector Name' },
  { id: '9.1.7.3', field: 'inspectionSystem', label: 'Inspection System' },
  {
    id: '9.1.7.4',
    field: 'inspectionSystemSN',
    label: 'Inspection System Serial Number',
  },
  {
    id: '9.1.7.5',
    field: 'transducerPartNumber',
    label: 'Transducer Part Number',
  },
  {
    id: '9.1.7.6',
    field: 'transducerSerialNumber',
    label: 'Transducer Serial Number',
  },
  {
    id: '9.1.7.7',
    field: 'calibrationBlockSN',
    label: 'Calibration Block Serial Number',
  },
  { id: '9.1.7.8', field: 'engineSerialNumber', label: 'Engine Serial Number' },
  { id: '9.1.7.9', field: 'diskPartNumber', label: 'Disk Part Number' },
  { id: '9.1.7.10', field: 'diskSerialNumber', label: 'Disk Serial Number' },
  { id: '9.1.7.11', field: 'diskHeatCode', label: 'Disk Heat Code' },
  { id: '9.1.7.12', field: 'timeSinceNew', label: 'Time Since New (TSN)' },
  { id: '9.1.7.13', field: 'cyclesSinceNew', label: 'Cycles Since New (CSN)' },
  {
    id: '9.1.7.14',
    field: 'inspectionSurface',
    label: 'Inspection surface where found',
  },
  {
    id: '9.1.7.15',
    field: 'indexLocation',
    label: 'Index location (inches)',
  },
  {
    id: '9.1.7.16',
    field: 'depthAlongSoundPath',
    label: 'Depth along sound path (inches)',
  },
  {
    id: '9.1.7.17',
    field: 'scanLocation',
    label: 'Scan (circumferential) location (degrees)',
  },
  {
    id: '9.1.7.18',
    field: 'amplitudePixels',
    label: 'Amplitude pixels: number greater than 2x1; 1x2 – yes/no',
  },
  {
    id: '9.1.7.19',
    field: 'calibrationAmplitude',
    label: 'Calibration amplitude (80% FSH)',
  },
  {
    id: '9.1.7.20',
    field: 'peakIndicationAmplitude',
    label: 'Peak indication amplitude, with DAC applied (%FSH)',
  },
  {
    id: '9.1.7.21',
    field: 'tofPixels',
    label: 'TOF pixels: greater than 15 pixels over at least 3 scan lines – yes/no',
  },
  {
    id: '9.1.7.22',
    field: 'tofAverageNoiseLevel',
    label: 'TOF average Noise Level (% FSH – referencing amplitude C-Scan)',
  },
  {
    id: '9.1.7.23',
    field: 'tofSignalToNoiseRatio',
    label: 'TOF Signal-to-Noise Ratio (SNR – referencing amplitude C-Scan)',
  },
];

/**
 * Data transfer requirements
 */
export const DATA_TRANSFER_REQUIREMENTS = {
  method: 'MFT (Managed File Transfer)',
  recipient: 'Pratt & Whitney MPE-NDE',
  requiredFiles: ['amplitude C-Scan data', 'time of flight C-Scan data'],
  timing: 'Upon completion of data collection/evaluation',
};

/**
 * Generate report filename
 */
export function generateReportFilename(
  diskPartNumber: string,
  diskSerialNumber: string,
  inspectionDate: Date
): string {
  const dateStr = inspectionDate.toISOString().split('T')[0].replace(/-/g, '');
  return `PW_${diskPartNumber}_${diskSerialNumber}_${dateStr}_inspection`;
}

/**
 * Validate inspection report has all required fields
 */
export function validateReport(
  report: Partial<PWInspectionReport>
): { valid: boolean; missingFields: string[] } {
  const requiredFields = [
    'inspectorName',
    'inspectionDate',
    'inspectionSystemSN',
    'transducerSN',
    'calibrationStandardSN',
    'diskPartNumber',
    'diskSerialNumber',
    'diskHeatCode',
    'result',
  ];

  const missingFields = requiredFields.filter(
    (field) => !report[field as keyof PWInspectionReport]
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate rejectable indication report has all required fields
 */
export function validateIndicationReport(
  indication: Partial<PWIndicationReport>
): { valid: boolean; missingFields: string[] } {
  const requiredFields = [
    'inspectionSurface',
    'indexLocation',
    'depthAlongSoundPath',
    'scanLocation',
    'amplitudePixels',
    'calibrationAmplitude',
    'peakIndicationAmplitude',
    'tofPixels',
    'tofAverageNoiseLevel',
    'tofSignalToNoiseRatio',
  ];

  const missingFields = requiredFields.filter(
    (field) => indication[field as keyof PWIndicationReport] === undefined
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Contact information for reporting
 */
export const REPORTING_CONTACTS = {
  mpeNde: {
    department: 'Pratt & Whitney MPE-NDE',
    purpose: 'Electronic data transfer and technical questions',
  },
  fieldRepresentative: {
    role: 'Local Pratt & Whitney Field Representative',
    purpose: 'Reporting inspection results',
  },
  toolSupply: {
    email: 'gppwmpendetoolsup@prattwhitney.com',
    purpose: 'Transducer and equipment sourcing',
  },
};
