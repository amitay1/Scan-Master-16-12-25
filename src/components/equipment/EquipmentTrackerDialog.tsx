/**
 * Equipment Tracker Dialog
 * Main dialog for managing UT equipment inventory
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEquipment,
  useEquipmentStats,
  useDeleteEquipment,
} from "@/hooks/useEquipmentTracker";
import { EquipmentCard } from "./EquipmentCard";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { CalibrationHistoryDialog } from "./CalibrationHistoryDialog";
import { MaintenanceHistoryDialog } from "./MaintenanceHistoryDialog";
import { AddCalibrationDialog } from "./AddCalibrationDialog";
import type { Equipment, EquipmentType, EquipmentStatus } from "@/types/equipment";
import { EQUIPMENT_TYPE_LABELS, EQUIPMENT_STATUS_LABELS } from "@/types/equipment";
import { cn } from "@/lib/utils";

interface EquipmentTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentTrackerDialog({
  open,
  onOpenChange,
}: EquipmentTrackerDialogProps) {
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EquipmentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "all">("all");

  // Sub-dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [calibrationDialogEquipment, setCalibrationDialogEquipment] = useState<Equipment | null>(null);
  const [maintenanceDialogEquipment, setMaintenanceDialogEquipment] = useState<Equipment | null>(null);
  const [addCalibrationEquipment, setAddCalibrationEquipment] = useState<Equipment | null>(null);
  const [deleteConfirmEquipment, setDeleteConfirmEquipment] = useState<Equipment | null>(null);

  // Queries
  const { data: equipment = [], isLoading, refetch } = useEquipment({
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: stats } = useEquipmentStats();
  const deleteMutation = useDeleteEquipment();

  // Filter equipment by search query
  const filteredEquipment = equipment.filter((eq) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(query) ||
      eq.manufacturer?.toLowerCase().includes(query) ||
      eq.model?.toLowerCase().includes(query) ||
      eq.serialNumber?.toLowerCase().includes(query) ||
      eq.assetTag?.toLowerCase().includes(query)
    );
  });

  // Handlers
  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setAddDialogOpen(true);
  };

  const handleDelete = (eq: Equipment) => {
    setDeleteConfirmEquipment(eq);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmEquipment) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmEquipment.id);
      toast({
        title: "Equipment Deleted",
        description: `${deleteConfirmEquipment.name} has been removed.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete equipment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setDeleteConfirmEquipment(null);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setEditingEquipment(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipment Tracker
            </DialogTitle>
            <DialogDescription>
              Manage your UT equipment inventory and calibration schedules
            </DialogDescription>
          </DialogHeader>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-4 gap-3 py-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Equipment</p>
              </div>
              <div className={cn(
                "p-3 rounded-lg text-center",
                stats.calibrationOverdue > 0 ? "bg-red-100 text-red-700" : "bg-muted/50"
              )}>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  {stats.calibrationOverdue > 0 && <AlertTriangle className="h-5 w-5" />}
                  {stats.calibrationOverdue}
                </p>
                <p className="text-xs">Overdue</p>
              </div>
              <div className={cn(
                "p-3 rounded-lg text-center",
                stats.calibrationDueSoon > 0 ? "bg-yellow-100 text-yellow-700" : "bg-muted/50"
              )}>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  {stats.calibrationDueSoon > 0 && <Clock className="h-5 w-5" />}
                  {stats.calibrationDueSoon}
                </p>
                <p className="text-xs">Due Soon</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-700 text-center">
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-5 w-5" />
                  {stats.active}
                </p>
                <p className="text-xs">Active</p>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as EquipmentType | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EQUIPMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as EquipmentStatus | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          {/* Equipment List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading equipment...</p>
                </div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">No Equipment Found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {equipment.length === 0
                    ? "Start by adding your first piece of equipment"
                    : "No equipment matches your search criteria"}
                </p>
                {equipment.length === 0 && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {filteredEquipment.map((eq) => (
                  <EquipmentCard
                    key={eq.id}
                    equipment={eq}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewCalibrations={setCalibrationDialogEquipment}
                    onViewMaintenance={setMaintenanceDialogEquipment}
                    onAddCalibration={setAddCalibrationEquipment}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Equipment Dialog */}
      <AddEquipmentDialog
        open={addDialogOpen}
        onOpenChange={handleAddDialogClose}
        equipment={editingEquipment}
        onSuccess={() => refetch()}
      />

      {/* Calibration History Dialog */}
      <CalibrationHistoryDialog
        open={!!calibrationDialogEquipment}
        onOpenChange={() => setCalibrationDialogEquipment(null)}
        equipment={calibrationDialogEquipment}
      />

      {/* Maintenance History Dialog */}
      <MaintenanceHistoryDialog
        open={!!maintenanceDialogEquipment}
        onOpenChange={() => setMaintenanceDialogEquipment(null)}
        equipment={maintenanceDialogEquipment}
      />

      {/* Add Calibration Dialog */}
      <AddCalibrationDialog
        open={!!addCalibrationEquipment}
        onOpenChange={() => setAddCalibrationEquipment(null)}
        equipment={addCalibrationEquipment}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmEquipment}
        onOpenChange={() => setDeleteConfirmEquipment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteConfirmEquipment?.name}&quot; and all
              associated calibration and maintenance records. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
