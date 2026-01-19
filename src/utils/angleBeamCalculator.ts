/**
 * ==================================================================================
 * ANGLE BEAM CALIBRATION CALCULATOR
 * ==================================================================================
 * 
 * Complete physics-based calculation engine for angle beam ultrasonic inspection.
 * Implements Snell's Law, skip distance, sound path, and calibration block selection.
 * 
 * Standards Reference:
 * - AWS D1.1 (Structural Welding)
 * - ASME V Article 4 (UT Examination)
 * - EN ISO 17640 (Weld Testing)
 * - EN 1714 (Weld Testing of Welded Joints)
 * - MIL-STD-2154A (Aerospace)
 * 
 * Author: ScanMaster NDT Systems
 * Version: 1.0.0
 * ==================================================================================
 */

// ==================== MATERIAL VELOCITY DATABASE ====================

export interface MaterialVelocity {
  name: string;
  longitudinal: number;  // m/s - compression wave velocity
  shear: number;         // m/s - shear wave velocity
  density: number;       // kg/m³
  acousticImpedance: number; // MRayl (10⁶ kg/m²s)
}

/**
 * Comprehensive material acoustic velocity database
 * Values from ASTM E494, EN 12223, and NDT handbooks
 */
export const MATERIAL_VELOCITIES: Record<string, MaterialVelocity> = {
  // STEELS
  'carbon_steel': {
    name: 'Carbon Steel (Low Alloy)',
    longitudinal: 5920,
    shear: 3250,
    density: 7850,
    acousticImpedance: 46.5
  },
  'stainless_304': {
    name: 'Stainless Steel 304',
    longitudinal: 5790,
    shear: 3100,
    density: 8000,
    acousticImpedance: 46.3
  },
  'stainless_316': {
    name: 'Stainless Steel 316',
    longitudinal: 5740,
    shear: 3080,
    density: 8000,
    acousticImpedance: 45.9
  },
  'duplex_steel': {
    name: 'Duplex Stainless Steel',
    longitudinal: 5650,
    shear: 3100,
    density: 7800,
    acousticImpedance: 44.1
  },
  'tool_steel': {
    name: 'Tool Steel (High Carbon)',
    longitudinal: 5890,
    shear: 3240,
    density: 7800,
    acousticImpedance: 45.9
  },
  
  // ALUMINUM ALLOYS
  'aluminum_6061': {
    name: 'Aluminum 6061-T6',
    longitudinal: 6320,
    shear: 3130,
    density: 2700,
    acousticImpedance: 17.1
  },
  'aluminum_7075': {
    name: 'Aluminum 7075-T6',
    longitudinal: 6350,
    shear: 3140,
    density: 2810,
    acousticImpedance: 17.8
  },
  'aluminum_2024': {
    name: 'Aluminum 2024-T4',
    longitudinal: 6370,
    shear: 3150,
    density: 2780,
    acousticImpedance: 17.7
  },
  
  // TITANIUM
  'titanium_6al4v': {
    name: 'Titanium Ti-6Al-4V',
    longitudinal: 6100,
    shear: 3120,
    density: 4430,
    acousticImpedance: 27.0
  },
  'titanium_cp': {
    name: 'Commercially Pure Titanium',
    longitudinal: 6070,
    shear: 3125,
    density: 4510,
    acousticImpedance: 27.4
  },
  
  // COPPER ALLOYS
  'copper': {
    name: 'Pure Copper',
    longitudinal: 4660,
    shear: 2260,
    density: 8960,
    acousticImpedance: 41.8
  },
  'brass': {
    name: 'Brass (70Cu-30Zn)',
    longitudinal: 4430,
    shear: 2120,
    density: 8500,
    acousticImpedance: 37.7
  },
  
  // NICKEL ALLOYS (Aero Engine Materials)
  'inconel_718': {
    name: 'Inconel 718 (AMS 5662)',
    longitudinal: 5840,
    shear: 3020,
    density: 8192,
    acousticImpedance: 47.8
  },
  'inconel_625': {
    name: 'Inconel 625 (AMS 5666)',
    longitudinal: 5820,
    shear: 3020,
    density: 8440,
    acousticImpedance: 49.1
  },
  'waspaloy': {
    name: 'Waspaloy (AMS 5544)',
    longitudinal: 5800,
    shear: 3010,
    density: 8190,
    acousticImpedance: 47.5
  },
  'monel_400': {
    name: 'Monel 400',
    longitudinal: 5350,
    shear: 2720,
    density: 8800,
    acousticImpedance: 47.1
  },
  'powdered_nickel': {
    name: 'Powdered Nickel (PM Nickel)',
    longitudinal: 5750,
    shear: 3000,
    density: 8100,
    acousticImpedance: 46.6
  },

  // WEDGE MATERIALS
  'perspex': {
    name: 'Perspex/Acrylic (PMMA)',
    longitudinal: 2730,
    shear: 1430,
    density: 1180,
    acousticImpedance: 3.22
  },
  'rexolite': {
    name: 'Rexolite 1422',
    longitudinal: 2337,
    shear: 1157,
    density: 1050,
    acousticImpedance: 2.45
  },
  'polystyrene': {
    name: 'Polystyrene',
    longitudinal: 2350,
    shear: 1150,
    density: 1050,
    acousticImpedance: 2.47
  }
};

