import { MaterialType, PartGeometry, StandardType, AcceptanceClass } from "@/types/techniqueSheet";

// Material properties database
interface MaterialProperties {
  velocity: number; // mm/µs (longitudinal wave)
  velocityShear: number; // mm/µs (shear wave)
  acousticImpedance: number; // MRayls
  attenuation: number; // dB/m at 5MHz
  density: number; // g/cm³
  surfaceCondition: string;
  typicalSpecs: string[];
}

export const materialDatabase: Record<MaterialType, MaterialProperties> = {
  aluminum: {
    velocity: 6.32,
    velocityShear: 3.08,
    acousticImpedance: 17.0,
    attenuation: 1.5,
    density: 2.7,
    surfaceCondition: "As-machined or better, Ra ≤ 6.3 μm",
    typicalSpecs: ["7075-T6 (QQ-A200/11)", "2024 (QQ-A-200/3)", "6061-T6", "2219-T87"]
  },
  steel: {
    velocity: 5.90,
    velocityShear: 3.23,
    acousticImpedance: 46.0,
    attenuation: 3.0,
    density: 7.8,
    surfaceCondition: "Ground or machined, Ra ≤ 3.2 μm",
    typicalSpecs: ["4340 annealed (MIL-S-5000)", "4130", "17-4 PH", "15-5 PH"]
  },
  stainless_steel: {
    velocity: 5.79,
    velocityShear: 3.10,
    acousticImpedance: 45.4,
    attenuation: 2.5,
    density: 7.9,
    surfaceCondition: "Ground or machined, Ra ≤ 3.2 μm, passivated acceptable",
    typicalSpecs: ["304 (AMS 5513)", "316 (AMS 5524)", "17-4 PH (AMS 5604)", "15-5 PH (AMS 5659)", "410", "420"]
  },
  titanium: {
    velocity: 6.10,
    velocityShear: 3.12,
    acousticImpedance: 27.3,
    attenuation: 4.5,
    density: 4.5,
    surfaceCondition: "Machined, Ra ≤ 6.3 μm, chemical milled acceptable",
    typicalSpecs: ["Ti-6Al-4V annealed (AMS 4928)", "Ti-6Al-4V STA", "Ti-5Al-2.5Sn", "CP Ti Grade 2"]
  },
  magnesium: {
    velocity: 5.77,
    velocityShear: 3.05,
    acousticImpedance: 10.0,
    attenuation: 8.0,
    density: 1.74,
    surfaceCondition: "Machined, protective coating acceptable if <0.05mm",
    typicalSpecs: ["ZK60A (QQ-M-31)", "AZ31B", "AZ80A", "ZE41A"]
  },
  nickel_alloy: {
    velocity: 5.72,
    velocityShear: 3.05,
    acousticImpedance: 47.5,
    attenuation: 3.5,
    density: 8.3,
    surfaceCondition: "Ground or machined, Ra ≤ 3.2 μm",
    typicalSpecs: ["Inconel 718 (AMS 5662)", "Waspaloy (AMS 5544)", "Inconel 625 (AMS 5666)", "Rene 41", "Hastelloy X"]
  },
  custom: {
    velocity: 5.90,
    velocityShear: 3.20,
    acousticImpedance: 30.0,
    attenuation: 3.0,
    density: 5.0,
    surfaceCondition: "Custom material - verify surface condition",
    typicalSpecs: ["Custom Specification"]
  }
};

// Standard-based auto-fill rules
interface StandardRules {
  defaultAcceptanceClass: AcceptanceClass;
  minThickness: number; // mm
  typicalFrequencies: string[];
  couplantRecommendations: string[];
  scanCoverageDefault: number; // percentage
  linearityRequirements: {
    vertical: { min: number; max: number };
    horizontal: { min: number };
  };
}

