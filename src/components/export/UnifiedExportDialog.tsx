/**
 * Unified Export Dialog
 * =====================
 * דיאלוג ייצוא מאוחד - כפתור אחד לייצוא מלא
 * 
 * מחליף את:
 * - Technique Mode Export
 * - Report Mode Export
 * 
 * עם: ייצוא אחד חכם שמזהה את שלב הבדיקה ומייצא את הכל
 */

import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Globe,
  Image,
  Table as TableIcon,
  BarChart,
  FileDown,
  Printer,
  Mail,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";

import {
  unifiedExportService,
  EXPORT_TEMPLATES,
  ExportTemplateConfig,
  ExportContext,
  ExportStats,
  InspectionPhase,
  mapLegacyDataToUnified,
} from "@/services/unifiedExportService";
import type { ExportTemplate, UnifiedInspectionData } from "@/types/unifiedInspection";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData as TechniqueDocumentationData,
} from "@/types/techniqueSheet";
import type { InspectionReportData } from "@/types/inspectionReport";
import type { ScanDetailsData } from "@/types/scanDetails";

// Import actual export function
import { exportComprehensiveTechniqueSheet } from "@/utils/comprehensiveTechniqueSheetExport";

interface UnifiedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // נתונים מהמערכת הישנה
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: TechniqueDocumentationData;
  inspectionReport: InspectionReportData;
  scanDetails?: ScanDetailsData;
  
  // קולבקים
  onExport?: (format: "pdf" | "word", template: ExportTemplate) => void;
}