// ==================== PROBE/WEDGE DATABASE ====================

export interface WedgeSpecification {
  name: string;
  wedgeAngle: number;        // Wedge angle in degrees
  wedgeMaterial: string;     // Key from MATERIAL_VELOCITIES
  refractedAngleSteel: number; // Resultant angle in steel
  frequency: number;         // MHz
  elementSize: number;       // mm
  nearFieldWedge: number;    // mm - near field in wedge
}

/**
 * Standard angle beam wedge configurations
 */
export const STANDARD_WEDGES: Record<string, WedgeSpecification> = {
  'SW45-2': {
    name: '45° Shear Wave - 2 MHz',
    wedgeAngle: 26.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 45,
    frequency: 2,
    elementSize: 20,
    nearFieldWedge: 12
  },
  'SW45-4': {
    name: '45° Shear Wave - 4 MHz',
    wedgeAngle: 26.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 45,
    frequency: 4,
    elementSize: 10,
    nearFieldWedge: 8
  },
  'SW60-2': {
    name: '60° Shear Wave - 2 MHz',
    wedgeAngle: 36.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 60,
    frequency: 2,
    elementSize: 20,
    nearFieldWedge: 14
  },
  'SW60-4': {
    name: '60° Shear Wave - 4 MHz',
    wedgeAngle: 36.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 60,
    frequency: 4,
    elementSize: 10,
    nearFieldWedge: 10
  },
  'SW70-2': {
    name: '70° Shear Wave - 2 MHz',
    wedgeAngle: 43.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 70,
    frequency: 2,
    elementSize: 20,
    nearFieldWedge: 16
  },
  'SW70-4': {
    name: '70° Shear Wave - 4 MHz',
    wedgeAngle: 43.5,
    wedgeMaterial: 'perspex',
    refractedAngleSteel: 70,
    frequency: 4,
    elementSize: 10,
    nearFieldWedge: 12
  }
};

// ==================== CALIBRATION BLOCK STANDARDS ====================

export interface AngleBeamBlockSpec {
  id: string;
  name: string;
  type: 'iiv_v1' | 'iiv_v2' | 'iow' | 'dsc' | 'aws' | 'asme' | 'custom';
  standard: string;
  material: string;
  thickness: number;          // mm
  length: number;             // mm
  width: number;              // mm
  reflectorType: 'sdh' | 'notch' | 'fbh';
  reflectors: {
    type: string;
    size: number;             // mm diameter for SDH/FBH, depth for notch
    depth: number;            // mm from scanning surface
    position: number;         // mm from reference edge
  }[];
  applicableAngles: number[]; // Which beam angles can use this block
  thicknessRange: [number, number]; // Min-max thickness this block covers
}

/**
 * Standard angle beam calibration blocks per major codes
 */