export const standardRules: Record<StandardType, StandardRules> = {
  "MIL-STD-2154": {
    defaultAcceptanceClass: "A",
    minThickness: 6.35,
    typicalFrequencies: ["2.25", "5.0", "10.0"],
    couplantRecommendations: ["Water (Immersion)", "Glycerin", "Commercial Gel (Sono 600)"],
    scanCoverageDefault: 100,
    linearityRequirements: {
      vertical: { min: 5, max: 98 },
      horizontal: { min: 90 }
    }
  },
  "AMS-STD-2154E": {
    defaultAcceptanceClass: "A",
    minThickness: 6.35,
    typicalFrequencies: ["2.25", "5.0", "10.0"],
    couplantRecommendations: ["Water (Immersion)", "Glycerin", "Commercial Gel (Sono 600)"],
    scanCoverageDefault: 100,
    linearityRequirements: {
      vertical: { min: 5, max: 98 },
      horizontal: { min: 90 }
    }
  },
  "ASTM-A388": {
    defaultAcceptanceClass: "B",
    minThickness: 25.4,
    typicalFrequencies: ["1.0", "2.25", "5.0"],
    couplantRecommendations: ["SAE No. 20 Motor Oil", "SAE No. 30 Motor Oil", "Glycerin", "Pine Oil", "Water"],
    scanCoverageDefault: 100,
    linearityRequirements: {
      vertical: { min: 10, max: 95 },
      horizontal: { min: 85 }
    }
  },
  "BS-EN-10228-3": {
    defaultAcceptanceClass: "A", // Maps to Class 3 (standard quality)
    minThickness: 10,
    typicalFrequencies: ["1.0", "2.0", "4.0"],
    couplantRecommendations: ["Oil (mineral)", "Water with wetting agent", "Glycerin", "Cellulose paste", "Commercial couplants"],
    scanCoverageDefault: 100,
    linearityRequirements: {
      vertical: { min: 80, max: 100 },
      horizontal: { min: 0 } // Not specified in standard
    }
  },
  "BS-EN-10228-4": {
    defaultAcceptanceClass: "A", // Maps to Class 3 (standard quality)
    minThickness: 20,
    typicalFrequencies: ["0.5", "1.0", "2.0"],
    couplantRecommendations: ["Oil (mineral)", "Water with wetting agent", "Glycerin", "Commercial couplants"],
    scanCoverageDefault: 100,
    linearityRequirements: {
      vertical: { min: 80, max: 100 },
      horizontal: { min: 0 } // Not specified in standard
    }
  }
};

// Part geometry-based recommendations
interface GeometryRecommendations {
  calibrationBlockType: string[];
  scanPattern: string;
  transducerType: "immersion" | "contact" | "dual_element";
  specialConsiderations: string;
}

