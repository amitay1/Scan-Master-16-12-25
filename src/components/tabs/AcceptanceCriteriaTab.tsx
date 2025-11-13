import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AcceptanceCriteriaData, AcceptanceClass, StandardType } from "@/types/techniqueSheet";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { acceptanceLimits } from "@/utils/autoFillLogic";
import { FieldWithHelp } from "@/components/FieldWithHelp";

interface AcceptanceCriteriaTabProps {
  data: AcceptanceCriteriaData;
  onChange: (data: AcceptanceCriteriaData) => void;
  material: string;
  standard?: StandardType;
}

// Using imported FieldWithHelp component

const acceptanceClasses: AcceptanceClass[] = ["AAA", "AA", "A", "B", "C"];

// Table VI criteria per class
const getCriteriaForClass = (acceptanceClass: AcceptanceClass) => {
  const criteria = {
    AAA: {
      single: "1/64 or 25% of 3/64 response",
      multiple: "10% of 3/64 response",
      linear: "1/8 inch - 10% of 3/64 response"
    },
    AA: {
      single: "3/64",
      multiple: "2/64",
      linear: "1/2 inch - 2/64 response"
    },
    A: {
      single: "5/64",
      multiple: "3/64",
      linear: "1 inch - 3/64 response"
    },
    B: {
      single: "8/64",
      multiple: "5/64",
      linear: "1 inch - 5/64 response"
    },
    C: {
      single: "8/64",
      multiple: "Not applicable",
      linear: "Not applicable"
    }
  };
  return criteria[acceptanceClass];
};

export const AcceptanceCriteriaTab = ({ data, onChange, material, standard }: AcceptanceCriteriaTabProps) => {
  const updateField = (field: keyof AcceptanceCriteriaData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Auto-fill criteria when class changes - using smart logic
  useEffect(() => {
    if (data.acceptanceClass) {
      const limits = acceptanceLimits[data.acceptanceClass];
      onChange({
        ...data,
        singleDiscontinuity: limits.singleDiscontinuity,
        multipleDiscontinuities: limits.multipleDiscontinuities,
        linearDiscontinuity: limits.linearDiscontinuity,
        backReflectionLoss: limits.backReflectionLoss,
        noiseLevel: limits.noiseLevel
      });
    }
  }, [data.acceptanceClass]);

  const isTitanium = material.toLowerCase().includes("titanium") || material.toLowerCase().includes("ti-");
  const showTitaniumWarning = data.acceptanceClass === "AAA" && isTitanium;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Acceptance Class"
          fieldKey="acceptanceClass"
          required
        >
          <Select
            value={data.acceptanceClass}
            onValueChange={(value) => updateField("acceptanceClass", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {acceptanceClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  Class {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <FieldWithHelp
          label="Back Reflection Loss Limit (%)"
          fieldKey="backReflectionLoss"
          required
        >
          <Input
            type="number"
            value={data.backReflectionLoss}
            onChange={(e) => updateField("backReflectionLoss", parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Single Discontinuity Response"
          fieldKey="singleDiscontinuity"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.singleDiscontinuity}
            onChange={(e) => updateField("singleDiscontinuity", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Multiple Discontinuities (centers < 1 inch apart)"
          fieldKey="multipleDiscontinuities"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.multipleDiscontinuities}
            onChange={(e) => updateField("multipleDiscontinuities", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Linear Discontinuity"
          fieldKey="linearDiscontinuity"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.linearDiscontinuity}
            onChange={(e) => updateField("linearDiscontinuity", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Noise Level Requirements"
          fieldKey="noiseLevel"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.noiseLevel}
            onChange={(e) => updateField("noiseLevel", e.target.value)}
            className="bg-background"
          />
        </FieldWithHelp>
      </div>

      {/* Titanium AAA Warning */}
      {showTitaniumWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">CLASS AAA SPECIAL NOTES - Titanium Parts</h4>
              <ul className="text-sm text-foreground space-y-1 list-disc ml-4">
                <li>Multiple discontinuities: 1/8 inch - 2/64 response</li>
                <li>Noise: 1/4 inch - 2/64</li>
                <li>Additional scrutiny required for titanium alloys</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <FieldWithHelp
        label="Special Requirements"
        fieldKey="acceptanceClass"
      >
        <Textarea
          value={data.specialRequirements}
          onChange={(e) => updateField("specialRequirements", e.target.value)}
          placeholder="Enter any special requirements, deviations, or additional notes..."
          rows={4}
          className="bg-background"
        />
      </FieldWithHelp>

      {/* Reference Note */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Reference:</strong> All acceptance criteria are based on MIL-STD-2154 Table VI. 
          Class AAA is the most stringent, Class C is the least. Ensure your inspection meets or exceeds 
          the specified class requirements.
        </p>
      </div>
    </div>
  );
};