export const ANGLE_BEAM_BLOCKS: AngleBeamBlockSpec[] = [
  // IIW Type 1 (V1) - ISO 2400
  {
    id: 'IIW-V1',
    name: 'IIW Type 1 Calibration Block',
    type: 'iiv_v1',
    standard: 'ISO 2400 / EN 12223',
    material: 'carbon_steel',
    thickness: 25,
    length: 300,
    width: 100,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 1.5, depth: 25, position: 91 },  // 25mm deep SDH
      { type: 'sdh', size: 1.5, depth: 50, position: 100 }  // 50mm radius arc
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [8, 100]
  },
  
  // IIW Type 2 (V2) - ISO 7963
  {
    id: 'IIW-V2',
    name: 'IIW Type 2 Miniature Block',
    type: 'iiv_v2',
    standard: 'ISO 7963',
    material: 'carbon_steel',
    thickness: 12.5,
    length: 75,
    width: 35,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'notch', size: 1.0, depth: 2, position: 25 }
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [6, 50]
  },
  
  // AWS DSC Block - AWS D1.1
  {
    id: 'AWS-DSC',
    name: 'AWS Distance/Sensitivity Calibration Block',
    type: 'dsc',
    standard: 'AWS D1.1 Figure 6.22',
    material: 'carbon_steel',
    thickness: 38,
    length: 200,
    width: 75,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 1.5, depth: 6.4, position: 25 },   // 1/4T
      { type: 'sdh', size: 1.5, depth: 19, position: 75 },    // 1/2T
      { type: 'sdh', size: 1.5, depth: 31.6, position: 125 }  // 3/4T
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [10, 50]
  },
  
  // ASME Basic Calibration Block
  {
    id: 'ASME-BASIC',
    name: 'ASME V Basic Calibration Block',
    type: 'asme',
    standard: 'ASME V Article 4',
    material: 'carbon_steel',
    thickness: 25,
    length: 150,
    width: 50,
    reflectorType: 'notch',
    reflectors: [
      { type: 'notch_id', size: 2, depth: 0, position: 50 },   // ID notch
      { type: 'notch_od', size: 2, depth: 25, position: 100 }  // OD notch
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [6, 40]
  },
  
  // Thin wall tubular
  {
    id: 'TUBE-SDH-THIN',
    name: 'Tubular SDH Block (Thin Wall)',
    type: 'custom',
    standard: 'EN ISO 10893-11',
    material: 'carbon_steel',
    thickness: 8,
    length: 200,
    width: 0,  // OD based
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 1.2, depth: 2, position: 50 },
      { type: 'sdh', size: 1.2, depth: 4, position: 100 },
      { type: 'sdh', size: 1.2, depth: 6, position: 150 }
    ],
    applicableAngles: [45, 60],
    thicknessRange: [3, 12]
  },
  
  // Medium thickness
  {
    id: 'PLATE-SDH-25',
    name: 'Plate SDH Block 25mm',
    type: 'custom',
    standard: 'EN 1714 / ISO 17640',
    material: 'carbon_steel',
    thickness: 25,
    length: 300,
    width: 100,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 1.5, depth: 6.25, position: 50 },   // T/4
      { type: 'sdh', size: 1.5, depth: 12.5, position: 100 },  // T/2
      { type: 'sdh', size: 1.5, depth: 18.75, position: 150 }  // 3T/4
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [15, 35]
  },
  
  // Thick sections
  {
    id: 'PLATE-SDH-50',
    name: 'Plate SDH Block 50mm',
    type: 'custom',
    standard: 'EN 1714 / ISO 17640',
    material: 'carbon_steel',
    thickness: 50,
    length: 400,
    width: 150,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 2.0, depth: 12.5, position: 75 },   // T/4
      { type: 'sdh', size: 2.0, depth: 25, position: 150 },    // T/2
      { type: 'sdh', size: 2.0, depth: 37.5, position: 225 }   // 3T/4
    ],
    applicableAngles: [45, 60, 70],
    thicknessRange: [35, 75]
  },
  
  // Very thick sections
  {
    id: 'PLATE-SDH-100',
    name: 'Plate SDH Block 100mm',
    type: 'custom',
    standard: 'EN 1714 / ISO 17640',
    material: 'carbon_steel',
    thickness: 100,
    length: 500,
    width: 200,
    reflectorType: 'sdh',
    reflectors: [
      { type: 'sdh', size: 3.0, depth: 25, position: 100 },    // T/4
      { type: 'sdh', size: 3.0, depth: 50, position: 200 },    // T/2
      { type: 'sdh', size: 3.0, depth: 75, position: 300 }     // 3T/4
    ],
    applicableAngles: [45, 60],
    thicknessRange: [75, 150]
  }
];

// ==================== SNELL'S LAW CALCULATIONS ====================

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Calculate refracted angle using Snell's Law
 * sin(θ1)/V1 = sin(θ2)/V2
 * 
 * @param incidentAngle - Incident angle in degrees (wedge angle)
 * @param V1 - Velocity in first medium (wedge material)
 * @param V2 - Velocity in second medium (test material - shear wave)
 * @returns Refracted angle in degrees, or null if total internal reflection
 */
export function calculateRefractedAngle(
  incidentAngle: number,
  V1: number,
  V2: number
): number | null {
  const sinIncident = Math.sin(degToRad(incidentAngle));
  const sinRefracted = (V2 / V1) * sinIncident;
  
  // Check for total internal reflection
  if (Math.abs(sinRefracted) > 1) {
    return null;
  }
  
  return radToDeg(Math.asin(sinRefracted));
}