export const geometryRecommendations: Record<PartGeometry, GeometryRecommendations> = {
  // ============= BASE GEOMETRIES =============
  box: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Raster scan or straight beam perpendicular to surface",
    transducerType: "immersion",
    specialConsiderations: "Versatile geometry - adjust scan pattern based on W/T ratio"
  },
  cylinder: {
    calibrationBlockType: ["flat_block", "cylinder_fbh"],
    scanPattern: "Radial scan from circumference and/or axial scan",
    transducerType: "immersion",
    specialConsiderations: "Full circumferential coverage - use curved block if diameter permits"
  },
  tube: {
    calibrationBlockType: ["cylinder_fbh", "cylinder_notched", "curved_block"],
    scanPattern: "Helical or circumferential scan",
    transducerType: "immersion",
    specialConsiderations: "Check both ID and OD surfaces, wall thickness variation"
  },
  rectangular_tube: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Full perimeter scan with indexed coverage",
    transducerType: "contact",
    specialConsiderations: "Check all four faces and corners"
  },
  hexagon: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Scan from three adjacent faces minimum",
    transducerType: "contact",
    specialConsiderations: "When T exceeds attenuation limit, scan from opposite sides"
  },
  sphere: {
    calibrationBlockType: ["curved_block"],
    scanPattern: "Multi-angle spherical coverage",
    transducerType: "immersion",
    specialConsiderations: "Requires immersion tank with positioning system"
  },
  cone: {
    calibrationBlockType: ["flat_block", "curved_block"],
    scanPattern: "Axial and circumferential",
    transducerType: "immersion",
    specialConsiderations: "Conical shape requires angle-compensated scanning"
  },

  // ============= LEGACY MAPPINGS =============
  plate: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Raster scan, 0° and 90° directions",
    transducerType: "immersion",
    specialConsiderations: "If W/T > 5, check laminar discontinuities. If W or T > 228.6mm, scan from opposite side."
  },
  flat_bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Straight beam perpendicular to surface",
    transducerType: "immersion",
    specialConsiderations: "Same as plate - If W/T > 5. Surface resolution requirements for thick sections."
  },
  rectangular_bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Scan from two adjacent sides",
    transducerType: "contact",
    specialConsiderations: "If W/T < 5, scan from two adjacent sides. If T or W > 228.6mm, scan from opposite sides."
  },
  round_bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Radial scan from circumference",
    transducerType: "immersion",
    specialConsiderations: "Full circumferential coverage required. Axial scan from end face."
  },
  round_forging_stock: {
    calibrationBlockType: ["flat_block", "curved_block"],
    scanPattern: "Radial and axial scans",
    transducerType: "immersion",
    specialConsiderations: "Consider grain structure orientation. Full coverage required."
  },
  ring_forging: {
    calibrationBlockType: ["curved_block", "cylinder_fbh"],
    scanPattern: "Radial, axial, and circumferential shear wave",
    transducerType: "immersion",
    specialConsiderations: "CRITICAL: If thickness > 20% OD or L/T < 5, special scans required. Circumferential shear wave per Appendix A."
  },
  disk_forging: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "From flat face and radially from circumference",
    transducerType: "immersion",
    specialConsiderations: "Scan from at least one flat face. Radial scan from circumference when practical."
  },
  hex_bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Scan from three adjacent faces",
    transducerType: "contact",
    specialConsiderations: "When T exceeds attenuation limit, scan from opposite sides. Three-face coverage minimum."
  },
  bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Longitudinal scan along bar axis",
    transducerType: "contact",
    specialConsiderations: "Generic bar - use specific type (round_bar, rectangular_bar, etc.) if known"
  },
  forging: {
    calibrationBlockType: ["curved_block", "flat_block"],
    scanPattern: "Contour following, multiple orientations",
    transducerType: "contact",
    specialConsiderations: "Generic forging - use specific type (ring_forging, disk_forging, etc.) if known. Match calibration block to part curvature."
  },
  ring: {
    calibrationBlockType: ["curved_block", "cylinder_fbh"],
    scanPattern: "Circumferential scan, axial and radial",
    transducerType: "immersion",
    specialConsiderations: "Generic ring - use ring_forging if applicable. Curvature compensation required."
  },
  disk: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Radial and circumferential patterns",
    transducerType: "immersion",
    specialConsiderations: "Generic disk - use disk_forging if applicable. Center bore and rim inspection critical."
  },
  sheet: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Two-axis raster scan",
    transducerType: "immersion",
    specialConsiderations: "Similar to plate. Check laminar discontinuities."
  },
  slab: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Two-axis raster with diagonal passes",
    transducerType: "immersion",
    specialConsiderations: "Heavy section, may require multi-side scanning."
  },
  square_bar: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Scan from adjacent faces",
    transducerType: "contact",
    specialConsiderations: "Similar to rectangular bar, ensure corner coverage."
  },
  pipe: {
    calibrationBlockType: ["cylinder_fbh", "cylinder_notched"],
    scanPattern: "Helical or circumferential scan",
    transducerType: "immersion",
    specialConsiderations: "Same as tube. Check both ID and OD surfaces."
  },
  shaft: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial and circumferential scans",
    transducerType: "immersion",
    specialConsiderations: "Localized radial scans at critical sections (shoulders, keyways)."
  },
  billet: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Two-axis raster in orthogonal directions",
    transducerType: "immersion",
    specialConsiderations: "Add diagonal passes if needed. Large cross-section."
  },
  block: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Two-axis raster through-thickness",
    transducerType: "immersion",
    specialConsiderations: "Similar to billet. Check for internal voids."
  },
  sleeve: {
    calibrationBlockType: ["cylinder_fbh"],
    scanPattern: "Circumferential and radial through wall",
    transducerType: "immersion",
    specialConsiderations: "Short hollow cylinder. Similar to tube but shorter axial length."
  },
  bushing: {
    calibrationBlockType: ["cylinder_fbh"],
    scanPattern: "Circumferential and radial scans",
    transducerType: "contact",
    specialConsiderations: "Short hollow cylinder. Check wall thickness uniformity."
  },
  pyramid: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Raster scan on accessible faces with indexed coverage",
    transducerType: "immersion",
    specialConsiderations: "Treat as prismatic block; ensure apex region coverage and multiple orientations as needed."
  },
  ellipse: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Radial coverage with indexed circumferential positions",
    transducerType: "immersion",
    specialConsiderations: "Elliptical section behaves like cylinder with varying curvature; maintain coupling and normal incidence where possible."
  },
  irregular: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Drawing-specific with contour following",
    transducerType: "contact",
    specialConsiderations: "Irregular geometry requires adaptive scan planning; verify coverage zones against drawing."
  },
  l_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial along legs with indexed transverse scans",
    transducerType: "contact",
    specialConsiderations: "Scan both legs separately; pay attention to corner/fillet regions."
  },
  t_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial along stem and flange with indexed scans",
    transducerType: "contact",
    specialConsiderations: "T-section requires multiple orientations to cover stem/flange intersection."
  },
  i_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial with indexed scans on flanges and web",
    transducerType: "contact",
    specialConsiderations: "I-section requires scanning from multiple surfaces to cover web/flange junctions."
  },
  u_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial and transverse indexed scans",
    transducerType: "contact",
    specialConsiderations: "U-channel requires coverage of all faces; verify web-to-flange transition areas."
  },
  z_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial with indexed transverse scans",
    transducerType: "contact",
    specialConsiderations: "Z-section requires multi-surface coverage; validate coupling on offsets."
  },
  z_section: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial with indexed transverse scans",
    transducerType: "contact",
    specialConsiderations: "Z-section requires multi-surface coverage; validate coupling on offsets."
  },
  custom_profile: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Drawing-specific",
    transducerType: "contact",
    specialConsiderations: "Custom profile - follow engineering drawing and inspect each feature separately."
  },
  extrusion_l: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial along extrusion, indexed transverse scans",
    transducerType: "contact",
    specialConsiderations: "Scan flanges and web separately. Check corners/fillets."
  },
  extrusion_t: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial and indexed transverse scans per feature",
    transducerType: "contact",
    specialConsiderations: "T-section requires multi-orientation scans."
  },
  extrusion_i: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial with indexed scans on flanges and web",
    transducerType: "contact",
    specialConsiderations: "I-beam geometry, scan from multiple surfaces."
  },
  extrusion_u: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial and transverse indexed scans",
    transducerType: "contact",
    specialConsiderations: "U-channel requires coverage of all faces."
  },
  extrusion_channel: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial with indexed transverse scans",
    transducerType: "contact",
    specialConsiderations: "Similar to U-extrusion. Check web and flanges."
  },
  extrusion_angle: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial along legs, radial from edges",
    transducerType: "contact",
    specialConsiderations: "Angle section requires scans along both legs."
  },
  square_tube: {
    calibrationBlockType: ["flat_block", "curved_block"],
    scanPattern: "Full perimeter scan",
    transducerType: "contact",
    specialConsiderations: "Check all four faces uniformly."
  },
  rectangular_forging_stock: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Axial and transverse",
    transducerType: "immersion",
    specialConsiderations: "Check for forging defects and grain structure."
  },
  hub: {
    calibrationBlockType: ["cylinder_fbh", "flat_block"],
    scanPattern: "Radial and circumferential",
    transducerType: "immersion",
    specialConsiderations: "Complex geometry requires multi-angle approach."
  },
  near_net_forging: {
    calibrationBlockType: ["flat_block", "curved_block"],
    scanPattern: "Contour following with indexed coverage",
    transducerType: "immersion",
    specialConsiderations: "Near-net shape requires adaptive scanning."
  },
  machined_component: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Drawing-specific",
    transducerType: "contact",
    specialConsiderations: "Follow parent form inspection method."
  },
  impeller: {
    calibrationBlockType: ["flat_block", "curved_block", "cylinder_notched"],
    scanPattern: "Multi-zone: Hub (30% OD), Web (60% OD), Rim (100% OD). Bore: circumferential shear wave 45°",
    transducerType: "immersion",
    specialConsiderations: "CRITICAL: Stepped geometry requires zone-by-zone inspection with separate gate settings. Hub=full height, Web=60% height, Rim=30% height. R-surfaces need contour-following. Bore inspection requires cylinder notched block (Figure 5). Class AAA per AMS-STD-2154."
  },
  blisk: {
    calibrationBlockType: ["flat_block", "curved_block", "cylinder_notched"],
    scanPattern: "Disk body: radial/axial. Blade roots: focused beam. Bore: circumferential shear wave 45°",
    transducerType: "immersion",
    specialConsiderations: "CRITICAL: Dual inspection zones - Disk body + Blade roots. Blade roots are high stress concentration areas requiring focused beam. Bore inspection requires cylinder notched block (Figure 5). Blade envelope extends 15% beyond disk OD. Class AAA mandatory per AMS-STD-2154."
  },
  custom: {
    calibrationBlockType: ["flat_block"],
    scanPattern: "Drawing-specific",
    transducerType: "contact",
    specialConsiderations: "Refer to engineering drawing and customer specifications."
  }
};

