/**
 * FBH Hole Table Component
 * Displays 3-row table with dropdown fields from real standards
 * No AI auto-fill - only manual selection from standards
 */

import { useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  FBH_DIAMETER_OPTIONS,
  BLOCK_HEIGHT_E_OPTIONS,
  DELTA_TYPE_OPTIONS,
  inchFractionToMm,
  type FBHHoleRowData,
  type FBHDiameterOption,
  type BlockHeightEOption,
} from "@/data/fbhStandardsData";

interface FBHHoleTableProps {
  holes: FBHHoleRowData[];
  onChange: (holes: FBHHoleRowData[]) => void;
  maxHoles?: number;
  minHoles?: number;
  showPartNumber?: boolean;
  showDeltaType?: boolean;
  standard?: string;
}

export function FBHHoleTable({
  holes,
  onChange,
  maxHoles = 5,
  minHoles = 1,
  showPartNumber = true,
  showDeltaType = true,
  standard = "All",
}: FBHHoleTableProps) {
  const [customInputs, setCustomInputs] = useState<Record<number, Record<string, boolean>>>({});

  // Filter options by selected standard
  const filteredDiameters = standard === "All"
    ? FBH_DIAMETER_OPTIONS
    : FBH_DIAMETER_OPTIONS.filter(opt => opt.standard.includes(standard));

  const filteredBlockHeightE = standard === "All"
    ? BLOCK_HEIGHT_E_OPTIONS
    : BLOCK_HEIGHT_E_OPTIONS.filter(opt => opt.standard.includes(standard));

  const updateHole = useCallback((id: number, field: keyof FBHHoleRowData, value: any) => {
    const newHoles = holes.map(hole => {
      if (hole.id !== id) return hole;

      const updatedHole = { ...hole, [field]: value };

      // Auto-calculate mm when inch changes
      if (field === "diameterInch") {
        const option = FBH_DIAMETER_OPTIONS.find(opt => opt.inch === value);
        if (option) {
          updatedHole.diameterMm = option.mm;
        } else if (value === "Custom") {
          // Keep existing mm value for custom
        } else {
          updatedHole.diameterMm = inchFractionToMm(value);
        }
      }

      // Auto-update H (metal travel) when E (block height) changes - H equals E for standard FBH blocks
      if (field === "blockHeightE") {
        updatedHole.metalTravelH = value;
      }

      return updatedHole;
    });

    onChange(newHoles);
  }, [holes, onChange]);

  const toggleCustomInput = (holeId: number, field: string) => {
    setCustomInputs(prev => ({
      ...prev,
      [holeId]: {
        ...prev[holeId],
        [field]: !prev[holeId]?.[field]
      }
    }));
  };

  const addHole = () => {
    if (holes.length >= maxHoles) return;
    const newId = Math.max(...holes.map(h => h.id), 0) + 1;
    onChange([...holes, {
      id: newId,
      partNumber: '',
      deltaType: 'area',
      diameterInch: '3/64',
      diameterMm: 1.19,
      blockHeightE: 19.05,
      metalTravelH: 19.05,
    }]);
  };

  const removeHole = (id: number) => {
    if (holes.length <= minHoles) return;
    onChange(holes.filter(h => h.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-3 py-2 text-center font-semibold text-sm w-12">ID</th>
              {showPartNumber && (
                <th className="border px-3 py-2 text-center font-semibold text-sm w-24">P/N</th>
              )}
              {showDeltaType && (
                <th className="border px-3 py-2 text-center font-semibold text-sm w-20">Δ</th>
              )}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-28">ØFBH inch</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-24">ØFBH mm</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-32">E (mm)</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-24">H (mm)</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-12"></th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, index) => (
              <tr key={hole.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                {/* ID */}
                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {hole.id}
                  </span>
                </td>

                {/* P/N */}
                {showPartNumber && (
                  <td className="border px-2 py-1">
                    <Input
                      value={hole.partNumber}
                      onChange={(e) => updateHole(hole.id, "partNumber", e.target.value)}
                      placeholder="-"
                      className="h-8 text-sm text-center"
                    />
                  </td>
                )}

                {/* Delta Type */}
                {showDeltaType && (
                  <td className="border px-2 py-1">
                    <Select
                      value={hole.deltaType}
                      onValueChange={(v) => updateHole(hole.id, "deltaType", v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELTA_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                )}

                {/* ØFBH inch */}
                <td className="border px-2 py-1">
                  {customInputs[hole.id]?.diameterInch ? (
                    <div className="flex gap-1">
                      <Input
                        value={hole.diameterInch}
                        onChange={(e) => updateHole(hole.id, "diameterInch", e.target.value)}
                        placeholder="e.g. 3/64"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleCustomInput(hole.id, "diameterInch")}
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={hole.diameterInch}
                      onValueChange={(v) => {
                        if (v === "Custom") {
                          toggleCustomInput(hole.id, "diameterInch");
                        } else {
                          updateHole(hole.id, "diameterInch", v);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDiameters.map(opt => (
                          <SelectItem key={opt.id} value={opt.inch}>
                            {opt.inch} {opt.inch !== '-' && `(${opt.mm}mm)`}
                          </SelectItem>
                        ))}
                        <SelectItem value="Custom" className="text-blue-600 font-medium">
                          Custom...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>

                {/* ØFBH mm (auto-calculated) */}
                <td className="border px-2 py-1">
                  {customInputs[hole.id]?.diameterMm ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={hole.diameterMm}
                        onChange={(e) => updateHole(hole.id, "diameterMm", parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleCustomInput(hole.id, "diameterMm")}
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="h-8 flex items-center justify-center text-sm bg-muted/30 rounded cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCustomInput(hole.id, "diameterMm")}
                      title="Click to enter custom value"
                    >
                      {hole.diameterMm.toFixed(2)}
                    </div>
                  )}
                </td>

                {/* E (block height) - dropdown selection */}
                <td className="border px-2 py-1">
                  {customInputs[hole.id]?.blockHeightE ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={hole.blockHeightE}
                        onChange={(e) => updateHole(hole.id, "blockHeightE", parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleCustomInput(hole.id, "blockHeightE")}
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={String(hole.blockHeightE)}
                      onValueChange={(v) => {
                        if (v === "Custom") {
                          toggleCustomInput(hole.id, "blockHeightE");
                        } else {
                          updateHole(hole.id, "blockHeightE", parseFloat(v));
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBlockHeightE.map(opt => (
                          <SelectItem key={opt.id} value={String(opt.heightMm)}>
                            {opt.heightMm} mm {opt.heightInch !== '-' && `(${opt.heightInch})`}
                          </SelectItem>
                        ))}
                        <SelectItem value="Custom" className="text-blue-600 font-medium">
                          Custom...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>

                {/* H (metal travel) - fixed/read-only, equals E */}
                <td className="border px-2 py-1">
                  <div
                    className="h-8 flex items-center justify-center text-sm bg-muted/30 rounded font-medium"
                    title="גובה החור קבוע - שווה לגובה הבלוק (E)"
                  >
                    {hole.metalTravelH.toFixed(2)}
                  </div>
                </td>

                {/* Delete button */}
                <td className="border px-2 py-1 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeHole(hole.id)}
                    disabled={holes.length <= minHoles}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      {holes.length < maxHoles && (
        <Button
          variant="outline"
          size="sm"
          onClick={addHole}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Hole ({holes.length}/{maxHoles})
        </Button>
      )}
    </div>
  );
}
