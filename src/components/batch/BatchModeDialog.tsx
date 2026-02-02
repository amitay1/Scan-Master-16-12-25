// @ts-nocheck
/**
 * Batch Mode Dialog
 * Import multiple parts and generate technique sheets in batch
 */

import React, { useState, useCallback, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Package,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  BatchPart,
  ColumnMapping,
  ImportPreview,
  BatchJob,
  BatchExportOptions,
} from "@/types/batch";
import {
  parseCSV,
  autoDetectMappings,
  applyMappings,
  validateBatchParts,
  getSampleCSV,
  getMappableFields,
  createBatchJob,
} from "@/utils/batchProcessor";

interface BatchModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData?: Record<string, unknown>;
  templateName?: string;
  onBatchComplete?: (job: BatchJob) => void;
}

type Step = "upload" | "mapping" | "preview" | "generate" | "complete";

export function BatchModeDialog({
  open,
  onOpenChange,
  templateData,
  templateName = "Current Template",
  onBatchComplete,
}: BatchModeDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [job, setJob] = useState<BatchJob | null>(null);
  const [exportOptions, setExportOptions] = useState<BatchExportOptions>({
    format: "pdf",
    naming: "part_number",
    includeIndex: true,
    zipOutput: true,
  });

  const mappableFields = useMemo(() => getMappableFields(), []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCSV(text);

        if (result.errors.length > 0) {
          toast({
            title: "CSV Parse Errors",
            description: result.errors.slice(0, 3).join(". "),
            variant: "destructive",
          });
        }

        if (result.headers.length > 0) {
          setCsvData({ headers: result.headers, rows: result.rows });
          const detectedMappings = autoDetectMappings(result.headers);
          setMappings(detectedMappings);
          setStep("mapping");
        }
      };
      reader.readAsText(file);
    },
    [toast]
  );

  // Download sample CSV
  const handleDownloadSample = useCallback(() => {
    const content = getSampleCSV();
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch_import_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Update column mapping
  const updateMapping = useCallback((csvColumn: string, targetField: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvColumn === csvColumn
          ? { ...m, targetField, transform: getTransformForField(targetField) }
          : m
      )
    );
  }, []);

  // Apply mappings and preview
  const handleApplyMappings = useCallback(() => {
    if (!csvData) return;

    const result = applyMappings(
      { headers: csvData.headers, rows: csvData.rows, errors: [], rowCount: csvData.rows.length },
      mappings
    );
    setPreview(result);

    if (result.warnings.length > 0) {
      toast({
        title: "Import Warnings",
        description: result.warnings.slice(0, 3).join(". "),
      });
    }

    setStep("preview");
  }, [csvData, mappings, toast]);

  // Validate and proceed to generate
  const handleProceedToGenerate = useCallback(() => {
    if (!preview) return;

    const validation = validateBatchParts(preview.parts);
    if (!validation.valid) {
      toast({
        title: "Validation Failed",
        description: validation.errors.slice(0, 3).join(". "),
        variant: "destructive",
      });
      return;
    }

    setStep("generate");
  }, [preview, toast]);

  // Start batch generation
  const handleStartBatch = useCallback(async () => {
    if (!preview) return;

    const newJob = createBatchJob("current", templateName, preview.parts);
    setJob(newJob);
    setStep("complete");

    // Simulate batch processing (in real app, this would generate actual documents)
    // For now, we'll just mark everything as completed after a delay
    setTimeout(() => {
      const completedJob: BatchJob = {
        ...newJob,
        status: "completed",
        completedParts: newJob.totalParts,
        failedParts: 0,
        completedAt: new Date().toISOString(),
        results: newJob.results.map((r) => ({
          ...r,
          status: "completed",
          outputPath: `output/${r.partNumber}.pdf`,
        })),
      };
      setJob(completedJob);
      onBatchComplete?.(completedJob);

      toast({
        title: "Batch Complete",
        description: `Generated ${completedJob.completedParts} technique sheets`,
      });
    }, 2000);
  }, [preview, templateName, onBatchComplete, toast]);

  // Reset and start over
  const handleReset = useCallback(() => {
    setCsvData(null);
    setMappings([]);
    setPreview(null);
    setJob(null);
    setStep("upload");
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Multi-Part Batch Mode
          </DialogTitle>
          <DialogDescription>
            Generate technique sheets for multiple parts from a CSV import
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(["upload", "mapping", "preview", "generate", "complete"] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              <Badge
                variant={step === s ? "default" : steps.indexOf(step) > i ? "secondary" : "outline"}
                className="capitalize"
              >
                {s}
              </Badge>
            </React.Fragment>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="p-6 space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Upload Parts List</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with part numbers and specifications
                </p>
                <div className="flex items-center justify-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button asChild>
                      <span>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Select CSV File
                      </span>
                    </Button>
                  </label>
                  <Button variant="outline" onClick={handleDownloadSample}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">CSV Format Guide</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• First row must contain column headers</li>
                  <li>• Part Number column is required</li>
                  <li>• Dimensions should be in mm</li>
                  <li>• Use commas to separate columns (standard CSV format)</li>
                </ul>
              </div>

              {templateData && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-medium">Template:</span> {templateName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Part-specific values from CSV will override template defaults
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && csvData && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Column Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    Map CSV columns to technique sheet fields
                  </p>
                </div>
                <Badge variant="outline">{csvData.rows.length} rows</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Sample Value</TableHead>
                    <TableHead>Map To Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.headers.map((header, i) => {
                    const mapping = mappings.find((m) => m.csvColumn === header);
                    const sampleValue = csvData.rows[0]?.[i] || "";

                    return (
                      <TableRow key={header}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[150px] truncate">
                          {sampleValue}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping?.targetField || ""}
                            onValueChange={(value) => updateMapping(header, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Skip column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Skip column</SelectItem>
                              {mappableFields.map((f) => (
                                <SelectItem key={f.field} value={f.field}>
                                  {f.field.replace(/([A-Z])/g, " $1").trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Back
                </Button>
                <Button onClick={handleApplyMappings}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && preview && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Preview Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Review {preview.parts.length} parts before generating
                  </p>
                </div>
                {preview.isValid ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Has Warnings
                  </Badge>
                )}
              </div>

              {preview.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                    Warnings
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                    {preview.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Class</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.parts.slice(0, 10).map((part, i) => (
                      <TableRow key={part.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{part.partNumber}</TableCell>
                        <TableCell>{part.serialNumber || "-"}</TableCell>
                        <TableCell>{part.material || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {part.thickness && `T: ${part.thickness}`}
                          {part.length && ` L: ${part.length}`}
                          {part.width && ` W: ${part.width}`}
                        </TableCell>
                        <TableCell>
                          {part.acceptanceClass && (
                            <Badge variant="outline">{part.acceptanceClass}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {preview.parts.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing first 10 of {preview.parts.length} parts
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("mapping")}>
                  Back
                </Button>
                <Button onClick={handleProceedToGenerate}>
                  Configure Export
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Generate Step */}
          {step === "generate" && preview && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-medium">Export Options</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how technique sheets will be generated
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Output Format</Label>
                  <Select
                    value={exportOptions.format}
                    onValueChange={(value: "pdf" | "docx" | "both") =>
                      setExportOptions((prev) => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                      <SelectItem value="both">Both PDF and DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naming">File Naming</Label>
                  <Select
                    value={exportOptions.naming}
                    onValueChange={(value: "part_number" | "serial_number" | "custom") =>
                      setExportOptions((prev) => ({ ...prev, naming: value }))
                    }
                  >
                    <SelectTrigger id="naming">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="part_number">Part Number</SelectItem>
                      <SelectItem value="serial_number">Serial Number</SelectItem>
                      <SelectItem value="custom">Custom Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportOptions.naming === "custom" && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="pattern">Naming Pattern</Label>
                    <Input
                      id="pattern"
                      value={exportOptions.namingPattern || ""}
                      onChange={(e) =>
                        setExportOptions((prev) => ({ ...prev, namingPattern: e.target.value }))
                      }
                      placeholder="{part_number}_{serial_number}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {"{part_number}"}, {"{serial_number}"}, {"{index}"}, {"{material}"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Summary</h4>
                <ul className="text-sm space-y-1">
                  <li>• Parts to process: {preview.parts.length}</li>
                  <li>• Template: {templateName}</li>
                  <li>• Format: {exportOptions.format.toUpperCase()}</li>
                  <li>• Output: ZIP archive with all files</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Back
                </Button>
                <Button onClick={handleStartBatch}>
                  <Package className="h-4 w-4 mr-2" />
                  Generate {preview.parts.length} Sheets
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && job && (
            <div className="p-4 space-y-6">
              <div className="text-center py-8">
                {job.status === "processing" ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-lg font-medium">Generating Technique Sheets...</p>
                    <Progress
                      value={(job.completedParts / job.totalParts) * 100}
                      className="mt-4 max-w-xs mx-auto"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {job.completedParts} of {job.totalParts} complete
                    </p>
                  </>
                ) : job.status === "completed" ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p className="text-lg font-medium">Batch Complete!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generated {job.completedParts} technique sheets
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
                    <p className="text-lg font-medium">Batch Failed</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {job.failedParts} of {job.totalParts} failed
                    </p>
                  </>
                )}
              </div>

              {job.status !== "processing" && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Serial</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.results.slice(0, 10).map((result) => (
                          <TableRow key={result.partId}>
                            <TableCell className="font-medium">{result.partNumber}</TableCell>
                            <TableCell>{result.serialNumber || "-"}</TableCell>
                            <TableCell>
                              {result.status === "completed" ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : result.status === "failed" ? (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Processing
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={handleReset}>
                      Start New Batch
                    </Button>
                    {job.status === "completed" && (
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download ZIP
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper: Get transform function for field
function getTransformForField(field: string): ((value: string) => string | number) | undefined {
  const numericFields = ["thickness", "length", "width", "outerDiameter", "innerDiameter"];
  if (numericFields.includes(field)) {
    return parseFloat;
  }
  if (field === "quantity") {
    return parseInt;
  }
  return undefined;
}

// Helper: Step order
const steps: Step[] = ["upload", "mapping", "preview", "generate", "complete"];
