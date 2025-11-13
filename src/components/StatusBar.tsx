import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StatusBarProps {
  completionPercent: number;
  requiredFieldsComplete: number;
  totalRequiredFields: number;
}

export const StatusBar = ({ 
  completionPercent, 
  requiredFieldsComplete, 
  totalRequiredFields 
}: StatusBarProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

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

  return (
    <div className="h-7 border-t border-border bg-card flex items-center px-3 text-xs text-muted-foreground">
      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
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

      <Separator orientation="vertical" className="h-4 mx-3" />

      {/* Last Saved */}
      <span>
        Last saved: {lastSaved.toLocaleTimeString()}
      </span>

      <div className="flex-1" />

      {/* Version Info */}
      <span className="font-mono">v1.0.0</span>
    </div>
  );
};
