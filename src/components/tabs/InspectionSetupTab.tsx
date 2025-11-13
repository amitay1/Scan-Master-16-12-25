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
                      data.partType === "block";
  
  // Tube is always hollow
  const isAlwaysHollow = data.partType === "tube" || 
                         data.partType === "pipe" || 
                         data.partType === "ring" ||
                         data.partType === "ring_forging" ||
                         data.partType === "sleeve" ||
                         data.partType === "bushing";
  
  // Auto-calculate wall thickness if inner and outer dimensions are set
  React.useEffect(() => {
    if (data.isHollow && data.diameter && data.innerDiameter) {
      const calculatedWallThickness = (data.diameter - data.innerDiameter) / 2;
      if (Math.abs((data.wallThickness || 0) - calculatedWallThickness) > 0.01) {
        updateField("wallThickness", calculatedWallThickness);
      }
    }
  }, [data.diameter, data.innerDiameter]);
  
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
              value={data.diameter || 0}
              onChange={(e) => updateField("diameter", parseFloat(e.target.value) || 0)}
              min={0}
              step={0.1}
              className="bg-background"
            />
          </FieldWithHelp>
        )}

        {/* Hollow/Solid Toggle */}
        {(canBeHollow || isAlwaysHollow) && (
          <div className="md:col-span-2">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHollow"
                    checked={data.isHollow || isAlwaysHollow}
                    disabled={isAlwaysHollow}
                    onChange={(e) => {
                      updateField("isHollow", e.target.checked);
                      if (!e.target.checked) {
                        // Clear hollow-related fields
                        updateField("innerDiameter", undefined);
                        updateField("innerLength", undefined);
                        updateField("innerWidth", undefined);
                        updateField("wallThickness", undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isHollow" className="font-semibold cursor-pointer">
                    Hollow Part (Has Internal Cavity/Hole)
                  </Label>
                </div>
                {isAlwaysHollow && (
                  <Badge variant="secondary" className="text-xs">
                    Always Hollow
                  </Badge>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                  Enable if part has internal holes, cavities, or hollow sections
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Hollow Dimensions - Only show if hollow is enabled */}
        {(data.isHollow || isAlwaysHollow) && (
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
                    value={data.innerDiameter || 0}
                    onChange={(e) => {
                      const innerDiam = parseFloat(e.target.value) || 0;
                      updateField("innerDiameter", innerDiam);
                      // Auto-calculate wall thickness
                      if (data.diameter && innerDiam > 0) {
                        updateField("wallThickness", (data.diameter - innerDiam) / 2);
                      }
                    }}
                    min={0}
                    max={data.diameter ? data.diameter - 1 : undefined}
                    step={0.1}
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
                    value={data.innerLength || 0}
                    onChange={(e) => updateField("innerLength", parseFloat(e.target.value) || 0)}
                    min={0}
                    max={data.partLength ? data.partLength - 1 : undefined}
                    step={0.1}
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
                    value={data.innerWidth || 0}
                    onChange={(e) => updateField("innerWidth", parseFloat(e.target.value) || 0)}
                    min={0}
                    max={data.partWidth ? data.partWidth - 1 : undefined}
                    step={0.1}
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
                    value={data.wallThickness || 0}
                    onChange={(e) => updateField("wallThickness", parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.1}
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
