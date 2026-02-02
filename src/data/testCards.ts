// @ts-nocheck
/**
 * Test Cards - Complete sample data for testing export functionality
 *
 * 3 different cards with varying:
 * - Part types (cylinder, plate, ring)
 * - Materials (aluminum, titanium, steel)
 * - Acceptance classes (AA, A, B)
 * - Equipment configurations
 */

import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from '@/types/techniqueSheet';
import type { ScanDetailsData } from '@/types/scanDetails';

export interface TestCard {
  id: string;
  name: string;
  description: string;
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails: ScanDetailsData;
}

// ============================================================================
// CARD 1: Aerospace Aluminum Cylinder - Critical Flight Component
// ============================================================================
export const testCard1: TestCard = {
  id: 'test-card-1',
  name: 'Landing Gear Cylinder - Boeing 787',
  description: 'Critical flight component - Aluminum 7075-T6 cylinder with highest acceptance class',
  standard: 'AMS-STD-2154E',

  inspectionSetup: {
    partNumber: 'LG-787-CYL-001',
    partName: 'Main Landing Gear Actuator Cylinder',
    material: 'aluminum',
    customMaterialName: '',
    materialSpec: 'AMS 4045 / QQ-A-250/12',
    partType: 'tube',
    partThickness: 45.0,
    partLength: 320.0,
    partWidth: 0,
    diameter: 152.4,
    isHollow: true,
    innerDiameter: 101.6,
    wallThickness: 25.4,
    acousticVelocity: 6320,
    materialDensity: 2810,
    drawingNumber: 'DWG-787-LG-2024-001',
    heatTreatment: 'T6 Solution Heat Treated and Aged',
  },

  equipment: {
    manufacturer: 'Olympus NDT',
    model: 'OmniScan X3 64',
    serialNumber: 'OSX3-2024-0847',
    softwareVersion: '5.2.1',
    frequency: '5.0',
    transducerType: 'immersion',
    transducerDiameter: 0.5,
    probeModel: 'V309-SU',
    couplant: 'Deionized Water',
    verticalLinearity: 98.5,
    horizontalLinearity: 97.2,
    entrySurfaceResolution: 0.08,
    backSurfaceResolution: 0.04,
    numberOfElements: 64,
    elementPitch: 0.6,
    wedgeModel: 'SA32-N55S',
    wedgeType: 'Normal Incidence',
    delayLine: 'Water Path',
  },

  calibration: {
    standardType: 'astm_e127',
    referenceMaterial: 'Aluminum 7075-T6',
    fbhSizes: '#3, #5, #8',
    metalTravelDistance: 50.8,
    blockDimensions: '75 x 75 x 50 mm',
    blockSerialNumber: 'CAL-AL-7075-001',
    lastCalibrationDate: '2024-11-15',
    fbhHoles: [
      { id: '1', partNumber: '7075-3-0050', deltaType: 'Δ3', diameterInch: '#3 (3/64")', diameterMm: 1.19, distanceB: 12.7, metalTravelH: 25.4 },
      { id: '2', partNumber: '7075-5-0100', deltaType: 'Δ5', diameterInch: '#5 (5/64")', diameterMm: 1.98, distanceB: 25.4, metalTravelH: 38.1 },
      { id: '3', partNumber: '7075-8-0150', deltaType: 'Δ8', diameterInch: '#8 (1/8")', diameterMm: 3.18, distanceB: 38.1, metalTravelH: 50.8 },
    ],
  },

  scanParameters: {
    scanMethod: 'immersion',
    scanType: 'Automated C-Scan',
    scanSpeed: 150,
    scanIndex: 50,
    coverage: 100,
    scanPattern: 'Raster',
    waterPath: 25.4,
    pulseRepetitionRate: 2000,
    gainSettings: 'TCG Applied - 45 dB base',
    alarmGateSettings: 'Gate A: 2-48mm, 80% threshold',
    couplingMethod: 'immersion',
  },

  acceptanceCriteria: {
    acceptanceClass: 'AA',
    singleDiscontinuity: 'FBH #3 (3/64") max',
    multipleDiscontinuities: '3 in any 50mm x 50mm area',
    linearDiscontinuity: '6.4mm max length',
    backReflectionLoss: 25,
    noiseLevel: '< 20% of reference',
    specialRequirements: 'Zone 1 (0-6mm from surface): No indications > #2 FBH equivalent. 100% coverage mandatory.',
  },

  documentation: {
    inspectorName: 'Dr. Michael Chen',
    inspectorCertification: 'ASNT-TC-1A Level III',
    inspectorLevel: 'Level III',
    certifyingOrganization: 'ASNT',
    inspectionDate: '2024-12-17',
    procedureNumber: 'NDT-UT-787-001 Rev. C',
    drawingReference: 'DWG-787-LG-2024-001 Rev. B',
    revision: 'C',
    customerName: 'Boeing Commercial Airplanes',
    purchaseOrder: 'PO-BCA-2024-15847',
    serialNumber: 'SN-LG787-2024-0342',
    additionalNotes: 'Critical flight safety component. Requires Level III review and customer witness point.',
    approvalRequired: true,
  },

  scanDetails: {
    scanDetails: [
      { id: '1', scanningDirection: 'A', waveMode: 'longitudinal', isVisible: true, description: 'Axial scan - OD surface', angle: 0 },
      { id: '2', scanningDirection: 'B', waveMode: 'longitudinal', isVisible: true, description: 'Axial scan - ID surface', angle: 0 },
      { id: '3', scanningDirection: 'C', waveMode: 'longitudinal', isVisible: true, description: 'Radial scan - Forward', angle: 0 },
      { id: '4', scanningDirection: 'D', waveMode: 'longitudinal', isVisible: true, description: 'Radial scan - Reverse', angle: 180 },
      { id: '5', scanningDirection: 'E', waveMode: 'shear', isVisible: true, description: 'Circumferential - CW 45°', angle: 45 },
      { id: '6', scanningDirection: 'F', waveMode: 'shear', isVisible: true, description: 'Circumferential - CCW 45°', angle: -45 },
    ],
  },
};

