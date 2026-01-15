/**
 * AMS-STD-2154E Procedure Template
 * Aerospace ultrasonic inspection procedure template
 */

import type { ProcedureTemplate, ProcedureSection } from "@/types/procedure";

export const AMS_STD_2154E_SECTIONS: ProcedureSection[] = [
  {
    id: "1.0",
    title: "PURPOSE AND SCOPE",
    content: `This procedure establishes the requirements for ultrasonic inspection of wrought metals in accordance with AMS-STD-2154E. The procedure defines the equipment, calibration, scanning techniques, and acceptance criteria to be used for detecting internal discontinuities in metallic materials.`,
    subsections: [
      {
        id: "1.1",
        title: "Scope",
        content: `This procedure applies to the ultrasonic inspection of {MATERIAL_TYPES} in the form of {PART_TYPES}. The thickness range covered is {THICKNESS_MIN} to {THICKNESS_MAX} {THICKNESS_UNIT}.`,
      },
      {
        id: "1.2",
        title: "Applicable Documents",
        content: `The following documents form a part of this procedure:
- AMS-STD-2154E: Inspection, Ultrasonic, Wrought Metals, Process For
- ASTM E127: Standard Practice for Fabricating and Checking Aluminum Alloy Ultrasonic Standard Reference Blocks
- ASTM E317: Standard Practice for Evaluating Performance Characteristics of Ultrasonic Pulse-Echo Testing Instruments
{ADDITIONAL_STANDARDS}`,
      },
      {
        id: "1.3",
        title: "Limitations",
        content: `{EXCLUSIONS}`,
      },
    ],
  },
  {
    id: "2.0",
    title: "EQUIPMENT REQUIREMENTS",
    content: "",
    subsections: [
      {
        id: "2.1",
        title: "Ultrasonic Instrument",
        content: `The ultrasonic instrument shall be a pulse-echo type capable of operating in the frequency range of {FREQ_MIN} MHz to {FREQ_MAX} MHz. The instrument shall meet the following requirements:
- A-scan display with calibrated time base
- Gain control with minimum range of 100 dB
- Square wave or spike pulser capability
- Damping control adjustable for optimum resolution
- Gate functions for amplitude and distance monitoring`,
      },
      {
        id: "2.2",
        title: "Search Units (Transducers)",
        content: `Search units shall be selected based on the material thickness and geometry being inspected:
- Frequencies: {TRANSDUCER_FREQUENCIES}
- Element sizes: {TRANSDUCER_DIAMETERS}
- Types: {TRANSDUCER_TYPES}

All transducers shall be inspected for defects prior to use and verified for proper operation.`,
      },
      {
        id: "2.3",
        title: "Cables",
        content: `Coaxial cables shall be used with proper impedance matching. Maximum cable length shall not exceed that used during calibration. Cables shall be inspected for damage prior to use.`,
      },
      {
        id: "2.4",
        title: "Couplant",
        content: `Couplant shall be {COUPLANT_TYPES}. The couplant shall not be detrimental to the material being inspected and shall provide adequate acoustic coupling.`,
      },
    ],
  },
  {
    id: "3.0",
    title: "REFERENCE STANDARDS",
    content: "",
    subsections: [
      {
        id: "3.1",
        title: "Calibration Blocks",
        content: `Reference blocks shall be fabricated from material acoustically similar to the material being inspected. Blocks shall conform to {BLOCK_TYPES} and contain flat-bottom holes of the following sizes:
{FBH_SIZES}`,
      },
      {
        id: "3.2",
        title: "Block Material",
        content: `Calibration block material shall be {BLOCK_MATERIAL} and shall be ultrasonically inspected to verify freedom from rejectable indications.`,
      },
      {
        id: "3.3",
        title: "Block Certification",
        content: `All calibration blocks shall be serialized and accompanied by certification documentation including:
- Material certification
- FBH dimensions and tolerances
- Ultrasonic inspection results`,
      },
    ],
  },
  {
    id: "4.0",
    title: "CALIBRATION",
    content: "",
    subsections: [
      {
        id: "4.1",
        title: "Linearity Verification",
        content: `Prior to inspection, verify instrument linearity per ASTM E317:
- Horizontal linearity: Within ±2% of full scale
- Vertical linearity: Within ±5% of full scale

Linearity shall be verified at the beginning of each shift or after any instrument adjustment.`,
      },
      {
        id: "4.2",
        title: "Sensitivity Calibration",
        content: `Sensitivity shall be established using the reference block at the following levels:
- Primary Reference Level: {PRIMARY_SENSITIVITY}
- Scanning Sensitivity: {SCANNING_SENSITIVITY}
- Evaluation Sensitivity: Primary Reference Level

Distance Amplitude Correction (DAC) shall {DAC_REQUIRED} be established using reflectors at {DAC_POINTS}.`,
      },
      {
        id: "4.3",
        title: "Calibration Frequency",
        content: `Calibration shall be verified:
- At the beginning of each inspection session
- After any 4-hour period of continuous scanning
- After changing transducers, cables, or instrument settings
- Whenever inspection results are questionable`,
      },
    ],
  },
  {
    id: "5.0",
    title: "INSPECTION PROCEDURE",
    content: "",
    subsections: [
      {
        id: "5.1",
        title: "Surface Preparation",
        content: `The inspection surface shall be:
{SURFACE_CONDITIONS}

Surface roughness shall not exceed 250 microinches Ra for contact inspection.`,
      },
      {
        id: "5.2",
        title: "Scanning Technique",
        content: `Inspection Method: {INSPECTION_METHOD}
Scan Type: {SCAN_TYPE}

Scanning Parameters:
- Coverage: Minimum {COVERAGE_REQUIRED}% with {OVERLAP}% overlap
- Maximum scan speed: {SCAN_SPEED_MAX} {SCAN_SPEED_UNIT}
- Index increment: {INDEX_INCREMENT} {INDEX_UNIT}
{WATER_PATH}

The transducer shall maintain perpendicular alignment (±2°) to the inspection surface during scanning.`,
      },
      {
        id: "5.3",
        title: "Scanning Pattern",
        content: `Scanning shall be performed in a systematic pattern to ensure complete coverage:
1. Establish datum reference
2. Scan in overlapping parallel passes
3. Rotate scan direction 90° and repeat for critical areas
4. Mark and record all indication locations`,
      },
    ],
  },
  {
    id: "6.0",
    title: "ACCEPTANCE CRITERIA",
    content: "",
    subsections: [
      {
        id: "6.1",
        title: "Acceptance Class",
        content: `Acceptance shall be in accordance with AMS-STD-2154E, Class {ACCEPTANCE_CLASS}.`,
      },
      {
        id: "6.2",
        title: "Maximum Indication Size",
        content: `Single Indication: {MAX_SINGLE_SIZE} producing amplitude {MAX_SINGLE_AMPLITUDE}
Cluster: {MAX_CLUSTER_COUNT} indications within {MAX_CLUSTER_AREA}
Linear: Maximum length {MAX_LINEAR_LENGTH}`,
      },
      {
        id: "6.3",
        title: "Rejection Criteria",
        content: `Parts shall be rejected when:
- Any single indication exceeds the maximum allowable size
- Cluster indications exceed the specified limits
- Linear indications exceed the maximum length
- Loss of back reflection exceeds 75% without corresponding indication
- Any crack-like indication regardless of size`,
      },
      {
        id: "6.4",
        title: "Special Requirements",
        content: `{SPECIAL_REQUIREMENTS}`,
      },
    ],
  },
  {
    id: "7.0",
    title: "DOCUMENTATION",
    content: "",
    subsections: [
      {
        id: "7.1",
        title: "Inspection Records",
        content: `The following records shall be maintained:
{RECORDS_TO_MAINTAIN}`,
      },
      {
        id: "7.2",
        title: "Report Contents",
        content: `Inspection reports shall contain:
- Part identification (number, serial, lot)
- Inspection date and operator identification
- Equipment identification and calibration status
- Inspection parameters (frequency, sensitivity, technique)
- Results and disposition
- Approval signatures`,
      },
      {
        id: "7.3",
        title: "Record Retention",
        content: `Inspection records shall be retained for {RETENTION_PERIOD}.`,
      },
    ],
  },
  {
    id: "8.0",
    title: "PERSONNEL QUALIFICATIONS",
    content: "",
    subsections: [
      {
        id: "8.1",
        title: "Inspection Personnel",
        content: `Personnel performing ultrasonic inspection shall be certified to {INSPECTION_LEVEL} in accordance with NAS 410, SNT-TC-1A, or equivalent.`,
      },
      {
        id: "8.2",
        title: "Evaluation Personnel",
        content: `Personnel evaluating and interpreting inspection results shall be certified to {EVALUATION_LEVEL}.`,
      },
      {
        id: "8.3",
        title: "Approval Authority",
        content: `Final acceptance/rejection authority shall be held by personnel certified to {APPROVAL_LEVEL}.`,
      },
    ],
  },
];

