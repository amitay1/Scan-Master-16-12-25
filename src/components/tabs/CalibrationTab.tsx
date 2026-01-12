import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalibrationData, InspectionSetupData, AcceptanceClass, CalibrationBlockType, StandardType } from "@/types/techniqueSheet";
import { Target, Info, Sparkles } from "lucide-react";
import { CalibrationCatalog } from "../CalibrationCatalog";
import { toast } from "sonner";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// New components for FBH table with dropdowns
import { FBHHoleTable } from "../FBHHoleTable";
import { FBHStraightBeamDrawing } from "../FBHStraightBeamDrawing";
import { AngleBeamCalibrationBlockDrawing } from "../AngleBeamCalibrationBlockDrawing";
import { DEFAULT_FBH_HOLES, type FBHHoleRowData } from "@/data/fbhStandardsData";
import {
  calibrationByStandard,
  getFBHSizeForStandard,
} from "@/data/standardsDifferences";
import {
  getBeamRequirement,
  BEAM_TYPE_LABELS,
} from "@/utils/beamTypeClassification";

interface CalibrationTabProps {
  data: CalibrationData;
  onChange: (data: CalibrationData) => void;
  inspectionSetup: InspectionSetupData;
  acceptanceClass: AcceptanceClass | "";
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
  standard = "AMS-STD-2154E"
}: CalibrationTabProps) => {
  // FBH Holes state - 3 rows by default with dropdown selections
  const [fbhHoles, setFbhHoles] = useState<FBHHoleRowData[]>(DEFAULT_FBH_HOLES);
  const [selectedModelId, setSelectedModelId] = useState<CalibrationBlockType | null>(null);
  const [activeBeamTab, setActiveBeamTab] = useState<"straight" | "angle">("straight");

  // Determine beam requirements based on part type and hollow status
  const beamRequirement = useMemo(
    () => getBeamRequirement(inspectionSetup.partType, inspectionSetup.isHollow),
    [inspectionSetup.partType, inspectionSetup.isHollow]
  );
  const needsBothBeams = beamRequirement === "both";

  // Memoize partDimensions to prevent infinite re-renders in RingSegmentBlockDrawing
  const partDimensions = useMemo(() => ({
    outerDiameterMm: inspectionSetup.diameter || undefined,
    innerDiameterMm: inspectionSetup.innerDiameter || undefined,
    axialWidthMm: inspectionSetup.partLength || inspectionSetup.wallThickness || undefined,
  }), [inspectionSetup.diameter, inspectionSetup.innerDiameter, inspectionSetup.partLength, inspectionSetup.wallThickness]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId as CalibrationBlockType);
    updateField("standardType", modelId);
  };

  // Render the Straight Beam content (FBH drawing + table)
  const renderStraightBeamContent = () => (
    <>
      <FBHStraightBeamDrawing
        partNumber={fbhHoles[0]?.partNumber || "7075 5-0150"}
        serialNumber={data.blockSerialNumber || "000"}
        width={600}
        height={450}
        showDimensions={true}
        title="FIG. 1 Standard Set Block Dimensions"
      />
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
          standard={standard}
        />
      </div>
    </>
  );

  // Render the Angle Beam content (calibration block drawing)
  // Note: partDimensions is memoized at component level to prevent infinite re-renders
  const renderAngleBeamContent = () => {
    return (
      <div className="space-y-4">
        {/* Prominent notice for shear wave calibration */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4">
          <h4 className="font-bold text-orange-800 text-lg mb-2">
            🔊 Shear Wave Calibration Required
          </h4>
          <p className="text-orange-700 text-sm">
            This part geometry (tube, cylinder, cone, or sphere) requires shear wave inspection 
            for circumferential coverage. The reference standard below shows the required calibration 
            block design with FBH positions and step wedge profiles.
          </p>
          {/* Show part dimensions if available */}
          {(inspectionSetup.diameter || inspectionSetup.innerDiameter) && (
            <div className="mt-2 p-2 bg-white/50 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                📐 Part Dimensions: 
                {inspectionSetup.diameter && ` OD=${inspectionSetup.diameter}mm`}
                {inspectionSetup.innerDiameter && ` ID=${inspectionSetup.innerDiameter}mm`}
                {inspectionSetup.wallThickness && ` Wall=${inspectionSetup.wallThickness}mm`}
              </p>
            </div>
          )}
        </div>
        
        {/* Angle Beam Calibration Block Drawing - Now with Part Dimensions! */}
        <AngleBeamCalibrationBlockDrawing
          width={950}
          height={700}
          showDimensions={true}
          title="Shear Wave Calibration Block - Reference Standard for Circular Parts"
          partDimensions={partDimensions}
          useParametric={true}
        />
      </div>
    );
  };

  return (
    <div className="space-y-2 p-2">
      {/* Calibration Model Section - Dynamic based on geometry */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Calibration Block
          {needsBothBeams && (
            <Badge variant="secondary" className="ml-2">
              Requires Both Beam Types
            </Badge>
          )}
          {data.autoRecommendedReason && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300 cursor-help">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Selected (Scan-Aware)
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">🎯 Auto-Selected Based On:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Part Geometry & Dimensions</li>
                      <li>Critical Scan Types (Circumferential/Angle Beam)</li>
                      <li>Standard Requirements</li>
                    </ul>
                    <p className="text-sm border-t pt-2">{data.autoRecommendedReason}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </h3>

        {/* Show tabs when both beam types are required */}
        {needsBothBeams ? (
          <Tabs
            value={activeBeamTab}
            onValueChange={(v) => setActiveBeamTab(v as "straight" | "angle")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="straight" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                {BEAM_TYPE_LABELS.straight.short}
              </TabsTrigger>
              <TabsTrigger value="angle" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">
                {BEAM_TYPE_LABELS.angle.short}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="straight" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {BEAM_TYPE_LABELS.straight.description}
              </div>
              {renderStraightBeamContent()}
            </TabsContent>
            <TabsContent value="angle" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {BEAM_TYPE_LABELS.angle.description}
              </div>
              {renderAngleBeamContent()}
            </TabsContent>
          </Tabs>
        ) : (
          // Only straight beam required - show without tabs
          <div className="space-y-4">
            {renderStraightBeamContent()}
          </div>
        )}
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
    </div>
  );
};
