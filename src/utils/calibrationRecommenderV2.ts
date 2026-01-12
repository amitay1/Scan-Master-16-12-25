/**
 * Calibration Block Recommender V2
 * 
 * Enhanced calibration recommendation system based on:
 * - AMS-STD-2154 (Aerospace)
 * - ASTM A388 (Heavy Steel Forgings)
 * - BS EN 10228-3 (Ferritic/Martensitic Steel Forgings)
 * - BS EN 10228-4 (Austenitic Steel Forgings)
 * - AWS D1.1 (Structural Welding - Angle Beam)
 * - EN 1714 / ISO 17640 (Weld Testing)
 * 
 * Supports:
 * - Straight beam (0°) calibration blocks
 * - Angle beam (45°, 60°, 70°) calibration blocks with full physics calculations
 * - Geometry-specific recommendations
 * - Technical drawing generation data
 * - Snell's Law calculations for wedge selection
 * - Skip distance and beam path calculations
 */

import { 
  MaterialType, 
  PartGeometry, 
  AcceptanceClass,
  StandardType
} from "@/types/techniqueSheet";

import {
  CalibrationBlockCategory,
  CalibrationBlockSpec,
  FBHHole,
  FBHSize,
  BeamType,
  AngleBeamAngle,
  GEOMETRY_GROUPS,
  FBH_SIZE_TABLE,
  fbhSizeToMm,
  getGeometryGroup,
  isThinWall,
  Notch,
  SDHHole,
  FlatBlockGeometry,
  CylindricalBlockGeometry,
  IIWBlockGeometry
} from "@/types/calibrationBlocks";

// Import shear wave calibration blocks database
import {
  selectShearWaveBlock,
  ShearWaveBlockSelectionCriteria,
  SHEAR_WAVE_MASTERS,
  ShearWaveCalibrationBlock,
} from '@/data/shearWaveCalibrationBlocks';

// Import the new angle beam calculator
import {
  selectAngleBeamCalibrationBlock,
  AngleBeamCalibrationRequest,
  AngleBeamCalibrationResult,
  calculateBeamPath,
  getRecommendedSDHSize,
  getRecommendedNotch,
  calculateCriticalAngles,
  calculateWedgeAngle,
  MATERIAL_VELOCITIES,
  getMaterialVelocity,
  BeamPathResult,
  SDHRecommendation,
  NotchRecommendation
} from "./angleBeamCalculator";

// ============================================================================
// INPUT/OUTPUT INTERFACES
// ============================================================================

export interface CalibrationRecommendationInput {
  // Part information
  material: MaterialType;
  materialSpec: string;
  partType: PartGeometry;
  standard: StandardType;
  
  // Dimensions
  thickness: number;      // Primary inspection thickness (mm)
  length?: number;        // Part length (mm)
  width?: number;         // Part width (mm)
  outerDiameter?: number; // For cylindrical/tubular parts (mm)
  innerDiameter?: number; // For hollow parts (mm)
  
  // Inspection requirements
  acceptanceClass: AcceptanceClass;
  beamType?: BeamType;           // If not specified, defaults to 'straight'
  angleBeamAngle?: AngleBeamAngle; // Required if beamType is 'angle'
  
  // Equipment
  frequency?: number;     // Transducer frequency (MHz)
  
  // NEW: Scan directions from Scan Details Tab (only critical ones that affect block choice)
  scanDirections?: {
    hasCircumferentialScan?: boolean; // D, E - REQUIRES notched blocks
    hasAngleBeam?: boolean;           // F, G, H... - REQUIRES angle beam blocks (IIW/DSC)
  };
}

export interface CalibrationRecommendationOutput {
  // Primary recommendation
  primaryBlock: CalibrationBlockSpec;
  
  // Alternative options (if applicable)
  alternativeBlocks?: CalibrationBlockSpec[];
  
  // Standard compliance info
  standardCompliance: {
    standard: StandardType;
    reference: string;
    tableReference?: string;
    figureReference?: string;
  };
  
  // Reasoning for transparency
  reasoning: {
    geometryGroup: string;
    blockSelection: string;
    fbhSelection: string;
    materialSelection: string;
    frequencySelection?: string;
    specialConsiderations?: string[];
  };
  
  // Angle beam specific data (when applicable)
  angleBeamCalculations?: {
    beamPaths: Record<number, BeamPathResult>;
    sdhRecommendation: SDHRecommendation;
    notchRecommendation?: NotchRecommendation;
    wedgeRequirements: Record<number, {
      wedgeAngle: number;
      frequency: number;
      standardWedge: string;
    }>;
    criticalAngles?: { firstCritical: number; secondCritical: number };
    skipDistances: Record<number, number>;
    soundPaths: Record<number, number>;
  };
  
