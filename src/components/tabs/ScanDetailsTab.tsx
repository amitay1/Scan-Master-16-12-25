import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PartGeometry } from "@/types/techniqueSheet";

export interface ScanDetail {
  scanningDirection: string;
  waveMode: string;
  frequency: string;
  make: string;
  probe: string;
  remarkDetails: string;
}

export interface ScanDetailsData {
  scanDetails: ScanDetail[];
}

interface ScanDetailsTabProps {
  data: ScanDetailsData;
  onChange: (data: ScanDetailsData) => void;
  partType?: PartGeometry;
}

const WAVE_MODES = [
  "Longitudinal",
  "Longitudinal (Axial)",
  "Axial shear wave 45° OD",
  "Shear wave 45° clockwise",
  "Shear wave 45° counter clockwise",
  "Circumferential shear wave"
];

const SCAN_DIRECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L"];

const DEFAULT_SCAN_DETAILS: ScanDetail[] = [
  { scanningDirection: "A", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "" },
  { scanningDirection: "B", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "" },
  { scanningDirection: "C", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "" },
  { scanningDirection: "D", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "" }
];

export const ScanDetailsTab = ({ data, onChange, partType }: ScanDetailsTabProps) => {
  // Initialize with default scan details if empty
  useEffect(() => {
    if (!data?.scanDetails || data.scanDetails.length === 0) {
      onChange({ scanDetails: DEFAULT_SCAN_DETAILS });
    }
  }, []);

  const updateScanDetail = (index: number, field: keyof ScanDetail, value: string) => {
    const newScanDetails = [...data.scanDetails];
    newScanDetails[index] = { ...newScanDetails[index], [field]: value };
    onChange({ scanDetails: newScanDetails });
  };

  const addScanDetail = () => {
    const newScanDetails = [
      ...data.scanDetails,
      { scanningDirection: "A", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "" }
    ];
    onChange({ scanDetails: newScanDetails });
  };

  const removeScanDetail = (index: number) => {
    const newScanDetails = data.scanDetails.filter((_, i) => i !== index);
    onChange({ scanDetails: newScanDetails });
  };

  return (
    <div className="space-y-6">
      {/* Scan Details Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Scan Details Configuration</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Configure scanning parameters for each direction according to part geometry and inspection requirements</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold text-sm">Direction</th>
                  <th className="text-left p-2 font-semibold text-sm">Wave Mode</th>
                  <th className="text-left p-2 font-semibold text-sm">Frequency (MHz)</th>
                  <th className="text-left p-2 font-semibold text-sm">Make</th>
                  <th className="text-left p-2 font-semibold text-sm">Probe</th>
                  <th className="text-left p-2 font-semibold text-sm">Remarks</th>
                  <th className="text-center p-2 font-semibold text-sm w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.scanDetails?.map((detail, index) => (
                  <tr 
                    key={index} 
                    className="border-b hover:bg-muted/50 transition-all"
                  >
                    <td className="p-2">
                      <Select
                        value={detail.scanningDirection}
                        onValueChange={(value) => updateScanDetail(index, "scanningDirection", value)}
                      >
                        <SelectTrigger className="h-9 w-20" data-testid={`select-direction-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCAN_DIRECTIONS.map((direction) => (
                            <SelectItem key={direction} value={direction}>
                              {direction}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select
                        value={detail.waveMode}
                        onValueChange={(value) => updateScanDetail(index, "waveMode", value)}
                      >
                        <SelectTrigger className="h-9" data-testid={`select-wavemode-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WAVE_MODES.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={detail.frequency}
                        onChange={(e) => updateScanDetail(index, "frequency", e.target.value)}
                        placeholder="e.g., 5.0"
                        className="h-9"
                        data-testid={`input-frequency-${index}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={detail.make}
                        onChange={(e) => updateScanDetail(index, "make", e.target.value)}
                        placeholder="Manufacturer"
                        className="h-9"
                        data-testid={`input-make-${index}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={detail.probe}
                        onChange={(e) => updateScanDetail(index, "probe", e.target.value)}
                        placeholder="Probe model"
                        className="h-9"
                        data-testid={`input-probe-${index}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={detail.remarkDetails}
                        onChange={(e) => updateScanDetail(index, "remarkDetails", e.target.value)}
                        placeholder="Additional notes"
                        className="h-9"
                        data-testid={`input-remarks-${index}`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScanDetail(index)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`button-remove-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Button
              onClick={addScanDetail}
              variant="outline"
              className="w-full sm:w-auto"
              data-testid="button-add-scan-direction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scan Direction
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
            <p>💡 <strong>Tip:</strong> Scanning directions are labeled A through L. Add or remove rows to include only the directions required for your part geometry.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
