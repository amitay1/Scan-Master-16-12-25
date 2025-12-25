import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectSetupData } from "@/types/unifiedInspection";
import { MaterialType } from "@/types/techniqueSheet";
import { PartTypeVisualSelector } from "@/components/PartTypeVisualSelector";
import { SmartRecommendations } from "@/components/SmartRecommendations";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Calendar, Building2, Package, FileText, Ruler, Settings } from "lucide-react";

interface ProjectSetupTabProps {
  data: ProjectSetupData;
  onChange: (data: ProjectSetupData) => void;
}

const materials: { value: MaterialType | string; label: string }[] = [
  { value: "aluminum", label: "Aluminum" },
  { value: "steel", label: "Steel" },
  { value: "stainless_steel", label: "Stainless Steel" },
  { value: "titanium", label: "Titanium" },
  { value: "magnesium", label: "Magnesium" },
  { value: "custom", label: "Custom Material" },
];

const materialSpecs: Record<string, string[]> = {
  aluminum: ["7075-T6 (QQ-A200/11)", "2024 (QQ-A-200/3)", "6061-T6", "2219-T87"],
  steel: ["4340 annealed (MIL-S-5000)", "4130", "17-4 PH", "15-5 PH"],
  stainless_steel: ["304 (AMS 5513)", "316 (AMS 5524)", "17-4 PH (AMS 5604)", "15-5 PH (AMS 5659)", "410", "420"],
  titanium: ["Ti-6Al-4V annealed (AMS 4928)", "Ti-6Al-4V STA", "Ti-5Al-2.5Sn", "CP Ti Grade 2"],
  magnesium: ["ZK60A (QQ-M-31)", "AZ31B", "AZ80A", "ZE41A"],
  custom: ["Custom Specification"],
};

const surfaceConditions = [
  "As-Machined",
  "As-Rolled",
  "As-Cast",
  "Ground",
  "Polished",
  "Shot-Peened",
  "Grit-Blasted",
  "Painted",
  "Anodized",
];

const heatTreatments = [
  "Annealed",
  "Solution Treated",
  "Aged",
  "STA (Solution Treated & Aged)",
  "Normalized",
  "Quenched & Tempered",
  "Stress Relieved",
  "None",
];

