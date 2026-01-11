/**
 * Ring Segment Block Drawing Component - TUV-17 Quality
 *
 * React component for rendering professional-grade ring segment calibration
 * block technical drawings. Uses the ProfessionalRingSegmentDrawing class
 * for Paper.js-based rendering matching TUV-17 reference quality.
 *
 * Features:
 * - Multi-view layout (Top View, Section A-A, Section B-B, Section C-E, Isometric)
 * - Template selection (EN/ASTM/TUV)
 * - Part dimensions override
 * - Hole specification table
 * - Export to SVG/PNG
 * - Validation warnings display
 */

import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  FileImage,
  AlertTriangle,
  Info,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings2,
} from 'lucide-react';

import {
  ProfessionalRingSegmentDrawing,
  createProfessionalRingSegmentDrawing,
  type BlockGeometry,
  type HoleData,
  type DrawingConfig,
} from '@/utils/technicalDrawings/calibrationBlocks/professionalRingSegmentDrawing';

import {
  resolveRingSegmentBlock,
  getAvailableTemplates,
  validatePartDimensions,
  TEMPLATE_OPTIONS,
} from '@/utils/ringSegmentBlock';

import type {
  ResolvedRingSegmentBlock,
  PartDimensionsOverride,
} from '@/types/ringSegmentBlock.types';

