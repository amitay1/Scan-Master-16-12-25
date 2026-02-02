/**
 * Compliance Checker
 *
 * Validates Technique Sheet data against UT standards and best practices.
 * Prevents export if critical issues are found.
 */

import type {
  ComplianceRule,
  ComplianceResult,
  ComplianceCheckData,
  ComplianceReport,
  ComplianceSeverity,
  ComplianceCategory,
} from "@/types/compliance";

import {
  FREQUENCY_RANGES,
  LINEARITY_REQUIREMENTS,
  CALIBRATION_MAX_AGE_DAYS,
  LINEARITY_CHECK_MAX_AGE_DAYS,
  MINIMUM_COVERAGE_PERCENT,
} from "@/types/compliance";

import type { StandardType } from "@/types/techniqueSheet";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createResult(
  rule: ComplianceRule,
  passed: boolean,
  message: string,
  options?: Partial<ComplianceResult>
): ComplianceResult {
  return {
    passed,
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    severity: rule.severity,
    message,
    ...options,
  };
}

function parseFrequency(freq: string): number {
  // Handle formats like "5 MHz", "5MHz", "5", "2.25 MHz"
  const num = parseFloat(freq.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return Infinity;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return Infinity;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return isNaN(value) || value === 0;
  return false;
}

// ============================================================================
// COMPLIANCE RULES
// ============================================================================

const complianceRules: ComplianceRule[] = [
  // -------------------------------------------------------------------------
  // SETUP RULES
  // -------------------------------------------------------------------------
  {
    id: "setup-part-number",
    name: "Part Number Required",
    category: "setup",
    severity: "critical",
    description: "Part number must be specified for traceability",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "setup-part-number")!;
      const passed = !isEmpty(data.inspectionSetup.partNumber);
      return createResult(rule, passed, passed
        ? "Part number is specified"
        : "Part number is required for traceability", {
        field: "inspectionSetup.partNumber",
        suggestion: "Enter the part number from the drawing or work order",
      });
    },
  },
  {
    id: "setup-material",
    name: "Material Selection Required",
    category: "setup",
    severity: "critical",
    description: "Material must be selected for acoustic velocity calculations",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "setup-material")!;
      const passed = !isEmpty(data.inspectionSetup.material);
      return createResult(rule, passed, passed
        ? "Material is selected"
        : "Material selection is required for proper acoustic velocity", {
        field: "inspectionSetup.material",
        suggestion: "Select the material type from the dropdown",
      });
    },
  },
  {
    id: "setup-geometry",
    name: "Part Geometry Required",
    category: "setup",
    severity: "critical",
    description: "Part geometry must be defined for scan planning",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "setup-geometry")!;
      const passed = !isEmpty(data.inspectionSetup.partType);
      return createResult(rule, passed, passed
        ? "Part geometry is defined"
        : "Part geometry must be selected for proper scan planning", {
        field: "inspectionSetup.partType",
        suggestion: "Select the part geometry type",
      });
    },
  },
  {
    id: "setup-thickness",
    name: "Part Thickness Required",
    category: "setup",
    severity: "critical",
    description: "Part thickness is required for beam path calculations",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "setup-thickness")!;
      const thickness = data.inspectionSetup.partThickness;
      const passed = thickness > 0;
      return createResult(rule, passed, passed
        ? `Part thickness: ${thickness}mm`
        : "Part thickness must be greater than 0", {
        field: "inspectionSetup.partThickness",
        currentValue: thickness?.toString() || "not set",
        suggestion: "Enter the nominal part thickness in mm",
      });
    },
  },
  {
    id: "setup-hollow-wall",
    name: "Wall Thickness for Hollow Parts",
    category: "setup",
    severity: "warning",
    description: "Hollow parts should have wall thickness specified",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "setup-hollow-wall")!;
      if (!data.inspectionSetup.isHollow) {
        return createResult(rule, true, "Part is not hollow - N/A");
      }
      const passed = (data.inspectionSetup.wallThickness || 0) > 0;
      return createResult(rule, passed, passed
        ? `Wall thickness: ${data.inspectionSetup.wallThickness}mm`
        : "Wall thickness should be specified for hollow parts", {
        field: "inspectionSetup.wallThickness",
        suggestion: "Enter the wall thickness or calculate from OD - ID",
      });
    },
  },

  // -------------------------------------------------------------------------
  // EQUIPMENT RULES
  // -------------------------------------------------------------------------
  {
    id: "equipment-serial",
    name: "Equipment Serial Number",
    category: "equipment",
    severity: "warning",
    description: "Equipment serial number for traceability",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "equipment-serial")!;
      const passed = !isEmpty(data.equipment.serialNumber);
      return createResult(rule, passed, passed
        ? "Equipment serial number recorded"
        : "Equipment serial number should be recorded for traceability", {
        field: "equipment.serialNumber",
        suggestion: "Enter the flaw detector serial number",
      });
    },
  },
  {
    id: "equipment-frequency-range",
    name: "Frequency Within Standard Range",
    category: "equipment",
    severity: "critical",
    description: "Transducer frequency must be within standard-specified range",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "equipment-frequency-range")!;
      const freq = parseFrequency(data.equipment.frequency);
      const range = FREQUENCY_RANGES[data.standard];

      if (freq === 0) {
        return createResult(rule, false, "Frequency not specified", {
          field: "equipment.frequency",
          suggestion: "Select or enter transducer frequency",
        });
      }

      // Handle missing standard in lookup table
      if (!range) {
        return createResult(rule, true, `Frequency ${freq} MHz specified (no range defined for ${data.standard})`, {
          field: "equipment.frequency",
          currentValue: `${freq} MHz`,
        });
      }

      const passed = freq >= range.min && freq <= range.max;
      return createResult(rule, passed, passed
        ? `Frequency ${freq} MHz is within ${data.standard} range (${range.min}-${range.max} MHz)`
        : `Frequency ${freq} MHz is outside ${data.standard} range (${range.min}-${range.max} MHz)`, {
        field: "equipment.frequency",
        currentValue: `${freq} MHz`,
        expectedValue: `${range.min}-${range.max} MHz`,
        standardRef: `${data.standard} frequency requirements`,
        suggestion: `Select a frequency between ${range.min} and ${range.max} MHz for ${data.standard}`,
      });
    },
  },
  {
    id: "equipment-vertical-linearity",
    name: "Vertical Linearity",
    category: "equipment",
    severity: "warning",
    description: "Vertical linearity must be within specification",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "equipment-vertical-linearity")!;
      const req = LINEARITY_REQUIREMENTS[data.standard];
      const value = data.equipment.verticalLinearity;

      // Handle missing standard in lookup table
      if (!req) {
        return createResult(rule, true, `Vertical linearity ${value}% (no requirement defined for ${data.standard})`, {
          field: "equipment.verticalLinearity",
          currentValue: `${value}%`,
        });
      }

      const passed = value <= req.vertical;
      return createResult(rule, passed, passed
        ? `Vertical linearity ${value}% is within spec (≤${req.vertical}%)`
        : `Vertical linearity ${value}% exceeds maximum ${req.vertical}%`, {
        field: "equipment.verticalLinearity",
        currentValue: `${value}%`,
        expectedValue: `≤${req.vertical}%`,
        suggestion: "Verify equipment calibration or use a different unit",
      });
    },
  },
  {
    id: "equipment-horizontal-linearity",
    name: "Horizontal Linearity",
    category: "equipment",
    severity: "warning",
    description: "Horizontal linearity must be within specification",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "equipment-horizontal-linearity")!;
      const req = LINEARITY_REQUIREMENTS[data.standard];
      const value = data.equipment.horizontalLinearity;

      // Handle missing standard in lookup table
      if (!req) {
        return createResult(rule, true, `Horizontal linearity ${value}% (no requirement defined for ${data.standard})`, {
          field: "equipment.horizontalLinearity",
          currentValue: `${value}%`,
        });
      }

      const passed = value <= req.horizontal;
      return createResult(rule, passed, passed
        ? `Horizontal linearity ${value}% is within spec (≤${req.horizontal}%)`
        : `Horizontal linearity ${value}% exceeds maximum ${req.horizontal}%`, {
        field: "equipment.horizontalLinearity",
        currentValue: `${value}%`,
        expectedValue: `≤${req.horizontal}%`,
        suggestion: "Verify equipment calibration or use a different unit",
      });
    },
  },
  {
    id: "equipment-couplant",
    name: "Couplant Specified",
    category: "equipment",
    severity: "info",
    description: "Couplant should be specified for repeatability",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "equipment-couplant")!;
      const passed = !isEmpty(data.equipment.couplant);
      return createResult(rule, passed, passed
        ? `Couplant: ${data.equipment.couplant}`
        : "Couplant not specified", {
        field: "equipment.couplant",
        suggestion: "Specify couplant type (e.g., water, glycerin, gel)",
      });
    },
  },

  // -------------------------------------------------------------------------
  // CALIBRATION RULES
  // -------------------------------------------------------------------------
  {
    id: "calibration-block-type",
    name: "Calibration Block Type",
    category: "calibration",
    severity: "critical",
    description: "Calibration block type must be selected",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "calibration-block-type")!;
      const passed = !isEmpty(data.calibration.standardType);
      return createResult(rule, passed, passed
        ? `Calibration block type: ${data.calibration.standardType}`
        : "Calibration block type must be selected", {
        field: "calibration.standardType",
        suggestion: "Select the calibration block type",
      });
    },
  },
  {
    id: "calibration-material-match",
    name: "Calibration Block Material Match",
    category: "calibration",
    severity: "warning",
    description: "Calibration block material should match part material",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "calibration-material-match")!;
      const partMaterial = data.inspectionSetup.material?.toLowerCase() || "";
      const blockMaterial = data.calibration.referenceMaterial?.toLowerCase() || "";

      if (isEmpty(blockMaterial)) {
        return createResult(rule, false, "Calibration block material not specified", {
          field: "calibration.referenceMaterial",
          suggestion: "Specify the calibration block material",
        });
      }

      // Check for acoustic equivalence
      const matched = blockMaterial.includes(partMaterial) ||
        partMaterial.includes(blockMaterial) ||
        (partMaterial.includes("aluminum") && blockMaterial.includes("aluminum")) ||
        (partMaterial.includes("steel") && blockMaterial.includes("steel")) ||
        (partMaterial.includes("titanium") && blockMaterial.includes("titanium"));

      return createResult(rule, matched, matched
        ? "Calibration block material is compatible with part material"
        : `Block material (${blockMaterial}) may not match part material (${partMaterial})`, {
        field: "calibration.referenceMaterial",
        currentValue: blockMaterial,
        expectedValue: partMaterial,
        suggestion: "Use a calibration block of the same or acoustically equivalent material",
        standardRef: "Block material should provide equivalent acoustic response",
      });
    },
  },
  {
    id: "calibration-fbh-sizes",
    name: "FBH Sizes Specified",
    category: "calibration",
    severity: "critical",
    description: "FBH sizes must be specified for calibration",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "calibration-fbh-sizes")!;
      const passed = !isEmpty(data.calibration.fbhSizes);
      return createResult(rule, passed, passed
        ? `FBH sizes: ${data.calibration.fbhSizes}`
        : "FBH sizes must be specified for calibration reference", {
        field: "calibration.fbhSizes",
        suggestion: "Select FBH sizes appropriate for the acceptance class",
      });
    },
  },
  {
    id: "calibration-date",
    name: "Calibration Block Certification Date",
    category: "calibration",
    severity: "warning",
    description: "Calibration block certificate should be current",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "calibration-date")!;
      const days = daysSince(data.calibration.lastCalibrationDate);

      if (days === Infinity) {
        return createResult(rule, false, "Calibration date not specified", {
          field: "calibration.lastCalibrationDate",
          suggestion: "Enter the calibration block certification date",
        });
      }

      const passed = days <= CALIBRATION_MAX_AGE_DAYS;
      return createResult(rule, passed, passed
        ? `Block calibration is current (${days} days old)`
        : `Block calibration may be expired (${days} days old, max ${CALIBRATION_MAX_AGE_DAYS})`, {
        field: "calibration.lastCalibrationDate",
        currentValue: `${days} days`,
        expectedValue: `≤${CALIBRATION_MAX_AGE_DAYS} days`,
        suggestion: "Verify calibration block certificate is current",
      });
    },
  },
  {
    id: "calibration-serial",
    name: "Calibration Block Serial Number",
    category: "calibration",
    severity: "info",
    description: "Block serial number should be recorded for traceability",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "calibration-serial")!;
      const passed = !isEmpty(data.calibration.blockSerialNumber);
      return createResult(rule, passed, passed
        ? `Block S/N: ${data.calibration.blockSerialNumber}`
        : "Calibration block serial number not recorded", {
        field: "calibration.blockSerialNumber",
        suggestion: "Enter the calibration block serial number",
      });
    },
  },

  // -------------------------------------------------------------------------
  // SCAN PARAMETERS RULES
  // -------------------------------------------------------------------------
  {
    id: "scan-method",
    name: "Scan Method Specified",
    category: "scan",
    severity: "critical",
    description: "Scan method must be selected",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "scan-method")!;
      const passed = !isEmpty(data.scanParameters.scanMethod);
      return createResult(rule, passed, passed
        ? `Scan method: ${data.scanParameters.scanMethod}`
        : "Scan method must be specified", {
        field: "scanParameters.scanMethod",
        suggestion: "Select scan method (Immersion, Contact, etc.)",
      });
    },
  },
  {
    id: "scan-coverage",
    name: "Minimum Scan Coverage",
    category: "scan",
    severity: "critical",
    description: "Scan coverage must meet minimum requirements",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "scan-coverage")!;
      const coverage = data.scanParameters.coverage || 0;
      const passed = coverage >= MINIMUM_COVERAGE_PERCENT;
      return createResult(rule, passed, passed
        ? `Scan coverage: ${coverage}% (meets ${MINIMUM_COVERAGE_PERCENT}% minimum)`
        : `Scan coverage ${coverage}% is below required ${MINIMUM_COVERAGE_PERCENT}%`, {
        field: "scanParameters.coverage",
        currentValue: `${coverage}%`,
        expectedValue: `≥${MINIMUM_COVERAGE_PERCENT}%`,
        suggestion: "Adjust scan index to achieve required coverage",
      });
    },
  },
  {
    id: "scan-water-path-immersion",
    name: "Water Path for Immersion",
    category: "scan",
    severity: "warning",
    description: "Water path must be specified for immersion scanning",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "scan-water-path-immersion")!;
      const method = data.scanParameters.scanMethod?.toLowerCase() || "";
      const isImmersion = method.includes("immersion");

      if (!isImmersion) {
        return createResult(rule, true, "Not immersion scan - water path N/A");
      }

      const waterPath = data.scanParameters.waterPath || 0;
      const passed = waterPath > 0;
      return createResult(rule, passed, passed
        ? `Water path: ${waterPath}mm`
        : "Water path must be specified for immersion scanning", {
        field: "scanParameters.waterPath",
        suggestion: "Enter the water path distance in mm",
      });
    },
  },
  {
    id: "scan-prf",
    name: "Pulse Repetition Rate",
    category: "scan",
    severity: "info",
    description: "PRF should be appropriate for scan speed and thickness",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "scan-prf")!;
      const prf = data.scanParameters.pulseRepetitionRate || 0;

      if (prf === 0) {
        return createResult(rule, false, "PRF not specified", {
          field: "scanParameters.pulseRepetitionRate",
          suggestion: "Enter pulse repetition frequency",
        });
      }

      // Basic PRF check - should be high enough for coverage
      const scanSpeed = data.scanParameters.scanSpeed || 0;
      const scanIndex = data.scanParameters.scanIndex || 1;

      if (scanSpeed > 0 && scanIndex > 0) {
        // Calculate required PRF for adequate coverage
        // PRF = scanSpeed / scanIndex (both in mm/s and mm respectively)
        // scanIndex is stored as % of beam width, convert to approximate mm using typical 5MHz beam ~6mm
        const indexMm = (scanIndex / 100) * 6; // approximate beam width 6mm
        const requiredPrf = scanSpeed / Math.max(indexMm, 0.1); // Hz
        const passed = prf >= requiredPrf;

        return createResult(rule, passed, passed
          ? `PRF ${prf} Hz is adequate for scan parameters`
          : `PRF ${prf} Hz may be too low for ${scanSpeed} mm/s at ${scanIndex}mm index`, {
          field: "scanParameters.pulseRepetitionRate",
          currentValue: `${prf} Hz`,
          suggestion: `Consider PRF of at least ${Math.ceil(requiredPrf)} Hz`,
        });
      }

      return createResult(rule, true, `PRF: ${prf} Hz`);
    },
  },
  {
    id: "scan-gate-settings",
    name: "Gate Settings",
    category: "scan",
    severity: "warning",
    description: "Alarm gate settings should be configured",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "scan-gate-settings")!;
      const passed = !isEmpty(data.scanParameters.alarmGateSettings);
      return createResult(rule, passed, passed
        ? "Gate settings configured"
        : "Alarm gate settings not specified", {
        field: "scanParameters.alarmGateSettings",
        suggestion: "Configure gate start, width, and threshold",
      });
    },
  },

  // -------------------------------------------------------------------------
  // ACCEPTANCE CRITERIA RULES
  // -------------------------------------------------------------------------
  {
    id: "acceptance-class",
    name: "Acceptance Class Selected",
    category: "acceptance",
    severity: "critical",
    description: "Acceptance class must be selected",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "acceptance-class")!;
      const passed = !isEmpty(data.acceptanceCriteria.acceptanceClass);
      return createResult(rule, passed, passed
        ? `Acceptance class: ${data.acceptanceCriteria.acceptanceClass}`
        : "Acceptance class must be selected", {
        field: "acceptanceCriteria.acceptanceClass",
        suggestion: "Select the appropriate acceptance class for this inspection",
      });
    },
  },
  {
    id: "acceptance-discontinuity",
    name: "Discontinuity Criteria Defined",
    category: "acceptance",
    severity: "critical",
    description: "Single discontinuity criteria must be defined",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "acceptance-discontinuity")!;
      const passed = !isEmpty(data.acceptanceCriteria.singleDiscontinuity);
      return createResult(rule, passed, passed
        ? "Discontinuity criteria defined"
        : "Single discontinuity acceptance criteria not defined", {
        field: "acceptanceCriteria.singleDiscontinuity",
        suggestion: "Auto-fill from acceptance class or enter manually",
      });
    },
  },

  // -------------------------------------------------------------------------
  // DOCUMENTATION RULES
  // -------------------------------------------------------------------------
  {
    id: "doc-inspector-name",
    name: "Inspector Name",
    category: "documentation",
    severity: "critical",
    description: "Inspector name is required for certification",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "doc-inspector-name")!;
      const passed = !isEmpty(data.documentation.inspectorName);
      return createResult(rule, passed, passed
        ? `Inspector: ${data.documentation.inspectorName}`
        : "Inspector name is required", {
        field: "documentation.inspectorName",
        suggestion: "Enter inspector name or load from profile",
      });
    },
  },
  {
    id: "doc-inspector-cert",
    name: "Inspector Certification",
    category: "documentation",
    severity: "warning",
    description: "Inspector certification number should be recorded",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "doc-inspector-cert")!;
      const passed = !isEmpty(data.documentation.inspectorCertification);
      return createResult(rule, passed, passed
        ? `Certification: ${data.documentation.inspectorCertification}`
        : "Inspector certification number not recorded", {
        field: "documentation.inspectorCertification",
        suggestion: "Enter certification number (e.g., ASNT #12345)",
      });
    },
  },
  {
    id: "doc-inspector-level",
    name: "Inspector Level",
    category: "documentation",
    severity: "warning",
    description: "Inspector certification level should be specified",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "doc-inspector-level")!;
      const passed = !isEmpty(data.documentation.inspectorLevel);
      return createResult(rule, passed, passed
        ? `Level: ${data.documentation.inspectorLevel}`
        : "Inspector certification level not specified", {
        field: "documentation.inspectorLevel",
        suggestion: "Select certification level (I, II, or III)",
      });
    },
  },
  {
    id: "doc-procedure",
    name: "Procedure Number",
    category: "documentation",
    severity: "info",
    description: "Procedure number should be referenced",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "doc-procedure")!;
      const passed = !isEmpty(data.documentation.procedureNumber);
      return createResult(rule, passed, passed
        ? `Procedure: ${data.documentation.procedureNumber}`
        : "Procedure number not specified", {
        field: "documentation.procedureNumber",
        suggestion: "Enter the applicable procedure number",
      });
    },
  },
  {
    id: "doc-date",
    name: "Inspection Date",
    category: "documentation",
    severity: "info",
    description: "Inspection date should be recorded",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "doc-date")!;
      const passed = !isEmpty(data.documentation.inspectionDate);
      return createResult(rule, passed, passed
        ? `Date: ${data.documentation.inspectionDate}`
        : "Inspection date not specified", {
        field: "documentation.inspectionDate",
        suggestion: "Enter or confirm the inspection date",
      });
    },
  },

  // -------------------------------------------------------------------------
  // STANDARD-SPECIFIC RULES
  // -------------------------------------------------------------------------
  {
    id: "std-titanium-aaa",
    name: "Titanium AAA Class Special Requirements",
    category: "standard",
    severity: "warning",
    description: "Titanium in AAA class has additional requirements",
    standards: ["AMS-STD-2154E", "MIL-STD-2154"],
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "std-titanium-aaa")!;
      const material = data.inspectionSetup.material?.toLowerCase() || "";
      const acceptanceClass = data.acceptanceCriteria.acceptanceClass;

      const isTitanium = material.includes("titanium") || material.includes("ti-");
      const isAAA = acceptanceClass === "AAA";

      if (!isTitanium || !isAAA) {
        return createResult(rule, true, "N/A - Not titanium AAA class");
      }

      // Check if special notes mention titanium requirements
      return createResult(rule, true,
        "Titanium AAA: Multiple discontinuity separation = 1/4\" (vs 1\" for other materials)", {
        standardRef: "AMS-STD-2154E Table 6 Note",
        suggestion: "Ensure FBH reference is 2/64\" and separation criteria is 1/4\"",
      });
    },
  },
  {
    id: "std-austenitic-material",
    name: "Austenitic Material Standard Selection",
    category: "standard",
    severity: "warning",
    description: "Austenitic stainless steel should use BS EN 10228-4",
    check: (data) => {
      const rule = complianceRules.find((r) => r.id === "std-austenitic-material")!;
      const material = data.inspectionSetup.material?.toLowerCase() || "";
      const isAustenitic = material.includes("stainless") ||
        material.includes("austenitic") ||
        material.includes("304") ||
        material.includes("316");

      if (!isAustenitic) {
        return createResult(rule, true, "N/A - Not austenitic material");
      }

      const correctStandard = data.standard === "BS-EN-10228-4";
      return createResult(rule, correctStandard, correctStandard
        ? "Correct standard (BS EN 10228-4) selected for austenitic material"
        : "Consider using BS EN 10228-4 for austenitic stainless steel", {
        suggestion: "BS EN 10228-4 is specifically designed for austenitic materials with adjusted criteria for coarse grain",
      });
    },
  },
];