  // Confidence score (0-100)
  confidence: number;
  
  // Warnings/notes
  warnings?: string[];
  notes?: string[];
}

// ============================================================================
// REFERENCE MATERIAL SELECTION (Per Table I)
// ============================================================================

interface ReferenceMaterial {
  primary: string;
  specification: string;
  alternates?: string[];
}

const REFERENCE_MATERIALS: Record<MaterialType, ReferenceMaterial> = {
  aluminum: {
    primary: "7075-T6",
    specification: "QQ-A-200/11",
    alternates: ["2024-T3 (QQ-A-200/3)", "6061-T6"]
  },
  steel: {
    primary: "4340 Annealed",
    specification: "MIL-S-5000",
    alternates: ["4140 Annealed", "1018 Steel"]
  },
  stainless_steel: {
    primary: "17-4 PH H1025",
    specification: "AMS 5643",
    alternates: ["316L", "304"]
  },
  titanium: {
    primary: "Ti-6Al-4V Annealed",
    specification: "AMS 4928",
    alternates: ["Ti-6Al-4V STA (AMS 4965)"]
  },
  magnesium: {
    primary: "ZK60A",
    specification: "QQ-M-31",
    alternates: ["AZ31B"]
  },
  custom: {
    primary: "As specified",
    specification: "Per customer spec",
    alternates: []
  }
};

// ============================================================================
// BLOCK SELECTION LOGIC
// ============================================================================

/**
 * Return type for calibration block selection
 */
interface CalibrationBlockSelectionResult {
  category: CalibrationBlockCategory;
  reasoning: string;
  alternatives?: CalibrationBlockCategory[];
  angleBeamData?: AngleBeamCalibrationResult;
}

/**
 * Main function to determine the appropriate calibration block
 */
function selectCalibrationBlock(input: CalibrationRecommendationInput): CalibrationBlockSelectionResult {
  const beamType = input.beamType || 'straight';
  const geometryGroup = getGeometryGroup(input.partType);
  
  // ANGLE BEAM - Different logic
  if (beamType === 'angle') {
    return selectAngleBeamBlock(input);
  }
  
  // STRAIGHT BEAM - Main logic
  return selectStraightBeamBlock(input, geometryGroup);
}

/**
 * Select calibration block for straight beam inspection
 */
