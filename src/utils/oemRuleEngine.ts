/**
 * OEM Rule Engine
 *
 * Central dispatcher for vendor-specific rules (GE, RR, PW).
 * Provides a unified interface to access OEM requirements for:
 * - Coverage specifications
 * - Equipment constraints
 * - Calibration rules
 * - Documentation requirements
 *
 * Usage:
 *   const rules = getOEMRules('PW');
 *   const coverage = rules.coverageRequirements.minCoverage; // 100%
 *
 * PW Rules Source:
 *   NDIP-1226 Rev F - V2500 1st Stage HPT Disk
 *   NDIP-1227 Rev D - V2500 2nd Stage HPT Disk
 */

import type {
  OEMVendor,
  OEMRuleSet,
  OEMCoverageRequirements,
  OEMFrequencyConstraints,
  OEMCalibrationRules,
  OEMDocumentationRules,
  OEMTransducerSpec,
  OEMCalibrationBlockSpec,
  PartGeometry,
  MaterialType,
  CalibrationBlockType,
} from '@/types/techniqueSheet';

// Import real PW rules from NDIP specifications
import { PW_RULE_SET, PW_V2500_PARTS } from '@/rules/pw/pwRuleSet';
import { PW_APPROVED_TRANSDUCERS, PW_APPROVED_MIRRORS } from '@/rules/pw/pwTransducers';
import { PW_ANGLE_CALIBRATION_BLOCK } from '@/rules/pw/pwCalibrationBlocks';

// ============================================================================
// Default Generic Rules (AMS-STD-2154E baseline)
// ============================================================================

const GENERIC_COVERAGE: OEMCoverageRequirements = {
  minCoverage: 100,
  overlapRequirement: 15,
  criticalZoneMultiplier: 1.0,
  edgeExclusion: 3, // mm
};

const GENERIC_FREQUENCY: OEMFrequencyConstraints = {
  min: 1,
  max: 15,
  preferred: [2.25, 5, 10],
};

const GENERIC_CALIBRATION: OEMCalibrationRules = {
  interval: 8, // hours
  temperatureCheckRequired: false,
  dacCurveRequired: false,
  tcgRequired: false,
  transferCorrectionMax: 6, // dB
  periodicVerificationHours: 4,
};

const GENERIC_DOCUMENTATION: OEMDocumentationRules = {
  templateId: 'ams-std-2154e',
  requiredSections: [
    'part_information',
    'equipment',
    'calibration',
    'scan_parameters',
    'acceptance_criteria',
    'documentation',
  ],
  approvalLevels: 1,
  language: 'english',
  revisionTracking: true,
};

// ============================================================================
// OEM-Specific Rule Sets
// ============================================================================

/**
 * Generic/AMS rules (default baseline)
 */
const GENERIC_RULES: OEMRuleSet = {
  vendorId: 'GENERIC',
  vendorName: 'Generic (AMS-STD-2154E)',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  specReference: 'AMS-STD-2154E',

  coverageRequirements: GENERIC_COVERAGE,
  frequencyConstraints: GENERIC_FREQUENCY,
  approvedTransducers: [], // No restrictions
  approvedBlocks: [], // No restrictions
  calibrationRules: GENERIC_CALIBRATION,
  documentationRules: GENERIC_DOCUMENTATION,

  warnings: [],
  notes: ['Standard AMS-STD-2154E requirements apply'],
};

/**
 * Pratt & Whitney (PW) rules
 * Source: NDIP-1226 Rev F, NDIP-1227 Rev D
 * V2500 HPT Disk Off-Wing Immersion UT Inspection
 */
