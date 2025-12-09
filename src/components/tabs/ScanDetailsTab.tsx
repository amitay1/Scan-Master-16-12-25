import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Plus, Trash2, ArrowDown, ArrowUp, ArrowRight, ArrowLeft, RotateCw, RotateCcw, Circle, Disc } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail, ScanDetailsData } from "@/types/scanDetails";
import { InspectionPlanViewer } from "@/components/InspectionPlanViewer";

interface ScanDetailsTabProps {
  data: ScanDetailsData;
  onChange: (data: ScanDetailsData) => void;
  partType?: PartGeometry;
  dimensions?: {
    diameter?: number;
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    outerDiameter?: number;
    innerDiameter?: number;
    // Cone-specific dimensions
    coneTopDiameter?: number;
    coneBottomDiameter?: number;
    coneHeight?: number;
    wallThickness?: number;
    isHollow?: boolean;
  };
}

// Comprehensive scanning directions based on professional UT standards (AMS 2630, AMS-STD-2154)
// Now includes proper TOP and BOTTOM axial scans for complete volumetric coverage!
const FIXED_SCAN_DETAILS: ScanDetail[] = [
  // PRIMARY AXIAL SCANS - Critical for volumetric coverage (לכל סוגי החלקים!)
  {
    scanningDirection: "A",
    waveMode: "LW 0° (Axial from Top)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#22c55e"
  },
  {
    scanningDirection: "B",
    waveMode: "LW 0° (Axial from Bottom)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "bottom",
    angle: 0,
    color: "#3b82f6"
  },
  // RADIAL SCAN - From OD surface (לחלקים עגולים)
  {
    scanningDirection: "C",
    waveMode: "LW 0° (Radial from OD)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 0,
    color: "#f59e0b"
  },
  // SHEAR WAVE SCANS - For detecting oriented defects (גלי גזירה)
  {
    scanningDirection: "D",
    waveMode: "SW 45° (Clockwise)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 45,
    color: "#ef4444"
  },
  {
    scanningDirection: "E",
    waveMode: "SW 45° (Counter-Clockwise)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 45,
    color: "#ec4899"
  },
  // CIRCUMFERENTIAL AND AXIAL SHEAR (לחלקים עגולים)
  {
    scanningDirection: "F",
    waveMode: "SW Circumferential",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#8b5cf6"
  },
  {
    scanningDirection: "G",
    waveMode: "SW Axial 45° (from OD)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#14b8a6"
  },
  // ID SURFACE SCAN - For hollow parts (לחלקים חלולים: צינורות, טבעות)
  {
    scanningDirection: "H",
    waveMode: "LW 0° (from ID)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "id",
    angle: 0,
    color: "#06b6d4"
  },
  // THROUGH-TRANSMISSION - Two-probe technique (TT)
  {
    scanningDirection: "I",
    waveMode: "Through-Transmission (TT)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#84cc16"
  },
  // ADDITIONAL SHEAR WAVE ANGLES (זוויות נוספות)
  {
    scanningDirection: "J",
    waveMode: "SW 60°",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 60,
    color: "#f97316"
  },
  {
    scanningDirection: "K",
    waveMode: "SW 70°",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 70,
    color: "#eab308"
  },
  // ADDITIONAL RADIAL POSITION (מיקום רדיאלי נוסף)
  {
    scanningDirection: "L",
    waveMode: "LW 0° (Radial Pos. 2)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "radial",
    angle: 0,
    color: "#a855f7"
  },
];

// Get direction icon for visual representation
const getDirectionIcon = (direction: string, color?: string) => {
  const style = { color: color || "#6b7280" };
  switch(direction) {
    case "A": return <ArrowDown className="w-4 h-4" style={style} title="From Top" />;
    case "B": return <ArrowUp className="w-4 h-4" style={style} title="From Bottom" />;
    case "C": return <ArrowLeft className="w-4 h-4" style={style} title="From OD/Side" />;
    case "D": return <RotateCw className="w-4 h-4" style={style} title="SW 45° CW" />;
    case "E": return <RotateCcw className="w-4 h-4" style={style} title="SW 45° CCW" />;
    case "F": return <Circle className="w-4 h-4" style={style} title="Circumferential" />;
    case "G": return <ArrowRight className="w-4 h-4" style={style} title="Axial from OD" />;
    case "H": return <Disc className="w-4 h-4" style={style} title="From ID" />;
    case "I": return <ArrowDown className="w-4 h-4" style={style} title="TT" />;
    default: return null;
  }
};