function selectStraightBeamBlock(
  input: CalibrationRecommendationInput,
  geometryGroup: string | null
): {
  category: CalibrationBlockCategory;
  reasoning: string;
  alternatives?: CalibrationBlockCategory[];
} {
  const { partType, thickness, outerDiameter, innerDiameter } = input;
  
  // Group 1: Flat/Plate geometries
  if (geometryGroup === 'FLAT_PLATE' || geometryGroup === 'STRUCTURAL_PROFILES') {
    return {
      category: 'flat_fbh',
      reasoning: `Flat FBH block (Figure 4) is the standard choice for ${partType} geometry. ` +
                 `Each surface is treated as a flat inspection area.`,
      alternatives: thickness > 100 ? ['step_wedge'] : undefined
    };
  }
  
  // Group 2: Solid rounds (radial inspection)
  if (geometryGroup === 'SOLID_ROUNDS') {
    // For small diameter rounds, curved block might be needed
    if (outerDiameter && outerDiameter < 50.8) { // < 2 inches
      return {
        category: 'curved_fbh',
        reasoning: `Curved FBH block recommended for ${partType} with diameter < 50.8mm (2"). ` +
                   `Curvature correction required per ASTM A388.`,
        alternatives: ['flat_fbh']
      };
    }
    return {
      category: 'flat_fbh',
      reasoning: `Flat FBH block (Figure 4) for radial inspection of ${partType}. ` +
                 `Diameter > 50.8mm allows flat block usage.`,
    };
  }
  
  // Group 3: Disks
  if (geometryGroup === 'DISKS') {
    return {
      category: 'flat_fbh',
      reasoning: `Flat FBH block (Figure 4) for ${partType}. ` +
                 `Face inspection is primary; treated as thick plate.`,
    };
  }
  
  // Group 4: Thin-wall tubular
  if (geometryGroup === 'THIN_WALL_TUBULAR') {
    const isThisWallPart = innerDiameter && outerDiameter 
      ? isThinWall(outerDiameter, innerDiameter) 
      : thickness < 25;
    
    // CRITICAL: Circumferential shear wave REQUIRES notched block
    const hasCircumferentialScan = input.scanDirections?.hasCircumferentialScan;
    
    if (isThisWallPart) {
      // Notched block is standard for thin wall, but MANDATORY if circumferential scan
      if (hasCircumferentialScan) {
        return {
          category: 'cylinder_notched',
          reasoning: `Notched cylinder block (Figure 5) REQUIRED. ` +
                     `Circumferential shear wave scan (directions D/E) requires notch reflectors to simulate circumferential defects. ` +
                     `Wall thickness < 25mm.`,
        };
      }
      return {
        category: 'cylinder_notched',
        reasoning: `Notched cylinder block (Figure 5) for thin-wall ${partType}. ` +
                   `Wall thickness < 25mm requires notch reflectors for calibration.`,
        alternatives: ['cylinder_fbh']
      };
    }
    
    // Thick wall - BUT if circumferential scan is used, notched block is still better
    if (hasCircumferentialScan) {
      return {
        category: 'cylinder_notched',
        reasoning: `Notched cylinder block (Figure 5) REQUIRED. ` +
                   `Circumferential shear wave scan (directions D/E) requires notch reflectors, ` +
                   `even for thick wall (${thickness}mm).`,
        alternatives: ['cylinder_fbh']
      };
    }
    
    return {
      category: 'cylinder_fbh',
      reasoning: `Cylinder FBH block (Figure 6) for thick-wall ${partType}. ` +
                 `Wall thickness ≥ 25mm allows FBH calibration.`,
      alternatives: ['cylinder_notched']
    };
  }
  
  // Group 5: Thick-wall tubular/ring forgings
  if (geometryGroup === 'THICK_WALL_TUBULAR') {
    return {
      category: 'cylinder_fbh',
      reasoning: `Cylinder FBH block (Figure 6) for ${partType}. ` +
                 `Ring forgings typically have thick walls requiring FBH calibration.`,
    };
  }
  
  // Group 6: Forgings
  if (geometryGroup === 'FORGINGS') {
    return {
      category: 'flat_fbh',
      reasoning: `Flat FBH block (Figure 4) for ${partType}. ` +
                 `Block material should match forging grain structure. ` +
                 `Consider attenuation measurement for large forgings.`,
      alternatives: ['curved_fbh']
    };
  }
  
  // Group 7: Hex shapes
  if (geometryGroup === 'HEX_SHAPES') {
    return {
      category: 'flat_fbh',
      reasoning: `Flat FBH block (Figure 4) for ${partType}. ` +
                 `Each flat face inspected independently.`,
    };
  }
  
  // Group 8: Complex shapes
  if (geometryGroup === 'COMPLEX') {
    return {
      category: 'custom',
      reasoning: `Custom calibration block may be required for ${partType}. ` +
                 `Complex geometry requires special evaluation. ` +
                 `Contact UT Level III for procedure development.`,
      alternatives: ['flat_fbh']
    };
  }
  
  // Default fallback
  return {
    category: 'flat_fbh',
    reasoning: `Flat FBH block (Figure 4) as default for ${partType}. ` +
               `Review specific requirements with Level III.`,
  };
}

/**
 * Select calibration block for angle beam inspection
 * Uses the comprehensive angleBeamCalculator for physics-based selection
 * 
 * NEW: Integrates ASME shear wave block selection for curved surfaces
 */
function selectAngleBeamBlock(input: CalibrationRecommendationInput): {
  category: CalibrationBlockCategory;
  reasoning: string;
  alternatives?: CalibrationBlockCategory[];
  angleBeamData?: AngleBeamCalibrationResult;
  shearWaveBlock?: ShearWaveCalibrationBlock;
} {
  const { partType, thickness, outerDiameter, innerDiameter, angleBeamAngle, material, standard } = input;
  const geometryGroup = getGeometryGroup(partType);
  const angle = angleBeamAngle || 45;
  
  // ============================================================================
  // NEW: ASME SHEAR WAVE BLOCK SELECTION FOR ROUND PARTS
  // ============================================================================
  
  // Check if part is round (tube, solid_round, hollow_round) with circumferential scan
  const isRoundPart = ['tube', 'pipe', 'hollow_cylinder', 'solid_round', 'hollow_round'].includes(partType);
  const hasCircumferentialScan = input.scanDirections?.hasCircumferentialScan;
  
  if (isRoundPart && outerDiameter && thickness) {
    // Use ASME selection logic for shear wave blocks
    const shearWaveCriteria: ShearWaveBlockSelectionCriteria = {
      part_od_mm: outerDiameter,
      part_thickness_mm: thickness,
      part_geometry: partType as PartGeometry,
      angle_deg: angle,
    };
    
    const shearWaveResult = selectShearWaveBlock(shearWaveCriteria);
    
    if (shearWaveResult.block) {
      // ASME block found - use it
      return {
        category: shearWaveResult.block.category,
        reasoning: `ASME Shear Wave Block Selection: ${shearWaveResult.reasoning}`,
        alternatives: shearWaveResult.matchQuality === 'marginal' ? ['custom'] : undefined,
        shearWaveBlock: shearWaveResult.block,
      };
    } else {
      // No ASME block found - fall back to traditional logic but warn
      const fallbackResult = selectAngleBeamBlockTraditional(input);
      return {
        ...fallbackResult,
        reasoning: `⚠️ ${shearWaveResult.reasoning}. Falling back to: ${fallbackResult.reasoning}`,
      };
    }
  }
  
  // ============================================================================
  // TRADITIONAL ANGLE BEAM SELECTION (for non-round parts)
  // ============================================================================
  
  return selectAngleBeamBlockTraditional(input);
}

