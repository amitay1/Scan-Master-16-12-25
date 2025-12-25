import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanPlanningData, ScanDirection, CoverageParameters } from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { TechnicalDrawingTab } from "@/components/tabs/TechnicalDrawingTab";
import { RealTimeTechnicalDrawing } from "@/components/RealTimeTechnicalDrawing";
import { Plus, Trash2, Edit, Eye, Grid, Move, Maximize2, Settings, Download, Upload, Target, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ScanPlanningTabProps {
  data: ScanPlanningData;
  onChange: (data: ScanPlanningData) => void;
  partType: string;
  dimensions: {
    thickness: number;
    length: number;
    width: number;
    diameter?: number;
    innerDiameter?: number;
    wallThickness?: number;
  };
  material?: string;
}

const waveModes = [
  { value: "Longitudinal", label: "Longitudinal (L-Wave)", color: "#3b82f6" },
  { value: "Shear", label: "Shear (S-Wave)", color: "#ef4444" },
  { value: "Surface", label: "Surface (R-Wave)", color: "#10b981" },
];

const scanDirectionTypes = [
  { value: "axial", label: "Axial", icon: "↕" },
  { value: "circumferential", label: "Circumferential", icon: "⟲" },
  { value: "radial", label: "Radial", icon: "✦" },
  { value: "perpendicular", label: "Perpendicular", icon: "⊥" },
  { value: "parallel", label: "Parallel", icon: "∥" },
  { value: "diagonal", label: "Diagonal", icon: "⤡" },
  { value: "spiral", label: "Spiral", icon: "🌀" },
];

const probeAngles = [0, 45, 60, 70];

const coverageMethods = [
  { value: "raster", label: "Raster Scan" },
  { value: "sector", label: "Sector Scan" },
  { value: "linear", label: "Linear Scan" },
  { value: "compound", label: "Compound Scan" },
];

export const ScanPlanningTab = ({
  data,
  onChange,
  partType,
  dimensions,
  material = "steel"
}: ScanPlanningTabProps) => {
  const [activeSection, setActiveSection] = useState("drawing");
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [editingScan, setEditingScan] = useState<ScanDirection | null>(null);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const drawingRef = useRef<HTMLDivElement>(null);

  const updateField = (field: keyof ScanPlanningData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addOrUpdateScan = (scan: ScanDirection) => {
    const scans = [...(data.scanDirections || [])];
    if (editingScan) {
      const index = scans.findIndex(s => s.id === editingScan.id);
      if (index !== -1) {
        scans[index] = scan;
      }
    } else {
      scans.push({ ...scan, id: `scan-${Date.now()}` });
    }
    updateField("scanDirections", scans);
    setShowScanDialog(false);
    setEditingScan(null);
  };

  const deleteScan = (id: string) => {
    const scans = data.scanDirections?.filter(s => s.id !== id) || [];
    updateField("scanDirections", scans);
    if (selectedScan === id) {
      setSelectedScan(null);
    }
  };

  const toggleScanVisibility = (id: string) => {
    const scans = data.scanDirections?.map(s =>
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    ) || [];
    updateField("scanDirections", scans);
  };

  const calculateTotalCoverage = () => {
    if (!data.coverage) return 0;
    return Math.round((data.coverage.coveredArea / data.coverage.totalArea) * 100);
  };

  const exportScanPlan = () => {
    // Export scan plan as JSON
    const exportData = {
      scanDirections: data.scanDirections,
      coverage: data.coverage,
      scanSpeed: data.scanSpeed,
      scanIndex: data.scanIndex,
      overlapPercentage: data.overlapPercentage,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scan-plan.json';
    a.click();
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "drawing" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("drawing")}
            className="flex items-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Technical Drawing
          </Button>
          <Button
            variant={activeSection === "directions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("directions")}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Scan Directions
          </Button>
          <Button
            variant={activeSection === "coverage" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("coverage")}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Coverage
          </Button>
          <Button
            variant={activeSection === "parameters" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("parameters")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Parameters
          </Button>
          <Button
            variant={activeSection === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("grid")}
            className="flex items-center gap-2"
          >
            <Grid className="w-4 h-4" />
            Grid Mapping
          </Button>
        </div>
      </div>

      {/* Technical Drawing with Scan Overlays */}
      {activeSection === "drawing" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Technical Drawing with Scan Coverage</CardTitle>
                <CardDescription>Visual representation of part with scan directions overlay</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportScanPlan}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Plan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={drawingRef} className="border rounded-lg p-4 bg-muted/10">
              {/* Real-time technical drawing with scan overlays */}
              <RealTimeTechnicalDrawing
                partType={partType}
                dimensions={dimensions}
                scanDirections={data.scanDirections}
                selectedScanId={selectedScan}
                onScanSelect={setSelectedScan}
                showGrid={data.gridMapping ? true : false}
                gridSize={data.gridMapping?.gridSize}
              />
            </div>

            {/* Legend */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-2">Scan Legend</Label>
              <div className="flex flex-wrap gap-4">
                {waveModes.map((mode) => (
                  <div key={mode.value} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: mode.color }}
                    />
                    <span className="text-sm">{mode.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Directions */}
      {activeSection === "directions" && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Directions Configuration</CardTitle>
            <CardDescription>Define scan patterns and wave modes</CardDescription>
            <Button onClick={() => setShowScanDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Scan Direction
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Wave Mode</TableHead>
                  <TableHead>Angle</TableHead>
                  <TableHead>Coverage %</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scanDirections?.map((scan) => (
                  <TableRow
                    key={scan.id}
                    className={cn(
                      "cursor-pointer",
                      selectedScan === scan.id && "bg-muted"
                    )}
                    onClick={() => setSelectedScan(scan.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {scanDirectionTypes.find(t => t.value === scan.direction)?.icon}
                        </span>
                        <span>{scan.direction}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ borderColor: scan.color }}
                      >
                        {scan.waveMode}
                      </Badge>
                    </TableCell>
                    <TableCell>{scan.probeAngle}°</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${scan.coverage}%`,
                              backgroundColor: scan.color
                            }}
                          />
                        </div>
                        <span className="text-sm">{scan.coverage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: scan.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={scan.isVisible ? "default" : "ghost"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleScanVisibility(scan.id);
                        }}
                      >
                        <Eye className={cn("w-4 h-4", !scan.isVisible && "opacity-50")} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingScan(scan);
                            setShowScanDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScan(scan.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.scanDirections || data.scanDirections.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No scan directions configured. Click "Add Scan Direction" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Coverage Analysis */}
      {activeSection === "coverage" && (
        <Card>
          <CardHeader>
            <CardTitle>Coverage Analysis</CardTitle>
            <CardDescription>Scan coverage parameters and critical zones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Coverage */}
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <Label>Overall Coverage</Label>
                <Badge variant="outline" className="text-lg">
                  {calculateTotalCoverage()}%
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FieldWithHelp
                    label="Coverage Method"
                    help="Scan pattern methodology"
                  >
                    <Select
                      value={data.coverage?.method || "raster"}
                      onValueChange={(value) => updateField('coverage', {...data.coverage, method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageMethods.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWithHelp>

                  <FieldWithHelp
                    label="Total Area (mm²)"
                    help="Total surface area to scan"
                  >
                    <Input
                      type="number"
                      value={data.coverage?.totalArea || 0}
                      onChange={(e) => updateField('coverage', {...data.coverage, totalArea: parseFloat(e.target.value)})}
                      step="10"
                    />
                  </FieldWithHelp>

                  <FieldWithHelp
                    label="Covered Area (mm²)"
                    help="Area covered by scan plan"
                  >
                    <Input
                      type="number"
                      value={data.coverage?.coveredArea || 0}
                      onChange={(e) => updateField('coverage', {...data.coverage, coveredArea: parseFloat(e.target.value)})}
                      step="10"
                    />
                  </FieldWithHelp>
                </div>
              </div>
            </div>

            {/* Critical Zones */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Critical Zones</Label>
                <Button
                  size="sm"
                  onClick={() => {
                    const zones = [...(data.coverage?.criticalZones || [])];
                    zones.push({
                      id: `zone-${Date.now()}`,
                      location: "Zone " + (zones.length + 1),
                      area: 100,
                      requiredCoverage: 100,
                      actualCoverage: 0,
                    });
                    updateField('coverage', {...data.coverage, criticalZones: zones});
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Zone
                </Button>
              </div>

              <div className="space-y-2">
                {data.coverage?.criticalZones?.map((zone, index) => (
                  <Card key={zone.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-5 gap-4 items-end">
                        <div>
                          <Label className="text-sm">Location</Label>
                          <Input
                            value={zone.location}
                            onChange={(e) => {
                              const zones = [...(data.coverage?.criticalZones || [])];
                              zones[index] = {...zone, location: e.target.value};
                              updateField('coverage', {...data.coverage, criticalZones: zones});
                            }}
                            placeholder="e.g., Weld Zone 1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Area (mm²)</Label>
                          <Input
                            type="number"
                            value={zone.area}
                            onChange={(e) => {
                              const zones = [...(data.coverage?.criticalZones || [])];
                              zones[index] = {...zone, area: parseFloat(e.target.value)};
                              updateField('coverage', {...data.coverage, criticalZones: zones});
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Required %</Label>
                          <Input
                            type="number"
                            value={zone.requiredCoverage}
                            onChange={(e) => {
                              const zones = [...(data.coverage?.criticalZones || [])];
                              zones[index] = {...zone, requiredCoverage: parseFloat(e.target.value)};
                              updateField('coverage', {...data.coverage, criticalZones: zones});
                            }}
                            max="100"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Actual %</Label>
                          <Input
                            type="number"
                            value={zone.actualCoverage}
                            onChange={(e) => {
                              const zones = [...(data.coverage?.criticalZones || [])];
                              zones[index] = {...zone, actualCoverage: parseFloat(e.target.value)};
                              updateField('coverage', {...data.coverage, criticalZones: zones});
                            }}
                            max="100"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const zones = data.coverage?.criticalZones?.filter((_, i) => i !== index) || [];
                            updateField('coverage', {...data.coverage, criticalZones: zones});
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Coverage Status:</span>
                          <Badge
                            variant={zone.actualCoverage >= zone.requiredCoverage ? "default" : "destructive"}
                          >
                            {zone.actualCoverage >= zone.requiredCoverage ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Parameters */}
      {activeSection === "parameters" && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Parameters</CardTitle>
            <CardDescription>Speed, index, and overlap settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FieldWithHelp
                label="Scan Speed (mm/s)"
                help="Maximum scanning velocity"
              >
                <div className="space-y-2">
                  <Slider
                    value={[data.scanSpeed || 100]}
                    onValueChange={([value]) => updateField('scanSpeed', value)}
                    min={10}
                    max={500}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 mm/s</span>
                    <span className="font-medium">{data.scanSpeed || 100} mm/s</span>
                    <span>500 mm/s</span>
                  </div>
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Scan Index (mm)"
                help="Distance between scan lines"
              >
                <div className="space-y-2">
                  <Slider
                    value={[data.scanIndex || 5]}
                    onValueChange={([value]) => updateField('scanIndex', value)}
                    min={0.5}
                    max={20}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5 mm</span>
                    <span className="font-medium">{data.scanIndex || 5} mm</span>
                    <span>20 mm</span>
                  </div>
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Overlap Percentage (%)"
                help="Overlap between adjacent scan paths"
              >
                <div className="space-y-2">
                  <Slider
                    value={[data.overlapPercentage || 10]}
                    onValueChange={([value]) => updateField('overlapPercentage', value)}
                    min={0}
                    max={50}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{data.overlapPercentage || 10}%</span>
                    <span>50%</span>
                  </div>
                </div>
              </FieldWithHelp>
            </div>

            {/* Calculated Values */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-3">Calculated Parameters</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Effective Coverage Width</p>
                  <p className="text-lg font-medium">
                    {((data.scanIndex || 5) * (1 - (data.overlapPercentage || 10) / 100)).toFixed(1)} mm
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scan Time (per m²)</p>
                  <p className="text-lg font-medium">
                    {(1000000 / ((data.scanSpeed || 100) * (data.scanIndex || 5))).toFixed(1)} seconds
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Points per cm²</p>
                  <p className="text-lg font-medium">
                    {(100 / (data.scanIndex || 5)).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Mapping */}
      {activeSection === "grid" && (
        <Card>
          <CardHeader>
            <CardTitle>Grid Mapping</CardTitle>
            <CardDescription>Define inspection grid for systematic coverage</CardDescription>
            <Button
              onClick={() => setShowGridSettings(true)}
              size="sm"
              className="w-fit"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure Grid
            </Button>
          </CardHeader>
          <CardContent>
            {data.gridMapping ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Grid Size</Label>
                    <p className="font-medium">{data.gridMapping.gridSize.x} × {data.gridMapping.gridSize.y}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Cell Size</Label>
                    <p className="font-medium">{data.gridMapping.cellSize} mm</p>
                  </div>
                  <div>
                    <Label className="text-sm">Total Cells</Label>
                    <p className="font-medium">{data.gridMapping.gridSize.x * data.gridMapping.gridSize.y}</p>
                  </div>
                </div>

                {/* Grid Visualization */}
                <div className="border rounded-lg p-4 bg-muted/10">
                  <div className="grid gap-1" style={{
                    gridTemplateColumns: `repeat(${data.gridMapping.gridSize.x}, 1fr)`,
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    {Array.from({ length: data.gridMapping.gridSize.x * data.gridMapping.gridSize.y }).map((_, index) => {
                      const x = index % data.gridMapping!.gridSize.x;
                      const y = Math.floor(index / data.gridMapping!.gridSize.x);
                      const cell = data.gridMapping!.mappedCells?.find(c => c.position.x === x && c.position.y === y);
                      return (
                        <div
                          key={index}
                          className={cn(
                            "aspect-square border rounded-sm cursor-pointer transition-colors",
                            cell?.status === "scanned" && "bg-green-500",
                            cell?.status === "pending" && "bg-yellow-500",
                            cell?.status === "blocked" && "bg-red-500",
                            !cell && "bg-gray-100 hover:bg-gray-200"
                          )}
                          onClick={() => {
                            const cells = [...(data.gridMapping?.mappedCells || [])];
                            const existingIndex = cells.findIndex(c => c.position.x === x && c.position.y === y);
                            if (existingIndex !== -1) {
                              // Cycle through statuses
                              const statuses: Array<"scanned" | "pending" | "blocked"> = ["scanned", "pending", "blocked"];
                              const currentStatus = cells[existingIndex].status;
                              const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
                              cells[existingIndex].status = statuses[nextIndex];
                            } else {
                              cells.push({
                                id: `cell-${x}-${y}`,
                                position: { x, y },
                                status: "pending"
                              });
                            }
                            updateField('gridMapping', {...data.gridMapping, mappedCells: cells});
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Grid Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-sm" />
                    <span className="text-sm">Scanned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-sm" />
                    <span className="text-sm">Blocked</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No grid configured. Click "Configure Grid" to set up the inspection grid.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Direction Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScan ? "Edit" : "Add"} Scan Direction</DialogTitle>
            <DialogDescription>Configure scan parameters</DialogDescription>
          </DialogHeader>
          <ScanForm
            scan={editingScan}
            onSave={addOrUpdateScan}
            onCancel={() => {
              setShowScanDialog(false);
              setEditingScan(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Grid Settings Dialog */}
      <Dialog open={showGridSettings} onOpenChange={setShowGridSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Grid Mapping</DialogTitle>
            <DialogDescription>Set up inspection grid parameters</DialogDescription>
          </DialogHeader>
          <GridSettingsForm
            gridMapping={data.gridMapping}
            onSave={(gridMapping) => {
              updateField('gridMapping', gridMapping);
              setShowGridSettings(false);
            }}
            onCancel={() => setShowGridSettings(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Scan Form Component
const ScanForm = ({ scan, onSave, onCancel }: {
  scan: ScanDirection | null;
  onSave: (scan: ScanDirection) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<ScanDirection>>(scan || {
    direction: "axial",
    waveMode: "Longitudinal",
    probeAngle: 0,
    coverage: 100,
    isVisible: true,
    color: "#3b82f6",
  });

  const handleSubmit = () => {
    onSave({
      id: scan?.id || `scan-${Date.now()}`,
      direction: formData.direction || "axial",
      waveMode: formData.waveMode as ScanDirection["waveMode"] || "Longitudinal",
      probeAngle: formData.probeAngle || 0,
      coverage: formData.coverage || 100,
      isVisible: formData.isVisible !== false,
      color: formData.color || "#3b82f6",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Direction Type</Label>
          <Select value={formData.direction} onValueChange={(value) => setFormData({...formData, direction: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scanDirectionTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Wave Mode</Label>
          <Select
            value={formData.waveMode}
            onValueChange={(value) => setFormData({
              ...formData,
              waveMode: value as ScanDirection["waveMode"],
              color: waveModes.find(m => m.value === value)?.color || formData.color
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {waveModes.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Probe Angle (degrees)</Label>
          <Select
            value={String(formData.probeAngle)}
            onValueChange={(value) => setFormData({...formData, probeAngle: parseInt(value)})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {probeAngles.map(a => (
                <SelectItem key={a} value={String(a)}>{a}°</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Coverage (%)</Label>
          <Input
            type="number"
            value={formData.coverage}
            onChange={(e) => setFormData({...formData, coverage: parseInt(e.target.value)})}
            min="0"
            max="100"
          />
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              className="w-20"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isVisible"
            checked={formData.isVisible}
            onChange={(e) => setFormData({...formData, isVisible: e.target.checked})}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isVisible">Visible on drawing</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Scan</Button>
      </div>
    </div>
  );
};

// Grid Settings Form Component
const GridSettingsForm = ({ gridMapping, onSave, onCancel }: {
  gridMapping: any;
  onSave: (gridMapping: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(gridMapping || {
    gridSize: { x: 10, y: 10 },
    cellSize: 10,
    mappedCells: [],
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Grid Width (cells)</Label>
          <Input
            type="number"
            value={formData.gridSize.x}
            onChange={(e) => setFormData({
              ...formData,
              gridSize: { ...formData.gridSize, x: parseInt(e.target.value) }
            })}
            min="1"
            max="50"
          />
        </div>

        <div>
          <Label>Grid Height (cells)</Label>
          <Input
            type="number"
            value={formData.gridSize.y}
            onChange={(e) => setFormData({
              ...formData,
              gridSize: { ...formData.gridSize, y: parseInt(e.target.value) }
            })}
            min="1"
            max="50"
          />
        </div>

        <div className="col-span-2">
          <Label>Cell Size (mm)</Label>
          <Input
            type="number"
            value={formData.cellSize}
            onChange={(e) => setFormData({...formData, cellSize: parseFloat(e.target.value)})}
            step="0.5"
            min="1"
          />
        </div>
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Total Grid Size: {formData.gridSize.x * formData.cellSize} mm × {formData.gridSize.y * formData.cellSize} mm
        </p>
        <p className="text-sm text-muted-foreground">
          Total Cells: {formData.gridSize.x * formData.gridSize.y}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Apply Grid</Button>
      </div>
    </div>
  );
};