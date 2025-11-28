import { useState, useRef, useEffect } from 'react';
import { RealTimeTechnicalDrawing } from '@/components/RealTimeTechnicalDrawing';
import { TechnicalDrawingGenerator } from '@/utils/technicalDrawings/TechnicalDrawingGenerator';
import { exportToPDF, exportToSVG, downloadFile } from '@/utils/technicalDrawings/exportUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, 
  FileImage, 
  FileText, 
  FileCode,
  Grid3x3,
  Ruler,
  ScanLine,
  RefreshCw,
  Settings,
  Eye,
  Box,
  Circle,
  Pentagon,
  Triangle,
  Hexagon,
  Square,
  Activity
} from 'lucide-react';
import { PartGeometry, MaterialType } from '@/types/techniqueSheet';
import { buildFullRingJob } from '@shared/drawingSpec';

interface CadSolidJobPayload {
  shapeType: string;
  parameters: Record<string, any>;
}

function buildCadSolidPayload(
  geometry: PartGeometry,
  dimensions: any,
  material: MaterialType,
): CadSolidJobPayload | null {
  const baseParams: Record<string, any> = {
    material,
    quality: 'high',
    source: 'ScanMaster TechnicalDrawingTest',
    geometry_type: geometry,
  };

  const ensurePositive = (value: any): number | null => {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    if (!isFinite(n) || n <= 0) return null;
    return n;
  };

  switch (geometry) {
    case 'box':
    case 'plate':
    case 'bar':
    case 'forging':
    case 'irregular': {
      const length = ensurePositive(dimensions.length);
      const width = ensurePositive(dimensions.width);
      const thickness = ensurePositive(dimensions.thickness);
      const diameter = dimensions.diameter ? ensurePositive(dimensions.diameter) : null;

      if (!length || !width || !thickness) {
        return null;
      }

      const params: Record<string, any> = {
        length,
        width,
        height: thickness,
      };

      if (diameter) {
        params.nominal_diameter = diameter;
      }

      return {
        shapeType: geometry,
        parameters: {
          ...baseParams,
          ...params,
        },
      };
    }

    case 'cylinder':
    case 'hexagon': {
      const diameter = ensurePositive(dimensions.diameter);
      const length = ensurePositive(dimensions.length);

      if (!diameter || !length) {
        return null;
      }

      return {
        shapeType: geometry,
        parameters: {
          ...baseParams,
          radius: diameter / 2,
          height: length,
        },
      };
    }

    case 'sphere': {
      const diameter = ensurePositive(dimensions.diameter);
      if (!diameter) {
        return null;
      }

      return {
        shapeType: 'sphere',
        parameters: {
          ...baseParams,
          radius: diameter / 2,
        },
      };
    }

    case 'cone': {
      const diameter = ensurePositive(dimensions.diameter);
      const height = ensurePositive(dimensions.length);

      if (!diameter || !height) {
        return null;
      }

      return {
        shapeType: 'cone',
        parameters: {
          ...baseParams,
          base_diameter: diameter,
          height,
        },
      };
    }

    case 'disk': {
      const diameter = ensurePositive(dimensions.diameter);
      const thickness = ensurePositive(dimensions.thickness);

      if (!diameter || !thickness) {
        return null;
      }

      return {
        shapeType: 'disk',
        parameters: {
          ...baseParams,
          diameter,
          thickness,
        },
      };
    }

    case 'ring': {
      const outerDiameter = ensurePositive(dimensions.outerDiameter);
      const innerDiameter = ensurePositive(dimensions.innerDiameter);
      const thickness = ensurePositive(dimensions.length ?? dimensions.thickness);

      if (!outerDiameter || !innerDiameter || !thickness) {
        return null;
      }

      return {
        shapeType: 'ring',
        parameters: {
          ...baseParams,
          outer_diameter: outerDiameter,
          inner_diameter: innerDiameter,
          thickness,
        },
      };
    }

    case 'tube': {
      const outerDiameter = ensurePositive(dimensions.outerDiameter);
      const innerDiameter = ensurePositive(dimensions.innerDiameter);
      const length = ensurePositive(dimensions.length);

      if (!outerDiameter || !innerDiameter || !length) {
        return null;
      }

      return {
        shapeType: 'tube',
        parameters: {
          ...baseParams,
          outer_diameter: outerDiameter,
          inner_diameter: innerDiameter,
          length,
        },
      };
    }

    case 'rectangular_tube': {
      const length = ensurePositive(dimensions.length);
      const outerWidth = ensurePositive(dimensions.outerDiameter);
      const outerHeight = ensurePositive(dimensions.width);
      const wallThickness = ensurePositive(dimensions.wallThickness);

      if (!length || !outerWidth || !outerHeight || !wallThickness) {
        return null;
      }

      return {
        shapeType: 'rectangular_tube',
        parameters: {
          ...baseParams,
          length,
          outer_width: outerWidth,
          outer_height: outerHeight,
          wall_thickness: wallThickness,
        },
      };
    }

    case 'pyramid': {
      const baseLength = ensurePositive(dimensions.length);
      const baseWidth = ensurePositive(dimensions.width);
      const height = ensurePositive(dimensions.thickness);

      if (!baseLength || !baseWidth || !height) {
        return null;
      }

      return {
        shapeType: 'pyramid',
        parameters: {
          ...baseParams,
          base_length: baseLength,
          base_width: baseWidth,
          height,
        },
      };
    }

    case 'ellipse': {
      const majorAxis = ensurePositive(dimensions.length);
      const minorAxis = ensurePositive(dimensions.width);
      const thickness = ensurePositive(dimensions.thickness);

      if (!majorAxis || !minorAxis || !thickness) {
        return null;
      }

      return {
        shapeType: 'ellipse',
        parameters: {
          ...baseParams,
          major_axis: majorAxis,
          minor_axis: minorAxis,
          thickness,
        },
      };
    }

    case 'l_profile':
    case 't_profile':
    case 'i_profile':
    case 'u_profile':
    case 'z_profile': {
      const length = ensurePositive(dimensions.length);
      const width = ensurePositive(dimensions.width);
      const thickness = ensurePositive(dimensions.thickness);
      const wallThickness = dimensions.wallThickness ? ensurePositive(dimensions.wallThickness) : null;

      if (!length || !width || !thickness) {
        return null;
      }

      const params: Record<string, any> = {
        length,
        width,
        thickness,
      };

      if (wallThickness) {
        params.wall_thickness = wallThickness;
      }

      return {
        shapeType: geometry,
        parameters: {
          ...baseParams,
          ...params,
        },
      };
    }

    default:
      return null;
  }
}