/**
 * Traditional angle beam block selection (pre-ASME integration)
 * Used for flat parts, complex geometries, or when ASME blocks don't apply
 */
function selectAngleBeamBlockTraditional(input: CalibrationRecommendationInput): {
  category: CalibrationBlockCategory;
  reasoning: string;
  alternatives?: CalibrationBlockCategory[];
  angleBeamData?: AngleBeamCalibrationResult;
} {
  const { partType, thickness, outerDiameter, innerDiameter, angleBeamAngle, material, standard } = input;
  const geometryGroup = getGeometryGroup(partType);
  const angle = angleBeamAngle || 45;
  
  // Map material type to velocity database key
  const materialKey = mapMaterialToVelocityKey(material);
  
  // Map standard to code
  const codeMap: Record<string, 'aws' | 'asme' | 'en1714' | 'iso17640' | 'mil_std_2154'> = {
    'MIL-STD-2154': 'mil_std_2154',
    'ASTM-A388': 'asme',
    'BS-EN-10228-3': 'en1714',
    'BS-EN-10228-4': 'en1714'
  };
  const code = codeMap[standard] || 'en1714';
  
  // Map part type to geometry
  const geometryMap: Record<string, 'plate' | 'pipe' | 'forging' | 'weld'> = {
    'hollow_cylinder': 'pipe',
    'tube': 'pipe',
    'pipe': 'pipe',
    'plate': 'plate',
    'sheet': 'plate',
    'forging': 'forging',
    'weld': 'weld'
  };
  const partGeometry = geometryMap[partType] || 'plate';
  
  // Use the comprehensive angle beam calculator
  const angleBeamRequest: AngleBeamCalibrationRequest = {
    partThickness: thickness,
    partMaterial: materialKey,
    beamAngles: [angle],
    partGeometry,
    outerDiameter,
    code
  };
  
  const angleBeamResult = selectAngleBeamCalibrationBlock(angleBeamRequest);
  
  // Map the result back to our category system
  const blockTypeToCategory: Record<string, CalibrationBlockCategory> = {
    'iiv_v1': 'iiw_v1',
    'iiv_v2': 'iiw_v2',
    'dsc': 'dsc_block',
    'aws': 'aws_block',
    'asme': 'iiw_v1',
    'custom': 'custom'
  };
  
  const category = blockTypeToCategory[angleBeamResult.recommendedBlock.type] || 'iiw_v1';
  
  // Build detailed reasoning with physics data
  const beamPath = angleBeamResult.beamPathData[angle];
  const sdhInfo = angleBeamResult.sdhSize;
  const wedgeInfo = angleBeamResult.wedgeRequirements[angle];
  
  const reasoning = [
    `${angleBeamResult.recommendedBlock.name} selected for ${angle}° angle beam inspection.`,
    `SDH Size: Ø${sdhInfo.diameter}mm per ${sdhInfo.standard}.`,
    `Skip Distance: ${beamPath.skipDistance.toFixed(1)}mm, Half Skip: ${beamPath.halfSkip.toFixed(1)}mm.`,
    `Sound Path (1 leg): ${beamPath.soundPath.toFixed(1)}mm.`,
    wedgeInfo ? `Wedge: ${wedgeInfo.standardWedge} (${wedgeInfo.frequency}MHz).` : '',
    ...angleBeamResult.calibrationNotes
  ].filter(Boolean).join(' ');
  
  // Map alternatives
  const alternatives = angleBeamResult.blockAlternatives.map(alt => 
    blockTypeToCategory[alt.type] || 'iiw_v1'
  ).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  
  return {
    category,
    reasoning,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    angleBeamData: angleBeamResult
  };
}

/**
 * Map MaterialType to velocity database key
 */
