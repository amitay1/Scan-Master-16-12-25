import { MaterialType, PartGeometry, StandardType, AcceptanceClass } from "@/types/techniqueSheet";

// ============= TABLE VI - ULTRASONIC CLASSES (MIL-STD-2154) =============
export interface AcceptanceLimitsEnhanced {
  singleDiscontinuity: string;
  multipleDiscontinuities: string;
  linearDiscontinuity: string;
  backReflectionLoss: number;
  noiseLevel: string;
  specialNotes?: string;
}

export const TABLE_VI_ACCEPTANCE_LIMITS: Record<AcceptanceClass, AcceptanceLimitsEnhanced> = {
  "AAA": {
    singleDiscontinuity: "2% or less of DAC curve",
    multipleDiscontinuities: "1% or less of DAC curve",
    linearDiscontinuity: "Not permitted",
    backReflectionLoss: 2,
    noiseLevel: "Grass height shall not exceed 5% of full screen height",
    specialNotes: "Titanium: Maximum permissible back reflection loss is 6 dB"
  },
  "AA": {
    singleDiscontinuity: "5% or less of DAC curve",
    multipleDiscontinuities: "2% or less of DAC curve",
    linearDiscontinuity: "Not permitted",
    backReflectionLoss: 4,
    noiseLevel: "Grass height shall not exceed 10% of full screen height",
    specialNotes: "Titanium: Maximum permissible back reflection loss is 8 dB"
  },
  "A": {
    singleDiscontinuity: "8% or less of DAC curve",
    multipleDiscontinuities: "5% or less of DAC curve",
    linearDiscontinuity: "Linear indications greater than 1/4 inch not permitted",
    backReflectionLoss: 6,
    noiseLevel: "Grass height shall not exceed 15% of full screen height",
    specialNotes: "Titanium: Maximum permissible back reflection loss is 10 dB"
  },
  "B": {
    singleDiscontinuity: "15% or less of DAC curve",
    multipleDiscontinuities: "8% or less of DAC curve",
    linearDiscontinuity: "Linear indications greater than 1/2 inch not permitted",
    backReflectionLoss: 10,
    noiseLevel: "Grass height shall not exceed 20% of full screen height",
    specialNotes: "Titanium: Maximum permissible back reflection loss is 14 dB"
  },
  "C": {
    singleDiscontinuity: "25% or less of DAC curve",
    multipleDiscontinuities: "15% or less of DAC curve",
    linearDiscontinuity: "Linear indications greater than 1 inch not permitted",
    backReflectionLoss: 15,
    noiseLevel: "Grass height shall not exceed 25% of full screen height",
    specialNotes: "Titanium: Maximum permissible back reflection loss is 20 dB"
  }
};

// ============= SOUND BEAM DIRECTION RULES =============
export interface GeometryInspectionRules {
  displayName: string;
  scanDirection: string[];
  waveMode: string[];
  conditions: string[];
  specialNotes: string[];
  diagramReference?: string;
}