// ============================================================================
// MAIN COMPLIANCE CHECKER FUNCTION
// ============================================================================

export function runComplianceCheck(
  data: ComplianceCheckData
): ComplianceReport {
  const timestamp = new Date().toISOString();
  const results: ComplianceResult[] = [];

  // Run all applicable rules
  for (const rule of complianceRules) {
    // Skip rules that don't apply to this standard
    if (rule.standards && !rule.standards.includes(data.standard)) {
      continue;
    }

    try {
      const result = rule.check(data);
      results.push(result);
    } catch (error) {
      // Log error but continue with other checks
      console.error(`Compliance rule ${rule.id} failed:`, error);
      results.push({
        passed: false,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity: "warning",
        message: `Rule check failed: ${error}`,
      });
    }
  }

  // Categorize results
  const criticalIssues = results.filter((r) => !r.passed && r.severity === "critical");
  const warnings = results.filter((r) => !r.passed && r.severity === "warning");
  const info = results.filter((r) => !r.passed && r.severity === "info");

  const passedRules = results.filter((r) => r.passed).length;
  const failedRules = results.length - passedRules;

  // Calculate score (weighted by severity)
  const maxScore = results.reduce((sum, r) => {
    switch (r.severity) {
      case "critical": return sum + 10;
      case "warning": return sum + 5;
      case "info": return sum + 2;
      default: return sum;
    }
  }, 0);

  const lostScore = results.reduce((sum, r) => {
    if (r.passed) return sum;
    switch (r.severity) {
      case "critical": return sum + 10;
      case "warning": return sum + 5;
      case "info": return sum + 2;
      default: return sum;
    }
  }, 0);

  const overallScore = maxScore > 0
    ? Math.round(((maxScore - lostScore) / maxScore) * 100)
    : 100;

  // Determine status
  const status: ComplianceReport["status"] =
    criticalIssues.length > 0 ? "fail" :
      warnings.length > 0 ? "warning" : "pass";

  // Can export if no critical issues
  const canExport = criticalIssues.length === 0;

  // Generate summary
  let summary: string;
  if (canExport) {
    if (warnings.length > 0) {
      summary = `Ready to export with ${warnings.length} warning(s). Review recommended.`;
    } else {
      summary = "All checks passed. Ready to export.";
    }
  } else {
    summary = `Cannot export: ${criticalIssues.length} critical issue(s) must be resolved.`;
  }

  return {
    timestamp,
    standard: data.standard,
    overallScore,
    status,
    totalRules: results.length,
    passedRules,
    failedRules,
    warningRules: warnings.length,
    criticalIssues,
    warnings,
    info,
    canExport,
    summary,
  };
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export function getComplianceRules(): ComplianceRule[] {
  return complianceRules;
}

export function getComplianceRulesByCategory(
  category: ComplianceCategory
): ComplianceRule[] {
  return complianceRules.filter((r) => r.category === category);
}

export function getComplianceRulesBySeverity(
  severity: ComplianceSeverity
): ComplianceRule[] {
  return complianceRules.filter((r) => r.severity === severity);
}
