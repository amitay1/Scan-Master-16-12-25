import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentationData } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";

interface DocumentationTabProps {
  data: DocumentationData;
  onChange: (data: DocumentationData) => void;
}

// Using imported FieldWithHelp component

const inspectorLevels = ["Level I", "Level II", "Level III"];

export const DocumentationTab = ({ data, onChange }: DocumentationTabProps) => {
  const updateField = (field: keyof DocumentationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  if (!data.inspectionDate) {
    updateField("inspectionDate", today);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Inspector Name"
          fieldKey="inspectorName"
          required
        >
          <Input
            value={data.inspectorName}
            onChange={(e) => updateField("inspectorName", e.target.value)}
            placeholder="John Smith"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Inspector Certification"
          fieldKey="inspectorName"
          required
        >
          <Input
            value={data.inspectorCertification}
            onChange={(e) => updateField("inspectorCertification", e.target.value)}
            placeholder="UT-1234 Level II"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Inspector Level"
          fieldKey="inspectorName"
          required
        >
          <Select
            value={data.inspectorLevel}
            onValueChange={(value) => updateField("inspectorLevel", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {inspectorLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <FieldWithHelp
          label="Certifying Organization"
          fieldKey="inspectorName"
        >
          <Input
            value={data.certifyingOrganization}
            onChange={(e) => updateField("certifyingOrganization", e.target.value)}
            placeholder="ASNT, ACCP, etc."
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Inspection Date"
          fieldKey="inspectionDate"
          required
        >
          <Input
            type="date"
            value={data.inspectionDate}
            onChange={(e) => updateField("inspectionDate", e.target.value)}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Procedure Number"
          fieldKey="procedureNumber"
        >
          <Input
            value={data.procedureNumber}
            onChange={(e) => updateField("procedureNumber", e.target.value)}
            placeholder="UT-001 Rev C"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Drawing Reference"
          fieldKey="drawingReference"
        >
          <Input
            value={data.drawingReference}
            onChange={(e) => updateField("drawingReference", e.target.value)}
            placeholder="DWG-5678"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Technique Sheet Revision"
          fieldKey="revisionLevel"
        >
          <Input
            value={data.revision}
            onChange={(e) => updateField("revision", e.target.value)}
            placeholder="A"
            className="bg-background"
          />
        </FieldWithHelp>
      </div>

      <FieldWithHelp
        label="Additional Notes"
        fieldKey="inspectionDate"
      >
        <Textarea
          value={data.additionalNotes}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
          placeholder="Enter any additional notes, observations, or special instructions..."
          rows={5}
          className="bg-background"
        />
      </FieldWithHelp>

      <div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-lg border border-border">
        <Checkbox
          id="approvalRequired"
          checked={data.approvalRequired}
          onCheckedChange={(checked) => updateField("approvalRequired", !!checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="approvalRequired"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Requires Level III Approval
          </label>
          <p className="text-xs text-muted-foreground">
            Check if this technique sheet requires Level III review and approval before use
          </p>
        </div>
      </div>

      {/* Approval Section */}
      {data.approvalRequired && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Level III Approval Required</h4>
          <p className="text-xs text-muted-foreground mb-3">
            This technique sheet must be reviewed and approved by a Level III inspector before use.
            Approval signatures should be collected on the printed PDF.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Approved By (Level III)</Label>
              <div className="h-16 border-b-2 border-dashed border-muted-foreground/30 mt-2"></div>
              <p className="text-xs text-muted-foreground mt-1">Signature</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <div className="h-16 border-b-2 border-dashed border-muted-foreground/30 mt-2"></div>
              <p className="text-xs text-muted-foreground mt-1">Approval Date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
