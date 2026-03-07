/**
 * FBH Hole Table Component
 * Displays 3-row table with dropdown fields from real standards
 * No AI auto-fill - only manual selection from standards
 *
 * When `showSensitivityColumns` is true, additional sensitivity conversion
 * columns are rendered inline (FBH Calibration Size, FBH Required, delta-dB,
 * Transfer Correction, Curvature Correction, Total dB).
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Info } from "lucide-react";
import {
  FBH_DIAMETER_OPTIONS,
  BLOCK_HEIGHT_E_OPTIONS,
  METAL_TRAVEL_OPTIONS,
  DELTA_TYPE_OPTIONS,
  inchFractionToMm,
  type FBHHoleRowData,
  type FBHDiameterOption,
  type BlockHeightEOption,
} from "@/data/fbhStandardsData";
import type { StraightBeamConversionRow } from "@/types/techniqueSheet";

// ── FBH size options for sensitivity dropdowns (inch fractions /64) ─────────
const SENSITIVITY_FBH_OPTIONS = ["1/64", "2/64", "3/64", "4/64", "5/64"] as const;

/** Extract the integer numerator from a fraction string like "3/64". */
function numeratorOf(fraction: string): number {
  const parts = fraction.split("/");
  const n = Number(parts[0]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Compute delta-dB per TABLE 4: 20 * log10(A1 / A2). */
function computeDeltaDb(calibrationSize: string, requiredSize: string): number {
  const a1 = numeratorOf(calibrationSize);
  const a2 = numeratorOf(requiredSize);
  if (a1 <= 0 || a2 <= 0) return 0;
  return 20 * Math.log10(a1 / a2);
}

interface FBHHoleTableProps {
  holes: FBHHoleRowData[];
  onChange: (holes: FBHHoleRowData[]) => void;
  maxHoles?: number;
  minHoles?: number;
  showPartNumber?: boolean;
  showDeltaType?: boolean;
  showSoundPath?: boolean;  // Show Sound Path column (for Angle Beam only)
  standard?: string;
  /** When true, inline sensitivity conversion columns are displayed after the FBH columns */
  showSensitivityColumns?: boolean;
  /** Sensitivity conversion rows (matched 1:1 with holes by index) */
  sensitivityRows?: StraightBeamConversionRow[];
  /** Callback when sensitivity data changes */
  onSensitivityChange?: (rows: StraightBeamConversionRow[]) => void;
}

export function FBHHoleTable({
  holes,
  onChange,
  maxHoles = 5,
  minHoles = 1,
  showPartNumber = true,
  showDeltaType = true,
  showSoundPath = false,  // Default: hidden (only show for Angle Beam)
  standard = "All",
  showSensitivityColumns = false,
  sensitivityRows = [],
  onSensitivityChange,
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

      // E and H are now independent - no auto-update

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
    // Also add a matching sensitivity row
    if (showSensitivityColumns && onSensitivityChange) {
      const newSensId = sensitivityRows.length > 0
        ? Math.max(...sensitivityRows.map(r => r.id)) + 1
        : 1;
      onSensitivityChange([...sensitivityRows, {
        id: newSensId,
        partNumber: "",
        fbhCalibrationSize: "3/64",
        fbhRequired: "3/64",
        deltaDbNeeded: 0,
        transferCorrectionDb: 0,
        curvatureCorrectionDb: 0,
      }]);
    }
  };

  const removeHole = (id: number) => {
    if (holes.length <= minHoles) return;
    const idx = holes.findIndex(h => h.id === id);
    onChange(holes.filter(h => h.id !== id));
    // Also remove the corresponding sensitivity row (matched by index)
    if (showSensitivityColumns && onSensitivityChange && sensitivityRows.length > idx) {
      const updated = [...sensitivityRows];
      updated.splice(idx, 1);
      onSensitivityChange(updated);
    }
  };

  // ── Sensitivity helpers ──────────────────────────────────────────────────
  const defaultSensitivityRow = (index: number): StraightBeamConversionRow => ({
    id: index + 1,
    partNumber: "",
    fbhCalibrationSize: "3/64",
    fbhRequired: "3/64",
    deltaDbNeeded: 0,
    transferCorrectionDb: 0,
    curvatureCorrectionDb: 0,
  });

  /** Get the sensitivity row for a given hole index, creating a default if needed */
  const getSensitivityRow = useCallback(
    (index: number): StraightBeamConversionRow => {
      if (sensitivityRows[index]) return sensitivityRows[index];
      return defaultSensitivityRow(index);
    },
    [sensitivityRows],
  );

  const updateSensitivityField = useCallback(
    (index: number, field: keyof StraightBeamConversionRow, value: string | number) => {
      if (!onSensitivityChange) return;
      // Build a full-length array matching holes length
      const full: StraightBeamConversionRow[] = holes.map((_, i) => getSensitivityRow(i));
      const row = { ...full[index], [field]: value };

      // Recalculate delta-dB whenever either FBH dropdown changes
      if (field === "fbhCalibrationSize" || field === "fbhRequired") {
        row.deltaDbNeeded = computeDeltaDb(row.fbhCalibrationSize, row.fbhRequired);
      }

      full[index] = row;
      onSensitivityChange(full);
    },
    [holes, getSensitivityRow, onSensitivityChange],
  );

  const sensitivityTotalForIndex = (index: number): number => {
    const r = getSensitivityRow(index);
    return r.deltaDbNeeded + r.transferCorrectionDb + r.curvatureCorrectionDb;
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
              <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-blue-600">ØFBH inch</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-24 text-blue-600">ØFBH mm</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-32 text-orange-600">E (mm)</th>
              <th className="border px-3 py-2 text-center font-semibold text-sm w-24 text-green-600">H (mm)</th>
              {showSoundPath && (
                <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-purple-600">Sound Path</th>
              )}
              {showSensitivityColumns && (
                <>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-32 text-blue-600">
                    <span>FBH Cal. Size</span>
                    <br />
                    <span className="text-[10px] font-normal text-muted-foreground">
                      Current Calibration FBH
                    </span>
                  </th>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-32 text-orange-600">
                    <span>FBH Required</span>
                    <br />
                    <span className="text-[10px] font-normal text-muted-foreground">
                      Sensitivity Required
                    </span>
                  </th>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-green-600">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            {"\u0394"}dB Needed
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          dB = 20 * LOG10(A1 / A2) per TABLE 4, where A1 is the
                          numerator of the calibration FBH and A2 is the numerator
                          of the required FBH.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-purple-600">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            Transfer {"\u0394"}dB
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Per standard section 5.4.15. Enter positive (+) or
                          negative (-) correction value.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-amber-600">
                    Curvature (dB)
                  </th>
                  <th className="border px-3 py-2 text-center font-semibold text-sm w-24 text-red-600">
                    Total dB
                  </th>
                </>
              )}
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
                            {opt.inch}
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

                {/* H (metal travel) - NOW EDITABLE with dropdown */}
                <td className="border px-2 py-1">
                  {customInputs[hole.id]?.metalTravelH ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={hole.metalTravelH}
                        onChange={(e) => updateHole(hole.id, "metalTravelH", parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleCustomInput(hole.id, "metalTravelH")}
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={String(hole.metalTravelH)}
                      onValueChange={(v) => {
                        if (v === "Custom") {
                          toggleCustomInput(hole.id, "metalTravelH");
                        } else {
                          updateHole(hole.id, "metalTravelH", parseFloat(v));
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METAL_TRAVEL_OPTIONS.map(opt => (
                          <SelectItem key={opt.id} value={String(opt.depthMm)}>
                            {opt.depthMm} mm
                          </SelectItem>
                        ))}
                        <SelectItem value="Custom" className="text-blue-600 font-medium">
                          Custom...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>

                {/* Sound Path (for Angle Beam only) */}
                {showSoundPath && (
                  <td className="border px-2 py-1">
                    <Input
                      value={hole.soundPath || ''}
                      onChange={(e) => updateHole(hole.id, "soundPath", e.target.value)}
                      placeholder=""
                      className="h-8 text-sm text-center"
                    />
                  </td>
                )}

                {/* Sensitivity Conversion Columns (inline) */}
                {showSensitivityColumns && (() => {
                  const sensRow = getSensitivityRow(index);
                  const rowTotal = sensitivityTotalForIndex(index);
                  return (
                    <>
                      {/* FBH Calibration Size */}
                      <td className="border px-2 py-1">
                        <Select
                          value={sensRow.fbhCalibrationSize}
                          onValueChange={(v) =>
                            updateSensitivityField(index, "fbhCalibrationSize", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SENSITIVITY_FBH_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}&quot;
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* FBH Required */}
                      <td className="border px-2 py-1">
                        <Select
                          value={sensRow.fbhRequired}
                          onValueChange={(v) =>
                            updateSensitivityField(index, "fbhRequired", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SENSITIVITY_FBH_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}&quot;
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Delta-dB Needed (auto-calculated, read-only) */}
                      <td className="border px-2 py-1 text-center">
                        <span
                          className={`inline-block min-w-[3.5rem] rounded px-2 py-1 text-sm font-mono font-semibold ${
                            sensRow.deltaDbNeeded > 0
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : sensRow.deltaDbNeeded < 0
                                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sensRow.deltaDbNeeded >= 0 ? "+" : ""}
                          {sensRow.deltaDbNeeded.toFixed(1)}
                        </span>
                      </td>

                      {/* Transfer Correction */}
                      <td className="border px-2 py-1">
                        <Input
                          type="number"
                          step={0.1}
                          value={sensRow.transferCorrectionDb}
                          onChange={(e) =>
                            updateSensitivityField(
                              index,
                              "transferCorrectionDb",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-sm text-center font-mono"
                        />
                      </td>

                      {/* Curvature Correction */}
                      <td className="border px-2 py-1">
                        <Input
                          type="number"
                          step={0.1}
                          value={sensRow.curvatureCorrectionDb}
                          onChange={(e) =>
                            updateSensitivityField(
                              index,
                              "curvatureCorrectionDb",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-sm text-center font-mono"
                        />
                      </td>

                      {/* Total dB */}
                      <td className="border px-2 py-1 text-center">
                        <span
                          className={`inline-block min-w-[3.5rem] rounded px-2 py-1 text-sm font-mono font-bold ${
                            rowTotal > 0
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : rowTotal < 0
                                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {rowTotal >= 0 ? "+" : ""}
                          {rowTotal.toFixed(1)}
                        </span>
                      </td>
                    </>
                  );
                })()}

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
