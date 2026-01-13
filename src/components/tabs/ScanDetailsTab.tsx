import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { PartGeometry, StandardType } from "@/types/techniqueSheet";
import type { ScanDetail, ScanDetailsData, GateSettings } from "@/types/scanDetails";
import { TubeScanDiagram } from "@/components/TubeScanDiagram";
import { ConeScanDiagram } from "@/components/ConeScanDiagram";
import { getFrequencyOptionsForStandard } from "@/utils/frequencyUtils";

// Extended ScanDetail with per-row pulsar parameters
interface ExtendedScanDetail extends ScanDetail {
  // Per-row pulsar parameters (from SCAN DETAILS.docx)
  scanningFile?: string;
  pulsarParams?: string;
  prf?: number;
  indexMode?: string;
  db?: number;
  filter?: string;
  reject?: string;
  tcgMode?: boolean;
}

// Default gate settings
const DEFAULT_GATE: GateSettings = {
  start: 0,
  length: 0,
  level: 0,
};

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
    coneTopDiameter?: number;
    coneBottomDiameter?: number;
    coneHeight?: number;
    wallThickness?: number;
    isHollow?: boolean;
  };
}

// Scanning directions per ASTM E2375 (Figures 6 & 7, Annex A1)
const FIXED_SCAN_DETAILS: ExtendedScanDetail[] = [
  {
    scanningDirection: "A",
    waveMode: "Longitudinal",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#22c55e"
  },
  {
    scanningDirection: "A₁",
    waveMode: "Dual element",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#16a34a"
  },
  {
    scanningDirection: "B",
    waveMode: "Longitudinal",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 0,
    color: "#3b82f6"
  },
  {
    scanningDirection: "B₁",
    waveMode: "Dual element",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "side",
    angle: 0,
    color: "#2563eb"
  },
  {
    scanningDirection: "C",
    waveMode: "Longitudinal",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 0,
    color: "#f59e0b"
  },
  {
    scanningDirection: "C₁",
    waveMode: "Dual element",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 0,
    color: "#d97706"
  },
  {
    scanningDirection: "D",
    waveMode: "Longitudinal",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  {
    scanningDirection: "E",
    waveMode: "Axial shear wave 45 OD",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  {
    scanningDirection: "F",
    waveMode: "Axial shear wave 45 OD",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  {
    scanningDirection: "G",
    waveMode: "Shear wave 45 clockwise",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "od",
    angle: 45,
    color: "#ff0000"
  },
  {
    scanningDirection: "H",
    waveMode: "Shear wave 45 counter clockwise",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "id",
    angle: 0,
    color: "#ff0000"
  },
  {
    scanningDirection: "I",
    waveMode: "Shear wave 45 counter clockwise",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "top",
    angle: 0,
    color: "#84cc16"
  },
  {
    scanningDirection: "L",
    waveMode: "Shear wave 45 counter clockwise",
    frequency: "", make: "", probe: "", remarkDetails: "",
    enabled: false,
    entrySurface: "radial",
    angle: 0,
    color: "#a855f7"
  },
];

export const ScanDetailsTab = ({ data, onChange, partType, standard = "AMS-STD-2154E" }: ScanDetailsTabProps) => {
  const frequencyOptions = getFrequencyOptionsForStandard(standard);
  const [highlightedDirection, setHighlightedDirection] = useState<string | null>(null);

  // Initialize with fixed scan details if empty
  useEffect(() => {
    if (!data?.scanDetails || data.scanDetails.length === 0) {
      onChange({
        scanDetails: FIXED_SCAN_DETAILS,
        pulsarParameters: data.pulsarParameters,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure we have all fixed scan details
  const scanDetails = FIXED_SCAN_DETAILS.map(fixed => {
    const existing = data.scanDetails?.find(d => d.scanningDirection === fixed.scanningDirection);
    return (existing || fixed) as ExtendedScanDetail;
  });

  const toggleScanDetail = (index: number) => {
    const newScanDetails = [...scanDetails];
    newScanDetails[index] = { ...newScanDetails[index], enabled: !newScanDetails[index].enabled };
    onChange({ ...data, scanDetails: newScanDetails });
  };

  const updateScanDetail = (index: number, field: string, value: string | number | boolean | GateSettings) => {
    const newScanDetails = [...scanDetails];
    newScanDetails[index] = { ...newScanDetails[index], [field]: value };
    onChange({ ...data, scanDetails: newScanDetails });
  };

  // Helper to update gate settings
  const updateGate = (index: number, gateField: 'gate1' | 'gate2', subField: keyof GateSettings, value: number) => {
    const newScanDetails = [...scanDetails];
    const currentGate = (newScanDetails[index][gateField] as GateSettings | undefined) || DEFAULT_GATE;
    newScanDetails[index] = {
      ...newScanDetails[index],
      [gateField]: { ...currentGate, [subField]: value }
    };
    onChange({ ...data, scanDetails: newScanDetails });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content - side by side layout */}
      <div className="flex-1 flex gap-2 min-h-0 p-1">
        {/* LEFT: Diagram */}
        <div className="w-1/3 min-h-0 flex-shrink-0" data-testid="e2375-diagram">
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

        {/* RIGHT: Comprehensive Scan Details Table - ALL COLUMNS IN ONE TABLE */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              Scan Details Table
            </span>
            <Badge variant="outline" className="text-[10px]">
              {scanDetails.filter(d => d.enabled).length} / {scanDetails.length} enabled
            </Badge>
          </div>

          {/* Scrollable Table Container - Horizontal scroll for all columns */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <div className="min-w-[2800px]">
              <table className="w-full border-collapse text-[10px]">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  {/* Main Header Row with grouped columns */}
                  <tr className="border-b-2 border-slate-300">
                    {/* Basic Info */}
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-6" rowSpan={2}></th>
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-10" rowSpan={2}>
                      Scanning<br/>Direction
                    </th>
                    <th className="px-1 py-1.5 text-left font-semibold border-r w-28" rowSpan={2}>
                      Wave Mode
                    </th>

                    {/* Probe Details Group */}
                    <th className="px-1 py-1 text-center font-semibold border-r border-b bg-blue-50" colSpan={5}>
                      Probe Details
                    </th>

                    {/* Measurement */}
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-14" rowSpan={2}>
                      Range<br/>(mm)
                    </th>

                    {/* Gate 1 Group */}
                    <th className="px-1 py-1 text-center font-semibold border-r border-b bg-green-50" colSpan={3}>
                      Gate 1 (Start-Length-Level)
                    </th>

                    {/* Attenuation & BWE */}
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-14" rowSpan={2}>
                      Attenuation
                    </th>
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-10" rowSpan={2}>
                      BWE
                    </th>

                    {/* Gate 2 Group */}
                    <th className="px-1 py-1 text-center font-semibold border-r border-b bg-amber-50" colSpan={3}>
                      Gate 2 (Start-Length-Level)
                    </th>

                    {/* SSS */}
                    <th className="px-1 py-1.5 text-center font-semibold border-r w-12" rowSpan={2}>
                      SSS
                    </th>

                    {/* Pulsar Parameters Group - THESE WERE MISSING! */}
                    <th className="px-1 py-1 text-center font-semibold border-r border-b bg-purple-50" colSpan={8}>
                      Pulsar Parameters
                    </th>
                  </tr>

                  {/* Sub-header Row for grouped columns */}
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {/* Probe Details sub-headers */}
                    <th className="px-1 py-1 text-center font-medium border-r w-16 bg-blue-50/50">Make</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-14 bg-blue-50/50">Frequency</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-20 bg-blue-50/50">Size / Type</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-16 bg-blue-50/50">Part Number</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-16 bg-blue-50/50">Serial Number</th>

                    {/* Gate 1 sub-headers */}
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-green-50/50">Start</th>
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-green-50/50">Length</th>
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-green-50/50">Level</th>

                    {/* Gate 2 sub-headers */}
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-amber-50/50">Start</th>
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-amber-50/50">Length</th>
                    <th className="px-0.5 py-1 text-center font-medium border-r w-10 bg-amber-50/50">Level</th>

                    {/* Pulsar Parameters sub-headers */}
                    <th className="px-1 py-1 text-center font-medium border-r w-20 bg-purple-50/50">Scanning File</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-28 bg-purple-50/50">Pulsar Parameters</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-12 bg-purple-50/50">PRF</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-14 bg-purple-50/50">Index</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-10 bg-purple-50/50">DB</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-14 bg-purple-50/50">Filter</th>
                    <th className="px-1 py-1 text-center font-medium border-r w-12 bg-purple-50/50">Reject</th>
                    <th className="px-1 py-1 text-center font-medium w-16 bg-purple-50/50">TCG Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {scanDetails.map((detail, index) => (
                    <tr
                      key={detail.scanningDirection}
                      className={`border-b transition-colors ${
                        detail.enabled
                          ? 'bg-blue-50/40 hover:bg-blue-50/60'
                          : 'hover:bg-slate-50/50'
                      }`}
                      onMouseEnter={() => setHighlightedDirection(detail.scanningDirection)}
                      onMouseLeave={() => setHighlightedDirection(null)}
                    >
                      {/* Enable Checkbox */}
                      <td className="px-1 py-0.5 text-center border-r">
                        <Checkbox
                          checked={detail.enabled}
                          onCheckedChange={() => toggleScanDetail(index)}
                          className="h-3.5 w-3.5"
                        />
                      </td>

                      {/* Scanning Direction */}
                      <td className="px-1 py-0.5 text-center border-r">
                        <Badge
                          variant={detail.enabled ? "default" : "outline"}
                          className="text-[9px] font-bold px-1.5"
                          style={detail.enabled ? { backgroundColor: detail.color } : {}}
                        >
                          {detail.scanningDirection}
                        </Badge>
                      </td>

                      {/* Wave Mode */}
                      <td className="px-1 py-0.5 border-r">
                        <span className="text-muted-foreground text-[9px]">
                          {detail.waveMode}
                        </span>
                      </td>

                      {/* Make */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          value={detail.make || ""}
                          onChange={(e) => updateScanDetail(index, "make", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="OLYMPUS"
                        />
                      </td>

                      {/* Frequency */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Select value={detail.frequency} onValueChange={(v) => updateScanDetail(index, "frequency", v)}>
                          <SelectTrigger className="h-6 text-[9px] px-1 w-full">
                            <SelectValue placeholder="MHz" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((f) => (
                              <SelectItem key={f} value={f} className="text-[10px]">{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Size / Type */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          value={detail.probe || ""}
                          onChange={(e) => updateScanDetail(index, "probe", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="Size, Type"
                        />
                      </td>

                      {/* Part Number */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          value={detail.partNumber || ""}
                          onChange={(e) => updateScanDetail(index, "partNumber", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="P/N"
                        />
                      </td>

                      {/* Serial Number */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          value={detail.serialNumber || ""}
                          onChange={(e) => updateScanDetail(index, "serialNumber", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="S/N"
                        />
                      </td>

                      {/* Range (mm) */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          type="number"
                          value={detail.rangeMm?.toString() || ""}
                          onChange={(e) => updateScanDetail(index, "rangeMm", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-1 text-center"
                          placeholder="380"
                        />
                      </td>

                      {/* Gate 1 - Start */}
                      <td className="px-0.5 py-0.5 border-r bg-green-50/20">
                        <Input
                          type="number"
                          value={detail.gate1?.start?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate1", "start", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="130"
                        />
                      </td>

                      {/* Gate 1 - Length */}
                      <td className="px-0.5 py-0.5 border-r bg-green-50/20">
                        <Input
                          type="number"
                          value={detail.gate1?.length?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate1", "length", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="180"
                        />
                      </td>

                      {/* Gate 1 - Level */}
                      <td className="px-0.5 py-0.5 border-r bg-green-50/20">
                        <Input
                          type="number"
                          value={detail.gate1?.level?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate1", "level", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="80%"
                        />
                      </td>

                      {/* Attenuation */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          type="number"
                          value={detail.attenuation?.toString() || ""}
                          onChange={(e) => updateScanDetail(index, "attenuation", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-1 text-center"
                          placeholder="0"
                        />
                      </td>

                      {/* BWE (Back Wall Echo) */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          type="number"
                          value={detail.backWallEcho?.toString() || ""}
                          onChange={(e) => updateScanDetail(index, "backWallEcho", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-1 text-center"
                          placeholder="80"
                        />
                      </td>

                      {/* Gate 2 - Start */}
                      <td className="px-0.5 py-0.5 border-r bg-amber-50/20">
                        <Input
                          type="number"
                          value={detail.gate2?.start?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate2", "start", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="0"
                        />
                      </td>

                      {/* Gate 2 - Length */}
                      <td className="px-0.5 py-0.5 border-r bg-amber-50/20">
                        <Input
                          type="number"
                          value={detail.gate2?.length?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate2", "length", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="10"
                        />
                      </td>

                      {/* Gate 2 - Level */}
                      <td className="px-0.5 py-0.5 border-r bg-amber-50/20">
                        <Input
                          type="number"
                          value={detail.gate2?.level?.toString() || ""}
                          onChange={(e) => updateGate(index, "gate2", "level", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="45%"
                        />
                      </td>

                      {/* SSS */}
                      <td className="px-0.5 py-0.5 border-r">
                        <Input
                          value={detail.sss || ""}
                          onChange={(e) => updateScanDetail(index, "sss", e.target.value)}
                          className="h-6 text-[9px] px-1 text-center"
                          placeholder="OFF"
                        />
                      </td>

                      {/* === PULSAR PARAMETERS COLUMNS === */}

                      {/* Scanning File */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Input
                          value={(detail as ExtendedScanDetail).scanningFile || ""}
                          onChange={(e) => updateScanDetail(index, "scanningFile", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="File"
                        />
                      </td>

                      {/* Pulsar Parameters */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Input
                          value={(detail as ExtendedScanDetail).pulsarParams || ""}
                          onChange={(e) => updateScanDetail(index, "pulsarParams", e.target.value)}
                          className="h-6 text-[9px] px-1"
                          placeholder="300V,SQUARE,130NS"
                        />
                      </td>

                      {/* PRF */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Input
                          type="number"
                          value={(detail as ExtendedScanDetail).prf?.toString() || ""}
                          onChange={(e) => updateScanDetail(index, "prf", parseInt(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="150"
                        />
                      </td>

                      {/* Index */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Select
                          value={(detail as ExtendedScanDetail).indexMode || ""}
                          onValueChange={(v) => updateScanDetail(index, "indexMode", v)}
                        >
                          <SelectTrigger className="h-6 text-[9px] px-1 w-full">
                            <SelectValue placeholder="Index" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AUTO" className="text-[10px]">AUTO</SelectItem>
                            <SelectItem value="1MM" className="text-[10px]">1MM</SelectItem>
                            <SelectItem value="2MM" className="text-[10px]">2MM</SelectItem>
                            <SelectItem value="5MM" className="text-[10px]">5MM</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* DB */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Input
                          type="number"
                          value={(detail as ExtendedScanDetail).db?.toString() || ""}
                          onChange={(e) => updateScanDetail(index, "db", parseFloat(e.target.value) || 0)}
                          className="h-6 text-[9px] px-0.5 text-center"
                          placeholder="0"
                        />
                      </td>

                      {/* Filter */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Select
                          value={(detail as ExtendedScanDetail).filter || ""}
                          onValueChange={(v) => updateScanDetail(index, "filter", v)}
                        >
                          <SelectTrigger className="h-6 text-[9px] px-1 w-full">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2MHZ" className="text-[10px]">2MHZ</SelectItem>
                            <SelectItem value="5MHZ" className="text-[10px]">5MHZ</SelectItem>
                            <SelectItem value="10MHZ" className="text-[10px]">10MHZ</SelectItem>
                            <SelectItem value="WIDEBAND" className="text-[10px]">WIDEBAND</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Reject */}
                      <td className="px-0.5 py-0.5 border-r bg-purple-50/20">
                        <Select
                          value={(detail as ExtendedScanDetail).reject || ""}
                          onValueChange={(v) => updateScanDetail(index, "reject", v)}
                        >
                          <SelectTrigger className="h-6 text-[9px] px-1 w-full">
                            <SelectValue placeholder="%" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0%" className="text-[10px]">0%</SelectItem>
                            <SelectItem value="5%" className="text-[10px]">5%</SelectItem>
                            <SelectItem value="10%" className="text-[10px]">10%</SelectItem>
                            <SelectItem value="20%" className="text-[10px]">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* TCG Mode */}
                      <td className="px-0.5 py-0.5 bg-purple-50/20">
                        <div className="flex items-center justify-center gap-1">
                          <Switch
                            checked={(detail as ExtendedScanDetail).tcgMode ?? false}
                            onCheckedChange={(checked) => updateScanDetail(index, "tcgMode", checked)}
                            className="scale-75"
                          />
                          <span className="text-[8px]">
                            {(detail as ExtendedScanDetail).tcgMode ? "ON" : "OFF"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
