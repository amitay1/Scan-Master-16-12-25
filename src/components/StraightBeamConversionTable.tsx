/**
 * Straight Beam Sensitivity Conversion Table
 *
 * Calculates the dB adjustment needed when the calibration FBH size differs
 * from the customer-required FBH sensitivity, plus optional transfer and
 * curvature corrections.
 *
 * Formula (per TABLE 4): dB = 20 * log10(A1 / A2)
 *   where A1 = numerator of FBH Calibration Size (e.g. 3 from "3/64")
 *         A2 = numerator of FBH Required         (e.g. 2 from "2/64")
 */

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Info } from "lucide-react";
import type { StraightBeamConversionRow } from "@/types/techniqueSheet";

// ── FBH size options (inch fractions with denominator 64) ────────────────────
const FBH_SIZE_OPTIONS = ["1/64", "2/64", "3/64", "4/64", "5/64"] as const;

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

// ── Props ────────────────────────────────────────────────────────────────────
interface StraightBeamConversionTableProps {
  rows: StraightBeamConversionRow[];
  onChange: (rows: StraightBeamConversionRow[]) => void;
}

export function StraightBeamConversionTable({
  rows,
  onChange,
}: StraightBeamConversionTableProps) {
  // ── Row CRUD ──────────────────────────────────────────────────────────────
  const addRow = useCallback(() => {
    const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    const newRow: StraightBeamConversionRow = {
      id: newId,
      partNumber: "",
      fbhCalibrationSize: "3/64",
      fbhRequired: "3/64",
      deltaDbNeeded: 0,
      transferCorrectionDb: 0,
      curvatureCorrectionDb: 0,
    };
    onChange([...rows, newRow]);
  }, [rows, onChange]);

  const removeRow = useCallback(
    (id: number) => {
      if (rows.length <= 1) return; // keep at least one row
      onChange(rows.filter((r) => r.id !== id));
    },
    [rows, onChange],
  );

  const updateRow = useCallback(
    (id: number, field: keyof StraightBeamConversionRow, value: string | number) => {
      const updated = rows.map((row) => {
        if (row.id !== id) return row;

        const patched = { ...row, [field]: value };

        // Recalculate delta-dB whenever either FBH dropdown changes
        if (field === "fbhCalibrationSize" || field === "fbhRequired") {
          patched.deltaDbNeeded = computeDeltaDb(
            patched.fbhCalibrationSize,
            patched.fbhRequired,
          );
        }

        return patched;
      });
      onChange(updated);
    },
    [rows, onChange],
  );

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalForRow = (r: StraightBeamConversionRow) =>
    r.deltaDbNeeded + r.transferCorrectionDb + r.curvatureCorrectionDb;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {/* P/N */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-24">
                P/N
              </th>

              {/* FBH Calibration Size */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-32 text-blue-600">
                <span>FBH Calibration Size</span>
                <br />
                <span className="text-[10px] font-normal text-muted-foreground">
                  Current Calibration FBH
                </span>
              </th>

              {/* FBH Required */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-32 text-orange-600">
                <span>FBH Required</span>
                <br />
                <span className="text-[10px] font-normal text-muted-foreground">
                  Sensitivity Required by Customer
                </span>
              </th>

              {/* Delta-dB Needed */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-36 text-green-600">
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
                <br />
                <span className="text-[10px] font-normal text-muted-foreground">
                  DB= 20LOG10(A1/A2) per TABLE 4
                </span>
              </th>

              {/* Transfer Correction */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-36 text-purple-600">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 cursor-help">
                        Transfer Correction {"\u0394"}dB
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

              {/* Curvature Correction */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-36 text-amber-600">
                Curvature Correction (dB)
              </th>

              {/* Total dB */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-28 text-red-600">
                Total dB
              </th>

              {/* Actions */}
              <th className="border px-3 py-2 text-center font-semibold text-sm w-12" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const rowTotal = totalForRow(row);

              return (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  {/* P/N */}
                  <td className="border px-2 py-1">
                    <Input
                      value={row.partNumber}
                      onChange={(e) =>
                        updateRow(row.id, "partNumber", e.target.value)
                      }
                      placeholder="-"
                      className="h-8 text-sm text-center"
                    />
                  </td>

                  {/* FBH Calibration Size */}
                  <td className="border px-2 py-1">
                    <Select
                      value={row.fbhCalibrationSize}
                      onValueChange={(v) =>
                        updateRow(row.id, "fbhCalibrationSize", v)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FBH_SIZE_OPTIONS.map((opt) => (
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
                      value={row.fbhRequired}
                      onValueChange={(v) =>
                        updateRow(row.id, "fbhRequired", v)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FBH_SIZE_OPTIONS.map((opt) => (
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
                      className={`inline-block min-w-[4rem] rounded px-2 py-1 text-sm font-mono font-semibold ${
                        row.deltaDbNeeded > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : row.deltaDbNeeded < 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.deltaDbNeeded >= 0 ? "+" : ""}
                      {row.deltaDbNeeded.toFixed(1)}
                    </span>
                  </td>

                  {/* Transfer Correction */}
                  <td className="border px-2 py-1">
                    <Input
                      type="number"
                      step={0.1}
                      value={row.transferCorrectionDb}
                      onChange={(e) =>
                        updateRow(
                          row.id,
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
                      value={row.curvatureCorrectionDb}
                      onChange={(e) =>
                        updateRow(
                          row.id,
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
                      className={`inline-block min-w-[4rem] rounded px-2 py-1 text-sm font-mono font-bold ${
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

                  {/* Delete */}
                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Row
        </Button>
      </div>
    </div>
  );
}

export default StraightBeamConversionTable;
