/**
 * Standard Update Banner
 * Shows notifications when standards have been updated
 */

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECENT_STANDARD_UPDATES,
  getCriticalUpdates,
  type StandardUpdateInfo,
} from "@/data/standardVersions";

interface StandardUpdateBannerProps {
  /**
   * Currently selected standard code in the application
   */
  currentStandard?: string;

  /**
   * Whether to show only updates relevant to current standard
   */
  filterByCurrent?: boolean;

  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;

  /**
   * Where to show the banner
   */
  position?: "top" | "inline";
}

const DISMISSED_KEY = "scanmaster_dismissed_updates";

function getImpactBadge(level: StandardUpdateInfo["impactLevel"]) {
  const variants = {
    low: { class: "bg-blue-100 text-blue-700", label: "Low Impact" },
    medium: { class: "bg-yellow-100 text-yellow-700", label: "Medium Impact" },
    high: { class: "bg-orange-100 text-orange-700", label: "High Impact" },
    critical: { class: "bg-red-100 text-red-700", label: "Critical" },
  };

  const variant = variants[level];

  return (
    <Badge variant="outline" className={variant.class}>
      {variant.label}
    </Badge>
  );
}

export function StandardUpdateBanner({
  currentStandard,
  filterByCurrent = false,
  onDismiss,
  position = "top",
}: StandardUpdateBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<StandardUpdateInfo | null>(null);
  const [dismissedUpdates, setDismissedUpdates] = useState<string[]>([]);

  // Load dismissed updates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        setDismissedUpdates(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Get relevant updates
  const relevantUpdates = filterByCurrent && currentStandard
    ? RECENT_STANDARD_UPDATES.filter(
        (u) => u.code.toLowerCase() === currentStandard.toLowerCase()
      )
    : RECENT_STANDARD_UPDATES;

  // Filter out dismissed updates
  const activeUpdates = relevantUpdates.filter(
    (u) => !dismissedUpdates.includes(`${u.code}-${u.newVersion}`)
  );

  // Get critical updates
  const criticalUpdates = activeUpdates.filter(
    (u) => u.impactLevel === "high" || u.impactLevel === "critical"
  );

  // Don't show if no updates
  if (activeUpdates.length === 0) {
    return null;
  }

  const handleDismiss = (update: StandardUpdateInfo) => {
    const key = `${update.code}-${update.newVersion}`;
    const newDismissed = [...dismissedUpdates, key];
    setDismissedUpdates(newDismissed);

    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    } catch {
      // Ignore storage errors
    }

    if (newDismissed.length >= relevantUpdates.length) {
      onDismiss?.();
    }
  };

  const handleDismissAll = () => {
    const allKeys = activeUpdates.map((u) => `${u.code}-${u.newVersion}`);
    const newDismissed = [...new Set([...dismissedUpdates, ...allKeys])];
    setDismissedUpdates(newDismissed);

    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    } catch {
      // Ignore storage errors
    }

    onDismiss?.();
  };

  const handleViewDetails = (update: StandardUpdateInfo) => {
    setSelectedUpdate(update);
    setShowDetailsDialog(true);
  };

  return (
    <>
      <Alert
        className={cn(
          "border-l-4",
          criticalUpdates.length > 0
            ? "border-l-orange-500 bg-orange-50"
            : "border-l-blue-500 bg-blue-50",
          position === "top" && "rounded-none"
        )}
      >
        <div className="flex items-start gap-3">
          {criticalUpdates.length > 0 ? (
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          ) : (
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          )}

          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              Standard Updates Available
              <Badge variant="secondary" className="text-xs">
                {activeUpdates.length} update{activeUpdates.length !== 1 ? "s" : ""}
              </Badge>
            </AlertTitle>

            <AlertDescription className="mt-1">
              {criticalUpdates.length > 0 ? (
                <span className="text-orange-700">
                  {criticalUpdates.length} critical update
                  {criticalUpdates.length !== 1 ? "s" : ""} require your attention
                </span>
              ) : (
                <span>
                  New versions of standards you use are available
                </span>
              )}
            </AlertDescription>

            {/* Collapsible update list */}
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {activeUpdates.map((update) => (
                  <div
                    key={`${update.code}-${update.newVersion}`}
                    className="flex items-center justify-between p-2 bg-white rounded-md border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{update.code}</span>
                      <span className="text-muted-foreground text-sm">
                        {update.oldVersion} → {update.newVersion}
                      </span>
                      {getImpactBadge(update.impactLevel)}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(update)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDismiss(update)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismissAll}
              title="Dismiss all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>

      {/* Update Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Standard Update: {selectedUpdate?.code}
            </DialogTitle>
            <DialogDescription>
              Version {selectedUpdate?.oldVersion} → {selectedUpdate?.newVersion}
              <span className="mx-2">•</span>
              Released {selectedUpdate?.releaseDate}
            </DialogDescription>
          </DialogHeader>

          {selectedUpdate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getImpactBadge(selectedUpdate.impactLevel)}
              </div>

              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedUpdate.summary}
                </p>
              </div>

              {selectedUpdate.criticalChanges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Changes</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {selectedUpdate.criticalChanges.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedUpdate.changelogUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(selectedUpdate.changelogUrl, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Changelog
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact badge version for showing in headers
 */
export function StandardUpdateBadge({
  onClick,
}: {
  onClick?: () => void;
}) {
  const [dismissedUpdates, setDismissedUpdates] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        setDismissedUpdates(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const activeUpdates = RECENT_STANDARD_UPDATES.filter(
    (u) => !dismissedUpdates.includes(`${u.code}-${u.newVersion}`)
  );

  const criticalCount = activeUpdates.filter(
    (u) => u.impactLevel === "high" || u.impactLevel === "critical"
  ).length;

  if (activeUpdates.length === 0) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "relative",
        criticalCount > 0 ? "text-orange-600" : "text-blue-600"
      )}
      onClick={onClick}
    >
      <Bell className="h-4 w-4" />
      <span
        className={cn(
          "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center",
          criticalCount > 0
            ? "bg-orange-500 text-white"
            : "bg-blue-500 text-white"
        )}
      >
        {activeUpdates.length}
      </span>
    </Button>
  );
}
