/**
 * Documentation Requirements Step
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProcedureWizardData } from "@/types/procedure";

interface DocumentationStepProps {
  data: ProcedureWizardData;
  onUpdate: (updates: Partial<ProcedureWizardData>) => void;
}

const PERSONNEL_LEVELS = [
  { value: "level_i", label: "Level I", description: "Perform calibrations and inspections under supervision" },
  { value: "level_ii", label: "Level II", description: "Set up, calibrate, perform, and interpret inspections" },
  { value: "level_iii", label: "Level III", description: "Develop procedures, interpret codes, supervise" },
];

const RETENTION_PERIODS = [
  { value: "1_year", label: "1 Year" },
  { value: "2_years", label: "2 Years" },
  { value: "5_years", label: "5 Years" },
  { value: "7_years", label: "7 Years" },
  { value: "10_years", label: "10 Years" },
  { value: "life_of_part", label: "Life of Part" },
  { value: "permanent", label: "Permanent" },
];

const RECORD_TYPES = [
  "Technique Sheet",
  "Calibration Records",
  "C-Scan Images",
  "A-Scan Captures",
  "Inspection Reports",
  "Defect Logs",
  "Equipment Records",
  "Personnel Certifications",
];

export function DocumentationStep({ data, onUpdate }: DocumentationStepProps) {
  const togglePersonnelLevel = (level: string) => {
    const current = data.personnelLevels || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onUpdate({ personnelLevels: updated });
  };

  const toggleRecordType = (type: string) => {
    const current = data.requiredRecords || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onUpdate({ requiredRecords: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Personnel Qualification Requirements *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select all levels authorized to perform inspections under this procedure
        </p>
        <div className="space-y-2">
          {PERSONNEL_LEVELS.map((level) => (
            <div key={level.value} className="flex items-start gap-2">
              <Checkbox
                id={`level-${level.value}`}
                checked={(data.personnelLevels || []).includes(level.value)}
                onCheckedChange={() => togglePersonnelLevel(level.value)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor={`level-${level.value}`} className="text-sm cursor-pointer font-medium">
                  {level.label}
                </Label>
                <p className="text-xs text-muted-foreground">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="certScheme">Certification Scheme</Label>
        <Select
          value={data.certificationScheme || ""}
          onValueChange={(value) => onUpdate({ certificationScheme: value })}
        >
          <SelectTrigger id="certScheme">
            <SelectValue placeholder="Select certification scheme..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nas410">NAS 410 (Aerospace)</SelectItem>
            <SelectItem value="en4179">EN 4179 (European Aerospace)</SelectItem>
            <SelectItem value="snttc1a">SNT-TC-1A (General)</SelectItem>
            <SelectItem value="iso9712">ISO 9712 (International)</SelectItem>
            <SelectItem value="cp189">ANSI CP-189</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Required Records *</Label>
        <div className="grid grid-cols-2 gap-2">
          {RECORD_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`record-${type}`}
                checked={(data.requiredRecords || []).includes(type)}
                onCheckedChange={() => toggleRecordType(type)}
              />
              <Label htmlFor={`record-${type}`} className="text-sm cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="retention">Record Retention Period *</Label>
        <Select
          value={data.retentionPeriod || ""}
          onValueChange={(value) => onUpdate({ retentionPeriod: value })}
        >
          <SelectTrigger id="retention">
            <SelectValue placeholder="Select retention period..." />
          </SelectTrigger>
          <SelectContent>
            {RETENTION_PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Report Format Requirements</Label>
        <div className="flex flex-wrap gap-2">
          {["PDF", "Digital (Native)", "Hard Copy", "Signed Electronic"].map((format) => (
            <Badge
              key={format}
              variant={(data.reportFormats || []).includes(format) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                const current = data.reportFormats || [];
                const updated = current.includes(format)
                  ? current.filter((f) => f !== format)
                  : [...current, format];
                onUpdate({ reportFormats: updated });
              }}
            >
              {format}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="approvalChain">Approval Chain</Label>
        <Textarea
          id="approvalChain"
          value={data.approvalChain || ""}
          onChange={(e) => onUpdate({ approvalChain: e.target.value })}
          placeholder="Define the approval chain (e.g., Inspector → Level II → Level III → QA)"
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label>Customer / Regulatory Requirements</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerSpec" className="text-xs text-muted-foreground">
              Customer Specification
            </Label>
            <Input
              id="customerSpec"
              value={data.customerSpecification || ""}
              onChange={(e) => onUpdate({ customerSpecification: e.target.value })}
              placeholder="e.g., Boeing D6-54551"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poRef" className="text-xs text-muted-foreground">
              PO / Contract Reference
            </Label>
            <Input
              id="poRef"
              value={data.poReference || ""}
              onChange={(e) => onUpdate({ poReference: e.target.value })}
              placeholder="PO-12345"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Documentation Requirements</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="witnessReq"
              checked={data.witnessRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ witnessRequired: checked === true })
              }
            />
            <Label htmlFor="witnessReq" className="text-sm cursor-pointer">
              Customer/Source witness required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="nadcapReq"
              checked={data.nadcapRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ nadcapRequired: checked === true })
              }
            />
            <Label htmlFor="nadcapReq" className="text-sm cursor-pointer">
              NADCAP accreditation required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="traceability"
              checked={data.traceabilityRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ traceabilityRequired: checked === true })
              }
            />
            <Label htmlFor="traceability" className="text-sm cursor-pointer">
              Full material traceability required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="eSignature"
              checked={data.electronicSignatureRequired || false}
              onCheckedChange={(checked) =>
                onUpdate({ electronicSignatureRequired: checked === true })
              }
            />
            <Label htmlFor="eSignature" className="text-sm cursor-pointer">
              Electronic signature/21 CFR Part 11 compliance
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="additionalNotes">Additional Documentation Notes</Label>
        <Textarea
          id="additionalNotes"
          value={data.documentationNotes || ""}
          onChange={(e) => onUpdate({ documentationNotes: e.target.value })}
          placeholder="Any other documentation requirements or special instructions..."
          rows={3}
        />
      </div>
    </div>
  );
}
