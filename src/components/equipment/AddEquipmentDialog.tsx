/**
 * Add/Edit Equipment Dialog
 * Form dialog for creating or editing equipment
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Package, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateEquipment,
  useUpdateEquipment,
} from "@/hooks/useEquipmentTracker";
import type {
  Equipment,
  EquipmentFormData,
  EquipmentType,
  EquipmentStatus,
} from "@/types/equipment";
import {
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
} from "@/types/equipment";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null; // If provided, edit mode
  onSuccess?: () => void;
}

const EQUIPMENT_TYPES: EquipmentType[] = [
  "flaw_detector",
  "transducer",
  "cable",
  "wedge",
  "calibration_block",
  "couplant_system",
  "scanner",
  "other",
];

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "active",
  "maintenance",
  "retired",
  "out_of_service",
];

function createEmptyFormData(): EquipmentFormData {
  return {
    name: "",
    type: "flaw_detector",
    manufacturer: "",
    model: "",
    serialNumber: "",
    assetTag: "",
    status: "active",
    location: "",
    lastCalibrationDate: "",
    nextCalibrationDue: "",
    calibrationIntervalDays: 365,
    calibrationProvider: "",
    certificateNumber: "",
    specifications: {},
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    notes: "",
  };
}

export function AddEquipmentDialog({
  open,
  onOpenChange,
  equipment,
  onSuccess,
}: AddEquipmentDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();

  const [formData, setFormData] = useState<EquipmentFormData>(
    createEmptyFormData()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!equipment;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (equipment) {
        // Edit mode: populate form with existing data
        setFormData({
          name: equipment.name,
          type: equipment.type,
          manufacturer: equipment.manufacturer || "",
          model: equipment.model || "",
          serialNumber: equipment.serialNumber || "",
          assetTag: equipment.assetTag || "",
          status: equipment.status,
          location: equipment.location || "",
          lastCalibrationDate: equipment.lastCalibrationDate
            ? equipment.lastCalibrationDate.split("T")[0]
            : "",
          nextCalibrationDue: equipment.nextCalibrationDue
            ? equipment.nextCalibrationDue.split("T")[0]
            : "",
          calibrationIntervalDays: equipment.calibrationIntervalDays || 365,
          calibrationProvider: equipment.calibrationProvider || "",
          certificateNumber: equipment.certificateNumber || "",
          specifications: equipment.specifications || {},
          purchaseDate: equipment.purchaseDate
            ? equipment.purchaseDate.split("T")[0]
            : "",
          warrantyExpiry: equipment.warrantyExpiry
            ? equipment.warrantyExpiry.split("T")[0]
            : "",
          cost: equipment.cost || "",
          notes: equipment.notes || "",
        });
      } else {
        setFormData(createEmptyFormData());
      }
      setErrors({});
    }
  }, [open, equipment]);

  const updateField = (field: keyof EquipmentFormData, value: unknown) => {
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

    if (!formData.name.trim()) {
      newErrors.name = "Equipment name is required";
    }

    if (!formData.type) {
      newErrors.type = "Equipment type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode && equipment) {
        await updateMutation.mutateAsync({
          id: equipment.id,
          data: formData,
        });
        toast({
          title: "Equipment Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await createMutation.mutateAsync(formData);
        toast({
          title: "Equipment Added",
          description: `${formData.name} has been added to your inventory.`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Settings className="h-5 w-5" />
                Edit Equipment
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add New Equipment
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update equipment details and calibration information"
              : "Add a new piece of UT equipment to track"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="calibration" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Calibration
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">
                  Equipment Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., Olympus Epoch 650"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    updateField("type", value as EquipmentType)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {EQUIPMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    updateField("status", value as EquipmentStatus)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {EQUIPMENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => updateField("manufacturer", e.target.value)}
                  placeholder="e.g., Olympus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  placeholder="e.g., Epoch 650"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => updateField("serialNumber", e.target.value)}
                  placeholder="e.g., SN-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetTag">Asset Tag</Label>
                <Input
                  id="assetTag"
                  value={formData.assetTag}
                  onChange={(e) => updateField("assetTag", e.target.value)}
                  placeholder="e.g., UT-001"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g., Lab A, Field Kit 1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastCalibrationDate">Last Calibration</Label>
                <Input
                  id="lastCalibrationDate"
                  type="date"
                  value={formData.lastCalibrationDate}
                  onChange={(e) =>
                    updateField("lastCalibrationDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextCalibrationDue">Next Due Date</Label>
                <Input
                  id="nextCalibrationDue"
                  type="date"
                  value={formData.nextCalibrationDue}
                  onChange={(e) =>
                    updateField("nextCalibrationDue", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calibrationIntervalDays">
                  Calibration Interval (days)
                </Label>
                <Input
                  id="calibrationIntervalDays"
                  type="number"
                  min={1}
                  value={formData.calibrationIntervalDays}
                  onChange={(e) =>
                    updateField(
                      "calibrationIntervalDays",
                      parseInt(e.target.value, 10) || 365
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calibrationProvider">Calibration Provider</Label>
                <Input
                  id="calibrationProvider"
                  value={formData.calibrationProvider}
                  onChange={(e) =>
                    updateField("calibrationProvider", e.target.value)
                  }
                  placeholder="e.g., NIST Certified Lab"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="certificateNumber">Certificate Number</Label>
                <Input
                  id="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={(e) =>
                    updateField("certificateNumber", e.target.value)
                  }
                  placeholder="Latest calibration certificate number"
                />
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => updateField("purchaseDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => updateField("warrantyExpiry", e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                  placeholder="Purchase cost"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Additional notes about this equipment..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading
              ? "Saving..."
              : isEditMode
              ? "Save Changes"
              : "Add Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