export const GEOMETRY_INSPECTION_RULES: Record<PartGeometry, GeometryInspectionRules> = {
  // ============= BASE GEOMETRIES =============
  box: {
    displayName: "Box (Plates, Bars, Blocks)",
    scanDirection: ["Straight beam perpendicular to surface", "Multi-axis raster"],
    waveMode: ["Longitudinal"],
    conditions: ["Adjust scan pattern based on W/T ratio", "Consider surface resolution requirements"],
    specialNotes: ["Versatile geometry - use dimensional parameters to adapt inspection"],
    diagramReference: "Base Geometry - Box"
  },
  cylinder: {
    displayName: "Cylinder (Bars, Shafts, Disks)",
    scanDirection: ["Radial scan from circumference", "Axial scan", "Circumferential scan"],
    waveMode: ["Longitudinal"],
    conditions: ["Full coverage required", "Use appropriate calibration block"],
    specialNotes: ["Adapt to length/diameter ratio"],
    diagramReference: "Base Geometry - Cylinder"
  },
  tube: {
    displayName: "Tube (Hollow Cylinders, Rings)",
    scanDirection: ["Helical scan", "Circumferential scan", "Radial through wall"],
    waveMode: ["Longitudinal"],
    conditions: ["Check both ID and OD surfaces", "Monitor wall thickness variation"],
    specialNotes: ["Immersion technique preferred"],
    diagramReference: "Base Geometry - Tube"
  },
  rectangular_tube: {
    displayName: "Rectangular Tube",
    scanDirection: ["Perimeter scan", "Indexed coverage"],
    waveMode: ["Longitudinal"],
    conditions: ["Check all four faces"],
    specialNotes: ["Inspect corners and welds if applicable"],
    diagramReference: "Base Geometry - Rectangular Tube"
  },
  hexagon: {
    displayName: "Hexagon Bar",
    scanDirection: ["From three adjacent faces minimum"],
    waveMode: ["Longitudinal"],
    conditions: ["Scan with straight beam from three adjacent faces"],
    specialNotes: ["May require scanning from opposite sides for thick sections"],
    diagramReference: "Base Geometry - Hexagon"
  },
  sphere: {
    displayName: "Sphere",
    scanDirection: ["Multi-angle spherical"],
    waveMode: ["Longitudinal"],
    conditions: ["Immersion required"],
    specialNotes: ["Positioning system needed"],
    diagramReference: "Base Geometry - Sphere"
  },
  cone: {
    displayName: "Cone",
    scanDirection: ["Axial", "Circumferential"],
    waveMode: ["Longitudinal"],
    conditions: ["Angle-compensated scanning"],
    specialNotes: ["Account for taper angle"],
    diagramReference: "Base Geometry - Cone"
  },

  // ============= ADDITIONAL GEOMETRIES / PROFILES =============
  pyramid: {
    displayName: "Pyramid",
    scanDirection: ["Raster scan on accessible faces", "Indexed coverage / multiple orientations"],
    waveMode: ["Longitudinal"],
    conditions: ["Treat as prismatic block; ensure coverage near apex"],
    specialNotes: ["May require multiple setups to maintain normal incidence"],
    diagramReference: "Special Geometry - Pyramid"
  },
  ellipse: {
    displayName: "Ellipse",
    scanDirection: ["Radial scan from perimeter", "Indexed circumferential positions"],
    waveMode: ["Longitudinal"],
    conditions: ["Varying curvature - adjust coupling and beam entry"],
    specialNotes: ["Similar to cylinder, but curvature changes with angle"],
    diagramReference: "Special Geometry - Ellipse"
  },
  irregular: {
    displayName: "Irregular",
    scanDirection: ["Drawing-specific contour following", "Feature-by-feature inspection"],
    waveMode: ["Longitudinal"],
    conditions: ["Define scan zones from drawing/CAD"],
    specialNotes: ["Validate coverage map against part geometry"],
    diagramReference: "Special Geometry - Irregular"
  },
  l_profile: {
    displayName: "L-Profile (Angle)",
    scanDirection: ["Axial along legs", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Scan both legs separately"],
    specialNotes: ["Pay attention to corner/fillet regions"],
    diagramReference: "Profile - L"
  },
  t_profile: {
    displayName: "T-Profile",
    scanDirection: ["Axial along stem and flange", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Multiple orientations to cover stem/flange intersection"],
    specialNotes: ["Ensure coverage of junction region"],
    diagramReference: "Profile - T"
  },
  i_profile: {
    displayName: "I-Profile",
    scanDirection: ["Axial along web and flanges", "Indexed scans per surface"],
    waveMode: ["Longitudinal"],
    conditions: ["Scan from multiple surfaces"],
    specialNotes: ["Web/flange junctions are critical"],
    diagramReference: "Profile - I"
  },
  u_profile: {
    displayName: "U-Profile (Channel)",
    scanDirection: ["Axial along channel", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Cover web and both flanges"],
    specialNotes: ["Verify coupling on inside corner radii"],
    diagramReference: "Profile - U"
  },
  z_profile: {
    displayName: "Z-Profile",
    scanDirection: ["Axial along profile", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Cover offsets and all faces"],
    specialNotes: ["Check coupling across step changes"],
    diagramReference: "Profile - Z"
  },
  z_section: {
    displayName: "Z-Section",
    scanDirection: ["Axial along section", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Cover offsets and all faces"],
    specialNotes: ["Check coupling across step changes"],
    diagramReference: "Profile - Z Section"
  },
  custom_profile: {
    displayName: "Custom Profile",
    scanDirection: ["Drawing-specific", "Feature-by-feature inspection"],
    waveMode: ["Longitudinal"],
    conditions: ["Define scan zones from drawing"],
    specialNotes: ["Use conservative overlap and validate coverage"],
    diagramReference: "Profile - Custom"
  },

  // ============= LEGACY MAPPINGS =============
  plate: {
    displayName: "Plate and Flat Bar",
    scanDirection: ["Straight beam perpendicular to surface"],
    waveMode: ["Longitudinal"],
    conditions: [
      "If W/T > 5, scan with straight beam as shown",
      "If W or T > 9 inches (228.6 mm), surface resolution may require scanning from opposite side"
    ],
    specialNotes: ["Check for laminar discontinuities", "Monitor back reflection loss"],
    diagramReference: "Figure 1 - Plate Cross Section"
  },
  flat_bar: {
    displayName: "Flat Bar",
    scanDirection: ["Straight beam perpendicular to surface"],
    waveMode: ["Longitudinal"],
    conditions: [
      "If W/T > 5, scan with straight beam as shown",
      "If W or T > 9 inches (228.6 mm), surface resolution may require scanning from opposite side"
    ],
    specialNotes: ["Same requirements as plate"],
    diagramReference: "Figure 1 - Flat Bar Cross Section"
  },
  rectangular_bar: {
    displayName: "Rectangular Bar, Bloom, and Billets",
    scanDirection: ["Straight beam from two adjacent sides"],
    waveMode: ["Longitudinal"],
    conditions: [
      "If W/T < 5, scan from two adjacent sides with sound beam directed as shown",
      "If T or W > 9 inches (228.6 mm), surface resolution may require scanning from opposite sides"
    ],
    specialNotes: ["Requires scanning from multiple surfaces"],
    diagramReference: "Figure 2 - Rectangular Bar Cross Section"
  },
  round_bar: {
    displayName: "Round Bars and Round Forging Stock",
    scanDirection: ["Radial scan from circumference", "Axial scan from end face"],
    waveMode: ["Longitudinal"],
    conditions: [
      "Scan radially from circumference",
      "Axial scanning may be required based on L/D ratio"
    ],
    specialNotes: ["Full circumferential coverage required"],
    diagramReference: "Figure 3 - Round Bar Cross Section"
  },
  round_forging_stock: {
    displayName: "Round Forging Stock",
    scanDirection: ["Radial scan from circumference", "Axial scan from end face"],
    waveMode: ["Longitudinal"],
    conditions: [
      "Scan radially from circumference",
      "Axial scanning required if grain structure oriented"
    ],
    specialNotes: ["Consider grain structure orientation"],
    diagramReference: "Figure 3 - Round Forging Stock"
  },
  ring_forging: {
    displayName: "Ring Forgings",
    scanDirection: ["Radial from circumference", "Axial", "Circumferential shear wave"],
    waveMode: ["Longitudinal", "Shear wave"],
    conditions: [
      "Scan with straight beam from circumference (radially) if ring thickness NOT > 20% of OD",
      "Scanning with straight beam in axial direction required ONLY if L/T < 5",
      "Scan with circumferential shear wave technique per Appendix A in addition to straight beam"
    ],
    specialNotes: [
      "OD = Outside Diameter, ID = Inside Diameter, L = Length, T = Wall Thickness",
      "Three scan directions required for complete inspection"
    ],
    diagramReference: "Figure 4 - Ring Forging"
  },
  disk_forging: {
    displayName: "Disk Forging",
    scanDirection: ["From flat face", "Radially from circumference"],
    waveMode: ["Longitudinal"],
    conditions: [
      "Scan with straight beams from at least one flat face",
      "Radially from circumference whenever practical"
    ],
    specialNotes: ["D = Diameter, T = Thickness"],
    diagramReference: "Figure 5 - Disk Forging"
  },
  hex_bar: {
    displayName: "Hex Bar",
    scanDirection: ["From three adjacent faces"],
    waveMode: ["Longitudinal"],
    conditions: [
      "Scan with straight beam from three adjacent faces",
      "When T exceeds value where attenuation reduces signal to unacceptable level, scan from opposite sides"
    ],
    specialNotes: ["T = Thickness", "May require scanning from opposite sides for thick sections"],
    diagramReference: "Figure 6 - Hex Bar"
  },
  bar: {
    displayName: "Bar (Generic)",
    scanDirection: ["Longitudinal along bar axis"],
    waveMode: ["Longitudinal"],
    conditions: ["Scan from multiple surfaces if diameter permits"],
    specialNotes: ["Generic bar - use specific type if known"],
    diagramReference: "Generic Bar"
  },
  forging: {
    displayName: "Forging (Generic)",
    scanDirection: ["Contour following", "Multiple orientations"],
    waveMode: ["Longitudinal", "Shear wave"],
    conditions: ["Match calibration block to part curvature"],
    specialNotes: ["Check grain structure effects", "Use specific forging type if known"],
    diagramReference: "Generic Forging"
  },
  ring: {
    displayName: "Ring (Generic)",
    scanDirection: ["Circumferential", "Axial", "Radial"],
    waveMode: ["Longitudinal"],
    conditions: ["Curvature compensation required"],
    specialNotes: ["Consider grain structure orientation", "Use ring_forging type if applicable"],
    diagramReference: "Generic Ring"
  },
  disk: {
    displayName: "Disk (Generic)",
    scanDirection: ["Radial patterns", "Circumferential patterns"],
    waveMode: ["Longitudinal"],
    conditions: ["Center bore requires special attention"],
    specialNotes: ["Rim inspection critical", "Use disk_forging type if applicable"],
    diagramReference: "Generic Disk"
  },
  sheet: {
    displayName: "Sheet",
    scanDirection: ["Two-axis raster"],
    waveMode: ["Longitudinal"],
    conditions: ["Similar to plate"],
    specialNotes: ["Check laminar discontinuities"],
    diagramReference: "Sheet"
  },
  slab: {
    displayName: "Slab",
    scanDirection: ["Two-axis raster", "Diagonal passes"],
    waveMode: ["Longitudinal"],
    conditions: ["Heavy section"],
    specialNotes: ["May require multi-side scanning"],
    diagramReference: "Slab"
  },
  square_bar: {
    displayName: "Square Bar",
    scanDirection: ["From adjacent faces"],
    waveMode: ["Longitudinal"],
    conditions: ["Similar to rectangular bar"],
    specialNotes: ["Ensure corner coverage"],
    diagramReference: "Square Bar"
  },
  pipe: {
    displayName: "Pipe",
    scanDirection: ["Helical scan", "Circumferential scan"],
    waveMode: ["Longitudinal"],
    conditions: ["Same as tube"],
    specialNotes: ["Check both ID and OD surfaces"],
    diagramReference: "Pipe"
  },
  shaft: {
    displayName: "Shaft",
    scanDirection: ["Axial", "Circumferential"],
    waveMode: ["Longitudinal"],
    conditions: ["Localized radial scans at critical sections"],
    specialNotes: ["Check shoulders, keyways"],
    diagramReference: "Shaft"
  },
  billet: {
    displayName: "Billet / Block",
    scanDirection: ["Two-axis raster in orthogonal directions"],
    waveMode: ["Longitudinal"],
    conditions: ["Add diagonal passes if needed"],
    specialNotes: ["Large cross-section"],
    diagramReference: "Billet"
  },
  block: {
    displayName: "Block",
    scanDirection: ["Two-axis raster through-thickness"],
    waveMode: ["Longitudinal"],
    conditions: ["Similar to billet"],
    specialNotes: ["Check for internal voids"],
    diagramReference: "Block"
  },
  sleeve: {
    displayName: "Sleeve / Bushing",
    scanDirection: ["Circumferential", "Radial through wall"],
    waveMode: ["Longitudinal"],
    conditions: ["Short hollow cylinder"],
    specialNotes: ["Similar to tube but shorter"],
    diagramReference: "Sleeve"
  },
  bushing: {
    displayName: "Bushing",
    scanDirection: ["Circumferential", "Radial"],
    waveMode: ["Longitudinal"],
    conditions: ["Short hollow cylinder"],
    specialNotes: ["Check wall thickness uniformity"],
    diagramReference: "Bushing"
  },
  extrusion_l: {
    displayName: "L-Extrusion",
    scanDirection: ["Axial along extrusion", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Scan flanges and web separately"],
    specialNotes: ["Check corners/fillets"],
    diagramReference: "L-Extrusion"
  },
  extrusion_t: {
    displayName: "T-Extrusion",
    scanDirection: ["Axial", "Indexed transverse per feature"],
    waveMode: ["Longitudinal"],
    conditions: ["T-section requires multi-orientation scans"],
    specialNotes: ["Scan from multiple surfaces"],
    diagramReference: "T-Extrusion"
  },
  extrusion_i: {
    displayName: "I-Extrusion (I-Beam)",
    scanDirection: ["Axial", "Indexed scans on flanges and web"],
    waveMode: ["Longitudinal"],
    conditions: ["I-beam geometry"],
    specialNotes: ["Scan from multiple surfaces"],
    diagramReference: "I-Extrusion"
  },
  extrusion_u: {
    displayName: "U-Extrusion",
    scanDirection: ["Axial", "Transverse indexed scans"],
    waveMode: ["Longitudinal"],
    conditions: ["U-channel requires coverage of all faces"],
    specialNotes: ["Check web and flanges"],
    diagramReference: "U-Extrusion"
  },
  extrusion_channel: {
    displayName: "Channel Extrusion",
    scanDirection: ["Axial", "Indexed transverse scans"],
    waveMode: ["Longitudinal"],
    conditions: ["Similar to U-extrusion"],
    specialNotes: ["Check web and flanges"],
    diagramReference: "Channel"
  },
  extrusion_angle: {
    displayName: "Angle Extrusion",
    scanDirection: ["Axial along legs", "Radial from edges"],
    waveMode: ["Longitudinal"],
    conditions: ["Angle section requires scans along both legs"],
    specialNotes: ["Check corner fillet"],
    diagramReference: "Angle"
  },
  square_tube: {
    displayName: "Square Tube",
    scanDirection: ["Perimeter scan"],
    waveMode: ["Longitudinal"],
    conditions: ["Uniform coverage of all faces"],
    specialNotes: ["Check wall thickness uniformity"],
    diagramReference: "Square Tube"
  },
  rectangular_forging_stock: {
    displayName: "Rectangular Forging Stock",
    scanDirection: ["Axial", "Transverse"],
    waveMode: ["Longitudinal"],
    conditions: ["Check forging defects"],
    specialNotes: ["Verify grain structure"],
    diagramReference: "Forging Stock"
  },
  hub: {
    displayName: "Hub Forging",
    scanDirection: ["Radial", "Circumferential"],
    waveMode: ["Longitudinal", "Shear"],
    conditions: ["Complex geometry"],
    specialNotes: ["Multi-angle approach required"],
    diagramReference: "Hub"
  },
  near_net_forging: {
    displayName: "Near-Net Forging",
    scanDirection: ["Contour following", "Indexed"],
    waveMode: ["Longitudinal"],
    conditions: ["Adaptive scanning required"],
    specialNotes: ["Follow part contour"],
    diagramReference: "Near-Net"
  },
  machined_component: {
    displayName: "Machined Component",
    scanDirection: ["Per parent form"],
    waveMode: ["Per parent form"],
    conditions: ["Follow parent material inspection"],
    specialNotes: ["Refer to source material specs"],
    diagramReference: "Machined"
  },
  custom: {
    displayName: "Custom Geometry",
    scanDirection: ["Per drawing"],
    waveMode: ["Per specification"],
    conditions: ["Customer-specific"],
    specialNotes: ["Refer to all applicable specifications"],
    diagramReference: "Custom"
  }
};

// ============= SCAN DETAILS - SCAN DIRECTIONS =============
export interface ScanDirectionDetails {
  direction: string;
  waveMode: string;
  angleOrDescription: string;
  applicableGeometry: PartGeometry[];
}

export const SCAN_DIRECTION_CATALOG: ScanDirectionDetails[] = [
  {
    direction: "A",
    waveMode: "Longitudinal",
    angleOrDescription: "Straight beam (0°)",
    applicableGeometry: ["plate", "flat_bar", "rectangular_bar", "round_bar", "disk_forging"]
  },
  {
    direction: "B",
    waveMode: "Longitudinal",
    angleOrDescription: "Straight beam (0°)",
    applicableGeometry: ["plate", "flat_bar", "rectangular_bar"]
  },
  {
    direction: "C",
    waveMode: "Longitudinal",
    angleOrDescription: "Straight beam (0°)",
    applicableGeometry: ["plate", "rectangular_bar"]
  },
  {
    direction: "D",
    waveMode: "Longitudinal",
    angleOrDescription: "Straight beam (0°)",
    applicableGeometry: ["plate", "rectangular_bar"]
  },
  {
    direction: "E",
    waveMode: "Axial shear wave",
    angleOrDescription: "45° OD",
    applicableGeometry: ["tube", "ring_forging"]
  },
  {
    direction: "F",
    waveMode: "Axial shear wave",
    angleOrDescription: "45° OD",
    applicableGeometry: ["tube", "ring_forging"]
  },
  {
    direction: "G",
    waveMode: "Shear wave",
    angleOrDescription: "45° clockwise",
    applicableGeometry: ["ring_forging", "tube"]
  },
  {
    direction: "H",
    waveMode: "Shear wave",
    angleOrDescription: "45° counter clockwise",
    applicableGeometry: ["ring_forging", "tube"]
  },
  {
    direction: "I",
    waveMode: "Shear wave",
    angleOrDescription: "45° counter clockwise",
    applicableGeometry: ["ring_forging"]
  },
  {
    direction: "L",
    waveMode: "Shear wave",
    angleOrDescription: "45° counter clockwise",
    applicableGeometry: ["ring_forging"]
  }
];

// ============= SMART RECOMMENDATION ENGINE =============
export interface InspectionRecommendation {
  geometry: PartGeometry;
  material: MaterialType;
  thickness: number;
  width?: number;
  diameter?: number;
  length?: number;
  
  recommendations: {
    scanDirections: string[];
    waveTypes: string[];
    conditions: string[];
    warnings: string[];
    acceptanceClass: AcceptanceClass;
    frequency: string;
    specialConsiderations: string[];
  };
}

export function getSmartRecommendation(input: {
  geometry: PartGeometry;
  material: MaterialType;
  thickness: number;
  width?: number;
  length?: number;
  diameter?: number;
  acceptanceClass?: AcceptanceClass;
}): InspectionRecommendation {
  const { geometry, material, thickness, width, length, diameter, acceptanceClass } = input;
  
  const geometryRules = GEOMETRY_INSPECTION_RULES[geometry];
  const warnings: string[] = [];
  const conditions: string[] = [...geometryRules.conditions];
  
  // Calculate W/T ratio for applicable geometries
  if (width && (geometry === "plate" || geometry === "flat_bar" || geometry === "rectangular_bar")) {
    const wtRatio = width / thickness;
    
    if (geometry === "plate" || geometry === "flat_bar") {
      if (wtRatio <= 5) {
        warnings.push(`⚠️ W/T ratio is ${wtRatio.toFixed(2)} (≤5). Consider rectangular bar inspection technique.`);
      }
    }
    
    if (geometry === "rectangular_bar") {
      if (wtRatio >= 5) {
        warnings.push(`⚠️ W/T ratio is ${wtRatio.toFixed(2)} (≥5). Consider plate/flat bar technique.`);
      }
    }
    
    if (width > 228.6 || thickness > 228.6) {
      warnings.push("⚠️ Dimension exceeds 9 inches (228.6mm) - scanning from opposite side may be required.");
    }
  }
  
  // Calculate L/T ratio for ring forgings
  if (geometry === "ring_forging" && length) {
    const ltRatio = length / thickness;
    if (ltRatio < 5) {
      warnings.push(`✓ L/T ratio is ${ltRatio.toFixed(2)} (<5). Axial scanning IS REQUIRED.`);
      conditions.push("REQUIRED: Axial scanning due to L/T < 5");
    } else {
      conditions.push("Axial scanning not required (L/T ≥ 5)");
    }
  }
  
  // Check ring forging thickness vs OD
  if (geometry === "ring_forging" && diameter) {
    const thicknessPercent = (thickness / diameter) * 100;
    if (thicknessPercent > 20) {
      warnings.push(`⚠️ Ring thickness is ${thicknessPercent.toFixed(1)}% of OD (>20%). Standard radial scan may not be sufficient.`);
    }
  }
  
  // Material-specific warnings
  if (material === "titanium" && acceptanceClass && ["AAA", "AA"].includes(acceptanceClass)) {
    warnings.push(`⚠️ TITANIUM ALERT: Class ${acceptanceClass} requires special back reflection loss limits per TABLE VI.`);
  }
  
  if (material === "magnesium") {
    warnings.push("⚠️ Magnesium: Use non-corrosive water-based couplant only. High attenuation material.");
  }
  
  // Frequency recommendation
  const frequency = getRecommendedFrequency(thickness, material);
  
  return {
    geometry,
    material,
    thickness,
    width,
    diameter,
    length,
    recommendations: {
      scanDirections: geometryRules.scanDirection,
      waveTypes: geometryRules.waveMode,
      conditions,
      warnings,
      acceptanceClass: acceptanceClass || "A",
      frequency,
      specialConsiderations: geometryRules.specialNotes
    }
  };
}

// ============= FREQUENCY SELECTION =============
export function getRecommendedFrequency(thickness: number, material?: MaterialType): string {
  let attenuationFactor = 1.0;
  
  if (material) {
    const attenuationMap: Record<MaterialType, number> = {
      aluminum: 1.5,
      steel: 3.0,
      stainless_steel: 2.5,
      titanium: 4.5,
      magnesium: 8.0,
      custom: 3.0
    };
    
    const attenuation = attenuationMap[material];
    if (attenuation > 5) attenuationFactor = 0.5;
    else if (attenuation > 3) attenuationFactor = 0.75;
  }

  const adjustedThickness = thickness / attenuationFactor;

  if (adjustedThickness < 12.7) return "10.0";
  if (adjustedThickness < 25.4) return "5.0";
  if (adjustedThickness < 50.8) return "2.25";
  return "1.0";
}

// ============= RESOLUTION VALUES =============
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

// ============= METAL TRAVEL CALCULATION =============
export function calculateMetalTravel(thickness: number): number {
  const travel = thickness * 3;
  return Math.round(travel / 5) * 5;
}

// ============= SCAN INDEX CALCULATION =============
export function calculateScanIndex(transducerDiameter: number, coveragePercent: number = 100): number {
  const overlapFactor = coveragePercent / 100;
  const indexInches = transducerDiameter * (2 - overlapFactor);
  return Math.round(indexInches * 25.4 * 10) / 10;
}

// ============= COUPLANT RECOMMENDATION =============
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
    return "Water-based gel (non-corrosive) - CRITICAL for Magnesium";
  }

  return "Commercial ultrasonic gel (e.g., Sono 600)";
}

// ============= APPLICABLE SCAN DIRECTIONS =============
export function getApplicableScanDirections(geometry: PartGeometry): ScanDirectionDetails[] {
  return SCAN_DIRECTION_CATALOG.filter(scan => 
    scan.applicableGeometry.includes(geometry)
  );
}
