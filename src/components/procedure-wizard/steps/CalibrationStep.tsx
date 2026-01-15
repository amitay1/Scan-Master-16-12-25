/**
 * Calibration Requirements Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProcedureWizardData } from "@/types/procedure";

interface CalibrationStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const CALIBRATION_BLOCK_TYPES = [
  { value: "flat_fbh", label: "Flat Bottom Hole (ASTM E127)" },
  { value: "side_drilled", label: "Side Drilled Holes" },
  { value: "notched", label: "Notched Block (Angle Beam)" },
  { value: "iow", label: "IIW/IOW Reference Block" },
  { value: "dsc", label: "Distance/Sensitivity Calibration" },
  { value: "step_wedge", label: "Step Wedge" },
  { value: "curved_surface", label: "Curved Surface Block" },
];

const FBH_SIZES = [
  "#1 (1/64\")",
  "#2 (2/64\")",
  "#3 (3/64\")",
  "#4 (4/64\")",
  "#5 (5/64\")",
  "#6 (6/64\")",
  "#7 (7/64\")",
  "#8 (8/64\")",
];

const SENSITIVITY_METHODS = [
  { value: "dac", label: "DAC (Distance Amplitude Correction)" },
  { value: "tcg", label: "TCG (Time Corrected Gain)" },
  { value: "dgs", label: "DGS/AVG" },
  { value: "fixed", label: "Fixed Reference Level" },
];

export function CalibrationStep({ data, onUpdate }: CalibrationStepProps) {
  const toggleBlockType = (value: string) => {
    const current = data.calibrationBlockTypes || [];
    const updated = current.includes(value)
      ? current.filter((t) => t !== value)
      : [...current, value];
    onUpdate({ calibrationBlockTypes: updated });
  };

  const toggleFbhSize = (size: string) => {
    const current = data.fbhSizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onUpdate({ fbhSizes: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Reference Block Types *</Label>
        <div className="grid grid-cols-1 gap-2">
          {CALIBRATION_BLOCK_TYPES.map((block) => (
            <div key={block.value} className="flex items-center gap-2">
              <Checkbox
                id={`block-${block.value}`}
                checked={(data.calibrationBlockTypes || []).includes(block.value)}
                onCheckedChange={() => toggleBlockType(block.value)}
              />
              <Label htmlFor={`block-${block.value}`} className="text-sm cursor-pointer">
                {block.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>FBH Reference Sizes</Label>
        <div className="flex flex-wrap gap-2">
          {FBH_SIZES.map((size) => (
            <Badge
              key={size}
              variant={(data.fbhSizes || []).includes(size) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFbhSize(size)}
            >
              {size}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Select all FBH sizes that may be used based on acceptance class requirements
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="sensitivityMethod">Sensitivity Setting Method *</Label>
        <Select
          value={data.sensitivityMethod || ""}
          onValueChange={(value) => onUpdate({ sensitivityMethod: value })}
        >
          <SelectTrigger id="sensitivityMethod">
            <SelectValue placeholder="Select method..." />
          </SelectTrigger>
          <SelectContent>
            {SENSITIVITY_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Sensitivity Level (dB)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="refLevel" className="text-xs text-muted-foreground">
              Reference Level
            </Label>
            <Input
              id="refLevel"
              type="number"
              step="1"
              value={data.referenceLevel ?? ""}
              onChange={(e) =>
                onUpdate({ referenceLevel: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scanLevel" className="text-xs text-muted-foreground">
              Scanning Level (+dB)
            </Label>
            <Input
              id="scanLevel"
              type="number"
              step="1"
              value={data.scanningLevel ?? ""}
              onChange={(e) =>
                onUpdate({ scanningLevel: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="6"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="calInterval">Calibration Verification Interval</Label>
        <Select
          value={data.calibrationInterval || ""}
          onValueChange={(value) => onUpdate({ calibrationInterval: value })}
        >
          <SelectTrigger id="calInterval">
            <SelectValue placeholder="Select interval..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start_end">Start and End of Shift</SelectItem>
            <SelectItem value="4_hours">Every 4 Hours</SelectItem>
            <SelectItem value="8_hours">Every 8 Hours (Once per Shift)</SelectItem>
            <SelectItem value="per_part">Before Each Part</SelectItem>
            <SelectItem value="per_lot">Before Each Lot</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Additional Calibration Requirements</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tempCompensation"
              checked={data.temperatureCompensation || false}
              onCheckedChange={(checked) =>
                onUpdate({ temperatureCompensation: checked === true })
              }
            />
            <Label htmlFor="tempCompensation" className="text-sm cursor-pointer">
              Temperature compensation required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="linearityCheck"
              checked={data.linearityCheckRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ linearityCheckRequired: checked === true })
              }
            />
            <Label htmlFor="linearityCheck" className="text-sm cursor-pointer">
              Linearity check required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sameHeat"
              checked={data.sameHeatBlock || false}
              onCheckedChange={(checked) =>
                onUpdate({ sameHeatBlock: checked === true })
              }
            />
            <Label htmlFor="sameHeat" className="text-sm cursor-pointer">
              Calibration block from same material heat/lot
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
