/**
 * Calibration History Dialog
 * Shows calibration history for a piece of equipment
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Calendar, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useCalibrationHistory } from "@/hooks/useEquipmentTracker";
import type { Equipment, CalibrationResult } from "@/types/equipment";
import { CALIBRATION_RESULT_LABELS } from "@/types/equipment";
import { cn } from "@/lib/utils";

interface CalibrationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getResultBadge(result: CalibrationResult) {
  const variants: Record<CalibrationResult, { class: string; icon: React.ReactNode }> = {
    pass: {
      class: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    fail: {
      class: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3 w-3" />,
    },
    adjusted: {
      class: "bg-yellow-100 text-yellow-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    limited: {
      class: "bg-orange-100 text-orange-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const variant = variants[result] || variants.pass;

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1", variant.class)}>
      {variant.icon}
      {CALIBRATION_RESULT_LABELS[result]}
    </Badge>
  );
}

export function CalibrationHistoryDialog({
  open,
  onOpenChange,
  equipment,
}: CalibrationHistoryDialogProps) {
  const { data: calibrations = [], isLoading } = useCalibrationHistory(
    equipment?.id ?? null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Calibration History
          </DialogTitle>
          <DialogDescription>
            {equipment ? (
              <>
                Calibration records for <strong>{equipment.name}</strong>
                {equipment.serialNumber && ` (S/N: ${equipment.serialNumber})`}
              </>
            ) : (
              "Select equipment to view calibration history"
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : calibrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold">No Calibration Records</h3>
              <p className="text-sm text-muted-foreground">
                No calibration history found for this equipment
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calibrations.map((cal) => (
                  <TableRow key={cal.id}>
                    <TableCell className="font-medium">
                      {formatDate(cal.calibrationDate)}
                    </TableCell>
                    <TableCell>{getResultBadge(cal.result)}</TableCell>
                    <TableCell>{formatDate(cal.nextDueDate)}</TableCell>
                    <TableCell>{cal.calibrationProvider || "-"}</TableCell>
                    <TableCell>
                      {cal.certificateNumber ? (
                        cal.certificateUrl ? (
                          <a
                            href={cal.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {cal.certificateNumber}
                          </a>
                        ) : (
                          cal.certificateNumber
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{cal.performedBy || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
