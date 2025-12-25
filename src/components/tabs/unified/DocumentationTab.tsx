import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DocumentationData,
  PersonnelData,
  PersonDetail,
  Remark,
  Revision,
  Attachment
} from "@/types/unifiedInspection";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import {
  Plus,
  Trash2,
  Edit,
  User,
  UserCheck,
  Shield,
  Building,
  MessageSquare,
  History,
  Paperclip,
  Download,
  Upload,
  FileText,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DocumentationTabProps {
  data: DocumentationData;
  onChange: (data: DocumentationData) => void;
  currentUser?: string;
}

const certificationLevels = [
  "Level I",
  "Level II",
  "Level III",
  "Trainee",
  "Not Applicable",
];

const certificationTypes = [
  "ASNT SNT-TC-1A",
  "ASNT CP-189",
  "EN ISO 9712",
  "NAS 410",
  "PCN",
  "CGSB",
];

const remarkCategories = [
  "General",
  "Safety",
  "Quality",
  "Deviation",
  "Recommendation",
  "Action Required",
  "Information",
];

export const DocumentationTab = ({
  data,
  onChange,
  currentUser = "Inspector"
}: DocumentationTabProps) => {
  const [activeSection, setActiveSection] = useState("personnel");
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [editingPersonRole, setEditingPersonRole] = useState<keyof PersonnelData | null>(null);
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [editingRemark, setEditingRemark] = useState<Remark | null>(null);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [procedureInput, setProcedureInput] = useState("");

  const updateField = (field: keyof DocumentationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updatePersonnel = (role: keyof PersonnelData, person: PersonDetail | undefined) => {
    updateField("personnel", {
      ...data.personnel,
      [role]: person
    });
    setShowPersonDialog(false);
    setEditingPersonRole(null);
  };

  const addProcedure = () => {
    if (procedureInput.trim()) {
      const procedures = [...(data.procedures || []), procedureInput.trim()];
      updateField("procedures", procedures);
      setProcedureInput("");
    }
  };

  const removeProcedure = (index: number) => {
    const procedures = data.procedures?.filter((_, i) => i !== index) || [];
    updateField("procedures", procedures);
  };

  const addOrUpdateRemark = (remark: Remark) => {
    const remarks = [...(data.remarks || [])];
    if (editingRemark) {
      const index = remarks.findIndex(r => r.id === editingRemark.id);
      if (index !== -1) {
        remarks[index] = remark;
      }
    } else {
      remarks.push({
        ...remark,
        id: `remark-${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }
    updateField("remarks", remarks);
    setShowRemarkDialog(false);
    setEditingRemark(null);
  };

  const deleteRemark = (id: string) => {
    const remarks = data.remarks?.filter(r => r.id !== id) || [];
    updateField("remarks", remarks);
  };

  const addRevision = (revision: Revision) => {
    const revisions = [...(data.revisionHistory || []), revision];
    updateField("revisionHistory", revisions);
    setShowRevisionDialog(false);
  };

  const addAttachment = (attachment: Attachment) => {
    const attachments = [...(data.attachments || []), {
      ...attachment,
      id: `att-${Date.now()}`,
      uploadedDate: new Date().toISOString()
    }];
    updateField("attachments", attachments);
    setShowAttachmentDialog(false);
  };

  const deleteAttachment = (id: string) => {
    const attachments = data.attachments?.filter(a => a.id !== id) || [];
    updateField("attachments", attachments);
  };

  const getPersonnelIcon = (role: string) => {
    switch (role) {
      case "inspector": return <User className="w-4 h-4" />;
      case "reviewer": return <UserCheck className="w-4 h-4" />;
      case "approver": return <Shield className="w-4 h-4" />;
      case "client": return <Building className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "personnel" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("personnel")}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Personnel
          </Button>
          <Button
            variant={activeSection === "procedures" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("procedures")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Procedures
          </Button>
          <Button
            variant={activeSection === "remarks" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("remarks")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Remarks
          </Button>
          <Button
            variant={activeSection === "revisions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("revisions")}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Revisions
          </Button>
          <Button
            variant={activeSection === "attachments" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("attachments")}
            className="flex items-center gap-2"
          >
            <Paperclip className="w-4 h-4" />
            Attachments
          </Button>
        </div>
      </div>

      {/* Personnel Details */}
      {activeSection === "personnel" && (
        <Card>
          <CardHeader>
            <CardTitle>Personnel & Signatures</CardTitle>
            <CardDescription>Inspector, reviewer, approver, and client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personnel Cards */}
            <div className="grid grid-cols-2 gap-4">
              {(["inspector", "reviewer", "approver", "client"] as const).map((role) => {
                const person = data.personnel?.[role];
                return (
                  <Card key={role}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getPersonnelIcon(role)}
                          <CardTitle className="text-base capitalize">{role}</CardTitle>
                        </div>
                        <Button
                          size="sm"
                          variant={person ? "outline" : "default"}
                          onClick={() => {
                            setEditingPersonRole(role);
                            setShowPersonDialog(true);
                          }}
                        >
                          {person ? "Edit" : "Add"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {person ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{person.name}</span>
                            {person.level && (
                              <Badge variant="secondary" className="text-xs">
                                {person.level}
                              </Badge>
                            )}
                          </div>
                          {person.certification && (
                            <p className="text-muted-foreground">
                              {person.certification}
                            </p>
                          )}
                          <p className="text-muted-foreground">{person.company}</p>
                          {person.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">{person.email}</span>
                            </div>
                          )}
                          {person.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs">{person.date}</span>
                            </div>
                          )}
                          {person.signature && (
                            <div className="mt-2 p-2 border rounded bg-muted">
                              <p className="text-xs text-muted-foreground">Signed</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Not assigned
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Signature Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Signature Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(["inspector", "reviewer", "approver", "client"] as const).map((role) => {
                    const person = data.personnel?.[role];
                    const isSigned = person?.signature ? true : false;
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-sm">{role}</span>
                          {person && <span className="text-sm text-muted-foreground">({person.name})</span>}
                        </div>
                        {person ? (
                          <Badge variant={isSigned ? "default" : "outline"}>
                            {isSigned ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {isSigned ? "Signed" : "Pending"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Assigned</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Procedures & Notes */}
      {activeSection === "procedures" && (
        <Card>
          <CardHeader>
            <CardTitle>Procedures & Notes</CardTitle>
            <CardDescription>Referenced procedures and inspection notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Procedure List */}
            <div>
              <Label className="mb-2">Referenced Procedures</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={procedureInput}
                  onChange={(e) => setProcedureInput(e.target.value)}
                  placeholder="e.g., WPS-001, PQR-123"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProcedure())}
                />
                <Button onClick={addProcedure} size="sm">Add</Button>
              </div>
              <div className="space-y-2">
                {data.procedures?.map((proc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{proc}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeProcedure(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(!data.procedures || data.procedures.length === 0) && (
                  <p className="text-sm text-muted-foreground">No procedures referenced</p>
                )}
              </div>
            </div>

            {/* General Notes */}
            <div>
              <Label>General Notes</Label>
              <Textarea
                value={data.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Enter any general notes or special instructions..."
                rows={6}
                className="mt-2"
              />
            </div>

            {/* Quick Templates */}
            <div className="border-t pt-4">
              <Label className="text-sm mb-2">Quick Note Templates:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const note = "Inspection performed per applicable procedures and standards. No deviations noted.";
                    updateField("notes", (data.notes || "") + "\n" + note);
                  }}
                >
                  Standard Inspection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const note = "Surface preparation verified prior to inspection. Couplant applied uniformly.";
                    updateField("notes", (data.notes || "") + "\n" + note);
                  }}
                >
                  Surface Prep
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const note = "Calibration verified at start and end of inspection. No drift observed.";
                    updateField("notes", (data.notes || "") + "\n" + note);
                  }}
                >
                  Calibration Check
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const note = "100% coverage achieved as per scan plan. All areas accessible.";
                    updateField("notes", (data.notes || "") + "\n" + note);
                  }}
                >
                  Coverage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remarks & Observations */}
      {activeSection === "remarks" && (
        <Card>
          <CardHeader>
            <CardTitle>Remarks & Observations</CardTitle>
            <CardDescription>Categorized remarks and observations from inspection</CardDescription>
            <Button onClick={() => setShowRemarkDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Remark
            </Button>
          </CardHeader>
          <CardContent>
            {data.remarks && data.remarks.length > 0 ? (
              <div className="space-y-3">
                {data.remarks.map((remark) => (
                  <Card key={remark.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                remark.category === "Action Required" ? "destructive" :
                                remark.category === "Safety" ? "destructive" :
                                remark.category === "Quality" ? "default" :
                                remark.category === "Deviation" ? "secondary" :
                                "outline"
                              }
                            >
                              {remark.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {remark.addedBy} • {new Date(remark.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{remark.text}</p>
                          {remark.attachments && remark.attachments.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-3 h-3" />
                              <span className="text-xs text-muted-foreground">
                                {remark.attachments.length} attachment(s)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRemark(remark);
                              setShowRemarkDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRemark(remark.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No remarks added. Click "Add Remark" to document observations.
              </div>
            )}

            {/* Remark Statistics */}
            {data.remarks && data.remarks.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium mb-3">Remark Summary</Label>
                <div className="grid grid-cols-4 gap-2">
                  {remarkCategories.map(category => {
                    const count = data.remarks?.filter(r => r.category === category).length || 0;
                    if (count === 0) return null;
                    return (
                      <div key={category} className="text-center">
                        <p className="text-xs text-muted-foreground">{category}</p>
                        <p className="text-lg font-medium">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revision History */}
      {activeSection === "revisions" && (
        <Card>
          <CardHeader>
            <CardTitle>Revision History</CardTitle>
            <CardDescription>Document revision tracking</CardDescription>
            <Button onClick={() => setShowRevisionDialog(true)} size="sm" className="w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Revision
            </Button>
          </CardHeader>
          <CardContent>
            {data.revisionHistory && data.revisionHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rev</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.revisionHistory.map((revision, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{revision.revision}</Badge>
                      </TableCell>
                      <TableCell>{revision.date}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm">{revision.description}</span>
                      </TableCell>
                      <TableCell>{revision.changedBy}</TableCell>
                      <TableCell>{revision.approvedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No revision history. This is the original version.
              </div>
            )}

            {/* Current Revision Status */}
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm">Current Revision</Label>
                  <p className="text-lg font-medium">
                    {data.revisionHistory && data.revisionHistory.length > 0
                      ? data.revisionHistory[data.revisionHistory.length - 1].revision
                      : "Rev. 0"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm">Last Modified</Label>
                  <p className="text-sm">
                    {data.revisionHistory && data.revisionHistory.length > 0
                      ? data.revisionHistory[data.revisionHistory.length - 1].date
                      : "Original"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {activeSection === "attachments" && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>Supporting documents and files</CardDescription>
            <Button onClick={() => setShowAttachmentDialog(true)} size="sm" className="w-fit">
              <Upload className="w-4 h-4 mr-2" />
              Add Attachment
            </Button>
          </CardHeader>
          <CardContent>
            {data.attachments && data.attachments.length > 0 ? (
              <div className="space-y-2">
                {data.attachments.map((attachment) => (
                  <Card key={attachment.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{attachment.type}</span>
                              <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                              <span>by {attachment.uploadedBy}</span>
                              <span>{new Date(attachment.uploadedDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAttachment(attachment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attachments. Click "Add Attachment" to upload supporting documents.
              </div>
            )}

            {/* Storage Info */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm">Total Attachments</Label>
                    <p className="text-lg font-medium">{data.attachments.length}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Total Size</Label>
                    <p className="text-lg font-medium">
                      {(data.attachments.reduce((sum, a) => sum + a.size, 0) / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Person Dialog */}
      <Dialog open={showPersonDialog} onOpenChange={setShowPersonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPersonRole ? `${editingPersonRole.charAt(0).toUpperCase() + editingPersonRole.slice(1)} Details` : "Person Details"}
            </DialogTitle>
            <DialogDescription>Enter personnel information</DialogDescription>
          </DialogHeader>
          <PersonForm
            person={editingPersonRole ? data.personnel?.[editingPersonRole] : undefined}
            role={editingPersonRole || "inspector"}
            onSave={(person) => {
              if (editingPersonRole) {
                updatePersonnel(editingPersonRole, person);
              }
            }}
            onCancel={() => {
              setShowPersonDialog(false);
              setEditingPersonRole(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Remark Dialog */}
      <Dialog open={showRemarkDialog} onOpenChange={setShowRemarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRemark ? "Edit" : "Add"} Remark</DialogTitle>
            <DialogDescription>Document observations and remarks</DialogDescription>
          </DialogHeader>
          <RemarkForm
            remark={editingRemark}
            currentUser={currentUser}
            onSave={addOrUpdateRemark}
            onCancel={() => {
              setShowRemarkDialog(false);
              setEditingRemark(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Revision</DialogTitle>
            <DialogDescription>Document revision details</DialogDescription>
          </DialogHeader>
          <RevisionForm
            currentRevision={
              data.revisionHistory && data.revisionHistory.length > 0
                ? data.revisionHistory[data.revisionHistory.length - 1].revision
                : "0"
            }
            onSave={addRevision}
            onCancel={() => setShowRevisionDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
            <DialogDescription>Upload supporting documents</DialogDescription>
          </DialogHeader>
          <AttachmentForm
            currentUser={currentUser}
            onSave={addAttachment}
            onCancel={() => setShowAttachmentDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Person Form Component
const PersonForm = ({ person, role, onSave, onCancel }: {
  person?: PersonDetail;
  role: string;
  onSave: (person: PersonDetail) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<PersonDetail>(person || {
    name: "",
    certification: "",
    level: "",
    signature: "",
    date: new Date().toISOString().split('T')[0],
    company: "",
    email: "",
    phone: "",
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Full name"
          />
        </div>

        <div>
          <Label>Company</Label>
          <Input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
          />
        </div>

        <div>
          <Label>Certification</Label>
          <Select value={formData.certification} onValueChange={(value) => setFormData({ ...formData, certification: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select certification" />
            </SelectTrigger>
            <SelectContent>
              {certificationTypes.map(cert => (
                <SelectItem key={cert} value={cert}>{cert}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Level</Label>
          <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {certificationLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>

        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1-234-567-8900"
          />
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="signed"
            checked={!!formData.signature}
            onChange={(e) => setFormData({
              ...formData,
              signature: e.target.checked ? "Digitally Signed" : ""
            })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="signed">Mark as Signed</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </div>
  );
};

// Remark Form Component
const RemarkForm = ({ remark, currentUser, onSave, onCancel }: {
  remark: Remark | null;
  currentUser: string;
  onSave: (remark: Remark) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<Remark>>(remark || {
    category: "General",
    text: "",
    addedBy: currentUser,
  });

  const handleSubmit = () => {
    onSave({
      id: remark?.id || `remark-${Date.now()}`,
      category: formData.category || "General",
      text: formData.text || "",
      addedBy: formData.addedBy || currentUser,
      timestamp: remark?.timestamp || new Date().toISOString(),
      attachments: formData.attachments,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {remarkCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Remark</Label>
        <Textarea
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="Enter your observation or remark..."
          rows={4}
        />
      </div>

      <div>
        <Label>Added By</Label>
        <Input
          value={formData.addedBy}
          onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
          placeholder="Your name"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Remark</Button>
      </div>
    </div>
  );
};

// Revision Form Component
const RevisionForm = ({ currentRevision, onSave, onCancel }: {
  currentRevision: string;
  onSave: (revision: Revision) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Revision>({
    revision: `Rev. ${parseInt(currentRevision.replace(/\D/g, '') || "0") + 1}`,
    date: new Date().toISOString().split('T')[0],
    description: "",
    changedBy: "",
    approvedBy: "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Revision Number</Label>
          <Input
            value={formData.revision}
            onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
            placeholder="e.g., Rev. 1"
          />
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Description of Changes</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the changes made..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Changed By</Label>
          <Input
            value={formData.changedBy}
            onChange={(e) => setFormData({ ...formData, changedBy: e.target.value })}
            placeholder="Name of person making changes"
          />
        </div>

        <div>
          <Label>Approved By</Label>
          <Input
            value={formData.approvedBy}
            onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
            placeholder="Name of approver"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Add Revision</Button>
      </div>
    </div>
  );
};

// Attachment Form Component
const AttachmentForm = ({ currentUser, onSave, onCancel }: {
  currentUser: string;
  onSave: (attachment: Attachment) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<Attachment>>({
    name: "",
    type: "",
    size: 0,
    url: "",
    uploadedBy: currentUser,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select File</Label>
        <Input
          type="file"
          onChange={handleFileSelect}
          className="mt-2"
        />
      </div>

      {formData.name && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>File Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>File Type</Label>
              <Input value={formData.type} readOnly />
            </div>
          </div>

          <div>
            <Label>Uploaded By</Label>
            <Input
              value={formData.uploadedBy}
              onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
            />
          </div>

          <div className="p-3 bg-muted rounded">
            <p className="text-sm">
              File size: {((formData.size || 0) / 1024).toFixed(1)} KB
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave(formData as Attachment)}
          disabled={!formData.name}
        >
          Upload
        </Button>
      </div>
    </div>
  );
};