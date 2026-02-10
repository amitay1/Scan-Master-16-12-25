import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Wand2, Download } from "lucide-react";
import { RealTimeTechnicalDrawing } from "@/components/RealTimeTechnicalDrawing";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { PartGeometry, StandardType } from "@/types/techniqueSheet";
import { exportToDXF } from "@/utils/technicalDrawings/exportUtils";

interface PartDiagramTabProps {
  partDiagramImage?: string;
  onChange: (image: string | undefined) => void;
  standardType?: StandardType;
  partNumber?: string;
  partType?: string;
  thickness?: string;
  diameter?: string;
  length?: string;
  width?: string;
}

export const PartDiagramTab = ({ 
  partDiagramImage, 
  onChange, 
  standardType,
  partNumber,
  partType = "cylinder",
  thickness = "50",
  diameter = "200",
  length = "400",
  width = "100"
}: PartDiagramTabProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDrawing, setShowDrawing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setShowDrawing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setShowDrawing(true);
    
    // Wait a bit for the component to render, then capture the canvas
    setTimeout(() => {
      captureDrawing();
    }, 500);
  };

  const captureDrawing = () => {
    const canvas = document.querySelector('#technical-drawing-canvas') as HTMLCanvasElement;
    if (canvas) {
      const imageDataUrl = canvas.toDataURL('image/png');
      onChange(imageDataUrl);
      setIsGenerating(false);
      toast.success("Technical drawing generated successfully!");
    } else {
      setIsGenerating(false);
      toast.error("Failed to generate drawing");
    }
  };

  const handleExportDXF = () => {
    if (!partDiagramImage) {
      toast.error("Please generate a drawing first before exporting to DXF");
      return;
    }
    
    try {
      // Map part type to geometry type
      const geometryType = mapPartTypeToGeometry(partType);
      
      const dxfContent = exportToDXF(geometryType, {
        length: parseFloat(length) || 400,
        width: parseFloat(width) || 100,
        thickness: parseFloat(thickness) || 50,
        diameter: parseFloat(diameter) || 200,
      });
      
      // Create blob and download
      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `part-diagram-${partType}-${Date.now()}.dxf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("DXF exported successfully!");
    } catch (error) {
      console.error('DXF export error:', error);
      toast.error("Failed to export DXF. Please try again.");
    }
  };

  const mapPartTypeToGeometry = (type: string): PartGeometry => {
    const typeMap: Record<string, PartGeometry> = {
      // Primary shapes
      'tube': 'tube',
      'cylinder': 'cylinder',
      'box': 'box',
      'sphere': 'sphere',
      'cone': 'cone',
      'hexagon': 'hexagon',
      'rectangular_tube': 'rectangular_tube',

      // Extended shapes
      'plate': 'plate',
      'bar': 'bar',
      'disk': 'disk',
      'ring': 'ring',
      'pyramid': 'pyramid',
      'ellipse': 'ellipse',
      'forging': 'forging',
      'irregular': 'irregular',

      // BOX family aliases
      'rectangular': 'box',
      'sheet': 'box',
      'slab': 'box',
      'flat_bar': 'bar',
      'rectangular_bar': 'bar',
      'square_bar': 'box',
      'billet': 'box',
      'block': 'box',
      'rectangular_forging_stock': 'box',
      'machined_component': 'box',
      'custom': 'box',

      // CYLINDER family aliases
      'round_bar': 'cylinder',
      'shaft': 'cylinder',
      'hub': 'cylinder',
      'round_forging_stock': 'cylinder',
      'disk_forging': 'disk',

      // TUBE family aliases
      'pipe': 'tube',
      'sleeve': 'tube',
      'bushing': 'tube',
      'ring_forging': 'ring',
      'square_tube': 'rectangular_tube',

      // HEXAGON family aliases
      'hex_bar': 'hexagon',

      // FORGING family aliases
      'near_net_forging': 'forging',
    };
    return typeMap[type] || 'box';
  };

  return (
    <div className="space-y-2 p-2">
      <div>
        <h3 className="text-xs font-semibold">Part Diagram (Page 2)</h3>
        <p className="text-sm text-muted-foreground">
          Upload a technical diagram showing the part with all scan locations and dimensions.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              type="button"
              variant="default"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Drawing"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('part-diagram-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Drawing
            </Button>
            <input
              id="part-diagram-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {partDiagramImage && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportDXF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export DXF
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onChange(undefined);
                    setShowDrawing(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </>
            )}
          </div>

          {showDrawing && (
            <div className="border rounded-lg p-4 bg-background">
              <div id="technical-drawing-container">
                <RealTimeTechnicalDrawing
                  partType={mapPartTypeToGeometry(partType)}
                  standardType={standardType}
                  partNumber={partNumber}
                  dimensions={{
                    length: parseFloat(length) || 400,
                    width: parseFloat(width) || 100,
                    thickness: parseFloat(thickness) || 50,
                    diameter: parseFloat(diameter),
                    isHollow: partType === 'tube' || partType === 'rectangular_tube',
                    wallThickness: partType === 'tube' ? parseFloat(thickness) : undefined,
                  }}
                  showGrid={true}
                  showDimensions={true}
                  viewMode="multi"
                  showScanCoverage={true}
                />
              </div>
            </div>
          )}

          {partDiagramImage && !showDrawing ? (
            <div className="border rounded-lg p-4">
              <img 
                src={partDiagramImage} 
                alt="Part Diagram" 
                className="w-full h-auto rounded"
              />
            </div>
          ) : !showDrawing && (
            <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No diagram yet</p>
              <p className="text-sm">Generate or upload a technical drawing with scan locations</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
