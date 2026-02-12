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
  FolderOpen,
  Minus,
  X
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
    <div className="h-14 border-b-2 border-border bg-card flex items-center px-3 md:px-4 gap-2 md:gap-3 overflow-x-auto overflow-y-hidden flex-shrink-0">
      {/* Quick Actions - Compact on mobile */}
      <Button variant="ghost" size="icon" onClick={onSave} title="Save" className="h-10 w-10 md:h-11 md:w-11">
        <Save className="h-5 w-5 md:h-5 md:w-5" />
      </Button>

      {/* Export Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
        title="Export PDF"
        className="h-10 px-3 md:px-4 text-sm md:text-base bg-primary/10 hover:bg-primary/20 text-primary font-semibold"
      >
        <FileDown className="h-5 w-5 md:h-5 md:w-5 md:mr-2" />
        <span className="hidden sm:inline">Export</span>
      </Button>

      <Separator orientation="vertical" className="h-8 md:h-10 mx-1 md:mx-2" />

      {/* Mode Selection - Compact on mobile */}
      <div className="flex gap-1 md:gap-2 bg-muted p-1 md:p-1.5 rounded-lg">
        <Button
          variant={reportMode === "Technique" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onReportModeChange("Technique")}
          className="h-9 md:h-10 text-sm md:text-base font-semibold px-3"
        >
          <FileText className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Technique</span>
        </Button>
        <Button
          variant={reportMode === "Report" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onReportModeChange("Report")}
          className="h-9 md:h-10 text-sm md:text-base font-semibold px-3"
        >
          <FileSearch className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Report</span>
        </Button>
      </div>

      <div className="flex-1" />

      {/* Inspector Profile Indicator */}
      <ProfileIndicator className="hidden sm:flex" />

      <Separator orientation="vertical" className="h-8 md:h-10 mx-1 md:mx-2 hidden sm:block" />

      {/* Right Side Tools - Hidden on small mobile */}
      <Button
        variant="ghost"
        size="icon"
        title="Local Saved Cards"
        className="h-10 w-10 md:h-11 md:w-11 hidden sm:flex relative"
        onClick={() => setLocalSavedCardsOpen(true)}
      >
        <FolderOpen className="h-5 w-5 md:h-5 md:w-5" />
        {cards.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {cards.length}
          </span>
        )}
      </Button>
      
      {/* Settings Button - temporarily hidden until settings are fully functional
      <Button 
        variant="ghost" 
        size="icon" 
        title="Settings" 
        className="h-10 w-10 md:h-11 md:w-11 hidden sm:flex"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-5 w-5 md:h-5 md:w-5" />
      </Button>
      */}
      
      {/* Settings Dialog - temporarily disabled
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
      */}
      
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

      <Separator orientation="vertical" className="h-8 md:h-10 mx-1 md:mx-2" />

      {/* Minimize Window Button */}
      <Button
        variant="ghost"
        size="icon"
        title="Minimize"
        className="h-10 w-10 md:h-11 md:w-11 bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/40 hover:border-amber-500 rounded-lg transition-all duration-200"
        onClick={() => {
          if ((window as any).electronAPI?.minimize) {
            (window as any).electronAPI.minimize();
          } else if ((window as any).electron?.minimize) {
            (window as any).electron.minimize();
          }
        }}
      >
        <Minus className="h-5 w-5" strokeWidth={3} />
      </Button>

      {/* Exit / Close Application Button */}
      <Button
        variant="ghost"
        size="icon"
        title="Exit Application"
        className="h-10 w-10 md:h-11 md:w-11 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 hover:border-red-500 rounded-lg transition-all duration-200"
        onClick={() => {
          if ((window as any).electronAPI?.quit) {
            (window as any).electronAPI.quit();
          } else if ((window as any).electron?.quit) {
            (window as any).electron.quit();
          } else {
            window.close();
          }
        }}
      >
        <X className="h-5 w-5" strokeWidth={3} />
      </Button>
    </div>
  );
};