// Icon mapping for geometry types
const geometryIcons: Record<string, React.ReactNode> = {
  'box': <Box className="w-4 h-4" />,
  'rectangular_tube': <Square className="w-4 h-4" />,
  'cylinder': <Circle className="w-4 h-4" />,
  'tube': <Circle className="w-4 h-4" />,
  'sphere': <Circle className="w-4 h-4" />,
  'cone': <Triangle className="w-4 h-4" />,
  'disk': <Circle className="w-4 h-4" />,
  'ring': <Circle className="w-4 h-4" />,
  'plate': <Square className="w-4 h-4" />,
  'bar': <Square className="w-4 h-4" />,
  'pyramid': <Triangle className="w-4 h-4" />,
  'ellipse': <Circle className="w-4 h-4" />,
  'forging': <Pentagon className="w-4 h-4" />,
  'irregular': <Activity className="w-4 h-4" />,
  'hexagon': <Hexagon className="w-4 h-4" />,
  'l_profile': <Square className="w-4 h-4" />,
  't_profile': <Square className="w-4 h-4" />,
  'i_profile': <Square className="w-4 h-4" />,
  'u_profile': <Square className="w-4 h-4" />,
  'z_profile': <Square className="w-4 h-4" />
};

// Preset dimensions for each geometry type
const presetDimensions: Record<string, any> = {
  'box': {
    length: 200,
    width: 150,
    thickness: 80,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'cylinder': {
    length: 300,
    width: undefined,
    thickness: undefined,
    diameter: 150,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'tube': {
    length: 400,
    width: undefined,
    thickness: undefined,
    diameter: undefined,
    innerDiameter: 150,
    outerDiameter: 200,
    wallThickness: 25
  },
  'sphere': {
    length: undefined,
    width: undefined,
    thickness: undefined,
    diameter: 200,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'cone': {
    length: 200, // height
    width: undefined,
    thickness: undefined,
    diameter: 150, // base diameter
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'disk': {
    length: undefined,
    width: undefined,
    thickness: 30,
    diameter: 250,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'ring': {
    length: 40, // thickness
    width: undefined,
    thickness: 40,
    diameter: undefined,
    innerDiameter: 100,
    outerDiameter: 200,
    wallThickness: undefined
  },
  'plate': {
    length: 300,
    width: 200,
    thickness: 12,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'bar': {
    length: 400,
    width: 60,
    thickness: 60,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'pyramid': {
    length: 180, // base size
    width: 180,
    thickness: 220, // height
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'ellipse': {
    length: 250, // major axis
    width: 150, // minor axis
    thickness: 50,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'forging': {
    length: 280,
    width: 180,
    thickness: 120,
    diameter: 150, // for rounded sections
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'irregular': {
    length: 320,
    width: 240,
    thickness: 100,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'hexagon': {
    length: 300,
    width: undefined,
    thickness: undefined,
    diameter: 160,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: undefined
  },
  'rectangular_tube': {
    length: 350,
    width: 150,
    thickness: undefined,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: 200, // outer length
    wallThickness: 10
  },
  'l_profile': {
    length: 250,
    width: 100,
    thickness: 15,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: 15
  },
  't_profile': {
    length: 280,
    width: 120,
    thickness: 20,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: 20
  },
  'i_profile': {
    length: 300,
    width: 150,
    thickness: 25,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: 12
  },
  'u_profile': {
    length: 260,
    width: 110,
    thickness: 18,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: 18
  },
  'z_profile': {
    length: 240,
    width: 130,
    thickness: 16,
    diameter: undefined,
    innerDiameter: undefined,
    outerDiameter: undefined,
    wallThickness: 16
  }
};

// Geometry categories
const geometryCategories = {
  'Basic Shapes': ['box', 'cylinder', 'sphere', 'cone', 'pyramid'],
  'Plates & Bars': ['plate', 'bar', 'disk'],
  'Hollow Sections': ['tube', 'ring', 'rectangular_tube'],
  'Profiles': ['l_profile', 't_profile', 'i_profile', 'u_profile', 'z_profile'],
  'Special Shapes': ['hexagon', 'ellipse', 'forging', 'irregular']
};

// All geometry types
const allGeometryTypes = Object.values(geometryCategories).flat();

// Scan types for coverage visualization
const scanTypes = [
  { value: 'LONGITUDINAL_0', label: 'Longitudinal 0°' },
  { value: 'SHEAR_45', label: 'Shear Wave 45°' },
  { value: 'SHEAR_60', label: 'Shear Wave 60°' },
  { value: 'SHEAR_70', label: 'Shear Wave 70°' },
  { value: 'CIRCUMFERENTIAL', label: 'Circumferential' },
  { value: 'AXIAL', label: 'Axial' }
];

export default function TechnicalDrawingTest() {
  const [selectedGeometry, setSelectedGeometry] = useState<PartGeometry>('box');
  const [dimensions, setDimensions] = useState(presetDimensions['box']);
  const [customDimensions, setCustomDimensions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showScanCoverage, setShowScanCoverage] = useState(false);
  const [scanType, setScanType] = useState('LONGITUDINAL_0');
  const [material, setMaterial] = useState<MaterialType>('aluminum');
  const [isExportingCad, setIsExportingCad] = useState(false);
  const [isExportingStep, setIsExportingStep] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update dimensions when geometry changes
  useEffect(() => {
    if (!customDimensions) {
      setDimensions(presetDimensions[selectedGeometry] || presetDimensions['box']);
    }
  }, [selectedGeometry, customDimensions]);

  // Get reference to the canvas element
  useEffect(() => {
    const interval = setInterval(() => {
      const canvas = document.getElementById('technical-drawing-canvas') as HTMLCanvasElement;
      if (canvas) {
        canvasRef.current = canvas;
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [selectedGeometry, dimensions, showGrid, showDimensions, showScanCoverage, scanType]);

  const handleExportPNG = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `technical-drawing-${selectedGeometry}-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      toast.success('Drawing exported as PNG');
    } else {
      toast.error('Canvas not ready. Please wait a moment and try again.');
    }
  };

  const handleExportSVG = () => {
    if (canvasRef.current) {
      const generator = new TechnicalDrawingGenerator(canvasRef.current);
      const svgContent = exportToSVG(generator);
      downloadFile(svgContent, `technical-drawing-${selectedGeometry}-${Date.now()}.svg`, 'image/svg+xml');
      toast.success('Drawing exported as SVG');
    } else {
      toast.error('Canvas not ready. Please wait a moment and try again.');
    }
  };

  const handleExportPDF = () => {
    if (canvasRef.current) {
      const pdf = exportToPDF(canvasRef.current, selectedGeometry, dimensions, material);
      pdf.save(`technical-drawing-${selectedGeometry}-${Date.now()}.pdf`);
      toast.success('Drawing exported as PDF');
    } else {
      toast.error('Canvas not ready. Please wait a moment and try again.');
    }
  };

  const handleExportCadPdf = async () => {
    try {
      if (selectedGeometry !== 'ring') {
        toast.error('CAD PDF export is currently supported for ring geometry only. Please select "ring".');
        return;
      }

      const { outerDiameter, innerDiameter, length } = dimensions;

      if (!outerDiameter || !innerDiameter || !length) {
        toast.error('Missing dimensions for ring geometry. Please fill in outer diameter, inner diameter and thickness.');
        return;
      }

      setIsExportingCad(true);

      const job = buildFullRingJob(
        {
          id: `RING_${Date.now()}`,
          length,
          od: outerDiameter,
          idInner: innerDiameter,
        },
        'TECHDRAW_TEMPLATE_PLACEHOLDER',
        'DUMMY_OUTPUT_PATH.pdf',
      );

      const response = await fetch('/api/cad/drawings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Server returned ${response.status}`;
        toast.error(`Failed to generate CAD PDF: ${message}`);
        return;
      }

      const data = await response.json();

      if (!data?.pdfUrl) {
        toast.error('CAD PDF generation did not return a PDF URL.');
        return;
      }

      const pdfUrl: string = data.pdfUrl;
      const absoluteUrl = pdfUrl.startsWith('http')
        ? pdfUrl
        : `${window.location.origin}${pdfUrl}`;

      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
      toast.success('CAD PDF generated using the FreeCAD engine');
    } catch (err) {
      console.error('Error while generating CAD PDF', err);
      toast.error('Unexpected error while generating CAD PDF. Check server logs for details.');
    } finally {
      setIsExportingCad(false);
    }
  };

  const handleExportCadStep = async () => {
    try {
      const payload = buildCadSolidPayload(selectedGeometry, dimensions, material);

      if (!payload) {
        toast.error('3D CAD export is not available for this geometry or some dimensions are missing.');
        return;
      }

      setIsExportingStep(true);

      const response = await fetch('/api/cad/engine/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Server returned ${response.status}`;
        toast.error(`Failed to generate 3D STEP model: ${message}`);
        return;
      }

      const data = await response.json();

      if (!data?.stepUrl) {
        toast.error('3D STEP generation did not return a STEP URL.');
        return;
      }

      const stepUrl: string = data.stepUrl;
      const absoluteUrl = stepUrl.startsWith('http')
        ? stepUrl
        : `${window.location.origin}${stepUrl}`;

      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
      toast.success('3D STEP model generated via ScanMaster CAD Engine');
    } catch (err) {
      console.error('Error while generating 3D STEP model', err);
      toast.error('Unexpected error while generating 3D STEP model. Check server logs for details.');
    } finally {
      setIsExportingStep(false);
    }
  };

  const handleResetDimensions = () => {
    setCustomDimensions(false);
    setDimensions(presetDimensions[selectedGeometry] || presetDimensions['box']);
    toast.info('Dimensions reset to preset values');
  };

  const updateDimension = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomDimensions(true);
      setDimensions({ ...dimensions, [key]: numValue });
    }
  };

  // Get relevant dimension fields for current geometry
  const getRelevantDimensions = () => {
    const fields = [];
    
    // Common dimensions by geometry type
    if (['box', 'plate', 'bar', 'pyramid', 'irregular', 'forging', 'l_profile', 't_profile', 'i_profile', 'u_profile', 'z_profile'].includes(selectedGeometry)) {
      fields.push({ key: 'length', label: 'Length (mm)', value: dimensions.length });
      fields.push({ key: 'width', label: 'Width (mm)', value: dimensions.width });
      fields.push({ key: 'thickness', label: 'Thickness (mm)', value: dimensions.thickness });
    }
    
    if (['rectangular_tube'].includes(selectedGeometry)) {
      fields.push({ key: 'length', label: 'Length (mm)', value: dimensions.length });
      fields.push({ key: 'outerDiameter', label: 'Outer Width (mm)', value: dimensions.outerDiameter });
      fields.push({ key: 'width', label: 'Outer Height (mm)', value: dimensions.width });
      fields.push({ key: 'wallThickness', label: 'Wall Thickness (mm)', value: dimensions.wallThickness });
    }
    
    if (['cylinder', 'hexagon'].includes(selectedGeometry)) {
      fields.push({ key: 'diameter', label: 'Diameter (mm)', value: dimensions.diameter });
      fields.push({ key: 'length', label: 'Length (mm)', value: dimensions.length });
    }
    
    if (['sphere'].includes(selectedGeometry)) {
      fields.push({ key: 'diameter', label: 'Diameter (mm)', value: dimensions.diameter });
    }
    
    if (['cone'].includes(selectedGeometry)) {
      fields.push({ key: 'diameter', label: 'Base Diameter (mm)', value: dimensions.diameter });
      fields.push({ key: 'length', label: 'Height (mm)', value: dimensions.length });
    }
    
    if (['disk'].includes(selectedGeometry)) {
      fields.push({ key: 'diameter', label: 'Diameter (mm)', value: dimensions.diameter });
      fields.push({ key: 'thickness', label: 'Thickness (mm)', value: dimensions.thickness });
    }
    
    if (['tube', 'ring'].includes(selectedGeometry)) {
      fields.push({ key: 'outerDiameter', label: 'Outer Diameter (mm)', value: dimensions.outerDiameter });
      fields.push({ key: 'innerDiameter', label: 'Inner Diameter (mm)', value: dimensions.innerDiameter });
      fields.push({ key: 'length', label: selectedGeometry === 'ring' ? 'Thickness (mm)' : 'Length (mm)', value: dimensions.length });
    }
    
    if (['ellipse'].includes(selectedGeometry)) {
      fields.push({ key: 'length', label: 'Major Axis (mm)', value: dimensions.length });
      fields.push({ key: 'width', label: 'Minor Axis (mm)', value: dimensions.width });
      fields.push({ key: 'thickness', label: 'Thickness (mm)', value: dimensions.thickness });
    }
    
    return fields;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="bg-gray-800/90 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-400" />
                  Technical Drawing Test Suite
                </CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  Comprehensive testing for all {allGeometryTypes.length} supported geometry types
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {allGeometryTypes.length} Geometries Available
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Control Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Geometry Selection */}
            <Card className="bg-gray-800/90 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-400" />
                  Geometry Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="geometry" className="text-gray-300 mb-2 block">Select Geometry Type</Label>
                  <Select value={selectedGeometry} onValueChange={(value: PartGeometry) => setSelectedGeometry(value)}>
                    <SelectTrigger id="geometry" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {geometryIcons[selectedGeometry]}
                          <span>{selectedGeometry.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-[400px]">
                      {Object.entries(geometryCategories).map(([category, types]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs text-gray-400 font-semibold">{category}</div>
                          {types.map(type => (
                            <SelectItem key={type} value={type} className="text-white hover:bg-gray-600">
                              <div className="flex items-center gap-2">
                                {geometryIcons[type]}
                                <span>{type.replace(/_/g, ' ').toUpperCase()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="material" className="text-gray-300 mb-2 block">Material</Label>
                  <Select value={material} onValueChange={(value) => setMaterial(value as MaterialType)}>
                    <SelectTrigger id="material" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="aluminum" className="text-white">Aluminum</SelectItem>
                      <SelectItem value="steel" className="text-white">Steel</SelectItem>
                      <SelectItem value="titanium" className="text-white">Titanium</SelectItem>
                      <SelectItem value="stainless_steel" className="text-white">Stainless Steel</SelectItem>
                      <SelectItem value="magnesium" className="text-white">Magnesium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card className="bg-gray-800/90 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-blue-400" />
                    Dimensions
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={customDimensions ? "default" : "outline"}
                    onClick={handleResetDimensions}
                    className="h-8"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRelevantDimensions().map(({ key, label, value }) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-gray-300 text-sm mb-1 block">{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      value={value || ''}
                      onChange={(e) => updateDimension(key, e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="1"
                      step="1"
                    />
                  </div>
                ))}
                {customDimensions && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                    Custom Dimensions Active
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card className="bg-gray-800/90 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Display Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid" className="text-gray-300 flex items-center gap-2 cursor-pointer">
                    <Grid3x3 className="w-4 h-4 text-gray-400" />
                    Show Grid
                  </Label>
                  <Switch id="grid" checked={showGrid} onCheckedChange={setShowGrid} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="dims" className="text-gray-300 flex items-center gap-2 cursor-pointer">
                    <Ruler className="w-4 h-4 text-gray-400" />
                    Show Dimensions
                  </Label>
                  <Switch id="dims" checked={showDimensions} onCheckedChange={setShowDimensions} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="scan" className="text-gray-300 flex items-center gap-2 cursor-pointer">
                    <ScanLine className="w-4 h-4 text-gray-400" />
                    Show Scan Coverage
                  </Label>
                  <Switch id="scan" checked={showScanCoverage} onCheckedChange={setShowScanCoverage} />
                </div>

                {showScanCoverage && (
                  <div>
                    <Label htmlFor="scanType" className="text-gray-300 text-sm mb-2 block">Scan Type</Label>
                    <Select value={scanType} onValueChange={setScanType}>
                      <SelectTrigger id="scanType" className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {scanTypes.map(type => (
                          <SelectItem key={type.value} value={type.value} className="text-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-gray-800/90 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Export Drawing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleExportPNG}
                  variant="outline" 
                  className="w-full justify-start text-white border-gray-600 hover:bg-gray-700"
                >
                  <FileImage className="w-4 h-4 mr-2 text-green-400" />
                  Export as PNG (Raster)
                </Button>
                <Button 
                  onClick={handleExportSVG}
                  variant="outline" 
                  className="w-full justify-start text-white border-gray-600 hover:bg-gray-700"
                >
                  <FileCode className="w-4 h-4 mr-2 text-blue-400" />
                  Export as SVG (Vector)
                </Button>
                <Button 
                  onClick={handleExportPDF}
                  variant="outline" 
                  className="w-full justify-start text-white border-gray-600 hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2 text-red-400" />
                  Export as PDF (Document)
                </Button>
                <Button 
                  onClick={handleExportCadPdf}
                  variant="default" 
                  disabled={isExportingCad}
                  className="w-full justify-start text-white border-blue-500 bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2 text-cyan-300" />
                  {isExportingCad ? 'Generating CAD PDF…' : 'Export CAD PDF (FreeCAD)'}
                </Button>
                <Button 
                  onClick={handleExportCadStep}
                  variant="default" 
                  disabled={isExportingStep}
                  className="w-full justify-start text-white border-emerald-500 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Box className="w-4 h-4 mr-2 text-emerald-300" />
                  {isExportingStep ? 'Generating 3D STEP…' : 'Export 3D STEP (ScanMaster CAD)'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Drawing Display */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-gray-800/90 border-gray-700 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    Technical Drawing Preview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      ISO 128 Compliant
                    </Badge>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {selectedGeometry.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-gray-900 rounded-lg p-4 min-h-[700px] flex items-center justify-center">
                  <RealTimeTechnicalDrawing
                    partType={selectedGeometry}
                    dimensions={dimensions}
                    material={material}
                    showGrid={showGrid}
                    showDimensions={showDimensions}
                    showScanCoverage={showScanCoverage}
                    scanType={scanType}
                    viewMode="multi"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics */}
        <Card className="bg-gray-800/90 border-gray-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(geometryCategories).map(([category, types]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{types.length}</div>
                  <div className="text-xs text-gray-400">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}