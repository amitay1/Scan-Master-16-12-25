import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, Download, Eye, FileText } from "lucide-react";
import { generateCalibrationBlockPDF } from "@/utils/calibrationBlockExport";
import { CalibrationBlockType } from "@/types/techniqueSheet";
import { CalibrationBlockDrawing } from "./CalibrationBlockDrawing";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { buildCalibrationBlockJob } from "@shared/drawingSpec";

interface CalibrationModel {
  id: CalibrationBlockType | string;
  name: string;
  figure: string;
  description: string;
  beamType: "straight" | "angle";
  imageUrl: string;
  applications: string[];
  isCustom?: boolean;
}

interface CalibrationCatalogProps {
  recommendedModel?: CalibrationBlockType | null;
  onSelectModel: (modelId: string) => void;
  selectedModel?: string;
}

const calibrationModels: CalibrationModel[] = [
  {
    id: "flat_block",
    name: "Flat Block with FBH",
    figure: "Figure 4",
    description: "Standard flat reference block with flat-bottom holes for straight beam inspection",
    beamType: "straight",
    imageUrl: "",
    applications: ["Plate inspection", "Bar inspection", "General straight beam calibration"]
  },
  {
    id: "curved_block",
    name: "Curved Block with FBH",
    figure: "Figure 3",
    description: "Curved surface reference block matching part geometry for straight beam",
    beamType: "straight",
    imageUrl: "",
    applications: ["Cylindrical parts", "Curved surfaces", "Forgings with radius"]
  },
  {
    id: "cylinder_fbh",
    name: "Hollow Cylindrical - FBH",
    figure: "Figure 6",
    description: "Hollow cylindrical block with flat-bottom holes for tube inspection",
    beamType: "straight",
    imageUrl: "",
    applications: ["Tube inspection", "Pipe calibration", "Hollow shaft inspection"]
  },
  {
    id: "angle_beam",
    name: "Angle Beam Test Block",
    figure: "Figure 4A",
    description: "Angle beam reference block with side-drilled holes for shear wave inspection",
    beamType: "angle",
    imageUrl: "",
    applications: ["Weld inspection", "Shear wave calibration", "Angle beam technique"]
  },
  {
    id: "cylinder_notched",
    name: "Hollow Cylindrical - Notched",
    figure: "Figure 5",
    description: "Hollow cylindrical block with notches for angle beam inspection",
    beamType: "angle",
    imageUrl: "",
    applications: ["Tube welds", "Pipe inspection", "Circumferential scanning"]
  },
  {
    id: "iiv_block",
    name: "IIW Type Block",
    figure: "Figure 7",
    description: "International Institute of Welding calibration block for angle beam testing",
    beamType: "angle",
    imageUrl: "",
    applications: ["Weld inspection", "Beam angle verification", "Index point calibration"]
  }
];