// ============================================================================
// CARD 2: Titanium Ring Forging - Jet Engine Component
// ============================================================================
export const testCard2: TestCard = {
  id: 'test-card-2',
  name: 'HP Compressor Disk - GE90 Engine',
  description: 'Titanium Ti-6Al-4V ring forging for high-pressure compressor',
  standard: 'AMS-STD-2154E',

  inspectionSetup: {
    partNumber: 'GE90-HPT-DISK-003',
    partName: 'High Pressure Turbine Disk Stage 3',
    material: 'titanium',
    customMaterialName: '',
    materialSpec: 'AMS 4928 / AMS 4911',
    partType: 'ring',
    partThickness: 65.0,
    partLength: 0,
    partWidth: 0,
    diameter: 508.0,
    isHollow: true,
    innerDiameter: 254.0,
    wallThickness: 127.0,
    acousticVelocity: 6100,
    materialDensity: 4430,
    drawingNumber: 'DWG-GE90-HPT-D3-2024',
    heatTreatment: 'Beta Annealed + Aged',
  },

  equipment: {
    manufacturer: 'Zetec Inc.',
    model: 'TOPAZ64',
    serialNumber: 'TPZ64-2023-1205',
    softwareVersion: 'UltraVision 4.3',
    frequency: '10.0',
    transducerType: 'immersion',
    transducerDiameter: 0.375,
    probeModel: 'IP10-0.375-PTF',
    couplant: 'Deionized Water (filtered)',
    verticalLinearity: 99.1,
    horizontalLinearity: 98.5,
    entrySurfaceResolution: 0.05,
    backSurfaceResolution: 0.03,
    numberOfElements: 64,
    elementPitch: 0.5,
    wedgeModel: 'SW55-N60A',
    wedgeType: '60° Angle',
    delayLine: '12mm Water Path',
  },

  calibration: {
    standardType: 'astm_e127',
    referenceMaterial: 'Titanium Ti-6Al-4V',
    fbhSizes: '#2, #3, #5',
    metalTravelDistance: 63.5,
    blockDimensions: '100 x 100 x 65 mm',
    blockSerialNumber: 'CAL-TI64-GE-007',
    lastCalibrationDate: '2024-12-01',
    fbhHoles: [
      { id: '1', partNumber: 'TI64-2-0025', deltaType: 'Δ2', diameterInch: '#2 (1/32")', diameterMm: 0.79, distanceB: 6.35, metalTravelH: 15.9 },
      { id: '2', partNumber: 'TI64-3-0050', deltaType: 'Δ3', diameterInch: '#3 (3/64")', diameterMm: 1.19, distanceB: 12.7, metalTravelH: 31.8 },
      { id: '3', partNumber: 'TI64-5-0100', deltaType: 'Δ5', diameterInch: '#5 (5/64")', diameterMm: 1.98, distanceB: 25.4, metalTravelH: 63.5 },
    ],
  },

  scanParameters: {
    scanMethod: 'immersion',
    scanType: 'Automated Phased Array',
    scanSpeed: 100,
    scanIndex: 40,
    coverage: 100,
    scanPattern: 'Spiral + Raster',
    waterPath: 19.05,
    pulseRepetitionRate: 3000,
    gainSettings: 'TCG + 6dB scanning gain',
    alarmGateSettings: 'Gate A: 1-64mm, 50% threshold; Gate B: Back wall monitor',
    couplingMethod: 'phased_array',
    phasedArray: {
      refractedAngleStart: 0,
      refractedAngleEnd: 70,
      aperture: 16,
      focusLaws: 'Dynamic Depth Focus (DDF)',
    },
  },

  acceptanceCriteria: {
    acceptanceClass: 'A',
    singleDiscontinuity: 'FBH #2 (1/32") max in Zone 1; #3 in Zone 2',
    multipleDiscontinuities: '2 in any 25mm x 25mm area',
    linearDiscontinuity: '3.2mm max length',
    backReflectionLoss: 20,
    noiseLevel: '< 15% of #2 FBH',
    specialRequirements: 'TITANIUM ALERT: Enhanced sensitivity for alpha case detection. Bore region requires 100% overlap. No rejectable indications within 25mm of bolt holes.',
  },

  documentation: {
    inspectorName: 'Sarah Williams',
    inspectorCertification: 'NAS-410 Level III',
    inspectorLevel: 'Level III',
    certifyingOrganization: 'PRI Nadcap',
    inspectionDate: '2024-12-17',
    procedureNumber: 'NDT-UT-GE90-HPT-002',
    drawingReference: 'DWG-GE90-HPT-D3-2024 Rev. A',
    revision: 'B',
    customerName: 'GE Aerospace',
    purchaseOrder: 'PO-GE-AVN-2024-8821',
    serialNumber: 'SN-HPT-D3-24-0089',
    additionalNotes: 'Engine critical rotating component. Nadcap witness mandatory. All indications to be mapped and reported.',
    approvalRequired: true,
  },

  scanDetails: {
    scanDetails: [
      { id: '1', scanningDirection: 'A', waveMode: 'longitudinal', isVisible: true, description: 'Axial - Top face', angle: 0 },
      { id: '2', scanningDirection: 'B', waveMode: 'longitudinal', isVisible: true, description: 'Axial - Bottom face', angle: 0 },
      { id: '3', scanningDirection: 'C', waveMode: 'longitudinal', isVisible: true, description: 'Radial - OD inward', angle: 0 },
      { id: '4', scanningDirection: 'D', waveMode: 'longitudinal', isVisible: true, description: 'Radial - ID outward', angle: 0 },
      { id: '5', scanningDirection: 'E', waveMode: 'shear', isVisible: true, description: 'Circumferential - CW 45°', angle: 45 },
      { id: '6', scanningDirection: 'F', waveMode: 'shear', isVisible: true, description: 'Circumferential - CCW 45°', angle: -45 },
      { id: '7', scanningDirection: 'G', waveMode: 'shear', isVisible: true, description: 'Circumferential - CW 60°', angle: 60 },
      { id: '8', scanningDirection: 'H', waveMode: 'shear', isVisible: true, description: 'Circumferential - CCW 60°', angle: -60 },
    ],
  },
};

