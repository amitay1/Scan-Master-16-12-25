// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InspectionSetupData, MaterialType, PartGeometry, AcceptanceClass, StandardType } from "@/types/techniqueSheet";
import { Upload, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { materialDatabase } from "@/utils/enhancedAutoFillLogic";
import { PartTypeVisualSelector } from "@/components/PartTypeVisualSelector";
import { Card } from "@/components/ui/card";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { RealTimeTechnicalDrawing } from "@/components/RealTimeTechnicalDrawing";
import {
  generateCalibrationRecommendationV2,
  CalibrationRecommendationInput
} from "@/utils/calibrationRecommenderV2";
import { logInfo, logWarn } from "@/lib/logger";
import type { ScanDetailsData } from "@/types/scanDetails";

// LocalStorage keys for custom items persistence
const STORAGE_KEYS = {
  customMaterials: 'scanmaster_custom_materials',
  customMaterialSpecs: 'scanmaster_custom_material_specs',
  customHeatTreatments: 'scanmaster_custom_heat_treatments',
};

interface InspectionSetupTabProps {
  data: InspectionSetupData;
  onChange: (data: InspectionSetupData) => void;
  acceptanceClass?: AcceptanceClass | "";
  standardType?: StandardType;  // Added: for calibration recommendation
  onCalibrationRecommendation?: (blockType: string, reasoning: string) => void;  // Added: callback to update calibration
  scanDetails?: ScanDetailsData;  // NEW: Scan directions to influence calibration block selection
}

const materials: { value: MaterialType; label: string }[] = [
  { value: "aluminum", label: "Aluminum" },
  { value: "steel", label: "Steel" },
  { value: "stainless_steel", label: "Stainless Steel" },
  { value: "titanium", label: "Titanium" },
  { value: "nickel_alloy", label: "Nickel Alloy" },
  { value: "magnesium", label: "Magnesium" },
  { value: "custom", label: "Custom Material" },
];


interface PartTypeOption {
  value: PartGeometry;
  label: string;
  description?: string;
}

const partTypes: PartTypeOption[] = [
  { value: "plate", label: "Plate", description: "Two-axis raster" },
  { value: "rectangular_bar", label: "Rectangular Bar", description: "Scan from multiple faces" },
  { value: "round_bar", label: "Round Bar", description: "Radial + axial scans" },
  { value: "square_bar", label: "Square Bar", description: "Scan from adjacent faces" },
  { value: "round_forging_stock", label: "Round Forging Stock", description: "Consider grain structure" },
  { value: "ring_forging", label: "Ring Forging ⭐", description: "Radial + axial + shear wave" },
  { value: "disk_forging", label: "Disk Forging", description: "Flat face + radial" },
  { value: "hex_bar", label: "Hex Bar", description: "3 adjacent faces" },
  { value: "tube", label: "Tube / Pipe", description: "ID + OD coverage" },
  { value: "shaft", label: "Shaft", description: "Axial + circumferential" },
  { value: "billet", label: "Billet / Block", description: "Two-axis raster" },
  { value: "sleeve", label: "Sleeve / Bushing", description: "Short hollow cylinder" },
  { value: "bar", label: "Bar (Generic)", description: "Use specific type if known" },
  { value: "forging", label: "Forging (Generic)", description: "Use specific type if known" },
  { value: "ring", label: "Ring (Generic)", description: "Use ring_forging if applicable" },
  { value: "disk", label: "Disk (Generic)", description: "Use disk_forging if applicable" },
  { value: "impeller", label: "Impeller", description: "Complex stepped disk (aero engine)" },
  { value: "blisk", label: "Blisk (Bladed Disk)", description: "Integrated blade-disk (aero engine)" },
];


const materialSpecs: Record<MaterialType, string[]> = {
  aluminum: ["7075-T6 (QQ-A200/11)", "2024 (QQ-A-200/3)", "6061-T6", "2219-T87"],
  steel: ["4340 annealed (MIL-S-5000)", "4130", "17-4 PH", "15-5 PH"],
  stainless_steel: ["304 (AMS 5513)", "316 (AMS 5524)", "17-4 PH (AMS 5604)", "15-5 PH (AMS 5659)", "410", "420"],
  titanium: ["Ti-6Al-4V annealed (AMS 4928)", "Ti-6Al-4V STA", "Ti-6Al-2Sn-4Zr-2Mo (Ti-6242)", "Ti-5Al-2.5Sn", "CP Ti Grade 2"],
  nickel_alloy: ["Inconel 718 (AMS 5662)", "Waspaloy (AMS 5544)", "Inconel 625 (AMS 5666)", "Rene 41", "Hastelloy X"],
  magnesium: ["ZK60A (QQ-M-31)", "AZ31B", "AZ80A", "ZE41A"],
  custom: ["Custom Specification"],
};

// Default heat treatment options
const defaultHeatTreatments = [
  "Annealed",
  "Solution Treated",
  "Age Hardened",
  "T6",
  "T651",
  "T7",
  "T73",
  "T76",
  "Normalized",
  "Quenched & Tempered",
  "Stress Relieved",
];

/**
 * AUTOMATIC SHAPE CLASSIFICATION - ASTM E2375-16 Standard
 *
 * Shape classification thresholds per ASTM E2375-16:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ HOLLOW CYLINDRICAL SHAPES (Ring Forgings - has inner diameter):            │
 * │   • RING: L/T < 5 (Length/Wall-Thickness ratio less than 5)                │
 * │   • TUBE: L/T >= 5 (longer hollow cylinder)                                │
 * │   Additional: If T (wall) not > 20% of OD → scan radially                  │
 * │   Additional: Axial scan required only if L/T < 5                          │
 * │   Additional: Always add circumferential shear wave per Appendix A         │
 * │   Source: ASTM E2375-16 Figure 7 - Ring Forgings ✓                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ SOLID CYLINDRICAL SHAPES (Round Bars and Round Forging Stock):             │
 * │   • DISK: H/D < 0.5 (Height/Diameter ratio less than 0.5)                  │
 * │   • ROUND BAR: H/D >= 0.5 (taller solid cylinder)                          │
 * │   Note: Scan radially while rotating to locate discontinuities at center   │
 * │   Note: May require angle beam per Appendix A when specified               │
 * │   Source: ASTM E2375-16 Figure 7 - Round Bars and Round Forging Stock ✓    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ RECTANGULAR (Plate and Flat Bar vs Rectangular Bar/Billet):                │
 * │   • PLATE: W/T > 5 (width-to-thickness ratio)                              │
 * │   • BAR/BILLET: W/T <= 5 (compact cross-section)                           │
 * │   Additional: If W or T > 228.6mm (9") → may require opposite side scan    │
 * │   Source: ASTM E2375-16 Figure 6 ✓                                         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * This ensures proper inspection planning and scan direction visualization.
 */
function classifyCircularShape(
  currentType: PartGeometry,
  diameter: number | undefined,
  innerDiameter: number | undefined,
  height: number | undefined,
  wallThickness: number | undefined
): PartGeometry {
  // Only auto-classify circular/cylindrical shapes
  const circularTypes: PartGeometry[] = [
    'tube', 'pipe', 'ring', 'ring_forging', 'sleeve', 'bushing',
    'cylinder', 'round_bar', 'shaft', 'disk', 'disk_forging', 'round_forging_stock'
  ];

  if (!circularTypes.includes(currentType)) {
    return currentType; // Don't change non-circular shapes
  }

  // Need diameter and height for classification
  if (!diameter || !height) {
    return currentType;
  }

  // Types that are ALWAYS hollow - don't reclassify these as solid
  const alwaysHollowTypes: PartGeometry[] = ['tube', 'pipe', 'ring', 'ring_forging', 'sleeve', 'bushing'];
  const isAlwaysHollowType = alwaysHollowTypes.includes(currentType);

  // Determine if hollow or solid
  const isHollow = innerDiameter && innerDiameter > 0;

  // FIX: If current type is always hollow but innerDiameter not set yet,
  // keep the hollow type - don't reclassify as solid!
  if (isAlwaysHollowType && !isHollow) {
    return currentType;
  }

  if (isHollow) {
    // HOLLOW shape classification (Ring vs Tube)
    // Source: ASTM E2375-16 Figure 7 - L/T < 5 indicates RING geometry ✓
    const calculatedWallThickness = wallThickness || ((diameter - (innerDiameter || 0)) / 2);

    if (calculatedWallThickness > 0) {
      // ASTM E2375: Ring when L/T < 5 (length-to-wall-thickness ratio)
      const lengthToWallRatio = height / calculatedWallThickness;
      const isRing = lengthToWallRatio < 5;

      if (isRing) {
        // Keep forging designation if it was a forging
        if (currentType === 'ring_forging' || currentType === 'round_forging_stock') {
          return 'ring_forging';
        }
        return 'ring';
      } else {
        // It's a Tube (L/T >= 5, longer hollow cylinder)
        if (currentType === 'pipe') return 'pipe';
        if (currentType === 'sleeve') return 'sleeve';
        if (currentType === 'bushing') return 'bushing';
        return 'tube';
      }
    }
  } else {
    // SOLID shape classification (Disk vs Cylinder)
    // Source: Industry convention - H/D < 0.5 = "pancake/disk" shape
    // (Not defined in formal standards, but widely used in forging industry)
    const heightToDiameterRatio = height / diameter;
    const isDisk = heightToDiameterRatio < 0.5;

    if (isDisk) {
      // Keep forging designation if it was a forging
      if (currentType === 'disk_forging' || currentType === 'round_forging_stock') {
        return 'disk_forging';
      }
      return 'disk';
    } else {
      // It's a Cylinder (H/D >= 0.5, taller solid cylinder)
      if (currentType === 'shaft') return 'shaft';
      if (currentType === 'round_bar') return 'round_bar';
      if (currentType === 'round_forging_stock') return 'round_forging_stock';
      return 'cylinder';
    }
  }

  return currentType;
}
/**
 * AUTOMATIC RECTANGULAR SHAPE CLASSIFICATION - ASTM E2375-16
 *
 * Shape classification per ASTM E2375-16 Figure 6:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PLATE AND FLAT BAR (W/T > 5):                                              │
 * │   • PLATE: W/T > 5 (width-to-thickness ratio greater than 5)               │
 * │   • Scan with straight beam directed as shown                              │
 * │   • If W or T > 9" (228.6mm) → may require scanning from opposite sides    │
 * │   Source: ASTM E2375-16 Figure 6 - Plate and Flat Bar ✓                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ RECTANGULAR BAR, BLOOM, AND BILLETS (W/T < 5):                             │
 * │   • BAR/BILLET: W/T < 5 (compact cross-section)                            │
 * │   • Scan from two adjacent sides with sound beam directed as shown         │
 * │   • If T or W > 9" (228.6mm) → may require scanning from opposite sides    │
 * │   Source: ASTM E2375-16 Figure 6 - Rectangular Bar, Bloom, Billets ✓       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * NOTE: 228.6mm = 9 inches - threshold for surface resolution requirements
 * This ensures proper inspection planning and scan direction visualization.
 */
function classifyRectangularShape(
  currentType: PartGeometry,
  length: number | undefined,
  width: number | undefined,
  thickness: number | undefined
): PartGeometry {
  // Only auto-classify box family shapes
  const boxFamilyTypes: PartGeometry[] = [
    'box', 'plate', 'sheet', 'slab', 'bar', 'flat_bar',
    'rectangular_bar', 'square_bar', 'billet', 'block'
  ];

  if (!boxFamilyTypes.includes(currentType)) {
    return currentType; // Don't change non-box shapes
  }

  // Need all three dimensions for classification
  if (!length || !width || !thickness) {
    return currentType;
  }

  // ASTM E2375 Figure 6: W/T > 5 indicates PLATE geometry
  // We use the two larger dimensions as the "face" and smallest as thickness
  const dims = [length, width, thickness].sort((a, b) => b - a);
  const largest = dims[0];
  const middle = dims[1];
  const smallest = dims[2];

  // Calculate ratios per ASTM E2375
  const widthToThicknessRatio = middle / smallest; // W/T ratio from standard
  const lengthToWidthRatio = largest / middle;

  // PLATE: Source: ASTM E2375-16 Figure 6 - W/T > 5 (flat sheet-like geometry) ✓
  const isPlate = widthToThicknessRatio > 5;

  // BAR: Source: Industry convention - L/W > 4 for elongated shapes
  // (Not defined in formal standards by ratio, but commonly used threshold)
  const isBar = !isPlate && lengthToWidthRatio > 4;

  if (isPlate) {
    // Keep specific plate types if already set
    if (currentType === 'sheet') return 'sheet';
    if (currentType === 'slab') return 'slab';
    return 'plate';
  }

  if (isBar) {
    // Keep specific bar types if already set
    if (currentType === 'flat_bar') return 'flat_bar';
    if (currentType === 'rectangular_bar') return 'rectangular_bar';
    if (currentType === 'square_bar') return 'square_bar';
    return 'bar';
  }

  // Default to box for compact rectangular shapes (W/T < 5)
  if (currentType === 'billet') return 'billet';
  if (currentType === 'block') return 'block';
  return 'box';
}

/**
 * UNIFIED SHAPE CLASSIFICATION
 * Combines circular and rectangular classification logic
 */
function classifyShape(
  currentType: PartGeometry,
  dimensions: {
    diameter?: number;
    innerDiameter?: number;
    length?: number;
    width?: number;
    thickness?: number;
    wallThickness?: number;
  }
): PartGeometry {
  const { diameter, innerDiameter, length, width, thickness, wallThickness } = dimensions;

  // Try circular classification first
  const height = length || thickness;
  const circularResult = classifyCircularShape(currentType, diameter, innerDiameter, height, wallThickness);
  if (circularResult !== currentType) {
    return circularResult;
  }

  // Try rectangular classification
  const rectangularResult = classifyRectangularShape(currentType, length, width, thickness);
  if (rectangularResult !== currentType) {
    return rectangularResult;
  }

  return currentType;
}

// Using imported FieldWithHelp component

export const InspectionSetupTab = ({
  data,
  onChange,
  acceptanceClass,
  standardType,
  onCalibrationRecommendation,
  scanDetails
}: InspectionSetupTabProps) => {
  // Refs to avoid stale closures in useEffect with setTimeout
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  dataRef.current = data;
  onChangeRef.current = onChange;

  // State for custom items (persisted in localStorage)
  const [customMaterials, setCustomMaterials] = useState<{ value: string; label: string }[]>([]);
  const [customMaterialSpecs, setCustomMaterialSpecs] = useState<Record<string, string[]>>({});
  const [customHeatTreatments, setCustomHeatTreatments] = useState<string[]>([]);

  // State for "Add to list" input mode
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [addingSpec, setAddingSpec] = useState(false);
  const [addingHeatTreat, setAddingHeatTreat] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

  // Load custom items from localStorage on mount
  useEffect(() => {
    try {
      const storedMaterials = localStorage.getItem(STORAGE_KEYS.customMaterials);
      const storedSpecs = localStorage.getItem(STORAGE_KEYS.customMaterialSpecs);
      const storedHeatTreatments = localStorage.getItem(STORAGE_KEYS.customHeatTreatments);

      if (storedMaterials) setCustomMaterials(JSON.parse(storedMaterials));
      if (storedSpecs) setCustomMaterialSpecs(JSON.parse(storedSpecs));
      if (storedHeatTreatments) setCustomHeatTreatments(JSON.parse(storedHeatTreatments));
    } catch (error) {
      logWarn("Failed to load custom items from localStorage:", error);
    }
  }, []);

  // Helper to add custom material
  const addCustomMaterial = (name: string) => {
    if (!name.trim()) return;
    const value = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const newMaterial = { value, label: name.trim() };
    const updated = [...customMaterials, newMaterial];
    setCustomMaterials(updated);
    localStorage.setItem(STORAGE_KEYS.customMaterials, JSON.stringify(updated));
    onChange({ ...data, material: value as MaterialType, materialSpec: "", customMaterialName: "" });
    setAddingMaterial(false);
    setNewItemValue("");
  };

  // Helper to add custom material spec
  const addCustomMaterialSpec = (spec: string, material: string) => {
    if (!spec.trim() || !material) return;
    const updated = { ...customMaterialSpecs };
    if (!updated[material]) updated[material] = [];
    updated[material] = [...updated[material], spec.trim()];
    setCustomMaterialSpecs(updated);
    localStorage.setItem(STORAGE_KEYS.customMaterialSpecs, JSON.stringify(updated));
    onChange({ ...data, materialSpec: spec.trim() });
    setAddingSpec(false);
    setNewItemValue("");
  };

  // Helper to add custom heat treatment
  const addCustomHeatTreatment = (treatment: string) => {
    if (!treatment.trim()) return;
    const updated = [...customHeatTreatments, treatment.trim()];
    setCustomHeatTreatments(updated);
    localStorage.setItem(STORAGE_KEYS.customHeatTreatments, JSON.stringify(updated));
    onChange({ ...data, heatTreatment: treatment.trim() });
    setAddingHeatTreat(false);
    setNewItemValue("");
  };

  // Get all materials (default + custom)
  const allMaterials = [...materials, ...customMaterials];

  // Get all specs for current material (default + custom)
  const getAllSpecsForMaterial = (material: string): string[] => {
    const defaultSpecs = materialSpecs[material as MaterialType] || [];
    const customSpecs = customMaterialSpecs[material] || [];
    return [...defaultSpecs, ...customSpecs];
  };

  // Get all heat treatments (default + custom)
  const allHeatTreatments = [...defaultHeatTreatments, ...customHeatTreatments];

  const updateField = (field: keyof InspectionSetupData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RECOMMENDATION: Get calibration block recommendation based on part
  // NOW WITH SCAN DIRECTIONS INTEGRATION! 🔗
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Only run if we have all required parameters
    if (
      !data.material ||
      !data.partType ||
      !data.partThickness ||
      !acceptanceClass ||
      !standardType ||
      data.partType === "custom" ||  // Skip custom shapes
      !onCalibrationRecommendation    // Skip if no callback provided
    ) {
      return;
    }

    try {
      // Analyze CRITICAL scan directions that affect calibration block choice
      // Only: Circumferential (D/E) and Angle Beam (F/G/H...) matter!
      const scanDirectionInfo = scanDetails ? {
        // Circumferential shear wave REQUIRES notched blocks
        hasCircumferentialScan: scanDetails.scanDetails.some(s => 
          s.enabled && ['D', 'E'].includes(s.scanningDirection)
        ),
        // Angle beam requires IIW/DSC blocks
        hasAngleBeam: scanDetails.scanDetails.some(s => 
          s.enabled && ['F', 'G', 'H', 'I', 'J', 'K'].includes(s.scanningDirection)
        ),
      } : undefined;

      const recommendationInput: CalibrationRecommendationInput = {
        material: data.material as MaterialType,
        materialSpec: data.materialSpec || "",
        partType: data.partType as PartGeometry,
        standard: standardType,
        thickness: data.partThickness,
        length: data.partLength,
        width: data.partWidth,
        outerDiameter: data.diameter,
        innerDiameter: data.innerDiameter,
        acceptanceClass: acceptanceClass as AcceptanceClass,
        beamType: scanDirectionInfo?.hasAngleBeam ? 'angle' : 'straight',
        scanDirections: scanDirectionInfo, // 🔗 Pass scan directions
        // OEM vendor is auto-derived from standard in calibrationRecommenderV2
      };

      const recommendation = generateCalibrationRecommendationV2(recommendationInput);

      logInfo("📋 Auto-recommendation (with scan directions):", {
        partType: data.partType,
        standard: standardType,
        scanDirections: scanDirectionInfo,
        recommendedBlock: recommendation.primaryBlock.category,
        reasoning: recommendation.reasoning.blockSelection
      });

      // Pass back the recommendation to parent (e.g., to update CalibrationTab)
      onCalibrationRecommendation(
        recommendation.primaryBlock.category,
        recommendation.reasoning.blockSelection
      );

    } catch (error) {
      logWarn("Failed to generate calibration recommendation:", error);
    }
  }, [
    data.material,
    data.partType,
    data.partThickness,
    data.diameter,
    data.innerDiameter,
    acceptanceClass,
    standardType,
    onCalibrationRecommendation,
    scanDetails // 🔗 Re-run when scan details change!
  ]);

  const handleCustomShapeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateField("customShapeImage", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const showDiameter = data.partType === "tube" || 
                        data.partType === "ring" || 
                        data.partType === "cylinder" ||
                        data.partType === "sphere" ||
                        data.partType === "cone" ||
                        data.partType === "hexagon" ||
                        data.partType === "round_bar" ||
                        data.partType === "shaft" ||
                        data.partType === "disk" ||
                        data.partType === "disk_forging" ||
                        data.partType === "ring_forging" ||
                        data.partType === "round_forging_stock" ||
                        data.partType === "pipe" ||
                        data.partType === "sleeve" ||
                        data.partType === "bushing";
  
  // Check if shape can be hollow
  const canBeHollow = data.partType === "cylinder" ||
                      data.partType === "box" ||
                      data.partType === "rectangular_tube" ||
                      data.partType === "hexagon" ||
                      data.partType === "sphere" ||
                      data.partType === "round_bar" ||
                      data.partType === "shaft" ||
                      data.partType === "disk" ||
                      data.partType === "square_bar" ||
                      data.partType === "rectangular_bar" ||
                      data.partType === "plate" ||
                      data.partType === "billet" ||
                      data.partType === "block";

  // Check if it's a cone - needs special dimension fields (cone is always hollow like a tube)
  const isCone = data.partType === "cone";
  
  // These shapes are typically hollow - show hint badge but allow toggle
  // Cone is ALWAYS hollow (like a tapered tube)
  const isAlwaysHollow = data.partType === "tube" ||
                         data.partType === "pipe" ||
                         data.partType === "ring" ||
                         data.partType === "ring_forging" ||
                         data.partType === "sleeve" ||
                         data.partType === "bushing" ||
                         data.partType === "cone";

  // Auto-enable isHollow when selecting a typically hollow shape (but allow toggle off)
  React.useEffect(() => {
    if (isAlwaysHollow && data.isHollow === undefined) {
      // Only auto-set if not explicitly set by user
      onChange({ ...data, isHollow: true });
    }
  }, [data.partType]); // Only run when partType changes

  // Auto-calculate wall thickness if inner and outer dimensions are set
  React.useEffect(() => {
    // Only auto-calculate for hollow parts with valid diameter values
    if (data.isHollow && data.diameter && data.innerDiameter && data.innerDiameter > 0) {
      const calculatedWallThickness = (data.diameter - data.innerDiameter) / 2;
      // Only update if the calculated value differs significantly
      if (calculatedWallThickness > 0 && Math.abs((data.wallThickness || 0) - calculatedWallThickness) > 0.01) {
        updateField("wallThickness", calculatedWallThickness);
      }
    }
  }, [data.diameter, data.innerDiameter, data.isHollow, data.wallThickness, updateField]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATIC SHAPE CLASSIFICATION - DISABLED
  // This feature was causing issues where user-selected shapes would be 
  // immediately reclassified based on existing dimensions.
  // The classification logic is preserved in comments for future reference.
  // ═══════════════════════════════════════════════════════════════════════════
  // React.useEffect(() => {
  //   if (!data.partType) return;
  //   
  //   // Don't auto-classify if dimensions are not yet filled in
  //   const hasRectangularDimensions = data.partLength && data.partWidth && data.partThickness;
  //   const hasCircularDimensions = data.diameter && (data.partLength || data.partThickness);
  //   
  //   if (!hasRectangularDimensions && !hasCircularDimensions) {
  //     return;
  //   }
  //   
  //   const newPartType = classifyShape(data.partType, {
  //     diameter: data.diameter,
  //     innerDiameter: data.innerDiameter,
  //     length: data.partLength,
  //     width: data.partWidth,
  //     thickness: data.partThickness,
  //     wallThickness: data.wallThickness
  //   });
  //   
  //   if (newPartType !== data.partType) {
  //     console.log(`🔄 Auto-classifying shape: ${data.partType} → ${newPartType}`);
  //     setTimeout(() => {
  //       const currentData = dataRef.current;
  //       onChangeRef.current({ ...currentData, partType: newPartType });
  //     }, 0);
  //   }
  // }, [data.partType, data.diameter, data.innerDiameter, data.partLength, data.partWidth, data.partThickness, data.wallThickness]);
  
  // Get material properties for info
  const materialProps = data.material ? materialDatabase[data.material as MaterialType] : null;
  const materialInfo = materialProps ? 
    `Velocity: ${materialProps.velocity} mm/µs | Density: ${materialProps.density} g/cm³ | ${materialProps.surfaceCondition}` : 
    undefined;

  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        <FieldWithHelp
          label="Part Number"
          fieldKey="partNumber"
          required
        >
          <Input
            value={data.partNumber}
            onChange={(e) => updateField("partNumber", e.target.value)}
            placeholder="P/N 12345-678"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Part Name"
          fieldKey="partName"
          required
        >
          <Input
            value={data.partName}
            onChange={(e) => updateField("partName", e.target.value)}
            placeholder="Landing Gear Support Bracket"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Material"
          fieldKey="material"
          required
          materialInfo={materialInfo}
        >
          {addingMaterial ? (
            <div className="flex gap-1">
              <Input
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Enter material name..."
                className="bg-background flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomMaterial(newItemValue);
                  if (e.key === 'Escape') { setAddingMaterial(false); setNewItemValue(""); }
                }}
              />
              <Button size="sm" onClick={() => addCustomMaterial(newItemValue)} className="h-9">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingMaterial(false); setNewItemValue(""); }} className="h-9">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Select
              value={data.material}
              onValueChange={(value: string) => {
                if (value === "__add_new__") {
                  setAddingMaterial(true);
                  setNewItemValue("");
                } else {
                  onChange({ ...data, material: value as MaterialType, materialSpec: "", customMaterialName: "" });
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allMaterials.map((mat) => (
                  <SelectItem key={mat.value} value={mat.value}>
                    {mat.label}
                  </SelectItem>
                ))}
                <SelectItem value="__add_new__" className="text-primary font-medium border-t mt-1 pt-1">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add to the list
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          {data.material === "custom" && (
            <Input
              value={data.customMaterialName || ""}
              onChange={(e) => updateField("customMaterialName", e.target.value)}
              placeholder="Enter custom material name..."
              className="bg-background mt-2"
            />
          )}
          {materialProps && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
              <div><strong>Velocity:</strong> {materialProps.velocity} mm/µs (Long.) | {materialProps.velocityShear} mm/µs (Shear)</div>
              <div><strong>Impedance:</strong> {materialProps.acousticImpedance} MRayls</div>
            </div>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Material Specification"
          fieldKey="material"
          required
        >
          {addingSpec ? (
            <div className="flex gap-1">
              <Input
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Enter specification..."
                className="bg-background flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomMaterialSpec(newItemValue, data.material);
                  if (e.key === 'Escape') { setAddingSpec(false); setNewItemValue(""); }
                }}
              />
              <Button size="sm" onClick={() => addCustomMaterialSpec(newItemValue, data.material)} className="h-9">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingSpec(false); setNewItemValue(""); }} className="h-9">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Select
              value={data.materialSpec}
              onValueChange={(value) => {
                if (value === "__add_new__") {
                  setAddingSpec(true);
                  setNewItemValue("");
                } else {
                  updateField("materialSpec", value);
                }
              }}
              disabled={!data.material}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={data.material ? "Select specification..." : "Select material first"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {data.material && getAllSpecsForMaterial(data.material).map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
                {data.material && (
                  <SelectItem value="__add_new__" className="text-primary font-medium border-t mt-1 pt-1">
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add to the list
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </FieldWithHelp>

        {/* Heat Treat - moved here next to Material Specification */}
        <FieldWithHelp
          label="Heat Treat"
          fieldKey="material"
        >
          {addingHeatTreat ? (
            <div className="flex gap-1">
              <Input
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Enter heat treatment..."
                className="bg-background flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomHeatTreatment(newItemValue);
                  if (e.key === 'Escape') { setAddingHeatTreat(false); setNewItemValue(""); }
                }}
              />
              <Button size="sm" onClick={() => addCustomHeatTreatment(newItemValue)} className="h-9">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingHeatTreat(false); setNewItemValue(""); }} className="h-9">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Select
              value={data.heatTreatment || ""}
              onValueChange={(value) => {
                if (value === "__add_new__") {
                  setAddingHeatTreat(true);
                  setNewItemValue("");
                } else {
                  updateField("heatTreatment", value);
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select heat treatment..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allHeatTreatments.map((ht) => (
                  <SelectItem key={ht} value={ht}>
                    {ht}
                  </SelectItem>
                ))}
                <SelectItem value="__add_new__" className="text-primary font-medium border-t mt-1 pt-1">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add to the list
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </FieldWithHelp>


        <div className="col-span-2 bg-primary/10 border-2 border-primary/30 rounded-xl p-3 shadow-sm">
          <FieldWithHelp
            label="Part Type"
            fieldKey="partType"
            required
          >
            <PartTypeVisualSelector
              value={data.partType}
              material={data.material}
              onChange={(value) => {
                onChange({ 
                  ...data, 
                  partType: value,
                  customShapeDescription: value === "custom" ? data.customShapeDescription : undefined,
                  customShapeParameters: value === "custom" ? data.customShapeParameters : undefined
                });
              }}
            />
          </FieldWithHelp>
        </div>

        {data.partType === "custom" && (
          <>
            <FieldWithHelp
              label="Custom Description"
              fieldKey="partType"
              required
            >
              <Input
                value={data.customShapeDescription || ""}
                onChange={(e) => updateField("customShapeDescription", e.target.value)}
                placeholder="Complex dome with multiple radii..."
                className="bg-background"
              />
            </FieldWithHelp>

            <FieldWithHelp
              label="Shape Image"
              fieldKey="partType"
            >
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => document.getElementById('custom-shape-image-upload')?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {data.customShapeImage ? "Change" : "Upload"}
                </Button>
                <input
                  id="custom-shape-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomShapeImageUpload}
                />
                {data.customShapeImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    onClick={() => updateField("customShapeImage", undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </FieldWithHelp>
          </>
        )}

        <FieldWithHelp
          label="Thickness (mm)"
          fieldKey="thickness"
          required
        >
          <Input
            type="number"
            value={data.partThickness}
            onChange={(e) => updateField("partThickness", parseFloat(e.target.value) || 0)}
            min={6.35}
            step={0.1}
            className="bg-background"
          />
          {data.partThickness < 6.35 && data.partThickness > 0 && (
            <p className="text-xs text-destructive mt-1">
              Must be ≥ 6.35mm per standard scope
            </p>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Length (mm)"
          fieldKey="thickness"
        >
          <Input
            type="number"
            value={data.partLength}
            onChange={(e) => updateField("partLength", parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Width (mm)"
          fieldKey="thickness"
        >
          <Input
            type="number"
            value={data.partWidth}
            onChange={(e) => updateField("partWidth", parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Drawing No."
          fieldKey="partNumber"
        >
          <Input
            value={data.drawingNumber || ""}
            onChange={(e) => updateField("drawingNumber", e.target.value)}
            placeholder="DWG-12345"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Velocity (m/s)"
          fieldKey="material"
        >
          <Input
            type="number"
            value={data.acousticVelocity || ""}
            onChange={(e) => updateField("acousticVelocity", parseFloat(e.target.value) || undefined)}
            placeholder={materialProps ? `${materialProps.velocity * 1000}` : ""}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Density (kg/m³)"
          fieldKey="material"
        >
          <Input
            type="number"
            value={data.materialDensity || ""}
            onChange={(e) => updateField("materialDensity", parseFloat(e.target.value) || undefined)}
            placeholder={materialProps ? `${materialProps.density * 1000}` : ""}
            className="bg-background"
          />
        </FieldWithHelp>

        {showDiameter && (
          <FieldWithHelp
            label="OD (mm)"
            fieldKey="thickness"
            required={showDiameter}
          >
            <Input
              type="number"
              value={data.diameter ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === null) {
                  updateField("diameter", undefined);
                  return;
                }
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  updateField("diameter", numValue);
                }
              }}
              min={0}
              step={0.1}
              placeholder="Enter outer diameter"
              className="bg-background"
            />
          </FieldWithHelp>
        )}

        {/* Cone dimensions - Cone is always hollow (like a tapered tube) */}
        {isCone && (
          <>
            <FieldWithHelp
              label="Base OD (mm)"
              fieldKey="thickness"
              required
            >
              <Input
                type="number"
                value={data.coneBottomDiameter ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    updateField("coneBottomDiameter", undefined);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    updateField("coneBottomDiameter", numValue);
                  }
                }}
                min={0}
                step={0.1}
                placeholder="Base outer dia."
                className="bg-background"
              />
            </FieldWithHelp>

            <FieldWithHelp
              label="Top OD (mm)"
              fieldKey="thickness"
              required
            >
              <Input
                type="number"
                value={data.coneTopDiameter ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    updateField("coneTopDiameter", undefined);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    updateField("coneTopDiameter", numValue);
                  }
                }}
                min={1}
                max={data.coneBottomDiameter ? data.coneBottomDiameter - 0.1 : undefined}
                step={0.1}
                placeholder="Top outer dia."
                className="bg-background"
              />
            </FieldWithHelp>

            <FieldWithHelp
              label="Height (mm)"
              fieldKey="thickness"
              required
            >
              <Input
                type="number"
                value={data.coneHeight ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    updateField("coneHeight", undefined);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    updateField("coneHeight", numValue);
                  }
                }}
                min={0}
                step={0.1}
                placeholder="Length"
                className="bg-background"
              />
            </FieldWithHelp>

            <FieldWithHelp
              label="Wall (mm)"
              fieldKey="thickness"
              required
            >
              <Input
                type="number"
                value={data.wallThickness ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    updateField("wallThickness", undefined);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    updateField("wallThickness", numValue);
                  }
                }}
                min={0}
                step={0.1}
                placeholder="Wall thickness"
                className="bg-background"
              />
            </FieldWithHelp>
          </>
        )}

        {/* Hollow/Solid Toggle - not shown for cone (always hollow) */}
        {(canBeHollow || isAlwaysHollow) && !isCone && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHollow"
              checked={data.isHollow ?? false}
              onChange={(e) => onChange({ ...data, isHollow: e.target.checked })}
              className="w-3 h-3 cursor-pointer"
            />
            <Label htmlFor="isHollow" className="text-xs cursor-pointer">
              Hollow Part
            </Label>
          </div>
        )}

        {/* Hollow Dimensions */}
        {data.isHollow && (
          <>
            {showDiameter && (
              <>
                <FieldWithHelp
                  label="ID (mm)"
                  fieldKey="thickness"
                  required
                >
                  <Input
                    type="number"
                    value={data.innerDiameter ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateField("innerDiameter", undefined);
                        return;
                      }
                      const innerDiam = parseFloat(value);
                      if (!isNaN(innerDiam)) {
                        updateField("innerDiameter", innerDiam);
                        // Auto-calculate wall thickness
                        if (data.diameter && innerDiam > 0) {
                          updateField("wallThickness", (data.diameter - innerDiam) / 2);
                        }
                      }
                    }}
                    min={0}
                    max={data.diameter ? data.diameter - 0.1 : undefined}
                    step={0.1}
                    placeholder="Enter inner diameter"
                    className="bg-background"
                  />
                  {data.innerDiameter && data.diameter && data.innerDiameter >= data.diameter && (
                    <p className="text-xs text-destructive mt-1">
                      Inner diameter must be less than outer diameter
                    </p>
                  )}
                </FieldWithHelp>

                <FieldWithHelp
                  label="Wall (mm)"
                  fieldKey="thickness"
                >
                  <Input
                    type="number"
                    value={data.wallThickness?.toFixed(2) || 0}
                    onChange={(e) => updateField("wallThickness", parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.1}
                    className="bg-background"
                    disabled
                  />
                </FieldWithHelp>
              </>
            )}

            {!showDiameter && (data.partType === "box" || data.partType === "rectangular_tube" || data.partType === "square_bar" || data.partType === "rectangular_bar" || data.partType === "plate" || data.partType === "billet" || data.partType === "block") && (
              <>
                <FieldWithHelp
                  label="Inner L (mm)"
                  fieldKey="thickness"
                  required
                >
                  <Input
                    type="number"
                    value={data.innerLength ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateField("innerLength", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updateField("innerLength", numValue);
                      }
                    }}
                    min={0}
                    max={data.partLength ? data.partLength - 0.1 : undefined}
                    step={0.1}
                    placeholder="Enter inner length"
                    className="bg-background"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Inner W (mm)"
                  fieldKey="thickness"
                  required
                >
                  <Input
                    type="number"
                    value={data.innerWidth ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateField("innerWidth", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updateField("innerWidth", numValue);
                      }
                    }}
                    min={0}
                    max={data.partWidth ? data.partWidth - 0.1 : undefined}
                    step={0.1}
                    placeholder="Enter inner width"
                    className="bg-background"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Wall Thickness (mm)"
                  fieldKey="thickness"
                  required
                >
                  <Input
                    type="number"
                    value={data.wallThickness ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateField("wallThickness", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updateField("wallThickness", numValue);
                      }
                    }}
                    min={0}
                    step={0.1}
                    placeholder="Enter wall thickness"
                    className="bg-background"
                  />
                </FieldWithHelp>
              </>
            )}
          </>
        )}
      </div>

      {/* Technical Drawing with Dimensions */}
      {data.partType && (
        <Card className="p-4 mt-4">
          <h3 className="text-sm font-semibold mb-3">Part Drawing with Dimensions</h3>
          <div className="h-[480px] w-full overflow-hidden">
            <RealTimeTechnicalDrawing
              partType={data.partType}
              material={data.material as MaterialType}
              dimensions={{
                length: data.partLength || 100,
                width: data.partWidth || 50,
                thickness: data.partThickness || 10,
                diameter: data.diameter,
                isHollow: data.isHollow,
                innerDiameter: data.innerDiameter,
                innerLength: data.innerLength,
                innerWidth: data.innerWidth,
                wallThickness: data.wallThickness,
              }}
              showGrid={false}
              showDimensions={true}
            />
          </div>
        </Card>
      )}
    </div>
  );
};
