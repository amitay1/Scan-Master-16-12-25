// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatSelector } from "./FormatSelector";
import { LogoUpload } from "./LogoUpload";
import { DocumentControl, DocumentControlData } from "./DocumentControl";
import { Certification, CertificationData } from "./Certification";
import { exportManager } from "@/utils/exporters/exportManager";
import { exportTemplates, getTemplateConfig } from "@/config/exportTemplates";
import {
  ExportFormat,
  ExportTemplate,
  ExportOptions,
  ExportData,
} from "@/types/exportTypes";
import {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from "@/types/techniqueSheet";
import { Download, FileText, Settings, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSettingsApply } from "@/hooks/useSettingsApply";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partDiagram?: string;
  data: {
    standard: StandardType;
    inspectionSetup: InspectionSetupData;
    equipment: EquipmentData;
    calibration: CalibrationData;
    scanParameters: ScanParametersData;
    acceptanceCriteria: AcceptanceCriteriaData;
    documentation: DocumentationData;
  };
}

export function ExportDialog({ open, onOpenChange, partDiagram, data }: ExportDialogProps) {
  // Use settings for defaults
  const { 
    getCurrentDate, 
    companyName: settingsCompanyName, 
    companyLogo: settingsCompanyLogo,
    defaultExportFormat,
    pageSize,
    includeCompanyLogo
  } = useSettingsApply();

  const [format, setFormat] = useState<ExportFormat>(defaultExportFormat as ExportFormat);
  const [template, setTemplate] = useState<ExportTemplate>("standard");
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [companyName, setCompanyName] = useState(settingsCompanyName || "");
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("");

  // TÜV-specific state
  const [companyLogo, setCompanyLogo] = useState<string | null>(settingsCompanyLogo || null);
  const [documentControl, setDocumentControl] = useState<DocumentControlData>({
    documentNumber: "TUV-UT-001",
    revisionNumber: "Rev. 00",
    revisionDate: getCurrentDate(),
    revisionDescription: "Initial Release",
    controlledCopy: true,
    language: "bilingual"
  });
  const [certification, setCertification] = useState<CertificationData>({
    inspectorName: data.documentation.inspectorName || "",
    inspectorLevel: "Level II",
    inspectorCertification: "",
  });

  // Update from settings when they change
  useEffect(() => {
    if (settingsCompanyName && !companyName) {
      setCompanyName(settingsCompanyName);
    }
    if (settingsCompanyLogo && !companyLogo) {
      setCompanyLogo(settingsCompanyLogo);
    }
  }, [settingsCompanyName, settingsCompanyLogo]);

  const selectedTemplate = getTemplateConfig(template);
  const isTuvTemplate = template === "tuv";

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportMessage("Preparing export...");

    try {
      const exportData: ExportData = {
        standard: data.standard,
        inspectionSetup: data.inspectionSetup,
        equipment: data.equipment,
        calibration: data.calibration,
        scanParameters: data.scanParameters,
        acceptanceCriteria: data.acceptanceCriteria,
        documentation: data.documentation,
        partDiagram: partDiagram,
      };

      const options: Partial<ExportOptions> = {
        template,
        includeWatermark,
        companyName: companyName || undefined,
        includeTableOfContents: includeTableOfContents || template === "comprehensive" || isTuvTemplate,
        includePageNumbers: true,
        // TÜV-specific options
        ...(isTuvTemplate && {
          companyLogo,
          documentNumber: documentControl.documentNumber,
          revisionNumber: documentControl.revisionNumber,
          revisionDate: documentControl.revisionDate,
          revisionDescription: documentControl.revisionDescription,
          controlledCopy: documentControl.controlledCopy,
          language: documentControl.language,
          certificationLevel: certification.inspectorLevel,
          inspectorCertification: certification.inspectorCertification,
        }),
      };

      const result = await exportManager.exportWithProgress(
        format,
        exportData,
        options,
        (progress, message) => {
          setExportProgress(progress);
          setExportMessage(message);
        }
      );

      if (result.success) {
        toast.success(`Export successful! File saved as ${result.filename}`);
        setTimeout(() => {
          onOpenChange(false);
          setIsExporting(false);
          setExportProgress(0);
          setExportMessage("");
        }, 1500);
      } else {
        throw new Error(result.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export document");
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Technique Sheet
          </DialogTitle>
          <DialogDescription>
            Choose your export format and customize the output options
          </DialogDescription>
        </DialogHeader>

        {!isExporting ? (
          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="format" data-testid="tab-format">
                <FileText className="mr-2 h-4 w-4" />
                Format
              </TabsTrigger>
              <TabsTrigger value="template" data-testid="tab-template">
                <FileText className="mr-2 h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="options" data-testid="tab-options">
                <Settings className="mr-2 h-4 w-4" />
                Options
              </TabsTrigger>
              <TabsTrigger value="tuv" disabled={!isTuvTemplate} data-testid="tab-tuv">
                <FileText className="mr-2 h-4 w-4" />
                TÜV Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <FormatSelector value={format} onChange={setFormat} />
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <Label>Document Template</Label>
                <RadioGroup value={template} onValueChange={(value) => setTemplate(value as ExportTemplate)}>
                  <div className="grid gap-4">
                    {Object.values(exportTemplates).map((tmpl) => (
                      <label
                        key={tmpl.id}
                        className={cn(
                          "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
                          template === tmpl.id && "border-primary bg-accent"
                        )}
                      >
                        <RadioGroupItem
                          value={tmpl.id}
                          id={tmpl.id}
                          className="sr-only"
                          data-testid={`radio-template-${tmpl.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{tmpl.name}</h4>
                              <p className="text-sm text-muted-foreground">{tmpl.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {tmpl.estimatedPages}
                              </p>
                            </div>
                            {template === tmpl.id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="mt-2 text-xs">
                            <span className="font-medium">Best for:</span> {tmpl.bestFor}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tmpl.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                            {tmpl.features.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{tmpl.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <Alert className={partDiagram ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"}>
                  {partDiagram ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        ✅ Technical drawing will be included in the export
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        ⚠️ Technical drawing not available. Visit the Technical Drawing tab first to include it.
                      </AlertDescription>
                    </>
                  )}
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="watermark">Include Watermark</Label>
                    <p className="text-sm text-muted-foreground">
                      Add a watermark to each page
                    </p>
                  </div>
                  <Switch
                    id="watermark"
                    checked={includeWatermark}
                    onCheckedChange={setIncludeWatermark}
                    data-testid="switch-watermark"
                  />
                </div>

                {template === "comprehensive" && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="toc">Table of Contents</Label>
                      <p className="text-sm text-muted-foreground">
                        Include a table of contents
                      </p>
                    </div>
                    <Switch
                      id="toc"
                      checked={includeTableOfContents || template === "comprehensive"}
                      onCheckedChange={setIncludeTableOfContents}
                      disabled={template === "comprehensive"}
                      data-testid="switch-toc"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name (Optional)</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    data-testid="input-company-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be displayed in the header/footer
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Selected Template:</strong> {selectedTemplate.name}
                  <br />
                  This will generate a {selectedTemplate.estimatedPages} document with{" "}
                  {Object.values(selectedTemplate.sections).filter(Boolean).length} sections
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="tuv" className="space-y-6">
              <div className="space-y-6">
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>TÜV Professional Template</strong>
                    <br />
                    This template creates a comprehensive 19-page report following TÜV international standards with bilingual support and professional certification requirements.
                  </AlertDescription>
                </Alert>

                <LogoUpload
                  onLogoChange={setCompanyLogo}
                  currentLogo={companyLogo}
                />

                <DocumentControl
                  data={documentControl}
                  onChange={setDocumentControl}
                />

                <Certification
                  data={certification}
                  onChange={setCertification}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h3 className="font-semibold text-lg">{exportMessage}</h3>
              <p className="text-sm text-muted-foreground">
                Generating your {format.toUpperCase()} document...
              </p>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              {exportProgress}% Complete
            </div>
          </div>
        )}

        {!isExporting && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleExport} data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export {format.toUpperCase()}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}