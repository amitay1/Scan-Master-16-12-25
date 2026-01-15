/**
 * Pratt & Whitney Scan Plans
 *
 * Source: NDIP-1226 Section 7.0 (Figure 2)
 * Source: NDIP-1227 Section 7.0 (Figure 2)
 *
 * V2500 HPT Disk Off-Wing Immersion UT Scan Plans
 */

/**
 * Scan direction for circumferential shear wave inspection
 */
export type ScanDirection = 'positive' | 'negative';

/**
 * Individual scan zone in the bore area
 */
export interface ScanZone {
  id: string;
  description: string;
  refractedAngle: number; // degrees
  direction: ScanDirection;
  coverageRequired: number; // inches - radial volumetric
}

/**
 * Complete scan plan for a part
 */
export interface PWScanPlan {
  partNumber: string;
  ndipReference: string;
  description: string;
  inspectionType: 'bore' | 'web' | 'rim' | 'full';
  waveType: 'shear' | 'longitudinal';
  boreRadius: number; // inches - nominal
  boreOffset: number; // inches - for angle generation
  minRadialCoverage: number; // inches
  maxScanIncrement: number; // inches
  maxIndexIncrement: number; // inches per revolution
  waterPath: number; // inches
  scanZones: ScanZone[];
  specialInstructions: string[];
}

/**
 * V2500 1st Stage HPT Disk Scan Plan
 * Per NDIP-1226 Section 7.1, Figure 2
 */
