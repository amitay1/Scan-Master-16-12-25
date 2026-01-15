/**
 * Scope Definition Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ProcedureWizardData,
  PartCategory,
  MaterialCategory,
} from "@/types/procedure";
import { MATERIAL_LABELS, PART_LABELS } from "@/types/procedure";

interface ScopeStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const PART_CATEGORIES: PartCategory[] = [
  "forging",
  "casting",
  "plate",
  "bar",
  "tube",
  "extrusion",
  "weld",
];

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  "aluminum",
  "titanium",
  "steel",
  "nickel_alloy",
  "stainless_steel",
  "composite",
];

export function ScopeStep({ data, onUpdate }: ScopeStepProps) {
  const togglePartCategory = (category: PartCategory) => {
    const current = data.partCategories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onUpdate({ partCategories: updated });
  };

  const toggleMaterialCategory = (category: MaterialCategory) => {
    const current = data.materialCategories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onUpdate({ materialCategories: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="procedureTitle">Procedure Title *</Label>
        <Input
          id="procedureTitle"
          value={data.procedureTitle || ""}
          onChange={(e) => onUpdate({ procedureTitle: e.target.value })}
          placeholder="e.g., Ultrasonic Inspection of Titanium Forgings"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scopeDescription">Scope Description</Label>
        <Textarea
          id="scopeDescription"
          value={data.scopeDescription || ""}
          onChange={(e) => onUpdate({ scopeDescription: e.target.value })}
          placeholder="Describe the purpose and applicability of this procedure..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Part Types *</Label>
          <p className="text-xs text-muted-foreground">
            Select all applicable part forms
          </p>
          <div className="space-y-2">
            {PART_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={`part-${category}`}
                  checked={(data.partCategories || []).includes(category)}
                  onCheckedChange={() => togglePartCategory(category)}
                />
                <Label htmlFor={`part-${category}`} className="text-sm cursor-pointer">
                  {PART_LABELS[category]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Materials *</Label>
          <p className="text-xs text-muted-foreground">
            Select all applicable materials
          </p>
          <div className="space-y-2">
            {MATERIAL_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={`material-${category}`}
                  checked={(data.materialCategories || []).includes(category)}
                  onCheckedChange={() => toggleMaterialCategory(category)}
                />
                <Label
                  htmlFor={`material-${category}`}
                  className="text-sm cursor-pointer"
                >
                  {MATERIAL_LABELS[category]}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Thickness Range</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="thicknessMin" className="text-xs text-muted-foreground">
              Minimum
            </Label>
            <Input
              id="thicknessMin"
              type="number"
              step="0.1"
              min={0}
              value={data.thicknessMin || ""}
              onChange={(e) =>
                onUpdate({ thicknessMin: parseFloat(e.target.value) || undefined })
              }
              placeholder="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thicknessMax" className="text-xs text-muted-foreground">
              Maximum
            </Label>
            <Input
              id="thicknessMax"
              type="number"
              step="0.1"
              min={0}
              value={data.thicknessMax || ""}
              onChange={(e) =>
                onUpdate({ thicknessMax: parseFloat(e.target.value) || undefined })
              }
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thicknessUnit" className="text-xs text-muted-foreground">
              Unit
            </Label>
            <Select
              value={data.thicknessUnit || "mm"}
              onValueChange={(v) => onUpdate({ thicknessUnit: v as "mm" | "inch" })}
            >
              <SelectTrigger id="thicknessUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">mm</SelectItem>
                <SelectItem value="inch">inch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusions">Exclusions/Limitations</Label>
        <Textarea
          id="exclusions"
          value={data.exclusions || ""}
          onChange={(e) => onUpdate({ exclusions: e.target.value })}
          placeholder="List any exclusions or limitations of this procedure..."
          rows={2}
        />
      </div>
    </div>
  );
}
