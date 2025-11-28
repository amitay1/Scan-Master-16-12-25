import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ExportApprovalData,
  ExportTemplate,
  PreviewSettings,
  ApprovalWorkflow,
  ApprovalStage,
  DigitalSignature,
  ExportRecord
} from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import {
  FileText,
  Download,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Archive,
  Globe,
  Image,
  Table as TableIcon,
  BarChart,
  FileSignature,
  AlertTriangle,
  Printer,
  Mail
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ExportApprovalTabProps {
  data: ExportApprovalData;
  onChange: (data: ExportApprovalData) => void;
  currentUser?: string;
  onExport?: (template: ExportTemplate) => void;
}

const exportTemplates = [
  {
    id: "tuv" as ExportTemplate,
    name: "TÜV Professional",
    description: "19-page comprehensive report with bilingual support",
    pages: "19",
    features: ["Document control", "Revision tracking", "DAC curves", "Calibration diagrams", "Multi-level approval"],
    icon: "🏆"
  },
  {
    id: "chw" as ExportTemplate,
    name: "CHW Forge Style",
    description: "8-12 page compact professional report",
    pages: "8-12",
    features: ["Compact layout", "Combined sections", "Visual scan plans", "Simplified approval"],
    icon: "⚡"
  },
  {
    id: "iai" as ExportTemplate,
    name: "IAI Standard",
    description: "10-15 page bilingual report",
    pages: "10-15",
    features: ["Hebrew/English", "Detailed procedures", "Reference blocks", "Coverage tables"],
    icon: "✈️"
  },
  {
    id: "custom" as ExportTemplate,
    name: "Custom Template",
    description: "Customize your export format",
    pages: "Variable",
    features: ["Select sections", "Custom branding", "Flexible layout", "Choose language"],
    icon: "⚙️"
  }
];

const approvalRoles = [
  "Inspector",
  "Senior Inspector",
  "Level III",
  "Quality Manager",
  "Client Representative",
];

export const ExportApprovalTab = ({
  data,
  onChange,
  currentUser = "Inspector",
  onExport
}: ExportApprovalTabProps) => {
  const [activeSection, setActiveSection] = useState("templates");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ApprovalStage | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const updateField = (field: keyof ExportApprovalData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const selectTemplate = (template: ExportTemplate) => {
    updateField("selectedTemplate", template);
    // Set default preview settings based on template
    const settings: PreviewSettings = {
      includeImages: true,
      includeTables: true,
      includeCharts: template === "tuv" || template === "iai",
      language: template === "iai" ? "both" : "en",
      watermark: template === "tuv" ? "CONTROLLED COPY" : undefined,
    };
    updateField("previewSettings", settings);
  };

  const updatePreviewSetting = (setting: keyof PreviewSettings, value: any) => {
    updateField("previewSettings", {
      ...data.previewSettings,
      [setting]: value
    });
  };

  const initiateApproval = () => {
    // Initialize approval workflow
    const workflow: ApprovalWorkflow = {
      stages: [
        {
          id: "stage-1",
          name: "Inspector Review",
          requiredRole: "Inspector",
          approvers: [currentUser],
          status: "pending",
        },
        {
          id: "stage-2",
          name: "Senior Review",
          requiredRole: "Senior Inspector",
          approvers: [],
          status: "pending",
        },
        {
          id: "stage-3",
          name: "Final Approval",
          requiredRole: "Level III",
          approvers: [],
          status: "pending",
        }
      ],
      currentStage: "stage-1",
      status: "draft"
    };
    updateField("approvalWorkflow", workflow);
  };

  const approveStage = (stageId: string, comments?: string) => {
    if (!data.approvalWorkflow) return;

    const stages = data.approvalWorkflow.stages.map(stage => {
      if (stage.id === stageId) {
        return {
          ...stage,
          status: "approved" as const,
          comments,
          timestamp: new Date().toISOString()
        };
      }
      return stage;
    });

    // Check if all stages are approved
    const allApproved = stages.every(s => s.status === "approved");
    const workflow: ApprovalWorkflow = {
      ...data.approvalWorkflow,
      stages,
      status: allApproved ? "approved" : data.approvalWorkflow.status,
      currentStage: allApproved ? "" : stages.find(s => s.status === "pending")?.id || ""
    };

    updateField("approvalWorkflow", workflow);
  };

  const rejectStage = (stageId: string, comments: string) => {
    if (!data.approvalWorkflow) return;

    const stages = data.approvalWorkflow.stages.map(stage => {
      if (stage.id === stageId) {
        return {
          ...stage,
          status: "rejected" as const,
          comments,
          timestamp: new Date().toISOString()
        };
      }
      return stage;
    });

    const workflow: ApprovalWorkflow = {
      ...data.approvalWorkflow,
      stages,
      status: "rejected"
    };

    updateField("approvalWorkflow", workflow);
  };

  const addSignature = (signature: DigitalSignature) => {
    const signatures = [...(data.signatures || []), signature];
    updateField("signatures", signatures);
  };

  const performExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsExporting(false);

          // Add to export history
          const exportRecord: ExportRecord = {
            id: `export-${Date.now()}`,
            template: data.selectedTemplate || "tuv",
            exportedBy: currentUser,
            exportedDate: new Date().toISOString(),
            format: "PDF",
            size: Math.floor(Math.random() * 5000000) + 1000000,
            url: "#"
          };
          const history = [...(data.exportHistory || []), exportRecord];
          updateField("exportHistory", history);

          if (onExport) {
            onExport(data.selectedTemplate || "tuv");
          }

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const calculateApprovalProgress = () => {
    if (!data.approvalWorkflow) return 0;
    const approved = data.approvalWorkflow.stages.filter(s => s.status === "approved").length;
    return (approved / data.approvalWorkflow.stages.length) * 100;
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "templates" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("templates")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant={activeSection === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("preview")}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant={activeSection === "approval" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("approval")}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Approval
          </Button>
          <Button
            variant={activeSection === "signatures" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("signatures")}
            className="flex items-center gap-2"
          >
            <FileSignature className="w-4 h-4" />
            Signatures
          </Button>
          <Button
            variant={activeSection === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("history")}
            className="flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            History
          </Button>
        </div>
      </div>

      {/* Export Templates */}
      {activeSection === "templates" && (
        <Card>
          <CardHeader>
            <CardTitle>Export Templates</CardTitle>
            <CardDescription>Choose a professional template for your technical sheet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {exportTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    data.selectedTemplate === template.id && "border-primary"
                  )}
                  onClick={() => selectTemplate(template.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      {data.selectedTemplate === template.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        <span>{template.pages} pages</span>
                      </div>
                      <div className="space-y-1">
                        {template.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Template Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Template Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>TÜV</TableHead>
                      <TableHead>CHW</TableHead>
                      <TableHead>IAI</TableHead>
                      <TableHead>Custom</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Page Count</TableCell>
                      <TableCell>19</TableCell>
                      <TableCell>8-12</TableCell>
                      <TableCell>10-15</TableCell>
                      <TableCell>Variable</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bilingual</TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell><XCircle className="w-4 h-4 text-gray-300" /></TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>DAC Curves</TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell>Optional</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Approval Matrix</TableCell>
                      <TableCell><CheckCircle className="w-4 h-4 text-green-500" /></TableCell>
                      <TableCell>Simple</TableCell>
                      <TableCell>Standard</TableCell>
                      <TableCell>Flexible</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Preview Settings */}
      {activeSection === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Export Settings</CardTitle>
            <CardDescription>Configure export options and preview the document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Template Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Selected Template</Label>
                  <p className="text-lg font-medium">
                    {exportTemplates.find(t => t.id === data.selectedTemplate)?.name || "None"}
                  </p>
                </div>
                <Button
                  onClick={() => setShowPreviewDialog(true)}
                  disabled={!data.selectedTemplate}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Document
                </Button>
              </div>
            </div>

            {/* Preview Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FieldWithHelp
                      label="Include Images"
                      help="Include technical drawings and diagrams"
                    >
                      <div />
                    </FieldWithHelp>
                    <Switch
                      checked={data.previewSettings?.includeImages}
                      onCheckedChange={(checked) => updatePreviewSetting("includeImages", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <FieldWithHelp
                      label="Include Tables"
                      help="Include data tables and matrices"
                    >
                      <div />
                    </FieldWithHelp>
                    <Switch
                      checked={data.previewSettings?.includeTables}
                      onCheckedChange={(checked) => updatePreviewSetting("includeTables", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <FieldWithHelp
                      label="Include Charts"
                      help="Include statistical charts and graphs"
                    >
                      <div />
                    </FieldWithHelp>
                    <Switch
                      checked={data.previewSettings?.includeCharts}
                      onCheckedChange={(checked) => updatePreviewSetting("includeCharts", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <FieldWithHelp
                    label="Language"
                    help="Document language preference"
                  >
                    <Select
                      value={data.previewSettings?.language}
                      onValueChange={(value) => updatePreviewSetting("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="he">Hebrew</SelectItem>
                        <SelectItem value="both">Bilingual (EN/HE)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWithHelp>

                  <FieldWithHelp
                    label="Watermark"
                    help="Optional watermark text"
                  >
                    <Input
                      value={data.previewSettings?.watermark || ""}
                      onChange={(e) => updatePreviewSetting("watermark", e.target.value)}
                      placeholder="e.g., CONTROLLED COPY"
                    />
                  </FieldWithHelp>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={performExport}
                    disabled={!data.selectedTemplate || isExporting}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!data.selectedTemplate}
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!data.selectedTemplate}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>

                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exporting...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Approval Workflow */}
      {activeSection === "approval" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Approval Workflow</CardTitle>
                <CardDescription>Multi-level approval process</CardDescription>
              </div>
              {!data.approvalWorkflow && (
                <Button onClick={initiateApproval} size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Initiate Approval
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.approvalWorkflow ? (
              <div className="space-y-4">
                {/* Approval Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Approval Progress</span>
                    <span>{calculateApprovalProgress().toFixed(0)}%</span>
                  </div>
                  <Progress value={calculateApprovalProgress()} />
                </div>

                {/* Workflow Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Workflow Status</Label>
                      <p className="text-lg font-medium capitalize">{data.approvalWorkflow.status}</p>
                    </div>
                    <Badge
                      variant={
                        data.approvalWorkflow.status === "approved" ? "default" :
                        data.approvalWorkflow.status === "rejected" ? "destructive" :
                        "secondary"
                      }
                    >
                      {data.approvalWorkflow.status}
                    </Badge>
                  </div>
                </div>

                {/* Approval Stages */}
                <div className="space-y-3">
                  {data.approvalWorkflow.stages.map((stage) => (
                    <Card key={stage.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getApprovalStatusIcon(stage.status)}
                              <p className="font-medium">{stage.name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Required Role: {stage.requiredRole}
                            </p>
                            {stage.approvers.length > 0 && (
                              <div className="flex gap-2">
                                {stage.approvers.map((approver, idx) => (
                                  <Badge key={idx} variant="outline">{approver}</Badge>
                                ))}
                              </div>
                            )}
                            {stage.comments && (
                              <p className="text-sm mt-2">{stage.comments}</p>
                            )}
                            {stage.timestamp && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(stage.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {stage.status === "pending" && stage.id === data.approvalWorkflow.currentStage && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedStage(stage);
                                setShowApprovalDialog(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No approval workflow initiated. Click "Initiate Approval" to start the process.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Digital Signatures */}
      {activeSection === "signatures" && (
        <Card>
          <CardHeader>
            <CardTitle>Digital Signatures</CardTitle>
            <CardDescription>Authenticated digital signatures</CardDescription>
            <Button onClick={() => setShowSignatureDialog(true)} size="sm" className="w-fit">
              <FileSignature className="w-4 h-4 mr-2" />
              Add Signature
            </Button>
          </CardHeader>
          <CardContent>
            {data.signatures && data.signatures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signer</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.signatures.map((signature, index) => (
                    <TableRow key={index}>
                      <TableCell>{signature.signerId}</TableCell>
                      <TableCell>{new Date(signature.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        {signature.certificate ? (
                          <Badge variant="outline">Verified</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No digital signatures. Click "Add Signature" to sign the document.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export History */}
      {activeSection === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Previously exported documents</CardDescription>
          </CardHeader>
          <CardContent>
            {data.exportHistory && data.exportHistory.length > 0 ? (
              <div className="space-y-2">
                {data.exportHistory.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {exportTemplates.find(t => t.id === record.template)?.name} Export
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>by {record.exportedBy}</span>
                              <span>{new Date(record.exportedDate).toLocaleString()}</span>
                              <span>{record.format}</span>
                              <span>{(record.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No export history. Documents will appear here after export.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Preview of {exportTemplates.find(t => t.id === data.selectedTemplate)?.name} template
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="p-8 bg-white">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-center">ULTRASONIC TECHNIQUE SHEET</h1>
                <div className="border-t border-b py-2">
                  <p className="text-center text-sm">
                    Document No: TS-2024-001 | Revision: 0 | Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="prose max-w-none">
                  <p>This is a preview of your technical sheet export. The actual document will include all your inspection data, diagrams, and signatures.</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Close</Button>
            <Button onClick={performExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review & Approve</DialogTitle>
            <DialogDescription>
              Review stage: {selectedStage?.name}
            </DialogDescription>
          </DialogHeader>
          <ApprovalForm
            stage={selectedStage}
            onApprove={(comments) => {
              if (selectedStage) {
                approveStage(selectedStage.id, comments);
              }
              setShowApprovalDialog(false);
              setSelectedStage(null);
            }}
            onReject={(comments) => {
              if (selectedStage) {
                rejectStage(selectedStage.id, comments);
              }
              setShowApprovalDialog(false);
              setSelectedStage(null);
            }}
            onCancel={() => {
              setShowApprovalDialog(false);
              setSelectedStage(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>Sign the document digitally</DialogDescription>
          </DialogHeader>
          <SignatureForm
            currentUser={currentUser}
            onSign={(signature) => {
              addSignature(signature);
              setShowSignatureDialog(false);
            }}
            onCancel={() => setShowSignatureDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Approval Form Component
const ApprovalForm = ({ stage, onApprove, onReject, onCancel }: {
  stage: ApprovalStage | null;
  onApprove: (comments?: string) => void;
  onReject: (comments: string) => void;
  onCancel: () => void;
}) => {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(comments);
    } else if (action === "reject" && comments) {
      onReject(comments);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Review Comments</Label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Enter your review comments..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={action === "approve" ? "default" : "outline"}
          onClick={() => setAction("approve")}
          className="w-full"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button
          variant={action === "reject" ? "destructive" : "outline"}
          onClick={() => setAction("reject")}
          className="w-full"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>

      {action === "reject" && !comments && (
        <p className="text-sm text-red-500">Comments are required when rejecting</p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!action || (action === "reject" && !comments)}
        >
          Submit Review
        </Button>
      </div>
    </div>
  );
};

// Signature Form Component
const SignatureForm = ({ currentUser, onSign, onCancel }: {
  currentUser: string;
  onSign: (signature: DigitalSignature) => void;
  onCancel: () => void;
}) => {
  const [signerId, setSignerId] = useState(currentUser);
  const [certificate, setCertificate] = useState("");

  const handleSign = () => {
    onSign({
      signerId,
      signature: "Digital Signature",
      timestamp: new Date().toISOString(),
      certificate: certificate || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Signer Name</Label>
        <Input
          value={signerId}
          onChange={(e) => setSignerId(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div>
        <Label>Certificate (Optional)</Label>
        <Input
          value={certificate}
          onChange={(e) => setCertificate(e.target.value)}
          placeholder="Certificate ID or reference"
        />
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          By signing, you certify that the information in this document is accurate and complete.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSign}>
          <FileSignature className="w-4 h-4 mr-2" />
          Sign Document
        </Button>
      </div>
    </div>
  );
};