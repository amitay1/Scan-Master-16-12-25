import { useEffect, useRef, useMemo, useState } from 'react';
import { PartGeometry, MaterialType } from '@/types/techniqueSheet';
import { TechnicalDrawingGenerator, LayoutConfig, Dimensions } from '@/utils/technicalDrawings/TechnicalDrawingGenerator';
import { drawBoxTechnicalDrawing } from '@/utils/technicalDrawings/boxDrawing';
import { drawCylinderTechnicalDrawing } from '@/utils/technicalDrawings/cylinderDrawing';
import { drawTubeTechnicalDrawing } from '@/utils/technicalDrawings/tubeDrawing';
import { drawHexagonTechnicalDrawing } from '@/utils/technicalDrawings/hexagonDrawing';
import { drawSphereTechnicalDrawing } from '@/utils/technicalDrawings/sphereDrawing';
import { drawConeTechnicalDrawing } from '@/utils/technicalDrawings/coneDrawing';
import { drawPlateTechnicalDrawing } from '@/utils/technicalDrawings/plateDrawing';
import { drawBarTechnicalDrawing } from '@/utils/technicalDrawings/barDrawing';
import { drawDiskTechnicalDrawing } from '@/utils/technicalDrawings/diskDrawing';
import { drawRingTechnicalDrawing } from '@/utils/technicalDrawings/ringDrawing';
import { drawPyramidTechnicalDrawing } from '@/utils/technicalDrawings/pyramidDrawing';
import { drawEllipseTechnicalDrawing } from '@/utils/technicalDrawings/ellipseDrawing';
import { drawForgingTechnicalDrawing } from '@/utils/technicalDrawings/forgingDrawing';
import { drawIrregularTechnicalDrawing } from '@/utils/technicalDrawings/irregularDrawing';
import { drawRectangularTubeTechnicalDrawing } from '@/utils/technicalDrawings/rectangularTubeDrawing';
import {
  drawLProfileTechnicalDrawing,
  drawTProfileTechnicalDrawing,
  drawIProfileTechnicalDrawing,
  drawUProfileTechnicalDrawing,
  drawZProfileTechnicalDrawing,
} from '@/utils/technicalDrawings/profileDrawings';
import {
  ScanType,
  calculateScanZones,
  renderScanZone,
  addScanLegend,
  generateScanListTable,
  renderScanListTable,
  BEAM_ANGLES,
  ScanZone,
  UI_SCANTYPE_MAPPING
} from '@/utils/technicalDrawings/scanCoverageVisualization';
import paper from 'paper';

// Debounce hook to prevent flickering during input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface RealTimeTechnicalDrawingProps {
  partType: PartGeometry;
  material?: MaterialType;
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
  showGrid?: boolean;
  showDimensions?: boolean;
  viewMode?: 'multi' | 'front' | 'top' | 'side' | 'isometric';
  showScanCoverage?: boolean;
  scanType?: string;
}

