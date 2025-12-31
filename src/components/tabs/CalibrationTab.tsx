import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalibrationData, InspectionSetupData, AcceptanceClass, CalibrationBlockType, StandardType } from "@/types/techniqueSheet";
import { Target, Info } from "lucide-react";
import { CalibrationCatalog } from "../CalibrationCatalog";
import { CalibrationCADIntegration } from "../CalibrationCADIntegration";
import { toast } from "sonner";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
// New components for FBH table with dropdowns
import { FBHHoleTable } from "../FBHHoleTable";
import { FBHStraightBeamDrawing } from "../FBHStraightBeamDrawing";
import { AngleBeamDrawing } from "../AngleBeamDrawing";
import { DEFAULT_FBH_HOLES, type FBHHoleRowData } from "@/data/fbhStandardsData";
import {
  calibrationByStandard,
  getFBHSizeForStandard,
} from "@/data/standardsDifferences";

// Geometries that require ANGLE BEAM (circumferential shear wave)
const ANGLE_BEAM_GEOMETRIES = [
  'ring', 'ring_forging', 'pipe', 'tube', 'sleeve', 'bushing',
  'rectangular_tube', 'square_tube'
];

// Check if geometry requires angle beam inspection
const requiresAngleBeam = (partType: string | undefined): boolean => {
  if (!partType) return false;
  return ANGLE_BEAM_GEOMETRIES.includes(partType.toLowerCase());
};
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
  standard?: StandardType;
}

// Get standard label
const getStandardLabel = (standard: StandardType): string => {
  const labels: Record<StandardType, string> = {
    "MIL-STD-2154": "MIL-STD-2154",
    "AMS-STD-2154E": "AMS-STD-2154E",
    "ASTM-A388": "ASTM A388/A388M",
    "BS-EN-10228-3": "BS EN 10228-3:2016",
    "BS-EN-10228-4": "BS EN 10228-4:2016",
  };
  return labels[standard] || standard;
};

export const CalibrationTab = ({
  data,
  onChange,
  inspectionSetup,
  acceptanceClass,
  equipmentData,
  userId,
  projectId,
  standard = "AMS-STD-2154E"
}: CalibrationTabProps) => {
  // FBH Holes state - 3 rows by default with dropdown selections
  const [fbhHoles, setFbhHoles] = useState<FBHHoleRowData[]>(DEFAULT_FBH_HOLES);
  const [selectedModelId, setSelectedModelId] = useState<CalibrationBlockType | null>(null);

  const updateField = (field: keyof CalibrationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Handle FBH holes changes from table
  const handleFbhHolesChange = (newHoles: FBHHoleRowData[]) => {
    setFbhHoles(newHoles);
    // Update calibration data with FBH info - both legacy string AND structured array
    const fbhSizesStr = newHoles.map(h => h.diameterInch).join(', ');
    const avgMetalTravel = newHoles.length > 0
      ? newHoles.reduce((sum, h) => sum + h.metalTravelH, 0) / newHoles.length
      : 19.05;
    // Convert FBHHoleRowData[] to FBHHoleData[] for export
    const fbhHolesData = newHoles.map(h => ({
      id: h.id,
      partNumber: h.partNumber,
      deltaType: h.deltaType,
      diameterInch: h.diameterInch,
      diameterMm: h.diameterMm,
      distanceB: h.distanceB,
      metalTravelH: h.metalTravelH,
    }));
    onChange({
      ...data,
      fbhSizes: fbhSizesStr,
      fbhHoles: fbhHolesData,
      metalTravelDistance: avgMetalTravel,
    });
  };

  // Simple serial number generator
  const generateSerialNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
    return `CAL-${year}${month}${day}-${time}`;
  };

  // Initialize data on mount
  useEffect(() => {
    // Generate serial number if empty
    if (!data.blockSerialNumber) {
      updateField("blockSerialNumber", generateSerialNumber());
    }
    // Initialize fbhHoles if not present - ensures export has structured data
    if (!data.fbhHoles || data.fbhHoles.length === 0) {
      const initialFbhHoles = fbhHoles.map(h => ({
        id: h.id,
        partNumber: h.partNumber,
        deltaType: h.deltaType,
        diameterInch: h.diameterInch,
        diameterMm: h.diameterMm,
        distanceB: h.distanceB,
        metalTravelH: h.metalTravelH,
      }));
      const fbhSizesStr = fbhHoles.map(h => h.diameterInch).join(', ');
      const avgMetalTravel = fbhHoles.reduce((sum, h) => sum + h.metalTravelH, 0) / fbhHoles.length;
      onChange({
        ...data,
        fbhSizes: fbhSizesStr,
        fbhHoles: initialFbhHoles,
        metalTravelDistance: avgMetalTravel,
      });
    }
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId as CalibrationBlockType);
    updateField("standardType", modelId);
  };

  // Determine if angle beam is required based on part geometry
  const isAngleBeamRequired = requiresAngleBeam(inspectionSetup.partType);

  return (
    <div className="space-y-2 p-2">
      {/* Calibration Model Section - Dynamic based on geometry */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          {isAngleBeamRequired
            ? "Calibration Model - Angle Beam (Shear Wave)"
            : "Calibration Model - Straight Beam + FBH"}
        </h3>

        {/* Show appropriate drawing based on geometry */}
        {isAngleBeamRequired ? (
          <AngleBeamDrawing
            outerDiameter={inspectionSetup.diameter || 100}
            innerDiameter={inspectionSetup.innerDiameter || 60}
            wallThickness={inspectionSetup.wallThickness}
            partLength={inspectionSetup.partLength || 50}
            beamAngle={45}
            width={550}
            height={320}
            showDimensions={true}
          />
        ) : (
          <FBHStraightBeamDrawing
            partNumber={fbhHoles[0]?.partNumber || "7075 5-0150"}
            serialNumber={data.blockSerialNumber || "000"}
            width={600}
            height={450}
            showDimensions={true}
            title="FIG. 1 Standard Set Block Dimensions"
          />
        )}

        {/* FBH Holes Table - 3 rows with dropdowns */}
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-4">FBH Hole Specifications</h4>
          <FBHHoleTable
            holes={fbhHoles}
            onChange={handleFbhHolesChange}
            maxHoles={5}
            minHoles={1}
            showPartNumber={true}
            showDeltaType={true}
          />
        </div>
      </div>

      {/* Block Catalog */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Block Catalog
        </h3>
        <CalibrationCatalog
          recommendedModel={selectedModelId}
          onSelectModel={handleSelectModel}
          selectedModel={data.standardType || undefined}
        />
      </div>

      {/* Block Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Reference Standard Material"
          fieldKey="referenceBlockMaterial"
          required
        >
          <Input
            value={data.referenceMaterial}
            onChange={(e) => updateField("referenceMaterial", e.target.value)}
            placeholder="Steel / Aluminum / Titanium"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Dimensions (L×W×H mm)"
          fieldKey="calibrationBlock"
        >
          <Input
            value={data.blockDimensions}
            onChange={(e) => updateField("blockDimensions", e.target.value)}
            placeholder="100 × 50 × 50"
            className="bg-background"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Updates 3D model view
          </div>
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Serial Number"
          fieldKey="calibrationBlock"
        >
          <div className="flex gap-2">
            <Input
              value={data.blockSerialNumber}
              onChange={(e) => updateField("blockSerialNumber", e.target.value)}
              placeholder="CAL-2024-001"
              className="bg-background flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateField("blockSerialNumber", generateSerialNumber())}
              title="Generate new serial number"
            >
              Generate
            </Button>
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
              recommendedBlockType: selectedModelId || undefined,
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
