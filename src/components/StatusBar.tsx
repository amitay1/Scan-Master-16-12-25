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
          icon: <Cloud className="h-5 w-5 text-muted-foreground" />,
          text: 'Changes pending...',
          color: 'text-muted-foreground'
        };
      case 'saving':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-500'
        };
      case 'saved':
        return {
          icon: <Cloud className="h-5 w-5 text-success" />,
          text: lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved',
          color: 'text-success'
        };
      case 'error':
        return {
          icon: <CloudOff className="h-5 w-5 text-destructive" />,
          text: 'Save failed',
          color: 'text-destructive'
        };
      default:
        return null;
    }
  };

  const autoSaveDisplay = getAutoSaveDisplay();

  return (
    <div className="h-12 border-t-2 border-border bg-card flex items-center px-5 text-base text-muted-foreground flex-shrink-0 overflow-hidden">
      {/* Connection Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5 text-success" />
            <span className="text-success font-semibold text-base">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 text-warning" />
            <span className="text-warning font-semibold text-base">Offline</span>
          </>
        )}
      </div>

      <Separator orientation="vertical" className="h-6 mx-4" />

      {/* Auto-save Status */}
      {autoSaveDisplay && (
        <>
          <div className="flex items-center gap-2">
            {autoSaveDisplay.icon}
            <span className={`${autoSaveDisplay.color} text-base`}>{autoSaveDisplay.text}</span>
          </div>
          <Separator orientation="vertical" className="h-6 mx-4" />
        </>
      )}

      {/* Completion Status */}
      <div className="flex items-center gap-2">
        {completionPercent === 100 ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
        <span className="text-base font-medium">
          Progress: {Math.round(completionPercent)}%
          ({requiredFieldsComplete}/{totalRequiredFields} fields)
        </span>
      </div>

      <div className="flex-1" />

      {/* Version Info */}
      <span className="font-mono text-base font-semibold">v1.0.0</span>
    </div>
  );
};
