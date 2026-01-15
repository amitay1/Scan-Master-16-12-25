/**
 * Compliance Checker Types
 *
 * Type definitions for the Technique Sheet compliance validation system.
 * Validates that all required fields are filled and values comply with standards.
 */

import type { StandardType } from "./techniqueSheet";

// Severity levels for compliance issues
export type ComplianceSeverity = "critical" | "warning" | "info";

// Categories of compliance rules
export type ComplianceCategory =
  | "setup"           // Part setup & geometry
  | "equipment"       // Equipment configuration
  | "calibration"     // Calibration block & FBH
  | "scan"            // Scan parameters
  | "acceptance"      // Acceptance criteria
  | "documentation"   // Inspector & documentation
  | "standard";       // Standard-specific rules

// Result of a single compliance check
export interface ComplianceResult {
  passed: boolean;
  ruleId: string;
  ruleName: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  message: string;
  field?: string;           // Field path that failed (e.g., "equipment.frequency")
  currentValue?: string;    // Current value that failed
  expectedValue?: string;   // Expected or allowed value
  suggestion?: string;      // How to fix the issue
  standardRef?: string;     // Reference to standard section
}

// Compliance rule definition
export interface ComplianceRule {
  id: string;
  name: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  standards?: StandardType[];  // Which standards this rule applies to (all if undefined)
  check: (data: ComplianceCheckData) => ComplianceResult;
}

// Data structure passed to compliance checker
export interface ComplianceCheckData {
  standard: StandardType;
  inspectionSetup: {
    partNumber: string;
    partName: string;
    material: string;
    materialSpec: string;
    partType: string;
    partThickness: number;
    partLength: number;
    partWidth: number;
    diameter?: number;
    isHollow?: boolean;
    innerDiameter?: number;
    wallThickness?: number;
    acousticVelocity?: number;
  };
  equipment: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    frequency: string;
    transducerType: string;
    transducerDiameter: number;
    couplant: string;
    verticalLinearity: number;
    horizontalLinearity: number;
  };
  calibration: {
    standardType: string;
    referenceMaterial: string;
    fbhSizes: string;
    metalTravelDistance: number;
    blockSerialNumber: string;
    lastCalibrationDate: string;
  };
  scanParameters: {
    scanMethod: string;
    scanType: string;
    scanSpeed: number;
    scanIndex: number;
    coverage: number;
    waterPath?: number;
    pulseRepetitionRate: number;
    gainSettings: string;
    alarmGateSettings: string;
    technique?: string;
  };
  acceptanceCriteria: {
    acceptanceClass: string;
    singleDiscontinuity: string;
    multipleDiscontinuities: string;
    linearDiscontinuity: string;
    backReflectionLoss: number;
    noiseLevel: string;
  };
  documentation: {
    inspectorName: string;
    inspectorCertification: string;
    inspectorLevel: string;
    certifyingOrganization: string;
    inspectionDate: string;
    procedureNumber: string;
    drawingReference: string;
  };
}

// Overall compliance report
export interface ComplianceReport {
  timestamp: string;
  standard: StandardType;
  overallScore: number;          // 0-100
  status: "pass" | "fail" | "warning";
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  criticalIssues: ComplianceResult[];
  warnings: ComplianceResult[];
  info: ComplianceResult[];
  canExport: boolean;            // False if any critical issues
  summary: string;
}

// Frequency ranges per standard
export interface FrequencyRange {
  min: number;  // MHz
  max: number;  // MHz
  recommended: number[];
}

export const FREQUENCY_RANGES: Record<StandardType, FrequencyRange> = {
  "AMS-STD-2154E": { min: 1, max: 15, recommended: [2.25, 5, 10] },
  "MIL-STD-2154": { min: 1, max: 15, recommended: [2.25, 5, 10] },
  "ASTM-A388": { min: 1, max: 5, recommended: [1, 2.25, 5] },
  "BS-EN-10228-3": { min: 1, max: 5, recommended: [2, 4, 5] },
  "BS-EN-10228-4": { min: 1, max: 4, recommended: [1, 2, 4] },
};

// Linearity requirements per standard
export interface LinearityRequirement {
  vertical: number;   // Maximum deviation %
  horizontal: number; // Maximum deviation %
}

export const LINEARITY_REQUIREMENTS: Record<StandardType, LinearityRequirement> = {
  "AMS-STD-2154E": { vertical: 5, horizontal: 2 },
  "MIL-STD-2154": { vertical: 5, horizontal: 2 },
  "ASTM-A388": { vertical: 5, horizontal: 2 },
  "BS-EN-10228-3": { vertical: 5, horizontal: 2 },
  "BS-EN-10228-4": { vertical: 5, horizontal: 2 },
};

// Calibration date requirements (days)
export const CALIBRATION_MAX_AGE_DAYS = 365;
export const LINEARITY_CHECK_MAX_AGE_DAYS = 90;

// Coverage requirements
export const MINIMUM_COVERAGE_PERCENT = 100;

// PRF calculation constants
export const SOUND_VELOCITY_WATER = 1480; // m/s
export const DEFAULT_PRF_MIN = 100;  // Hz
export const DEFAULT_PRF_MAX = 10000; // Hz
