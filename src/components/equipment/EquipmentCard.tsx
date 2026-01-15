/**
 * Equipment Card Component
 * Displays individual equipment with calibration status
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreVertical,
  Pencil,
  Trash2,
  History,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Equipment,
  CalibrationStatus,
} from "@/types/equipment";
import {
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  CALIBRATION_STATUS_COLORS,
  EQUIPMENT_STATUS_COLORS,
} from "@/types/equipment";

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onViewCalibrations: (equipment: Equipment) => void;
  onViewMaintenance: (equipment: Equipment) => void;
  onAddCalibration: (equipment: Equipment) => void;
}

// Get icon for calibration status
function getCalibrationStatusIcon(status: CalibrationStatus) {
  switch (status) {
    case "valid":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "due_soon":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "overdue":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Calculate days until calibration due
function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function EquipmentCard({
  equipment,
  onEdit,
  onDelete,
  onViewCalibrations,
  onViewMaintenance,
  onAddCalibration,
}: EquipmentCardProps) {
  const calibrationStatus = equipment.calibrationStatus || "unknown";
  const daysUntilDue = getDaysUntilDue(equipment.nextCalibrationDue);

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Equipment Icon/Status */}
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              EQUIPMENT_STATUS_COLORS[equipment.status]
            )}
          >
            {getCalibrationStatusIcon(calibrationStatus)}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{equipment.name}</h3>
              <Badge variant="outline" className="text-xs">
                {EQUIPMENT_TYPE_LABELS[equipment.type]}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground space-y-0.5">
              {equipment.manufacturer && (
                <p className="truncate">
                  {equipment.manufacturer}
                  {equipment.model && ` - ${equipment.model}`}
                </p>
              )}
              {equipment.serialNumber && (
                <p className="truncate">S/N: {equipment.serialNumber}</p>
              )}
            </div>

            {/* Calibration Status */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md",
                        CALIBRATION_STATUS_COLORS[calibrationStatus]
                      )}
                    >
                      {getCalibrationStatusIcon(calibrationStatus)}
                      <span className="capitalize">
                        {calibrationStatus === "due_soon"
                          ? "Due Soon"
                          : calibrationStatus}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p>
                        <strong>Last Calibration:</strong>{" "}
                        {formatDate(equipment.lastCalibrationDate)}
                      </p>
                      <p>
                        <strong>Next Due:</strong>{" "}
                        {formatDate(equipment.nextCalibrationDue)}
                      </p>
                      {daysUntilDue !== null && (
                        <p>
                          <strong>
                            {daysUntilDue > 0
                              ? `${daysUntilDue} days remaining`
                              : `${Math.abs(daysUntilDue)} days overdue`}
                          </strong>
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  equipment.status !== "active" && "opacity-60"
                )}
              >
                {EQUIPMENT_STATUS_LABELS[equipment.status]}
              </Badge>

              {equipment.location && (
                <span className="text-muted-foreground truncate">
                  {equipment.location}
                </span>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(equipment)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Equipment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAddCalibration(equipment)}>
                <Calendar className="h-4 w-4 mr-2" />
                Add Calibration
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewCalibrations(equipment)}>
                <History className="h-4 w-4 mr-2" />
                Calibration History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewMaintenance(equipment)}>
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance Log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(equipment)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
