/**
 * Export Dialog - Professional & Complete
 */

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  FileIcon,
  Loader2,
  X,
  CheckCircle2,
  FileWarning,
  Sparkles,
  Upload,
  Building2,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData as TechniqueDocumentationData,
  ScanPlanData,
} from "@/types/techniqueSheet";
import type { InspectionReportData } from "@/types/inspectionReport";
import type { ScanDetailsData } from "@/types/scanDetails";
import type { ExportTemplate } from "@/types/unifiedInspection";

import { exportTechniqueSheetPDF } from "@/utils/export/TechniqueSheetPDF";

interface UnifiedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: TechniqueDocumentationData;
  inspectionReport?: InspectionReportData;
  scanDetails?: ScanDetailsData;
  scanPlan?: ScanPlanData;            // Scan plan documents
  capturedDrawing?: string;
  calibrationBlockDiagram?: string;
  angleBeamDiagram?: string;           // Angle beam calibration block diagram
  e2375Diagram?: string;               // ASTM E2375 scan directions diagram
  scanDirectionsDrawing?: string;
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
  scanDetails,
  scanPlan,
  capturedDrawing,
  calibrationBlockDiagram,
  angleBeamDiagram,
  e2375Diagram,
  scanDirectionsDrawing,
  onExport,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "word">("pdf");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file must be smaller than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
        setLogoFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoFileName(null);
  };

  // Calculate readiness with detailed breakdown
  const readinessData = useMemo(() => {
    const sections = [
      {
        name: "Part Information",
        fields: [
          { name: "Part Number", value: inspectionSetup.partNumber },
          { name: "Part Name", value: inspectionSetup.partName },
          { name: "Material", value: inspectionSetup.material },
          { name: "Part Type", value: inspectionSetup.partType },
        ]
      },
      {
        name: "Equipment",
        fields: [
          { name: "Manufacturer", value: equipment.manufacturer },
          { name: "Model", value: equipment.model },
          { name: "Frequency", value: equipment.frequency },
        ]
      },
      {
        name: "Calibration",
        fields: [
          { name: "Standard Type", value: calibration.standardType },
          { name: "Reference Material", value: calibration.referenceMaterial },
        ]
      },
      {
        name: "Acceptance",
        fields: [
          { name: "Acceptance Class", value: acceptanceCriteria.acceptanceClass },
        ]
      },
      {
        name: "Documentation",
        fields: [
          { name: "Inspector Name", value: documentation.inspectorName },
          { name: "Inspector Level", value: documentation.inspectorLevel },
        ]
      },
    ];

    let totalFilled = 0;
    let totalFields = 0;

    sections.forEach(section => {
      section.fields.forEach(field => {
        totalFields++;
        if (field.value && field.value !== "") totalFilled++;
      });
    });

    return {
      sections,
      percentage: Math.round((totalFilled / totalFields) * 100),
      filled: totalFilled,
      total: totalFields,
    };
  }, [inspectionSetup, equipment, calibration, acceptanceCriteria, documentation]);

  const handleExport = async (format: "pdf" | "word") => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      await new Promise(r => setTimeout(r, 400));

      if (format === "pdf") {
        exportTechniqueSheetPDF({
          standard,
          inspectionSetup,
          equipment,
          calibration,
          scanParameters,
          acceptanceCriteria,
          documentation,
          scanDetails,
          scanPlan,
          capturedDrawing,
          calibrationBlockDiagram,
          angleBeamDiagram,
          e2375Diagram,
          scanDirectionsDrawing,
        }, {
          companyName: companyName || undefined,
          companyLogo: companyLogo || undefined,
        });
      } else {
        // Word export - coming soon
        console.log("Word export - coming soon");
        alert("Word export is coming soon!");
      }

      onExport?.(format, "custom");

      setTimeout(() => {
        onOpenChange(false);
      }, 500);

    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 600);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusBg = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Export Document</h2>
              <p className="text-sm text-slate-400">Professional technique sheet</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* Document Info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-sm">Professional Format</div>
                <div className="text-xs text-slate-500">10+ pages, A4, all sections included</div>
              </div>
            </div>
            <div className={cn("text-2xl font-bold", getStatusColor(readinessData.percentage))}>
              {readinessData.percentage}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Document completeness</span>
              <span className="font-medium">{readinessData.filled} / {readinessData.total} fields</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getStatusBg(readinessData.percentage))}
                style={{ width: `${readinessData.percentage}%` }}
              />
            </div>
          </div>

          {/* Sections Status */}
          <div className="grid grid-cols-5 gap-2">
            {readinessData.sections.map((section) => {
              const sectionFilled = section.fields.filter(f => f.value && f.value !== "").length;
              const sectionTotal = section.fields.length;
              const isComplete = sectionFilled === sectionTotal;

              return (
                <div
                  key={section.name}
                  className={cn(
                    "text-center p-2 rounded-lg border transition-colors",
                    isComplete
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  ) : (
                    <FileWarning className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                  )}
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
                    {section.name}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {sectionFilled}/{sectionTotal}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Export Format</div>
            <div className="grid grid-cols-2 gap-3">
              {/* PDF Option */}
              <button
                onClick={() => !isExporting && handleExport("pdf")}
                disabled={isExporting}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  isExporting && exportFormat === "pdf"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                {isExporting && exportFormat === "pdf" ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">PDF</div>
                  <div className="text-[10px] text-slate-500">Ready to export</div>
                </div>
              </button>

              {/* Word Option - Disabled */}
              <div
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-not-allowed opacity-50",
                  "border-slate-200 dark:border-slate-700"
                )}
                title="Word export coming soon"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-400 flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-400">Word</div>
                  <div className="text-[10px] text-slate-400">Coming soon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Logo Upload */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Logo</div>
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <div className="flex items-center gap-3 flex-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <img src={companyLogo} alt="Logo" className="h-10 w-10 object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                      {logoFileName || "Logo uploaded"}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      Will appear on all pages
                    </div>
                  </div>
                  <button onClick={removeLogo} className="p-1.5 text-emerald-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove logo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Click to upload company logo</span>
                </label>
              )}
            </div>
          </div>

          {/* Warning for low completion */}
          {readinessData.percentage < 50 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <FileWarning className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-700 dark:text-amber-300">Low completeness</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Fill in more fields for a complete professional document
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>

            <Button
              size="lg"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className={cn(
                "px-6 font-medium rounded-xl",
                "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
                "shadow-lg shadow-blue-500/20"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedExportDialog;
