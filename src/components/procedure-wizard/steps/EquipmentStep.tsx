/**
 * Equipment Requirements Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { ProcedureWizardData } from "@/types/procedure";

interface EquipmentStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const TRANSDUCER_TYPES = [
  "Contact - Straight Beam",
  "Contact - Angle Beam",
  "Immersion - Focused",
  "Immersion - Unfocused",
  "Phased Array - Linear",
  "Phased Array - Matrix",
  "Dual Element",
  "Delay Line",
];

const FREQUENCIES = [1, 2.25, 5, 7.5, 10, 15];
const DIAMETERS = [6.35, 9.5, 12.7, 19.05, 25.4];

const COUPLANTS = [
  "Water (immersion)",
  "Water-based gel",
  "Glycerin",
  "Oil-based couplant",
  "Cellulose paste",
];

export function EquipmentStep({ data, onUpdate }: EquipmentStepProps) {
  const toggleTransducerType = (type: string) => {
    const current = data.transducerTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onUpdate({ transducerTypes: updated });
  };

  const toggleFrequency = (freq: number) => {
    const current = data.transducerFrequencies || [];
    const updated = current.includes(freq)
      ? current.filter((f) => f !== freq)
      : [...current, freq];
    onUpdate({ transducerFrequencies: updated.sort((a, b) => a - b) });
  };

  const toggleDiameter = (dia: number) => {
    const current = data.transducerDiameters || [];
    const updated = current.includes(dia)
      ? current.filter((d) => d !== dia)
      : [...current, dia];
    onUpdate({ transducerDiameters: updated.sort((a, b) => a - b) });
  };

  const toggleCouplant = (couplant: string) => {
    const current = data.couplantTypes || [];
    const updated = current.includes(couplant)
      ? current.filter((c) => c !== couplant)
      : [...current, couplant];
    onUpdate({ couplantTypes: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Frequency Range (MHz) *</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="freqMin" className="text-xs text-muted-foreground">
              Minimum
            </Label>
            <Input
              id="freqMin"
              type="number"
              step="0.25"
              min={0.5}
              max={25}
              value={data.frequencyMin || ""}
              onChange={(e) =>
                onUpdate({ frequencyMin: parseFloat(e.target.value) || undefined })
              }
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freqMax" className="text-xs text-muted-foreground">
              Maximum
            </Label>
            <Input
              id="freqMax"
              type="number"
              step="0.25"
              min={0.5}
              max={25}
              value={data.frequencyMax || ""}
              onChange={(e) =>
                onUpdate({ frequencyMax: parseFloat(e.target.value) || undefined })
              }
              placeholder="15"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Transducer Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSDUCER_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`trans-${type}`}
                checked={(data.transducerTypes || []).includes(type)}
                onCheckedChange={() => toggleTransducerType(type)}
              />
              <Label htmlFor={`trans-${type}`} className="text-sm cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Standard Frequencies (MHz)</Label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((freq) => (
            <Badge
              key={freq}
              variant={
                (data.transducerFrequencies || []).includes(freq)
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleFrequency(freq)}
            >
              {freq} MHz
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Element Diameters (mm)</Label>
        <div className="flex flex-wrap gap-2">
          {DIAMETERS.map((dia) => (
            <Badge
              key={dia}
              variant={
                (data.transducerDiameters || []).includes(dia) ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleDiameter(dia)}
            >
              {dia} mm ({(dia / 25.4).toFixed(2)}")
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Couplant Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {COUPLANTS.map((couplant) => (
            <div key={couplant} className="flex items-center gap-2">
              <Checkbox
                id={`coup-${couplant}`}
                checked={(data.couplantTypes || []).includes(couplant)}
                onCheckedChange={() => toggleCouplant(couplant)}
              />
              <Label htmlFor={`coup-${couplant}`} className="text-sm cursor-pointer">
                {couplant}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