// Frequency selection based on thickness
export function getRecommendedFrequency(thickness: number, material?: MaterialType): string {
  // Material attenuation adjustment
  let attenuationFactor = 1.0;
  if (material) {
    const props = materialDatabase[material];
    // Higher attenuation materials need lower frequencies
    if (props && props.attenuation > 5) attenuationFactor = 0.5;
    else if (props && props.attenuation > 3) attenuationFactor = 0.75;
  }

  const adjustedThickness = thickness / attenuationFactor;

  if (adjustedThickness < 12.7) return "10.0";
  if (adjustedThickness < 25.4) return "5.0";
  if (adjustedThickness < 50.8) return "2.25";
  return "1.0";
}

// Resolution calculation based on frequency
export function getResolutionValues(frequency: string): { entry: number; back: number } {
  const resolutions: Record<string, { entry: number; back: number }> = {
    "1.0": { entry: 0.5, back: 0.2 },
    "2.25": { entry: 0.25, back: 0.1 },
    "5.0": { entry: 0.125, back: 0.05 },
    "10.0": { entry: 0.05, back: 0.025 },
    "15.0": { entry: 0.05, back: 0.025 },
  };
  return resolutions[frequency] || { entry: 0.125, back: 0.05 };
}

// Metal travel distance calculation
export function calculateMetalTravel(thickness: number): number {
  // Typically 2x to 4x thickness, rounded to nearest 5mm
  const travel = thickness * 3;
  return Math.round(travel / 5) * 5;
}