import { RingSegmentHoleTable } from './RingSegmentHoleTable';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface RingSegmentBlockDrawingProps {
  /** Initial template ID */
  initialTemplateId?: string;
  /** Part dimensions from technique sheet (if available) */
  partDimensions?: PartDimensionsOverride;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show controls (template selector, dimension inputs) */
  showControls?: boolean;
  /** Show hole table */
  showTable?: boolean;
  /** Show warnings */
  showWarnings?: boolean;
  /** Show export buttons */
  showExport?: boolean;
  /** Callback when block is resolved */
  onBlockResolved?: (block: ResolvedRingSegmentBlock) => void;
  /** Title override */
  title?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RingSegmentBlockDrawing({
  initialTemplateId = 'EN_10228_DAC_REF_BLOCK',
  partDimensions: initialPartDims,
  width = 1400,
  height = 1000,
  showControls = true,
  showTable = true,
  showWarnings = true,
  showExport = true,
  onBlockResolved,
  title = 'Ring Segment Calibration Block',
}: RingSegmentBlockDrawingProps) {
  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [partDims, setPartDims] = useState<PartDimensionsOverride>(initialPartDims || {});
  const [resolvedBlock, setResolvedBlock] = useState<ResolvedRingSegmentBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<ProfessionalRingSegmentDrawing | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ref for callback to avoid infinite loops
  const onBlockResolvedRef = useRef(onBlockResolved);
  onBlockResolvedRef.current = onBlockResolved;

  // Get available templates
  const templates = useMemo(() => getAvailableTemplates(), []);
  const canvasSize = useMemo(() => {
    const od = resolvedBlock?.geometry.outerDiameterMm ?? 0;
    const isLarge = od >= 600;

    return {
      width: isLarge ? Math.max(width, 1400) : width,
      height: isLarge ? Math.max(height, 1000) : height,
      isLarge,
    };
  }, [resolvedBlock?.geometry.outerDiameterMm, width, height]);

  // Resolve block when template or dimensions change
  useEffect(() => {
    console.log('[RingSegmentDraw] Resolving block for template:', selectedTemplateId);
    setIsDrawing(true);
    try {
      setError(null);

      // Validate part dimensions
      if (Object.keys(partDims).length > 0) {
        const validation = validatePartDimensions(partDims);
        if (!validation.isValid) {
          const errorMsg = validation.errors.join('; ');
          console.error('[RingSegmentDraw] Part dimensions validation failed:', errorMsg);
          setError(errorMsg);
          setIsDrawing(false);
          return;
        }
      }

      // Resolve block
      console.log('[RingSegmentDraw] Calling resolveRingSegmentBlock with:', {
        templateId: selectedTemplateId,
        partDims: Object.keys(partDims).length > 0 ? partDims : 'none',
      });
      
      const block = resolveRingSegmentBlock(
        selectedTemplateId,
        Object.keys(partDims).length > 0 ? partDims : undefined
      );

      console.log('[RingSegmentDraw] Block resolved successfully:', {
        templateName: block.templateName,
        holes: block.holes.length,
        geometry: block.geometry,
      });

      setResolvedBlock(block);
      // Use ref to avoid dependency on callback
      onBlockResolvedRef.current?.(block);
      // Note: isDrawing will be set to false after canvas drawing completes
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resolve block';
      console.error('[RingSegmentDraw] Error resolving block:', errorMsg, err);
      setError(errorMsg);
      setResolvedBlock(null);
      setIsDrawing(false);
    }
  }, [selectedTemplateId, partDims]);

  // Initialize Paper.js and draw when block changes
  // Using useLayoutEffect to ensure canvas is in DOM before Paper.js init
  useLayoutEffect(() => {
    console.log('[RingSegmentDraw] useLayoutEffect triggered', {
      hasCanvas: !!canvasRef.current,
      hasResolvedBlock: !!resolvedBlock,
      width: canvasSize.width,
      height: canvasSize.height,
    });

    if (!canvasRef.current || !resolvedBlock) {
      console.log('[RingSegmentDraw] Early return - missing canvas or resolvedBlock');
      return;
    }

    const canvas = canvasRef.current;

    // Ensure canvas is actually attached to DOM and has dimensions
    if (!canvas.isConnected) {
      console.warn('[RingSegmentDraw] Canvas not connected to DOM, skipping draw');
      return;
    }

    // Clean up previous drawing FIRST before any canvas operations
    if (drawingRef.current) {
      console.log('[RingSegmentDraw] Destroying previous drawing');
      try {
        drawingRef.current.destroy();
      } catch (err) {
        console.warn('[RingSegmentDraw] Error destroying previous drawing:', err);
      }
      drawingRef.current = null;
    }

    // Clear canvas completely
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Set canvas dimensions explicitly AFTER cleanup
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    console.log('[RingSegmentDraw] Canvas dimensions set:', {
      width: canvasSize.width,
      height: canvasSize.height,
    });

    // Small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      setIsDrawing(true);
      try {
        // Convert resolved block to drawing format
        const geometry: BlockGeometry = {
          outerDiameterMm: resolvedBlock.geometry.outerDiameterMm,
          innerDiameterMm: resolvedBlock.geometry.innerDiameterMm,
          axialWidthMm: resolvedBlock.geometry.axialWidthMm,
          segmentAngleDeg: resolvedBlock.geometry.segmentAngleDeg,
        };

        console.log('[RingSegmentDraw] Geometry:', geometry);
        console.log('[RingSegmentDraw] Holes count:', resolvedBlock.holes.length);

        // Validate geometry before drawing
        if (geometry.outerDiameterMm <= geometry.innerDiameterMm) {
          setError('Invalid geometry: outer diameter must be greater than inner diameter');
          setIsDrawing(false);
          return;
        }

        const holes: HoleData[] = resolvedBlock.holes.map((h) => ({
          label: h.label,
          angleOnArcDeg: h.angleOnArcDeg,
          axialPositionMm: h.axialPositionMm,
          depthMm: h.depthMm,
          diameterMm: h.diameterMm,
          reflectorType: h.reflectorType,
        }));

        const config: Partial<DrawingConfig> = {
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
          showDimensions: true,
          showCenterlines: true,
          showHatching: true,
          showHiddenLines: true,
        };

        console.log('[RingSegmentDraw] Creating drawing...');

        // Create new drawing
        drawingRef.current = createProfessionalRingSegmentDrawing(
          canvas,
          geometry,
          holes,
          config
        );

        console.log('[RingSegmentDraw] Drawing created successfully');

        // Clear any previous error on success
        setError(null);
        setIsDrawing(false);
      } catch (err) {
        console.error('[RingSegmentDraw] Drawing error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to render drawing';
        setError(`Drawing error: ${errorMessage}`);
        setIsDrawing(false);
      }
    }, 50); // 50ms delay to ensure DOM is ready

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      if (drawingRef.current) {
        try {
          drawingRef.current.destroy();
        } catch (err) {
          console.warn('[RingSegmentDraw] Error during cleanup:', err);
        }
        drawingRef.current = null;
      }
    };
  }, [resolvedBlock, canvasSize.width, canvasSize.height]);

  // Handle dimension input change
  const handleDimensionChange = useCallback(
    (field: keyof PartDimensionsOverride, value: string) => {
      const numValue = value === '' ? undefined : parseFloat(value);
      setPartDims((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    },
    []
  );

  // Reset to template defaults
  const handleReset = useCallback(() => {
    setPartDims({});
  }, []);

  // Export to SVG
  const handleExportSVG = useCallback(() => {
    if (!drawingRef.current) return;

    const svg = drawingRef.current.exportToSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ring-segment-block-${selectedTemplateId}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }, [selectedTemplateId]);

  // Export to PNG
  const handleExportPNG = useCallback(() => {
    if (!drawingRef.current) return;

    const dataUrl = drawingRef.current.exportToPNG();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ring-segment-block-${selectedTemplateId}.png`;
    link.click();
  }, [selectedTemplateId]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Get warnings by level
  const warnings = resolvedBlock?.warnings || [];
  const errorWarnings = warnings.filter((w) => w.level === 'error');
  const warningWarnings = warnings.filter((w) => w.level === 'warning');
  const infoWarnings = warnings.filter((w) => w.level === 'info');

  // Container classes
  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white flex flex-col p-4 overflow-auto'
    : 'relative flex flex-col';

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-2 text-sm text-gray-600">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen} title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Block Configuration</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {/* Template selector */}
              <div className="col-span-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label} - {opt.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* OD input */}
              <div>
                <Label htmlFor="od">OD (mm)</Label>
                <Input
                  id="od"
                  type="number"
                  placeholder={resolvedBlock?.geometry.outerDiameterMm.toString()}
                  value={partDims.outerDiameterMm ?? ''}
                  onChange={(e) => handleDimensionChange('outerDiameterMm', e.target.value)}
                />
              </div>

              {/* ID input */}
              <div>
                <Label htmlFor="id">ID (mm)</Label>
                <Input
                  id="id"
                  type="number"
                  placeholder={resolvedBlock?.geometry.innerDiameterMm.toString()}
                  value={partDims.innerDiameterMm ?? ''}
                  onChange={(e) => handleDimensionChange('innerDiameterMm', e.target.value)}
                />
              </div>

              {/* Axial width */}
              <div>
                <Label htmlFor="axialWidth">Width (mm)</Label>
                <Input
                  id="axialWidth"
                  type="number"
                  placeholder={resolvedBlock?.geometry.axialWidthMm.toString()}
                  value={partDims.axialWidthMm ?? ''}
                  onChange={(e) => handleDimensionChange('axialWidthMm', e.target.value)}
                />
              </div>

              {/* Reset button */}
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Advanced options */}
            {showAdvanced && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                {/* Segment angle */}
                <div>
                  <Label htmlFor="segmentAngle">Angle (°)</Label>
                  <Input
                    id="segmentAngle"
                    type="number"
                    placeholder={resolvedBlock?.geometry.segmentAngleDeg.toString()}
                    value={partDims.segmentAngleDeg ?? ''}
                    onChange={(e) => handleDimensionChange('segmentAngleDeg', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warnings display */}
      {showWarnings && warnings.length > 0 && (
        <div className="space-y-2 mb-4">
          {errorWarnings.map((w, i) => (
            <Alert key={`error-${i}`} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{w.message}</AlertDescription>
            </Alert>
          ))}
          {warningWarnings.map((w, i) => (
            <Alert key={`warning-${i}`} className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{w.message}</AlertDescription>
            </Alert>
          ))}
          {infoWarnings.map((w, i) => (
            <Alert key={`info-${i}`} className="border-blue-500 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">{w.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Drawing canvas */}
      <div
        className="flex-1 border-2 border-gray-200 rounded-lg bg-white overflow-auto relative"
        style={{
          maxHeight: isFullscreen
            ? 'calc(100vh - 300px)'
            : Math.max(height + 50, canvasSize.height + 50),
        }}
      >
        {isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Rendering drawing...</p>
            </div>
          </div>
        )}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="ring-segment-block-canvas"
            data-testid="ring-segment-canvas"
          />
        </div>
      </div>

      {/* Block info summary */}
      {resolvedBlock && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex flex-wrap gap-4">
            <span>
              <strong>Template:</strong> {resolvedBlock.templateName}
            </span>
            <span>
              <strong>Standard:</strong> {resolvedBlock.standardReference}
            </span>
            <span>
              <strong>OD:</strong> {resolvedBlock.geometry.outerDiameterMm}mm
            </span>
            <span>
              <strong>ID:</strong> {resolvedBlock.geometry.innerDiameterMm}mm
            </span>
            <span>
              <strong>Wall:</strong> {resolvedBlock.calculatedGeometry.wallThicknessMm.toFixed(1)}mm
            </span>
            <span>
              <strong>Angle:</strong> {resolvedBlock.geometry.segmentAngleDeg}°
            </span>
            <span>
              <strong>Holes:</strong> {resolvedBlock.holes.length}
            </span>
            <span className={resolvedBlock.isCompliant ? 'text-green-600' : 'text-red-600'}>
              <strong>Status:</strong> {resolvedBlock.isCompliant ? 'Compliant' : 'Non-compliant'}
            </span>
          </div>
        </div>
      )}

      {/* Hole table */}
      {showTable && resolvedBlock && (
        <div className="mt-4">
          <RingSegmentHoleTable
            holes={resolvedBlock.holes}
            showAdjustedIndicator={true}
          />
        </div>
      )}

      {/* Export buttons */}
      {showExport && (
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={handleExportSVG}>
            <Download className="h-4 w-4 mr-2" />
            Export SVG
          </Button>
          <Button variant="outline" onClick={handleExportPNG}>
            <FileImage className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
        </div>
      )}

      {/* Fullscreen close button */}
      {isFullscreen && (
        <Button
          variant="default"
          size="lg"
          onClick={toggleFullscreen}
          className="fixed bottom-6 right-6"
        >
          Close Fullscreen
        </Button>
      )}
    </div>
  );
}

export default RingSegmentBlockDrawing;
