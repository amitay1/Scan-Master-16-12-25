/**
 * Scan Procedure Details Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProcedureWizardData } from "@/types/procedure";

interface ScanStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const INSPECTION_METHODS = [
  { value: "immersion", label: "Immersion (Water Tank)" },
  { value: "contact", label: "Contact (Manual)" },
  { value: "squirter", label: "Water Jet / Squirter" },
  { value: "bubbler", label: "Bubbler" },
  { value: "wheel", label: "Wheel Probe" },
];

const SCAN_TYPES = [
  { value: "manual", label: "Manual Scanning" },
  { value: "semi_auto", label: "Semi-Automated" },
  { value: "fully_auto", label: "Fully Automated" },
  { value: "phased_array", label: "Phased Array (Electronic Scanning)" },
];

const BEAM_TYPES = [
  { value: "straight", label: "Straight Beam (0°)" },
  { value: "angle_45", label: "Angle Beam 45°" },
  { value: "angle_60", label: "Angle Beam 60°" },
  { value: "angle_70", label: "Angle Beam 70°" },
  { value: "variable", label: "Variable Angle (Phased Array)" },
];

export function ScanStep({ data, onUpdate }: ScanStepProps) {
  const toggleBeamType = (value: string) => {
    const current = data.beamTypes || [];
    const updated = current.includes(value)
      ? current.filter((t) => t !== value)
      : [...current, value];
    onUpdate({ beamTypes: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="inspectionMethod">Inspection Method *</Label>
        <Select
          value={data.inspectionMethod || ""}
          onValueChange={(value) => onUpdate({ inspectionMethod: value })}
        >
          <SelectTrigger id="inspectionMethod">
            <SelectValue placeholder="Select method..." />
          </SelectTrigger>
          <SelectContent>
            {INSPECTION_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="scanType">Scan Type *</Label>
        <Select
          value={data.scanType || ""}
          onValueChange={(value) => onUpdate({ scanType: value })}
        >
          <SelectTrigger id="scanType">
            <SelectValue placeholder="Select scan type..." />
          </SelectTrigger>
          <SelectContent>
            {SCAN_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Beam Types *</Label>
        <div className="space-y-2">
          {BEAM_TYPES.map((beam) => (
            <div key={beam.value} className="flex items-center gap-2">
              <Checkbox
                id={`beam-${beam.value}`}
                checked={(data.beamTypes || []).includes(beam.value)}
                onCheckedChange={() => toggleBeamType(beam.value)}
              />
              <Label htmlFor={`beam-${beam.value}`} className="text-sm cursor-pointer">
                {beam.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Coverage Requirements</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coverage" className="text-xs text-muted-foreground">
              Minimum Coverage (%)
            </Label>
            <Input
              id="coverage"
              type="number"
              min={50}
              max={100}
              value={data.minimumCoverage ?? ""}
              onChange={(e) =>
                onUpdate({ minimumCoverage: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overlap" className="text-xs text-muted-foreground">
              Scan Overlap (%)
            </Label>
            <Input
              id="overlap"
              type="number"
              min={0}
              max={75}
              value={data.scanOverlap ?? ""}
              onChange={(e) =>
                onUpdate({ scanOverlap: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="50"
            />
          </div>
        </div>
      </div>

      {data.inspectionMethod === "immersion" && (
        <div className="space-y-3">
          <Label>Immersion Parameters</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="waterPathMin" className="text-xs text-muted-foreground">
                Water Path Min (mm)
              </Label>
              <Input
                id="waterPathMin"
                type="number"
                step="0.1"
                value={data.waterPathMin ?? ""}
                onChange={(e) =>
                  onUpdate({ waterPathMin: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waterPathMax" className="text-xs text-muted-foreground">
                Water Path Max (mm)
              </Label>
              <Input
                id="waterPathMax"
                type="number"
                step="0.1"
                value={data.waterPathMax ?? ""}
                onChange={(e) =>
                  onUpdate({ waterPathMax: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterTemp" className="text-xs text-muted-foreground">
              Water Temperature Range (°C)
            </Label>
            <Input
              id="waterTemp"
              value={data.waterTemperatureRange || ""}
              onChange={(e) => onUpdate({ waterTemperatureRange: e.target.value })}
              placeholder="15-30"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label>Scan Speed & Index</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scanSpeed" className="text-xs text-muted-foreground">
              Max Scan Speed (mm/s)
            </Label>
            <Input
              id="scanSpeed"
              type="number"
              value={data.maxScanSpeed ?? ""}
              onChange={(e) =>
                onUpdate({ maxScanSpeed: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scanIndex" className="text-xs text-muted-foreground">
              Max Scan Index (mm)
            </Label>
            <Input
              id="scanIndex"
              type="number"
              step="0.1"
              value={data.maxScanIndex ?? ""}
              onChange={(e) =>
                onUpdate({ maxScanIndex: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              placeholder="3"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="surfacePrep">Surface Preparation Requirements</Label>
        <Textarea
          id="surfacePrep"
          value={data.surfacePreparation || ""}
          onChange={(e) => onUpdate({ surfacePreparation: e.target.value })}
          placeholder="Describe surface finish requirements, cleaning procedures, etc."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Additional Scan Requirements</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="multiDirection"
              checked={data.multiDirectionalScan || false}
              onCheckedChange={(checked) =>
                onUpdate({ multiDirectionalScan: checked === true })
              }
            />
            <Label htmlFor="multiDirection" className="text-sm cursor-pointer">
              Multi-directional scanning required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="gateRecording"
              checked={data.gateRecordingRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ gateRecordingRequired: checked === true })
              }
            />
            <Label htmlFor="gateRecording" className="text-sm cursor-pointer">
              Gate/C-Scan recording required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ascanCapture"
              checked={data.aScanCaptureRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ aScanCaptureRequired: checked === true })
              }
            />
            <Label htmlFor="ascanCapture" className="text-sm cursor-pointer">
              A-Scan capture for indications
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