function mapMaterialToVelocityKey(material: MaterialType): string {
  const mapping: Record<MaterialType, string> = {
    'aluminum': 'aluminum_7075',
    'steel': 'carbon_steel',
    'stainless_steel': 'stainless_304',
    'titanium': 'titanium_6al4v',
    'magnesium': 'aluminum_6061', // Use aluminum as approximation
    'custom': 'carbon_steel'
  };
  return mapping[material] || 'carbon_steel';
}

// ============================================================================
// FBH SIZE SELECTION
// ============================================================================

/**
 * Select appropriate FBH sizes based on thickness and acceptance class
 */
function selectFBHSizes(
  thickness: number,
  acceptanceClass: AcceptanceClass
): {
  sizes: FBHSize[];
  reasoning: string;
} {
  // Find the appropriate thickness range
  const thicknessInch = thickness / 25.4;
  
  const range = FBH_SIZE_TABLE.find(r => 
    thicknessInch >= r.thicknessRangeInch.min && 
    thicknessInch < r.thicknessRangeInch.max
  );
  
  if (!range) {
    // Use the last range for very thick parts
    const lastRange = FBH_SIZE_TABLE[FBH_SIZE_TABLE.length - 1];
    return {
      sizes: lastRange.fbhSizes[acceptanceClass],
      reasoning: `FBH size per Table VI for thickness > ${lastRange.thicknessRangeMm.min}mm ` +
                 `and Class ${acceptanceClass}`
    };
  }
  
  return {
    sizes: range.fbhSizes[acceptanceClass],
    reasoning: `FBH size per Table VI for thickness ${range.thicknessRangeMm.min}-${range.thicknessRangeMm.max}mm ` +
               `and Class ${acceptanceClass}`
  };
}

// ============================================================================
// METAL TRAVEL DISTANCE CALCULATION
// ============================================================================

/**
 * Calculate metal travel distances for calibration block
 */
function calculateMetalTravel(thickness: number): {
  distances: number[];
  tolerance: string;
  reasoning: string;
} {
  const thicknessInch = thickness / 25.4;
  
  // Per Table IV - Metal Travel distances
  if (thicknessInch <= 0.25) {
    return {
      distances: [thickness],
      tolerance: "±1.59mm (±1/16\")",
      reasoning: "Single MTD for thin section per Table IV"
    };
  } else if (thicknessInch <= 1.0) {
    return {
      distances: [thickness, thickness * 2],
      tolerance: "±3.18mm (±1/8\")",
      reasoning: "T and 2T metal travel per Table IV"
    };
  } else if (thicknessInch <= 3.0) {
    return {
      distances: [thickness, thickness * 2, thickness * 3],
      tolerance: "±6.35mm (±1/4\")",
      reasoning: "T, 2T, 3T metal travel per Table IV"
    };
  } else {
    // For thick sections, use T, 2T, 3T, and optionally more
    const distances = [thickness];
    for (let i = 2; i <= Math.min(4, Math.ceil(thickness / 50)); i++) {
      distances.push(thickness * i);
    }
    return {
      distances,
      tolerance: `±${(thickness * 0.05).toFixed(1)}mm (±5%)`,
      reasoning: "Multiple MTD for thick section per Table IV"
    };
  }
}

// ============================================================================
// FREQUENCY RECOMMENDATION
// ============================================================================

/**
 * Recommend transducer frequency based on thickness
 */
function recommendFrequency(
  thickness: number, 
  material: MaterialType
): {
  frequency: number;
  reasoning: string;
} {
  // Austenitic materials need lower frequency due to grain scattering
  const isAustenitic = material === 'stainless_steel';
  
  if (thickness < 12.7) { // < 0.5"
    return {
      frequency: isAustenitic ? 5.0 : 10.0,
      reasoning: isAustenitic 
        ? "5 MHz for thin austenitic (grain scattering consideration)"
        : "10 MHz for thin section per Table II"
    };
  } else if (thickness < 25.4) { // 0.5" - 1"
    return {
      frequency: 5.0,
      reasoning: "5 MHz for medium thickness per Table II"
    };
  } else if (thickness < 50.8) { // 1" - 2"
    return {
      frequency: isAustenitic ? 1.0 : 2.25,
      reasoning: isAustenitic
        ? "1 MHz for thick austenitic (high attenuation)"
        : "2.25 MHz for thick section per Table II"
    };
  } else {
    return {
      frequency: isAustenitic ? 1.0 : 2.25,
      reasoning: isAustenitic
        ? "1 MHz for very thick austenitic (maximum penetration)"
        : "2.25 MHz or lower for very thick section"
    };
  }
}

// ============================================================================
// BLOCK GEOMETRY GENERATION
// ============================================================================

/**
 * Generate block geometry based on category and dimensions
 */