const PW_RULES: OEMRuleSet = {
  vendorId: 'PW',
  vendorName: 'Pratt & Whitney',
  version: '2.0.0', // Updated with real NDIP data
  effectiveDate: '2021-11-10', // NDIP-1227 Rev D date
  specReference: 'NDIP-1226 Rev F / NDIP-1227 Rev D',

  coverageRequirements: {
    minCoverage: 100, // Full bore coverage required (Section 7.1.3)
    overlapRequirement: 0, // Overlap handled by scan/index increments
    criticalZoneMultiplier: 1.0, // Per NDIP specifications
    edgeExclusion: 0, // Specific zones defined per NDIP figures
    // Additional PW-specific requirements:
    // radialCoverage: 2.6 inches minimum (Section 7.1.3)
    // scanAngles: [45, -45] degrees circumferential shear wave
  },

  frequencyConstraints: {
    min: 5, // IAE2P16679 transducer is 5 MHz
    max: 5, // Only 5 MHz approved per NDIP
    preferred: [5], // 5 MHz, 8" Focus per Section 2.4
  },

  // PW-approved transducers per NDIP Section 2.4
  approvedTransducers: PW_APPROVED_TRANSDUCERS.map((t) => ({
    id: t.partNumber,
    manufacturer: 'Pratt & Whitney NDE',
    model: t.partNumber,
    frequency: t.frequency,
    approved: true,
    notes: t.description,
  })),

  // PW-approved calibration blocks per NDIP Section 2.1
  approvedBlocks: [
    {
      type: 'flat_fbh' as CalibrationBlockType, // 45-degree angle block with #1 FBH
      partNumber: PW_ANGLE_CALIBRATION_BLOCK.partNumber,
      fbhSize: PW_ANGLE_CALIBRATION_BLOCK.fbhSize,
      material: PW_ANGLE_CALIBRATION_BLOCK.material,
      approved: true,
      notes: PW_ANGLE_CALIBRATION_BLOCK.description,
    },
  ],

  calibrationRules: {
    interval: 8, // Per shift or as needed
    temperatureCheckRequired: false, // Not specified in NDIP
    dacCurveRequired: true, // DAC required per Section 5.1
    tcgRequired: false, // DAC used, not TCG
    transferCorrectionMax: 1.0, // Section 5.1.5.1 - ±1.0 dB tolerance
    periodicVerificationHours: 0, // Post-calibration per Section 5.1.5.3 triggers
    // Additional PW requirements:
    // targetAmplitude: 80% FSH (Section 5.1)
    // referenceHoles: ['L', 'M', 'N', 'P', 'Q', 'R', 'S'] - holes J&K omitted
    // curvatureCorrectionRequired: true (per transducer/system)
    // calibrationBlockRecertification: 'yearly at PW NDE' (Section 5.2)
  },

  documentationRules: {
    templateId: 'pw-ndip-v2500',
    requiredSections: [
      'inspector_info',           // Section 9.1.1
      'aircraft_info',            // Section 9.1.2
      'engine_info',              // Section 9.1.3
      'disk_info',                // Section 9.1.4
      'equipment',                // Section 9.1.5
      'calibration',              // Section 5.0
      'dac_curve',                // Section 5.1
      'scan_parameters',          // Section 7.0
      'scan_coverage_map',        // Section 7.1
      'acceptance_criteria',      // Section 8.0
      'indications',              // Section 9.1.7
      'electronic_data',          // Section 9.1.5, 9.1.6
    ],
    approvalLevels: 2, // Level II + Level III per Section 3.0
    language: 'english',
    revisionTracking: true,
  },

  // Part-specific overrides for V2500 HPT disks
  partSpecificRules: {
    bore: {
      coverageRequirements: {
        minCoverage: 100, // Full bore coverage
        overlapRequirement: 0, // Handled by 0.020" scan/index increments
        criticalZoneMultiplier: 1.0,
        edgeExclusion: 0,
      },
      frequencyConstraints: {
        min: 5,
        max: 5,
        preferred: [5],
      },
    },
    // Stage 1 specific (NDIP-1226)
    hptStage1: {
      partNumber: PW_V2500_PARTS.hptStage1.partNumber,
      boreRadius: PW_V2500_PARTS.hptStage1.boreRadius,
      boreOffset: PW_V2500_PARTS.hptStage1.boreOffset,
    },
    // Stage 2 specific (NDIP-1227)
    hptStage2: {
      partNumber: PW_V2500_PARTS.hptStage2.partNumber,
      boreRadius: PW_V2500_PARTS.hptStage2.boreRadius,
      boreOffset: PW_V2500_PARTS.hptStage2.boreOffset,
    },
  },

  warnings: [
    'Contact Level III for approval of non-standard equipment',
    'METAL-TO-METAL CONTACT MUST BE AVOIDED with HPT disks',
    'Collimator/damping device use requires PW MPE-NDE approval',
  ],
  notes: [
    'V2500 HPT Disk Off-Wing Immersion UT per NDIP-1226/1227',
    'Circumferential shear wave inspection at ±45° refracted angle',
    'All electronic data must be transferred to PW MPE-NDE via MFT',
    'Inspector must hold valid PW task-specific certificate',
    'Transducers must be sourced through PW NDE',
    'Calibration blocks require yearly recertification at PW NDE',
  ],
};

