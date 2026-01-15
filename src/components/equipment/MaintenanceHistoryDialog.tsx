/**
 * Maintenance History Dialog
 * Shows maintenance history for a piece of equipment with option to add new records
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wrench, Plus, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useMaintenanceHistory,
  useAddMaintenance,
} from "@/hooks/useEquipmentTracker";
import type { Equipment, MaintenanceType, MaintenanceFormData } from "@/types/equipment";
import { MAINTENANCE_TYPE_LABELS } from "@/types/equipment";
import { cn } from "@/lib/utils";

interface MaintenanceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
}

const MAINTENANCE_TYPES: MaintenanceType[] = [
  "routine",
  "repair",
  "cleaning",
  "firmware_update",
  "replacement",
  "inspection",
  "other",
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTypeBadgeColor(type: MaintenanceType): string {
  const colors: Record<MaintenanceType, string> = {
    routine: "bg-blue-100 text-blue-700",
    repair: "bg-red-100 text-red-700",
    cleaning: "bg-green-100 text-green-700",
    firmware_update: "bg-purple-100 text-purple-700",
    replacement: "bg-orange-100 text-orange-700",
    inspection: "bg-cyan-100 text-cyan-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[type] || colors.other;
}

function createEmptyFormData(): MaintenanceFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    maintenanceDate: today,
    maintenanceType: "routine",
    description: "",
    performedBy: "",
    cost: "",
    partsReplaced: "",
    downtimeHours: "",
    notes: "",
  };
}

export function MaintenanceHistoryDialog({
  open,
  onOpenChange,
  equipment,
}: MaintenanceHistoryDialogProps) {
  const { toast } = useToast();
  const { data: records = [], isLoading, refetch } = useMaintenanceHistory(
    equipment?.id ?? null
  );
  const addMutation = useAddMaintenance();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormData>(createEmptyFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof MaintenanceFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.maintenanceDate) {
      newErrors.maintenanceDate = "Date is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!equipment) return;
    if (!validateForm()) return;

    try {
      await addMutation.mutateAsync({
        equipmentId: equipment.id,
        data: formData,
      });

      toast({
        title: "Maintenance Recorded",
        description: `Maintenance record added for ${equipment.name}`,
      });

      setShowAddForm(false);
      setFormData(createEmptyFormData());
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add maintenance record";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setFormData(createEmptyFormData());
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Log
          </DialogTitle>
          <DialogDescription>
            {equipment ? (
              <>
                Maintenance records for <strong>{equipment.name}</strong>
                {equipment.serialNumber && ` (S/N: ${equipment.serialNumber})`}
              </>
            ) : (
              "Select equipment to view maintenance history"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Add Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Add Maintenance Record</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maintenanceDate"
                  type="date"
                  value={formData.maintenanceDate}
                  onChange={(e) => updateField("maintenanceDate", e.target.value)}
                  className={errors.maintenanceDate ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Type</Label>
                <Select
                  value={formData.maintenanceType}
                  onValueChange={(value) =>
                    updateField("maintenanceType", value as MaintenanceType)
                  }
                >
                  <SelectTrigger id="maintenanceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {MAINTENANCE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the maintenance performed..."
                rows={2}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performedBy">Performed By</Label>
                <Input
                  id="performedBy"
                  value={formData.performedBy}
                  onChange={(e) => updateField("performedBy", e.target.value)}
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downtimeHours">Downtime (hrs)</Label>
                <Input
                  id="downtimeHours"
                  type="number"
                  step="0.5"
                  min={0}
                  value={formData.downtimeHours}
                  onChange={(e) => updateField("downtimeHours", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {addMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Records Table */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : records.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold">No Maintenance Records</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No maintenance history found for this equipment
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.maintenanceDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(getTypeBadgeColor(record.maintenanceType))}
                      >
                        {MAINTENANCE_TYPE_LABELS[record.maintenanceType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.description}
                    </TableCell>
                    <TableCell>{record.performedBy || "-"}</TableCell>
                    <TableCell className="text-right">
                      {record.cost ? `$${record.cost}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div>
            {!showAddForm && records.length > 0 && (
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
