/**
 * Digital Twin Viewer Component
 * 2D/3D visualization of part with mapped indications
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Box,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  DigitalTwinState,
  MappedIndication,
  IndicationSeverity,
} from "@/types/digitalTwin";
import {
  filterIndications,
  getIndicationColor,
  formatLocation,
  exportTwinData,
  parseIndicationCSV,
  importIndications,
  generateSampleTwin,
} from "@/utils/digitalTwinUtils";
import { useToast } from "@/hooks/use-toast";

interface DigitalTwinViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialState?: DigitalTwinState;
  onStateChange?: (state: DigitalTwinState) => void;
}

export function DigitalTwinViewer({
  open,
  onOpenChange,
  initialState,
  onStateChange,
}: DigitalTwinViewerProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [twinState, setTwinState] = useState<DigitalTwinState>(
    initialState || generateSampleTwin()
  );
  const [selectedIndication, setSelectedIndication] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Update parent
  useEffect(() => {
    onStateChange?.(twinState);
  }, [twinState, onStateChange]);

  // Filtered indications
  const visibleIndications = useMemo(
    () => filterIndications(twinState.indications, twinState.viewSettings),
    [twinState.indications, twinState.viewSettings]
  );

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { boundingBox, viewSettings } = twinState;
    const width = boundingBox.max.x - boundingBox.min.x;
    const height = boundingBox.max.y - boundingBox.min.y;

    // Set canvas size
    const scale = Math.min(
      (canvas.clientWidth - 40) / width,
      (canvas.clientHeight - 40) / height
    ) * zoom;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Clear
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Transform
    ctx.save();
    ctx.translate(
      canvas.width / 2 + pan.x,
      canvas.height / 2 + pan.y
    );
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Draw part outline
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1 / scale;
    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw indications
    if (viewSettings.showIndications) {
      for (const ind of visibleIndications) {
        const x = ind.location.position.x - boundingBox.min.x;
        const y = ind.location.position.y - boundingBox.min.y;
        const color = getIndicationColor(ind, viewSettings);
        const isSelected = ind.id === selectedIndication;

        // Size based on amplitude
        const baseSize = 4 * viewSettings.indicationScale;
        const size = baseSize + (ind.amplitude / 100) * baseSize;

        // Draw indication marker
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fill();

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    // Draw legend
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText(`Part: ${twinState.partNumber}`, 10, 20);
    ctx.fillText(`Indications: ${visibleIndications.length}`, 10, 36);
    ctx.fillText(`Zoom: ${(zoom * 100).toFixed(0)}%`, 10, 52);

  }, [twinState, visibleIndications, selectedIndication, zoom, pan]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { boundingBox } = twinState;
    const width = boundingBox.max.x - boundingBox.min.x;
    const height = boundingBox.max.y - boundingBox.min.y;

    const scale = Math.min(
      (canvas.clientWidth - 40) / width,
      (canvas.clientHeight - 40) / height
    ) * zoom;

    // Convert click to part coordinates
    const partX = (clickX - canvas.width / 2 - pan.x) / scale + width / 2 + boundingBox.min.x;
    const partY = (clickY - canvas.height / 2 - pan.y) / scale + height / 2 + boundingBox.min.y;

    // Find nearest indication
    let nearest: MappedIndication | null = null;
    let nearestDist = Infinity;
    const threshold = 10 / scale;

    for (const ind of visibleIndications) {
      const dx = ind.location.position.x - partX;
      const dy = ind.location.position.y - partY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist && dist < threshold) {
        nearest = ind;
        nearestDist = dist;
      }
    }

    setSelectedIndication(nearest?.id || null);
  }, [twinState, visibleIndications, zoom, pan]);

  // Toggle severity filter
  const toggleSeverityFilter = useCallback((severity: IndicationSeverity) => {
    setTwinState((prev) => {
      const current = prev.viewSettings.severityFilter;
      const updated = current.includes(severity)
        ? current.filter((s) => s !== severity)
        : [...current, severity];
      return {
        ...prev,
        viewSettings: { ...prev.viewSettings, severityFilter: updated },
      };
    });
  }, []);

  // Export data
  const handleExport = useCallback(() => {
    const data = exportTwinData(twinState);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${twinState.partNumber}_twin_export.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: "Twin data exported successfully" });
  }, [twinState, toast]);

  // Import CSV
  const handleImportCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const imports = parseIndicationCSV(text);

      if (imports.length > 0) {
        setTwinState((prev) => importIndications(prev, imports));
        toast({
          title: "Import Complete",
          description: `Imported ${imports.length} indications`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No valid indications found in CSV",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  // Get selected indication details
  const selectedInd = useMemo(
    () => twinState.indications.find((i) => i.id === selectedIndication),
    [twinState.indications, selectedIndication]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Digital Twin Viewer
            <Badge variant="outline">{twinState.partNumber}</Badge>
          </DialogTitle>
          <DialogDescription>
            Interactive visualization of inspection indications mapped to part geometry
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z / 1.2, 0.2))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
              </label>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Canvas */}
            <div className="flex-1 border rounded-lg overflow-hidden bg-[#1a1a2e]">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair"
                style={{ minHeight: 300 }}
              />
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Acceptable: {twinState.stats.acceptableCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Recordable: {twinState.stats.recordableCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Rejectable: {twinState.stats.rejectableCount}</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 flex flex-col border-l pl-4">
            <Tabs defaultValue="filter" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-2">
                <TabsContent value="filter" className="space-y-4">
                  {/* Severity Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Severity Filter</Label>
                    <div className="space-y-2">
                      {(["acceptable", "recordable", "rejectable"] as IndicationSeverity[]).map(
                        (sev) => (
                          <div key={sev} className="flex items-center gap-2">
                            <Checkbox
                              id={`filter-${sev}`}
                              checked={twinState.viewSettings.severityFilter.includes(sev)}
                              onCheckedChange={() => toggleSeverityFilter(sev)}
                            />
                            <Label
                              htmlFor={`filter-${sev}`}
                              className="text-sm cursor-pointer capitalize"
                            >
                              {sev}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Indication Scale */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Marker Scale: {twinState.viewSettings.indicationScale.toFixed(1)}x
                    </Label>
                    <Slider
                      value={[twinState.viewSettings.indicationScale]}
                      onValueChange={([v]) =>
                        setTwinState((prev) => ({
                          ...prev,
                          viewSettings: { ...prev.viewSettings, indicationScale: v },
                        }))
                      }
                      min={0.5}
                      max={3}
                      step={0.1}
                    />
                  </div>

                  {/* Amplitude Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Amplitude</Label>
                    <Slider
                      value={[twinState.viewSettings.minAmplitude ?? 0]}
                      onValueChange={([v]) =>
                        setTwinState((prev) => ({
                          ...prev,
                          viewSettings: { ...prev.viewSettings, minAmplitude: v || undefined },
                        }))
                      }
                      min={0}
                      max={200}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {twinState.viewSettings.minAmplitude ?? 0}% DAC
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {selectedInd ? (
                    <div className="space-y-4">
                      <div className={`p-3 rounded-lg ${
                        selectedInd.severity === "rejectable"
                          ? "bg-red-500/10 border border-red-500/30"
                          : selectedInd.severity === "recordable"
                          ? "bg-yellow-500/10 border border-yellow-500/30"
                          : "bg-green-500/10 border border-green-500/30"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {selectedInd.severity === "rejectable" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : selectedInd.severity === "recordable" ? (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium capitalize">{selectedInd.severity}</span>
                        </div>
                        <p className="text-2xl font-bold">{selectedInd.amplitude}% DAC</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Location: </span>
                          <span>{formatLocation(selectedInd.location)}</span>
                        </div>
                        {selectedInd.defectType && (
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            <span className="capitalize">{selectedInd.defectType}</span>
                            {selectedInd.confidence && (
                              <span className="text-muted-foreground">
                                {" "}({selectedInd.confidence}%)
                              </span>
                            )}
                          </div>
                        )}
                        {selectedInd.notes && (
                          <div>
                            <span className="text-muted-foreground">Notes: </span>
                            <span>{selectedInd.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Crosshair className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Click an indication to view details</p>
                    </div>
                  )}

                  {/* Indication List */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">
                      All Indications ({visibleIndications.length})
                    </Label>
                    <div className="max-h-[200px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Amp</TableHead>
                            <TableHead>Location</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleIndications.slice(0, 20).map((ind) => (
                            <TableRow
                              key={ind.id}
                              className={`cursor-pointer ${
                                ind.id === selectedIndication ? "bg-muted" : ""
                              }`}
                              onClick={() => setSelectedIndication(ind.id)}
                            >
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    ind.severity === "rejectable"
                                      ? "text-red-500 border-red-500"
                                      : ind.severity === "recordable"
                                      ? "text-yellow-500 border-yellow-500"
                                      : "text-green-500 border-green-500"
                                  }
                                >
                                  {ind.amplitude}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {ind.location.position.x.toFixed(0)}, {ind.location.position.y.toFixed(0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