/**
 * General Electric (GE) rules
 * Placeholder - to be populated with actual GE specs
 */
const GE_RULES: OEMRuleSet = {
  vendorId: 'GE',
  vendorName: 'General Electric Aviation',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  specReference: 'GE P23TF22',

  coverageRequirements: {
    minCoverage: 95, // GE allows 95% minimum in some cases
    overlapRequirement: 20,
    criticalZoneMultiplier: 1.25,
    edgeExclusion: 5,
  },

  frequencyConstraints: {
    min: 2.25,
    max: 10,
    preferred: [5, 10],
  },

  approvedTransducers: [], // To be populated

  approvedBlocks: [], // To be populated

  calibrationRules: {
    interval: 8,
    temperatureCheckRequired: true,
    dacCurveRequired: true,
    tcgRequired: true, // GE often requires TCG
    transferCorrectionMax: 6,
    periodicVerificationHours: 4,
  },

  documentationRules: {
    templateId: 'ge-aviation',
    requiredSections: [
      'part_information',
      'equipment',
      'calibration',
      'tcg_setup',
      'scan_parameters',
      'acceptance_criteria',
      'documentation',
    ],
    approvalLevels: 2,
    language: 'english',
    revisionTracking: true,
  },

  warnings: [
    'GE spec requirements pending - using placeholder values',
  ],
  notes: [
    'GE Aviation rotor inspection per P23TF22',
  ],
};

/**
 * Rolls-Royce (RR) rules
 * Placeholder - to be populated with actual RR specs
 */
const RR_RULES: OEMRuleSet = {
  vendorId: 'RR',
  vendorName: 'Rolls-Royce',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  specReference: 'RRP 59000 series',

  coverageRequirements: {
    minCoverage: 100,
    overlapRequirement: 20,
    criticalZoneMultiplier: 1.5,
    edgeExclusion: 4,
  },

  frequencyConstraints: {
    min: 2,
    max: 15,
    preferred: [5, 10],
  },

  approvedTransducers: [], // To be populated

  approvedBlocks: [], // To be populated

  calibrationRules: {
    interval: 8,
    temperatureCheckRequired: true,
    dacCurveRequired: true,
    tcgRequired: false,
    transferCorrectionMax: 5,
    periodicVerificationHours: 4,
  },

  documentationRules: {
    templateId: 'rr-standard',
    requiredSections: [
      'part_information',
      'equipment',
      'calibration',
      'scan_parameters',
      'acceptance_criteria',
      'documentation',
    ],
    approvalLevels: 2,
    language: 'english',
    revisionTracking: true,
  },

  warnings: [
    'RR spec requirements pending - using placeholder values',
    'Phased array preferred for complex geometries',
  ],
  notes: [
    'Rolls-Royce inspection per RRP 59000 series',
  ],
};

// ============================================================================
// Rule Registry
// ============================================================================