/**
 * Calculate required wedge angle for desired refracted angle
 * 
 * @param desiredRefractedAngle - Desired angle in test material (degrees)
 * @param wedgeMaterial - Material key for wedge
 * @param testMaterial - Material key for test piece
 * @param waveType - 'longitudinal' or 'shear'
 */
export function calculateWedgeAngle(
  desiredRefractedAngle: number,
  wedgeMaterial: string,
  testMaterial: string,
  waveType: 'longitudinal' | 'shear' = 'shear'
): number | null {
  const wedgeVel = MATERIAL_VELOCITIES[wedgeMaterial]?.longitudinal;
  const testVel = waveType === 'shear' 
    ? MATERIAL_VELOCITIES[testMaterial]?.shear 
    : MATERIAL_VELOCITIES[testMaterial]?.longitudinal;
  
  if (!wedgeVel || !testVel) {
    return null;
  }
  
  const sinRefracted = Math.sin(degToRad(desiredRefractedAngle));
  const sinIncident = (wedgeVel / testVel) * sinRefracted;
  
  if (Math.abs(sinIncident) > 1) {
    return null; // Not achievable
  }
  
  return radToDeg(Math.asin(sinIncident));
}

/**
 * Calculate first and second critical angles
 */
export function calculateCriticalAngles(
  wedgeMaterial: string,
  testMaterial: string
): { firstCritical: number; secondCritical: number } | null {
  const wedgeVel = MATERIAL_VELOCITIES[wedgeMaterial]?.longitudinal;
  const testLong = MATERIAL_VELOCITIES[testMaterial]?.longitudinal;
  const testShear = MATERIAL_VELOCITIES[testMaterial]?.shear;
  
  if (!wedgeVel || !testLong || !testShear) {
    return null;
  }
  
  // First critical: longitudinal wave at 90°
  const firstCritical = radToDeg(Math.asin(wedgeVel / testLong));
  
  // Second critical: shear wave at 90°
  const secondCritical = radToDeg(Math.asin(wedgeVel / testShear));
  
  return { firstCritical, secondCritical };
}

// ==================== BEAM PATH CALCULATIONS ====================

export interface BeamPathResult {
  soundPath: number;           // mm - actual beam travel distance
  skipDistance: number;        // mm - surface distance for full V path
  halfSkip: number;            // mm - half skip distance
  surfaceDistance: number;     // mm - probe index to indication projection
  legNumber: number;           // Which leg (1st, 2nd, 3rd)
  depthAtLeg: number;          // Depth at current leg
}

/**
 * Calculate beam path geometry for angle beam inspection
 * 
 * @param thickness - Material thickness in mm
 * @param refractedAngle - Beam angle in material (degrees)
 * @param targetDepth - Target depth for indication (mm), optional
 */
export function calculateBeamPath(
  thickness: number,
  refractedAngle: number,
  targetDepth?: number
): BeamPathResult {
  const angleRad = degToRad(refractedAngle);
  const tanAngle = Math.tan(angleRad);
  const cosAngle = Math.cos(angleRad);
  
  // Basic geometry
  const halfSkip = thickness * tanAngle;
  const skipDistance = 2 * halfSkip;
  const soundPathOneLeg = thickness / cosAngle;
  
  // If target depth specified, calculate leg information
  let legNumber = 1;
  let depthAtLeg = thickness;
  let surfaceDistance = halfSkip;
  let soundPath = soundPathOneLeg;
  
  if (targetDepth !== undefined) {
    // Determine which leg we're on based on target depth
    if (targetDepth <= thickness) {
      // First leg - descending
      legNumber = 1;
      depthAtLeg = targetDepth;
      surfaceDistance = targetDepth * tanAngle;
      soundPath = targetDepth / cosAngle;
    } else if (targetDepth <= thickness * 2) {
      // Second leg - ascending  
      legNumber = 2;
      depthAtLeg = 2 * thickness - targetDepth;
      surfaceDistance = halfSkip + (thickness - depthAtLeg) * tanAngle;
      soundPath = soundPathOneLeg + (thickness - depthAtLeg) / cosAngle;
    } else {
      // Third leg and beyond
      const fullSkips = Math.floor(targetDepth / thickness);
      legNumber = fullSkips + 1;
      const remainder = targetDepth % thickness;
      
      if (fullSkips % 2 === 0) {
        // Descending leg
        depthAtLeg = remainder;
        soundPath = fullSkips * soundPathOneLeg + remainder / cosAngle;
      } else {
        // Ascending leg
        depthAtLeg = thickness - remainder;
        soundPath = fullSkips * soundPathOneLeg + remainder / cosAngle;
      }
      surfaceDistance = fullSkips * halfSkip + remainder * tanAngle;
    }
  }
  
  return {
    soundPath,
    skipDistance,
    halfSkip,
    surfaceDistance,
    legNumber,
    depthAtLeg
  };
}

