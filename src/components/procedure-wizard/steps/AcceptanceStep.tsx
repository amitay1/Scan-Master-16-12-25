/**
 * Acceptance Criteria Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProcedureWizardData, AcceptanceClass } from "@/types/procedure";

interface AcceptanceStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const ACCEPTANCE_CLASSES: { value: AcceptanceClass; label: string; description: string }[] = [
  { value: "AAA", label: "Class AAA", description: "Most stringent - Critical flight components" },
  { value: "AA", label: "Class AA", description: "Very stringent - Primary structure" },
  { value: "A", label: "Class A", description: "Stringent - Secondary structure" },
  { value: "B", label: "Class B", description: "Standard - General aerospace" },
  { value: "C", label: "Class C", description: "Least stringent - Non-critical parts" },
];

const EVALUATION_METHODS = [
  { value: "amplitude", label: "Amplitude Based" },
  { value: "dac_percentage", label: "DAC Percentage" },
  { value: "dgs", label: "DGS/AVG Method" },
  { value: "fixed_threshold", label: "Fixed Threshold" },
];

export function AcceptanceStep({ data, onUpdate }: AcceptanceStepProps) {
  const toggleAcceptanceClass = (cls: AcceptanceClass) => {
    const current = data.acceptanceClasses || [];
    const updated = current.includes(cls)
      ? current.filter((c) => c !== cls)
      : [...current, cls];
    onUpdate({ acceptanceClasses: updated });
  };

  const hasStrictClass = (data.acceptanceClasses || []).some(c => c === "AAA" || c === "AA");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Acceptance Classes Covered *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select all acceptance classes this procedure will cover
        </p>
        <div className="space-y-2">
          {ACCEPTANCE_CLASSES.map((cls) => (
            <div key={cls.value} className="flex items-start gap-2">
              <Checkbox
                id={`class-${cls.value}`}
                checked={(data.acceptanceClasses || []).includes(cls.value)}
                onCheckedChange={() => toggleAcceptanceClass(cls.value)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor={`class-${cls.value}`} className="text-sm cursor-pointer font-medium">
                  {cls.label}
                </Label>
                <p className="text-xs text-muted-foreground">{cls.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasStrictClass && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Class AAA/AA Selected
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                These classes require enhanced calibration frequency, smaller FBH references,
                and may require Level III review of all rejectable indications.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="evalMethod">Evaluation Method *</Label>
        <Select
          value={data.evaluationMethod || ""}
          onValueChange={(value) => onUpdate({ evaluationMethod: value })}
        >
          <SelectTrigger id="evalMethod">
            <SelectValue placeholder="Select evaluation method..." />
          </SelectTrigger>
          <SelectContent>
            {EVALUATION_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Rejection Thresholds</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rejectLevel" className="text-xs text-muted-foreground">
              Rejection Level (% DAC / dB)
            </Label>
            <Input
              id="rejectLevel"
              value={data.rejectionLevel || ""}
              onChange={(e) => onUpdate({ rejectionLevel: e.target.value })}
              placeholder="100% DAC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recordLevel" className="text-xs text-muted-foreground">
              Recording Level (% DAC / dB)
            </Label>
            <Input
              id="recordLevel"
              value={data.recordingLevel || ""}
              onChange={(e) => onUpdate({ recordingLevel: e.target.value })}
              placeholder="50% DAC"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Defect Size Limits</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="singleLimit" className="text-xs text-muted-foreground">
              Single Defect Limit
            </Label>
            <Input
              id="singleLimit"
              value={data.singleDefectLimit || ""}
              onChange={(e) => onUpdate({ singleDefectLimit: e.target.value })}
              placeholder="Per acceptance class table"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupLimit" className="text-xs text-muted-foreground">
              Grouped Defects Limit
            </Label>
            <Input
              id="groupLimit"
              value={data.groupedDefectsLimit || ""}
              onChange={(e) => onUpdate({ groupedDefectsLimit: e.target.value })}
              placeholder="Per acceptance class table"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="zoneRules">Zone-Specific Rules</Label>
        <Textarea
          id="zoneRules"
          value={data.zoneSpecificRules || ""}
          onChange={(e) => onUpdate({ zoneSpecificRules: e.target.value })}
          placeholder="Define any zone-specific acceptance criteria (e.g., near-surface zones, transition areas)"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Special Material Considerations</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {["titanium", "aluminum", "steel", "nickel", "composite"].map((mat) => (
            <Badge
              key={mat}
              variant={(data.materialConsiderations || []).includes(mat) ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => {
                const current = data.materialConsiderations || [];
                const updated = current.includes(mat)
                  ? current.filter((m) => m !== mat)
                  : [...current, mat];
                onUpdate({ materialConsiderations: updated });
              }}
            >
              {mat}
            </Badge>
          ))}
        </div>
        {(data.materialConsiderations || []).includes("titanium") && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">Titanium Requirements</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Alpha case detection, noise evaluation, and back-reflection monitoring may be required.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Additional Acceptance Requirements</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="backReflection"
              checked={data.backReflectionRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ backReflectionRequired: checked === true })
              }
            />
            <Label htmlFor="backReflection" className="text-sm cursor-pointer">
              Back-reflection monitoring required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="noiseEval"
              checked={data.noiseEvaluationRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ noiseEvaluationRequired: checked === true })
              }
            />
            <Label htmlFor="noiseEval" className="text-sm cursor-pointer">
              Material noise evaluation required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="levelIIIReview"
              checked={data.levelIIIReviewRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ levelIIIReviewRequired: checked === true })
              }
            />
            <Label htmlFor="levelIIIReview" className="text-sm cursor-pointer">
              Level III review for rejectable indications
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