export const ProjectSetupTab = ({ data, onChange }: ProjectSetupTabProps) => {
  const [activeSection, setActiveSection] = useState("customer");

  const updateField = (field: keyof ProjectSetupData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const showDiameter = data.partType?.includes("round") ||
                       data.partType?.includes("tube") ||
                       data.partType?.includes("pipe") ||
                       data.partType?.includes("cylinder") ||
                       data.partType?.includes("shaft") ||
                       data.partType?.includes("disk") ||
                       data.partType?.includes("ring");

  const showHollow = data.partType === "tube" ||
                     data.partType === "pipe" ||
                     data.partType === "sleeve" ||
                     data.partType === "bushing" ||
                     data.partType === "ring" ||
                     data.partType === "ring_forging";

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={activeSection === "customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("customer")}
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Customer & PO
          </Button>
          <Button
            variant={activeSection === "document" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("document")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Document Control
          </Button>
          <Button
            variant={activeSection === "part" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("part")}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Part Details
          </Button>
          <Button
            variant={activeSection === "material" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("material")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Material
          </Button>
          <Button
            variant={activeSection === "dimensions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("dimensions")}
            className="flex items-center gap-2"
          >
            <Ruler className="w-4 h-4" />
            Dimensions
          </Button>
        </div>
      </div>

      {/* Customer & PO Information */}
      {activeSection === "customer" && (
        <Card>
          <CardHeader>
            <CardTitle>Customer & Purchase Order Information</CardTitle>
            <CardDescription>Enter customer details and purchase order information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Customer Name"
                help="Official company name as per purchase order"
              >
                <Input
                  value={data.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="e.g., Israel Aerospace Industries (IAI)"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Customer PO Number"
                help="Purchase order number from customer"
              >
                <Input
                  value={data.customerPO}
                  onChange={(e) => updateField('customerPO', e.target.value)}
                  placeholder="e.g., H000131338"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Contact Person"
                help="Primary customer contact for this inspection"
              >
                <Input
                  value={data.customerContact}
                  onChange={(e) => updateField('customerContact', e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Contact Email"
                help="Email address for inspection reports"
              >
                <Input
                  type="email"
                  value={data.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="e.g., john.smith@company.com"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Contact Phone"
                help="Phone number for urgent matters"
              >
                <Input
                  value={data.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="e.g., +1-234-567-8900"
                />
              </FieldWithHelp>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Control */}
      {activeSection === "document" && (
        <Card>
          <CardHeader>
            <CardTitle>Document Control</CardTitle>
            <CardDescription>Document tracking and revision control information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Document Number"
                help="Unique document identifier for this technique sheet"
              >
                <Input
                  value={data.documentNumber}
                  onChange={(e) => updateField('documentNumber', e.target.value)}
                  placeholder="e.g., QAQC/UT/AUT/E-324/1"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Document Revision"
                help="Current revision level of this document"
              >
                <Input
                  value={data.documentRevision}
                  onChange={(e) => updateField('documentRevision', e.target.value)}
                  placeholder="e.g., Rev. 0"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Document Date"
                help="Date of document creation or last revision"
              >
                <Input
                  type="date"
                  value={data.documentDate}
                  onChange={(e) => updateField('documentDate', e.target.value)}
                />
              </FieldWithHelp>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={data.controlledCopy}
                    onChange={(e) => updateField('controlledCopy', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Controlled Copy</span>
                </label>
                {data.controlledCopy && (
                  <FieldWithHelp
                    label="Copy Number"
                    help="Controlled copy number for tracking"
                  >
                    <Input
                      value={data.copyNumber}
                      onChange={(e) => updateField('copyNumber', e.target.value)}
                      placeholder="e.g., Copy #001"
                      className="w-32"
                    />
                  </FieldWithHelp>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Part Details */}
      {activeSection === "part" && (
        <Card>
          <CardHeader>
            <CardTitle>Part Information</CardTitle>
            <CardDescription>Part identification and specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Part Number"
                help="Manufacturer's part number"
              >
                <Input
                  value={data.partNumber}
                  onChange={(e) => updateField('partNumber', e.target.value)}
                  placeholder="e.g., 1234567-001"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Part Name"
                help="Descriptive name of the part"
              >
                <Input
                  value={data.partName}
                  onChange={(e) => updateField('partName', e.target.value)}
                  placeholder="e.g., REAR SECTION FORGING"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Serial Number"
                help="Part serial number for traceability"
              >
                <Input
                  value={data.partSerialNumber}
                  onChange={(e) => updateField('partSerialNumber', e.target.value)}
                  placeholder="e.g., SN-2024-001"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Drawing Number"
                help="Engineering drawing reference"
              >
                <Input
                  value={data.drawingNumber}
                  onChange={(e) => updateField('drawingNumber', e.target.value)}
                  placeholder="e.g., DWG-123456"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Revision Number"
                help="Drawing revision level"
              >
                <Input
                  value={data.revisionNumber}
                  onChange={(e) => updateField('revisionNumber', e.target.value)}
                  placeholder="e.g., Rev. C"
                />
              </FieldWithHelp>

              <div className="col-span-2">
                <FieldWithHelp
                  label="Part Description"
                  help="Additional details about the part"
                >
                  <Input
                    value={data.partDescription}
                    onChange={(e) => updateField('partDescription', e.target.value)}
                    placeholder="e.g., Aerospace structural component for wing assembly"
                  />
                </FieldWithHelp>
              </div>
            </div>

            {/* Part Type Selection */}
            <div className="space-y-4">
              <Label>Part Type/Geometry</Label>
              <PartTypeVisualSelector
                value={data.partType}
                onChange={(value) => updateField('partType', value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Properties */}
      {activeSection === "material" && (
        <Card>
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
            <CardDescription>Material type, specification, and condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldWithHelp
                label="Material Type"
                help="Base material category"
              >
                <Select value={data.material as string} onValueChange={(value) => updateField('material', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((mat) => (
                      <SelectItem key={mat.value} value={mat.value}>
                        {mat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Material Specification"
                help="Specific material grade and standard"
              >
                <Select value={data.materialSpec} onValueChange={(value) => updateField('materialSpec', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specification" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.material && materialSpecs[data.material as string]?.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Material Grade"
                help="Specific grade within the specification"
              >
                <Input
                  value={data.materialGrade}
                  onChange={(e) => updateField('materialGrade', e.target.value)}
                  placeholder="e.g., Grade A"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Heat Treatment"
                help="Heat treatment condition of the material"
              >
                <Select value={data.heatTreatment} onValueChange={(value) => updateField('heatTreatment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select heat treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {heatTreatments.map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {treatment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Surface Condition"
                help="Current surface finish or treatment"
              >
                <Select value={data.surfaceCondition} onValueChange={(value) => updateField('surfaceCondition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select surface condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {surfaceConditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWithHelp>
            </div>

            {/* Smart Recommendations based on material */}
            {data.material && (
              <SmartRecommendations
                material={data.material as MaterialType}
                thickness={data.partThickness}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Dimensions */}
      {activeSection === "dimensions" && (
        <Card>
          <CardHeader>
            <CardTitle>Part Dimensions</CardTitle>
            <CardDescription>Physical dimensions of the part</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FieldWithHelp
                label="Thickness (mm)"
                help="Maximum thickness of the part"
              >
                <Input
                  type="number"
                  value={data.partThickness}
                  onChange={(e) => updateField('partThickness', parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Length (mm)"
                help="Overall length of the part"
              >
                <Input
                  type="number"
                  value={data.partLength}
                  onChange={(e) => updateField('partLength', parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Width (mm)"
                help="Overall width of the part"
              >
                <Input
                  type="number"
                  value={data.partWidth}
                  onChange={(e) => updateField('partWidth', parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
              </FieldWithHelp>

              {showDiameter && (
                <>
                  <FieldWithHelp
                    label="Outer Diameter (mm)"
                    help="Outer diameter for cylindrical parts"
                  >
                    <Input
                      type="number"
                      value={data.diameter}
                      onChange={(e) => updateField('diameter', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </FieldWithHelp>

                  {showHollow && (
                    <>
                      <FieldWithHelp
                        label="Inner Diameter (mm)"
                        help="Inner diameter for hollow parts"
                      >
                        <Input
                          type="number"
                          value={data.innerDiameter}
                          onChange={(e) => updateField('innerDiameter', parseFloat(e.target.value) || 0)}
                          step="0.1"
                        />
                      </FieldWithHelp>

                      <FieldWithHelp
                        label="Wall Thickness (mm)"
                        help="Wall thickness for hollow parts"
                      >
                        <Input
                          type="number"
                          value={data.wallThickness}
                          onChange={(e) => updateField('wallThickness', parseFloat(e.target.value) || 0)}
                          step="0.1"
                        />
                      </FieldWithHelp>
                    </>
                  )}
                </>
              )}

              {data.isHollow && !showHollow && (
                <>
                  <FieldWithHelp
                    label="Inner Length (mm)"
                    help="Inner cavity length"
                  >
                    <Input
                      type="number"
                      value={data.innerLength}
                      onChange={(e) => updateField('innerLength', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </FieldWithHelp>

                  <FieldWithHelp
                    label="Inner Width (mm)"
                    help="Inner cavity width"
                  >
                    <Input
                      type="number"
                      value={data.innerWidth}
                      onChange={(e) => updateField('innerWidth', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </FieldWithHelp>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHollow"
                checked={data.isHollow || false}
                onChange={(e) => updateField('isHollow', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isHollow">Part has hollow sections</Label>
            </div>

            {/* Visual dimension preview */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Dimension Summary:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">T: {data.partThickness}mm</Badge>
                <Badge variant="secondary">L: {data.partLength}mm</Badge>
                <Badge variant="secondary">W: {data.partWidth}mm</Badge>
                {data.diameter && <Badge variant="secondary">ØD: {data.diameter}mm</Badge>}
                {data.innerDiameter && <Badge variant="secondary">ØID: {data.innerDiameter}mm</Badge>}
                {data.wallThickness && <Badge variant="secondary">Wall: {data.wallThickness}mm</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};