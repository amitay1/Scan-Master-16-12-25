import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalibrationData, InspectionSetupData, AcceptanceClass, CalibrationBlockType } from "@/types/techniqueSheet";
import { Target, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateCalibrationRecommendation } from "@/utils/calibrationRecommender";
import { CalibrationCatalog } from "../CalibrationCatalog";
import { toast } from "sonner";
import { FieldWithHelp } from "@/components/FieldWithHelp";

interface CalibrationTabProps {
  data: CalibrationData;
  onChange: (data: CalibrationData) => void;
  inspectionSetup: InspectionSetupData;
  acceptanceClass: AcceptanceClass | "";
}

// Using imported FieldWithHelp component

export const CalibrationTab = ({ data, onChange, inspectionSetup, acceptanceClass }: CalibrationTabProps) => {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [recommendedModelId, setRecommendedModelId] = useState<CalibrationBlockType | null>(null);

  const updateField = (field: keyof CalibrationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const canGenerateRecommendation = 
    inspectionSetup.material && 
    inspectionSetup.partType && 
    inspectionSetup.partThickness >= 6.35 &&
    acceptanceClass;

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
      } catch (error) {
        setRecommendedModelId(null);
      }
    } else {
      setRecommendedModelId(null);
    }
  }, [inspectionSetup.material, inspectionSetup.partType, inspectionSetup.partThickness, acceptanceClass, canGenerateRecommendation]);

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

      {/* Calibration Model Catalog */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Select Calibration Model
        </h3>
        <CalibrationCatalog
          recommendedModel={recommendedModelId}
          onSelectModel={handleSelectModel}
          selectedModel={data.standardType || undefined}
        />
      </div>

      {/* Manual Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <FieldWithHelp
          label="Reference Standard Material"
          fieldKey="referenceBlockMaterial"
          required
          autoFilled={!!recommendation}
        >
          <Input
            value={data.referenceMaterial}
            onChange={(e) => updateField("referenceMaterial", e.target.value)}
            placeholder="Ti-6Al-4V annealed (AMS 4928)"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Flat-Bottom Hole Sizes (inches)"
          fieldKey="fbhSize"
          required
          autoFilled={!!recommendation}
        >
          <Input
            value={data.fbhSizes}
            onChange={(e) => updateField("fbhSizes", e.target.value)}
            placeholder="2/64, 3/64, 5/64"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Metal Travel Distance (mm)"
          fieldKey="fbhDepth"
          required
          autoFilled={!!recommendation}
        >
          <Input
            type="number"
            value={data.metalTravelDistance}
            onChange={(e) => updateField("metalTravelDistance", parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
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
            placeholder="150 × 75 × 50"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Block Serial Number"
          fieldKey="calibrationBlock"
        >
          <Input
            value={data.blockSerialNumber}
            onChange={(e) => updateField("blockSerialNumber", e.target.value)}
            placeholder="CAL-2024-001"
            className="bg-background"
          />
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
