/**
 * NADCAP Audit Package Dialog
 * Generate and manage NADCAP audit documentation
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  FileText,
  Users,
  Wrench,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  NADCAPPackage,
  NADCAPCategory,
  ChecklistStatus,
  NADCAPChecklistItem,
} from "@/types/nadcap";
import {
  AC7114_SECTIONS,
  CATEGORY_LABELS,
  STATUS_CONFIG,
} from "@/types/nadcap";
import {
  createNADCAPPackage,
  updateChecklistStatus,
  generateComplianceSummary,
  generateFindingsReport,
  exportPackageJSON,
  generateSamplePackage,
  getChecklistByCategory,
} from "@/utils/nadcapGenerator";

interface NADCAPAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<NADCAPCategory, React.ElementType> = {
  personnel: Users,
  equipment: Wrench,
  calibration: Wrench,
  procedures: FileText,
  inspection: ClipboardList,
  records: FileText,
  quality: Shield,
};

export function NADCAPAuditDialog({ open, onOpenChange }: NADCAPAuditDialogProps) {
  const { toast } = useToast();
  const [pkg, setPkg] = useState<NADCAPPackage | null>(null);
  const [facilityName, setFacilityName] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [selectedItem, setSelectedItem] = useState<NADCAPChecklistItem | null>(null);

  // Create new package
  const handleCreate = useCallback(() => {
    if (!facilityName || !preparedBy) {
      toast({
        title: "Missing Information",
        description: "Please enter facility name and preparer name",
        variant: "destructive",
      });
      return;
    }
    setPkg(createNADCAPPackage(facilityName, preparedBy));
  }, [facilityName, preparedBy, toast]);

  // Load sample
  const handleLoadSample = useCallback(() => {
    setPkg(generateSamplePackage());
    toast({ title: "Sample Loaded", description: "Sample NADCAP package created" });
  }, [toast]);

  // Update item status
  const handleUpdateStatus = useCallback(
    (itemId: string, status: ChecklistStatus, evidence?: string, notes?: string) => {
      if (!pkg) return;
      setPkg(updateChecklistStatus(pkg, itemId, status, evidence, notes));
      setSelectedItem(null);
    },
    [pkg]
  );

  // Export package
  const handleExport = useCallback(
    (format: "json" | "summary" | "findings") => {
      if (!pkg) return;

      let content: string;
      let filename: string;
      let type: string;

      switch (format) {
        case "json":
          content = exportPackageJSON(pkg);
          filename = `nadcap_package_${pkg.facilityName.replace(/\s+/g, "_")}.json`;
          type = "application/json";
          break;
        case "summary":
          content = generateComplianceSummary(pkg);
          filename = `nadcap_summary_${pkg.facilityName.replace(/\s+/g, "_")}.txt`;
          type = "text/plain";
          break;
        case "findings":
          content = generateFindingsReport(pkg);
          filename = `nadcap_findings_${pkg.facilityName.replace(/\s+/g, "_")}.txt`;
          type = "text/plain";
          break;
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export Complete", description: `${format.toUpperCase()} file downloaded` });
    },
    [pkg, toast]
  );

  // Status icon helper
  const StatusIcon = ({ status }: { status: ChecklistStatus }) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            NADCAP Audit Package Generator
          </DialogTitle>
          <DialogDescription>
            Generate AC7114-compliant audit documentation for NDT accreditation
          </DialogDescription>
        </DialogHeader>

        {!pkg ? (
          /* Setup Screen */
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facilityName">Facility Name *</Label>
                <Input
                  id="facilityName"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Your NDT Facility Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparedBy">Prepared By *</Label>
                <Input
                  id="preparedBy"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleCreate} disabled={!facilityName || !preparedBy}>
                <Shield className="h-4 w-4 mr-2" />
                Create New Package
              </Button>
              <Button variant="outline" onClick={handleLoadSample}>
                Load Sample
              </Button>
            </div>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">About NADCAP Audit Packages</h4>
              <p className="text-sm text-muted-foreground">
                This tool helps you prepare documentation for NADCAP NDT (AC7114) audits.
                It generates checklists based on AC7114 requirements and helps track
                compliance status, personnel certifications, equipment calibration, and
                audit findings.
              </p>
            </div>
          </div>
        ) : (
          /* Main Package View */
          <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-4 space-y-6">
                {/* Compliance Summary */}
                <div className={`p-4 rounded-lg border ${
                  pkg.stats.complianceRate >= 90
                    ? "bg-green-500/10 border-green-500/30"
                    : pkg.stats.complianceRate >= 70
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Compliance</span>
                    <span className="text-2xl font-bold">{pkg.stats.complianceRate}%</span>
                  </div>
                  <Progress value={pkg.stats.complianceRate} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Compliant</p>
                    <p className="text-xl font-bold text-green-600">
                      {pkg.stats.compliantItems}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Non-Compliant</p>
                    <p className="text-xl font-bold text-red-600">
                      {pkg.stats.nonCompliantItems}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {pkg.stats.pendingItems}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Open Findings</p>
                    <p className="text-xl font-bold text-orange-600">
                      {pkg.stats.openFindings}
                    </p>
                  </div>
                </div>

                {/* Category Progress */}
                <div className="space-y-4">
                  <h3 className="font-medium">Progress by Category</h3>
                  {AC7114_SECTIONS.map((section) => {
                    const items = getChecklistByCategory(pkg, section.category);
                    const compliant = items.filter((i) => i.status === "compliant").length;
                    const percent = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0;
                    const Icon = CATEGORY_ICONS[section.category];

                    return (
                      <div key={section.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {section.title}
                          </span>
                          <span>
                            {compliant}/{items.length} ({percent}%)
                          </span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                {/* Alerts */}
                {(pkg.stats.nonCompliantItems > 0 || pkg.stats.calibrationOverdue > 0) && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Action Required
                    </h3>
                    <div className="space-y-2">
                      {pkg.stats.nonCompliantItems > 0 && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
                          {pkg.stats.nonCompliantItems} non-compliant items require attention
                        </div>
                      )}
                      {pkg.stats.calibrationOverdue > 0 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                          {pkg.stats.calibrationOverdue} equipment items have overdue calibration
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="p-4">
                <Accordion type="multiple" className="space-y-2">
                  {AC7114_SECTIONS.map((section) => {
                    const items = getChecklistByCategory(pkg, section.category);
                    const Icon = CATEGORY_ICONS[section.category];

                    return (
                      <AccordionItem key={section.category} value={section.category}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{section.title}</span>
                            <Badge variant="outline" className="ml-2">
                              {items.filter((i) => i.status === "compliant").length}/{items.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                                  STATUS_CONFIG[item.status].color
                                }`}
                                onClick={() => setSelectedItem(item)}
                              >
                                <div className="flex items-start gap-3">
                                  <StatusIcon status={item.status} />
                                  <div className="flex-1">
                                    <p className="text-xs font-mono text-muted-foreground">
                                      {item.reference}
                                    </p>
                                    <p className="text-sm">{item.requirement}</p>
                                    {item.evidence && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Evidence: {item.evidence}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                {/* Item Edit Dialog */}
                {selectedItem && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg p-6 w-full max-w-md space-y-4">
                      <h3 className="font-medium">{selectedItem.reference}</h3>
                      <p className="text-sm text-muted-foreground">{selectedItem.requirement}</p>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={selectedItem.status}
                          onValueChange={(v: ChecklistStatus) =>
                            setSelectedItem({ ...selectedItem, status: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="not_applicable">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Evidence</Label>
                        <Input
                          value={selectedItem.evidence || ""}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, evidence: e.target.value })
                          }
                          placeholder="Document reference, file name, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={selectedItem.notes || ""}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, notes: e.target.value })
                          }
                          placeholder="Additional notes..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            handleUpdateStatus(
                              selectedItem.id,
                              selectedItem.status,
                              selectedItem.evidence,
                              selectedItem.notes
                            )
                          }
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Findings Tab */}
              <TabsContent value="findings" className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Audit Findings</h3>
                  <Badge variant="outline">
                    {pkg.findings.length} total ({pkg.stats.openFindings} open)
                  </Badge>
                </div>

                {pkg.findings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No findings recorded yet</p>
                    <p className="text-sm">Findings will appear here when added</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pkg.findings.map((finding) => (
                      <div
                        key={finding.id}
                        className={`p-4 rounded-lg border ${
                          finding.status === "open" || finding.status === "in_progress"
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-green-500/10 border-green-500/30"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {finding.findingNumber} - {finding.severity.toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {finding.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <h4 className="font-medium">Full Package (JSON)</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete package data for backup or import
                    </p>
                    <Button className="w-full" onClick={() => handleExport("json")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <ClipboardList className="h-8 w-8 text-primary" />
                    <h4 className="font-medium">Compliance Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Text summary of compliance status
                    </p>
                    <Button className="w-full" onClick={() => handleExport("summary")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Summary
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <AlertTriangle className="h-8 w-8 text-primary" />
                    <h4 className="font-medium">Findings Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed audit findings report
                    </p>
                    <Button className="w-full" onClick={() => handleExport("findings")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Findings
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Package Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Facility: </span>
                      {pkg.facilityName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prepared By: </span>
                      {pkg.preparedBy}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      {new Date(pkg.preparedDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Checklist Items: </span>
                      {pkg.stats.totalChecklistItems}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
