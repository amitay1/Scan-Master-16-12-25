import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalibrationData, InspectionSetupData, AcceptanceClass, CalibrationBlockType, StandardType, CalibrationSensitivityRow } from "@/types/techniqueSheet";
import { Target, Info, Sparkles, AlertTriangle, Plus, X } from "lucide-react";
import { CalibrationCatalog } from "../CalibrationCatalog";
import { toast } from "sonner";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BlockTypeSelection, getBlockTypeOptions } from "@/types/calibrationBlocks";
// New components for FBH table with dropdowns and previews
import { FBHHoleTableWithPreviews } from "../FBHHoleTableWithPreviews";
import { AngleBeamCalibrationBlockDrawing } from "../AngleBeamCalibrationBlockDrawing";
import {
  DEFAULT_FBH_HOLES,
  type FBHHoleRowData,
  FBH_DIAMETER_OPTIONS,
  METAL_TRAVEL_OPTIONS
} from "@/data/fbhStandardsData";
import {
  calibrationByStandard,
  getFBHSizeForStandard,
} from "@/data/standardsDifferences";
import {
  getBeamRequirement,
  BEAM_TYPE_LABELS,
} from "@/utils/beamTypeClassification";

// ============================================================================
// HELPER FUNCTIONS FOR FBH AUTO-FILL
// ============================================================================

/**
 * Parse FBH diameter from the string returned by getFBHSizeForStandard()
 * Examples:
 *   "1/64\" (0.4mm)" → { inch: "1/64", mm: 0.4 }
 *   "3mm (0.118\")" → { inch: "-", mm: 3 }
 *   "#1 FBH (1/64\" / 0.4mm)" → { inch: "1/64", mm: 0.4 }
 */
function parseFBHSizeString(sizeStr: string): { inch: string; mm: number } | null {
  if (!sizeStr) return null;

  // Try to match patterns like "1/64" or "3/64"
  const inchMatch = sizeStr.match(/(\d+\/\d+)"/);
  if (inchMatch) {
    const inchVal = inchMatch[1];
    // Find in options
    const option = FBH_DIAMETER_OPTIONS.find(opt => opt.inch === inchVal);
    if (option) {
      return { inch: option.inch, mm: option.mm };
    }
    // Calculate mm from fraction
    const [num, denom] = inchVal.split('/').map(Number);
    if (num && denom) {
      const mm = Number(((num / denom) * 25.4).toFixed(2));
      return { inch: inchVal, mm };
    }
  }

  // Try to match metric patterns like "3mm" or "5mm"
  const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (mmMatch) {
    const mmVal = parseFloat(mmMatch[1]);
    // Find metric option in FBH_DIAMETER_OPTIONS
    const metricOption = FBH_DIAMETER_OPTIONS.find(
      opt => opt.standard.includes('EN') && Math.abs(opt.mm - mmVal) < 0.5
    );
    if (metricOption) {
      return { inch: metricOption.inch, mm: metricOption.mm };
    }
    return { inch: '-', mm: mmVal };
  }

  return null;
}

/**
 * Calculate DAC depths for 3 holes based on part thickness.
 * Standard practice: holes at approximately 25%, 50%, 75% of thickness.
 * Then find the closest standard METAL_TRAVEL_OPTIONS values.
 */
function calculateDACDepths(thicknessMm: number): number[] {
  if (!thicknessMm || thicknessMm <= 0) {
    // Return default depths if no thickness
    return [19.05, 38.10, 57.15];
  }

  // Calculate target depths at 25%, 50%, 75% of thickness
  const targetDepths = [
    thicknessMm * 0.25,
    thicknessMm * 0.50,
    thicknessMm * 0.75
  ];

  // Find closest standard values from METAL_TRAVEL_OPTIONS
  const standardDepths = targetDepths.map(target => {
    // Find the closest standard depth
    let closest = METAL_TRAVEL_OPTIONS[0].depthMm;
    let minDiff = Math.abs(target - closest);

    for (const opt of METAL_TRAVEL_OPTIONS) {
      const diff = Math.abs(target - opt.depthMm);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt.depthMm;
      }
    }

    return closest;
  });

  // Ensure depths are unique and in ascending order
  const uniqueDepths = [...new Set(standardDepths)].sort((a, b) => a - b);

  // If we have less than 3 unique depths, pad with nearby values
  while (uniqueDepths.length < 3) {
    const lastDepth = uniqueDepths[uniqueDepths.length - 1];
    const nextOption = METAL_TRAVEL_OPTIONS.find(opt => opt.depthMm > lastDepth);
    if (nextOption) {
      uniqueDepths.push(nextOption.depthMm);
    } else {
      break;
    }
  }

  return uniqueDepths.slice(0, 3);
}

