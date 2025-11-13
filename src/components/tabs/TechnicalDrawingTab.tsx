import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileImage, FileText, FileCode, Eye } from 'lucide-react';
import { RealTimeTechnicalDrawing } from '@/components/RealTimeTechnicalDrawing';
import { PartGeometry, MaterialType } from '@/types/techniqueSheet';
import { toast } from 'sonner';
import { TechnicalDrawingGenerator } from '@/utils/technicalDrawings/TechnicalDrawingGenerator';
import { 
  exportToSVG, 
  exportToDXF, 
  exportToPDF, 
  downloadFile 
} from '@/utils/technicalDrawings/exportUtils';

interface TechnicalDrawingTabProps {
  partType: PartGeometry;
  dimensions: {
    length: number;
    width: number;
    thickness: number;
    diameter?: number;
    isHollow?: boolean;
    innerDiameter?: number;
    innerLength?: number;
    innerWidth?: number;
    wallThickness?: number;
  };
  material?: MaterialType;
}

export const TechnicalDrawingTab = ({
  partType,
  dimensions,
  material,
}: TechnicalDrawingTabProps) => {
  const generatorRef = useRef<TechnicalDrawingGenerator | null>(null);
  const [showScanCoverage, setShowScanCoverage] = useState(false);
  const [scanType, setScanType] = useState('LONGITUDINAL_0');

  const handleExportSVG = () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        toast.error('No drawing to export');
        return;
      }
      
      // Create new generator and get SVG
      const tempGenerator = new TechnicalDrawingGenerator(canvas);
      const svgString = tempGenerator.exportToSVG();
      
      // Download SVG file
      downloadFile(
        svgString,
        `technical-drawing-${partType}-${Date.now()}.svg`,
        'image/svg+xml'
      );
      
      toast.success('SVG exported successfully!');
    } catch (error) {
      console.error('SVG export error:', error);
      toast.error('Failed to export SVG');
    }
  };

  const handleExportDXF = () => {
    try {
      const dxfString = exportToDXF(partType, dimensions);
      
      // Download DXF file
      downloadFile(
        dxfString,
        `technical-drawing-${partType}-${Date.now()}.dxf`,
        'application/dxf'
      );
      
      toast.success('DXF exported successfully! Ready for AutoCAD');
    } catch (error) {
      console.error('DXF export error:', error);
      toast.error('Failed to export DXF');
    }
  };

  const handleExportPDF = () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        toast.error('No drawing to export');
        return;
      }
      
      const pdf = exportToPDF(canvas, partType, dimensions, material);
      pdf.save(`technical-drawing-${partType}-${Date.now()}.pdf`);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `technical-drawing-${partType}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('PNG exported successfully!');
    } else {
      toast.error('No drawing to export');
    }
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold">Technical Drawing</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-view technical drawing (ISO 128 compliant)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleExportPNG} 
            variant="outline"
            size="sm"
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <FileImage className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button 
            onClick={handleExportSVG} 
            variant="outline"
            size="sm"
            className="hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <FileCode className="w-4 h-4 mr-2" />
            SVG
          </Button>
          <Button 
            onClick={handleExportDXF} 
            variant="outline"
            size="sm"
            className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            DXF (AutoCAD)
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="outline"
            size="sm"
            className="hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Scan Coverage Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Switch 
              checked={showScanCoverage}
              onCheckedChange={setShowScanCoverage}
              id="scan-coverage-toggle"
              data-testid="switch-scan-coverage"
            />
            <Label htmlFor="scan-coverage-toggle" className="flex items-center gap-2 cursor-pointer">
              <Eye className="w-4 h-4" />
              Show Scan Coverage
            </Label>
          </div>
          
          {showScanCoverage && (
            <Select value={scanType} onValueChange={setScanType}>
              <SelectTrigger className="w-[220px]" data-testid="select-scan-type">
                <SelectValue placeholder="Select scan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LONGITUDINAL_0">Longitudinal 0°</SelectItem>
                <SelectItem value="SHEAR_45">Shear 45°</SelectItem>
                <SelectItem value="SHEAR_60">Shear 60°</SelectItem>
                <SelectItem value="SHEAR_70">Shear 70°</SelectItem>
                <SelectItem value="CIRCUMFERENTIAL">Circumferential</SelectItem>
                <SelectItem value="AXIAL">Axial</SelectItem>
                <SelectItem value="RADIAL">Radial</SelectItem>
                <SelectItem value="SURFACE_WAVE">Surface Wave</SelectItem>
                <SelectItem value="LAMB_WAVE">Lamb Wave</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Drawing Card */}
      <Card className="p-6">
        <div className="w-full" style={{ height: '650px' }}>
          <RealTimeTechnicalDrawing
            partType={partType}
            dimensions={dimensions}
            material={material}
            viewMode="multi"
            showGrid={false}
            showDimensions={true}
            showScanCoverage={showScanCoverage}
            scanType={scanType}
          />
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Dimensions</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>Length: {dimensions.length}mm</p>
            <p>Width: {dimensions.width}mm</p>
            <p>Thickness: {dimensions.thickness}mm</p>
            {dimensions.diameter && <p>Outer Diameter: Ø{dimensions.diameter}mm</p>}
            {dimensions.innerDiameter && (
              <>
                <p>Inner Diameter: Ø{dimensions.innerDiameter}mm</p>
                <p>Wall Thickness: {dimensions.wallThickness?.toFixed(2)}mm</p>
              </>
            )}
            {dimensions.innerLength && dimensions.innerWidth && (
              <>
                <p>Inner Length: {dimensions.innerLength}mm</p>
                <p>Inner Width: {dimensions.innerWidth}mm</p>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Part Information</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>Type: {partType.toUpperCase()}</p>
            {material && <p>Material: {material}</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Drawing Standard</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>Standard: ISO 128</p>
            <p>Views: Front, Top, Side, Isometric</p>
            <p>Line Types: Visible, Hidden, Center, Dimension</p>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Line Standards (ISO 128)</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-black" style={{ height: '3.5px' }}></div>
            <span className="text-sm text-muted-foreground">Visible (3.5px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 border-t-2 border-dashed" style={{ borderColor: '#404040', borderWidth: '2px' }}></div>
            <span className="text-sm text-muted-foreground">Hidden (2.0px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 border-t border-dashed" style={{ borderColor: '#303030', borderWidth: '1.5px' }}></div>
            <span className="text-sm text-muted-foreground">Center (1.5px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12" style={{ height: '1.2px', backgroundColor: '#202020' }}></div>
            <span className="text-sm text-muted-foreground">Dimension (1.2px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-gray-300" style={{ 
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #303030 2px, #303030 3px)' 
            }}></div>
            <span className="text-sm text-muted-foreground">Section (3.0px)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
