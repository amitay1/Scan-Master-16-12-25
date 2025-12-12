/**
 * Standards Differences Data
 *
 * This file contains all the differences between the 4 supported UT standards:
 * - AMS-STD-2154E (Aerospace)
 * - ASTM A388 (Heavy Steel Forgings)
 * - BS EN 10228-3 (Ferritic/Martensitic Steel Forgings)
 * - BS EN 10228-4 (Austenitic Stainless Steel Forgings)
 */

import { StandardType } from "@/types/techniqueSheet";

// ============================================================================
// ACCEPTANCE CLASSES / QUALITY LEVELS
// ============================================================================

export interface AcceptanceClassOption {
  id: string;
  label: string;
  description: string;
  stringency: "highest" | "high" | "medium" | "low" | "basic";
}

const acceptanceClassesByStandardBase = {
  "AMS-STD-2154E": [
    { id: "AAA", label: "Class AAA", description: "Ultra-Critical - Rotating turbine components, Primary flight controls", stringency: "highest" },
    { id: "AA", label: "Class AA", description: "Super-Critical - Engine mounts, Landing gear primary structure", stringency: "high" },
    { id: "A", label: "Class A", description: "Critical - Primary airframe structure, Engine components", stringency: "medium" },
    { id: "B", label: "Class B", description: "Semi-Critical - Secondary structure, Support brackets", stringency: "low" },
    { id: "C", label: "Class C", description: "Non-Critical - Non-structural components, Tooling", stringency: "basic" },
  ],
  // NOTE: ASTM A388 does NOT define Quality Levels (QL1-QL4) in the standard!
  // Per Section 10.1: Acceptance criteria per purchaser/manufacturer agreement.
  // FBH from S1: <1.5" -> 1/16", 1.5-6" -> 1/8", >6" -> 1/4". QL1-QL4 are INDUSTRY CONVENTIONS.
  "ASTM-A388": [
    { id: "QL1", label: "Quality Level 1", description: "Most stringent - Critical applications", stringency: "highest" },
    { id: "QL2", label: "Quality Level 2", description: "Standard quality - General industrial", stringency: "high" },
    { id: "QL3", label: "Quality Level 3", description: "Commercial quality - Non-critical", stringency: "medium" },
    { id: "QL4", label: "Quality Level 4", description: "Minimum quality - As agreed", stringency: "low" },
  ],
  // BS EN 10228-3 Table 5: Class 4 = MOST stringent, Class 1 = least stringent
  // Recording: Class 1 >8mm, Class 2 >5mm, Class 3 >3mm, Class 4 >2mm EFBH
  "BS-EN-10228-3": [
    { id: "1", label: "Quality Class 1", description: "Basic quality - Least stringent (Recording >8mm, Isolated ≤12mm EFBH)", stringency: "basic" },
    { id: "2", label: "Quality Class 2", description: "Standard quality - General applications (Recording >5mm, Isolated ≤8mm EFBH)", stringency: "low" },
    { id: "3", label: "Quality Class 3", description: "High quality - Stringent requirements (Recording >3mm, Isolated ≤5mm EFBH)", stringency: "medium" },
    { id: "4", label: "Quality Class 4", description: "Highest quality - Most stringent (Recording >2mm, Isolated ≤3mm EFBH)", stringency: "highest" },
  ],
  // BS EN 10228-4: Only 3 Quality Classes (NOT 4!) - Table 5
  // Class 3 = MOST stringent, Class 1 = least stringent (for austenitic materials)
  "BS-EN-10228-4": [
    { id: "1", label: "Quality Class 1", description: "Basic quality - Least stringent for austenitic", stringency: "low" },
    { id: "2", label: "Quality Class 2", description: "Standard quality - Intermediate stringency", stringency: "medium" },
    { id: "3", label: "Quality Class 3", description: "Highest quality - Most stringent for austenitic", stringency: "highest" },
  ],
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, AcceptanceClassOption[]>;

export const acceptanceClassesByStandard: Record<StandardType, AcceptanceClassOption[]> = {
  ...acceptanceClassesByStandardBase,
  "MIL-STD-2154": acceptanceClassesByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// ACCEPTANCE CRITERIA PER STANDARD AND CLASS
// ============================================================================

export interface AcceptanceCriteriaValues {
  singleDiscontinuity: string;
  multipleDiscontinuities: string;
  linearDiscontinuity: string;
  backReflectionLoss: string;
  noiseLevel: string;
  specialNotes?: string;
}

const acceptanceCriteriaByStandardBase = {
  // AMS-STD-2154E Table 6 - Ultrasonic Classes (verified from official document)
  "AMS-STD-2154E": {
    "AAA": {
      singleDiscontinuity: "1/64\" (0.4mm) - 25% of 3/64\" FBH response",
      multipleDiscontinuities: "10% of 3/64\" FBH (centers <1\" apart)",
      linearDiscontinuity: "1/8\" max length - 10% of 3/64\" response",
      backReflectionLoss: "Per Note 4 - with noise change indication",
      noiseLevel: "Alarm level",
      specialNotes: "Most stringent - for rotating turbine components. Note: For titanium, multiple discontinuity separation = 1/4\". Single = 50% of 2/64\" = 25% of 3/64\". Linear/Multiple = 1/64\" or 25% of 2/64\" = 10% of 3/64\"."
    },
    "AA": {
      singleDiscontinuity: "3/64\" (1.2mm) FBH response",
      multipleDiscontinuities: "3/64\" FBH (centers <1\" apart)",
      linearDiscontinuity: "1/2\" max length - 2/64\" response",
      backReflectionLoss: "50% maximum",
      noiseLevel: "Alarm level",
      specialNotes: "For engine mounts, landing gear primary structure, rotor hubs"
    },
    "A": {
      singleDiscontinuity: "5/64\" (2.0mm) FBH response",
      multipleDiscontinuities: "2/64\" FBH (centers <1\" apart)",
      linearDiscontinuity: "1\" max length - 3/64\" response",
      backReflectionLoss: "50% maximum",
      noiseLevel: "Alarm level",
      specialNotes: "For primary airframe structure, engine and transmission components"
    },
    "B": {
      singleDiscontinuity: "8/64\" (3.2mm) FBH response",
      multipleDiscontinuities: "3/64\" FBH (centers <1\" apart)",
      linearDiscontinuity: "1\" max length - 5/64\" response",
      backReflectionLoss: "50% maximum",
      noiseLevel: "Alarm level",
      specialNotes: "For secondary structure, non-flight critical components"
    },
    "C": {
      singleDiscontinuity: "8/64\" (3.2mm) FBH response",
      multipleDiscontinuities: "5/64\" FBH",
      linearDiscontinuity: "Not applicable",
      backReflectionLoss: "50% maximum",
      noiseLevel: "Alarm level",
      specialNotes: "For non-structural components, tooling, ground support. No linear discontinuity or multiple proximity limits."
    },
  },
  "ASTM-A388": {
    "QL1": {
      singleDiscontinuity: "Reference FBH size",
      multipleDiscontinuities: "50% reference FBH",
      linearDiscontinuity: "Not acceptable",
      backReflectionLoss: "50% maximum",
      noiseLevel: "Per agreement",
      specialNotes: "INDUSTRY CONVENTION - not defined in standard. S1 FBH by thickness: under 1.5 inch uses 1/16 FBH, 1.5-6 inch uses 1/8 FBH, over 6 inch uses 1/4 FBH. All criteria per purchaser/manufacturer agreement."
    },
    "QL2": {
      singleDiscontinuity: "2× reference FBH size",
      multipleDiscontinuities: "Reference FBH size",
      linearDiscontinuity: "Length ≤ 1 inch",
      backReflectionLoss: "75% maximum",
      noiseLevel: "Per agreement",
      specialNotes: "INDUSTRY CONVENTION - not in standard. General industrial quality level - all criteria per purchaser agreement."
    },
    "QL3": {
      singleDiscontinuity: "4× reference FBH size",
      multipleDiscontinuities: "2× reference FBH size",
      linearDiscontinuity: "Length ≤ 2 inches",
      backReflectionLoss: "90% maximum",
      noiseLevel: "Per agreement",
      specialNotes: "INDUSTRY CONVENTION - not in standard. Commercial quality - criteria per purchaser agreement."
    },
    "QL4": {
      singleDiscontinuity: "No specific limit",
      multipleDiscontinuities: "4× reference FBH size",
      linearDiscontinuity: "As agreed",
      backReflectionLoss: "Complete loss acceptable",
      noiseLevel: "Per agreement",
      specialNotes: "INDUSTRY CONVENTION - not in standard. All criteria as agreed between purchaser and manufacturer."
    },
  },
  // BS EN 10228-3 Table 5 - Quality Classes for Ferritic/Martensitic Steels
  // Class 4 = MOST stringent, Class 1 = LEAST stringent (uses EFBH in mm)
  "BS-EN-10228-3": {
    "1": {
      singleDiscontinuity: "Isolated: ≤12mm EFBH (Recording level: >8mm EFBH)",
      multipleDiscontinuities: "Extended/Grouped: ≤8mm EFBH",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE Ratio R ≤ 0.1 (10% reduction acceptable)",
      noiseLevel: "Per EN 10228-3 requirements",
      specialNotes: "LEAST STRINGENT - Class 1. Recording >8mm, Isolated ≤12mm, Extended ≤8mm EFBH."
    },
    "2": {
      singleDiscontinuity: "Isolated: ≤8mm EFBH (Recording level: >5mm EFBH)",
      multipleDiscontinuities: "Extended/Grouped: ≤5mm EFBH",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE Ratio R ≤ 0.3 (30% reduction acceptable)",
      noiseLevel: "Per EN 10228-3 requirements",
      specialNotes: "Standard quality - Class 2. Recording >5mm, Isolated ≤8mm, Extended ≤5mm EFBH."
    },
    "3": {
      singleDiscontinuity: "Isolated: ≤5mm EFBH (Recording level: >3mm EFBH)",
      multipleDiscontinuities: "Extended/Grouped: ≤3mm EFBH",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE Ratio R ≤ 0.5 (50% reduction acceptable)",
      noiseLevel: "Per EN 10228-3 requirements",
      specialNotes: "High quality - Class 3. Recording >3mm, Isolated ≤5mm, Extended ≤3mm EFBH."
    },
    "4": {
      singleDiscontinuity: "Isolated: ≤3mm EFBH (Recording level: >2mm EFBH)",
      multipleDiscontinuities: "Extended/Grouped: ≤2mm EFBH",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE Ratio R ≤ 0.6 (60% reduction acceptable)",
      noiseLevel: "Per EN 10228-3 requirements",
      specialNotes: "MOST STRINGENT - Class 4. Highest quality. Recording >2mm, Isolated ≤3mm, Extended ≤2mm EFBH."
    },
  },
  // BS EN 10228-4 Table 5 - Quality Classes for Austenitic/Austenitic-Ferritic Steels
  // Only 3 Quality Classes. Class 3 = MOST stringent, Class 1 = least stringent
  "BS-EN-10228-4": {
    "1": {
      singleDiscontinuity: "Isolated: per Table 5 (thickness dependent) - largest allowable sizes",
      multipleDiscontinuities: "Extended/Grouped: per Table 5 (thickness dependent)",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE ratio per Table 5 (most permissive)",
      noiseLevel: "Adapted for austenitic grain noise - S/N per agreement",
      specialNotes: "LEAST STRINGENT - Class 1. For austenitic/duplex steels. Limits vary by thickness. Account for grain scatter."
    },
    "2": {
      singleDiscontinuity: "Isolated: per Table 5 (thickness dependent) - intermediate sizes",
      multipleDiscontinuities: "Extended/Grouped: per Table 5 (thickness dependent)",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE ratio per Table 5 (intermediate)",
      noiseLevel: "Adapted for austenitic grain noise - S/N min 3:1",
      specialNotes: "Standard quality - Class 2. For austenitic/duplex steels. Intermediate stringency."
    },
    "3": {
      singleDiscontinuity: "Isolated: per Table 5 (thickness dependent) - smallest allowable sizes",
      multipleDiscontinuities: "Extended/Grouped: per Table 5 (thickness dependent)",
      linearDiscontinuity: "Extended indications per isolated limits",
      backReflectionLoss: "BWE ratio per Table 5 (most stringent)",
      noiseLevel: "Adapted for austenitic grain noise - S/N preferred 6:1",
      specialNotes: "MOST STRINGENT - Class 3. Highest quality for austenitic/duplex steels. Most restrictive limits."
    },
  },
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, Record<string, AcceptanceCriteriaValues>>;

export const acceptanceCriteriaByStandard: Record<StandardType, Record<string, AcceptanceCriteriaValues>> = {
  ...acceptanceCriteriaByStandardBase,
  "MIL-STD-2154": acceptanceCriteriaByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// FBH SIZES PER STANDARD
// ============================================================================

export interface FBHSizeOption {
  id: string;
  inch: string;
  mm: number;
  fbhNumber?: string; // For ASTM A388
  thicknessRange?: string;
  applicableClasses?: string[];
}

export interface FBHTableRow {
  thicknessRange: string;
  thicknessRangeMm: string;
  sizes: Record<string, string>; // class -> FBH size
}

// AMS-STD-2154E FBH Table (Table I)
export const amsFBHTable: FBHTableRow[] = [
  {
    thicknessRange: "0.25-0.50 inches",
    thicknessRangeMm: "6.35-12.7 mm",
    sizes: { "AAA": "1/64\" (0.4mm)", "AA": "1/64\" (0.4mm)", "A": "2/64\" (0.8mm)", "B": "3/64\" (1.2mm)", "C": "4/64\" (1.6mm)" }
  },
  {
    thicknessRange: "0.50-1.00 inches",
    thicknessRangeMm: "12.7-25.4 mm",
    sizes: { "AAA": "1/64\" (0.4mm)", "AA": "2/64\" (0.8mm)", "A": "3/64\" (1.2mm)", "B": "4/64\" (1.6mm)", "C": "5/64\" (2.0mm)" }
  },
  {
    thicknessRange: "1.00-2.00 inches",
    thicknessRangeMm: "25.4-50.8 mm",
    sizes: { "AAA": "2/64\" (0.8mm)", "AA": "3/64\" (1.2mm)", "A": "3/64\" (1.2mm)", "B": "5/64\" (2.0mm)", "C": "5/64\" (2.0mm)" }
  },
  {
    thicknessRange: "2.00-4.00 inches",
    thicknessRangeMm: "50.8-101.6 mm",
    sizes: { "AAA": "3/64\" (1.2mm)", "AA": "3/64\" (1.2mm)", "A": "5/64\" (2.0mm)", "B": "5/64\" (2.0mm)", "C": "8/64\" (3.2mm)" }
  },
  {
    thicknessRange: ">4.00 inches",
    thicknessRangeMm: ">101.6 mm",
    sizes: { "AAA": "3/64\" (1.2mm)", "AA": "5/64\" (2.0mm)", "A": "5/64\" (2.0mm)", "B": "8/64\" (3.2mm)", "C": "8/64\" (3.2mm)" }
  },
];

// ASTM A388 FBH Sizes (simpler - by thickness only)
export const astmA388FBHTable: FBHSizeOption[] = [
  { id: "a388_1", inch: "1/16\"", mm: 1.6, fbhNumber: "#1", thicknessRange: "Up to 1.5\" (38mm)" },
  { id: "a388_2", inch: "1/8\"", mm: 3.2, fbhNumber: "#2", thicknessRange: "1.5-6.0\" (38-152mm)" },
  { id: "a388_3", inch: "1/4\"", mm: 6.4, fbhNumber: "#3", thicknessRange: "Over 6.0\" (>152mm)" },
];

// BS EN 10228-3/4 FBH Sizes (metric)
export const enFBHSizes: FBHSizeOption[] = [
  { id: "en_3mm", inch: "0.118\"", mm: 3, thicknessRange: "General use" },
  { id: "en_5mm", inch: "0.197\"", mm: 5, thicknessRange: "Medium thickness" },
  { id: "en_8mm", inch: "0.315\"", mm: 8, thicknessRange: "Heavy sections" },
];

// ============================================================================
// EQUIPMENT PARAMETERS PER STANDARD
// ============================================================================

export interface EquipmentParameters {
  frequencyRange: { min: number; max: number; typical: number; unit: string };
  verticalLinearity: { min: number; max: number };
  horizontalLinearity: { min: number } | null; // null if not specified
  frequencyTolerance: string | null;
  prfRange: string | null;
  transducerDiameter: { min: number; max: number; unit: string };
  notes: string;
}

const equipmentParametersByStandardBase = {
  "AMS-STD-2154E": {
    frequencyRange: { min: 2.25, max: 15, typical: 5, unit: "MHz" },
    verticalLinearity: { min: 5, max: 98 },
    horizontalLinearity: { min: 90 },
    frequencyTolerance: "±10%",
    prfRange: "100-10000 Hz",
    transducerDiameter: { min: 6.35, max: 25.4, unit: "mm" },
    notes: "High frequency capability for aerospace applications. Resolution requirements per Table II."
  },
  "ASTM-A388": {
    frequencyRange: { min: 1, max: 5, typical: 2.25, unit: "MHz" },
    verticalLinearity: { min: 10, max: 95 },
    horizontalLinearity: { min: 85 },
    frequencyTolerance: null,
    prfRange: null,
    transducerDiameter: { min: 9.5, max: 28.6, unit: "mm" },
    notes: "Lower frequencies for heavy steel forgings. Select based on grain structure."
  },
  "BS-EN-10228-3": {
    frequencyRange: { min: 1, max: 5, typical: 2, unit: "MHz" },
    verticalLinearity: { min: 80, max: 100 },
    horizontalLinearity: null,
    frequencyTolerance: null,
    prfRange: null,
    transducerDiameter: { min: 10, max: 25, unit: "mm" },
    notes: "Frequency selection based on material grain size and thickness."
  },
  "BS-EN-10228-4": {
    frequencyRange: { min: 0.5, max: 2, typical: 1, unit: "MHz" },
    verticalLinearity: { min: 80, max: 100 },
    horizontalLinearity: null,
    frequencyTolerance: null,
    prfRange: null,
    transducerDiameter: { min: 20, max: 30, unit: "mm" },
    notes: "Low frequency required for austenitic materials due to coarse grain and high attenuation. Consider 0.5-1 MHz for very coarse grain."
  },
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, EquipmentParameters>;

export const equipmentParametersByStandard: Record<StandardType, EquipmentParameters> = {
  ...equipmentParametersByStandardBase,
  "MIL-STD-2154": equipmentParametersByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// SCAN PARAMETERS PER STANDARD
// ============================================================================

export interface ScanParameters {
  maxSpeedManual: { value: number; unit: string };
  maxSpeedAutomated: { value: number; unit: string };
  minOverlap: number; // percentage
  coverageRequired: number; // percentage
  calibrationFrequency: string;
  sensitivityGain: string;
  notes: string;
}

const scanParametersByStandardBase = {
  "AMS-STD-2154E": {
    maxSpeedManual: { value: 150, unit: "mm/s" },
    maxSpeedAutomated: { value: 150, unit: "mm/s" },
    minOverlap: 30,
    coverageRequired: 100,
    calibrationFrequency: "Before inspection, every 4 hours, and at completion",
    sensitivityGain: "80% FSH on reference, +6 to +12 dB for scanning",
    notes: "Strict 30% overlap requirement. Coverage map required for complex geometries."
  },
  "ASTM-A388": {
    maxSpeedManual: { value: 152, unit: "mm/s" }, // 6 in/s
    maxSpeedAutomated: { value: 305, unit: "mm/s" }, // 12 in/s
    minOverlap: 10,
    coverageRequired: 100,
    calibrationFrequency: "Before and after inspection",
    sensitivityGain: "80% FSH on reference, +14 dB for scanning, +6 dB for evaluation",
    notes: "Higher scanning gain (+14 dB) compared to other standards. Grid size depends on thickness."
  },
  "BS-EN-10228-3": {
    maxSpeedManual: { value: 150, unit: "mm/s" },
    maxSpeedAutomated: { value: 500, unit: "mm/s" },
    minOverlap: 10,
    coverageRequired: 100,
    calibrationFrequency: "Before and after inspection",
    sensitivityGain: "80% FSH on reference DAC",
    notes: "Highest automated speed allowed. Max indexing 75% of beam diameter."
  },
  "BS-EN-10228-4": {
    maxSpeedManual: { value: 100, unit: "mm/s" },
    maxSpeedAutomated: { value: 250, unit: "mm/s" },
    minOverlap: 20,
    coverageRequired: 100,
    calibrationFrequency: "Before inspection, every 2 hours, and at completion",
    sensitivityGain: "Adjusted for grain noise level",
    notes: "Lower speeds and higher overlap due to austenitic material characteristics. More frequent calibration required."
  },
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, ScanParameters>;

export const scanParametersByStandard: Record<StandardType, ScanParameters> = {
  ...scanParametersByStandardBase,
  "MIL-STD-2154": scanParametersByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// DOCUMENTATION REQUIREMENTS PER STANDARD
// ============================================================================

export interface DocumentationRequirements {
  recordRetentionYears: number | string;
  personnelCertification: string;
  techniqueSheetRequired: boolean;
  coverageMapRequired: string;
  additionalRequirements: string[];
}

const documentationByStandardBase = {
  "AMS-STD-2154E": {
    recordRetentionYears: 7,
    personnelCertification: "Per company specification (typically NAS 410)",
    techniqueSheetRequired: true,
    coverageMapRequired: "Required for complex geometries",
    additionalRequirements: [
      "Full material and equipment traceability",
      "All indications above 50% reference must be reported",
      "Calibration records maintained"
    ]
  },
  "ASTM-A388": {
    recordRetentionYears: 5,
    personnelCertification: "ASNT SNT-TC-1A Level 2 minimum",
    techniqueSheetRequired: true,
    coverageMapRequired: "Required",
    additionalRequirements: [
      "Forging identification",
      "Equipment settings documented",
      "Indication location and size recorded"
    ]
  },
  "BS-EN-10228-3": {
    recordRetentionYears: 10,
    personnelCertification: "EN ISO 9712 Level 2 minimum",
    techniqueSheetRequired: true,
    coverageMapRequired: "Required for complex geometries",
    additionalRequirements: [
      "Material specification documented",
      "Thickness range specified",
      "Quality class stated"
    ]
  },
  "BS-EN-10228-4": {
    recordRetentionYears: "Per contract",
    personnelCertification: "EN ISO 9712 Level 2 minimum + austenitic material training",
    techniqueSheetRequired: true,
    coverageMapRequired: "Required - record actual scan paths",
    additionalRequirements: [
      "Material grade and condition documented",
      "Measured attenuation value recorded",
      "Noise level assessment documented",
      "Actual velocity measurements recorded",
      "Special techniques noted"
    ]
  },
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, DocumentationRequirements>;

export const documentationByStandard: Record<StandardType, DocumentationRequirements> = {
  ...documentationByStandardBase,
  "MIL-STD-2154": documentationByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// CALIBRATION REQUIREMENTS PER STANDARD
// ============================================================================

export interface CalibrationRequirements {
  referenceBlockMaterial: string;
  calibrationInterval: string;
  dacCurvePoints: number;
  primarySensitivity: string;
  transferCorrection: string;
  verificationRequirements: string;
}

const calibrationByStandardBase = {
  "AMS-STD-2154E": {
    referenceBlockMaterial: "Same material specification and heat treatment as part",
    calibrationInterval: "Before each inspection, every 4 hours, and at completion",
    dacCurvePoints: 3,
    primarySensitivity: "80% FSH on reference reflector",
    transferCorrection: "Required when surface finish differs",
    verificationRequirements: "Verify at beginning, during (every 4 hrs), and end of inspection"
  },
  "ASTM-A388": {
    referenceBlockMaterial: "Same or acoustically similar material, similar heat treatment",
    calibrationInterval: "Before and after inspection",
    dacCurvePoints: 3,
    primarySensitivity: "80% FSH, +14 dB for scanning",
    transferCorrection: "Account for surface roughness difference",
    verificationRequirements: "Check at mid-range during inspection"
  },
  "BS-EN-10228-3": {
    referenceBlockMaterial: "Same or acoustically equivalent material",
    calibrationInterval: "Before and after inspection",
    dacCurvePoints: 3,
    primarySensitivity: "80% FSH on primary echo",
    transferCorrection: "Required when surface roughness differs > Ra 6.3 μm (max 4 dB)",
    verificationRequirements: "Verify DAC curve at completion"
  },
  "BS-EN-10228-4": {
    referenceBlockMaterial: "Same or similar austenitic material",
    calibrationInterval: "Before inspection, every 2 hours, and at completion",
    dacCurvePoints: 3,
    primarySensitivity: "Adjusted for grain noise level",
    transferCorrection: "Measure on actual component due to attenuation variation",
    verificationRequirements: "Verify every 2 hours, acceptance within ±2 dB of initial"
  },
} satisfies Record<Exclude<StandardType, "MIL-STD-2154">, CalibrationRequirements>;

export const calibrationByStandard: Record<StandardType, CalibrationRequirements> = {
  ...calibrationByStandardBase,
  "MIL-STD-2154": calibrationByStandardBase["AMS-STD-2154E"],
};

// ============================================================================
// SPECIAL MATERIAL WARNINGS
// ============================================================================

export interface MaterialWarning {
  material: string;
  standard: StandardType;
  warning: string;
  recommendations: string[];
}

export const materialWarnings: MaterialWarning[] = [
  {
    material: "titanium",
    standard: "AMS-STD-2154E",
    warning: "Titanium requires special attention for Class AAA inspections",
    recommendations: [
      "Use lower frequencies (2.25-5 MHz) due to grain scatter",
      "Additional surface preparation may be required",
      "Consider grain flow direction in scan planning",
      "Chemical milling acceptable for surface preparation"
    ]
  },
  {
    material: "stainless_steel",
    standard: "BS-EN-10228-4",
    warning: "Austenitic stainless steel requires BS EN 10228-4 (not 10228-3)",
    recommendations: [
      "Use 0.5-2 MHz frequency range",
      "Larger probe diameter (20-30mm) recommended",
      "Account for high attenuation (0.05-0.20 dB/mm)",
      "Signal-to-noise ratio minimum 3:1, prefer 6:1",
      "More frequent calibration (every 2 hours)"
    ]
  },
  {
    material: "magnesium",
    standard: "AMS-STD-2154E",
    warning: "Magnesium has high attenuation - special considerations required",
    recommendations: [
      "Use lower frequencies (1-2.25 MHz)",
      "Non-corrosive couplant required",
      "Protective coating acceptable if < 0.05mm",
      "Consider higher sensitivity settings"
    ]
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the default acceptance class for a given standard
 */
export function getDefaultAcceptanceClass(standard: StandardType): string {
  const defaultsByStandardBase = {
    "AMS-STD-2154E": "A",
    "ASTM-A388": "QL2",
    "BS-EN-10228-3": "2", // Class 2 = Standard quality (not too stringent, not too lax)
    "BS-EN-10228-4": "2", // Class 2 = Standard quality (intermediate stringency)
  } satisfies Record<Exclude<StandardType, "MIL-STD-2154">, string>;

  const defaults: Record<StandardType, string> = {
    ...defaultsByStandardBase,
    "MIL-STD-2154": defaultsByStandardBase["AMS-STD-2154E"],
  };

  return defaults[standard];
}

/**
 * Get FBH size based on standard, thickness and class
 */
export function getFBHSizeForStandard(
  standard: StandardType,
  thicknessMm: number,
  acceptanceClass: string
): string {
  if (standard === "AMS-STD-2154E") {
    // Find the appropriate row in AMS table
    let row = amsFBHTable[0];
    if (thicknessMm > 101.6) row = amsFBHTable[4];
    else if (thicknessMm > 50.8) row = amsFBHTable[3];
    else if (thicknessMm > 25.4) row = amsFBHTable[2];
    else if (thicknessMm > 12.7) row = amsFBHTable[1];

    return row.sizes[acceptanceClass] || row.sizes["A"];
  }

  if (standard === "ASTM-A388") {
    // ASTM A388 is by thickness only
    if (thicknessMm <= 38) return "1/16\" (1.6mm) - #1";
    if (thicknessMm <= 152) return "1/8\" (3.2mm) - #2";
    return "1/4\" (6.4mm) - #3";
  }

  // BS EN standards use metric
  if (thicknessMm < 50) return "3mm (0.118\")";
  if (thicknessMm < 150) return "5mm (0.197\")";
  return "8mm (0.315\")";
}

/**
 * Get recommended frequency for a standard and thickness
 */
export function getRecommendedFrequencyForStandard(
  standard: StandardType,
  thicknessMm: number
): string {
  const params = equipmentParametersByStandard[standard];

  if (standard === "BS-EN-10228-4") {
    // Austenitic - always use lower frequencies
    if (thicknessMm > 200) return "0.5 MHz";
    if (thicknessMm > 100) return "1 MHz";
    return "1-2 MHz";
  }

  if (standard === "ASTM-A388") {
    // Heavy forgings - lower frequencies
    if (thicknessMm > 150) return "1 MHz";
    if (thicknessMm > 75) return "2.25 MHz";
    return "2.25-5 MHz";
  }

  // AMS and BS EN 10228-3
  if (thicknessMm < 12.7) return "10 MHz";
  if (thicknessMm < 25.4) return "5 MHz";
  if (thicknessMm < 50.8) return "2.25 MHz";
  return "1-2.25 MHz";
}

/**
 * Check if a material is appropriate for a standard
 */
export function isAppropriateMaterialForStandard(
  material: string,
  standard: StandardType
): { appropriate: boolean; warning?: string; recommendedStandard?: StandardType } {
  if (material === "stainless_steel" && standard === "BS-EN-10228-3") {
    return {
      appropriate: false,
      warning: "Austenitic stainless steel should use BS EN 10228-4",
      recommendedStandard: "BS-EN-10228-4"
    };
  }

  if ((material === "aluminum" || material === "titanium" || material === "magnesium") &&
      (standard === "BS-EN-10228-3" || standard === "BS-EN-10228-4")) {
    return {
      appropriate: false,
      warning: "Non-ferrous materials should use AMS-STD-2154E",
      recommendedStandard: "AMS-STD-2154E"
    };
  }

  return { appropriate: true };
}

/**
 * Get all parameters that change when switching to a new standard
 */
export function getChangedFieldsForStandard(standard: StandardType): string[] {
  return [
    "acceptanceClass",
    "singleDiscontinuity",
    "multipleDiscontinuities",
    "linearDiscontinuity",
    "backReflectionLoss",
    "noiseLevel",
    "frequency",
    "verticalLinearity",
    "horizontalLinearity",
    "scanSpeed",
    "scanIndex",
    "overlap",
    "fbhSizes",
    "calibrationFrequency",
    "recordRetention",
    "personnelCertification"
  ];
}