function generateBlockGeometry(
  category: CalibrationBlockCategory,
  thickness: number,
  metalTravel: { distances: number[] },
  outerDiameter?: number
): FlatBlockGeometry | CylindricalBlockGeometry | IIWBlockGeometry {
  
  switch (category) {
    case 'flat_fbh':
    case 'curved_fbh':
    case 'step_wedge': {
      // Block should accommodate all metal travel distances
      const maxDepth = Math.max(...metalTravel.distances);
      const blockHeight = Math.max(maxDepth + 10, 50); // At least 50mm or maxDepth + 10mm
      
      return {
        type: 'flat',
        lengthMm: 150,
        widthMm: 75,
        heightMm: blockHeight
      };
    }
    
    case 'cylinder_fbh':
    case 'cylinder_notched': {
      // For cylindrical blocks, match OD if provided
      const od = outerDiameter || 100;
      return {
        type: 'cylindrical',
        outerDiameterMm: od,
        innerDiameterMm: category === 'cylinder_notched' ? od * 0.8 : undefined,
        lengthMm: 150
      };
    }
    
    case 'iiw_v1':
      return {
        type: 'iiw',
        variant: 'v1',
        lengthMm: 300,
        heightMm: 100,
        thicknessMm: 25,
        radiusMm: 100,
        perspexInsert: true
      };
    
    case 'iiw_v2':
      return {
        type: 'iiw',
        variant: 'v2',
        lengthMm: 127,
        heightMm: 76.2,
        thicknessMm: 12.7,
        radiusMm: 25,
        perspexInsert: false
      };
    
    default:
      return {
        type: 'flat',
        lengthMm: 150,
        widthMm: 75,
        heightMm: 50
      };
  }
}

/**
 * Generate FBH hole positions in the block
 */
