/**
 * Add Calibration Dialog
 * Form for adding a new calibration record
 */

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddCalibration } from "@/hooks/useEquipmentTracker";
import type { Equipment, CalibrationFormData, CalibrationResult } from "@/types/equipment";
import { CALIBRATION_RESULT_LABELS } from "@/types/equipment";

interface AddCalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSuccess?: () => void;
}

const CALIBRATION_RESULTS: CalibrationResult[] = ["pass", "fail", "adjusted", "limited"];

function createEmptyFormData(equipment: Equipment | null): CalibrationFormData {
  const today = new Date().toISOString().split("T")[0];

  // Calculate next due date based on equipment's interval
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + (equipment?.calibrationIntervalDays || 365));
  const nextDueStr = nextDue.toISOString().split("T")[0];

  return {
    calibrationDate: today,
    nextDueDate: nextDueStr,
    performedBy: "",
    calibrationProvider: equipment?.calibrationProvider || "",
    certificateNumber: "",
    certificateUrl: "",
    result: "pass",
    deviationNotes: "",
    cost: "",
    notes: "",
  };
}

export function AddCalibrationDialog({
  open,
  onOpenChange,
  equipment,
  onSuccess,
}: AddCalibrationDialogProps) {
  const { toast } = useToast();
  const addCalibrationMutation = useAddCalibration();

  const [formData, setFormData] = useState<CalibrationFormData>(
    createEmptyFormData(equipment)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(createEmptyFormData(equipment));
      setErrors({});
    }
  }, [open, equipment]);

  const updateField = (field: keyof CalibrationFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Auto-calculate next due date when calibration date changes
  const handleCalibrationDateChange = (value: string) => {
    updateField("calibrationDate", value);

    if (value && equipment?.calibrationIntervalDays) {
      const calDate = new Date(value);
      calDate.setDate(calDate.getDate() + equipment.calibrationIntervalDays);
      updateField("nextDueDate", calDate.toISOString().split("T")[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.calibrationDate) {
      newErrors.calibrationDate = "Calibration date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!equipment) return;
    if (!validateForm()) return;

    try {
      await addCalibrationMutation.mutateAsync({
        equipmentId: equipment.id,
        data: formData,
      });

      toast({
        title: "Calibration Recorded",
        description: `Calibration record added for ${equipment.name}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add calibration";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isLoading = addCalibrationMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add Calibration Record
          </DialogTitle>
          <DialogDescription>
            {equipment ? (
              <>
                Record a calibration for <strong>{equipment.name}</strong>
              </>
            ) : (
              "Select equipment to add calibration"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calibrationDate">
                Calibration Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="calibrationDate"
                type="date"
                value={formData.calibrationDate}
                onChange={(e) => handleCalibrationDateChange(e.target.value)}
                className={errors.calibrationDate ? "border-destructive" : ""}
              />
              {errors.calibrationDate && (
                <p className="text-xs text-destructive">{errors.calibrationDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select
                value={formData.result}
                onValueChange={(value) =>
                  updateField("result", value as CalibrationResult)
                }
              >
                <SelectTrigger id="result">
                  <SelectValue placeholder="Select result..." />
                </SelectTrigger>
                <SelectContent>
                  {CALIBRATION_RESULTS.map((result) => (
                    <SelectItem key={result} value={result}>
                      {CALIBRATION_RESULT_LABELS[result]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Next Due Date</Label>
            <Input
              id="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => updateField("nextDueDate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated based on {equipment?.calibrationIntervalDays || 365} day
              interval
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="performedBy">Performed By</Label>
              <Input
                id="performedBy"
                value={formData.performedBy}
                onChange={(e) => updateField("performedBy", e.target.value)}
                placeholder="Name or ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calibrationProvider">Calibration Lab</Label>
              <Input
                id="calibrationProvider"
                value={formData.calibrationProvider}
                onChange={(e) => updateField("calibrationProvider", e.target.value)}
                placeholder="Lab name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => updateField("certificateNumber", e.target.value)}
                placeholder="Cert-12345"
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
                placeholder="0.00"
              />
            </div>
          </div>

          {(formData.result === "fail" || formData.result === "adjusted") && (
            <div className="space-y-2">
              <Label htmlFor="deviationNotes">Deviation Notes</Label>
              <Textarea
                id="deviationNotes"
                value={formData.deviationNotes}
                onChange={(e) => updateField("deviationNotes", e.target.value)}
                placeholder="Describe any deviations or adjustments made..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !equipment}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Add Calibration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