// Get description for entry surface
const getEntrySurfaceLabel = (surface?: string): string => {
  switch(surface) {
    case "top": return "מלמעלה ↓";
    case "bottom": return "מלמטה ↑";
    case "od": return "מ-OD ←";
    case "id": return "מ-ID →";
    case "side": return "מהצד";
    case "radial": return "רדיאלי";
    default: return "";
  }
};

export const ScanDetailsTab = ({ data, onChange, partType, dimensions = {} }: ScanDetailsTabProps) => {
  const [highlightedDirection, setHighlightedDirection] = useState<string | null>(null);

  // Initialize with fixed scan details if empty
  useEffect(() => {
    if (!data?.scanDetails || data.scanDetails.length === 0) {
      onChange({ scanDetails: FIXED_SCAN_DETAILS });
    }
  }, []);

  // Ensure we have all fixed scan details (merge with existing data)
  const scanDetails = FIXED_SCAN_DETAILS.map(fixed => {
    const existing = data.scanDetails?.find(d => d.scanningDirection === fixed.scanningDirection);
    return existing || fixed;
  });

  const toggleScanDetail = (index: number) => {
    const newScanDetails = [...scanDetails];
    newScanDetails[index] = { ...newScanDetails[index], enabled: !newScanDetails[index].enabled };
    onChange({ scanDetails: newScanDetails });
  };

  const updateScanDetail = (index: number, field: keyof ScanDetail, value: string) => {
    const newScanDetails = [...scanDetails];
    newScanDetails[index] = { ...newScanDetails[index], [field]: value };
    onChange({ scanDetails: newScanDetails });
  };

  return (
    <div className="space-y-6">
      {/* Inspection Plan Visual Preview */}
      <InspectionPlanViewer
        partType={partType}
        scanDetails={scanDetails.filter(d => d.enabled)}
        highlightedDirection={highlightedDirection}
        dimensions={dimensions}
      />

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
                  <th className="text-center p-2 font-semibold text-sm w-16">Select</th>
                  <th className="text-center p-2 font-semibold text-sm w-20">Direction</th>
                  <th className="text-left p-2 font-semibold text-sm">Wave Mode</th>
                  <th className="text-left p-2 font-semibold text-sm">Frequency (MHz)</th>
                  <th className="text-left p-2 font-semibold text-sm">Make</th>
                  <th className="text-left p-2 font-semibold text-sm">Probe</th>
                  <th className="text-left p-2 font-semibold text-sm">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {scanDetails.map((detail, index) => (
                  <tr
                    key={detail.scanningDirection}
                    className={`border-b transition-all ${detail.enabled ? 'bg-blue-50/50' : 'hover:bg-muted/30'}`}
                    onMouseEnter={() => detail.enabled && setHighlightedDirection(detail.scanningDirection)}
                    onMouseLeave={() => setHighlightedDirection(null)}
                  >
                    <td className="p-2 text-center">
                      <Checkbox
                        checked={detail.enabled}
                        onCheckedChange={() => toggleScanDetail(index)}
                        className="h-5 w-5"
                        data-testid={`checkbox-${detail.scanningDirection}`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="font-bold text-base">
                        {detail.scanningDirection}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <span className="text-sm text-muted-foreground font-medium">
                        {detail.waveMode}
                      </span>
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={detail.frequency}
                        onChange={(e) => updateScanDetail(index, "frequency", e.target.value)}
                        placeholder="e.g., 5.0"
                        className="h-9"
                        disabled={!detail.enabled}
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
                        disabled={!detail.enabled}
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
                        disabled={!detail.enabled}
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
                        disabled={!detail.enabled}
                        data-testid={`input-remarks-${index}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
            <p>💡 <strong>Tip:</strong> Check the box next to each scanning direction you want to include. The direction letter and wave mode are fixed for each row. Only enabled rows will appear in the inspection plan drawing.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
