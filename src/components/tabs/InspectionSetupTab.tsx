import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InspectionSetupData, MaterialType, PartGeometry, AcceptanceClass } from "@/types/techniqueSheet";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { materialDatabase } from "@/utils/autoFillLogic";
import { SmartRecommendations } from "@/components/SmartRecommendations";
import { PartTypeVisualSelector } from "@/components/PartTypeVisualSelector";
import { Card } from "@/components/ui/card";
import { FieldWithHelp } from "@/components/FieldWithHelp";

interface InspectionSetupTabProps {
  data: InspectionSetupData;
  onChange: (data: InspectionSetupData) => void;
  acceptanceClass?: AcceptanceClass | "";
}

const materials: { value: MaterialType; label: string }[] = [
  { value: "aluminum", label: "Aluminum" },
  { value: "steel", label: "Steel" },
  { value: "stainless_steel", label: "Stainless Steel" },
  { value: "titanium", label: "Titanium" },
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
];


const materialSpecs: Record<MaterialType, string[]> = {
  aluminum: ["7075-T6 (QQ-A200/11)", "2024 (QQ-A-200/3)", "6061-T6", "2219-T87"],
  steel: ["4340 annealed (MIL-S-5000)", "4130", "17-4 PH", "15-5 PH"],
  stainless_steel: ["304 (AMS 5513)", "316 (AMS 5524)", "17-4 PH (AMS 5604)", "15-5 PH (AMS 5659)", "410", "420"],
  titanium: ["Ti-6Al-4V annealed (AMS 4928)", "Ti-6Al-4V STA", "Ti-5Al-2.5Sn", "CP Ti Grade 2"],
  magnesium: ["ZK60A (QQ-M-31)", "AZ31B", "AZ80A", "ZE41A"],
  custom: ["Custom Specification"],
};

