import React, { useState, useEffect, useCallback } from "react";
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
  Square,
  X,
  Download,
  Rocket
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { SavedCardsDialog } from "@/components/SavedCardsDialog";
import { ProfileIndicator } from "@/components/inspector";
import { useSavedCards } from "@/hooks/useSavedCards";
import type { SavedCard } from "@/contexts/SavedCardsContext";

// Safe access to electron API
const getElectron = (): any => {
  if (typeof window !== 'undefined' && 'electron' in window) {
    return (window as any).electron;
  }
  return undefined;
};

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

function useUpdateStatus() {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const electron = getElectron();
    if (!electron?.onUpdateStatus) return;

    const handler = (_event: unknown, status: any) => {
      switch (status.status) {
        case 'checking':
          setState('checking');
          break;
        case 'available':
          setState('available');
          if (status.version) setVersion(status.version);
          break;
        case 'downloading':
          setState('downloading');
          setPercent(Math.round(status.percent || 0));
          break;
        case 'downloaded':
          setState('ready');
          if (status.version) setVersion(status.version);
          break;
        case 'not-available':
          setState('idle');
          break;
        case 'error':
          setState('error');
          break;
      }
    };

    electron.onUpdateStatus(handler);

    // Check if update was already downloaded
    electron.getUpdateInfo?.().then((info: any) => {
      if (info?.updateDownloaded) {
        setState('ready');
        setVersion(info.updateVersion);
      } else if (info?.updateAvailable) {
        setState('available');
        setVersion(info.updateVersion);
      }
    });

    return () => {
      electron.removeUpdateListener?.(handler);
    };
  }, []);

  const checkForUpdates = useCallback(() => {
    const electron = getElectron();
    if (electron?.forceCheckUpdates) {
      electron.forceCheckUpdates();
    } else if (electron?.checkForUpdates) {
      electron.checkForUpdates();
    }
    setState('checking');
  }, []);

  const installUpdate = useCallback(() => {
    getElectron()?.installUpdate?.(true);
  }, []);

  return { state, version, percent, checkForUpdates, installUpdate };
}

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
  const { state: updateState, version: updateVersion, percent: updatePercent, checkForUpdates, installUpdate } = useUpdateStatus();
  
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

      {/* Update Button - always visible, changes based on update state */}
      {updateState === 'ready' ? (
        <Button
          variant="ghost"
          size="sm"
          title={`Install Update v${updateVersion} - Click to update now`}
          className="h-10 px-3 md:px-4 flex items-center bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold animate-pulse"
          onClick={installUpdate}
        >
          <Rocket className="h-5 w-5 mr-2" />
          <span>Update v{updateVersion}</span>
        </Button>
      ) : updateState === 'downloading' ? (
        <Button
          variant="ghost"
          size="sm"
          title={`Downloading update... ${updatePercent}%`}
          className="h-10 px-3 md:px-4 flex items-center bg-blue-500/20 text-blue-400 font-semibold cursor-default"
          disabled
        >
          <Download className="h-5 w-5 mr-2 animate-bounce" />
          <span>{updatePercent}%</span>
        </Button>
      ) : updateState === 'available' ? (
        <Button
          variant="ghost"
          size="sm"
          title={`Update v${updateVersion} available - downloading...`}
          className="h-10 px-3 md:px-4 flex items-center bg-yellow-500/20 text-yellow-400 font-semibold"
          disabled
        >
          <Download className="h-5 w-5 mr-2 animate-spin" />
          <span>v{updateVersion}</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          title="Check for Updates"
          className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center ${updateState === 'checking' ? 'animate-spin' : ''}`}
          onClick={checkForUpdates}
          disabled={updateState === 'checking'}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      )}

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

      {/* Window Controls Group */}
      <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 border border-slate-700/50 shadow-lg shadow-black/20">
        {/* Minimize */}
        <button
          title="Minimize"
          className="group relative h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-amber-500/90 hover:shadow-md hover:shadow-amber-500/25 active:scale-90"
          onClick={() => {
            if ((window as any).electronAPI?.minimize) {
              (window as any).electronAPI.minimize();
            } else if ((window as any).electron?.minimize) {
              (window as any).electron.minimize();
            }
          }}
        >
          <Minus className="h-4 w-4 text-amber-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>

        {/* Maximize / Restore */}
        <button
          title="Maximize / Restore"
          className="group relative h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-blue-500/90 hover:shadow-md hover:shadow-blue-500/25 active:scale-90"
          onClick={() => {
            if ((window as any).electronAPI?.maximize) {
              (window as any).electronAPI.maximize();
            } else if ((window as any).electron?.maximize) {
              (window as any).electron.maximize();
            }
          }}
        >
          <Square className="h-3.5 w-3.5 text-blue-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>

        {/* Close */}
        <button
          title="Exit Application"
          className="group relative h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-red-500/90 hover:shadow-md hover:shadow-red-500/25 active:scale-90"
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
          <X className="h-4 w-4 text-red-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
