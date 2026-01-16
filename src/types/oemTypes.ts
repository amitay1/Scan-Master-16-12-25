/**
 * OEM (Original Equipment Manufacturer) Types
 *
 * Type definitions for OEM-specific inspection rules.
 * Used by PW, GE, RR rule sets.
 */

/**
 * Supported OEM vendors
 */
export type OEMVendor = 'PW' | 'GE' | 'RR' | 'GENERIC';

/**
 * Source document reference
 */
export interface SourceDocument {
  id: string;
  revision: string;
  title: string;
  date: string;
}

/**
 * Coverage requirements
 */
export interface CoverageRequirements {
  minCoverage: number; // percentage (0-100)
  radialCoverage?: number; // inches
  overlapRequirement: number; // percentage overlap between passes
  criticalZoneMultiplier: number; // multiplier for critical zones
  scanAngles?: number[]; // degrees
}

/**
 * Scan parameters
 */
export interface ScanParameters {
  maxScanIncrement: number; // inches
  maxIndexIncrement: number; // inches per revolution
  waterPath: number; // inches
  incidentAngle: number; // degrees
  refractedAngle: number; // degrees
  waveType: 'longitudinal' | 'shear';
}

/**
 * Noise requirements
 */
export interface NoiseRequirements {
  maxAverageNoise: number; // %FSH
  maxBandNoise: number; // %FSH
  minNoiseForTOF?: number; // %FSH
  actionOnExceed: string;
}

/**
 * Calibration requirements
 */
export interface CalibrationRequirements {
  targetAmplitude: number; // %FSH
  postCalibrationTolerance: number; // dB
  dacRequired: boolean;
  curvatureCorrectionRequired: boolean;
  calibrationBlockRecertification: string;
  referenceHoles?: string[];
  fbhSize?: number;
}

/**
 * Inspector qualification requirements
 */
export interface InspectorQualifications {
  scanPlanDevelopment: string;
  inspectionExecution: string;
  certificationRequired: string;
  podQualificationRequired: boolean;
  recertificationPeriod: number; // months
  trainingProvider: string;
}

/**
 * Scanner system specification
 */
export interface ScannerSystem {
  manufacturer: string;
  model: string;
  description: string;
}

/**
 * Approved equipment
 */
export interface ApprovedEquipment {
  scannerSystems: ScannerSystem[];
  alternateApproval: string;
}

/**
 * Reporting requirements
 */
export interface ReportingRequirements {
  requiredFields: string[];
  dataTransferMethod: string;
  recipient: string;
  electronicDataRequired: string[];
}

/**
 * Special requirements
 */
export interface SpecialRequirements {
  metalToMetalContact?: string;
  collimatorApproval?: string;
  dampingDeviceApproval?: string;
  [key: string]: string | undefined;
}

/**
 * Complete OEM Rule Set
 */
export interface OEMRuleSet {
  vendorId: OEMVendor;
  vendorName: string;
  version: string;
  lastUpdated: string;
  sourceDocuments: SourceDocument[];

  coverageRequirements: CoverageRequirements;
  scanParameters: ScanParameters;
  noiseRequirements: NoiseRequirements;
  calibrationRequirements: CalibrationRequirements;
  inspectorQualifications: InspectorQualifications;
  approvedEquipment: ApprovedEquipment;
  reportingRequirements: ReportingRequirements;
  specialRequirements?: SpecialRequirements;
}

/**
 * OEM-specific part configuration
 */
export interface OEMPartConfig {
  partNumber: string;
  ndip?: string;
  description: string;
  material: string;
  inspectionZones: string[];
}

/**
 * Transducer specification
 */
export interface TransducerSpec {
  partNumber: string;
  frequency: number; // MHz
  focalLength: number; // inches
  bandwidth: 'narrow' | 'medium' | 'wide';
  type: 'immersion' | 'contact';
  elementDiameter?: number; // inches
}

/**
 * Calibration block specification
 */
export interface CalibrationBlockSpec {
  partNumber: string;
  type: 'flat' | 'angled' | 'curved';
  angle?: number; // degrees
  fbhSizes: number[]; // FBH numbers
  material: string;
  source: string;
}

/**
 * FBH (Flat Bottom Hole) table entry
 */
export interface FBHTableEntry {
  fbhNumber: number; // #1, #2, #3, etc.
  diameter: number; // inches (decimal)
  diameterFraction: string; // e.g., "1/64", "2/64"
  area: number; // square inches
}

/**
 * Standard FBH sizes per ASTM E127
 */
export const FBH_TABLE: FBHTableEntry[] = [
  { fbhNumber: 1, diameter: 0.015625, diameterFraction: '1/64', area: 0.000191 },
  { fbhNumber: 2, diameter: 0.03125, diameterFraction: '2/64', area: 0.000767 },
  { fbhNumber: 3, diameter: 0.046875, diameterFraction: '3/64', area: 0.001726 },
  { fbhNumber: 4, diameter: 0.0625, diameterFraction: '4/64', area: 0.003068 },
  { fbhNumber: 5, diameter: 0.078125, diameterFraction: '5/64', area: 0.004794 },
  { fbhNumber: 6, diameter: 0.09375, diameterFraction: '6/64', area: 0.006903 },
  { fbhNumber: 7, diameter: 0.109375, diameterFraction: '7/64', area: 0.009396 },
  { fbhNumber: 8, diameter: 0.125, diameterFraction: '8/64', area: 0.012272 },
];

/**
 * Get FBH diameter by number
 */
export function getFBHDiameter(fbhNumber: number): number {
  const entry = FBH_TABLE.find((e) => e.fbhNumber === fbhNumber);
  return entry?.diameter ?? 0;
}

/**
 * Get FBH area by number
 */
export function getFBHArea(fbhNumber: number): number {
  const entry = FBH_TABLE.find((e) => e.fbhNumber === fbhNumber);
  return entry?.area ?? 0;
}
