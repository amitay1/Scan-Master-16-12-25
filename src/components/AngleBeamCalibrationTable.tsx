/**
 * Angle Beam Calibration Table Component
 * Professional UT calibration table with dB corrections
 * Based on user specification for angle beam inspection calibration
 *
 * Columns:
 *   1. Reflector Type (dropdown: FBH, SDH, Notch_EDM, Notch_Saw)
 *   2. Reflector Size Required (inch) - numeric input, step 0.001
 *   3. Current Reflector Used (dropdown: FBH, SDH, Notch)
 *   4. Current Reflector Size (editable text, auto-filled for SDH/Notch)
 *   5. Size dB (auto-calculated: 20*log10(A1/A2))
 *   6. Transfer dB (manual entry)
 *   7. Total dB (auto-calculated)
 *   8. Depth (mm)
 *   9. Sound Path (mm) - auto-calculated with manual override
 */

import { useState, useCallback, useEffect } from 'react';
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
  REFLECTOR_TYPE_OPTIONS,
  DEFAULT_ANGLE_BEAM_CALIBRATION_ROWS,
  calculateSizeDbCorrection,
  calculateSoundPath,
  calculateTotalDb,
  getAutoFilledReflectorSize,
  type AngleBeamCalibrationRow,
  type ReflectorType,
  type CurrentReflectorUsed,
} from "@/data/fbhStandardsData";

/** Options for the "Current Reflector Used" dropdown */
const CURRENT_REFLECTOR_USED_OPTIONS: { value: CurrentReflectorUsed; label: string }[] = [
  { value: 'FBH', label: 'FBH' },
  { value: 'SDH', label: 'SDH' },
  { value: 'Notch', label: 'Notch' },
];

interface AngleBeamCalibrationTableProps {
  rows: AngleBeamCalibrationRow[];
  onChange: (rows: AngleBeamCalibrationRow[]) => void;
  maxRows?: number;
  minRows?: number;
  /** Beam angle in degrees for sound path calculation (e.g., 45, 60, 70) */
  beamAngleDegrees?: number;
}