export const PW_V2500_STAGE1_SCAN_PLAN: PWScanPlan = {
  partNumber: '2A5001',
  ndipReference: 'NDIP-1226 Rev F',
  description: 'V2500 1st Stage HPT Disk Bore Inspection',
  inspectionType: 'bore',
  waveType: 'shear',
  boreRadius: 2.91, // inches - nominal
  boreOffset: 0.943, // inches (Section 7.1.2)
  minRadialCoverage: 2.6, // inches (Section 7.1.3)
  maxScanIncrement: 0.02, // inches (Section 7.2)
  maxIndexIncrement: 0.02, // inches per revolution (Section 7.3)
  waterPath: 8.0, // inches (Section 7.5)

  // From Figure 2 - labeled zones A through E
  scanZones: [
    {
      id: 'A',
      description: 'Bore ID Surface - Positive 45° Shear',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
    {
      id: 'B',
      description: 'Bore ID Surface - Negative 45° Shear',
      refractedAngle: 45,
      direction: 'negative',
      coverageRequired: 2.6,
    },
    {
      id: 'C',
      description: 'Forward Web Transition - Positive 45° Shear',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
    {
      id: 'D',
      description: 'Rear Web Transition - Negative 45° Shear',
      refractedAngle: 45,
      direction: 'negative',
      coverageRequired: 2.6,
    },
    {
      id: 'E',
      description: 'Bore OD Corner - Dual Direction',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
  ],

  specialInstructions: [
    'Edge signals excluded from evaluation area (Section 7.8.1)',
    'Verify mirror is fully seated on transducer (Section 7.6)',
    'Normalize on inspection surface before scanning (Section 7.7)',
    'Record any indication ≥20%FSH (Section 7.9.3)',
    'Check for air bubbles under web before inspection (Section 4.3.3.2)',
  ],
};

/**
 * V2500 2nd Stage HPT Disk Scan Plan
 * Per NDIP-1227 Section 7.1, Figure 2
 */
export const PW_V2500_STAGE2_SCAN_PLAN: PWScanPlan = {
  partNumber: '2A4802',
  ndipReference: 'NDIP-1227 Rev D',
  description: 'V2500 2nd Stage HPT Disk Bore Inspection',
  inspectionType: 'bore',
  waveType: 'shear',
  boreRadius: 2.773, // inches - nominal
  boreOffset: 0.898, // inches (Section 7.1.2)
  minRadialCoverage: 2.6, // inches (Section 7.1.3)
  maxScanIncrement: 0.02, // inches (Section 7.2)
  maxIndexIncrement: 0.02, // inches per revolution (Section 7.3)
  waterPath: 8.0, // inches (Section 7.5)

  // From Figure 2 - labeled zones K through P
  scanZones: [
    {
      id: 'K',
      description: 'Forward Bore Face - Positive 45° Shear',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
    {
      id: 'L',
      description: 'Forward Bore Face - Negative 45° Shear',
      refractedAngle: 45,
      direction: 'negative',
      coverageRequired: 2.6,
    },
    {
      id: 'M',
      description: 'Bore ID Surface - Positive 45° Shear',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
    {
      id: 'N',
      description: 'Bore ID Surface - Negative 45° Shear',
      refractedAngle: 45,
      direction: 'negative',
      coverageRequired: 2.6,
    },
    {
      id: 'O',
      description: 'Rear Web Transition - Positive 45° Shear',
      refractedAngle: 45,
      direction: 'positive',
      coverageRequired: 2.6,
    },
    {
      id: 'P',
      description: 'Rear Web Transition - Negative 45° Shear',
      refractedAngle: 45,
      direction: 'negative',
      coverageRequired: 2.6,
    },
  ],

  specialInstructions: [
    'Edge signals excluded from evaluation area (Section 7.8.1)',
    'Verify mirror is fully seated on transducer (Section 7.6)',
    'Normalize on inspection surface before scanning (Section 7.7)',
    'Record any indication ≥20%FSH (Section 7.9.3)',
    'Check for air bubbles under web before inspection (Section 4.3.3.2)',
  ],
};

/**
 * All V2500 scan plans
 */
export const PW_V2500_SCAN_PLANS: PWScanPlan[] = [
  PW_V2500_STAGE1_SCAN_PLAN,
  PW_V2500_STAGE2_SCAN_PLAN,
];

/**
 * Get scan plan by part number
 */
export function getScanPlanByPN(partNumber: string): PWScanPlan | undefined {
  return PW_V2500_SCAN_PLANS.find((sp) => sp.partNumber === partNumber);
}

/**
 * Calculate total scan coverage
 */
export function calculateTotalCoverage(scanPlan: PWScanPlan): {
  circumferential: number; // degrees
  radial: number; // inches
  axial: number; // inches (index travel)
} {
  return {
    circumferential: 360, // Full revolution
    radial: scanPlan.minRadialCoverage,
    axial: scanPlan.minRadialCoverage / Math.sin((45 * Math.PI) / 180), // Projected axial
  };
}

/**
 * Estimate scan time based on parameters
 */
export function estimateScanTime(
  scanPlan: PWScanPlan,
  rotationSpeed: number = 10, // rpm
  numberOfZones: number = scanPlan.scanZones.length
): {
  estimatedMinutes: number;
  revolutionsPerZone: number;
  totalRevolutions: number;
} {
  // Calculate revolutions needed per zone
  const radialSteps = scanPlan.minRadialCoverage / scanPlan.maxIndexIncrement;
  const revolutionsPerZone = Math.ceil(radialSteps);

  const totalRevolutions = revolutionsPerZone * numberOfZones;
  const estimatedMinutes = totalRevolutions / rotationSpeed;

  return {
    estimatedMinutes: Math.ceil(estimatedMinutes),
    revolutionsPerZone,
    totalRevolutions,
  };
}

/**
 * Disk preparation requirements
 * Per NDIP Section 6.0
 */
export const DISK_PREPARATION = {
  cleaning: 'Disk must be clean and free of foreign material or marking',
  startPosition: '12 o\'clock or 0 degrees',
  serialNumberLocation: 'Rear surface of blade attachment tang',
  markingTool: 'PMC-4059 approved marking pencil',
  turntablePosition: 'Set 12 o\'clock at 0.0 degrees',
  airBubbleCheck: 'Check and remove air bubbles from all inspection surfaces',
};
