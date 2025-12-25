import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ProceduresStandardsData,
  SurfacePrepData,
  ProcedureStep,
  AcceptanceCriteriaData,
  ApplicableStandard,
  TransferProcedure,
  IndicationCriteria
} from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  BookOpen,
  Wrench,
  Calculator,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProceduresStandardsTabProps {
  data: ProceduresStandardsData;
  onChange: (data: ProceduresStandardsData) => void;
  material?: string;
  standard?: string;
  thickness?: number;
}

const surfacePrepMethods = [
  "Grinding",
  "Machining",
  "Sand Blasting",
  "Wire Brushing",
  "Chemical Cleaning",
  "Ultrasonic Cleaning",
  "As-Is (No Preparation)",
];

const cleaningMethods = [
  "Solvent Wipe",
  "Detergent Wash",
  "Alcohol Wipe",
  "Acetone Clean",
  "Degreasing",
  "Steam Cleaning",
];

// Surface roughness options with metric and imperial values per various standards
const roughnessRequirements = [
  { value: "Ra 1.6 µm (63 µin)", label: "Ra 1.6 µm (63 µin) - N7", standard: "precision" },
  { value: "Ra 3.2 µm (125 µin)", label: "Ra 3.2 µm (125 µin) - N8", standard: "high" },
  { value: "Ra 6.3 µm (250 µin)", label: "Ra 6.3 µm (250 µin) - N9 [AMS-STD-2154 Max]", standard: "AMS-STD-2154" },
  { value: "Ra 12.5 µm (500 µin)", label: "Ra 12.5 µm (500 µin) - N10", standard: "BS-EN-10228" },
  { value: "Ra 25 µm (1000 µin)", label: "Ra 25 µm (1000 µin) - N11", standard: "rough" },
  { value: "No Requirement", label: "No Requirement", standard: "none" },
];

// Standard-specific surface roughness limits per applicable UT standards
const standardRoughnessLimits: Record<string, { maxRa: number; maxMicroinch: number; description: string }> = {
  "AMS-STD-2154": { maxRa: 6.3, maxMicroinch: 250, description: "Per AMS-STD-2154 Section 5.4.6: Surface texture shall not be rougher than 250 microinches (6.3 µm)" },
  "ASTM-A388": { maxRa: 6.3, maxMicroinch: 250, description: "Per ASTM A388: Surface roughness shall not exceed 250 µin (6 µm)" },
  "BS-EN-10228-3": { maxRa: 12.5, maxMicroinch: 500, description: "Per BS EN 10228-3: Surface roughness Ra ≤ 12.5 µm" },
  "BS-EN-10228-4": { maxRa: 6.3, maxMicroinch: 250, description: "Per BS EN 10228-4: Surface roughness Ra ≤ 6.3 µm preferred" },
  "ASME": { maxRa: 6.3, maxMicroinch: 250, description: "Per ASME Section V: Surface finish suitable for UT examination" },
  "default": { maxRa: 6.3, maxMicroinch: 250, description: "General recommendation: Ra ≤ 6.3 µm (250 µin)" },
};

// Helper function to extract Ra value from roughness string
const extractRaValue = (roughnessStr: string): number => {
  const match = roughnessStr.match(/Ra\s*([\d.]+)\s*µm/);
  return match ? parseFloat(match[1]) : 0;
};

// Check if roughness exceeds standard limit
const isRoughnessExceeded = (roughnessStr: string, standardKey: string): boolean => {
  if (!roughnessStr || roughnessStr === "No Requirement") return false;
  const raValue = extractRaValue(roughnessStr);
  const limit = standardRoughnessLimits[standardKey] || standardRoughnessLimits["default"];
  return raValue > limit.maxRa;
};

// Get recommended roughness for a standard
const getRecommendedRoughness = (standardKey: string): string => {
  const limit = standardRoughnessLimits[standardKey] || standardRoughnessLimits["default"];
  const matching = roughnessRequirements.find(r => extractRaValue(r.value) === limit.maxRa);
  return matching?.value || "Ra 6.3 µm (250 µin)";
};