// Scan index calculation (overlap)
export function calculateScanIndex(transducerDiameter: number, coveragePercent: number = 100): number {
  // Scan index is spacing between scan lines
  // For 100% coverage, typically 80% of beam diameter
  // For 200% coverage (50% overlap), use 50% of beam diameter
  const overlapFactor = coveragePercent / 100;
  const indexInches = transducerDiameter * (2 - overlapFactor);
  // Convert to mm
  return Math.round(indexInches * 25.4 * 10) / 10;
}

// ============================================================================
// DEPRECATED - DO NOT USE
// The correct acceptance criteria are in src/data/standardsDifferences.ts
// (acceptanceCriteriaByStandard) which uses proper AMS-STD-2154E Table 6 values
// ============================================================================
// @deprecated Use acceptanceCriteriaByStandard from standardsDifferences.ts instead
interface AcceptanceLimits {
  singleDiscontinuity: string;
  multipleDiscontinuities: string;
  linearDiscontinuity: string;
  backReflectionLoss: number;
  noiseLevel: string;
}

/**
 * @deprecated This data uses incorrect DAC% format.
 * Use acceptanceCriteriaByStandard from '@/data/standardsDifferences' instead,
 * which has the correct AMS-STD-2154E Table 6 FBH-based criteria.
 */