interface CalibrationTabProps {
  data: CalibrationData;
  onChange: (data: CalibrationData) => void;
  inspectionSetup: InspectionSetupData;
  acceptanceClass: AcceptanceClass | "";
  standard?: StandardType;
}

// Get standard label
const getStandardLabel = (standard: StandardType): string => {
  const labels: Partial<Record<StandardType, string>> = {
    "MIL-STD-2154": "MIL-STD-2154",
    "AMS-STD-2154E": "AMS-STD-2154E",
    "ASTM-A388": "ASTM A388/A388M",
    "BS-EN-10228-3": "BS EN 10228-3:2016",
    "BS-EN-10228-4": "BS EN 10228-4:2016",
    "ASTM-E2375": "ASTM E2375",
    "ASTM-E127": "ASTM E127",
    "ASTM-E164": "ASTM E164",
    "AMS-2630": "AMS 2630",
    "AMS-2631": "AMS 2631 (Titanium)",
    "AMS-2632": "AMS 2632 (Thin Materials)",
    "NDIP-1226": "PW NDIP-1226 (V2500 HPT S1)",
    "NDIP-1227": "PW NDIP-1227 (V2500 HPT S2)",
    "NDIP-1254": "PW NDIP-1254 (GTF HPT S1)",
    "NDIP-1257": "PW NDIP-1257 (GTF HPT S2)",
    "NDIP-1260": "PW NDIP-1260 (GTF IBR-8)",
    "PWA-SIM": "PWA SIM (Bar/Billet)",
    "EN-ISO-16810": "EN ISO 16810",
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
  // Block type selection (curved vs flat) for tubular parts
  const [selectedBlockType, setSelectedBlockType] = useState<BlockTypeSelection>("curved");
  // Track if FBH table was auto-filled from standards
  const [fbhAutoFilled, setFbhAutoFilled] = useState(false);
  const [fbhAutoFillReason, setFbhAutoFillReason] = useState<string>("");
  // Sensitivity table state
  const [sensitivityRows, setSensitivityRows] = useState<CalibrationSensitivityRow[]>(
    data.sensitivityTable || [{ id: 1, reflectorType: 'FBH', reflectorSizeInch: '1/64', curvatureCorrection: 0, gainOffset: 0, deltaDbTotal: 0 }]
  );

  const addSensitivityRow = () => {
    if (sensitivityRows.length >= 8) return;
    const newRow: CalibrationSensitivityRow = {
      id: Math.max(...sensitivityRows.map(r => r.id), 0) + 1,
      reflectorType: 'FBH',
      reflectorSizeInch: '1/64',
      curvatureCorrection: 0,
      gainOffset: 0,
      deltaDbTotal: 0,
    };
    const updated = [...sensitivityRows, newRow];
    setSensitivityRows(updated);
    onChange({ ...data, sensitivityTable: updated });
  };

  const removeSensitivityRow = (index: number) => {
    if (sensitivityRows.length <= 1) return;
    const updated = sensitivityRows.filter((_, i) => i !== index);
    setSensitivityRows(updated);
    onChange({ ...data, sensitivityTable: updated });
  };

  const updateSensitivityRow = (index: number, field: keyof CalibrationSensitivityRow, value: string | number) => {
    const updated = sensitivityRows.map((row, i) => {
      if (i !== index) return row;
      const newRow = { ...row, [field]: value };
      newRow.deltaDbTotal = Number((newRow.curvatureCorrection + newRow.gainOffset).toFixed(1));
      return newRow;
    });
    setSensitivityRows(updated);
    onChange({ ...data, sensitivityTable: updated });
  };

  // Ref to prevent auto-fill from triggering on initial mount
  const isInitialMount = useRef(true);

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

  // Handle FBH holes changes from table (manual user changes)
  const handleFbhHolesChange = (newHoles: FBHHoleRowData[]) => {
    setFbhHoles(newHoles);
    // Clear auto-fill state when user manually changes - indicates manual override
    if (fbhAutoFilled) {
      setFbhAutoFilled(false);
      setFbhAutoFillReason("");
    }
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
      blockHeightE: h.blockHeightE,
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
        blockHeightE: h.blockHeightE,
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
    // Mark initial mount as complete
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // AUTO-FILL FBH TABLE FROM STANDARDS
  // Triggers when acceptanceClass, standard, or partThickness changes
  // ==========================================================================
  useEffect(() => {
    // Need acceptance class and thickness to auto-fill
    if (!acceptanceClass) return;

    // Get thickness - try partThickness first, then wallThickness
    const thickness = inspectionSetup.partThickness || inspectionSetup.wallThickness || 0;
    if (thickness <= 0) return;

    // Get recommended FBH size from standards
    const recommendedFBH = getFBHSizeForStandard(standard, thickness, acceptanceClass);
    if (!recommendedFBH) return;

    // Parse the FBH size string to get diameter
    const parsed = parseFBHSizeString(recommendedFBH);
    if (!parsed) return;

    // PW NDIP standards use fixed hole depths per IAE2P16675 calibration block
    // Holes L–S at specific depths (inches → mm), J&K omitted per NDIP Section 5.1.1.7.1
    const isPWStandard = standard === "NDIP-1226" || standard === "NDIP-1227" || standard === "NDIP-1254" || standard === "NDIP-1257" || standard === "NDIP-1260";
    const pwHoleDepthsMm = [
      6.350,   // Hole L: 0.250"
      9.525,   // Hole M: 0.375"
      12.700,  // Hole N: 0.500"
      15.875,  // Hole P: 0.625"
      19.050,  // Hole Q: 0.750"
      22.225,  // Hole R: 0.875"
      25.400,  // Hole S: 1.000"
    ];
    const pwHoleLabels = ['L', 'M', 'N', 'P', 'Q', 'R', 'S'];

    // Calculate DAC depths based on standard
    const dacDepths = isPWStandard ? pwHoleDepthsMm : calculateDACDepths(thickness);

    // Check if values are already set to the same - avoid unnecessary updates
    const currentDiameter = fbhHoles[0]?.diameterInch;
    const currentDepths = fbhHoles.map(h => h.metalTravelH);
    const isSameDiameter = currentDiameter === parsed.inch;
    const isSameDepths = dacDepths.every((d, i) => currentDepths[i] === d);

    if (isSameDiameter && isSameDepths && fbhAutoFilled) {
      // Already auto-filled with same values, skip
      return;
    }

    // Build the auto-filled holes array
    const autoFilledHoles: FBHHoleRowData[] = dacDepths.map((depth, index) => ({
      id: index + 1,
      partNumber: isPWStandard ? 'IAE2P16675' : '',
      deltaType: 'dac', // DAC for distance-amplitude correction
      diameterInch: parsed.inch,
      diameterMm: parsed.mm,
      blockHeightE: depth,   // E - block height equals DAC depth
      metalTravelH: depth,   // H - hole depth equals block height
      isCustom: false,
    }));

    // Update state
    setFbhHoles(autoFilledHoles);
    setFbhAutoFilled(true);
    if (isPWStandard) {
      setFbhAutoFillReason(
        `PW IAE2P16675 calibration block — #1 FBH (1/64") at 80% FSH. ` +
        `7 holes (${pwHoleLabels.join(', ')}): ${pwHoleDepthsMm.map((d, i) => `${pwHoleLabels[i]}=${d}mm`).join(', ')}. ` +
        `Per ${standard === 'NDIP-1226' ? 'NDIP-1226 Rev F' : 'NDIP-1227 Rev D'} Section 5.1.1.7.1. ` +
        `±45° circumferential shear wave, 8\" water path immersion.`
      );
    } else {
      setFbhAutoFillReason(
        `FBH ${parsed.inch}" (${parsed.mm}mm) selected per ${standard} Class ${acceptanceClass} for ${thickness}mm thickness. ` +
        `DAC depths: ${dacDepths.map(d => `${d}mm`).join(', ')} (25%, 50%, 75% of thickness).`
      );
    }

    // Update parent data
    const fbhSizesStr = autoFilledHoles.map(h => h.diameterInch).join(', ');
    const avgMetalTravel = autoFilledHoles.reduce((sum, h) => sum + h.metalTravelH, 0) / autoFilledHoles.length;
    onChange({
      ...data,
      fbhSizes: fbhSizesStr,
      fbhHoles: autoFilledHoles.map(h => ({
        id: h.id,
        partNumber: h.partNumber,
        deltaType: h.deltaType,
        diameterInch: h.diameterInch,
        diameterMm: h.diameterMm,
        blockHeightE: h.blockHeightE,
        metalTravelH: h.metalTravelH,
      })),
      metalTravelDistance: avgMetalTravel,
    });

    // Show toast notification only if not initial mount
    if (!isInitialMount.current) {
      toast.success("FBH Table Auto-Filled", {
        description: `${parsed.inch}" FBH selected per ${standard} Class ${acceptanceClass}`,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptanceClass, standard, inspectionSetup.partThickness, inspectionSetup.wallThickness]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId as CalibrationBlockType);
    updateField("standardType", modelId);
  };

  // Render the Straight Beam content (FBH table with large previews)
  const renderStraightBeamContent = () => (
    <>
      {/* FBH Holes Table with Large Previews - 3 rows with dropdowns */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">FBH Hole Specifications</h4>
          {fbhAutoFilled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 cursor-help">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Selected
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">🎯 FBH Auto-Fill Based On:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Standard: {standard}</li>
                      <li>Acceptance Class: {acceptanceClass}</li>
                      <li>Part Thickness: {inspectionSetup.partThickness || inspectionSetup.wallThickness}mm</li>
                    </ul>
                    <p className="text-sm border-t pt-2">{fbhAutoFillReason}</p>
                    <p className="text-xs text-muted-foreground italic">
                      You can manually override these values by editing the table below.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <FBHHoleTableWithPreviews
          holes={fbhHoles}
          onChange={handleFbhHolesChange}
          maxHoles={5}
          minHoles={1}
          showPartNumber={true}
          showDeltaType={true}
          standard="All"
          previewWidth={420}
          previewHeight={520}
        />
      </div>
    </>
  );

  // Render the Angle Beam content (calibration block drawing)
  // Note: partDimensions is memoized at component level to prevent infinite re-renders
  const renderAngleBeamContent = () => {
    // Get block type options based on part OD
    const blockTypeOptions = inspectionSetup.diameter
      ? getBlockTypeOptions(inspectionSetup.diameter)
      : [];
    const showBlockTypeSelection = inspectionSetup.diameter && inspectionSetup.diameter > 0;

    // Handle block type change
    const handleBlockTypeChange = (value: string) => {
      setSelectedBlockType(value as BlockTypeSelection);
      // Update calibration data with block type
      onChange({
        ...data,
        selectedBlockType: value as BlockTypeSelection,
      });
    };

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

        {/* Block Type Selection (Curved vs Flat) */}
        {showBlockTypeSelection && blockTypeOptions.length > 0 && (
          <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
            <h4 className="font-bold text-blue-800 text-base mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Reference Block Type Selection
            </h4>
            <RadioGroup
              value={selectedBlockType}
              onValueChange={handleBlockTypeChange}
              className="space-y-3"
            >
              {blockTypeOptions.map((option) => (
                <div
                  key={option.type}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                    selectedBlockType === option.type
                      ? option.isRecommended
                        ? "border-green-400 bg-green-50"
                        : "border-amber-400 bg-amber-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value={option.type} id={`block-type-${option.type}`} className="mt-1" />
                  <Label htmlFor={`block-type-${option.type}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {option.isRecommended && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          Recommended
                        </Badge>
                      )}
                      {option.requiresLevel3Approval && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Level III Approval Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{option.reasoning}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

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

      {/* Calibration Sensitivity Table */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Calibration Sensitivity Table</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={addSensitivityRow}
            disabled={sensitivityRows.length >= 8}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Reflector Type</th>
                <th className="text-left p-2 font-medium">Size (inch)</th>
                <th className="text-left p-2 font-medium">Curvature Corr. (dB)</th>
                <th className="text-left p-2 font-medium">Gain Offset (dB)</th>
                <th className="text-left p-2 font-medium">{"\u0394"}dB Total</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sensitivityRows.map((row, index) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-2">
                    <Select value={row.reflectorType} onValueChange={(v) => updateSensitivityRow(index, 'reflectorType', v)}>
                      <SelectTrigger className="bg-background w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FBH">FBH</SelectItem>
                        <SelectItem value="SDH">SDH</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select value={row.reflectorSizeInch} onValueChange={(v) => updateSensitivityRow(index, 'reflectorSizeInch', v)}>
                      <SelectTrigger className="bg-background w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["1/64", "2/64", "3/64", "4/64", "5/64", "6/64", "8/64"].map(s => (
                          <SelectItem key={s} value={s}>{s}&quot;</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={row.curvatureCorrection}
                      onChange={(e) => updateSensitivityRow(index, 'curvatureCorrection', parseFloat(e.target.value) || 0)}
                      className="bg-background w-24"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={row.gainOffset}
                      onChange={(e) => updateSensitivityRow(index, 'gainOffset', parseFloat(e.target.value) || 0)}
                      className="bg-background w-24"
                    />
                  </td>
                  <td className="p-2">
                    <div className="font-mono font-semibold text-center bg-muted/50 rounded px-2 py-1.5">
                      {row.deltaDbTotal >= 0 ? '+' : ''}{row.deltaDbTotal.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-2">
                    {sensitivityRows.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeSensitivityRow(index)}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
