import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Save,
  CheckCircle,
  FileSearch,
  Settings,
  RefreshCw,
  FileDown,
  FolderOpen
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { SavedCardsDialog } from "@/components/SavedCardsDialog";
import { ProfileIndicator } from "@/components/inspector";
import { useSavedCards } from "@/hooks/useSavedCards";
import type { SavedCard } from "@/contexts/SavedCardsContext";

interface ToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onValidate: () => void;
  reportMode: "Technique" | "Report";
  onReportModeChange: (mode: "Technique" | "Report") => void;
  isSplitMode?: boolean;
  onSplitModeChange?: (value: boolean) => void;
  activePart?: "A" | "B";
  onActivePartChange?: (value: "A" | "B") => void;
  onCopyAToB?: () => void;
  onOpenSavedCards?: () => void;
  onLoadLocalCard?: (card: SavedCard) => void;
}

// Re-export SavedCard type for consumers
export type { SavedCard } from '@/contexts/SavedCardsContext';

export const Toolbar = ({
  onSave,
  onExport,
  onValidate,
  reportMode,
  onReportModeChange,
  isSplitMode = false,
  onSplitModeChange,
  activePart = "A",
  onActivePartChange,
  onCopyAToB,
  onOpenSavedCards,
  onLoadLocalCard
}: ToolbarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSavedCardsOpen, setLocalSavedCardsOpen] = useState(false);
  const { cards } = useSavedCards();
  
  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-2 md:px-3 gap-1 md:gap-2 overflow-x-auto">
      {/* Quick Actions - Compact on mobile */}
      <Button variant="ghost" size="icon" onClick={onSave} title="Save" className="h-8 w-8 md:h-9 md:w-9">
        <Save className="h-3 w-3 md:h-4 md:w-4" />
      </Button>

      {/* Export Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
        title="Export PDF"
        className="h-8 px-2 md:px-3 text-[10px] md:text-xs bg-primary/10 hover:bg-primary/20 text-primary"
      >
        <FileDown className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
        <span className="hidden sm:inline">Export</span>
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
            {isSplitMode && <span className="hidden sm:inline">Part A+B</span>}
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

      {/* Inspector Profile Indicator */}
      <ProfileIndicator className="hidden sm:flex" />

      <Separator orientation="vertical" className="h-6 md:h-8 mx-0.5 md:mx-1 hidden sm:block" />

      {/* Right Side Tools - Hidden on small mobile */}
      <Button
        variant="ghost"
        size="icon"
        title="Local Saved Cards"
        className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex relative"
        onClick={() => setLocalSavedCardsOpen(true)}
      >
        <FolderOpen className="h-3 w-3 md:h-4 md:w-4" />
        {cards.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center">
            {cards.length}
          </span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        title="Settings" 
        className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
      
      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
      
      {/* Local Saved Cards Dialog */}
      <SavedCardsDialog
        open={localSavedCardsOpen}
        onOpenChange={setLocalSavedCardsOpen}
        onLoadCard={(card) => {
          if (onLoadLocalCard) {
            onLoadLocalCard(card);
          }
          setLocalSavedCardsOpen(false);
        }}
      />
    </div>
  );
};
