import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronRight, Upload, ImageIcon, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PartGeometry, StandardType } from "@/types/techniqueSheet";
import type { ScanDetail, ScanDetailsData, GateSettings } from "@/types/scanDetails";
import { TubeScanDiagram } from "@/components/TubeScanDiagram";
import { ConeScanDiagram } from "@/components/ConeScanDiagram";
import { BoxScanDiagram } from "@/components/BoxScanDiagram";
import { CylinderScanDiagram } from "@/components/CylinderScanDiagram";
import { DiskScanDiagram } from "@/components/DiskScanDiagram";
import { V2500BoreScanDiagram } from "@/components/V2500BoreScanDiagram";
import { RingScanDiagram } from "@/components/RingScanDiagram";
import { HexBarScanDiagram } from "@/components/HexBarScanDiagram";
import { ImpellerScanDiagram } from "@/components/ImpellerScanDiagram";
import { BliskScanDiagram } from "@/components/BliskScanDiagram";
import { getFrequencyOptionsForStandard } from "@/utils/frequencyUtils";
import { CustomDrawingUpload, ArrowOverlay, GeometrySelector } from "@/components/scan-overlay";
import { useOllamaVision } from "@/components/scan-overlay/hooks/useOllamaVision";
import { generateArrowsForGeometry, syncArrowsWithScanDetails } from "@/utils/scanArrowPlacement";
import type { ScanArrow } from "@/types/scanOverlay";

// Extended ScanDetail with per-row pulsar parameters
interface ExtendedScanDetail extends ScanDetail {
  scanningFile?: string;
  pulsarParams?: string;
  prf?: number;
  indexMode?: string;
  db?: number;
  filter?: string;
  reject?: string;
  tcgMode?: boolean;
}

const DEFAULT_GATE: GateSettings = { start: 0, length: 0, level: 0 };

const isTubeType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["tube", "pipe", "sleeve", "bushing", "rectangular_tube", "square_tube"].includes(partType);
};

const isConeType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["cone", "truncated_cone", "conical", "pyramid"].includes(partType);
};

const isBoxType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["box", "plate", "sheet", "slab", "flat_bar", "rectangular_bar", "square_bar", "billet", "block", "bar"].includes(partType);
};

const isCylinderType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["cylinder", "round_bar", "shaft", "forging", "round_forging_stock", "rectangular_forging_stock", "near_net_forging", "machined_component"].includes(partType);
};

const isDiskType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["disk", "disk_forging", "hub"].includes(partType);
};

const isImpellerType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && partType === "impeller";
};

const isBliskType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && partType === "blisk";
};

const isRingType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["ring", "ring_forging"].includes(partType);
};

const isHexType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && ["hexagon", "hex_bar"].includes(partType);
};

