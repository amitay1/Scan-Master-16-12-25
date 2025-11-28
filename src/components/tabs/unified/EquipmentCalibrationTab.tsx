import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentCalibrationData, ProbeDetail, CalibrationBlock, DACCurveData, ReferenceStandard } from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { CalibrationBlockViewer } from "@/components/CalibrationBlockViewer";
import { Plus, Trash2, Edit, Eye, Wrench, Cpu, TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EquipmentCalibrationTabProps {
  data: EquipmentCalibrationData;
  onChange: (data: EquipmentCalibrationData) => void;
  partThickness?: number;
  material?: string;
}

const probeTypes = [
  { value: "contact", label: "Contact (Normal)" },
  { value: "angle", label: "Angle Beam" },
  { value: "dual", label: "Dual Element" },
  { value: "immersion", label: "Immersion" },
  { value: "phased_array", label: "Phased Array" },
  { value: "tofd", label: "TOFD" },
];

const probeModes = [
  { value: "PE", label: "Pulse Echo (PE)" },
  { value: "SE", label: "Single Element (SE)" },
  { value: "TR", label: "Transmit-Receive (TR)" },
  { value: "TT", label: "Through-Transmission (TT)" },
];

const calibrationBlockTypes = [
  { value: "IIW-V1", label: "IIW Type 1 (V1)" },
  { value: "IIW-V2", label: "IIW Type 2 (V2)" },
  { value: "AWS-DSC", label: "AWS DSC Block" },
  { value: "ASME-Basic", label: "ASME Basic Calibration Block" },
  { value: "Custom", label: "Custom Block" },
];

const frequencies = ["2.25", "5.0", "10.0", "15.0", "20.0"];

const couplants = [
  "Water",
  "Glycerin",
  "Oil (Light Machine)",
  "Ultragel II",
  "Sonotech Soundsafe",
  "Propylene Glycol",
  "Cellulose Gel",
];

export const EquipmentCalibrationTab = ({ data, onChange, partThickness = 25, material = "steel" }: EquipmentCalibrationTabProps) => {
  const [activeSection, setActiveSection] = useState("equipment");
  const [showProbeDialog, setShowProbeDialog] = useState(false);
  const [editingProbe, setEditingProbe] = useState<ProbeDetail | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalibrationBlock | null>(null);
  const [showDACDialog, setShowDACDialog] = useState(false);

  const updateField = (field: keyof EquipmentCalibrationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addOrUpdateProbe = (probe: ProbeDetail) => {
    const probes = [...(data.probes || [])];
    if (editingProbe) {
      const index = probes.findIndex(p => p.id === editingProbe.id);
      if (index !== -1) {
        probes[index] = probe;
      }
    } else {
      probes.push({ ...probe, id: `probe-${Date.now()}` });
    }
    updateField("probes", probes);
    setShowProbeDialog(false);
    setEditingProbe(null);
  };

  const deleteProbe = (id: string) => {
    const probes = data.probes?.filter(p => p.id !== id) || [];
    updateField("probes", probes);
  };

  const addOrUpdateBlock = (block: CalibrationBlock) => {
    const blocks = [...(data.calibrationBlocks || [])];
    if (editingBlock) {
      const index = blocks.findIndex(b => b.id === editingBlock.id);
      if (index !== -1) {
        blocks[index] = block;
      }
    } else {
      blocks.push({ ...block, id: `block-${Date.now()}` });
    }
    updateField("calibrationBlocks", blocks);
    setShowBlockDialog(false);
    setEditingBlock(null);
  };

  const deleteBlock = (id: string) => {
    const blocks = data.calibrationBlocks?.filter(b => b.id !== id) || [];
    updateField("calibrationBlocks", blocks);
  };

  const addReferenceStandard = (standard: ReferenceStandard) => {
    const standards = [...(data.referenceStandards || []), standard];
    updateField("referenceStandards", standards);
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "equipment" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("equipment")}
            className="flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            UT Equipment
          </Button>
          <Button
            variant={activeSection === "probes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("probes")}
            className="flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Probes
          </Button>
          <Button
            variant={activeSection === "calibration" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("calibration")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Calibration Blocks
          </Button>
          <Button
            variant={activeSection === "dac" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("dac")}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            DAC/TCG
          </Button>
          <Button
            variant={activeSection === "standards" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("standards")}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Standards
          </Button>
        </div>
      </div>

      {/* UT Equipment */}
      {activeSection === "equipment" && (
        <Card>
          <CardHeader>
            <CardTitle>Ultrasonic Testing Equipment</CardTitle>
            <CardDescription>UT instrument specifications and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Manufacturer"
                help="Equipment manufacturer name"
              >
                <Input
                  value={data.manufacturer}
                  onChange={(e) => updateField('manufacturer', e.target.value)}
                  placeholder="e.g., Olympus, GE, Sonatest"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Model"
                help="Equipment model number"
              >
                <Input
                  value={data.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  placeholder="e.g., EPOCH 650, USM 36"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Serial Number"
                help="Unique equipment identifier"
              >
                <Input
                  value={data.serialNumber}
                  onChange={(e) => updateField('serialNumber', e.target.value)}
                  placeholder="e.g., SN-123456"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Calibration Due Date"
                help="Next calibration date for equipment"
              >
                <Input
                  type="date"
                  value={data.calibrationDueDate}
                  onChange={(e) => updateField('calibrationDueDate', e.target.value)}
                />
              </FieldWithHelp>
            </div>

            {/* Equipment Performance Verification */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Performance Verification</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Vertical Linearity</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={95}
                      className="w-20"
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Badge variant="outline" className="ml-auto">Pass</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Horizontal Linearity</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={98}
                      className="w-20"
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Badge variant="outline" className="ml-auto">Pass</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Resolution</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={1.5}
                      className="w-20"
                      readOnly
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                    <Badge variant="outline" className="ml-auto">Pass</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Probes */}
      {activeSection === "probes" && (
        <Card>
          <CardHeader>
            <CardTitle>Probe Details</CardTitle>
            <CardDescription>Ultrasonic probe specifications</CardDescription>
            <Button onClick={() => setShowProbeDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Probe
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Angle</TableHead>
                  <TableHead>Serial #</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Couplant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.probes?.map((probe) => (
                  <TableRow key={probe.id}>
                    <TableCell>{probe.type}</TableCell>
                    <TableCell>{probe.frequency} MHz</TableCell>
                    <TableCell>{probe.diameter}mm</TableCell>
                    <TableCell>{probe.angle ? `${probe.angle}°` : "-"}</TableCell>
                    <TableCell>{probe.serialNumber}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{probe.mode}</Badge>
                    </TableCell>
                    <TableCell>{probe.couplant}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProbe(probe);
                            setShowProbeDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProbe(probe.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.probes || data.probes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No probes added. Click "Add Probe" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Calibration Blocks */}
      {activeSection === "calibration" && (
        <Card>
          <CardHeader>
            <CardTitle>Calibration Blocks</CardTitle>
            <CardDescription>Reference blocks used for calibration</CardDescription>
            <Button onClick={() => setShowBlockDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Calibration Block
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.calibrationBlocks?.map((block) => (
                <Card key={block.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{block.name}</CardTitle>
                        <CardDescription>{block.type} - {block.standard}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingBlock(block);
                            setShowBlockDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBlock(block.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Material:</span>
                        <span>{block.material}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Thickness:</span>
                        <span>{block.thickness}mm</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Serial:</span>
                        <span>{block.serialNumber}</span>
                      </div>
                      {block.features && block.features.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {block.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature.type} - {feature.size}mm @ {feature.depth}mm
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3D Visualization Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          <Eye className="w-4 h-4 mr-2" />
                          View 3D Model
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{block.name} - 3D Visualization</DialogTitle>
                        </DialogHeader>
                        <div className="h-[400px]">
                          <CalibrationBlockViewer
                            blockType={block.type}
                            material={block.material}
                            thickness={block.thickness}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}

              {(!data.calibrationBlocks || data.calibrationBlocks.length === 0) && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No calibration blocks added. Click "Add Calibration Block" to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DAC/TCG Curves */}
      {activeSection === "dac" && (
        <Card>
          <CardHeader>
            <CardTitle>DAC/TCG Curves</CardTitle>
            <CardDescription>Distance Amplitude Correction and Time Corrected Gain curves</CardDescription>
            <Button onClick={() => setShowDACDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Generate DAC Curve
            </Button>
          </CardHeader>
          <CardContent>
            {data.dacCurves && data.dacCurves.length > 0 ? (
              <div className="space-y-4">
                {data.dacCurves.map((curve, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        DAC Curve {index + 1} - Probe: {data.probes?.find(p => p.id === curve.probeId)?.type || "Unknown"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-sm">Transfer Correction</Label>
                          <p className="font-medium">{curve.transferCorrection} dB</p>
                        </div>
                        <div>
                          <Label className="text-sm">Scan Gain</Label>
                          <p className="font-medium">{curve.scanGain} dB</p>
                        </div>
                        <div>
                          <Label className="text-sm">Reference Sensitivity</Label>
                          <p className="font-medium">{curve.referenceSensitivity} dB</p>
                        </div>
                      </div>
                      {/* Placeholder for actual DAC curve visualization */}
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">DAC Curve Visualization</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No DAC curves generated. Click "Generate DAC Curve" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reference Standards */}
      {activeSection === "standards" && (
        <Card>
          <CardHeader>
            <CardTitle>Reference Standards</CardTitle>
            <CardDescription>Applicable standards and specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {data.referenceStandards?.map((standard, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">{standard.standard}</p>
                        <p className="text-sm text-muted-foreground">{standard.description}</p>
                        <Badge variant="outline">{standard.applicableRange}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const standards = data.referenceStandards?.filter((_, i) => i !== index) || [];
                          updateField("referenceStandards", standards);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Common Standards Quick Add */}
            <div className="border-t pt-4">
              <Label className="text-sm mb-2">Quick Add Common Standards:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addReferenceStandard({
                    standard: "ASTM E114",
                    description: "Standard Practice for Ultrasonic Pulse-Echo Straight-Beam Contact Testing",
                    applicableRange: "All thicknesses"
                  })}
                >
                  ASTM E114
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addReferenceStandard({
                    standard: "ASME Section V",
                    description: "Boiler and Pressure Vessel Code - Nondestructive Examination",
                    applicableRange: "Pressure vessels"
                  })}
                >
                  ASME Sec. V
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addReferenceStandard({
                    standard: "AWS D1.1",
                    description: "Structural Welding Code - Steel",
                    applicableRange: "Welded joints"
                  })}
                >
                  AWS D1.1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addReferenceStandard({
                    standard: "ISO 16810",
                    description: "Non-destructive testing - Ultrasonic testing - General principles",
                    applicableRange: "General UT"
                  })}
                >
                  ISO 16810
                </Button>
              </div>
            </div>

            {/* Transfer Correction */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Transfer Correction</h4>
              <div className="grid grid-cols-2 gap-4">
                <FieldWithHelp
                  label="Correction Method"
                  help="Method used for transfer correction"
                >
                  <Select
                    value={data.transferCorrection?.method || ""}
                    onValueChange={(value) => updateField('transferCorrection', {...data.transferCorrection, method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comparative">Comparative</SelectItem>
                      <SelectItem value="calculated">Calculated</SelectItem>
                      <SelectItem value="empirical">Empirical</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithHelp>

                <FieldWithHelp
                  label="Correction Value (dB)"
                  help="Transfer correction value to apply"
                >
                  <Input
                    type="number"
                    value={data.transferCorrection?.correctionValue || 0}
                    onChange={(e) => updateField('transferCorrection', {...data.transferCorrection, correctionValue: parseFloat(e.target.value)})}
                    step="0.1"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Verification Block"
                  help="Block used for transfer verification"
                >
                  <Input
                    value={data.transferCorrection?.verificationBlock || ""}
                    onChange={(e) => updateField('transferCorrection', {...data.transferCorrection, verificationBlock: e.target.value})}
                    placeholder="e.g., Production sample"
                  />
                </FieldWithHelp>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Probe Dialog */}
      <Dialog open={showProbeDialog} onOpenChange={setShowProbeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProbe ? "Edit" : "Add"} Probe</DialogTitle>
            <DialogDescription>Enter probe specifications</DialogDescription>
          </DialogHeader>
          <ProbeForm
            probe={editingProbe}
            onSave={addOrUpdateProbe}
            onCancel={() => {
              setShowProbeDialog(false);
              setEditingProbe(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit" : "Add"} Calibration Block</DialogTitle>
            <DialogDescription>Enter calibration block details</DialogDescription>
          </DialogHeader>
          <BlockForm
            block={editingBlock}
            onSave={addOrUpdateBlock}
            onCancel={() => {
              setShowBlockDialog(false);
              setEditingBlock(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Probe Form Component
const ProbeForm = ({ probe, onSave, onCancel }: {
  probe: ProbeDetail | null;
  onSave: (probe: ProbeDetail) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<ProbeDetail>>(probe || {
    type: "contact",
    frequency: 5.0,
    diameter: 13,
    mode: "PE",
    couplant: "Ultragel II",
  });

  const handleSubmit = () => {
    onSave({
      id: probe?.id || `probe-${Date.now()}`,
      type: formData.type || "contact",
      frequency: formData.frequency || 5.0,
      diameter: formData.diameter || 13,
      serialNumber: formData.serialNumber || "",
      manufacturer: formData.manufacturer || "",
      couplant: formData.couplant || "Ultragel II",
      mode: formData.mode as ProbeDetail["mode"] || "PE",
      angle: formData.angle,
      wedgeAngle: formData.wedgeAngle,
      roofAngle: formData.roofAngle,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Probe Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {probeTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Frequency (MHz)</Label>
          <Select value={String(formData.frequency)} onValueChange={(value) => setFormData({...formData, frequency: parseFloat(value)})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map(f => (
                <SelectItem key={f} value={f}>{f} MHz</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Diameter (mm)</Label>
          <Input
            type="number"
            value={formData.diameter}
            onChange={(e) => setFormData({...formData, diameter: parseFloat(e.target.value)})}
            step="0.1"
          />
        </div>

        {formData.type === "angle" && (
          <div>
            <Label>Angle (degrees)</Label>
            <Input
              type="number"
              value={formData.angle}
              onChange={(e) => setFormData({...formData, angle: parseFloat(e.target.value)})}
              step="1"
            />
          </div>
        )}

        <div>
          <Label>Serial Number</Label>
          <Input
            value={formData.serialNumber}
            onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
            placeholder="e.g., P-12345"
          />
        </div>

        <div>
          <Label>Manufacturer</Label>
          <Input
            value={formData.manufacturer}
            onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
            placeholder="e.g., Olympus"
          />
        </div>

        <div>
          <Label>Mode</Label>
          <Select value={formData.mode} onValueChange={(value) => setFormData({...formData, mode: value as ProbeDetail["mode"]})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {probeModes.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Couplant</Label>
          <Select value={formData.couplant} onValueChange={(value) => setFormData({...formData, couplant: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {couplants.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Probe</Button>
      </div>
    </div>
  );
};

// Block Form Component
const BlockForm = ({ block, onSave, onCancel }: {
  block: CalibrationBlock | null;
  onSave: (block: CalibrationBlock) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<CalibrationBlock>>(block || {
    name: "",
    type: "IIW-V1",
    material: "Steel",
    thickness: 25,
    serialNumber: "",
    standard: "ISO 2400",
    features: [],
  });

  const handleSubmit = () => {
    onSave({
      id: block?.id || `block-${Date.now()}`,
      name: formData.name || "Calibration Block",
      type: formData.type || "IIW-V1",
      material: formData.material || "Steel",
      thickness: formData.thickness || 25,
      serialNumber: formData.serialNumber || "",
      standard: formData.standard || "ISO 2400",
      features: formData.features || [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Block Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., IIW Block #1"
          />
        </div>

        <div>
          <Label>Block Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {calibrationBlockTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Material</Label>
          <Input
            value={formData.material}
            onChange={(e) => setFormData({...formData, material: e.target.value})}
            placeholder="e.g., Carbon Steel"
          />
        </div>

        <div>
          <Label>Thickness (mm)</Label>
          <Input
            type="number"
            value={formData.thickness}
            onChange={(e) => setFormData({...formData, thickness: parseFloat(e.target.value)})}
            step="0.1"
          />
        </div>

        <div>
          <Label>Serial Number</Label>
          <Input
            value={formData.serialNumber}
            onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
            placeholder="e.g., CB-12345"
          />
        </div>

        <div>
          <Label>Standard</Label>
          <Input
            value={formData.standard}
            onChange={(e) => setFormData({...formData, standard: e.target.value})}
            placeholder="e.g., ISO 2400"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Block</Button>
      </div>
    </div>
  );
};