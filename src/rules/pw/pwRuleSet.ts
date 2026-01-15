/**
 * Pratt & Whitney Master Rule Set
 *
 * Source: NDIP-1226 Rev F, NDIP-1227 Rev D
 * V2500 HPT Disk Off-Wing Immersion UT Inspection
 */

import type { OEMRuleSet } from '../../types/oemTypes';

export const PW_RULE_SET: OEMRuleSet = {
  vendorId: 'PW',
  vendorName: 'Pratt & Whitney',
  version: '2.0',
  lastUpdated: '2021-11-10',
  sourceDocuments: [
    {
      id: 'NDIP-1226',
      revision: 'F',
      title: 'V2500 1st Stage HPT Disk Off-Wing Immersion UT',
      date: '2021-09-02',
    },
    {
      id: 'NDIP-1227',
      revision: 'D',
      title: 'V2500 2nd Stage HPT Disk Off-Wing Immersion UT',
      date: '2021-11-10',
    },
  ],

  // Coverage requirements from NDIP Section 7.1.3
  coverageRequirements: {
    minCoverage: 100, // Full bore coverage required
    radialCoverage: 2.6, // inches - minimum radial volumetric coverage
    overlapRequirement: 0, // Overlap handled by scan/index increments
    criticalZoneMultiplier: 1.0,
    scanAngles: [45, -45], // degrees - circumferential shear wave
  },

  // Scan parameters from NDIP Section 7.2-7.5
  scanParameters: {
    maxScanIncrement: 0.020, // inches (Section 7.2)
    maxIndexIncrement: 0.020, // inches per revolution (Section 7.3)
    waterPath: 8.0, // inches (Section 5.1.1.2, 7.5)
    incidentAngle: 18.6, // degrees - approximate for 45° refracted shear
    refractedAngle: 45, // degrees - shear wave in part
    waveType: 'shear',
  },

  // Noise requirements from NDIP Section 7.9.5
  noiseRequirements: {
    maxAverageNoise: 7.5, // %FSH (Section 7.9.5.3)
    maxBandNoise: 8.5, // %FSH (Section 7.9.5.4)
    minNoiseForTOF: 5.0, // %FSH - below this, use 7.5%FSH for TOF rejection
    actionOnExceed: 're-calibrate, re-normalize, re-scan',
  },

  // Calibration requirements from NDIP Section 5.0
  calibrationRequirements: {
    targetAmplitude: 80, // %FSH (Section 5.1)
    postCalibrationTolerance: 1.0, // dB (Section 5.1.5.1)
    dacRequired: true,
    curvatureCorrectionRequired: true,
    calibrationBlockRecertification: 'yearly', // at PW NDE (Section 5.2)
    referenceHoles: ['L', 'M', 'N', 'P', 'Q', 'R', 'S'], // Holes L-S, omitting J&K
    fbhSize: 1, // #1 FBH
  },

  // Inspector qualifications from NDIP Section 3.0
  inspectorQualifications: {
    scanPlanDevelopment: 'Level III',
    inspectionExecution: 'Level II',
    certificationRequired: 'PW task-specific certificate',
    podQualificationRequired: true,
    recertificationPeriod: 6, // months without inspection
    trainingProvider: 'PW MPE-NDE',
  },

  // Approved equipment from NDIP Section 2.0
  approvedEquipment: {
    scannerSystems: [
      {
        manufacturer: 'Inspection Research & Technologies Ltd',
        model: 'LS-200',
        description: 'Immersion Tank and Ultrasonic Scanner',
      },
      {
        manufacturer: 'Matec',
        model: 'IMT3007-SS-TT-L-ARN',
        description: 'Immersion Ultrasonic Scanner',
      },
    ],
    alternateApproval: 'PW MPE-NDE approval required',
  },

  // Documentation/Reporting from NDIP Section 9.0
  reportingRequirements: {
    requiredFields: [
      'inspectorName',
      'inspectionDate',
      'inspectionSystemSN',
      'transducerSN',
      'calibrationStandardSN',
      'aircraftSN',
      'enginePosition',
      'engineModel',
      'engineSN',
      'engineTotalTime',
      'engineTotalCycles',
      'diskPartNumber',
      'diskSerialNumber',
      'diskHeatCode',
      'timeSinceNew',
      'cyclesSinceNew',
    ],
    dataTransferMethod: 'MFT (Managed File Transfer)',
    recipient: 'PW MPE-NDE',
    electronicDataRequired: ['amplitude C-Scan', 'TOF C-Scan'],
  },

  // Special handling requirements
  specialRequirements: {
    metalToMetalContact: 'MUST BE AVOIDED with HPT disks',
    collimatorApproval: 'PW MPE-NDE approval required',
    dampingDeviceApproval: 'PW MPE-NDE approval required',
  },
};

/**
 * V2500 Engine specific part configurations
 */
export const PW_V2500_PARTS = {
  hptStage1: {
    partNumber: '2A5001',
    ndip: 'NDIP-1226',
    description: 'V2500 1st Stage High Pressure Turbine Disk',
    material: 'Powdered Nickel Metal',
    boreRadius: 2.910, // inches - nominal
    boreOffset: 0.943, // inches - for ±45° refracted angle
    inspectionZones: ['A', 'B', 'C', 'D', 'E'], // From Figure 2
  },
  hptStage2: {
    partNumber: '2A4802',
    ndip: 'NDIP-1227',
    description: 'V2500 2nd Stage High Pressure Turbine Disk',
    material: 'Powdered Nickel Metal',
    boreRadius: 2.773, // inches - nominal
    boreOffset: 0.898, // inches - for ±45° refracted angle
    inspectionZones: ['K', 'L', 'M', 'N', 'O', 'P'], // From Figure 2
  },
};

export type PWPartConfig = typeof PW_V2500_PARTS.hptStage1;