function generateFBHPositions(
  fbhSizes: FBHSize[],
  metalTravel: { distances: number[] },
  geometry: FlatBlockGeometry | CylindricalBlockGeometry
): FBHHole[] {
  const holes: FBHHole[] = [];
  
  // Get block dimensions for positioning
  const blockLength = geometry.type === 'flat' ? geometry.lengthMm : geometry.lengthMm;
  
  // Calculate spacing
  const numHoles = fbhSizes.length * metalTravel.distances.length;
  const spacing = blockLength / (numHoles + 1);
  
  let holeIndex = 0;
  
  for (const size of fbhSizes) {
    for (const depth of metalTravel.distances) {
      const xPosition = -blockLength / 2 + (holeIndex + 1) * spacing;
      
      holes.push({
        size,
        diameterMm: fbhSizeToMm(size),
        depthMm: depth,
        positionX: xPosition,
        positionY: 0,
        label: `${size}" @ ${depth.toFixed(0)}mm`
      });
      
      holeIndex++;
    }
  }
  
  return holes;
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

/**
 * Generate a complete calibration block recommendation
 */
export function generateCalibrationRecommendationV2(
  input: CalibrationRecommendationInput
): CalibrationRecommendationOutput {
  const warnings: string[] = [];
  const notes: string[] = [];
  
  // Step 1: Select calibration block type
  const blockSelection = selectCalibrationBlock(input);
  
  // Step 2: Select FBH sizes
  const fbhSelection = selectFBHSizes(input.thickness, input.acceptanceClass);
  
  // Step 3: Calculate metal travel
  const metalTravel = calculateMetalTravel(input.thickness);
  
  // Step 4: Get reference material
  const refMaterial = REFERENCE_MATERIALS[input.material];
  
  // Step 5: Recommend frequency
  const freqRec = input.frequency 
    ? { frequency: input.frequency, reasoning: "User specified" }
    : recommendFrequency(input.thickness, input.material);
  
  // Step 6: Generate block geometry
  const blockGeometry = generateBlockGeometry(
    blockSelection.category,
    input.thickness,
    metalTravel,
    input.outerDiameter
  );
  
  // Step 7: Generate FBH positions
  const fbhHoles = blockGeometry.type === 'iiw' 
    ? undefined 
    : generateFBHPositions(
        fbhSelection.sizes, 
        metalTravel, 
        blockGeometry as FlatBlockGeometry | CylindricalBlockGeometry
      );
  
  // Step 8: Build the spec
  const primaryBlock: CalibrationBlockSpec = {
    id: `CAL-${blockSelection.category.toUpperCase()}-${Date.now()}`,
    category: blockSelection.category,
    standardReference: getStandardReference(blockSelection.category, input.standard),
    geometry: blockGeometry,
    fbhHoles: fbhHoles,
    material: {
      specification: `${refMaterial.primary} (${refMaterial.specification})`,
      requiredMatch: 'same',
      surfaceFinish: 125
    },
    applicablePartTypes: [input.partType],
    beamTypes: [input.beamType || 'straight'],
    angleBeamAngles: input.beamType === 'angle' ? [input.angleBeamAngle || 45] : undefined,
    visualization: generateVisualizationData(blockSelection.category, blockGeometry, fbhHoles)
  };
  
  // Step 9: Calculate confidence
  const confidence = calculateConfidence(input, blockSelection);
  
  // Step 10: Add warnings if needed
  if (input.material === 'stainless_steel') {
    warnings.push("Austenitic material: Verify calibration block grain structure matches part.");
    notes.push("Consider BS EN 10228-4 requirements for austenitic materials.");
  }
  
  if (input.thickness > 150) {
    warnings.push("Thick section: Multiple DAC curves may be required.");
  }
  
  const geometryGroup = getGeometryGroup(input.partType);
  if (geometryGroup === 'COMPLEX') {
    warnings.push("Complex geometry: Custom procedure development recommended.");
  }
  
  // Build alternative blocks if available
  let alternativeBlocks: CalibrationBlockSpec[] | undefined;
  if (blockSelection.alternatives && blockSelection.alternatives.length > 0) {
    alternativeBlocks = blockSelection.alternatives.map(altCategory => ({
      ...primaryBlock,
      id: `CAL-${altCategory.toUpperCase()}-ALT-${Date.now()}`,
      category: altCategory,
      standardReference: getStandardReference(altCategory, input.standard),
      geometry: generateBlockGeometry(altCategory, input.thickness, metalTravel, input.outerDiameter),
      visualization: generateVisualizationData(altCategory, blockGeometry, fbhHoles)
    }));
  }
  
  // Step 11: Build angle beam calculations if applicable
  let angleBeamCalculations: CalibrationRecommendationOutput['angleBeamCalculations'] | undefined;
  
  if (input.beamType === 'angle' && blockSelection.angleBeamData) {
    const abData = blockSelection.angleBeamData;
    
    // Extract skip distances and sound paths
    const skipDistances: Record<number, number> = {};
    const soundPaths: Record<number, number> = {};
    
    for (const angleKey of Object.keys(abData.beamPathData)) {
      const angle = Number(angleKey);
      const beamPath = abData.beamPathData[angle];
      if (beamPath) {
        skipDistances[angle] = beamPath.skipDistance;
        soundPaths[angle] = beamPath.soundPath;
      }
    }
    
    angleBeamCalculations = {
      beamPaths: abData.beamPathData,
      sdhRecommendation: abData.sdhSize,
      notchRecommendation: abData.notchSpec,
      wedgeRequirements: abData.wedgeRequirements,
      criticalAngles: abData.criticalAngles || undefined,
      skipDistances,
      soundPaths
    };
    
    // Add angle beam specific warnings
    warnings.push(...abData.warnings);
    notes.push(...abData.calibrationNotes);
  }
  
  return {
    primaryBlock,
    alternativeBlocks,
    standardCompliance: {
      standard: input.standard,
      reference: primaryBlock.standardReference,
      tableReference: "Table VI (FBH sizes), Table IV (Metal Travel)",
      figureReference: getFigureReference(blockSelection.category)
    },
    reasoning: {
      geometryGroup: geometryGroup || 'UNKNOWN',
      blockSelection: blockSelection.reasoning,
      fbhSelection: fbhSelection.reasoning,
      materialSelection: `Reference material: ${refMaterial.primary} per Table I`,
      frequencySelection: freqRec.reasoning,
      specialConsiderations: warnings.length > 0 ? warnings : undefined
    },
    angleBeamCalculations,
    confidence,
    warnings: warnings.length > 0 ? warnings : undefined,
    notes: notes.length > 0 ? notes : undefined
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStandardReference(category: CalibrationBlockCategory, standard: StandardType): string {
  const references: Record<CalibrationBlockCategory, string> = {
    'flat_fbh': `${standard} Figure 4 - Flat Block with FBH`,
    'curved_fbh': `${standard} - Curved Reference Block`,
    'cylinder_fbh': `${standard} Figure 6 - Cylinder Block with FBH`,
    'cylinder_notched': `${standard} Figure 5 - Notched Cylinder Block`,
    'step_wedge': `${standard} - Step Wedge Block`,
    'iow_block': 'IOW (Institute of Welding) Block',
    'iiw_v1': 'IIW Type 1 Block (ISO 2400)',
    'iiw_v2': 'IIW Type 2 Block (ISO 7963)',
    'dsc_block': 'DSC (Distance/Sensitivity) Block',
    'aws_block': 'AWS D1.1 Reference Block',
    'custom': 'Custom Block per Specification'
  };
  return references[category];
}

function getFigureReference(category: CalibrationBlockCategory): string {
  const figures: Record<CalibrationBlockCategory, string> = {
    'flat_fbh': 'Figure 4',
    'curved_fbh': 'Figure 4 (curved variant)',
    'cylinder_fbh': 'Figure 6',
    'cylinder_notched': 'Figure 5',
    'step_wedge': 'Step Wedge',
    'iow_block': 'IOW Standard',
    'iiw_v1': 'IIW V1 (ISO 2400)',
    'iiw_v2': 'IIW V2 (ISO 7963)',
    'dsc_block': 'DSC Standard',
    'aws_block': 'AWS Figure',
    'custom': 'Custom'
  };
  return figures[category];
}

function calculateConfidence(
  input: CalibrationRecommendationInput,
  blockSelection: { category: CalibrationBlockCategory; reasoning: string }
): number {
  let confidence = 95;
  
  // Standard materials get higher confidence
  if (input.material === 'custom') confidence -= 15;
  if (input.material === 'stainless_steel') confidence -= 5; // Austenitic complexity
  
  // Extreme thicknesses reduce confidence
  if (input.thickness < 6.35 || input.thickness > 200) confidence -= 10;
  
  // Complex geometries
  const geometryGroup = getGeometryGroup(input.partType);
  if (geometryGroup === 'COMPLEX') confidence -= 20;
  
  // Custom blocks
  if (blockSelection.category === 'custom') confidence -= 15;
  
  return Math.max(confidence, 50);
}

/**
 * Generate visualization data for the calibration block
 */
function generateVisualizationData(
  category: CalibrationBlockCategory,
  geometry: FlatBlockGeometry | CylindricalBlockGeometry | IIWBlockGeometry,
  fbhHoles?: FBHHole[]
): CalibrationBlockSpec['visualization'] {
  // This generates data for both 2D SVG drawings and 3D model
  
  const holes3D = fbhHoles?.map(hole => ({
    x: hole.positionX,
    y: hole.depthMm / 2,
    z: hole.positionY,
    radius: hole.diameterMm / 2,
    depth: hole.depthMm
  })) || [];
  
  // Generate basic 3D model data
  let vertices: number[][] = [];
  let faces: number[][] = [];
  
  if (geometry.type === 'flat') {
    const { lengthMm: l, widthMm: w, heightMm: h } = geometry;
    // Box vertices
    vertices = [
      [-l/2, 0, -w/2], [l/2, 0, -w/2], [l/2, 0, w/2], [-l/2, 0, w/2],  // Bottom
      [-l/2, h, -w/2], [l/2, h, -w/2], [l/2, h, w/2], [-l/2, h, w/2]   // Top
    ];
    faces = [
      [0, 1, 2, 3], [4, 5, 6, 7],  // Bottom, Top
      [0, 1, 5, 4], [2, 3, 7, 6],  // Front, Back
      [0, 3, 7, 4], [1, 2, 6, 5]   // Left, Right
    ];
  } else if (geometry.type === 'cylindrical') {
    // Simplified cylinder representation
    const { outerDiameterMm: od, lengthMm: l } = geometry;
    const r = od / 2;
    const segments = 16;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
      vertices.push([Math.cos(angle) * r, l, Math.sin(angle) * r]);
    }
  }
  
  return {
    drawing2D: {
      frontView: {
        viewBox: "0 0 200 100",
        paths: [],
        dimensionLines: [],
        labels: []
      },
      topView: {
        viewBox: "0 0 200 100",
        paths: [],
        dimensionLines: [],
        labels: []
      }
    },
    model3D: {
      vertices,
      faces,
      holePositions: holes3D
    },
    dimensions: []
  };
}

// Export for backward compatibility
export { generateCalibrationRecommendationV2 as generateCalibrationRecommendation };

// Re-export angle beam calculator functions for direct use
export {
  calculateBeamPath,
  calculateWedgeAngle,
  calculateCriticalAngles,
  getRecommendedSDHSize,
  getRecommendedNotch,
  selectAngleBeamCalibrationBlock,
  getMaterialVelocity,
  MATERIAL_VELOCITIES,
  STANDARD_WEDGES,
  ANGLE_BEAM_BLOCKS
} from "./angleBeamCalculator";

// Export types
export type {
  AngleBeamCalibrationRequest,
  AngleBeamCalibrationResult,
  BeamPathResult,
  SDHRecommendation,
  NotchRecommendation,
  MaterialVelocity,
  WedgeSpecification,
  AngleBeamBlockSpec
} from "./angleBeamCalculator";