const isProfileType = (partType?: PartGeometry | ""): boolean => {
  return !!partType && [
    "l_profile", "t_profile", "i_profile", "u_profile", "z_profile", "z_section", "custom_profile",
    "extrusion_l", "extrusion_t", "extrusion_i", "extrusion_u", "extrusion_channel", "extrusion_angle"
  ].includes(partType);
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

const FIXED_SCAN_DETAILS: ExtendedScanDetail[] = [
  { scanningDirection: "A", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "top", angle: 0, color: "#22c55e" },
  { scanningDirection: "A₁", waveMode: "Dual element", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "top", angle: 0, color: "#16a34a" },
  { scanningDirection: "B", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "side", angle: 0, color: "#3b82f6" },
  { scanningDirection: "B₁", waveMode: "Dual element", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "side", angle: 0, color: "#2563eb" },
  { scanningDirection: "C", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 0, color: "#f59e0b" },
  { scanningDirection: "C₁", waveMode: "Dual element", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 0, color: "#d97706" },
  { scanningDirection: "D", waveMode: "Longitudinal", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 45, color: "#ef4444" },
  { scanningDirection: "E", waveMode: "Axial shear wave 45 OD", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 45, color: "#ec4899" },
  { scanningDirection: "F", waveMode: "Axial shear wave 45 OD", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 45, color: "#8b5cf6" },
  { scanningDirection: "G", waveMode: "Shear wave 45 clockwise", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "od", angle: 45, color: "#14b8a6" },
  { scanningDirection: "H", waveMode: "Shear wave 45 CCW", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "id", angle: 0, color: "#06b6d4" },
  { scanningDirection: "I", waveMode: "Shear wave 45 CCW", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "top", angle: 0, color: "#84cc16" },
  { scanningDirection: "L", waveMode: "Shear wave 45 CCW", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false, entrySurface: "radial", angle: 0, color: "#a855f7" },
];

export const ScanDetailsTab = ({ data, onChange, partType, standard = "AMS-STD-2154E", dimensions }: ScanDetailsTabProps) => {
  const frequencyOptions = getFrequencyOptionsForStandard(standard);
  const [highlightedDirection, setHighlightedDirection] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Custom drawing state
  const [useCustomDrawing, setUseCustomDrawing] = useState<boolean>(!!data.customDrawingData?.image);
  const [customDrawingGeometry, setCustomDrawingGeometry] = useState<PartGeometry | null>(
    (data.customDrawingData?.confirmedGeometry as PartGeometry) || null
  );
  const [scanArrows, setScanArrows] = useState<ScanArrow[]>([]);

  // AI vision hook (supports Claude + Ollama)
  const {
    isAnalyzing,
    result: aiAnalysisResult,
    error: aiError,
    activeProvider,
    analyze: analyzeWithOllama,
    reset: resetAnalysis,
    setApiKey,
  } = useOllamaVision();

  useEffect(() => {
    if (!data?.scanDetails || data.scanDetails.length === 0) {
      onChange({ scanDetails: FIXED_SCAN_DETAILS, pulsarParameters: data.pulsarParameters });
    }
  }, []);

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

  const updateGate = (index: number, gateField: 'gate1' | 'gate2', subField: keyof GateSettings, value: number) => {
    const newScanDetails = [...scanDetails];
    const currentGate = (newScanDetails[index][gateField] as GateSettings | undefined) || DEFAULT_GATE;
    newScanDetails[index] = { ...newScanDetails[index], [gateField]: { ...currentGate, [subField]: value } };
    onChange({ ...data, scanDetails: newScanDetails });
  };

  const toggleExpand = (direction: string) => {
    setExpandedRow(expandedRow === direction ? null : direction);
  };

  // Custom drawing handlers
  const handleImageUpload = useCallback((imageBase64: string, width: number, height: number) => {
    // Save the image to data
    onChange({
      ...data,
      customDrawingData: {
        image: imageBase64,
        imageWidth: width,
        imageHeight: height,
        confirmedGeometry: '',
        lastModified: new Date().toISOString(),
      }
    });

    // Trigger AI analysis
    analyzeWithOllama(imageBase64);
  }, [onChange, data, analyzeWithOllama]);

  const handleGeometrySelect = useCallback((geometry: PartGeometry) => {
    setCustomDrawingGeometry(geometry);

    // Use AI-suggested arrows if available, otherwise use templates
    let arrows: ScanArrow[];
    if (aiAnalysisResult?.suggestedArrows && aiAnalysisResult.suggestedArrows.length > 0) {
      // Define colors for each direction
      const directionColors: Record<string, string> = {
        A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
        E: '#8b5cf6', F: '#ec4899', G: '#06b6d4', H: '#84cc16',
        I: '#f97316', J: '#6366f1', K: '#14b8a6', L: '#a855f7',
      };
      // Convert AI suggested arrows to ScanArrow format
      arrows = aiAnalysisResult.suggestedArrows.map(sa => ({
        direction: sa.direction,
        x: sa.x,
        y: sa.y,
        angle: sa.angle,
        length: 0.12,
        visible: true,
        color: directionColors[sa.direction] || '#6b7280',
        label: sa.label,
      }));
      console.log('🎯 Using AI-suggested arrow positions');
    } else {
      // Fall back to template arrows
      arrows = generateArrowsForGeometry(geometry);
      console.log('📐 Using template arrow positions');
    }

    // Sync with current scan details enabled state
    const syncedArrows = syncArrowsWithScanDetails(arrows, scanDetails);
    setScanArrows(syncedArrows);

    // Update data with confirmed geometry
    if (data.customDrawingData) {
      onChange({
        ...data,
        customDrawingData: {
          ...data.customDrawingData,
          confirmedGeometry: geometry,
          lastModified: new Date().toISOString(),
        }
      });
    }
  }, [data, onChange, scanDetails, aiAnalysisResult]);

  const handleRemoveCustomDrawing = useCallback(() => {
    setUseCustomDrawing(false);
    setCustomDrawingGeometry(null);
    setScanArrows([]);
    resetAnalysis();

    // Remove custom drawing data
    const { customDrawingData, ...restData } = data;
    onChange(restData as ScanDetailsData);
  }, [data, onChange, resetAnalysis]);

  // Handle arrow drag/move
  const handleArrowMove = useCallback((direction: string, x: number, y: number) => {
    setScanArrows(prev => prev.map(arrow =>
      arrow.direction === direction
        ? { ...arrow, x, y }
        : arrow
    ));
  }, []);

  // Sync arrows when scan details enabled state changes
  useEffect(() => {
    if (scanArrows.length > 0) {
      const syncedArrows = syncArrowsWithScanDetails(scanArrows, scanDetails);
      setScanArrows(syncedArrows);
    }
  }, [scanDetails.map(d => d.enabled).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize arrows if custom drawing exists with confirmed geometry
  useEffect(() => {
    if (data.customDrawingData?.confirmedGeometry && scanArrows.length === 0) {
      const geometry = data.customDrawingData.confirmedGeometry as PartGeometry;
      setCustomDrawingGeometry(geometry);
      const arrows = generateArrowsForGeometry(geometry);
      const syncedArrows = syncArrowsWithScanDetails(arrows, scanDetails);
      setScanArrows(syncedArrows);
    }
  }, [data.customDrawingData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render expanded details panel - Dark theme design
  const renderExpandedDetails = (detail: ExtendedScanDetail, index: number) => (
    <tr className="bg-slate-900/50 border-b border-slate-700">
      <td colSpan={8} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Probe Details Section */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-blue-500/30">
            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Probe Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Part Number</Label>
                <Input
                  value={detail.partNumber || ""}
                  onChange={(e) => updateScanDetail(index, "partNumber", e.target.value)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="P/N"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Serial Number</Label>
                <Input
                  value={detail.serialNumber || ""}
                  onChange={(e) => updateScanDetail(index, "serialNumber", e.target.value)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="S/N"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Range (mm)</Label>
                <Input
                  type="number"
                  value={detail.rangeMm?.toString() || ""}
                  onChange={(e) => updateScanDetail(index, "rangeMm", parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="380"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Attenuation (dB)</Label>
                <Input
                  type="number"
                  value={detail.attenuation?.toString() || ""}
                  onChange={(e) => updateScanDetail(index, "attenuation", parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">BWE (%)</Label>
                <Input
                  type="number"
                  value={detail.backWallEcho?.toString() || ""}
                  onChange={(e) => updateScanDetail(index, "backWallEcho", parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="80"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">SSS</Label>
                <Input
                  value={detail.sss || ""}
                  onChange={(e) => updateScanDetail(index, "sss", e.target.value)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="OFF"
                />
              </div>
            </div>
          </div>

          {/* Gates Section */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-emerald-500/30">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Gate Settings
            </h4>
            <div className="space-y-4">
              {/* Gate 1 */}
              <div>
                <Label className="text-[10px] text-emerald-400/80 uppercase tracking-wide">Gate 1 (Start - Length - Level)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Input
                    type="number"
                    value={detail.gate1?.start?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate1", "start", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    placeholder="Start"
                  />
                  <Input
                    type="number"
                    value={detail.gate1?.length?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate1", "length", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    placeholder="Length"
                  />
                  <Input
                    type="number"
                    value={detail.gate1?.level?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate1", "level", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    placeholder="Level %"
                  />
                </div>
              </div>
              {/* Gate 2 */}
              <div>
                <Label className="text-[10px] text-amber-400/80 uppercase tracking-wide">Gate 2 (Start - Length - Level)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Input
                    type="number"
                    value={detail.gate2?.start?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate2", "start", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-amber-950/40 border-amber-700/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="Start"
                  />
                  <Input
                    type="number"
                    value={detail.gate2?.length?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate2", "length", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-amber-950/40 border-amber-700/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="Length"
                  />
                  <Input
                    type="number"
                    value={detail.gate2?.level?.toString() || ""}
                    onChange={(e) => updateGate(index, "gate2", "level", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center bg-amber-950/40 border-amber-700/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="Level %"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pulsar Parameters Section */}
          <div className="bg-slate-800/80 rounded-lg p-4 border border-violet-500/30">
            <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              Pulsar Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Scanning File</Label>
                <Input
                  value={detail.scanningFile || ""}
                  onChange={(e) => updateScanDetail(index, "scanningFile", e.target.value)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="File name"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Pulsar Params</Label>
                <Input
                  value={detail.pulsarParams || ""}
                  onChange={(e) => updateScanDetail(index, "pulsarParams", e.target.value)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="300V,SQUARE,130NS"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">PRF (Hz)</Label>
                <Input
                  type="number"
                  value={detail.prf?.toString() || ""}
                  onChange={(e) => updateScanDetail(index, "prf", parseInt(e.target.value) || 0)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="150"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Index</Label>
                <Select value={detail.indexMode || ""} onValueChange={(v) => updateScanDetail(index, "indexMode", v)}>
                  <SelectTrigger className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="AUTO" className="text-xs text-slate-100">AUTO</SelectItem>
                    <SelectItem value="1MM" className="text-xs text-slate-100">1MM</SelectItem>
                    <SelectItem value="2MM" className="text-xs text-slate-100">2MM</SelectItem>
                    <SelectItem value="5MM" className="text-xs text-slate-100">5MM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">DB</Label>
                <Input
                  type="number"
                  value={detail.db?.toString() || ""}
                  onChange={(e) => updateScanDetail(index, "db", parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Filter</Label>
                <Select value={detail.filter || ""} onValueChange={(v) => updateScanDetail(index, "filter", v)}>
                  <SelectTrigger className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="2MHZ" className="text-xs text-slate-100">2MHZ</SelectItem>
                    <SelectItem value="5MHZ" className="text-xs text-slate-100">5MHZ</SelectItem>
                    <SelectItem value="10MHZ" className="text-xs text-slate-100">10MHZ</SelectItem>
                    <SelectItem value="WIDEBAND" className="text-xs text-slate-100">WIDEBAND</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Reject</Label>
                <Select value={detail.reject || ""} onValueChange={(v) => updateScanDetail(index, "reject", v)}>
                  <SelectTrigger className="h-8 text-xs bg-slate-900/60 border-slate-600 text-slate-100"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="0%" className="text-xs text-slate-100">0%</SelectItem>
                    <SelectItem value="5%" className="text-xs text-slate-100">5%</SelectItem>
                    <SelectItem value="10%" className="text-xs text-slate-100">10%</SelectItem>
                    <SelectItem value="20%" className="text-xs text-slate-100">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">TCG Mode</Label>
                <div className="flex items-center gap-2 h-8">
                  <Switch
                    checked={detail.tcgMode ?? false}
                    onCheckedChange={(checked) => updateScanDetail(index, "tcgMode", checked)}
                    className="scale-90 data-[state=checked]:bg-violet-500"
                  />
                  <span className="text-xs text-slate-300">{detail.tcgMode ? "ON" : "OFF"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  // Render predefined diagram based on part type
  const renderPredefinedDiagram = () => {
    if (isTubeType(partType)) {
      return <TubeScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isConeType(partType)) {
      return <ConeScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isBoxType(partType)) {
      return <BoxScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} partType={partType} dimensions={dimensions} />;
    } else if (isCylinderType(partType)) {
      return <CylinderScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isDiskType(partType)) {
      return (
        <>
          <DiskScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />
          {/* V2500 HPT Disk bore-specific scan plan diagrams (NDIP-1226 / NDIP-1227) */}
          <div className="mt-4 space-y-4">
            <V2500BoreScanDiagram stage={1} highlightedZone={highlightedDirection} />
            <V2500BoreScanDiagram stage={2} highlightedZone={highlightedDirection} />
          </div>
        </>
      );
    } else if (isImpellerType(partType)) {
      return <ImpellerScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isBliskType(partType)) {
      return <BliskScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isRingType(partType)) {
      return <RingScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isHexType(partType)) {
      return <HexBarScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} />;
    } else if (isProfileType(partType)) {
      return <BoxScanDiagram scanDetails={scanDetails} highlightedDirection={highlightedDirection} partType={partType} dimensions={dimensions} />;
    } else {
      return (
        <Card className="h-full flex items-center justify-center bg-muted/30">
          <div className="text-center p-4">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {partType ? `Diagram for "${partType}" coming soon` : "Select Part Type in Setup"}
            </p>
          </div>
        </Card>
      );
    }
  };

  // Render custom drawing with arrow overlay
  const renderCustomDrawing = () => {
    const customData = data.customDrawingData;

    // No image uploaded yet - show upload component
    if (!customData?.image) {
      return (
        <div className="h-full flex flex-col">
          <CustomDrawingUpload
            onImageUpload={handleImageUpload}
            currentImage={null}
          />
        </div>
      );
    }

    // Image uploaded but geometry not confirmed - show selector
    if (!customDrawingGeometry) {
      return (
        <div className="h-full flex flex-col gap-3 overflow-auto">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={customData.image}
                alt="Uploaded drawing"
                className="w-full h-auto max-h-[200px] object-contain rounded-lg bg-gray-100"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveCustomDrawing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <GeometrySelector
            selectedGeometry={customDrawingGeometry}
            onGeometrySelect={handleGeometrySelect}
            aiAnalysis={aiAnalysisResult}
            isAnalyzing={isAnalyzing}
            aiError={aiError}
            activeProvider={activeProvider}
            onSetApiKey={setApiKey}
          />
        </div>
      );
    }

    // Full view with arrows
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 relative overflow-hidden rounded-lg bg-gray-100">
          <ArrowOverlay
            image={customData.image}
            width={400}
            height={300}
            arrows={scanArrows}
            highlightedDirection={highlightedDirection}
            onArrowHover={setHighlightedDirection}
            onArrowMove={handleArrowMove}
            showLabels={true}
            enableDrag={true}
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 shadow-md"
            onClick={handleRemoveCustomDrawing}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
        <div className="flex-shrink-0 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Geometry: <strong className="text-slate-200">{customDrawingGeometry}</strong></span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setCustomDrawingGeometry(null)}
            >
              Change
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex gap-2 min-h-0 p-1">
        {/* LEFT: Diagram / Custom Drawing */}
        <div className="w-1/3 min-h-0 flex-shrink-0 flex flex-col" data-testid="e2375-diagram">
          {/* Toggle between predefined and custom drawing */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={!useCustomDrawing ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setUseCustomDrawing(false)}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Auto
              </Button>
              <Button
                size="sm"
                variant={useCustomDrawing ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setUseCustomDrawing(true)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* Diagram content */}
          <div className="flex-1 min-h-0">
            {useCustomDrawing ? renderCustomDrawing() : renderPredefinedDiagram()}
          </div>
        </div>

        {/* RIGHT: Compact Table with Expandable Rows */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">Scan Details</span>
              <span className="text-[10px] text-blue-400">(Click row to expand details)</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
              {scanDetails.filter(d => d.enabled).length} / {scanDetails.length} enabled
            </Badge>
          </div>

          <div className="flex-1 overflow-auto border border-slate-700 rounded-lg">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr className="border-b border-slate-600">
                  <th className="px-2 py-2 w-8 text-slate-400"></th>
                  <th className="px-2 py-2 w-6 text-slate-400"></th>
                  <th className="px-2 py-2 text-center w-14 text-slate-300 font-medium">Direction</th>
                  <th className="px-2 py-2 text-left text-slate-300 font-medium">Wave Mode</th>
                  <th className="px-2 py-2 text-center w-20 text-slate-300 font-medium">Make</th>
                  <th className="px-2 py-2 text-center w-16 text-slate-300 font-medium">Frequency</th>
                  <th className="px-2 py-2 text-left w-28 text-slate-300 font-medium">Size / Type</th>
                  <th className="px-2 py-2 text-left text-slate-300 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {scanDetails.map((detail, index) => (
                  <React.Fragment key={detail.scanningDirection}>
                    <tr
                      className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                        detail.enabled
                          ? 'bg-blue-900/20 hover:bg-blue-800/30'
                          : 'hover:bg-slate-700/40'
                      } ${expandedRow === detail.scanningDirection ? 'bg-slate-700/50' : ''}`}
                      onMouseEnter={() => setHighlightedDirection(detail.scanningDirection)}
                      onMouseLeave={() => setHighlightedDirection(null)}
                    >
                      {/* Expand Button */}
                      <td className="px-2 py-1.5 text-center" onClick={() => toggleExpand(detail.scanningDirection)}>
                        {expandedRow === detail.scanningDirection ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </td>

                      {/* Checkbox */}
                      <td className="px-1 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={detail.enabled}
                          onCheckedChange={() => toggleScanDetail(index)}
                          className="h-4 w-4 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </td>

                      {/* Direction */}
                      <td className="px-2 py-1.5 text-center" onClick={() => toggleExpand(detail.scanningDirection)}>
                        <Badge
                          variant={detail.enabled ? "default" : "outline"}
                          className="text-xs font-bold"
                          style={detail.enabled ? { backgroundColor: detail.color } : {}}
                        >
                          {detail.scanningDirection}
                        </Badge>
                      </td>

                      {/* Wave Mode */}
                      <td className="px-2 py-1.5" onClick={() => toggleExpand(detail.scanningDirection)}>
                        <span className="text-slate-300">{detail.waveMode}</span>
                      </td>

                      {/* Make */}
                      <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={detail.make || ""}
                          onChange={(e) => updateScanDetail(index, "make", e.target.value)}
                          className="h-7 text-xs px-1 bg-slate-800/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                          placeholder="OLYMPUS"
                        />
                      </td>

                      {/* Frequency */}
                      <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Select value={detail.frequency} onValueChange={(v) => updateScanDetail(index, "frequency", v)}>
                          <SelectTrigger className="h-7 text-xs px-1 w-full bg-slate-800/60 border-slate-600 text-slate-100">
                            <SelectValue placeholder="MHz" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {frequencyOptions.map((f) => (
                              <SelectItem key={f} value={f} className="text-xs text-slate-100">{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Size / Type */}
                      <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={detail.probe || ""}
                          onChange={(e) => updateScanDetail(index, "probe", e.target.value)}
                          className="h-7 text-xs px-1 bg-slate-800/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                          placeholder="10mm, Single"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={detail.remarkDetails || ""}
                          onChange={(e) => updateScanDetail(index, "remarkDetails", e.target.value)}
                          className="h-7 text-xs px-1 bg-slate-800/60 border-slate-600 text-slate-100 placeholder:text-slate-500"
                          placeholder="Notes..."
                        />
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedRow === detail.scanningDirection && renderExpandedDetails(detail, index)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