const OEM_RULES_REGISTRY: Record<OEMVendor, OEMRuleSet> = {
  GENERIC: GENERIC_RULES,
  PW: PW_RULES,
  GE: GE_RULES,
  RR: RR_RULES,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get OEM rules for a specific vendor
 */
export function getOEMRules(vendor: OEMVendor): OEMRuleSet {
  return OEM_RULES_REGISTRY[vendor] || GENERIC_RULES;
}

/**
 * Get all available OEM vendors
 */
export function getAvailableVendors(): Array<{ id: OEMVendor; name: string }> {
  return Object.values(OEM_RULES_REGISTRY).map((rules) => ({
    id: rules.vendorId,
    name: rules.vendorName,
  }));
}

/**
 * Get coverage requirements for a vendor, optionally with part-specific override
 */
export function getCoverageRequirements(
  vendor: OEMVendor,
  partCategory?: string
): OEMCoverageRequirements {
  const rules = getOEMRules(vendor);

  if (partCategory && rules.partSpecificRules?.[partCategory]?.coverageRequirements) {
    return {
      ...rules.coverageRequirements,
      ...rules.partSpecificRules[partCategory].coverageRequirements,
    };
  }

  return rules.coverageRequirements;
}

/**
 * Get frequency constraints for a vendor
 */
export function getFrequencyConstraints(vendor: OEMVendor): OEMFrequencyConstraints {
  return getOEMRules(vendor).frequencyConstraints;
}

/**
 * Get calibration rules for a vendor
 */
export function getCalibrationRules(vendor: OEMVendor): OEMCalibrationRules {
  return getOEMRules(vendor).calibrationRules;
}

/**
 * Check if a transducer is approved for a vendor
 * Returns true if no restrictions (empty list) or if transducer is in approved list
 */
export function isTransducerApproved(
  vendor: OEMVendor,
  transducerId: string
): boolean {
  const rules = getOEMRules(vendor);

  // If no restrictions, all transducers are allowed
  if (rules.approvedTransducers.length === 0) {
    return true;
  }

  return rules.approvedTransducers.some(
    (t) => t.id === transducerId && t.approved
  );
}

/**
 * Check if a calibration block is approved for a vendor
 */
export function isBlockApproved(
  vendor: OEMVendor,
  blockType: CalibrationBlockType
): boolean {
  const rules = getOEMRules(vendor);

  // If no restrictions, all blocks are allowed
  if (rules.approvedBlocks.length === 0) {
    return true;
  }

  return rules.approvedBlocks.some(
    (b) => b.type === blockType && b.approved
  );
}

/**
 * Validate a setup against OEM rules
 * Returns validation results with errors and warnings
 */
export interface OEMValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  vendor: OEMVendor;
  specReference: string;
}

