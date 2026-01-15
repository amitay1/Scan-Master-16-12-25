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
 *   const coverage = rules.coverageRequirements.minCoverage; // 95%
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
 * Placeholder - to be populated with actual P&W specs
 */
const PW_RULES: OEMRuleSet = {
  vendorId: 'PW',
  vendorName: 'Pratt & Whitney',
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  specReference: 'P&W 127 / PWA-36604',

  coverageRequirements: {
    minCoverage: 100,
    overlapRequirement: 25, // PW typically requires higher overlap
    criticalZoneMultiplier: 1.5, // 150% on critical zones
    edgeExclusion: 5, // mm
  },

  frequencyConstraints: {
    min: 2.25,
    max: 15,
    preferred: [5, 10], // PW typically prefers higher frequencies for rotor discs
  },

  approvedTransducers: [], // To be populated with PW-approved list

  approvedBlocks: [], // To be populated with PW-approved blocks

  calibrationRules: {
    interval: 8,
    temperatureCheckRequired: true, // PW requires temperature verification
    dacCurveRequired: true, // DAC required for most PW inspections
    tcgRequired: false, // TCG optional
    transferCorrectionMax: 4, // dB - stricter than generic
    periodicVerificationHours: 2, // More frequent checks
  },

  documentationRules: {
    templateId: 'pw-rotor',
    requiredSections: [
      'part_information',
      'equipment',
      'calibration',
      'dac_curve',
      'scan_parameters',
      'acceptance_criteria',
      'scan_coverage_map',
      'documentation',
      'approval_signatures',
    ],
    approvalLevels: 2, // Level II + Level III
    language: 'english',
    revisionTracking: true,
  },

  // Part-specific overrides
  partSpecificRules: {
    bore: {
      coverageRequirements: {
        minCoverage: 100,
        overlapRequirement: 30, // Bore requires even more overlap
        criticalZoneMultiplier: 2.0, // 200% on bore
        edgeExclusion: 3,
      },
    },
    web: {
      frequencyConstraints: {
        min: 5,
        max: 15,
        preferred: [10, 15], // Higher frequency for thin webs
      },
    },
  },

  warnings: [
    'P&W spec requirements pending - using placeholder values',
    'Contact Level III for approval of non-standard equipment',
  ],
  notes: [
    'Rotor disc inspection per P&W 127',
    'All coverage must be documented with C-scan images',
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

// Export types for external use
export type { OEMVendor, OEMRuleSet };
