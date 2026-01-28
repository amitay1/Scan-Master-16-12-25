/**
 * Angle Beam Calibration Table Component
 * Professional UT calibration table with dB corrections
 * Based on user specification for angle beam inspection calibration
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
  FBH_DIAMETER_OPTIONS,
  DEFAULT_ANGLE_BEAM_CALIBRATION_ROWS,
  calculateSizeDbCorrection,
  calculateSoundPath,
  calculateTotalDb,
  convertToFBHEquivalent,
  type AngleBeamCalibrationRow,
  type ReflectorType,
} from "@/data/fbhStandardsData";

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
      // Auto-calculate size dB correction
      const sizeDb = calculateSizeDbCorrection(row.reflectorSizeMm, row.acceptanceSizeMm);

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

      // If acceptance size inch changed, update mm value
      if (field === 'acceptanceSizeInch') {
        const option = FBH_DIAMETER_OPTIONS.find(opt => opt.inch === value);
        if (option) {
          updatedRow.acceptanceSizeMm = option.mm;
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
      reflectorSizeMm: 1.5,
      acceptanceSizeInch: '3/64',
      acceptanceSizeMm: 1.19,
      sizeDbCorrection: 0,
      transferDbCorrection: 0,
      totalDb: 0,
      depthMm: 19.05,
      soundPathMm: 0,
      notes: '',
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
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-blue-600">Reflector<br/>Size (mm)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24 text-blue-600">Acceptance<br/>Size</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-28 text-amber-600">FBH Equiv.<br/>(2154)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-orange-600">Size<br/>ΔdB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-orange-600">Transfer<br/>ΔdB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20 text-green-600">Total<br/>dB</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-20">Depth<br/>(mm)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-24 text-purple-600">Sound Path<br/>(mm)</th>
              <th className="border px-2 py-2 text-center font-semibold text-xs w-32">Notes</th>
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

                {/* Reflector Size (mm) */}
                <td className="border px-1 py-1">
                  <Input
                    type="number"
                    value={row.reflectorSizeMm}
                    onChange={(e) => updateRow(row.id, 'reflectorSizeMm', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="h-7 text-xs text-center"
                  />
                </td>

                {/* Acceptance Size (dropdown) */}
                <td className="border px-1 py-1">
                  <Select
                    value={row.acceptanceSizeInch}
                    onValueChange={(v) => updateRow(row.id, 'acceptanceSizeInch', v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FBH_DIAMETER_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.inch}>
                          {opt.inch !== '-' ? opt.inch : `${opt.mm}mm`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* FBH Equivalent (auto-calculated per AMS-STD-2154) */}
                <td className="border px-1 py-1 text-center bg-amber-50">
                  {(() => {
                    const equiv = convertToFBHEquivalent(row.reflectorType, row.reflectorSizeMm);
                    if (!equiv) return <span className="text-xs text-muted-foreground">-</span>;
                    return (
                      <span className="text-xs font-mono text-amber-800 font-semibold" title={equiv.description}>
                        {row.reflectorType === 'FBH' ? equiv.fbhInch + '"' : equiv.description}
                      </span>
                    );
                  })()}
                </td>

                {/* Size ΔdB (auto-calculated, readonly) */}
                <td className="border px-1 py-1 text-center bg-orange-100">
                  <span className="text-xs font-mono text-orange-800 font-semibold">
                    {row.sizeDbCorrection > 0 ? '+' : ''}{row.sizeDbCorrection.toFixed(1)}
                  </span>
                </td>

                {/* Transfer ΔdB (manual entry) */}
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

                {/* Notes */}
                <td className="border px-1 py-1">
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                    placeholder=""
                    className="h-7 text-xs"
                  />
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
          <span><span className="bg-amber-50 text-amber-800 px-1 rounded font-medium">FBH Equiv.</span> = AMS-STD-2154 reflector conversion</span>
          <span><span className="bg-orange-100 text-orange-800 px-1 rounded font-medium">Size ΔdB</span> = Auto-calculated (6dB per doubling rule)</span>
          <span><span className="bg-green-100 text-green-800 px-1 rounded font-medium">Total dB</span> = Size ΔdB + Transfer ΔdB</span>
          <span><span className="bg-purple-100 text-purple-800 px-1 rounded font-medium">Sound Path</span> = Auto-calculated from Depth & Angle</span>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_ANGLE_BEAM_CALIBRATION_ROWS };
export type { AngleBeamCalibrationRow };
