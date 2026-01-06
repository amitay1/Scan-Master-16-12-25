import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, RotateCcw, Download, Trash2 } from 'lucide-react';
import type { CrashSnapshot } from '@/hooks/useCrashRecovery';

interface ErrorRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryData: CrashSnapshot | null;
  crashCount: number;
  lastCrashTime: string | null;
  onRecover: () => void;
  onDismiss: () => void;
  onExportDiagnostics: () => void;
}

export function ErrorRecoveryDialog({
  open,
  onOpenChange,
  recoveryData,
  crashCount,
  lastCrashTime,
  onRecover,
  onDismiss,
  onExportDiagnostics,
}: ErrorRecoveryDialogProps) {
  const formattedTime = lastCrashTime
    ? new Date(lastCrashTime).toLocaleString()
    : 'Unknown';

  const snapshotTime = recoveryData?.timestamp
    ? new Date(recoveryData.timestamp).toLocaleString()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <DialogTitle>Recovery Available</DialogTitle>
              <DialogDescription>
                The application was not closed properly
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last crash:</span>
              <span className="font-medium">{formattedTime}</span>
            </div>
            {snapshotTime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data saved at:</span>
                <span className="font-medium">{snapshotTime}</span>
              </div>
            )}
            {recoveryData?.activeTab && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active tab:</span>
                <span className="font-medium">{recoveryData.activeTab}</span>
              </div>
            )}
            {crashCount > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total crashes:</span>
                <span className="font-medium text-amber-600">{crashCount}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            We found unsaved data from your previous session. Would you like to restore it?
          </p>

          {crashCount >= 3 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                Multiple crashes detected. Consider exporting diagnostics and contacting support.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportDiagnostics}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-1" />
            Export Diagnostics
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Discard
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onRecover}
              className="flex-1 sm:flex-none"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CrashErrorDialogProps {
  open: boolean;
  error: Error | null;
  componentStack?: string | null;
  onReload: () => void;
  onExportDiagnostics: () => void;
}

export function CrashErrorDialog({
  open,
  error,
  componentStack,
  onReload,
  onExportDiagnostics,
}: CrashErrorDialogProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <DialogTitle>Something went wrong</DialogTitle>
              <DialogDescription>
                An unexpected error occurred
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-mono text-red-700 dark:text-red-400 break-all">
              {error?.message || 'Unknown error'}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Your work has been automatically saved. You can try reloading the application
            or export diagnostics to send to support.
          </p>

          {componentStack && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs"
              >
                {showDetails ? 'Hide' : 'Show'} technical details
              </Button>
              {showDetails && (
                <div className="mt-2 bg-muted rounded-lg p-3 max-h-48 overflow-auto">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportDiagnostics}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-1" />
            Export Diagnostics
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onReload}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reload Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ErrorRecoveryDialog;