/**
 * Calculate depth from surface distance and angle
 */
export function calculateDepthFromSurfaceDistance(
  surfaceDistance: number,
  refractedAngle: number,
  thickness: number
): { depth: number; legNumber: number } {
  const tanAngle = Math.tan(degToRad(refractedAngle));
  const halfSkip = thickness * tanAngle;
  
  // Determine leg number
  const legs = Math.floor(surfaceDistance / halfSkip);
  const remainder = surfaceDistance % halfSkip;
  
  let depth: number;
  if (legs % 2 === 0) {
    // Descending (1st, 3rd, 5th leg)
    depth = remainder / tanAngle;
  } else {
    // Ascending (2nd, 4th leg)
    depth = thickness - (remainder / tanAngle);
  }
  
  return { depth, legNumber: legs + 1 };
}

// ==================== SDH SIZE RECOMMENDATIONS ====================

export interface SDHRecommendation {
  diameter: number;           // mm
  tolerance: number;          // ± mm
  standard: string;
  reason: string;
}

/**
 * Get recommended SDH size based on thickness and code
 * 
 * @param thickness - Material thickness in mm
 * @param code - Applicable code ('aws', 'asme', 'en1714', 'iso17640')
 */
export function getRecommendedSDHSize(
  thickness: number,
  code: 'aws' | 'asme' | 'en1714' | 'iso17640' | 'mil_std_2154' = 'en1714'
): SDHRecommendation {
  switch (code) {
    case 'aws':
      // AWS D1.1 - 1.5mm (1/16") standard
      return {
        diameter: 1.5,
        tolerance: 0.05,
        standard: 'AWS D1.1',
        reason: 'Standard 1/16" (1.5mm) SDH for all thicknesses per AWS D1.1'
      };
      
    case 'asme':
      // ASME V - based on thickness
      if (thickness <= 25) {
        return {
          diameter: 1.5,
          tolerance: 0.05,
          standard: 'ASME V Article 4',
          reason: 'T ≤ 25mm: 1.5mm SDH'
        };
      } else if (thickness <= 50) {
        return {
          diameter: 2.4,
          tolerance: 0.1,
          standard: 'ASME V Article 4',
          reason: '25mm < T ≤ 50mm: 2.4mm (3/32") SDH'
        };
      } else {
        return {
          diameter: 3.0,
          tolerance: 0.1,
          standard: 'ASME V Article 4',
          reason: 'T > 50mm: 3.0mm (1/8") SDH'
        };
      }
      
    case 'en1714':
    case 'iso17640':
      // EN 1714 / ISO 17640 - based on thickness
      if (thickness <= 15) {
        return {
          diameter: 1.5,
          tolerance: 0.05,
          standard: 'EN 1714 / ISO 17640',
          reason: 'T ≤ 15mm: Ø1.5mm SDH'
        };
      } else if (thickness <= 35) {
        return {
          diameter: 2.0,
          tolerance: 0.05,
          standard: 'EN 1714 / ISO 17640',
          reason: '15mm < T ≤ 35mm: Ø2.0mm SDH'
        };
      } else if (thickness <= 100) {
        return {
          diameter: 3.0,
          tolerance: 0.1,
          standard: 'EN 1714 / ISO 17640',
          reason: '35mm < T ≤ 100mm: Ø3.0mm SDH'
        };
      } else {
        return {
          diameter: 4.0,
          tolerance: 0.1,
          standard: 'EN 1714 / ISO 17640',
          reason: 'T > 100mm: Ø4.0mm SDH'
        };
      }
      
    case 'mil_std_2154':
      // MIL-STD-2154A - typically uses FBH not SDH, but for angle:
      if (thickness <= 25) {
        return {
          diameter: 1.5,
          tolerance: 0.05,
          standard: 'MIL-STD-2154A',
          reason: 'T ≤ 25mm: 1.5mm SDH equivalent'
        };
      } else {
        return {
          diameter: 2.0,
          tolerance: 0.05,
          standard: 'MIL-STD-2154A',
          reason: 'T > 25mm: 2.0mm SDH equivalent'
        };
      }
      
    default:
      return {
        diameter: 1.5,
        tolerance: 0.05,
        standard: 'General',
        reason: 'Default 1.5mm SDH'
      };
  }
}

