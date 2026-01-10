/**
 * Angle Beam Calibration Block Drawing Component
 *
 * Displays the arc-shaped calibration block technical drawing
 * for shear wave beam calibration on circular/curved parts.
 * Per AMS-STD-2154 / ASTM E2375 for circumferential shear wave inspection.
 *
 * Now supports two modes:
 * - Static: Shows the TUV-17 reference image (legacy/fallback)
 * - Parametric: Dynamic, customizable drawing based on templates
 *
 * Used for: tube, cylinder, cone, sphere geometries
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings2,
  FileImage,
} from 'lucide-react';

import { RingSegmentBlockDrawing } from '@/components/drawings/RingSegmentBlockDrawing';
import type { PartDimensionsOverride, ResolvedRingSegmentBlock } from '@/types/ringSegmentBlock.types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface AngleBeamCalibrationBlockDrawingProps {
  /** Canvas/image width */
  width?: number;
  /** Canvas/image height */
  height?: number;
  /** Show dimension annotations (for static image only) */
  showDimensions?: boolean;
  /** Component title */
  title?: string;
  /** Use parametric mode by default */
  useParametric?: boolean;
  /** Part dimensions from technique sheet (for parametric mode) */
  partDimensions?: PartDimensionsOverride;
  /** Initial template ID for parametric mode */
  initialTemplateId?: string;
  /** Callback when parametric block is resolved */
  onBlockResolved?: (block: ResolvedRingSegmentBlock) => void;
}

// ============================================================================
// STATIC IMAGE SUB-COMPONENT
// ============================================================================

interface StaticImageViewProps {
  width: number;
  height: number;
  customImage: string | null;
  zoomLevel: number;
  isFullscreen: boolean;
  onLoadImage: () => void;
  onClearImage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function StaticImageView({
  width,
  height,
  customImage,
  zoomLevel,
  isFullscreen,
  onLoadImage,
  onClearImage,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  fileInputRef,
  onFileChange,
}: StaticImageViewProps) {
  // Default image path - the detailed technical drawing for shear wave calibration
  const defaultImagePath = '/Technical card TUV-17.png';
  const imageSrc = customImage || defaultImagePath;

  return (
    <div className="relative flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Image Display Area */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto bg-gray-50"
        style={{
          width: isFullscreen ? '100%' : width,
          minHeight: isFullscreen ? 'calc(100vh - 200px)' : height - 120,
        }}
      >
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageSrc}
            alt="Shear Wave Calibration Block - Technical Drawing with Cross Sections A-A, B-B, C-C"
            className="max-w-full h-auto object-contain rounded-lg shadow-md"
            crossOrigin="anonymous"
            style={{
              maxHeight: isFullscreen ? '85vh' : height - 160,
              backgroundColor: 'white',
              padding: '8px',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Technical Info Bar */}
      <div className="w-full px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-700">
          <span className="px-3 py-1 bg-blue-50 rounded-full">
            Cross Section A-A & B-B: FBH positions
          </span>
          <span className="px-3 py-1 bg-orange-50 rounded-full">
            Cross Section C-C: Step wedge profile
          </span>
          <span className="px-3 py-1 bg-green-50 rounded-full">Arc segment: 120° coverage</span>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          Voir rapport 5394 pour Coupe A-A et B-B | Reference: AMS-STD-2154 / ASTM E2375
        </p>
      </div>

      {/* Control Buttons - Top Right */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Load/Reset Buttons - Top Left */}
      <div className="absolute top-4 left-4 flex gap-2">
        {customImage ? (
          <Button variant="outline" size="sm" onClick={onClearImage}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onLoadImage}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Load Image
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AngleBeamCalibrationBlockDrawing({
  width = 900,
  height = 700,
  title = 'Shear Wave Calibration Block - Reference Standard for Circular Parts',
  useParametric = true,
  partDimensions,
  initialTemplateId = 'EN_10228_DAC_REF_BLOCK',
  onBlockResolved,
}: AngleBeamCalibrationBlockDrawingProps) {
  // State
  const [activeTab, setActiveTab] = useState<string>(useParametric ? 'parametric' : 'static');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleLoadImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setCustomImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  // Container classes
  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'relative border-2 border-blue-200 rounded-xl bg-white flex flex-col shadow-lg';

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      data-testid="angle-beam-calibration-block"
      style={isFullscreen ? {} : { minHeight: height }}
    >
      {/* Title Banner with Mode Tabs */}
      <div className="w-full border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
        <div className="text-center py-3">
          <h4 className="font-bold text-lg text-blue-800">{title}</h4>
          <p className="text-sm text-blue-600 mt-1">
            Applicable for: Tubes, Cylinders, Cones, Spheres - Circumferential Inspection
          </p>
        </div>

        {/* Mode Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-center bg-transparent">
            <TabsTrigger
              value="parametric"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Parametric (Dynamic)
            </TabsTrigger>
            <TabsTrigger
              value="static"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileImage className="h-4 w-4 mr-2" />
              Static Image (TUV-17)
            </TabsTrigger>
          </TabsList>

          {/* Parametric Mode Content */}
          <TabsContent value="parametric" className="mt-0">
            <div
              className="p-4"
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 200px)' : height - 150,
              }}
            >
              <RingSegmentBlockDrawing
                initialTemplateId={initialTemplateId}
                partDimensions={partDimensions}
                width={width - 32}
                height={height - 200}
                showControls={true}
                showTable={true}
                showWarnings={true}
                showExport={true}
                onBlockResolved={onBlockResolved}
                title=""
              />
            </div>
          </TabsContent>

          {/* Static Image Mode Content */}
          <TabsContent value="static" className="mt-0">
            <StaticImageView
              width={width}
              height={height - 100}
              customImage={customImage}
              zoomLevel={zoomLevel}
              isFullscreen={isFullscreen}
              onLoadImage={handleLoadImage}
              onClearImage={handleClearImage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onToggleFullscreen={toggleFullscreen}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={handleFileChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <Button
          variant="default"
          size="lg"
          onClick={toggleFullscreen}
          className="absolute bottom-6 right-6 shadow-lg"
        >
          Close Fullscreen
        </Button>
      )}
    </div>
  );
}

export default AngleBeamCalibrationBlockDrawing;