// Get standard key from standard name
const getStandardKey = (standardName: string): string => {
  const normalizedName = standardName.toUpperCase();
  if (normalizedName.includes("AMS") || normalizedName.includes("2154")) return "AMS-STD-2154";
  if (normalizedName.includes("A388") || normalizedName.includes("ASTM A388")) return "ASTM-A388";
  if (normalizedName.includes("10228-3")) return "BS-EN-10228-3";
  if (normalizedName.includes("10228-4")) return "BS-EN-10228-4";
  if (normalizedName.includes("ASME")) return "ASME";
  return "default";
};

const temperatureRanges = [
  "0°C to 50°C",
  "10°C to 40°C",
  "15°C to 35°C",
  "-10°C to 60°C",
  "Ambient",
];

const acceptanceClasses = [
  { value: "A", label: "Class A - Highest Quality" },
  { value: "B", label: "Class B - High Quality" },
  { value: "C", label: "Class C - Standard Quality" },
  { value: "D", label: "Class D - Basic Quality" },
];

const evaluationMethods = [
  "DAC Curve",
  "DGS Method",
  "AVG Method",
  "TCG",
  "Reference Block Comparison",
];

export const ProceduresStandardsTab = ({
  data,
  onChange,
  material = "steel",
  standard = "ASME",
  thickness = 25
}: ProceduresStandardsTabProps) => {
  const [activeSection, setActiveSection] = useState("surface");
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcedureStep | null>(null);
  const [showStandardDialog, setShowStandardDialog] = useState(false);
  const [showIndicationDialog, setShowIndicationDialog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const updateField = (field: keyof ProceduresStandardsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addOrUpdateStep = (step: ProcedureStep) => {
    const procedures = [...(data.procedures || [])];
    if (editingStep) {
      const index = procedures.findIndex(p => p.stepNumber === editingStep.stepNumber);
      if (index !== -1) {
        procedures[index] = step;
      }
    } else {
      step.stepNumber = procedures.length + 1;
      procedures.push(step);
    }
    // Re-number steps
    procedures.sort((a, b) => a.stepNumber - b.stepNumber);
    procedures.forEach((p, i) => p.stepNumber = i + 1);
    updateField("procedures", procedures);
    setShowStepDialog(false);
    setEditingStep(null);
  };

  const deleteStep = (stepNumber: number) => {
    const procedures = data.procedures?.filter(p => p.stepNumber !== stepNumber) || [];
    // Re-number remaining steps
    procedures.forEach((p, i) => p.stepNumber = i + 1);
    updateField("procedures", procedures);
  };

  const moveStep = (stepNumber: number, direction: "up" | "down") => {
    const procedures = [...(data.procedures || [])];
    const index = procedures.findIndex(p => p.stepNumber === stepNumber);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      [procedures[index - 1], procedures[index]] = [procedures[index], procedures[index - 1]];
    } else if (direction === "down" && index < procedures.length - 1) {
      [procedures[index], procedures[index + 1]] = [procedures[index + 1], procedures[index]];
    }

    procedures.forEach((p, i) => p.stepNumber = i + 1);
    updateField("procedures", procedures);
  };

  const toggleStepExpansion = (stepNumber: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(n => n !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const addStandard = (standard: ApplicableStandard) => {
    const standards = [...(data.applicableStandards || []), standard];
    updateField("applicableStandards", standards);
  };

  const removeStandard = (index: number) => {
    const standards = data.applicableStandards?.filter((_, i) => i !== index) || [];
    updateField("applicableStandards", standards);
  };

  const addIndication = (indication: IndicationCriteria) => {
    const indications = [...(data.acceptanceCriteria?.indications || []), indication];
    updateField("acceptanceCriteria", { ...data.acceptanceCriteria, indications });
    setShowIndicationDialog(false);
  };

  const removeIndication = (index: number) => {
    const indications = data.acceptanceCriteria?.indications?.filter((_, i) => i !== index) || [];
    updateField("acceptanceCriteria", { ...data.acceptanceCriteria, indications });
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "surface" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("surface")}
            className="flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Surface Prep
          </Button>
          <Button
            variant={activeSection === "procedures" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("procedures")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Procedures
          </Button>
          <Button
            variant={activeSection === "acceptance" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("acceptance")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Acceptance
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
          <Button
            variant={activeSection === "transfer" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("transfer")}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Surface Preparation */}
      {activeSection === "surface" && (
        <Card>
          <CardHeader>
            <CardTitle>Surface Preparation Requirements</CardTitle>
            <CardDescription>Specify surface condition and preparation methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Preparation Method"
                help="Method used to prepare the surface for inspection"
              >
                <Select
                  value={data.surfacePrep?.method || ""}
                  onValueChange={(value) => updateField('surfacePrep', {...data.surfacePrep, method: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {surfacePrepMethods.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Roughness Requirement"
                help="Maximum surface roughness allowed per standard"
              >
                <div className="flex gap-2">
                  <Select
                    value={data.surfacePrep?.roughnessRequirement || ""}
                    onValueChange={(value) => updateField('surfacePrep', {...data.surfacePrep, roughnessRequirement: value})}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select roughness" />
                    </SelectTrigger>
                    <SelectContent>
                      {roughnessRequirements.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Auto-fill per ${standard || 'default'} standard`}
                    onClick={() => {
                      const recommended = getRecommendedRoughness(getStandardKey(standard));
                      updateField('surfacePrep', {...data.surfacePrep, roughnessRequirement: recommended});
                    }}
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </div>
              </FieldWithHelp>

              {/* Surface Roughness Warning - AMS-STD-2154 Compliance */}
              {data.surfacePrep?.roughnessRequirement &&
               data.surfacePrep.roughnessRequirement !== "No Requirement" &&
               isRoughnessExceeded(data.surfacePrep.roughnessRequirement, getStandardKey(standard)) && (
                <div className="col-span-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Surface Roughness Exceeds Standard Limit
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {standardRoughnessLimits[getStandardKey(standard)]?.description ||
                         standardRoughnessLimits["default"].description}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Recommended: {getRecommendedRoughness(getStandardKey(standard))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <FieldWithHelp
                label="Cleaning Method"
                help="Method used to clean the surface"
              >
                <Select
                  value={data.surfacePrep?.cleaningMethod || ""}
                  onValueChange={(value) => updateField('surfacePrep', {...data.surfacePrep, cleaningMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cleaning" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaningMethods.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Couplant Type"
                help="Type of couplant to be used"
              >
                <Input
                  value={data.surfacePrep?.couplantType || ""}
                  onChange={(e) => updateField('surfacePrep', {...data.surfacePrep, couplantType: e.target.value})}
                  placeholder="e.g., Ultragel II"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Temperature Range"
                help="Acceptable temperature range for inspection"
              >
                <Select
                  value={data.surfacePrep?.temperatureRange || ""}
                  onValueChange={(value) => updateField('surfacePrep', {...data.surfacePrep, temperatureRange: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {temperatureRanges.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>
            </div>

            {/* Important Notes */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <Label className="text-sm font-medium">Important Notes</Label>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ensure surface is free from scale, paint, dirt, and loose material</li>
                <li>• Surface temperature should be within specified range</li>
                <li>• Apply couplant uniformly to ensure good acoustic coupling</li>
                <li>• Mark reference points before surface preparation if needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Procedures */}
      {activeSection === "procedures" && (
        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Inspection Procedures</CardTitle>
            <CardDescription>Detailed procedural steps for the inspection</CardDescription>
            <Button onClick={() => setShowStepDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            {data.procedures && data.procedures.length > 0 ? (
              <div className="space-y-2">
                {data.procedures.map((step) => (
                  <Card key={step.stepNumber}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                              Step {step.stepNumber}
                            </Badge>
                            <p className="font-medium">{step.description}</p>
                          </div>

                          {expandedSteps.includes(step.stepNumber) && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2">
                              {step.equipment && step.equipment.length > 0 && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Equipment:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {step.equipment.map((eq, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {eq}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.parameters && Object.keys(step.parameters).length > 0 && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Parameters:</Label>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(step.parameters).map(([key, value]) => (
                                      <div key={key} className="flex gap-2 text-sm">
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span className="font-medium">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.acceptanceCriteria && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Acceptance:</Label>
                                  <p className="text-sm mt-1">{step.acceptanceCriteria}</p>
                                </div>
                              )}

                              {step.notes && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Notes:</Label>
                                  <p className="text-sm mt-1 text-muted-foreground">{step.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleStepExpansion(step.stepNumber)}
                          >
                            {expandedSteps.includes(step.stepNumber) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(step.stepNumber, "up")}
                            disabled={step.stepNumber === 1}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveStep(step.stepNumber, "down")}
                            disabled={step.stepNumber === data.procedures!.length}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingStep(step);
                              setShowStepDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStep(step.stepNumber)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No procedures defined. Click "Add Step" to create inspection procedures.
              </div>
            )}

            {/* Generate Standard Procedures Button */}
            {(!data.procedures || data.procedures.length === 0) && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Generate standard procedures based on part type and standard
                    const standardProcedures: ProcedureStep[] = [
                      {
                        stepNumber: 1,
                        description: "Equipment Setup and Calibration",
                        equipment: ["UT Equipment", "Probes", "Calibration Block"],
                        parameters: { "Frequency": "5 MHz", "Gain": "As per calibration" },
                        acceptanceCriteria: "Calibration verified within ±2dB",
                        notes: "Document calibration details in report"
                      },
                      {
                        stepNumber: 2,
                        description: "Surface Preparation and Cleaning",
                        equipment: ["Cleaning supplies", "Couplant"],
                        parameters: { "Surface Roughness": "Ra 6.3 µm max" },
                        acceptanceCriteria: "Surface free from contaminants",
                      },
                      {
                        stepNumber: 3,
                        description: "Reference Sensitivity Setting",
                        equipment: ["Reference Block", "UT Equipment"],
                        parameters: { "Reference Reflector": "SDH 3mm", "Screen Height": "80%" },
                        acceptanceCriteria: "Reference echo at 80% ±5% FSH",
                      },
                      {
                        stepNumber: 4,
                        description: "Scanning Procedure",
                        equipment: ["Selected Probe", "Couplant"],
                        parameters: { "Scan Speed": "≤150 mm/s", "Overlap": "10%" },
                        acceptanceCriteria: "100% coverage achieved",
                      },
                      {
                        stepNumber: 5,
                        description: "Indication Evaluation",
                        equipment: ["UT Equipment", "DAC Curve"],
                        parameters: { "Recording Level": "50% DAC", "Evaluation Method": "DAC" },
                        acceptanceCriteria: "As per acceptance criteria",
                      },
                      {
                        stepNumber: 6,
                        description: "Documentation and Reporting",
                        equipment: ["Report Forms"],
                        parameters: {},
                        acceptanceCriteria: "All indications documented",
                        notes: "Include scan coverage map and indication plot"
                      },
                    ];
                    updateField("procedures", standardProcedures);
                  }}
                >
                  Generate Standard Procedures
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acceptance Criteria */}
      {activeSection === "acceptance" && (
        <Card>
          <CardHeader>
            <CardTitle>Acceptance Criteria</CardTitle>
            <CardDescription>Define evaluation and acceptance levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* General Acceptance Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Acceptance Class"
                help="Quality level classification"
              >
                <Select
                  value={data.acceptanceCriteria?.acceptanceClass || ""}
                  onValueChange={(value) => updateField('acceptanceCriteria', {...data.acceptanceCriteria, acceptanceClass: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptanceClasses.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Applicable Standard"
                help="Reference standard for acceptance"
              >
                <Input
                  value={data.acceptanceCriteria?.standard || ""}
                  onChange={(e) => updateField('acceptanceCriteria', {...data.acceptanceCriteria, standard: e.target.value})}
                  placeholder="e.g., ASME Section V"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Evaluation Level (%)"
                help="Amplitude level for evaluation"
              >
                <Input
                  type="number"
                  value={data.acceptanceCriteria?.evaluationLevel || 50}
                  onChange={(e) => updateField('acceptanceCriteria', {...data.acceptanceCriteria, evaluationLevel: parseInt(e.target.value)})}
                  min="0"
                  max="100"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Recording Level (%)"
                help="Minimum amplitude for recording"
              >
                <Input
                  type="number"
                  value={data.acceptanceCriteria?.recordingLevel || 20}
                  onChange={(e) => updateField('acceptanceCriteria', {...data.acceptanceCriteria, recordingLevel: parseInt(e.target.value)})}
                  min="0"
                  max="100"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Acceptance Level (%)"
                help="Maximum allowable indication"
              >
                <Input
                  type="number"
                  value={data.acceptanceCriteria?.acceptanceLevel || 75}
                  onChange={(e) => updateField('acceptanceCriteria', {...data.acceptanceCriteria, acceptanceLevel: parseInt(e.target.value)})}
                  min="0"
                  max="100"
                />
              </FieldWithHelp>
            </div>

            {/* Indication Criteria */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Indication Criteria</Label>
                <Button size="sm" onClick={() => setShowIndicationDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Indication Type
                </Button>
              </div>

              {data.acceptanceCriteria?.indications && data.acceptanceCriteria.indications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Max Size (mm)</TableHead>
                      <TableHead>Max Number</TableHead>
                      <TableHead>Evaluation Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.acceptanceCriteria.indications.map((indication, index) => (
                      <TableRow key={index}>
                        <TableCell>{indication.type}</TableCell>
                        <TableCell>{indication.maxSize}</TableCell>
                        <TableCell>{indication.maxNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{indication.evaluationMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeIndication(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No indication criteria defined. Add specific acceptance criteria for different indication types.
                </div>
              )}
            </div>

            {/* Acceptance Level Chart */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-3">Acceptance Level Summary</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recording Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${data.acceptanceCriteria?.recordingLevel || 20}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.acceptanceCriteria?.recordingLevel || 20}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Evaluation Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-yellow-500"
                        style={{ width: `${data.acceptanceCriteria?.evaluationLevel || 50}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.acceptanceCriteria?.evaluationLevel || 50}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acceptance Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${data.acceptanceCriteria?.acceptanceLevel || 75}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.acceptanceCriteria?.acceptanceLevel || 75}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Standards */}
      {activeSection === "standards" && (
        <Card>
          <CardHeader>
            <CardTitle>Applicable Standards & Specifications</CardTitle>
            <CardDescription>Reference standards and requirements</CardDescription>
            <Button onClick={() => setShowStandardDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Standard
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.applicableStandards && data.applicableStandards.length > 0 ? (
              <div className="space-y-2">
                {data.applicableStandards.map((standard, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">{standard.code}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{standard.title}</p>
                          {standard.section && (
                            <Badge variant="outline">Section: {standard.section}</Badge>
                          )}
                          {standard.requirement && (
                            <p className="text-sm mt-2">{standard.requirement}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStandard(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No standards defined. Add applicable standards and specifications.
              </div>
            )}

            {/* Quick Add Common Standards */}
            <div className="border-t pt-4">
              <Label className="text-sm mb-2">Quick Add Common Standards:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStandard({
                    code: "ASME B31.3",
                    title: "Process Piping",
                    section: "Chapter VI",
                    requirement: "Ultrasonic examination of welds"
                  })}
                >
                  ASME B31.3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStandard({
                    code: "AWS D1.1",
                    title: "Structural Welding Code - Steel",
                    section: "Section 6",
                    requirement: "UT of groove welds in butt joints"
                  })}
                >
                  AWS D1.1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStandard({
                    code: "API 650",
                    title: "Welded Tanks for Oil Storage",
                    section: "Section 8",
                    requirement: "Examination of tank shell welds"
                  })}
                >
                  API 650
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStandard({
                    code: "EN ISO 17640",
                    title: "UT of welded joints",
                    section: "",
                    requirement: "Testing levels and acceptance criteria"
                  })}
                >
                  EN ISO 17640
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Correction Procedures */}
      {activeSection === "transfer" && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Correction Procedures</CardTitle>
            <CardDescription>Calculate and document transfer corrections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Transfer Procedure Steps */}
            <div className="space-y-2">
              {data.transferProcedures && data.transferProcedures.length > 0 ? (
                data.transferProcedures.map((proc, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm">Step {proc.step}</Label>
                          <p className="text-sm mt-1">{proc.description}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Calculation</Label>
                          <p className="font-mono text-sm mt-1">{proc.calculation}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Result</Label>
                          <p className="font-medium text-sm mt-1">{proc.result} dB</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No transfer procedures defined.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Generate standard transfer correction procedures
                      const procedures: TransferProcedure[] = [
                        {
                          step: 1,
                          description: "Measure reference reflector amplitude in calibration block",
                          calculation: "A_ref = 80% FSH",
                          result: 0,
                        },
                        {
                          step: 2,
                          description: "Measure same size reflector in test piece",
                          calculation: "A_test = measured amplitude",
                          result: 0,
                        },
                        {
                          step: 3,
                          description: "Calculate transfer correction",
                          calculation: "TC = 20 log(A_ref/A_test)",
                          result: 0,
                        },
                        {
                          step: 4,
                          description: "Apply correction to scanning sensitivity",
                          calculation: "Scan Gain = Ref Gain + TC",
                          result: 0,
                        },
                      ];
                      updateField("transferProcedures", procedures);
                    }}
                  >
                    Generate Transfer Procedure Template
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Transfer Correction Calculator */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Transfer Correction Calculator</h4>
              <div className="grid grid-cols-3 gap-4">
                <FieldWithHelp
                  label="Reference Amplitude (%)"
                  help="Amplitude in calibration block"
                >
                  <Input type="number" placeholder="80" />
                </FieldWithHelp>
                <FieldWithHelp
                  label="Test Amplitude (%)"
                  help="Amplitude in test piece"
                >
                  <Input type="number" placeholder="60" />
                </FieldWithHelp>
                <div>
                  <Label>Calculated Correction</Label>
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="font-mono font-medium">+2.5 dB</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit" : "Add"} Procedure Step</DialogTitle>
            <DialogDescription>Define the inspection procedure step</DialogDescription>
          </DialogHeader>
          <StepForm
            step={editingStep}
            onSave={addOrUpdateStep}
            onCancel={() => {
              setShowStepDialog(false);
              setEditingStep(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Standard Dialog */}
      <Dialog open={showStandardDialog} onOpenChange={setShowStandardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Applicable Standard</DialogTitle>
            <DialogDescription>Enter standard details and requirements</DialogDescription>
          </DialogHeader>
          <StandardForm
            onSave={(standard) => {
              addStandard(standard);
              setShowStandardDialog(false);
            }}
            onCancel={() => setShowStandardDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Indication Dialog */}
      <Dialog open={showIndicationDialog} onOpenChange={setShowIndicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Indication Criteria</DialogTitle>
            <DialogDescription>Define acceptance criteria for indication type</DialogDescription>
          </DialogHeader>
          <IndicationForm
            onSave={addIndication}
            onCancel={() => setShowIndicationDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Step Form Component
const StepForm = ({ step, onSave, onCancel }: {
  step: ProcedureStep | null;
  onSave: (step: ProcedureStep) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<ProcedureStep>>(step || {
    description: "",
    equipment: [],
    parameters: {},
  });
  const [equipmentInput, setEquipmentInput] = useState("");
  const [paramKey, setParamKey] = useState("");
  const [paramValue, setParamValue] = useState("");

  const addEquipment = () => {
    if (equipmentInput) {
      setFormData({
        ...formData,
        equipment: [...(formData.equipment || []), equipmentInput]
      });
      setEquipmentInput("");
    }
  };

  const removeEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipment: formData.equipment?.filter((_, i) => i !== index) || []
    });
  };

  const addParameter = () => {
    if (paramKey && paramValue) {
      setFormData({
        ...formData,
        parameters: { ...formData.parameters, [paramKey]: paramValue }
      });
      setParamKey("");
      setParamValue("");
    }
  };

  const removeParameter = (key: string) => {
    const params = { ...formData.parameters };
    delete params[key];
    setFormData({ ...formData, parameters: params });
  };

  const handleSubmit = () => {
    onSave({
      stepNumber: step?.stepNumber || 1,
      description: formData.description || "",
      equipment: formData.equipment || [],
      parameters: formData.parameters || {},
      acceptanceCriteria: formData.acceptanceCriteria,
      notes: formData.notes,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Step Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the procedure step..."
          rows={3}
        />
      </div>

      <div>
        <Label>Required Equipment</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={equipmentInput}
            onChange={(e) => setEquipmentInput(e.target.value)}
            placeholder="e.g., UT Equipment"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEquipment())}
          />
          <Button type="button" onClick={addEquipment} size="sm">Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {formData.equipment?.map((eq, idx) => (
            <Badge key={idx} variant="secondary">
              {eq}
              <button
                onClick={() => removeEquipment(idx)}
                className="ml-2 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Parameters</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={paramKey}
            onChange={(e) => setParamKey(e.target.value)}
            placeholder="Parameter name"
          />
          <Input
            value={paramValue}
            onChange={(e) => setParamValue(e.target.value)}
            placeholder="Value"
          />
          <Button type="button" onClick={addParameter} size="sm">Add</Button>
        </div>
        {Object.entries(formData.parameters || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-1">
            <span className="text-sm">{key}: <strong>{value}</strong></span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeParameter(key)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label>Acceptance Criteria (Optional)</Label>
        <Input
          value={formData.acceptanceCriteria || ""}
          onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
          placeholder="e.g., No reportable indications"
        />
      </div>

      <div>
        <Label>Notes (Optional)</Label>
        <Textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or special instructions..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Step</Button>
      </div>
    </div>
  );
};

// Standard Form Component
const StandardForm = ({ onSave, onCancel }: {
  onSave: (standard: ApplicableStandard) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<ApplicableStandard>({
    code: "",
    title: "",
    section: "",
    requirement: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Standard Code</Label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., ASME Section V"
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Nondestructive Examination"
        />
      </div>
      <div>
        <Label>Section/Article</Label>
        <Input
          value={formData.section}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
          placeholder="e.g., Article 4"
        />
      </div>
      <div>
        <Label>Specific Requirement</Label>
        <Textarea
          value={formData.requirement}
          onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
          placeholder="Describe the specific requirement..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Add Standard</Button>
      </div>
    </div>
  );
};

// Indication Form Component
const IndicationForm = ({ onSave, onCancel }: {
  onSave: (indication: IndicationCriteria) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<IndicationCriteria>({
    type: "",
    maxSize: 0,
    maxNumber: 0,
    evaluationMethod: "",
  });

  const indicationTypes = [
    "Linear",
    "Rounded",
    "Planar",
    "Volumetric",
    "Crack-like",
    "Porosity",
    "Inclusion",
    "Lack of Fusion",
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Indication Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {indicationTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Maximum Size (mm)</Label>
        <Input
          type="number"
          value={formData.maxSize}
          onChange={(e) => setFormData({ ...formData, maxSize: parseFloat(e.target.value) })}
          step="0.1"
        />
      </div>
      <div>
        <Label>Maximum Number</Label>
        <Input
          type="number"
          value={formData.maxNumber}
          onChange={(e) => setFormData({ ...formData, maxNumber: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label>Evaluation Method</Label>
        <Select value={formData.evaluationMethod} onValueChange={(value) => setFormData({ ...formData, evaluationMethod: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {evaluationMethods.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Add Criteria</Button>
      </div>
    </div>
  );
};