// ==================== NOTCH RECOMMENDATIONS ====================

export interface NotchRecommendation {
  depth: number;              // mm or % of wall
  depthPercent: number;       // % of wall thickness
  length: number;             // mm
  width: number;              // mm (for rectangular)
  type: 'rectangular' | 'v_notch' | 'semicircular';
  location: 'id' | 'od' | 'both';
  standard: string;
  reason: string;
}

/**
 * Get recommended notch dimensions based on thickness and code
 */
export function getRecommendedNotch(
  thickness: number,
  code: 'asme' | 'en_iso_10893' | 'api' | 'aws' = 'asme'
): NotchRecommendation {
  switch (code) {
    case 'asme': {
      // ASME V - notch depth typically 10% of wall or 1mm min
      const asmeDepth = Math.max(thickness * 0.1, 1);
      return {
        depth: asmeDepth,
        depthPercent: 10,
        length: 25,
        width: 1,
        type: 'rectangular',
        location: 'both',
        standard: 'ASME V',
        reason: '10% wall thickness or 1mm minimum, both ID & OD'
      };
    }
      
    case 'en_iso_10893': {
      // EN ISO 10893-11 for tubes - N5, N10 notches
      const enDepth = thickness * 0.05; // N5 = 5%
      return {
        depth: Math.max(enDepth, 0.5),
        depthPercent: 5,
        length: 25,
        width: 1,
        type: 'rectangular',
        location: 'both',
        standard: 'EN ISO 10893-11',
        reason: 'N5 notch (5% wall), ID and OD per tube standard'
      };
    }
      
    case 'api': {
      // API 5L / 5CT - longitudinal notches
      const apiDepth = thickness * 0.125; // 12.5% = N12.5
      return {
        depth: Math.max(apiDepth, 0.8),
        depthPercent: 12.5,
        length: 50,
        width: 1,
        type: 'rectangular',
        location: 'both',
        standard: 'API 5L',
        reason: 'N12.5 reference notch (12.5% wall)'
      };
    }
      
    case 'aws':
      // AWS D1.1 - machined notches
      return {
        depth: 2,
        depthPercent: (2 / thickness) * 100,
        length: 25,
        width: 1.5,
        type: 'rectangular',
        location: 'od',
        standard: 'AWS D1.1',
        reason: '2mm deep notch for weld calibration'
      };
      
    default:
      return {
        depth: thickness * 0.1,
        depthPercent: 10,
        length: 25,
        width: 1,
        type: 'rectangular',
        location: 'both',
        standard: 'General',
        reason: 'Default 10% wall notch'
      };
  }
}

// ==================== MAIN CALIBRATION BLOCK SELECTOR ====================

export interface AngleBeamCalibrationRequest {
  partThickness: number;          // mm
  partMaterial: string;           // Key from MATERIAL_VELOCITIES
  beamAngles: number[];           // Desired angles [45, 60, 70]
  partGeometry: 'plate' | 'pipe' | 'forging' | 'weld';
  outerDiameter?: number;         // mm - for pipes
  code: 'aws' | 'asme' | 'en1714' | 'iso17640' | 'mil_std_2154';
  acceptanceClass?: string;       // e.g., 'Class A', 'Level 1'
}

export interface AngleBeamCalibrationResult {
  recommendedBlock: AngleBeamBlockSpec;
  blockAlternatives: AngleBeamBlockSpec[];
  sdhSize: SDHRecommendation;
  notchSpec?: NotchRecommendation;
  beamPathData: Record<number, BeamPathResult>;  // Per angle
  wedgeRequirements: Record<number, {
    wedgeAngle: number;
    frequency: number;
    standardWedge: string;
  }>;
  criticalAngles: { firstCritical: number; secondCritical: number } | null;
  calibrationNotes: string[];
  warnings: string[];
}

/**
 * Main function to select appropriate angle beam calibration block
 * and calculate all relevant parameters
 */