export function validateAgainstOEMRules(
  vendor: OEMVendor,
  setup: {
    coverage?: number;
    overlap?: number;
    frequency?: number;
    transducerId?: string;
    blockType?: CalibrationBlockType;
    hasDAC?: boolean;
    hasTCG?: boolean;
  }
): OEMValidationResult {
  const rules = getOEMRules(vendor);
  const errors: string[] = [];
  const warnings: string[] = [...rules.warnings];

  // Validate coverage
  if (setup.coverage !== undefined) {
    if (setup.coverage < rules.coverageRequirements.minCoverage) {
      errors.push(
        `Coverage ${setup.coverage}% is below ${vendor} minimum of ${rules.coverageRequirements.minCoverage}%`
      );
    }
  }

  // Validate overlap
  if (setup.overlap !== undefined) {
    if (setup.overlap < rules.coverageRequirements.overlapRequirement) {
      warnings.push(
        `Overlap ${setup.overlap}% is below ${vendor} recommended ${rules.coverageRequirements.overlapRequirement}%`
      );
    }
  }

  // Validate frequency
  if (setup.frequency !== undefined) {
    if (setup.frequency < rules.frequencyConstraints.min) {
      errors.push(
        `Frequency ${setup.frequency} MHz is below ${vendor} minimum of ${rules.frequencyConstraints.min} MHz`
      );
    }
    if (setup.frequency > rules.frequencyConstraints.max) {
      errors.push(
        `Frequency ${setup.frequency} MHz exceeds ${vendor} maximum of ${rules.frequencyConstraints.max} MHz`
      );
    }
    if (!rules.frequencyConstraints.preferred.includes(setup.frequency)) {
      warnings.push(
        `Frequency ${setup.frequency} MHz is not in ${vendor} preferred list: ${rules.frequencyConstraints.preferred.join(', ')} MHz`
      );
    }
  }

  // Validate transducer
  if (setup.transducerId && !isTransducerApproved(vendor, setup.transducerId)) {
    errors.push(`Transducer ${setup.transducerId} is not approved for ${vendor}`);
  }

  // Validate block
  if (setup.blockType && !isBlockApproved(vendor, setup.blockType)) {
    warnings.push(`Block type ${setup.blockType} may not be approved for ${vendor}`);
  }

  // Validate DAC requirement
  if (rules.calibrationRules.dacCurveRequired && !setup.hasDAC) {
    errors.push(`${vendor} requires DAC curve for this inspection`);
  }

  // Validate TCG requirement
  if (rules.calibrationRules.tcgRequired && !setup.hasTCG) {
    warnings.push(`${vendor} recommends TCG for this inspection`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    vendor,
    specReference: rules.specReference,
  };
}

/**
 * Get recommended settings based on OEM rules
 */
export interface OEMRecommendedSettings {
  frequency: number;
  overlap: number;
  coverage: number;
  dacRequired: boolean;
  tcgRequired: boolean;
  calibrationInterval: number;
  templateId: string;
}

export function getRecommendedSettings(
  vendor: OEMVendor,
  partCategory?: string
): OEMRecommendedSettings {
  const rules = getOEMRules(vendor);
  const coverage = getCoverageRequirements(vendor, partCategory);

  return {
    frequency: rules.frequencyConstraints.preferred[0] || 5,
    overlap: coverage.overlapRequirement,
    coverage: coverage.minCoverage,
    dacRequired: rules.calibrationRules.dacCurveRequired,
    tcgRequired: rules.calibrationRules.tcgRequired,
    calibrationInterval: rules.calibrationRules.interval,
    templateId: rules.documentationRules.templateId,
  };
}

/**
 * Merge OEM rules with user overrides
 * OEM rules take precedence for mandatory requirements
 */
export function mergeWithOEMRules<T extends Record<string, unknown>>(
  userSettings: T,
  vendor: OEMVendor,
  mandatoryFields: (keyof T)[] = []
): T {
  const rules = getOEMRules(vendor);
  const result = { ...userSettings };

  // Apply OEM mandatory overrides
  // This ensures compliance even if user tries to override
  if (mandatoryFields.includes('coverage' as keyof T)) {
    const minCoverage = rules.coverageRequirements.minCoverage;
    if ((result.coverage as number) < minCoverage) {
      (result as Record<string, unknown>).coverage = minCoverage;
    }
  }

  return result;
}

// ============================================================================
// Standard to OEM Mapping
// ============================================================================

/**
 * Map a StandardType to its corresponding OEM vendor
 * Returns 'GENERIC' for non-OEM standards
 */
export function getVendorFromStandard(standard: string): OEMVendor {
  // PW NDIP standards
  if (standard === 'NDIP-1226' || standard === 'NDIP-1227') {
    return 'PW';
  }

  // GE standards (future)
  // if (standard.startsWith('GE-') || standard.startsWith('P23TF')) {
  //   return 'GE';
  // }

  // RR standards (future)
  // if (standard.startsWith('RRP-') || standard.startsWith('RR-')) {
  //   return 'RR';
  // }

  // All generic standards (AMS, ASTM, BS-EN, MIL-STD)
  return 'GENERIC';
}

/**
 * Check if a standard is OEM-specific
 */
export function isOEMStandard(standard: string): boolean {
  return getVendorFromStandard(standard) !== 'GENERIC';
}

/**
 * Get OEM rules from a standard type (convenience function)
 * Automatically maps standard to vendor and returns appropriate rules
 */
export function getOEMRulesFromStandard(standard: string): OEMRuleSet {
  const vendor = getVendorFromStandard(standard);
  return getOEMRules(vendor);
}

/**
 * Get NDIP-specific part data for V2500 disks
 */
export function getNDIPPartData(ndipCode: string): {
  partNumber: string;
  boreRadius: number;
  boreOffset: number;
  ndipDocument: string;
  revision: string;
} | null {
  if (ndipCode === 'NDIP-1226') {
    return {
      partNumber: PW_V2500_PARTS.hptStage1.partNumber,
      boreRadius: PW_V2500_PARTS.hptStage1.boreRadius,
      boreOffset: PW_V2500_PARTS.hptStage1.boreOffset,
      ndipDocument: 'NDIP-1226',
      revision: 'F',
    };
  }
  if (ndipCode === 'NDIP-1227') {
    return {
      partNumber: PW_V2500_PARTS.hptStage2.partNumber,
      boreRadius: PW_V2500_PARTS.hptStage2.boreRadius,
      boreOffset: PW_V2500_PARTS.hptStage2.boreOffset,
      ndipDocument: 'NDIP-1227',
      revision: 'D',
    };
  }
  return null;
}

// Export types for external use
export type { OEMVendor, OEMRuleSet };
