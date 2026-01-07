/**
 * Angle Beam Calibration Block Drawing Component
 *
 * Displays the arc-shaped calibration block technical drawing
 * for shear wave beam calibration on circular/curved parts.
 * Per AMS-STD-2154 / ASTM E2375 for circumferential shear wave inspection.
 * 
 * Used for: tube, cylinder, cone, sphere geometries
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface AngleBeamCalibrationBlockDrawingProps {
  width?: number;
  height?: number;
  showDimensions?: boolean;
  title?: string;
}

export function AngleBeamCalibrationBlockDrawing({
  width = 900,
  height = 700,
  title = "Shear Wave Calibration Block - Reference Standard for Circular Parts",
}: AngleBeamCalibrationBlockDrawingProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default image path - the detailed technical drawing for shear wave calibration
  const defaultImagePath = "/Technical card TUV-17.png";

  const handleLoadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setCustomImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // Use custom image if loaded, otherwise use default
  const imageSrc = customImage || defaultImagePath;

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "relative border-2 border-blue-200 rounded-xl bg-white flex flex-col items-center shadow-lg angle-beam-calibration-block";

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      data-testid="angle-beam-calibration-block"
      style={isFullscreen ? {} : { minHeight: height }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Title Banner */}
      <div className="w-full text-center py-4 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
        <h4 className="font-bold text-lg text-blue-800">{title}</h4>
        <p className="text-sm text-blue-600 mt-1">
          Applicable for: Tubes, Cylinders, Cones, Spheres - Circumferential Inspection
        </p>
      </div>

      {/* Image Display Area */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto bg-gray-50 angle-beam-image-capture"
        data-testid="angle-beam-image-capture"
        style={{ 
          width: isFullscreen ? '100%' : width,
          minHeight: isFullscreen ? 'calc(100vh - 150px)' : height - 120 
        }}
      >
        <div 
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageSrc}
            alt="Shear Wave Calibration Block - Technical Drawing with Cross Sections A-A, B-B, C-C"
            className="max-w-full h-auto object-contain rounded-lg shadow-md angle-beam-calibration-image"
            crossOrigin="anonymous"
            style={{ 
              maxHeight: isFullscreen ? '85vh' : height - 160,
              backgroundColor: 'white',
              padding: '8px'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Technical Info Bar */}
      <div className="w-full px-6 py-3 border-t-2 border-blue-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-700">
          <span className="px-3 py-1 bg-blue-50 rounded-full">Cross Section A-A & B-B: FBH positions</span>
          <span className="px-3 py-1 bg-orange-50 rounded-full">Cross Section C-C: Step wedge profile</span>
          <span className="px-3 py-1 bg-green-50 rounded-full">Arc segment: 120° coverage</span>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          Voir rapport 5394 pour Coupe A-A et B-B | Reference: AMS-STD-2154 / ASTM E2375
        </p>
      </div>

      {/* Control Buttons - Top Right */}
      <div className="absolute top-16 right-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Load/Reset Buttons - Top Left */}
      <div className="absolute top-16 left-4 flex gap-2">
        {customImage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearImage}
            className="bg-orange-500 hover:bg-orange-600 text-white border-orange-600 shadow-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadImage}
            className="bg-green-600 hover:bg-green-700 text-white border-green-700 shadow-md"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Load Custom Image
          </Button>
        )}
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