// ============================================================================
// CARD 3: Steel Plate - Structural Component
// ============================================================================
export const testCard3: TestCard = {
  id: 'test-card-3',
  name: 'Pressure Vessel Head Plate',
  description: 'Carbon steel plate for pressure vessel - ASME Section VIII',
  standard: 'ASTM-A388',

  inspectionSetup: {
    partNumber: 'PV-HEAD-4140-001',
    partName: 'Pressure Vessel Elliptical Head',
    material: 'steel',
    customMaterialName: '',
    materialSpec: 'ASTM A387 Grade 11 Class 2',
    partType: 'plate',
    partThickness: 75.0,
    partLength: 1500.0,
    partWidth: 1500.0,
    diameter: 0,
    isHollow: false,
    innerDiameter: 0,
    wallThickness: 0,
    acousticVelocity: 5920,
    materialDensity: 7850,
    drawingNumber: 'DWG-PV-HEAD-2024-015',
    heatTreatment: 'Normalized and Tempered',
  },

  equipment: {
    manufacturer: 'GE Inspection Technologies',
    model: 'USM Go+',
    serialNumber: 'USMG-2024-3318',
    softwareVersion: 'v3.8.2',
    frequency: '2.25',
    transducerType: 'contact',
    transducerDiameter: 1.0,
    probeModel: 'MB2S-N',
    couplant: 'Glycerin-based gel',
    verticalLinearity: 96.8,
    horizontalLinearity: 95.5,
    entrySurfaceResolution: 0.15,
    backSurfaceResolution: 0.08,
  },

  calibration: {
    standardType: 'astm_a388',
    referenceMaterial: 'AISI 4140 Steel',
    fbhSizes: '#5, #8, #10',
    metalTravelDistance: 76.2,
    blockDimensions: '150 x 150 x 75 mm',
    blockSerialNumber: 'CAL-STL-4140-003',
    lastCalibrationDate: '2024-10-20',
    fbhHoles: [
      { id: '1', partNumber: '4140-5-0100', deltaType: 'Δ5', diameterInch: '#5 (5/64")', diameterMm: 1.98, distanceB: 25.4, metalTravelH: 38.1 },
      { id: '2', partNumber: '4140-8-0150', deltaType: 'Δ8', diameterInch: '#8 (1/8")', diameterMm: 3.18, distanceB: 38.1, metalTravelH: 57.2 },
      { id: '3', partNumber: '4140-10-0200', deltaType: 'Δ10', diameterInch: '#10 (5/32")', diameterMm: 3.97, distanceB: 50.8, metalTravelH: 76.2 },
    ],
  },

  scanParameters: {
    scanMethod: 'contact',
    scanType: 'Manual Grid Scan',
    scanSpeed: 50,
    scanIndex: 75,
    coverage: 100,
    scanPattern: 'Grid 50x50mm',
    waterPath: 0,
    pulseRepetitionRate: 500,
    gainSettings: 'DAC curve + 6dB',
    alarmGateSettings: 'Single gate: 5-72mm depth',
    couplingMethod: 'contact',
  },

  acceptanceCriteria: {
    acceptanceClass: 'B',
    singleDiscontinuity: 'FBH #8 (1/8") max',
    multipleDiscontinuities: '5 in any 150mm x 150mm area',
    linearDiscontinuity: '25mm max length',
    backReflectionLoss: 50,
    noiseLevel: '< 25% of #8 FBH',
    specialRequirements: 'Per ASME Section VIII Div. 1, UW-11. All weld prep areas require 100% scan with 50% overlap.',
  },

  documentation: {
    inspectorName: 'James Rodriguez',
    inspectorCertification: 'AWS CWI / SNT-TC-1A Level II',
    inspectorLevel: 'Level II',
    certifyingOrganization: 'AWS / ASNT',
    inspectionDate: '2024-12-17',
    procedureNumber: 'QC-UT-PV-008 Rev. D',
    drawingReference: 'DWG-PV-HEAD-2024-015 Rev. C',
    revision: 'D',
    customerName: 'Shell Oil & Gas',
    purchaseOrder: 'PO-SHELL-2024-00447',
    serialNumber: 'HT-24-PV-001-HEAD-A',
    additionalNotes: 'ASME U-Stamp required. Third party AI inspection scheduled for Dec 20, 2024.',
    approvalRequired: false,
  },

  scanDetails: {
    scanDetails: [
      { id: '1', scanningDirection: 'A', waveMode: 'longitudinal', isVisible: true, description: 'Normal beam - Top surface', angle: 0 },
      { id: '2', scanningDirection: 'B', waveMode: 'longitudinal', isVisible: true, description: 'Normal beam - Bottom surface', angle: 0 },
      { id: '3', scanningDirection: 'C', waveMode: 'shear', isVisible: true, description: 'Angle beam 45° - Direction 1', angle: 45 },
      { id: '4', scanningDirection: 'D', waveMode: 'shear', isVisible: true, description: 'Angle beam 45° - Direction 2', angle: -45 },
    ],
  },
};

// Export all test cards
export const testCards: TestCard[] = [testCard1, testCard2, testCard3];

// Helper function to get a test card by ID
export function getTestCard(id: string): TestCard | undefined {
  return testCards.find(card => card.id === id);
}

// Helper function to get test card by index (1-based)
export function getTestCardByIndex(index: number): TestCard | undefined {
  return testCards[index - 1];
}

export default testCards;