export const RealTimeTechnicalDrawing = ({
  partType,
  dimensions,
  material,
  showGrid = true,
  showDimensions = true,
  viewMode = 'multi',
  showScanCoverage = false,
  scanType = 'LONGITUDINAL_0',
}: RealTimeTechnicalDrawingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatorRef = useRef<TechnicalDrawingGenerator | null>(null);

  // Debounce to prevent flickering during rapid input changes (400ms for stability)
  const debouncedDimensions = useDebounce(dimensions, 400);

  // Standard layout configuration
  const layout: LayoutConfig = useMemo(() => ({
    frontView: { x: 50, y: 50, width: 350, height: 250 },
    topView: { x: 450, y: 50, width: 350, height: 250 },
    sideView: { x: 50, y: 350, width: 350, height: 250 },
    isometric: { x: 450, y: 350, width: 350, height: 250 }
  }), []);

  // Prepare dimensions with deep comparison to ensure updates
  const drawingDimensions: Dimensions = useMemo(() => {
    const dims = {
      length: debouncedDimensions.length || 100,
      width: debouncedDimensions.width || 50,
      thickness: debouncedDimensions.thickness || 10,
      diameter: debouncedDimensions.diameter,
      outerDiameter: debouncedDimensions.diameter,
      innerDiameter: debouncedDimensions.innerDiameter,
      innerLength: debouncedDimensions.innerLength,
      innerWidth: debouncedDimensions.innerWidth,
      wallThickness: debouncedDimensions.wallThickness,
    };
    
    // Debug log to verify dimension updates
    console.log('📐 Drawing dimensions updated:', dims);
    
    return dims;
  }, [
    debouncedDimensions.length,
    debouncedDimensions.width,
    debouncedDimensions.thickness,
    debouncedDimensions.diameter,
    debouncedDimensions.innerDiameter,
    debouncedDimensions.innerLength,
    debouncedDimensions.innerWidth,
    debouncedDimensions.wallThickness
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 850;
    canvas.height = 650;

    // ALWAYS re-initialize generator to ensure clean slate
    // This fixes issues where the canvas doesn't update properly
    generatorRef.current = new TechnicalDrawingGenerator(canvas);
    const generator = generatorRef.current;

    // Clear previous drawing (redundant but ensures clean canvas)
    generator.clear();
    
    console.log('🎨 Redrawing canvas with dimensions:', drawingDimensions);

    // Draw grid if enabled
    if (showGrid) {
      generator.drawGrid(20, 5);
    }

    // Draw title
    generator.drawText(425, 30, `TECHNICAL DRAWING - ${partType.toUpperCase()}`, 18, '#000000');

      // Draw based on part type
      try {
        switch (partType) {
          case 'box':
            drawBoxTechnicalDrawing(generator, drawingDimensions, layout);
            break;
          
          case 'rectangular_tube':
            drawRectangularTubeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'cylinder':
            drawCylinderTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'sphere':
            drawSphereTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'cone':
            drawConeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'tube':
            drawTubeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'hexagon':
            drawHexagonTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'plate':
            drawPlateTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'bar':
            drawBarTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'disk':
            drawDiskTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'ring':
            drawRingTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'pyramid':
            drawPyramidTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'ellipse':
            drawEllipseTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'forging':
            drawForgingTechnicalDrawing(generator, drawingDimensions, layout);
            break;
            
          case 'irregular':
            drawIrregularTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'l_profile':
            drawLProfileTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 't_profile':
            drawTProfileTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'i_profile':
            drawIProfileTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'u_profile':
            drawUProfileTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'z_profile':
            drawZProfileTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          default:
            // Default to box for unknown types
            drawBoxTechnicalDrawing(generator, drawingDimensions, layout);
        }

      // Add professional scan coverage visualization if enabled
      if (showScanCoverage && generator) {
        // Map the UI scanType value to the actual ScanType enum
        const mappedScanType = UI_SCANTYPE_MAPPING[scanType];
        
        // Calculate zones using the new professional system with the selected scan type
        const zones = calculateScanZones(partType, drawingDimensions, 6, mappedScanType);
        
        // Render scan zones on the front view with professional hatching
        const frontViewLayout = layout.frontView;
        
        // Scale and position zones to fit within the front view while preserving their shape
        const maxZoneWidth = Math.max(...zones.map(z => Math.abs(z.bounds.width)));
        const maxZoneHeight = Math.max(...zones.map(z => Math.abs(z.bounds.height)));
        const scaleX = frontViewLayout.width / maxZoneWidth;
        const scaleY = frontViewLayout.height / maxZoneHeight;
        const scale = Math.min(scaleX, scaleY) * 0.85; // 0.85 for padding
        
        // No need to create a separate group - renderScanZone returns groups that will be added to the canvas
        
        zones.forEach((zone) => {
          // Preserve original bounds shape and apply scaling/translation
          const scaledBounds = {
            x: frontViewLayout.x + (zone.bounds.x * scale) + (frontViewLayout.width - maxZoneWidth * scale) / 2,
            y: frontViewLayout.y + (zone.bounds.y * scale) + (frontViewLayout.height - maxZoneHeight * scale) / 2,
            width: zone.bounds.width * scale,
            height: zone.bounds.height * scale
          };
          
          const scaledZone: ScanZone = {
            ...zone,
            bounds: scaledBounds,
            // Scale the actual radii if they exist (for annular zones)
            actualInnerRadius: zone.actualInnerRadius !== undefined ? zone.actualInnerRadius * scale : undefined,
            actualOuterRadius: zone.actualOuterRadius !== undefined ? zone.actualOuterRadius * scale : undefined
          };
          
          // Render with professional hatching and labels
          const zoneGroup = renderScanZone(generator, scaledZone, true, true);
          // The zoneGroup is already added to the generator's Paper.js project
        });
        
        // Generate and render scan list table
        const scanList = generateScanListTable(zones);
        renderScanListTable(generator, scanList, frontViewLayout.x + frontViewLayout.width + 50, frontViewLayout.y);
        
        // Add professional scan coverage legend
        addScanLegend(generator, zones, { 
          x: 50, 
          y: canvas.height - 120,
          orientation: 'horizontal'
        });
      }

      // Add title block with part information
      const partNumber = partType.toUpperCase() + '-' + Date.now().toString().slice(-6);
      const materialName = material || 'ALUMINUM';
      generator.drawTitleBlock(
        `${partType.toUpperCase().replace('_', ' ')} PART`,
        partNumber,
        materialName,
        '1:1',
        '±0.1mm',
        'A',
        new Date().toISOString().split('T')[0]
      );

      // Render the drawing
      generator.render();
    } catch (error) {
      console.error('Error generating technical drawing:', error);
    }
  }, [partType, drawingDimensions, layout, showGrid, material, showScanCoverage, scanType]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <canvas
        id="technical-drawing-canvas"
        ref={canvasRef}
        className="border border-border rounded-lg shadow-lg"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  );
};
