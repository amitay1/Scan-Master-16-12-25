/**
 * AI Defect Advisor Component
 * Interactive defect classification assistant
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Lightbulb,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import type {
  IndicationData,
  DefectClassification,
  SignalShape,
  SignalBehavior,
} from "@/types/defect";
import {
  DEFECT_TYPE_LABELS,
  SIGNAL_SHAPE_LABELS,
  SIGNAL_BEHAVIOR_LABELS,
} from "@/types/defect";
import { classifyIndication, validateIndicationData } from "@/utils/defectClassifier";

interface DefectAdvisorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<IndicationData>;
  onSaveClassification?: (classification: DefectClassification, data: IndicationData) => void;
}

export function DefectAdvisor({
  open,
  onOpenChange,
  initialData,
  onSaveClassification,
}: DefectAdvisorProps) {
  // Form state
  const [amplitude, setAmplitude] = useState(initialData?.amplitude ?? 100);
  const [amplitudeRef, setAmplitudeRef] = useState<"fsh" | "dac">(
    initialData?.amplitudeReference ?? "dac"
  );
  const [depth, setDepth] = useState(initialData?.depth ?? 10);
  const [signalShape, setSignalShape] = useState<SignalShape | "">(
    initialData?.signalShape ?? ""
  );
  const [signalBehavior, setSignalBehavior] = useState<SignalBehavior | "">(
    initialData?.signalBehavior ?? ""
  );
  const [backWallDrop, setBackWallDrop] = useState<number | undefined>(
    initialData?.backWallDrop
  );
  const [backWallComplete, setBackWallComplete] = useState(
    initialData?.backWallComplete ?? false
  );
  const [processType, setProcessType] = useState<string>(
    initialData?.processType ?? ""
  );
  const [material, setMaterial] = useState(initialData?.material ?? "");
  const [isLinear, setIsLinear] = useState(initialData?.isLinear);
  const [orientation, setOrientation] = useState<string>(
    initialData?.orientation ?? ""
  );
  const [nearSurface, setNearSurface] = useState(initialData?.nearSurface ?? false);
  const [nearBackWall, setNearBackWall] = useState(initialData?.nearBackWall ?? false);

  // Build indication data
  const indicationData = useMemo<Partial<IndicationData>>(() => ({
    amplitude,
    amplitudeReference: amplitudeRef,
    depth,
    signalShape: signalShape || undefined,
    signalBehavior: signalBehavior || undefined,
    backWallDrop,
    backWallComplete,
    processType: processType as IndicationData["processType"],
    material,
    isLinear,
    orientation: orientation as IndicationData["orientation"],
    nearSurface,
    nearBackWall,
  }), [
    amplitude, amplitudeRef, depth, signalShape, signalBehavior,
    backWallDrop, backWallComplete, processType, material,
    isLinear, orientation, nearSurface, nearBackWall,
  ]);

  // Validation
  const validation = useMemo(
    () => validateIndicationData(indicationData),
    [indicationData]
  );

  // Classification result
  const [classification, setClassification] = useState<DefectClassification | null>(null);

  // Run classification
  const handleClassify = useCallback(() => {
    if (!validation.valid) return;

    const result = classifyIndication(indicationData as IndicationData);
    setClassification(result);
  }, [indicationData, validation.valid]);

  // Reset form
  const handleReset = useCallback(() => {
    setAmplitude(100);
    setAmplitudeRef("dac");
    setDepth(10);
    setSignalShape("");
    setSignalBehavior("");
    setBackWallDrop(undefined);
    setBackWallComplete(false);
    setProcessType("");
    setMaterial("");
    setIsLinear(undefined);
    setOrientation("");
    setNearSurface(false);
    setNearBackWall(false);
    setClassification(null);
  }, []);

  // Save classification
  const handleSave = useCallback(() => {
    if (classification && validation.valid) {
      onSaveClassification?.(classification, indicationData as IndicationData);
      onOpenChange(false);
    }
  }, [classification, indicationData, validation.valid, onSaveClassification, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Defect Advisor
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </DialogTitle>
          <DialogDescription>
            Enter indication characteristics to get AI-assisted defect classification
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="input" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="result" disabled={!classification}>
              Classification
            </TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Input Tab */}
            <TabsContent value="input" className="p-4 space-y-6">
              {/* Basic Measurements */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Basic Measurements *</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amplitude">Amplitude (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="amplitude"
                        type="number"
                        value={amplitude}
                        onChange={(e) => setAmplitude(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={500}
                      />
                      <Select value={amplitudeRef} onValueChange={(v: "fsh" | "dac") => setAmplitudeRef(v)}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dac">DAC</SelectItem>
                          <SelectItem value="fsh">FSH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (mm)</Label>
                    <Input
                      id="depth"
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={500}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g., Ti-6Al-4V"
                    />
                  </div>
                </div>
              </div>

              {/* Signal Characteristics */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Signal Characteristics *</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signalShape">Signal Shape</Label>
                    <Select
                      value={signalShape}
                      onValueChange={(v: SignalShape) => setSignalShape(v)}
                    >
                      <SelectTrigger id="signalShape">
                        <SelectValue placeholder="Select shape..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SIGNAL_SHAPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signalBehavior">Signal Behavior</Label>
                    <Select
                      value={signalBehavior}
                      onValueChange={(v: SignalBehavior) => setSignalBehavior(v)}
                    >
                      <SelectTrigger id="signalBehavior">
                        <SelectValue placeholder="Select behavior..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SIGNAL_BEHAVIOR_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Back Wall */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Back Wall Effect</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Back Wall Drop (dB)</Label>
                    <Slider
                      value={[backWallDrop ?? 0]}
                      onValueChange={([v]) => setBackWallDrop(v || undefined)}
                      min={0}
                      max={20}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {backWallDrop ?? 0} dB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="backWallComplete"
                      checked={backWallComplete}
                      onCheckedChange={(c) => setBackWallComplete(c === true)}
                    />
                    <Label htmlFor="backWallComplete" className="text-sm cursor-pointer">
                      Complete loss of back wall
                    </Label>
                  </div>
                </div>
              </div>

              {/* Process & Location */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Process & Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processType">Process Type</Label>
                    <Select value={processType} onValueChange={setProcessType}>
                      <SelectTrigger id="processType">
                        <SelectValue placeholder="Select process..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forging">Forging</SelectItem>
                        <SelectItem value="casting">Casting</SelectItem>
                        <SelectItem value="weld">Weld</SelectItem>
                        <SelectItem value="wrought">Wrought</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Indication Orientation</Label>
                    <Select value={orientation} onValueChange={setOrientation}>
                      <SelectTrigger id="orientation">
                        <SelectValue placeholder="Select orientation..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parallel">Parallel to surface</SelectItem>
                        <SelectItem value="perpendicular">Perpendicular to surface</SelectItem>
                        <SelectItem value="random">Random/Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="nearSurface"
                      checked={nearSurface}
                      onCheckedChange={(c) => setNearSurface(c === true)}
                    />
                    <Label htmlFor="nearSurface" className="text-sm cursor-pointer">
                      Near surface (&lt;3mm)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="nearBackWall"
                      checked={nearBackWall}
                      onCheckedChange={(c) => setNearBackWall(c === true)}
                    />
                    <Label htmlFor="nearBackWall" className="text-sm cursor-pointer">
                      Near back wall
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isLinear"
                      checked={isLinear === true}
                      onCheckedChange={(c) => setIsLinear(c === true ? true : c === false ? false : undefined)}
                    />
                    <Label htmlFor="isLinear" className="text-sm cursor-pointer">
                      Linear indication
                    </Label>
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              {!validation.valid && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    Missing Required Fields
                  </div>
                  <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                    {validation.missingFields.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && validation.valid && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                    <HelpCircle className="h-4 w-4" />
                    Tips for Better Accuracy
                  </div>
                  <ul className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleClassify} disabled={!validation.valid}>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Indication
                </Button>
              </div>
            </TabsContent>

            {/* Result Tab */}
            <TabsContent value="result" className="p-4 space-y-6">
              {classification && (
                <>
                  {/* Primary Classification */}
                  <div className={`p-4 rounded-lg border ${
                    classification.confidence >= 70
                      ? "bg-green-500/10 border-green-500/30"
                      : classification.confidence >= 50
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-orange-500/10 border-orange-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Primary Classification</p>
                        <p className="text-xl font-bold">
                          {DEFECT_TYPE_LABELS[classification.primaryType]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-2xl font-bold">{classification.confidence}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`p-4 rounded-lg border ${
                    classification.recommendation === "accept"
                      ? "bg-green-500/10 border-green-500/30"
                      : classification.recommendation === "reject"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {classification.recommendation === "accept" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : classification.recommendation === "reject" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="font-medium capitalize">
                        Recommendation: {classification.recommendation.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {classification.recommendationReason}
                    </p>
                  </div>

                  {/* Alternative Classifications */}
                  {classification.alternativeTypes.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Alternative Possibilities</h3>
                      <div className="flex flex-wrap gap-2">
                        {classification.alternativeTypes.map((alt) => (
                          <Badge key={alt.type} variant="outline">
                            {DEFECT_TYPE_LABELS[alt.type]} ({alt.confidence}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Analysis
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      {classification.reasons.map((reason, i) => (
                        <p key={i}>{reason}</p>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  {classification.suggestedActions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggested Actions
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {classification.suggestedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* References */}
                  {classification.references.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        References
                      </h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {classification.references.map((ref, i) => (
                          <li key={i}>• {ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* Save Button */}
                  {onSaveClassification && (
                    <div className="flex justify-end">
                      <Button onClick={handleSave}>
                        Save Classification to Report
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Help Tab */}
            <TabsContent value="help" className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">How to Use the Defect Advisor</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Enter the amplitude and depth of the indication</li>
                  <li>Select the signal shape as observed on the A-scan</li>
                  <li>Note the signal behavior when moving the probe</li>
                  <li>Record any back wall effects</li>
                  <li>Provide process type for better accuracy</li>
                  <li>Click "Analyze Indication" to get classification</li>
                </ol>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Signal Shape Guide</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Sharp & Narrow</p>
                    <p className="text-xs text-muted-foreground">
                      High, narrow peak - typical of cracks, planar defects
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Rounded</p>
                    <p className="text-xs text-muted-foreground">
                      Smooth, rounded peak - typical of porosity, inclusions
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Multiple Peaks</p>
                    <p className="text-xs text-muted-foreground">
                      Several peaks - typical of clustered porosity
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Flat Topped</p>
                    <p className="text-xs text-muted-foreground">
                      Wide, flat top - typical of lamination, delamination
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Disclaimer
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                      This tool provides guidance only and does not replace the judgment
                      of a qualified Level II or Level III UT technician. Final
                      classification decisions must be made by certified personnel per
                      applicable specifications.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
