import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalibrationData, InspectionSetupData, AcceptanceClass, CalibrationBlockType } from "@/types/techniqueSheet";
import { Target, Sparkles, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateCalibrationRecommendation } from "@/utils/calibrationRecommender";
import { CalibrationCatalog } from "../CalibrationCatalog";
import { FBH_3_64_SERIES, pickStandardForMetalTravel } from "@/data/calibrationStandards";
import { CalibrationStandardsTable } from "../CalibrationStandardsTable";
import { CalibrationCADIntegration } from "../CalibrationCADIntegration";
import CalibrationBlock3D from "../CalibrationBlock3D";
import { CalibrationBlockDrawing } from "../CalibrationBlockDrawing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import type { 
  CalibrationTabFields, 
  InspectionSetupTabFields, 
  EquipmentTabFields 
} from "@/types/scanMasterCAD";

interface CalibrationTabProps {
  data: CalibrationData;
  onChange: (data: CalibrationData) => void;
  inspectionSetup: InspectionSetupData;
  acceptanceClass: AcceptanceClass | "";
  // Additional data for CAD Integration
  equipmentData?: EquipmentTabFields;
  userId?: string;
  projectId?: string;
}

// Using imported FieldWithHelp component

export const CalibrationTab = ({ 
  data, 
  onChange, 
  inspectionSetup, 
  acceptanceClass, 
  equipmentData,
  userId,
  projectId 
}: CalibrationTabProps) => {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [recommendedModelId, setRecommendedModelId] = useState<CalibrationBlockType | null>(null);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [recommendedStandardId, setRecommendedStandardId] = useState<string | null>(null);
  const [hoveredStandardId, setHoveredStandardId] = useState<string | null>(null);

  // Table data for 3D display - REACTIVE to user input
  const fbhTableData = useMemo(() => {
    // If user has entered custom FBH sizes, use those
    if (data.fbhSizes && data.fbhSizes.trim()) {
      const fbhSizesArray = data.fbhSizes.split(',').map(s => s.trim()).filter(Boolean);
      const metalTravel = parseFloat(String(data.metalTravelDistance || "25.4"));

      return fbhSizesArray.map((size, index) => {
        // Parse fraction to decimal (e.g., "3/64" -> 0.046875 inches -> 1.19mm)
        let diameterMM = 1.19; // default
        if (size.includes('/')) {
          const [num, denom] = size.split('/').map(Number);
          if (num && denom) {
            diameterMM = (num / denom) * 25.4; // Convert inches to mm
          }
        } else {
          // Try parsing as decimal mm
          const parsed = parseFloat(size);
          if (!isNaN(parsed)) {
            diameterMM = parsed;
          }
        }

        // Calculate depth based on metal travel distance and index
        // Shallow to deep progression
        const depthFactor = (index + 1) / fbhSizesArray.length;
        const depth = metalTravel * depthFactor;

        return {
          identification: `FBH-${index + 1}`,
          type: 'FBH' as const,
          depth: depth,
          diameter: diameterMM,
          notes: `${size} @ ${depth.toFixed(1)}mm depth`
        };
      });
    }

    // Fallback to static standards data if no user input
    return FBH_3_64_SERIES.map(standard => ({
      identification: standard.defectId,
      type: 'FBH' as const,
      depth: standard.depthMm,
      diameter: 1.19,
      notes: standard.note || ''
    }));
  }, [data.fbhSizes, data.metalTravelDistance]);

  const updateField = (field: keyof CalibrationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const canGenerateRecommendation = 
    inspectionSetup.material && 
    inspectionSetup.partType && 
    inspectionSetup.partThickness >= 6.35 &&
    acceptanceClass;

  // Smart auto-fill functions
  const getSmartReferenceMaterial = (material: string, materialSpec?: string) => {
    const materialMap: Record<string, string> = {
      'Steel': materialSpec || 'Steel Block (ASTM A36)',
      'Stainless Steel': materialSpec || 'SS 316L Block (ASTM A240)',
      'Aluminum': materialSpec || 'Al 6061-T6 Block (ASTM B211)',
      'Titanium': materialSpec || 'Ti-6Al-4V Block (AMS 4928)',
      'Inconel': materialSpec || 'Inconel 718 Block (AMS 5662)',
      'Carbon Steel': materialSpec || 'Carbon Steel Block (ASTM A106)',
    };
    return materialMap[material] || `${material} Reference Block`;
  };

  const getSmartFBHSizes = (partThickness: number) => {
    if (partThickness < 10) return "1/64, 2/64, 3/64";
    if (partThickness < 25) return "2/64, 3/64, 4/64";
    if (partThickness < 50) return "2/64, 3/64, 5/64";
    return "3/64, 4/64, 5/64, 8/64";
  };

  const getSmartBlockDimensions = (partThickness: number) => {
    const length = Math.max(100, partThickness * 3);
    const width = Math.max(50, partThickness * 2);
    const height = Math.max(25, partThickness * 1.5);
    return `${length} × ${width} × ${height}`;
  };

  const generateSerialNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
    return `CAL-${year}${month}${day}-${time}`;
  };

  // Auto-fill effect when inspection setup changes
  useEffect(() => {
    if (inspectionSetup.material && !data.referenceMaterial) {
      updateField("referenceMaterial", getSmartReferenceMaterial(inspectionSetup.material, inspectionSetup.materialSpec));
    }
    
    if (inspectionSetup.partThickness > 0 && !data.fbhSizes) {
      updateField("fbhSizes", getSmartFBHSizes(inspectionSetup.partThickness));
    }
    
    if (inspectionSetup.partThickness > 0 && !data.blockDimensions) {
      updateField("blockDimensions", getSmartBlockDimensions(inspectionSetup.partThickness));
    }
    
    if (!data.blockSerialNumber) {
      updateField("blockSerialNumber", generateSerialNumber());
    }
  }, [inspectionSetup.material, inspectionSetup.materialSpec, inspectionSetup.partThickness]);

  // Real-time recommendation updates
  useEffect(() => {
    if (canGenerateRecommendation) {
      try {
        const rec = generateCalibrationRecommendation({
          material: inspectionSetup.material as any,
          materialSpec: inspectionSetup.materialSpec,
          partType: inspectionSetup.partType as any,
          thickness: inspectionSetup.partThickness,
          acceptanceClass: acceptanceClass as any,
        });
        
        setRecommendation(rec);
        setRecommendedModelId(rec.standardType as CalibrationBlockType);

        // Map the recommended metal travel distance to the closest FBH standard
        const targetTravel = rec.metalTravel?.distances?.[0];
        const std = typeof targetTravel === "number"
          ? pickStandardForMetalTravel(targetTravel, FBH_3_64_SERIES)
          : null;

        if (std) {
          setRecommendedStandardId(std.defectId);

          // Auto-select the standard if the user has not chosen one yet
          if (!selectedStandardId) {
            handleSelectStandard(std, false);
          }
        } else {
          setRecommendedStandardId(null);
        }
      } catch (error) {
        setRecommendedModelId(null);
        setRecommendedStandardId(null);
      }
    } else {
      setRecommendedModelId(null);
      setRecommendedStandardId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionSetup.material, inspectionSetup.partType, inspectionSetup.partThickness, acceptanceClass, canGenerateRecommendation]);

  const handleSelectStandard = (row: (typeof FBH_3_64_SERIES)[number], markAsUserSelection: boolean = true) => {
    setSelectedStandardId(row.defectId);

    // Update calibration form fields based on the selected standard row
    onChange({
      ...data,
      metalTravelDistance: row.depthMm,
      blockSerialNumber: row.defectId,
      // Keep existing values for other fields (fbhSizes, etc.)
    });

    // If this came from a user click, we can optionally show a toast from here in future
    if (markAsUserSelection) {
      // no-op for now (avoid importing toast twice)
    }
  };

  const handleSelectModel = (modelId: string) => {
    updateField("standardType", modelId);
    
    // If selecting the recommended model, auto-fill related fields
    if (recommendation && modelId === recommendation.standardType) {
      onChange({
        ...data,
        standardType: modelId as CalibrationBlockType,
        referenceMaterial: recommendation.material,
        fbhSizes: recommendation.fbhSizes.join(", "),
        metalTravelDistance: recommendation.metalTravel.distances[0],
      });
      toast.success("Recommended calibration applied!");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Auto Recommendation Info */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              🤖 AI-Powered Calibration Recommendation
              <Sparkles className="h-5 w-5 text-accent" />
              {inspectionSetup.material && (
                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs">
                  ✨ Smart Auto-Fill Active
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Fill out the Inspection Setup and Acceptance Class tabs, and we'll automatically highlight the 
              recommended calibration model below. Click the glowing model to apply all settings instantly!
            </p>
            {!canGenerateRecommendation && (
              <Badge variant="outline" className="mt-2">
                ⚠️ Complete Inspection Setup & Acceptance Class to see recommendations
              </Badge>
            )}
            {recommendedModelId && (
              <Badge className="mt-2 bg-primary">
                ✓ Recommendation ready - look for the glowing model below!
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Live 3D Calibration Block Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Calibration Block Visualization
        </h3>
        
        <Tabs defaultValue="3d" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="3d" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              3D Interactive View
            </TabsTrigger>
            <TabsTrigger value="2d" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Technical Drawing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="mt-0">
            <div className="h-96 border rounded-lg overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
              <CalibrationBlock3D
                blockWidth={parseFloat(data.blockDimensions?.split('×')[0]?.trim() || "0") || 150}
                blockHeight={parseFloat(data.blockDimensions?.split('×')[2]?.trim() || "0") || 50}
                blockLength={parseFloat(data.blockDimensions?.split('×')[1]?.trim() || "0") || 100}
                fbhData={fbhTableData}
                material={
                  inspectionSetup.material?.toLowerCase() === 'titanium' ? 'titanium' :
                  inspectionSetup.material?.toLowerCase() === 'aluminum' ? 'aluminum' :
                  'steel'
                }
                blockType={(data.standardType || recommendedModelId || 'flat_block') as any}
                showDimensions={true}
                showFBHLabels={true}
                highlightedFBH={hoveredStandardId || selectedStandardId || undefined}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="2d" className="mt-0">
            <div className="border rounded-lg overflow-hidden">
              <CalibrationBlockDrawing 
                blockType={(data.standardType || recommendedModelId || 'flat_block') as CalibrationBlockType}
                width={500}
                height={400}
                dimensions={{
                  length: parseFloat(data.blockDimensions?.split('×')[0]?.trim() || "0") || 150,
                  width: parseFloat(data.blockDimensions?.split('×')[1]?.trim() || "0") || 100,
                  height: parseFloat(data.blockDimensions?.split('×')[2]?.trim() || "0") || 50,
                }}
                fbhData={fbhTableData.map((fbh, i) => ({
                  size: data.fbhSizes?.split(',')[i]?.trim() || '3/64',
                  diameter: fbh.diameter,
                  depth: fbh.depth,
                  position: {
                    x: (i + 1) * 50,
                    y: 50,
                  },
                  label: fbh.identification
                }))}
                material={
                  inspectionSetup.material?.toLowerCase() === 'titanium' ? 'Ti-6Al-4V' :
                  inspectionSetup.material?.toLowerCase() === 'aluminum' ? '6061-T6 AL' :
                  'Steel (ASTM A36)'
                }
                showDimensions={true}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              📐 Technical drawing per MIL-STD-2154 / ASTM E164 specifications
            </p>
          </TabsContent>
        </Tabs>
        
        {/* Legacy Catalog - Hidden for now */}
        <div className="hidden">
          <CalibrationCatalog
            recommendedModel={recommendedModelId}
            onSelectModel={handleSelectModel}
            selectedModel={data.standardType || undefined}
          />
        </div>
      </div>

      {/* Standards used for calibration (FBH table) */}
      <CalibrationStandardsTable
        standards={FBH_3_64_SERIES}
        selectedId={selectedStandardId ?? undefined}
        recommendedId={recommendedStandardId ?? undefined}
        onSelect={(row) => handleSelectStandard(row, true)}
        onHover={(defectId) => setHoveredStandardId(defectId)}
      />

      {/* Manual Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <FieldWithHelp
          label="Reference Standard Material"
          fieldKey="referenceBlockMaterial"
          required
          autoFilled={!!inspectionSetup.material}
        >
          <div className="relative">
            <Input
              value={data.referenceMaterial}
              onChange={(e) => updateField("referenceMaterial", e.target.value)}
              placeholder="Ti-6Al-4V annealed (AMS 4928)"
              className={`bg-background ${!!inspectionSetup.material ? 'border-green-300 bg-green-50 text-gray-900 placeholder:text-gray-500' : ''}`}
            />
            {!!inspectionSetup.material && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-green-100"
                onClick={() => updateField("referenceMaterial", getSmartReferenceMaterial(inspectionSetup.material, inspectionSetup.materialSpec))}
                title="Auto-fill from part material"
              >
                <Sparkles className="h-3 w-3 text-green-600" />
              </Button>
            )}
          </div>
          {!!inspectionSetup.material && (
            <div className="text-xs text-green-600 mt-1">
              🤖 Smart-filled from {inspectionSetup.material} part material
            </div>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Flat-Bottom Hole Sizes (inches)"
          fieldKey="fbhSize"
          required
          autoFilled={!!inspectionSetup.partThickness}
        >
          <div className="relative">
            <Input
              value={data.fbhSizes}
              onChange={(e) => updateField("fbhSizes", e.target.value)}
              placeholder="2/64, 3/64, 5/64"
              className={`bg-background ${inspectionSetup.partThickness > 0 ? 'border-blue-300 bg-blue-50 text-gray-900 placeholder:text-gray-500' : ''}`}
            />
            {inspectionSetup.partThickness > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-blue-100"
                onClick={() => updateField("fbhSizes", getSmartFBHSizes(inspectionSetup.partThickness))}
                title="Auto-suggest based on part thickness"
              >
                <Target className="h-3 w-3 text-blue-600" />
              </Button>
            )}
          </div>
          {inspectionSetup.partThickness > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              🎯 Optimized for {inspectionSetup.partThickness}mm thick part
            </div>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Metal Travel Distance (mm)"
          fieldKey="fbhDepth"
          required
          autoFilled={!!recommendation}
        >
          <div className="relative">
            <Input
              type="number"
              value={data.metalTravelDistance}
              onChange={(e) => updateField("metalTravelDistance", parseFloat(e.target.value) || 0)}
              min={0}
              step={0.1}
              className={`bg-background ${recommendation ? 'border-orange-300 bg-orange-50 text-gray-900 placeholder:text-gray-500' : ''}`}
            />
            {recommendation && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-orange-100"
                onClick={() => {
                  const targetTravel = recommendation.metalTravel?.distances?.[0];
                  if (typeof targetTravel === "number") {
                    updateField("metalTravelDistance", targetTravel);
                  }
                }}
                title="Use AI-recommended distance"
              >
                <Sparkles className="h-3 w-3 text-orange-600" />
              </Button>
            )}
          </div>
          {recommendation && (
            <div className="text-xs text-orange-600 mt-1">
              🎯 AI recommends: {recommendation.metalTravel?.distances?.[0]}mm
            </div>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Dimensions (L×W×H mm)"
          fieldKey="calibrationBlock"
        >
          <div className="relative">
            <Input
              value={data.blockDimensions}
              onChange={(e) => {
                updateField("blockDimensions", e.target.value);
                // Immediate update of 3D display
              }}
              placeholder="150 × 75 × 50"
              className={`bg-background ${inspectionSetup.partThickness > 0 ? 'border-purple-300 bg-purple-50 text-gray-900 placeholder:text-gray-500' : ''}`}
            />
            {inspectionSetup.partThickness > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-purple-100"
                onClick={() => updateField("blockDimensions", getSmartBlockDimensions(inspectionSetup.partThickness))}
                title="Auto-size based on part thickness"
              >
                <Sparkles className="h-3 w-3 text-purple-600" />
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            💡 Changes update the 3D model instantly above
            {inspectionSetup.partThickness > 0 && (
              <span className="text-purple-600 block">🔮 Smart-sized for {inspectionSetup.partThickness}mm part</span>
            )}
          </div>
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Serial Number"
          fieldKey="calibrationBlock"
        >
          <div className="relative">
            <Input
              value={data.blockSerialNumber}
              onChange={(e) => updateField("blockSerialNumber", e.target.value)}
              placeholder="CAL-2024-001"
              className="bg-background border-amber-300 bg-amber-50 text-gray-900 placeholder:text-gray-500"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-amber-100"
              onClick={() => updateField("blockSerialNumber", generateSerialNumber())}
              title="Generate new serial number"
            >
              <Sparkles className="h-3 w-3 text-amber-600" />
            </Button>
          </div>
          <div className="text-xs text-amber-600 mt-1">
            🏷️ Auto-generated with timestamp
          </div>
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Last Calibrated"
          fieldKey="calibrationBlock"
        >
          <Input
            type="date"
            value={data.lastCalibrationDate}
            onChange={(e) => updateField("lastCalibrationDate", e.target.value)}
            className="bg-background"
          />
        </FieldWithHelp>
      </div>

      {/* ScanMaster CAD Integration */}
      <div className="mt-8">
        <CalibrationCADIntegration
            calibrationData={{
              fbhSizes: data.fbhSizes || "",
              metalTravelDistance: data.metalTravelDistance || 0,
              blockDimensions: (() => {
                // Parse blockDimensions - handle various formats: "100×50×25", "100 × 50 × 25", "100x50x25", "100 x 50 x 25"
                const dimStr = data.blockDimensions || "";
                const parts = dimStr.split(/\s*[×xX]\s*/); // Split by × or x with optional spaces
                return {
                  L: parseFloat(parts[0]?.trim() || "0") || 100,
                  W: parseFloat(parts[1]?.trim() || "0") || 50,
                  H: parseFloat(parts[2]?.trim() || "0") || 25,
                };
              })(),
              standardType: data.standardType || "",
              // Pass the recommended block type from the calibration recommender
              recommendedBlockType: recommendation?.standardType || recommendedModelId || undefined,
            }}
            inspectionData={{
              material: inspectionSetup.material || "",
              partThickness: inspectionSetup.partThickness || 0,
              partType: inspectionSetup.partType || "",
              isHollow: inspectionSetup.isHollow || false,
              acceptanceClass: acceptanceClass || "",
            }}
            equipmentData={{
              probeType: equipmentData?.probeType || "Straight Beam",
              frequency: equipmentData?.frequency || 5.0,
              inspectionType: equipmentData?.inspectionType || "UT",
              // Determine beam type from probe type or inspection type
              beamType: (equipmentData?.probeType?.toLowerCase().includes('angle') || 
                        equipmentData?.inspectionType?.toLowerCase().includes('angle')) ? 'angle' : 'straight',
            }}
            userId={userId}
            projectId={projectId}
            onSuccess={(result) => {
              toast.success("Calibration block created successfully! 🎉", {
                description: `${result.partInfo.holesCount} FBH holes drilled`,
                action: {
                  label: "Download STEP",
                  onClick: () => {
                    const link = document.createElement('a');
                    link.href = result.outputPath;
                    link.download = `calibration_block_${Date.now()}.step`;
                    link.click();
                  }
                }
              });
            }}
            onError={(error) => {
              toast.error("Error creating calibration block", {
                description: error
              });
            }}
          />
      </div>
    </div>
  );
};