export const acceptanceLimits: Record<AcceptanceClass, AcceptanceLimits> = {
  // Values per AMS-STD-2154E Table VI (corrected January 2026)
  "AAA": {
    singleDiscontinuity: "1/64\" (0.4mm) FBH response",
    multipleDiscontinuities: "1/64\" (0.4mm) FBH (centers <1\" apart)",
    linearDiscontinuity: "1/64\" (0.4mm) FBH, 1/8\" max length",
    backReflectionLoss: 50,
    noiseLevel: "Alarm level"
  },
  "AA": {
    singleDiscontinuity: "3/64\" (1.2mm) FBH response",
    multipleDiscontinuities: "2/64\" (0.8mm) FBH (centers <1\" apart)",
    linearDiscontinuity: "2/64\" (0.8mm) FBH, 1/2\" max length",
    backReflectionLoss: 50,
    noiseLevel: "Alarm level"
  },
  "A": {
    singleDiscontinuity: "5/64\" (2.0mm) FBH response",
    multipleDiscontinuities: "2/64\" (0.8mm) FBH (centers <1\" apart)",
    linearDiscontinuity: "3/64\" (1.2mm) FBH, 1\" max length",
    backReflectionLoss: 50,
    noiseLevel: "Alarm level"
  },
  "B": {
    singleDiscontinuity: "8/64\" (3.2mm) FBH response",
    multipleDiscontinuities: "3/64\" (1.2mm) FBH (centers <1\" apart)",
    linearDiscontinuity: "5/64\" (2.0mm) FBH, 1\" max length",
    backReflectionLoss: 50,
    noiseLevel: "Alarm level"
  },
  "C": {
    singleDiscontinuity: "8/64\" (3.2mm) FBH response",
    multipleDiscontinuities: "5/64\" (2.0mm) FBH",
    linearDiscontinuity: "Not applicable",
    backReflectionLoss: 50,
    noiseLevel: "Alarm level"
  }
};

// Couplant recommendation based on inspection type and material
export function getCouplantRecommendation(
  transducerType: string,
  material?: MaterialType,
  temperature?: number
): string {
  if (transducerType === "immersion") {
    if (temperature && temperature > 40) {
      return "Water with rust inhibitor (heated)";
    }
    return "Water (distilled or deionized)";
  }

  if (material === "magnesium") {
    return "Water-based gel (non-corrosive)";
  }

  return "Commercial ultrasonic gel (e.g., Sono 600)";
}

// FBH size recommendation based on material and frequency
export function getFBHSizeRecommendation(
  material: MaterialType,
  frequency: string,
  thickness: number
): string[] {
  const freq = parseFloat(frequency);
  const wavelength = materialDatabase[material].velocity / freq;
  
  // FBH diameter should be 1/4 to 1 wavelength
  const minFBH = Math.round(wavelength * 0.25 * 10) / 10;
  const maxFBH = Math.round(wavelength * 10) / 10;
  
  // Standard FBH sizes from the standard
  const standardSizes = [1.6, 2.0, 2.4, 3.2, 4.0, 4.8, 6.4, 8.0, 9.5];
  
  // Filter to recommended range
  const recommended = standardSizes.filter(size => size >= minFBH && size <= maxFBH);
  
  // If thickness-based selection needed
  if (thickness < 25) {
    return recommended.filter(s => s <= 4.8).map(s => `${s}mm (${(s/25.4).toFixed(3)}")`);
  }
  
  return recommended.slice(0, 3).map(s => `${s}mm (${(s/25.4).toFixed(3)}")`);
}