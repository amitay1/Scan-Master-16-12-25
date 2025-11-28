import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Save, 
  Download, 
  CheckCircle, 
  FileSearch,
  Settings,
  Printer,
  RefreshCw,
  FileDown
} from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onUnifiedExport?: () => void;  // New unified export
  onValidate: () => void;
  reportMode: "Technique" | "Report";
  onReportModeChange: (mode: "Technique" | "Report") => void;
  isSplitMode?: boolean;
  onSplitModeChange?: (value: boolean) => void;
  activePart?: "A" | "B";
  onActivePartChange?: (value: "A" | "B") => void;
  onCopyAToB?: () => void;
}

export const Toolbar = ({ 
  onSave, 
  onExport,
  onUnifiedExport,
  onValidate,
  reportMode,
  onReportModeChange,
  isSplitMode = false,
  onSplitModeChange,
  activePart = "A",
  onActivePartChange,
  onCopyAToB
}: ToolbarProps) => {
  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-2 md:px-3 gap-1 md:gap-2 overflow-x-auto">
      {/* Quick Actions - Compact on mobile */}
      <Button variant="ghost" size="icon" onClick={onSave} title="Save" className="h-8 w-8 md:h-9 md:w-9">
        <Save className="h-3 w-3 md:h-4 md:w-4" />
      </Button>

      {/* Unified Export Button - New */}
      {onUnifiedExport && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onUnifiedExport} 
          title="Unified Export - One complete document"
          className="h-8 px-2 md:px-3 text-[10px] md:text-xs bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <FileDown className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      )}

      {/* Legacy Export - kept for compatibility */}
      <Button variant="ghost" size="icon" onClick={onExport} title="Quick Export (Legacy)" className="h-8 w-8 md:h-9 md:w-9">
        <Download className="h-3 w-3 md:h-4 md:w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={onValidate} title="Validate" className="h-8 w-8 md:h-9 md:w-9">
        <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 md:h-8 mx-0.5 md:mx-1" />

      {/* Split Mode Toggle */}
      {reportMode === "Technique" && onSplitModeChange && (
        <>
          <Button
            variant={isSplitMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSplitModeChange(!isSplitMode)}
            className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
            title="Split to Part A & B"
          >
            <RefreshCw className="h-3 w-3 md:mr-1" />
            <span className="hidden sm:inline">{isSplitMode ? "Part A+B" : "Single Part"}</span>
          </Button>
          
          {isSplitMode && onActivePartChange && (
            <>
              <Button
                variant={activePart === "A" ? "default" : "ghost"}
                size="sm"
                onClick={() => onActivePartChange("A")}
                className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
              >
                A
              </Button>
              <Button
                variant={activePart === "B" ? "default" : "ghost"}
                size="sm"
                onClick={() => onActivePartChange("B")}
                className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
              >
                B
              </Button>
              {onCopyAToB && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopyAToB}
                  className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
                  title="Copy Part A to Part B"
                >
                  A→B
                </Button>
              )}
            </>
          )}
          <Separator orientation="vertical" className="h-6 md:h-8 mx-0.5 md:mx-1" />
        </>
      )}

      {/* Mode Selection - Compact on mobile */}
      <div className="flex gap-0.5 md:gap-1 bg-muted p-0.5 md:p-1 rounded-md">
        <Button
          variant={reportMode === "Technique" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onReportModeChange("Technique")}
          className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
        >
          <FileText className="h-3 w-3 md:mr-1" />
          <span className="hidden sm:inline">Technique</span>
        </Button>
        <Button
          variant={reportMode === "Report" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onReportModeChange("Report")}
          className="h-7 md:h-8 text-[10px] md:text-xs font-medium px-2"
        >
          <FileSearch className="h-3 w-3 md:mr-1" />
          <span className="hidden sm:inline">Report</span>
        </Button>
      </div>

      <div className="flex-1" />

      {/* Right Side Tools - Hidden on small mobile */}
      <Button variant="ghost" size="icon" title="Settings" className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex">
        <Settings className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
    </div>
  );
};
