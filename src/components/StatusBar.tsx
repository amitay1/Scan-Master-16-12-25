import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Wifi, WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";

interface StatusBarProps {
  completionPercent: number;
  requiredFieldsComplete: number;
  totalRequiredFields: number;
  autoSaveStatus?: AutoSaveStatus;
  lastSaved?: Date | null;
}

export const StatusBar = ({
  completionPercent,
  requiredFieldsComplete,
  totalRequiredFields,
  autoSaveStatus = 'idle',
  lastSaved
}: StatusBarProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getAutoSaveDisplay = () => {
    switch (autoSaveStatus) {
      case 'pending':
        return {
          icon: <Cloud className="h-3 w-3 text-muted-foreground" />,
          text: 'Changes pending...',
          color: 'text-muted-foreground'
        };
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-500'
        };
      case 'saved':
        return {
          icon: <Cloud className="h-3 w-3 text-success" />,
          text: lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved',
          color: 'text-success'
        };
      case 'error':
        return {
          icon: <CloudOff className="h-3 w-3 text-destructive" />,
          text: 'Save failed',
          color: 'text-destructive'
        };
      default:
        return null;
    }
  };

  const autoSaveDisplay = getAutoSaveDisplay();

  return (
    <div className="h-7 border-t border-border bg-card flex items-center px-3 text-xs text-muted-foreground flex-shrink-0 overflow-hidden">
      {/* Connection Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 text-success" />
            <span className="text-success font-medium">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-warning" />
            <span className="text-warning font-medium">Offline</span>
          </>
        )}
      </div>

      <Separator orientation="vertical" className="h-4 mx-3" />

      {/* Auto-save Status */}
      {autoSaveDisplay && (
        <>
          <div className="flex items-center gap-1.5">
            {autoSaveDisplay.icon}
            <span className={autoSaveDisplay.color}>{autoSaveDisplay.text}</span>
          </div>
          <Separator orientation="vertical" className="h-4 mx-3" />
        </>
      )}

      {/* Completion Status */}
      <div className="flex items-center gap-1.5">
        {completionPercent === 100 ? (
          <CheckCircle className="h-3 w-3 text-success" />
        ) : (
          <AlertCircle className="h-3 w-3 text-warning" />
        )}
        <span>
          Progress: {Math.round(completionPercent)}%
          ({requiredFieldsComplete}/{totalRequiredFields} fields)
        </span>
      </div>

      <div className="flex-1" />

      {/* Version Info */}
      <span className="font-mono">v1.0.0</span>
    </div>
  );
};