export const AMS_STD_2154E_TEMPLATE: ProcedureTemplate = {
  id: "ams-std-2154e",
  name: "AMS-STD-2154E Procedure",
  description: "Standard procedure template for aerospace ultrasonic inspection of wrought metals",
  standard: "AMS-STD-2154E",
  defaultData: {
    primaryStandard: "AMS-STD-2154E",
    frequencyMin: 2.25,
    frequencyMax: 10,
    transducerTypes: ["contact", "immersion"],
    transducerFrequencies: [2.25, 5, 10],
    transducerDiameters: [6.35, 12.7, 19.05],
    couplantTypes: ["Water-based gel", "Glycerin"],
    blockTypes: ["ASTM E127 FBH blocks"],
    fbhSizes: ["#3 FBH (3/64\")", "#5 FBH (5/64\")", "#8 FBH (1/8\")"],
    primarySensitivity: "#3 FBH at 80% FSH",
    scanningSensitivity: "+6 dB above primary",
    dacRequired: true,
    dacPoints: [25, 50, 75, 100],
    method: "immersion",
    scanType: "straight_beam",
    coverageRequired: 100,
    overlap: 15,
    indexIncrement: 0.050,
    scanSpeedMax: 150,
    inspectionLevel: ["Level_II"],
    evaluationLevel: ["Level_II", "Level_III"],
    approvalLevel: ["Level_III"],
    retentionPeriod: "Life of part plus 5 years",
    recordsToMaintain: [
      "Calibration records",
      "Inspection reports",
      "Equipment maintenance logs",
      "Personnel qualification records",
    ],
  },
  sections: AMS_STD_2154E_SECTIONS,
};

export default AMS_STD_2154E_TEMPLATE;