export const CalibrationCatalog = ({ 
  recommendedModel, 
  onSelectModel,
  selectedModel 
}: CalibrationCatalogProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"straight" | "angle">("straight");
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewModel, setPreviewModel] = useState<CalibrationModel | null>(null);
  const [customModels, setCustomModels] = useState<CalibrationModel[]>([]);
  const [customForm, setCustomForm] = useState({
    name: "",
    description: "",
    beamType: "straight" as "straight" | "angle",
    applications: ""
  });
  const [isExportingCad, setIsExportingCad] = useState(false);
  const [isExportingCadStep, setIsExportingCadStep] = useState(false);

  // Auto-switch to the tab containing the recommended model
  useEffect(() => {
    if (recommendedModel) {
      const model = [...calibrationModels, ...customModels].find(m => m.id === recommendedModel);
      if (model) {
        setActiveTab(model.beamType);
      }
    }
  }, [recommendedModel, customModels]);

  const handleCreateCustom = () => {
    if (!customForm.name) return;

    const newModel: CalibrationModel = {
      id: `custom_${Date.now()}`,
      name: customForm.name,
      figure: "Custom",
      description: customForm.description,
      beamType: customForm.beamType,
      imageUrl: "/placeholder.svg",
      applications: customForm.applications.split(',').map(s => s.trim()).filter(Boolean),
      isCustom: true
    };

    setCustomModels([...customModels, newModel]);
    setShowCustomDialog(false);
    setCustomForm({ name: "", description: "", beamType: "straight", applications: "" });
  };

  const allModels = [...calibrationModels, ...customModels];
  const straightModels = allModels.filter(m => m.beamType === "straight");
  const angleModels = allModels.filter(m => m.beamType === "angle");

  const handlePreviewModel = (model: CalibrationModel, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewModel(model);
    setShowPreviewDialog(true);
  };

  const handleExportModel = (model: CalibrationModel, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Sample data - in production this would come from actual calibration data
    generateCalibrationBlockPDF({
      blockType: model.id as CalibrationBlockType,
      figure: model.figure,
      standard: "ASTM E-127",
      material: "Aluminum 7075",
      dimensions: {
        length: 100,
        width: 50,
        height: 25,
        radius: model.id.includes('curved') ? 50 : undefined,
        wallThickness: model.id.includes('cylinder') ? 7 : undefined,
      },
      fbhData: model.id.includes('fbh') ? [
        { diameter: 3.2, depth: 25, position: "Center", quantity: 3 }
      ] : undefined,
      drillingData: [
        { idNum: "3/1200", blockLength: 100, fbhDiameter: 3.2, depth: 25, tolerance: "±0.1mm", note: "FBH 3/64\"" }
      ]
    });
  };

  const handleExportCadModel = async (model: CalibrationModel, e: React.MouseEvent) => {
    e.stopPropagation();

    if (model.id !== "flat_block") {
      toast.error("CAD export is currently available for the flat reference block only.");
      return;
    }

    try {
      setIsExportingCad(true);

      const job = buildCalibrationBlockJob(
        {
          id: `CAL_BLOCK_${Date.now()}`,
          blockLength: 100,
          blockWidth: 50,
          blockHeight: 25,
          stepLength: 40,
          stepHeight: 12.5,
          holeRadius: 1.6, // Ø3.2 mm FBH
          holeOffsetX: 30,
          holeOffsetY: 25, // center across width
          holeSpacingX: 40,
        },
        "TECHDRAW_TEMPLATE_PLACEHOLDER",
        "DUMMY_OUTPUT_PATH.pdf",
      );

      const response = await fetch("/api/cad/drawings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Server returned ${response.status}`;
        toast.error(`Failed to generate CAD calibration drawing: ${message}`);
        return;
      }

      const data = await response.json();

      if (!data?.pdfUrl) {
        toast.error("CAD calibration drawing did not return a PDF URL.");
        return;
      }

      const pdfUrl: string = data.pdfUrl;
      const absoluteUrl = pdfUrl.startsWith("http")
        ? pdfUrl
        : `${window.location.origin}${pdfUrl}`;

      window.open(absoluteUrl, "_blank", "noopener,noreferrer");
      toast.success("CAD calibration drawing generated via FreeCAD engine.");
    } catch (err) {
      console.error("Error generating CAD calibration drawing", err);
      toast.error("Unexpected error while generating CAD calibration drawing.");
    } finally {
      setIsExportingCad(false);
    }
  };

  const handleExportCadStepModel = async (model: CalibrationModel, e: React.MouseEvent) => {
    e.stopPropagation();

    if (model.id !== "flat_block") {
      toast.error("3D CAD export is currently available for the flat reference block only.");
      return;
    }

    try {
      setIsExportingCadStep(true);

      const payload = {
        shapeType: "calibration_flat_block",
        parameters: {
          block_length: 100,
          block_width: 50,
          block_height: 25,
          step_length: 40,
          step_height: 12.5,
          hole_diameter: 3.2,
          hole_offset_x: 30,
          hole_offset_y: 25,
          hole_spacing_x: 40,
          material: "Aluminum 7075",
          standard: "ASTM E-127",
          quality: "high",
          source: "ScanMaster CalibrationCatalog",
          model_id: model.id,
        },
      };

      const response = await fetch("/api/cad/engine/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Server returned ${response.status}`;
        toast.error(`Failed to generate 3D calibration model: ${message}`);
        return;
      }

      const data = await response.json();

      if (!data?.stepUrl) {
        toast.error("3D calibration model generation did not return a STEP URL.");
        return;
      }

      const stepUrl: string = data.stepUrl;
      const absoluteUrl = stepUrl.startsWith("http")
        ? stepUrl
        : `${window.location.origin}${stepUrl}`;

      window.open(absoluteUrl, "_blank", "noopener,noreferrer");
      toast.success("3D calibration model generated via ScanMaster CAD Engine.");
    } catch (err) {
      console.error("Error generating 3D calibration model", err);
      toast.error("Unexpected error while generating 3D calibration model.");
    } finally {
      setIsExportingCadStep(false);
    }
  };

  const ModelCard = ({ model }: { model: CalibrationModel }) => {
    const isRecommended = model.id === recommendedModel;
    const isSelected = model.id === selectedModel;

    return (
      <Card
        className={`relative p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
          isRecommended
            ? "ring-4 ring-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] animate-pulse-glow"
            : isSelected
            ? "ring-2 ring-accent"
            : "hover:shadow-lg"
        }`}
        onClick={() => onSelectModel(model.id as string)}
      >
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-primary text-primary-foreground shadow-lg flex items-center gap-1 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Recommended
            </Badge>
          </div>
        )}
        
        {model.isCustom && (
          <div className="absolute -top-3 right-3 z-10">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
              Custom
            </Badge>
          </div>
        )}

        <div className="w-full bg-muted rounded-md mb-3 overflow-hidden">
          {model.isCustom ? (
            <img 
              src={model.imageUrl} 
              alt={model.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <CalibrationBlockDrawing 
              blockType={model.id as CalibrationBlockType}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground">{model.name}</h4>
            <Badge variant="secondary" className="text-xs shrink-0">
              {model.figure}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {model.description}
          </p>

          <div className="flex flex-wrap gap-1 pt-2">
            {model.applications.slice(0, 2).map((app, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {app}
              </Badge>
            ))}
            {model.applications.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{model.applications.length - 2} more
              </Badge>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => handlePreviewModel(model, e)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => handleExportModel(model, e)}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              disabled={isExportingCad}
              onClick={(e) => handleExportCadModel(model, e)}
            >
              <FileText className="h-4 w-4" />
              CAD PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              disabled={isExportingCadStep}
              onClick={(e) => handleExportCadStepModel(model, e)}
            >
              <FileText className="h-4 w-4" />
              3D STEP
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "straight" | "angle")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="straight">Straight Beam</TabsTrigger>
            <TabsTrigger value="angle">Angle Beam</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Custom Model
          </Button>
        </div>

        <TabsContent value="straight" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {straightModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          {straightModels.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No straight beam models available. Create a custom model.
            </div>
          )}
        </TabsContent>

        <TabsContent value="angle" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {angleModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          {angleModels.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No angle beam models available. Create a custom model.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader>
              <DrawerTitle>Preview - {previewModel?.name}</DrawerTitle>
              <DrawerDescription>
                This is a preview of the document that will be generated
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="max-h-[75vh] px-4">
              {previewModel && (
            <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
              {/* Header Section */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold">Calibration Block - {previewModel.id}</h3>
                  <p className="text-sm text-muted-foreground">{previewModel.figure}</p>
                </div>
                <div className="text-right text-sm border rounded p-3">
                  <div><strong>Document:</strong> CAL-001</div>
                  <div><strong>Type:</strong> CALIBRATION BLOCK</div>
                  <div><strong>Figure:</strong> {previewModel.figure}</div>
                  <div><strong>Rev:</strong> 01</div>
                </div>
              </div>

              {/* Block Specifications */}
              <div>
                <h4 className="font-semibold mb-2">Block Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="border rounded p-2">
                    <strong>Standard Reference:</strong> ASTM E-127
                  </div>
                  <div className="border rounded p-2">
                    <strong>Material:</strong> Aluminum 7075
                  </div>
                  <div className="border rounded p-2 col-span-2">
                    <strong>Block Type:</strong> {previewModel.id}
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h4 className="font-semibold mb-2">Dimensions (mm)</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="border rounded p-2">
                    <strong>Length:</strong> 100
                  </div>
                  <div className="border rounded p-2">
                    <strong>Width:</strong> 50
                  </div>
                  <div className="border rounded p-2">
                    <strong>Height:</strong> 25
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              <div>
                <h4 className="font-semibold mb-2">Technical Drawing</h4>
                <div className="border rounded p-4 bg-white">
                  {previewModel.isCustom ? (
                    <img 
                      src={previewModel.imageUrl} 
                      alt={previewModel.name}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <CalibrationBlockDrawing 
                      blockType={previewModel.id as CalibrationBlockType}
                    />
                  )}
                </div>
              </div>

              {/* Applications */}
              <div>
                <h4 className="font-semibold mb-2">Applications</h4>
                <div className="flex flex-wrap gap-2">
                  {previewModel.applications.map((app, idx) => (
                    <Badge key={idx} variant="outline">{app}</Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• All dimensions are in millimeters unless otherwise specified</li>
                  <li>• Tolerance: ±0.1mm unless otherwise specified</li>
                  <li>• Surface finish: Ra ≤ 6.3μm</li>
                  <li>• Material certification required</li>
                </ul>
              </div>
            </div>
          )}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview - {previewModel?.name}</DialogTitle>
              <DialogDescription>
                This is a preview of the document that will be generated
              </DialogDescription>
            </DialogHeader>
            
            {previewModel && (
              <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold">Calibration Block - {previewModel.id}</h3>
                    <p className="text-sm text-muted-foreground">{previewModel.figure}</p>
                  </div>
                  <div className="text-right text-sm border rounded p-3">
                    <div><strong>Document:</strong> CAL-001</div>
                    <div><strong>Type:</strong> CALIBRATION BLOCK</div>
                    <div><strong>Figure:</strong> {previewModel.figure}</div>
                    <div><strong>Rev:</strong> 01</div>
                  </div>
                </div>

                {/* Block Specifications */}
                <div>
                  <h4 className="font-semibold mb-2">Block Specifications</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="border rounded p-2">
                      <strong>Standard Reference:</strong> ASTM E-127
                    </div>
                    <div className="border rounded p-2">
                      <strong>Material:</strong> Aluminum 7075
                    </div>
                    <div className="border rounded p-2 col-span-2">
                      <strong>Block Type:</strong> {previewModel.id}
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <h4 className="font-semibold mb-2">Dimensions (mm)</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="border rounded p-2">
                      <strong>Length:</strong> 100
                    </div>
                    <div className="border rounded p-2">
                      <strong>Width:</strong> 50
                    </div>
                    <div className="border rounded p-2">
                      <strong>Height:</strong> 25
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Technical Drawing</h4>
                  <div className="border rounded p-4 bg-white">
                    {previewModel.isCustom ? (
                      <img 
                        src={previewModel.imageUrl} 
                        alt={previewModel.name}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <CalibrationBlockDrawing 
                        blockType={previewModel.id as CalibrationBlockType}
                      />
                    )}
                  </div>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="font-semibold mb-2">Applications</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewModel.applications.map((app, idx) => (
                      <Badge key={idx} variant="outline">{app}</Badge>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• All dimensions are in millimeters unless otherwise specified</li>
                    <li>• Tolerance: ±0.1mm unless otherwise specified</li>
                    <li>• Surface finish: Ra ≤ 6.3μm</li>
                    <li>• Material certification required</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Model Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={showCustomDialog} onOpenChange={setShowCustomDialog}>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader>
              <DrawerTitle>Create Custom Calibration Model</DrawerTitle>
              <DrawerDescription>
                Define your own calibration block configuration for unique inspection requirements
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="max-h-[70vh] px-4">
              <div className="space-y-4 mt-4 pb-4">
                <div className="space-y-2">
                  <Label>Model Name *</Label>
                  <Input
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="e.g., Custom Forging Block"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={customForm.description}
                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                    placeholder="Describe the block configuration..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beam Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={customForm.beamType === "straight"}
                        onChange={() => setCustomForm({ ...customForm, beamType: "straight" })}
                        className="w-4 h-4"
                      />
                      <span>Straight Beam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={customForm.beamType === "angle"}
                        onChange={() => setCustomForm({ ...customForm, beamType: "angle" })}
                        className="w-4 h-4"
                      />
                      <span>Angle Beam</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Applications (comma-separated)</Label>
                  <Input
                    value={customForm.applications}
                    onChange={(e) => setCustomForm({ ...customForm, applications: e.target.value })}
                    placeholder="e.g., Forging inspection, Custom geometry"
                  />
                </div>
              </div>
            </ScrollArea>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustom} disabled={!customForm.name}>
                Create Model
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Calibration Model</DialogTitle>
            <DialogDescription>
              Define your own calibration block configuration for unique inspection requirements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Model Name *</Label>
              <Input
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                placeholder="e.g., Custom Forging Block"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={customForm.description}
                onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                placeholder="Describe the block configuration..."
              />
            </div>

            <div className="space-y-2">
              <Label>Beam Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={customForm.beamType === "straight"}
                    onChange={() => setCustomForm({ ...customForm, beamType: "straight" })}
                    className="w-4 h-4"
                  />
                  <span>Straight Beam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={customForm.beamType === "angle"}
                    onChange={() => setCustomForm({ ...customForm, beamType: "angle" })}
                    className="w-4 h-4"
                  />
                  <span>Angle Beam</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applications (comma-separated)</Label>
              <Input
                value={customForm.applications}
                onChange={(e) => setCustomForm({ ...customForm, applications: e.target.value })}
                placeholder="e.g., Forging inspection, Custom geometry"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustom} disabled={!customForm.name}>
                Create Model
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
