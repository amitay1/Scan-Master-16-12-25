/**
 * Procedure Wizard
 * Multi-step wizard for generating UT inspection procedures
 */

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  ProcedureWizardStep,
  ProcedureWizardData,
} from "@/types/procedure";
import {
  generateProcedure,
  validateWizardData,
  calculateWizardCompletion,
  sectionsToText,
  sectionsToHtml,
} from "@/utils/procedureGenerator";

// Step components
import { StandardStep } from "./steps/StandardStep";
import { ScopeStep } from "./steps/ScopeStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { CalibrationStep } from "./steps/CalibrationStep";
import { ScanStep } from "./steps/ScanStep";
import { AcceptanceStep } from "./steps/AcceptanceStep";
import { DocumentationStep } from "./steps/DocumentationStep";
import { ReviewStep } from "./steps/ReviewStep";

interface ProcedureWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (procedure: string, format: "text" | "html" | "docx") => void;
}

const STEPS: { id: ProcedureWizardStep; label: string; shortLabel: string }[] = [
  { id: "standard", label: "Select Standard", shortLabel: "Standard" },
  { id: "scope", label: "Define Scope", shortLabel: "Scope" },
  { id: "equipment", label: "Equipment Requirements", shortLabel: "Equipment" },
  { id: "calibration", label: "Calibration", shortLabel: "Calibration" },
  { id: "scan", label: "Scan Procedure", shortLabel: "Scan" },
  { id: "acceptance", label: "Acceptance Criteria", shortLabel: "Accept" },
  { id: "documentation", label: "Documentation", shortLabel: "Docs" },
  { id: "review", label: "Review & Generate", shortLabel: "Review" },
];

export function ProcedureWizard({
  open,
  onOpenChange,
  onComplete,
}: ProcedureWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<ProcedureWizardData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const currentStepId = STEPS[currentStep].id;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  const completion = calculateWizardCompletion(wizardData);

  // Update wizard data
  const updateData = useCallback(
    (updates: Partial<ProcedureWizardData>) => {
      setWizardData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Navigation
  const goNext = () => {
    const { valid, errors } = validateWizardData(wizardData, currentStepId);

    if (!valid && currentStepId !== "review") {
      toast({
        title: "Incomplete Step",
        description: errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Only allow going to completed steps or the next step
    if (stepIndex <= currentStep || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  // Generate procedure
  const handleGenerate = async (format: "text" | "html") => {
    setIsGenerating(true);

    try {
      const result = generateProcedure(wizardData, {
        procedureNumber: `PROC-${Date.now().toString(36).toUpperCase()}`,
        revision: "A",
        preparedBy: "",
        approvedBy: "",
      });

      let content: string;
      if (format === "html") {
        content = `
<!DOCTYPE html>
<html>
<head>
  <title>${result.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    h3 { color: #666; }
    ul { margin-left: 20px; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${result.title}</h1>
  ${sectionsToHtml(result.sections)}
</body>
</html>`;
      } else {
        content = `${result.title}\n${"=".repeat(result.title.length)}\n\n${sectionsToText(result.sections)}`;
      }

      setPreviewContent(content);
      onComplete?.(content, format);

      toast({
        title: "Procedure Generated",
        description: "Your procedure document is ready for download.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Download procedure
  const handleDownload = (format: "text" | "html") => {
    if (!previewContent) {
      handleGenerate(format);
      return;
    }

    const blob = new Blob([previewContent], {
      type: format === "html" ? "text/html" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procedure.${format === "html" ? "html" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset wizard
  const handleReset = () => {
    setWizardData({});
    setCurrentStep(0);
    setPreviewContent(null);
  };

  // Render current step
  const renderStep = () => {
    const props = { data: wizardData, onUpdate: updateData };

    switch (currentStepId) {
      case "standard":
        return <StandardStep {...props} />;
      case "scope":
        return <ScopeStep {...props} />;
      case "equipment":
        return <EquipmentStep {...props} />;
      case "calibration":
        return <CalibrationStep {...props} />;
      case "scan":
        return <ScanStep {...props} />;
      case "acceptance":
        return <AcceptanceStep {...props} />;
      case "documentation":
        return <DocumentationStep {...props} />;
      case "review":
        return (
          <ReviewStep
            data={wizardData}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            isGenerating={isGenerating}
            previewContent={previewContent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Procedure Writer Wizard
          </DialogTitle>
          <DialogDescription>
            Generate a customized UT inspection procedure step by step
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-muted-foreground">{completion}% complete</span>
          </div>
          <Progress value={(currentStep / (STEPS.length - 1)) * 100} />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const { valid } = validateWizardData(wizardData, step.id);

            return (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && valid && "bg-green-100 text-green-700",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  index > currentStep && "opacity-50 cursor-not-allowed"
                )}
                disabled={index > currentStep + 1}
              >
                {isCompleted && valid ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Current step content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4">{renderStep()}</div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={goBack} disabled={isFirstStep}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>

            {isLastStep ? (
              <Button onClick={() => handleGenerate("html")} disabled={isGenerating}>
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Procedure
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
