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

  // Standard layout configuration - 2 views only (Front and Side)
  const layout: LayoutConfig = useMemo(() => ({
    frontView: { x: 50, y: 80, width: 380, height: 450 },
    sideView: { x: 460, y: 80, width: 380, height: 450 },
    // Keep these for compatibility but won't be used
    topView: { x: 0, y: 0, width: 0, height: 0 },
    isometric: { x: 0, y: 0, width: 0, height: 0 }
  }), []);

  // Prepare dimensions with deep comparison to ensure updates
  const drawingDimensions: Dimensions = useMemo(() => {
    // Determine if shape is hollow based on explicit flag OR presence of innerDiameter
    const isHollow = debouncedDimensions.isHollow ||
                     (debouncedDimensions.innerDiameter !== undefined && debouncedDimensions.innerDiameter > 0);

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
      isHollow: isHollow,
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
    debouncedDimensions.wallThickness,
    debouncedDimensions.isHollow
  ]);

  // Enriched dimensions object for scan coverage calculations. The scan
  // module expects some generic fields like `height`, `majorAxis`, etc.
  // We derive sensible defaults from the core drawing dimensions so that
  // coverage zones are well-formed instead of producing NaN geometry.
  const coverageDimensions = useMemo(() => {
    const baseHeight = drawingDimensions.thickness || drawingDimensions.width || drawingDimensions.length;
    const baseDiameter = drawingDimensions.outerDiameter || drawingDimensions.diameter || drawingDimensions.length;
    const majorAxis = drawingDimensions.length || baseDiameter || drawingDimensions.width;
    const minorAxis = drawingDimensions.width || drawingDimensions.thickness || baseHeight;

    return {
      ...drawingDimensions,
      // Additional fields used by scanCoverageVisualization helpers
      height: baseHeight,
      majorAxis,
      minorAxis,
      baseDiameter,
      topDiameter: baseDiameter ? baseDiameter * 0.7 : undefined,
    } as any;
  }, [drawingDimensions]);

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
          // ============================================
          // BOX FAMILY - Solid rectangular shapes
          // ============================================
          case 'box':
          case 'sheet':
          case 'slab':
          case 'flat_bar':
          case 'rectangular_bar':
          case 'square_bar':
          case 'billet':
          case 'block':
          case 'rectangular_forging_stock':
          case 'machined_component':
          case 'custom':
            drawBoxTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // RECTANGULAR TUBE - Hollow rectangular shapes
          // ============================================
          case 'rectangular_tube':
          case 'square_tube':
            drawRectangularTubeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // CYLINDER FAMILY - Solid circular shapes
          // ============================================
          case 'cylinder':
          case 'round_bar':
          case 'shaft':
          case 'hub':
          case 'round_forging_stock':
            drawCylinderTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'sphere':
            drawSphereTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'cone':
            drawConeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // TUBE FAMILY - Hollow circular shapes
          // ============================================
          case 'tube':
          case 'pipe':
          case 'sleeve':
          case 'bushing':
            drawTubeTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // HEXAGON FAMILY
          // ============================================
          case 'hexagon':
          case 'hex_bar':
            drawHexagonTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'plate':
            drawPlateTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'bar':
            drawBarTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // DISK FAMILY - Short solid cylinders
          // ============================================
          case 'disk':
          case 'disk_forging':
            drawDiskTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // RING FAMILY - Short hollow cylinders
          // ============================================
          case 'ring':
          case 'ring_forging':
            drawRingTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'pyramid':
            drawPyramidTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'ellipse':
            drawEllipseTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          // ============================================
          // FORGING FAMILY - Irregular forged shapes
          // ============================================
          case 'forging':
          case 'near_net_forging':
            drawForgingTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          case 'irregular':
            drawIrregularTechnicalDrawing(generator, drawingDimensions, layout);
            break;

          default:
            // Default to box for unknown types
            drawBoxTechnicalDrawing(generator, drawingDimensions, layout);
        }

      // Add scan coverage visualization if enabled. We keep this focused:
      // overlay zones on the front view + a compact legend, without the
      // oversized tables that cluttered the drawing before.
      if (showScanCoverage && generator) {
        const mappedScanType = UI_SCANTYPE_MAPPING[scanType];
        if (mappedScanType) {
          const zones = calculateScanZones(partType, coverageDimensions, 6, mappedScanType);

          if (zones.length > 0) {
            const frontViewLayout = layout.frontView;

            const maxZoneWidth = Math.max(...zones.map(z => Math.abs(z.bounds.width)));
            const maxZoneHeight = Math.max(...zones.map(z => Math.abs(z.bounds.height)));

            if (maxZoneWidth > 0 && maxZoneHeight > 0) {
              const scaleX = frontViewLayout.width / maxZoneWidth;
              const scaleY = frontViewLayout.height / maxZoneHeight;
              const scale = Math.min(scaleX, scaleY) * 0.85; // 0.85 for padding

              zones.forEach((zone) => {
                const scaledBounds = {
                  x: frontViewLayout.x + (zone.bounds.x * scale) + (frontViewLayout.width - maxZoneWidth * scale) / 2,
                  y: frontViewLayout.y + (zone.bounds.y * scale) + (frontViewLayout.height - maxZoneHeight * scale) / 2,
                  width: zone.bounds.width * scale,
                  height: zone.bounds.height * scale
                };

                const scaledZone: ScanZone = {
                  ...zone,
                  bounds: scaledBounds,
                  actualInnerRadius: zone.actualInnerRadius !== undefined ? zone.actualInnerRadius * scale : undefined,
                  actualOuterRadius: zone.actualOuterRadius !== undefined ? zone.actualOuterRadius * scale : undefined,
                  // Slightly reduce opacity for a cleaner overlay
                  opacity: Math.min(0.6, zone.opacity ?? 0.6),
                };

                renderScanZone(generator, scaledZone, true, true);
              });

              // Compact legend near the bottom of the front view
              addScanLegend(generator, zones, {
                x: frontViewLayout.x,
                y: frontViewLayout.y + frontViewLayout.height + 40,
                orientation: 'horizontal',
              });
            }
          }
        }
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
  }, [partType, drawingDimensions, layout, showGrid, material, showScanCoverage, scanType, coverageDimensions]);

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