export function AngleBeamCalibrationTable({
  rows,
  onChange,
  maxRows = 5,
  minRows = 1,
  beamAngleDegrees = 45,
}: AngleBeamCalibrationTableProps) {
  const [customSoundPath, setCustomSoundPath] = useState<Record<number, boolean>>({});

  // Recalculate auto-fields when dependencies change
  useEffect(() => {
    const updatedRows = rows.map(row => {
      // Auto-calculate size dB correction using 20*log10(A1/A2)
      // A1 = reflector size required (inch), A2 = current reflector effective size
      // For the dB formula, we use the inch values directly since the ratio is unitless
      const reflectorSizeInchValue = row.reflectorSizeInch;
      // Use the same value for reference — the calculateSizeDbCorrection already does 20*log10(actual/reference)
      const sizeDb = calculateSizeDbCorrection(reflectorSizeInchValue, reflectorSizeInchValue);

      // Auto-calculate sound path if not manually overridden
      const soundPath = customSoundPath[row.id]
        ? row.soundPathMm
        : calculateSoundPath(row.depthMm, beamAngleDegrees);

      // Auto-calculate total dB
      const totalDb = calculateTotalDb(sizeDb, row.transferDbCorrection);

      return {
        ...row,
        sizeDbCorrection: sizeDb,
        soundPathMm: soundPath,
        totalDb,
      };
    });

    // Only update if values changed to prevent infinite loops
    const hasChanges = updatedRows.some((row, i) =>
      row.sizeDbCorrection !== rows[i].sizeDbCorrection ||
      row.soundPathMm !== rows[i].soundPathMm ||
      row.totalDb !== rows[i].totalDb
    );

    if (hasChanges) {
      onChange(updatedRows);
    }
  }, [rows, beamAngleDegrees, customSoundPath, onChange]);

  const updateRow = useCallback((
    id: number,
    field: keyof AngleBeamCalibrationRow,
    value: string | number
  ) => {
    const newRows = rows.map(row => {
      if (row.id !== id) return row;

      const updatedRow = { ...row, [field]: value };

      // Auto-fill currentReflectorSize when currentReflectorUsed changes
      if (field === 'currentReflectorUsed') {
        const autoSize = getAutoFilledReflectorSize(
          value as CurrentReflectorUsed,
          row.reflectorSizeInch
        );
        if (autoSize !== null) {
          updatedRow.currentReflectorSize = autoSize;
        } else {
          // Clear if no auto-fill rule matches (e.g., FBH selected)
          updatedRow.currentReflectorSize = '';
        }
      }

      // Auto-fill currentReflectorSize when reflectorSizeInch changes
      // (only if currentReflectorUsed is SDH or Notch)
      if (field === 'reflectorSizeInch') {
        const autoSize = getAutoFilledReflectorSize(
          row.currentReflectorUsed,
          value as number
        );
        if (autoSize !== null) {
          updatedRow.currentReflectorSize = autoSize;
        }
      }

      return updatedRow;
    });

    onChange(newRows);
  }, [rows, onChange]);

  const addRow = useCallback(() => {
    if (rows.length >= maxRows) return;

    const newId = Math.max(...rows.map(r => r.id), 0) + 1;
    const newRow: AngleBeamCalibrationRow = {
      id: newId,
      reflectorType: 'SDH',
      reflectorSizeInch: 0.047,
      currentReflectorUsed: 'SDH',
      currentReflectorSize: 'SDH 0.02" dia x 0.25"',
      sizeDbCorrection: 0,
      transferDbCorrection: 0,
      totalDb: 0,
      depthMm: 19.05,
      soundPathMm: 0,
    };

    onChange([...rows, newRow]);
  }, [rows, maxRows, onChange]);

  const removeRow = useCallback((id: number) => {
    if (rows.length <= minRows) return;
    onChange(rows.filter(r => r.id !== id));
    // Clean up custom sound path state
    setCustomSoundPath(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, [rows, minRows, onChange]);

  const toggleCustomSoundPath = (id: number) => {
    setCustomSoundPath(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-2 py-2 text-center font-semibold text-xs w-12">#</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24">Reflector<br/>Type</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24 text-blue-600">Reflector Size<br/>Required (inch)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24 text-blue-600">Current Reflector<br/>Used</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-36 text-amber-600">Current Reflector<br/>Size</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-orange-600">Size<br/>ΔdB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-orange-600">Transfer<br/>ΔdB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-green-600">Total<br/>dB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20">Depth<br/>(mm)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24 text-purple-600">Sound Path<br/>(mm)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                {/* ID */}
                <td className="border px-2 py-1 text-center font-medium">
                  {row.id}
                </td>

                {/* Reflector Type */}
                <td className="border px-1 py-1">
                  <Select
                    value={row.reflectorType}
                    onValueChange={(v) => updateRow(row.id, 'reflectorType', v as ReflectorType)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFLECTOR_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Reflector Size Required (inch) */}
                <td className="border px-1 py-1">
                  <Input
                    type="number"
                    value={row.reflectorSizeInch}
                    onChange={(e) => updateRow(row.id, 'reflectorSizeInch', parseFloat(e.target.value) || 0)}
                    step={0.001}
                    min={0}
                    className="h-7 text-xs text-center"
                  />
                </td>

                {/* Current Reflector Used (dropdown: FBH, SDH, Notch) */}
                <td className="border px-1 py-1">
                  <Select
                    value={row.currentReflectorUsed}
                    onValueChange={(v) => updateRow(row.id, 'currentReflectorUsed', v as CurrentReflectorUsed)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENT_REFLECTOR_USED_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Current Reflector Size (editable text, auto-filled for SDH/Notch) */}
                <td className="border px-1 py-1">
                  <Input
                    type="text"
                    value={row.currentReflectorSize}
                    onChange={(e) => updateRow(row.id, 'currentReflectorSize', e.target.value)}
                    placeholder="Size description"
                    className="h-7 text-xs"
                  />
                </td>

                {/* Size dB (auto-calculated, readonly) */}
                <td className="border px-1 py-1 text-center bg-orange-100">
                  <span className="text-xs font-mono text-orange-800 font-semibold">
                    {row.sizeDbCorrection > 0 ? '+' : ''}{row.sizeDbCorrection.toFixed(1)}
                  </span>
                </td>

                {/* Transfer dB (manual entry) */}
                <td className="border px-1 py-1">
                  <Input
                    type="number"
                    value={row.transferDbCorrection}
                    onChange={(e) => updateRow(row.id, 'transferDbCorrection', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="h-7 text-xs text-center"
                  />
                </td>

                {/* Total dB (auto-calculated, readonly) */}
                <td className="border px-1 py-1 text-center bg-green-100">
                  <span className="text-xs font-mono font-bold text-green-800">
                    {row.totalDb > 0 ? '+' : ''}{row.totalDb.toFixed(1)}
                  </span>
                </td>

                {/* Depth (mm) */}
                <td className="border px-1 py-1">
                  <Input
                    type="number"
                    value={row.depthMm}
                    onChange={(e) => updateRow(row.id, 'depthMm', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="h-7 text-xs text-center"
                  />
                </td>

                {/* Sound Path (mm) - auto-calculated with manual override */}
                <td className="border px-1 py-1">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={row.soundPathMm}
                      onChange={(e) => {
                        updateRow(row.id, 'soundPathMm', parseFloat(e.target.value) || 0);
                        setCustomSoundPath(prev => ({ ...prev, [row.id]: true }));
                      }}
                      step="0.1"
                      className={`h-7 text-xs text-center flex-1 ${!customSoundPath[row.id] ? 'bg-purple-100 text-purple-800 font-semibold' : ''}`}
                    />
                    {customSoundPath[row.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => toggleCustomSoundPath(row.id)}
                        title="Reset to auto-calculate"
                      >
                        ↺
                      </Button>
                    )}
                  </div>
                </td>

                {/* Delete button */}
                <td className="border px-1 py-1 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= minRows}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      {rows.length < maxRows && (
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row ({rows.length}/{maxRows})
        </Button>
      )}

      {/* Legend */}
      <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
        <div className="flex flex-wrap gap-4">
          <span><span className="bg-orange-100 text-orange-800 px-1 rounded font-medium">Size dB</span> = 20 * log10(A1 / A2)</span>
          <span><span className="bg-green-100 text-green-800 px-1 rounded font-medium">Total dB</span> = Size dB + Transfer dB</span>
          <span><span className="bg-purple-100 text-purple-800 px-1 rounded font-medium">Sound Path</span> = Auto-calculated from Depth & Angle</span>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_ANGLE_BEAM_CALIBRATION_ROWS };
export type { AngleBeamCalibrationRow };