export const UnifiedExportDialog: React.FC<UnifiedExportDialogProps> = ({
  open,
  onOpenChange,
  standard,
  inspectionSetup,
  equipment,
  calibration,
  scanParameters,
  acceptanceCriteria,
  documentation,
  inspectionReport,
  scanDetails,
  onExport,
}) => {
  // State
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>("tuv");
  const [exportContext, setExportContext] = useState<ExportContext>(
    unifiedExportService.getDefaultContext()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // מיפוי נתונים למבנה מאוחד
  const unifiedData = useMemo(() => {
    return mapLegacyDataToUnified(
      inspectionSetup,
      equipment,
      calibration,
      scanParameters,
      acceptanceCriteria,
      documentation,
      inspectionReport,
      scanDetails
    );
  }, [inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, inspectionReport, scanDetails]);

  // זיהוי שלב הבדיקה
  const phase = useMemo(() => 
    unifiedExportService.detectPhase(unifiedData), 
    [unifiedData]
  );

  // תבנית נבחרת
  const currentTemplate = useMemo(() => 
    unifiedExportService.getTemplate(selectedTemplate),
    [selectedTemplate]
  );

  // סטטיסטיקות
  const stats = useMemo(() => {
    if (!currentTemplate) return null;
    return unifiedExportService.calculateStats(unifiedData, currentTemplate, exportContext);
  }, [unifiedData, currentTemplate, exportContext]);

  // עדכון קונטקסט כשמשתנה התבנית
  useEffect(() => {
    setExportContext(prev => ({
      ...prev,
      template: selectedTemplate,
      phase,
    }));
  }, [selectedTemplate, phase]);

  // ביצוא ייצוא אמיתי
  const handleExport = async (format: "pdf" | "word") => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Progress step 1: Preparing data
      setExportProgress(10);
      await new Promise(r => setTimeout(r, 100));

      // Build the data object for the export function
      const exportData = {
        standard: standard,
        inspectionSetup,
        equipment,
        calibration,
        scanParameters,
        acceptanceCriteria,
        documentation,
        partDiagram: undefined as string | undefined,
        scanImages: [] as string[],
      };

      // Progress step 2: Processing
      setExportProgress(30);
      await new Promise(r => setTimeout(r, 100));

      if (format === "pdf") {
        // Progress step 3: Generating PDF
        setExportProgress(50);
        await new Promise(r => setTimeout(r, 100));

        // Use unified comprehensive export for all templates
        setExportProgress(70);
        exportComprehensiveTechniqueSheet(exportData);

        setExportProgress(100);
      } else {
        // Word export - TODO: implement later
        setExportProgress(100);
        console.warn("Word export not yet implemented");
      }

      // Success callback
      onExport?.(format, selectedTemplate);
      
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // קבלת אייקון סטטוס
  const getStatusIcon = (status: "ready" | "partial" | "pending") => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "partial":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // קבלת תוויות שלב
  const getPhaseInfo = (p: InspectionPhase) => {
    const info = {
      "pre-inspection": {
        label: "Pre-Inspection",
        labelHe: "לפני הבדיקה",
        color: "bg-blue-100 text-blue-700",
        icon: <Clock className="w-4 h-4" />,
        description: "Export planning documents before inspection",
        descriptionHe: "ייצוא מסמכי תכנון לפני הבדיקה",
      },
      "post-inspection": {
        label: "Post-Inspection",
        labelHe: "אחרי הבדיקה",
        color: "bg-orange-100 text-orange-700",
        icon: <FileText className="w-4 h-4" />,
        description: "Export includes results and findings",
        descriptionHe: "הייצוא כולל תוצאות וממצאים",
      },
      "complete": {
        label: "Complete Report",
        labelHe: "דו״ח מלא",
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-4 h-4" />,
        description: "Full professional report ready for delivery",
        descriptionHe: "דו\"ח מקצועי מלא מוכן למסירה",
      },
    };
    return info[p];
  };

  const phaseInfo = getPhaseInfo(phase);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Unified Export
            <span className="text-muted-foreground text-sm font-normal">/ ייצוא מאוחד</span>
          </DialogTitle>
          <DialogDescription>
            One export, complete documentation • ייצוא אחד, תיעוד מלא
          </DialogDescription>
        </DialogHeader>

        {/* Phase Indicator */}
        <div className={cn("p-3 rounded-lg flex items-center justify-between", phaseInfo.color)}>
          <div className="flex items-center gap-2">
            {phaseInfo.icon}
            <div>
              <span className="font-medium">{phaseInfo.label}</span>
              <span className="mx-2">•</span>
              <span>{phaseInfo.labelHe}</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-white/50">
            {stats?.readinessPercentage || 0}% Ready
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            {/* Template Selection */}
            <TabsContent value="template" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {EXPORT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTemplate === template.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">{template.nameHe}</CardDescription>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {template.pageCount} pages
                        </span>
                        {template.supportsBilingual && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Bilingual
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Template Features */}
              {currentTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {currentTemplate.name} Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {currentTemplate.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Export Settings */}
            <TabsContent value="settings" className="m-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Language */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Language
                      </Label>
                      <Select
                        value={exportContext.language}
                        onValueChange={(v) => setExportContext(prev => ({ ...prev, language: v as "en" | "he" | "both" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="he">עברית (Hebrew)</SelectItem>
                          <SelectItem value="both">Bilingual / דו-לשוני</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Watermark */}
                    <div className="space-y-2">
                      <Label>Watermark</Label>
                      <Input
                        placeholder="e.g., CONTROLLED COPY"
                        value={exportContext.watermark || ""}
                        onChange={(e) => setExportContext(prev => ({ ...prev, watermark: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Content Options */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Images</span>
                      </div>
                      <Switch
                        checked={exportContext.includeImages}
                        onCheckedChange={(checked) => setExportContext(prev => ({ ...prev, includeImages: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Tables</span>
                      </div>
                      <Switch
                        checked={exportContext.includeTables}
                        onCheckedChange={(checked) => setExportContext(prev => ({ ...prev, includeTables: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Charts</span>
                      </div>
                      <Switch
                        checked={exportContext.includeCharts}
                        onCheckedChange={(checked) => setExportContext(prev => ({ ...prev, includeCharts: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missing Data Warning */}
              {stats && stats.missingData.length > 0 && (
                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Missing Data</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    The following fields are not filled:
                    <ul className="mt-2 list-disc list-inside">
                      {stats.missingData.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="m-0 space-y-4">
              {currentTemplate && (
                <>
                  {/* Stats Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.totalPages || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Pages</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.sectionsIncluded || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Sections</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.readinessPercentage || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Ready</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        {stats?.missingData.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Missing</div>
                    </Card>
                  </div>

                  {/* Sections List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Document Sections</CardTitle>
                      <CardDescription>
                        Sections included based on {phaseInfo.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {unifiedExportService.getSections(currentTemplate, phase).map((section, idx) => {
                          const preview = unifiedExportService.generatePreview(
                            unifiedData, 
                            currentTemplate, 
                            exportContext
                          );
                          const sectionPreview = preview.sections.find(s => s.id === section.id);
                          
                          return (
                            <div
                              key={section.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground w-6">
                                  {idx + 1}.
                                </span>
                                {getStatusIcon(sectionPreview?.status || "pending")}
                                <div>
                                  <div className="font-medium text-sm">
                                    {exportContext.language === "he" ? section.nameHe : section.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {sectionPreview?.content || ""}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {section.pages} {section.pages === 1 ? "page" : "pages"}
                                </Badge>
                                {section.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Phase-specific info */}
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertTitle>{phaseInfo.label}</AlertTitle>
                    <AlertDescription>
                      {phaseInfo.description}
                      <br />
                      <span className="text-muted-foreground">{phaseInfo.descriptionHe}</span>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating document...
              </span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("word")}
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Word
            </Button>
            
            <Button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="min-w-[140px]"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedExportDialog;
