import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import type { PartGeometry, StandardType } from "@/types/techniqueSheet";
import type { ScanDetail, ScanDetailsData } from "@/types/scanDetails";
import { TubeScanDiagram } from "@/components/TubeScanDiagram";
import { ConeScanDiagram } from "@/components/ConeScanDiagram";
import { getFrequencyOptionsForStandard } from "@/utils/frequencyUtils";

// Check if part type should use tube diagram
const isTubeType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["tube", "pipe", "sleeve", "bushing"].includes(partType);
};

// Check if part type should use cone diagram
const isConeType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["cone", "truncated_cone", "conical"].includes(partType);
};

interface ScanDetailsTabProps {
  data: ScanDetailsData;
  onChange: (data: ScanDetailsData) => void;
  partType?: PartGeometry | "";
  standard?: StandardType;
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

// Scanning directions per ASTM E2375 (Figures 6 & 7, Annex A1)
// Reference: "Standard Practice for Ultrasonic Testing of Wrought Products"
const FIXED_SCAN_DETAILS: ScanDetail[] = [
  // A: PRIMARY STRAIGHT BEAM - From top/flat face through thickness
  {
    scanningDirection: "A",
    waveMode: "LW 0° (Primary Surface)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#22c55e"
  },
  // A₁: PRIMARY DUAL ELEMENT - Near-surface detection 0-20mm
  {
    scanningDirection: "A₁",
    waveMode: "LW 0° (Dual Element - Near Surface 0-20mm)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#16a34a"
  },
  // B: SECONDARY STRAIGHT BEAM - From adjacent side
  {
    scanningDirection: "B",
    waveMode: "LW 0° (Adjacent Side)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 0,
    color: "#3b82f6"
  },
  // B₁: SECONDARY DUAL ELEMENT - Near-surface detection 0-20mm
  {
    scanningDirection: "B₁",
    waveMode: "LW 0° (Dual Element - Near Surface 0-20mm)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 0,
    color: "#2563eb"
  },
  // C: TERTIARY/RADIAL - Third face (hex bar) or radial from OD (cylindrical parts)
  {
    scanningDirection: "C",
    waveMode: "LW 0° (Third Face / Radial from OD)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 0,
    color: "#f59e0b"
  },
  // C₁: TERTIARY/RADIAL DUAL ELEMENT - Near-surface detection 0-20mm
  {
    scanningDirection: "C₁",
    waveMode: "LW 0° (Dual Element - Near Surface 0-20mm)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 0,
    color: "#d97706"
  },
  // D: CIRCUMFERENTIAL SHEAR CW - Required for rings/tubes
  {
    scanningDirection: "D",
    waveMode: "SW Circumferential CW",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  // E: CIRCUMFERENTIAL SHEAR CCW - Both directions required
  {
    scanningDirection: "E",
    waveMode: "SW Circumferential CCW",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  // F: AXIAL SHEAR DIRECTION 1 - For tubes
  {
    scanningDirection: "F",
    waveMode: "SW Axial Dir.1",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  // G: AXIAL SHEAR DIRECTION 2 - Opposite direction
  {
    scanningDirection: "G",
    waveMode: "SW Axial Dir.2",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  // H: FROM ID SURFACE - For hollow parts (tubes, rings)
  {
    scanningDirection: "H",
    waveMode: "LW 0° (from ID - hollow parts)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "id",
    angle: 0,
    color: "#ff0000"
  },
  // I: THROUGH-TRANSMISSION - Two-probe technique
  {
    scanningDirection: "I",
    waveMode: "Through-Transmission (TT)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#84cc16"
  },
  // J: SW 60° - For thin sections (<1 inch)
  {
    scanningDirection: "J",
    waveMode: "SW 60° (thin sections <1in)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 60,
    color: "#f97316"
  },
  // K: SW 45° - For thick sections (>1 inch)
  {
    scanningDirection: "K",
    waveMode: "SW 45° (thick sections >1in)",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 45,
    color: "#eab308"
  },
  // L: ROTATIONAL 360° - Radial scan while rotating (round bars)
  {
    scanningDirection: "L",
    waveMode: "LW 0° Rotating 360°",
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
    case "A": return <span title="From Top"><ArrowDown className="w-4 h-4" style={style} /></span>;
    case "A₁": return <span title="Dual Element - From Top"><ArrowDown className="w-4 h-4" style={style} /></span>;
    case "B": return <span title="From Bottom"><ArrowUp className="w-4 h-4" style={style} /></span>;
    case "B₁": return <span title="Dual Element - From Bottom"><ArrowUp className="w-4 h-4" style={style} /></span>;
    case "C": return <span title="From OD/Side"><ArrowLeft className="w-4 h-4" style={style} /></span>;
    case "C₁": return <span title="Dual Element - From OD/Side"><ArrowLeft className="w-4 h-4" style={style} /></span>;
    case "D": return <span title="SW 45° CW"><RotateCw className="w-4 h-4" style={style} /></span>;
    case "E": return <span title="SW 45° CCW"><RotateCcw className="w-4 h-4" style={style} /></span>;
    case "F": return <span title="Circumferential"><Circle className="w-4 h-4" style={style} /></span>;
    case "G": return <span title="Axial from OD"><ArrowRight className="w-4 h-4" style={style} /></span>;
    case "H": return <span title="From ID"><Disc className="w-4 h-4" style={style} /></span>;
    case "I": return <span title="TT"><ArrowDown className="w-4 h-4" style={style} /></span>;
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

export const ScanDetailsTab = ({ data, onChange, partType, standard = "AMS-STD-2154E", dimensions = {} }: ScanDetailsTabProps) => {
  // Get frequency options for the selected standard
  const frequencyOptions = getFrequencyOptionsForStandard(standard);
  const [highlightedDirection, setHighlightedDirection] = useState<string | null>(null);

  // Initialize with fixed scan details if empty
  useEffect(() => {
    if (!data?.scanDetails || data.scanDetails.length === 0) {
      onChange({ scanDetails: FIXED_SCAN_DETAILS });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content - side by side layout */}
      <div className="flex-1 flex gap-2 min-h-0 p-1">
        {/* LEFT: Diagram - wrapped with data-testid for PDF export capture */}
        <div className="w-1/2 min-h-0 flex-shrink-0" data-testid="e2375-diagram">
          {isTubeType(partType) ? (
            <TubeScanDiagram
              scanDetails={scanDetails}
              highlightedDirection={highlightedDirection}
            />
          ) : isConeType(partType) ? (
            <ConeScanDiagram
              scanDetails={scanDetails}
              highlightedDirection={highlightedDirection}
            />
          ) : (
            <Card className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center p-4">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {partType ? `Diagram for "${partType}" coming soon` : "Select Part Type in Setup"}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: Scan Details Table */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Compact header with warning */}
          <div className="flex items-center justify-between mb-1 text-[10px]">
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              D/E→notched | F/G/H→angle beam
            </span>
            <span className="text-muted-foreground">
              {scanDetails.filter(d => d.enabled).length}/{scanDetails.length}
            </span>
          </div>

          <div className="flex-1 overflow-auto border rounded text-[10px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted z-10">
                <tr className="border-b">
                  <th className="px-0.5 py-0.5 w-5"></th>
                  <th className="px-0.5 py-0.5 w-7 text-center">Direction</th>
                  <th className="px-0.5 py-0.5 text-left">Wave Mode</th>
                  <th className="px-0.5 py-0.5 w-12 text-left">Frequency</th>
                  <th className="px-0.5 py-0.5 w-12 text-left">Technique</th>
                  <th className="px-0.5 py-0.5 w-14 text-left">Active Element</th>
                  <th className="px-0.5 py-0.5 w-16 text-left">Probe</th>
                  <th className="px-0.5 py-0.5 w-20 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {scanDetails.map((detail, index) => (
                  <tr
                    key={detail.scanningDirection}
                    className={`border-b ${detail.enabled ? 'bg-blue-50/50' : 'hover:bg-muted/20'}`}
                    onMouseEnter={() => setHighlightedDirection(detail.scanningDirection)}
                    onMouseLeave={() => setHighlightedDirection(null)}
                  >
                    <td className="px-0.5 py-px text-center">
                      <Checkbox
                        checked={detail.enabled}
                        onCheckedChange={() => toggleScanDetail(index)}
                        className="h-3 w-3"
                      />
                    </td>
                    <td className="px-0.5 py-px text-center">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold">
                        {detail.scanningDirection}
                      </Badge>
                    </td>
                    <td className="px-0.5 py-px">
                      <span className="text-muted-foreground text-[9px] whitespace-nowrap">
                        {detail.waveMode}
                      </span>
                    </td>
                    <td className="px-0.5 py-px">
                      <Select value={detail.frequency} onValueChange={(v) => updateScanDetail(index, "frequency", v)}>
                        <SelectTrigger className="h-5 text-[9px] px-0.5 w-full border-0 bg-transparent">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-0.5 py-px">
                      <Select value={detail.technique || ""} onValueChange={(v) => updateScanDetail(index, "technique", v)}>
                        <SelectTrigger className="h-5 text-[9px] px-0.5 w-full border-0 bg-transparent">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONVENTIONAL" className="text-xs">CONV</SelectItem>
                          <SelectItem value="PHASED ARRAY" className="text-xs">PA</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-0.5 py-px">
                      <Input
                        value={detail.activeElement || ""}
                        onChange={(e) => updateScanDetail(index, "activeElement", e.target.value)}
                        className="h-5 text-[9px] px-0.5 border-0 bg-transparent"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-0.5 py-px">
                      <Input
                        value={detail.probe}
                        onChange={(e) => updateScanDetail(index, "probe", e.target.value)}
                        className="h-5 text-[9px] px-0.5 border-0 bg-transparent"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-0.5 py-px">
                      <Input
                        value={detail.remarkDetails}
                        onChange={(e) => updateScanDetail(index, "remarkDetails", e.target.value)}
                        className="h-5 text-[9px] px-0.5 border-0 bg-transparent"
                        placeholder="-"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
