/**
 * Smart Coverage Calculator Component
 * Calculate and visualize UT scan coverage
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  Lightbulb,
  Activity,
  Maximize2,
} from "lucide-react";
import type {
  CoverageInput,
  CoverageResult,
  ProbePreset,
  BeamType,
} from "@/types/coverage";
import { PROBE_PRESETS, MATERIAL_ACOUSTICS } from "@/types/coverage";
import {
  calculateCoverage,
  getRecommendedSettings,
  calculateNearField,
  calculateBeamDivergence,
} from "@/utils/coverageCalculator";

interface CoverageCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialThickness?: number;
  initialMaterial?: string;
  onApplySettings?: (settings: {
    scanIndex: number;
    overlap: number;
    frequency: number;
    diameter: number;
  }) => void;
}

export function CoverageCalculator({
  open,
  onOpenChange,
  initialThickness = 25,
  initialMaterial = "steel",
  onApplySettings,
}: CoverageCalculatorProps) {
  // Part configuration
  const [thickness, setThickness] = useState(initialThickness);
  const [width, setWidth] = useState(100);
  const [material, setMaterial] = useState(initialMaterial);

  // Probe configuration
  const [frequency, setFrequency] = useState(5);
  const [diameter, setDiameter] = useState(12.7);
  const [beamType, setBeamType] = useState<BeamType>("straight");
  const [focusDepth, setFocusDepth] = useState<number | undefined>();

  // Scan configuration
  const [scanIndex, setScanIndex] = useState(3);
  const [overlap, setOverlap] = useState(15);
  const [scanSpeed, setScanSpeed] = useState(100);
  const [waterPath, setWaterPath] = useState<number | undefined>();

  // Calculate coverage
  const result = useMemo<CoverageResult | null>(() => {
    const acoustics = MATERIAL_ACOUSTICS[material] || MATERIAL_ACOUSTICS.steel;

    const nearField = calculateNearField(diameter, frequency, acoustics.velocity);
    const beamDivergence = calculateBeamDivergence(diameter, frequency, acoustics.velocity);

    const input: CoverageInput = {
      partGeometry: "flat_plate",
      dimensions: { thickness, width },
      probe: {
        frequency,
        elementDiameter: diameter,
        nearField,
        beamDivergence,
        beamType,
        focusDepth,
      },
      scanIndex,
      overlap,
      scanSpeed,
      waterPath,
    };

    return calculateCoverage(input);
  }, [thickness, width, material, frequency, diameter, beamType, focusDepth, scanIndex, overlap, scanSpeed, waterPath]);

  // Get recommendations
  const recommendations = useMemo(() => {
    return getRecommendedSettings(thickness, material, 100);
  }, [thickness, material]);

  // Apply probe preset
  const applyPreset = useCallback((preset: ProbePreset) => {
    setFrequency(preset.frequency);
    setDiameter(preset.diameter);
    setBeamType(preset.beamType);
  }, []);

  // Apply recommended settings
  const applyRecommended = useCallback(() => {
    setFrequency(recommendations.recommendedFrequency);
    setDiameter(recommendations.recommendedDiameter);
    setScanIndex(recommendations.recommendedIndex);
    setOverlap(recommendations.recommendedOverlap);
  }, [recommendations]);

  // Handle apply to main form
  const handleApply = useCallback(() => {
    onApplySettings?.({
      scanIndex,
      overlap,
      frequency,
      diameter,
    });
    onOpenChange(false);
  }, [scanIndex, overlap, frequency, diameter, onApplySettings, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Coverage Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate optimal scan parameters for complete inspection coverage
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="setup" className="p-4 space-y-6">
              {/* Part Configuration */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  Part Configuration
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thickness">Thickness (mm)</Label>
                    <Input
                      id="thickness"
                      type="number"
                      value={thickness}
                      onChange={(e) => setThickness(parseFloat(e.target.value) || 1)}
                      min={1}
                      max={500}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                      min={1}
                      max={2000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger id="material">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(MATERIAL_ACOUSTICS).filter(m => m !== "water").map((m) => (
                          <SelectItem key={m} value={m}>
                            {m.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Probe Presets */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  Probe Presets
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PROBE_PRESETS.slice(0, 4).map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className={
                        preset.frequency === frequency && preset.diameter === diameter
                          ? "border-primary"
                          : ""
                      }
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Probe Configuration */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Probe Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency (MHz)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      value={frequency}
                      onChange={(e) => setFrequency(parseFloat(e.target.value) || 1)}
                      min={0.5}
                      max={25}
                      step={0.25}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diameter">Element Diameter (mm)</Label>
                    <Input
                      id="diameter"
                      type="number"
                      value={diameter}
                      onChange={(e) => setDiameter(parseFloat(e.target.value) || 1)}
                      min={3}
                      max={50}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waterPath">Water Path (mm)</Label>
                    <Input
                      id="waterPath"
                      type="number"
                      value={waterPath || ""}
                      onChange={(e) => setWaterPath(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Contact mode"
                      min={5}
                      max={150}
                    />
                  </div>
                </div>
              </div>

              {/* Scan Parameters */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Scan Parameters</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="scanIndex">Scan Index: {scanIndex.toFixed(1)} mm</Label>
                      <span className="text-xs text-muted-foreground">
                        Optimal: {recommendations.recommendedIndex} mm
                      </span>
                    </div>
                    <Slider
                      id="scanIndex"
                      value={[scanIndex]}
                      onValueChange={([v]) => setScanIndex(v)}
                      min={0.5}
                      max={20}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="overlap">Overlap: {overlap}%</Label>
                      <span className="text-xs text-muted-foreground">
                        Recommended: {recommendations.recommendedOverlap}%
                      </span>
                    </div>
                    <Slider
                      id="overlap"
                      value={[overlap]}
                      onValueChange={([v]) => setOverlap(v)}
                      min={0}
                      max={60}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scanSpeed">Scan Speed: {scanSpeed} mm/s</Label>
                    <Slider
                      id="scanSpeed"
                      value={[scanSpeed]}
                      onValueChange={([v]) => setScanSpeed(v)}
                      min={10}
                      max={500}
                      step={10}
                    />
                  </div>
                </div>
              </div>

              {/* Apply Recommended */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button variant="outline" onClick={applyRecommended}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Apply Recommended Settings
                </Button>
                {onApplySettings && (
                  <Button onClick={handleApply}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Apply to Technique Sheet
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="p-4 space-y-6">
              {result && (
                <>
                  {/* Coverage Summary */}
                  <div className={`p-4 rounded-lg border ${
                    result.overallCoverage >= 100
                      ? "bg-green-500/10 border-green-500/30"
                      : result.overallCoverage >= 90
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.overallCoverage >= 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-medium">
                          {result.overallCoverage >= 100 ? "Full Coverage Achieved" : "Coverage Gap Detected"}
                        </span>
                      </div>
                      <Badge variant={result.overallCoverage >= 100 ? "default" : "secondary"}>
                        {result.overallCoverage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Overall Coverage</p>
                      <p className="text-2xl font-bold">{result.overallCoverage.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Effective Coverage</p>
                      <p className="text-2xl font-bold">{result.effectiveCoverage.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Scan Passes</p>
                      <p className="text-2xl font-bold">{result.numPasses}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Optimal Index</p>
                      <p className="text-2xl font-bold">{result.optimalIndex.toFixed(1)} mm</p>
                    </div>
                  </div>

                  {/* Dead Zones */}
                  {result.deadZones.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">Dead Zones</h3>
                      <div className="space-y-2">
                        {result.deadZones.map((dz, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {dz.type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dz.startDepth.toFixed(1)} - {dz.endDepth.toFixed(1)} mm: {dz.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Warnings
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {result.warnings.map((w, i) => (
                          <li key={i} className="text-yellow-700 dark:text-yellow-300">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Recommendations
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="text-blue-700 dark:text-blue-300">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Beam Profiles */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Beam Profile at Depth
                    </h3>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="font-medium">Depth (mm)</div>
                      <div className="font-medium">Beam Ø (mm)</div>
                      <div className="font-medium">Sensitivity</div>
                      <div className="font-medium">Zone</div>
                      {result.beamProfileAtDepths.slice(0, 8).map((bp, i) => (
                        <React.Fragment key={i}>
                          <div>{bp.depth.toFixed(1)}</div>
                          <div>{bp.beamDiameter.toFixed(1)}</div>
                          <div>{(bp.sensitivity * 100).toFixed(0)}%</div>
                          <div>
                            <Badge variant={bp.inNearField ? "secondary" : "outline"} className="text-xs">
                              {bp.inNearField ? "Near Field" : "Far Field"}
                            </Badge>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="heatmap" className="p-4">
              {result && <CoverageHeatmap data={result.heatmapData} thickness={thickness} width={width} />}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Heatmap visualization component
function CoverageHeatmap({
  data,
  thickness,
  width,
}: {
  data: number[][];
  thickness: number;
  width: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const height = data.length;
    const widthPx = data[0].length;

    // Scale to fit
    const scale = Math.min(400 / widthPx, 200 / height);
    canvas.width = widthPx * scale;
    canvas.height = height * scale;

    // Draw heatmap
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < widthPx; x++) {
        const value = data[y][x];

        // Color gradient: red (low) -> yellow (mid) -> green (high)
        let r, g, b;
        if (value < 0.5) {
          // Red to yellow
          r = 255;
          g = Math.floor(255 * (value * 2));
          b = 0;
        } else {
          // Yellow to green
          r = Math.floor(255 * ((1 - value) * 2));
          g = 255;
          b = 0;
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    // Vertical lines every 10mm
    for (let x = 0; x <= width; x += 10) {
      const px = (x / width) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines every 5mm
    for (let y = 0; y <= thickness; y += 5) {
      const py = (y / thickness) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }
  }, [data, thickness, width]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Coverage Heatmap</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Full</span>
          </div>
        </div>
      </div>

      <div className="relative border rounded-lg p-4 bg-muted/30">
        <canvas
          ref={canvasRef}
          className="mx-auto"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground origin-center whitespace-nowrap">
          Depth ({thickness}mm)
        </div>
        <div className="text-center text-xs text-muted-foreground mt-2">
          Width ({width}mm)
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Green indicates full coverage, yellow partial, red indicates coverage gaps.
        Grid shows 10mm horizontal and 5mm vertical intervals.
      </p>
    </div>
  );
}