/**
 * AUTOMATIC SHAPE CLASSIFICATION based on ASTM E2375-16
 * (Figure 7: Sound Beam Direction - Ring Forgings, Disk Forging)
 *
 * The system automatically determines the correct shape type based on dimensions:
 *
 * For HOLLOW cylindrical shapes (has inner diameter):
 *   - RING: L/T < 5 (Length/Wall-Thickness ratio less than 5)
 *   - TUBE: L/T >= 5 (longer hollow cylinder)
 *   Per ASTM E2375-16 Figure 7: "L/T < 5" indicates ring geometry for axial-only scanning
 *
 * For SOLID cylindrical shapes (no inner diameter):
 *   - DISK: H/D < 0.5 (Height/Diameter ratio less than 0.5)
 *   - CYLINDER: H/D >= 0.5 (taller solid cylinder)
 *   Based on industry standard proportional definitions
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
    // ASTM E2375-16 Figure 7: L/T < 5 indicates RING geometry
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
    // Industry standard: Disk when H/D < 0.5 (height less than half diameter)
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
 * AUTOMATIC RECTANGULAR SHAPE CLASSIFICATION based on ASTM E2375-16
 * (Figure 6: Sound Beam Direction for Various Shapes)
 *
 * From the standard:
 *   - PLATE: W/T > 5 (width-to-thickness ratio greater than 5)
 *   - RECTANGULAR BAR/BILLET: W/T < 5 (compact cross-section)
 *   - BAR: When length >> width,thickness (elongated profile)
 *
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

  // PLATE: Per ASTM E2375 Figure 6 - W/T > 5 (flat sheet-like geometry)
  const isPlate = widthToThicknessRatio > 5;

  // BAR: Elongated shape where length is much greater than cross-section
  // Using L/W > 4 as practical threshold for bar-like shapes
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

export const InspectionSetupTab = ({ data, onChange, acceptanceClass }: InspectionSetupTabProps) => {
  const updateField = (field: keyof InspectionSetupData, value: any) => {
    onChange({ ...data, [field]: value });
  };

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
                      data.partType === "cone" ||
                      data.partType === "block";

  // Check if it's a cone - needs special dimension fields
  const isCone = data.partType === "cone";
  
  // These shapes are typically hollow - show hint badge but allow toggle
  const isAlwaysHollow = data.partType === "tube" ||
                         data.partType === "pipe" ||
                         data.partType === "ring" ||
                         data.partType === "ring_forging" ||
                         data.partType === "sleeve" ||
                         data.partType === "bushing";

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
  // AUTOMATIC SHAPE CLASSIFICATION - Rafael 5036 Standard
  // Automatically updates partType when dimensions change:
  // - Circular: Ring ↔ Tube (hollow), Disk ↔ Cylinder (solid)
  // - Rectangular: Plate ↔ Bar ↔ Box (based on proportions)
  // ═══════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    if (!data.partType) return;
    
    // Classify the shape based on current dimensions using unified classifier
    const newPartType = classifyShape(data.partType, {
      diameter: data.diameter,
      innerDiameter: data.innerDiameter,
      length: data.partLength,
      width: data.partWidth,
      thickness: data.partThickness,
      wallThickness: data.wallThickness
    });
    
    // Only update if the classification changed
    if (newPartType !== data.partType) {
      console.log(`🔄 Auto-classifying shape: ${data.partType} → ${newPartType} (based on dimensions)`);
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        onChange({ ...data, partType: newPartType });
      }, 0);
    }
  }, [data.partType, data.diameter, data.innerDiameter, data.partLength, data.partWidth, data.partThickness, data.wallThickness, onChange]);
  
  // Get material properties for info
  const materialProps = data.material ? materialDatabase[data.material as MaterialType] : null;
  const materialInfo = materialProps ? 
    `Velocity: ${materialProps.velocity} mm/µs | Density: ${materialProps.density} g/cm³ | ${materialProps.surfaceCondition}` : 
    undefined;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Select 
            value={data.material} 
            onValueChange={(value: string) => {
              onChange({ ...data, material: value as MaterialType, materialSpec: "", customMaterialName: "" });
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select material..." />
            </SelectTrigger>
            <SelectContent>
              {materials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  {mat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select
            value={data.materialSpec}
            onValueChange={(value) => updateField("materialSpec", value)}
            disabled={!data.material}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={data.material ? "Select specification..." : "Select material first"} />
            </SelectTrigger>
            <SelectContent>
              {data.material && materialSpecs[data.material as MaterialType].map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <div className="md:col-span-2">
          <FieldWithHelp
            label="Part Type/Geometry"
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
            <div className="md:col-span-2">
              <FieldWithHelp
                label="Custom Shape Description"
                fieldKey="partType"
                required
              >
                <Input
                  value={data.customShapeDescription || ""}
                  onChange={(e) => updateField("customShapeDescription", e.target.value)}
                  placeholder="e.g., Complex dome with multiple radii and stepped wall thickness..."
                  className="bg-background"
                />
              </FieldWithHelp>
            </div>

            <div className="md:col-span-2">
              <FieldWithHelp
                label="Custom Shape Image"
                fieldKey="partType"
              >
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('custom-shape-image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Shape Image
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
                          variant="destructive"
                          size="sm"
                          onClick={() => updateField("customShapeImage", undefined)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Image
                        </Button>
                      )}
                    </div>

                    {data.customShapeImage ? (
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <img 
                          src={data.customShapeImage} 
                          alt="Custom Shape" 
                          className="w-full h-auto max-h-96 object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image uploaded</p>
                        <p className="text-xs">Upload a technical drawing or photo of the custom shape</p>
                      </div>
                    )}
                  </div>
                </Card>
              </FieldWithHelp>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Dimension 1</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.customShapeParameters?.dimension1?.label || ""}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension1: { 
                        label: e.target.value, 
                        value: data.customShapeParameters?.dimension1?.value || 0 
                      }
                    })}
                    placeholder="Label (e.g., Top Diameter)"
                    className="bg-background flex-1"
                  />
                  <Input
                    type="number"
                    value={data.customShapeParameters?.dimension1?.value || 0}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension1: { 
                        label: data.customShapeParameters?.dimension1?.label || "", 
                        value: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Value (mm)"
                    className="bg-background w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Dimension 2</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.customShapeParameters?.dimension2?.label || ""}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension2: { 
                        label: e.target.value, 
                        value: data.customShapeParameters?.dimension2?.value || 0 
                      }
                    })}
                    placeholder="Label (e.g., Bottom Diameter)"
                    className="bg-background flex-1"
                  />
                  <Input
                    type="number"
                    value={data.customShapeParameters?.dimension2?.value || 0}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension2: { 
                        label: data.customShapeParameters?.dimension2?.label || "", 
                        value: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Value (mm)"
                    className="bg-background w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Dimension 3</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.customShapeParameters?.dimension3?.label || ""}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension3: { 
                        label: e.target.value, 
                        value: data.customShapeParameters?.dimension3?.value || 0 
                      }
                    })}
                    placeholder="Label (optional)"
                    className="bg-background flex-1"
                  />
                  <Input
                    type="number"
                    value={data.customShapeParameters?.dimension3?.value || 0}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension3: { 
                        label: data.customShapeParameters?.dimension3?.label || "", 
                        value: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Value (mm)"
                    className="bg-background w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Dimension 4</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.customShapeParameters?.dimension4?.label || ""}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension4: { 
                        label: e.target.value, 
                        value: data.customShapeParameters?.dimension4?.value || 0 
                      }
                    })}
                    placeholder="Label (optional)"
                    className="bg-background flex-1"
                  />
                  <Input
                    type="number"
                    value={data.customShapeParameters?.dimension4?.value || 0}
                    onChange={(e) => updateField("customShapeParameters", {
                      ...data.customShapeParameters,
                      dimension4: { 
                        label: data.customShapeParameters?.dimension4?.label || "", 
                        value: parseFloat(e.target.value) || 0 
                      }
                    })}
                    placeholder="Value (mm)"
                    className="bg-background w-32"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <FieldWithHelp
          label="Part Thickness (mm)"
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
          label="Part Length (mm)"
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
          label="Part Width (mm)"
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

        {showDiameter && (
          <FieldWithHelp
            label="Outer Diameter (mm)"
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

        {/* Cone-specific dimensions */}
        {isCone && (
          <>
            <FieldWithHelp
              label="Bottom Diameter (mm)"
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
                placeholder="Base diameter (larger)"
                className="bg-background"
              />
            </FieldWithHelp>

            <FieldWithHelp
              label="Top Diameter (mm)"
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
                min={0}
                max={data.coneBottomDiameter ? data.coneBottomDiameter - 0.1 : undefined}
                step={0.1}
                placeholder="Top diameter (smaller, 0 = pointed)"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set to 0 for a pointed cone, or enter diameter for truncated cone
              </p>
            </FieldWithHelp>

            <FieldWithHelp
              label="Cone Height (mm)"
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
                placeholder="Height from base to top"
                className="bg-background"
              />
            </FieldWithHelp>
          </>
        )}

        {/* Hollow/Solid Toggle - freely toggleable for all shapes */}
        {(canBeHollow || isAlwaysHollow) && (
          <div className="md:col-span-2">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHollow"
                    checked={data.isHollow ?? false}
                    onChange={(e) => {
                      // Just toggle - don't clear data so user can preview solid/hollow freely
                      onChange({ ...data, isHollow: e.target.checked });
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor="isHollow" className="font-semibold cursor-pointer">
                    Hollow Part (Has Internal Cavity/Hole)
                  </Label>
                </div>
                {isAlwaysHollow && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Typically Hollow
                  </Badge>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                  Toggle to show/hide internal cavity dimensions
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Hollow Dimensions - Only show when hollow checkbox is checked */}
        {data.isHollow && (
          <>
            {showDiameter && (
              <>
                <FieldWithHelp
                  label="Inner Diameter (mm)"
                  fieldKey="thickness"
                  required
                >
                  <Input
                    type="number"
                    value={data.innerDiameter ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for editing - don't force back to 0
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
                  label="Wall Thickness (mm)"
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated: (OD - ID) / 2 = {data.wallThickness?.toFixed(2) || 0}mm
                  </p>
                </FieldWithHelp>
              </>
            )}

            {!showDiameter && (data.partType === "box" || data.partType === "rectangular_tube" || data.partType === "square_bar" || data.partType === "rectangular_bar" || data.partType === "plate" || data.partType === "billet" || data.partType === "block") && (
              <>
                <FieldWithHelp
                  label="Inner Length (mm)"
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
                  label="Inner Width (mm)"
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

      {/* Smart Recommendations Panel */}
      <SmartRecommendations
        geometry={data.partType}
        material={data.material}
        thickness={data.partThickness}
        width={data.partWidth}
        length={data.partLength}
        diameter={data.diameter}
        acceptanceClass={acceptanceClass}
      />
    </div>
  );
};