export function selectAngleBeamCalibrationBlock(
  request: AngleBeamCalibrationRequest
): AngleBeamCalibrationResult {
  const {
    partThickness,
    partMaterial,
    beamAngles,
    partGeometry,
    outerDiameter,
    code
  } = request;
  
  const warnings: string[] = [];
  const calibrationNotes: string[] = [];
  
  // 1. Find suitable blocks based on thickness
  const suitableBlocks = ANGLE_BEAM_BLOCKS.filter(block => {
    const [minT, maxT] = block.thicknessRange;
    const thicknessMatch = partThickness >= minT * 0.8 && partThickness <= maxT * 1.2;
    const angleMatch = beamAngles.every(angle => block.applicableAngles.includes(angle));
    return thicknessMatch && angleMatch;
  });
  
  if (suitableBlocks.length === 0) {
    warnings.push(`No standard block found for ${partThickness}mm thickness. Custom block required.`);
  }
  
  // 2. Select best block based on geometry and code
  let recommendedBlock: AngleBeamBlockSpec;
  
  if (partGeometry === 'pipe' && outerDiameter && outerDiameter < 100) {
    // For small pipes, prefer IIW V2 or custom tubular
    recommendedBlock = suitableBlocks.find(b => b.type === 'iiv_v2') 
      || suitableBlocks.find(b => b.id.includes('TUBE'))
      || suitableBlocks[0]
      || ANGLE_BEAM_BLOCKS.find(b => b.id === 'IIW-V2')!;
    calibrationNotes.push('Small diameter pipe: IIW V2 or tubular block recommended');
  } else if (code === 'aws') {
    // AWS preference for DSC block
    recommendedBlock = suitableBlocks.find(b => b.type === 'dsc')
      || suitableBlocks.find(b => b.type === 'iiv_v1')
      || suitableBlocks[0]
      || ANGLE_BEAM_BLOCKS.find(b => b.id === 'AWS-DSC')!;
    calibrationNotes.push('AWS D1.1: DSC block preferred for weld inspection');
  } else if (code === 'asme') {
    // ASME preference for basic block
    recommendedBlock = suitableBlocks.find(b => b.type === 'asme')
      || suitableBlocks.find(b => b.type === 'iiv_v1')
      || suitableBlocks[0]
      || ANGLE_BEAM_BLOCKS.find(b => b.id === 'ASME-BASIC')!;
    calibrationNotes.push('ASME V: Basic calibration block per Article 4');
  } else {
    // Default to IIW V1 or thickness-matched block
    recommendedBlock = suitableBlocks.find(b => b.type === 'iiv_v1')
      || suitableBlocks[0]
      || ANGLE_BEAM_BLOCKS.find(b => b.id === 'IIW-V1')!;
    calibrationNotes.push('EN 1714 / ISO 17640: IIW Type 1 block recommended');
  }
  
  // 3. Get SDH size recommendation
  const sdhSize = getRecommendedSDHSize(partThickness, code);
  
  // 4. Get notch specification if applicable
  let notchSpec: NotchRecommendation | undefined;
  if (partGeometry === 'pipe') {
    notchSpec = getRecommendedNotch(partThickness, 'en_iso_10893');
    calibrationNotes.push('Pipe geometry: Both ID and OD notches required per EN ISO 10893-11');
  } else if (partGeometry === 'weld') {
    notchSpec = getRecommendedNotch(partThickness, code === 'aws' ? 'aws' : 'asme');
  }
  
  // 5. Calculate beam paths for each angle
  const beamPathData: Record<number, BeamPathResult> = {};
  for (const angle of beamAngles) {
    beamPathData[angle] = calculateBeamPath(partThickness, angle);
  }
  
  // 6. Calculate wedge requirements
  const wedgeRequirements: Record<number, { wedgeAngle: number; frequency: number; standardWedge: string }> = {};
  for (const angle of beamAngles) {
    const wedgeAngle = calculateWedgeAngle(angle, 'perspex', partMaterial);
    
    // Find matching standard wedge
    let standardWedge = `Custom ${angle}°`;
    let frequency = 4; // Default
    
    if (angle === 45) {
      standardWedge = partThickness > 50 ? 'SW45-2' : 'SW45-4';
      frequency = partThickness > 50 ? 2 : 4;
    } else if (angle === 60) {
      standardWedge = partThickness > 50 ? 'SW60-2' : 'SW60-4';
      frequency = partThickness > 50 ? 2 : 4;
    } else if (angle === 70) {
      standardWedge = partThickness > 50 ? 'SW70-2' : 'SW70-4';
      frequency = partThickness > 50 ? 2 : 4;
    }
    
    wedgeRequirements[angle] = {
      wedgeAngle: wedgeAngle || 0,
      frequency,
      standardWedge
    };
  }
  
  // 7. Calculate critical angles
  const criticalAngles = calculateCriticalAngles('perspex', partMaterial);
  
  // 8. Add thickness-specific warnings
  if (partThickness < 6) {
    warnings.push('Very thin material: Consider using creeping wave or TOFD technique');
  }
  if (partThickness > 100 && beamAngles.includes(70)) {
    warnings.push('70° beam not recommended for thickness > 100mm due to beam spread');
  }
  if (partGeometry === 'pipe' && outerDiameter && partThickness / outerDiameter > 0.25) {
    warnings.push('High t/OD ratio: Curvature correction may be required');
  }
  
  // 9. Add calibration notes
  calibrationNotes.push(`SDH Size: Ø${sdhSize.diameter}mm ±${sdhSize.tolerance}mm per ${sdhSize.standard}`);
  calibrationNotes.push(`Skip distances: ${beamAngles.map(a => `${a}°=${beamPathData[a].skipDistance.toFixed(1)}mm`).join(', ')}`);
  
  if (partGeometry === 'weld') {
    calibrationNotes.push('Weld inspection: Scan from both sides for full coverage');
    calibrationNotes.push('DAC curve required from SDH at T/4, T/2, 3T/4 depths');
  }
  
  return {
    recommendedBlock,
    blockAlternatives: suitableBlocks.filter(b => b.id !== recommendedBlock.id).slice(0, 3),
    sdhSize,
    notchSpec,
    beamPathData,
    wedgeRequirements,
    criticalAngles,
    calibrationNotes,
    warnings
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format beam path data for display
 */
export function formatBeamPathSummary(
  beamPath: BeamPathResult,
  angle: number
): string {
  return `
${angle}° Beam Path:
  Sound Path (1 leg): ${beamPath.soundPath.toFixed(1)} mm
  Half Skip: ${beamPath.halfSkip.toFixed(1)} mm
  Full Skip: ${beamPath.skipDistance.toFixed(1)} mm
  `.trim();
}

/**
 * Calculate probe movement range for full weld coverage
 */
export function calculateScanRange(
  weldWidth: number,
  partThickness: number,
  beamAngle: number,
  numLegs: number = 2
): { minDistance: number; maxDistance: number } {
  const beamPath = calculateBeamPath(partThickness, beamAngle);
  
  // Start position: beam exits at far side of weld
  const minDistance = -weldWidth / 2;
  
  // End position: full skip(s) to cover weld
  const maxDistance = beamPath.halfSkip * numLegs + weldWidth / 2;
  
  return { minDistance, maxDistance };
}

/**
 * Get material velocity by name (with fuzzy matching)
 */
export function getMaterialVelocity(materialName: string): MaterialVelocity | null {
  // Direct match
  if (MATERIAL_VELOCITIES[materialName]) {
    return MATERIAL_VELOCITIES[materialName];
  }
  
  // Fuzzy match
  const lowerName = materialName.toLowerCase();
  
  if (lowerName.includes('carbon') || lowerName.includes('mild') || lowerName.includes('a36')) {
    return MATERIAL_VELOCITIES['carbon_steel'];
  }
  if (lowerName.includes('304') || lowerName.includes('stainless')) {
    return MATERIAL_VELOCITIES['stainless_304'];
  }
  if (lowerName.includes('316')) {
    return MATERIAL_VELOCITIES['stainless_316'];
  }
  if (lowerName.includes('6061')) {
    return MATERIAL_VELOCITIES['aluminum_6061'];
  }
  if (lowerName.includes('7075')) {
    return MATERIAL_VELOCITIES['aluminum_7075'];
  }
  if (lowerName.includes('titanium') || lowerName.includes('ti-6')) {
    return MATERIAL_VELOCITIES['titanium_6al4v'];
  }
  // Nickel alloys - common aero engine materials
  if (lowerName.includes('718') || lowerName.includes('in718')) {
    return MATERIAL_VELOCITIES['inconel_718'];
  }
  if (lowerName.includes('waspaloy')) {
    return MATERIAL_VELOCITIES['waspaloy'];
  }
  if (lowerName.includes('powder') || lowerName.includes('pm nickel')) {
    return MATERIAL_VELOCITIES['powdered_nickel'];
  }
  if (lowerName.includes('inconel') || lowerName.includes('nickel_alloy') || lowerName.includes('nickel alloy')) {
    return MATERIAL_VELOCITIES['inconel_718']; // Default to IN718 for aero engines
  }

  // Default to carbon steel
  return MATERIAL_VELOCITIES['carbon_steel'];
}
