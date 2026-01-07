import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, ZoomIn, ZoomOut, Maximize2, ExternalLink, RefreshCw, FileImage, AlertCircle } from "lucide-react";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface E2375StandardDiagramProps {
  partType: PartGeometry;
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  className?: string;
}

/**
 * Maps part geometry to the correct page in E2375 standard
 * Figure 6 is on page 11, Figure 7 is on page 12
 */
const getE2375PageInfo = (partType: PartGeometry): {
  page: number;
  figure: string;
  title: string;
  titleHe: string;
  description: string;
} | null => {
  switch (partType) {
    // Figure 6 - Page 11: Plate, Flat Bar, Rectangular Bar, Round Bar
    case "box":
    case "plate":
      return {
        page: 11,
        figure: "Figure 6",
        title: "Plate and Flat Bar",
        titleHe: "פלייט ומוט שטוח",
        description: "Scan with a straight beam with the beam directed as shown. If W/T > 5, scan with straight beam. If W or T > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite side."
      };
      
    case "rectangular_bar":
    case "square_bar":
    case "billet":
    case "block":
      return {
        page: 11,
        figure: "Figure 6",
        title: "Rectangular Bar, Bloom, and Billets",
        titleHe: "מוט מלבני, בלום ובילטים",
        description: "If W/T < 5, scan with a straight beam from two adjacent sides with the sound beam directed as shown. If T or W > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite sides."
      };
      
    case "cylinder":
    case "round_bar":
    case "shaft":
    case "disk":
      return {
        page: 11,
        figure: "Figure 6",
        title: "Round Bars and Round Forging Stock",
        titleHe: "מוטות עגולים ומלאי חישול עגול",
        description: "Examine by straight beam with sound beam directed towards the center of the bar as shown while bar is rotating to locate discontinuities at or near the center of the bar."
      };

    // Figure 7 - Page 12: Ring, Tube, Disk Forging, Hex Bar
    case "tube":
    case "pipe":
    case "ring":
    case "ring_forging":
    case "sleeve":
    case "bushing":
      return {
        page: 12,
        figure: "Figure 7",
        title: "Ring Forgings",
        titleHe: "חישולי טבעת",
        description: "Scan with a straight beam from the circumference with the sound beam directed radially as shown if ring forging thickness is not > 20% of OD. Scanning with a straight beam in the axial direction is required only if L/T < 5."
      };
      
    case "disk_forging":
    case "hub":
      return {
        page: 12,
        figure: "Figure 7",
        title: "Disk Forging",
        titleHe: "חישול דיסק",
        description: "Scan with straight beams as shown, from at least one flat face, and radially from the circumference whenever practical."
      };
      
    case "hexagon":
    case "hex_bar":
      return {
        page: 12,
        figure: "Figure 7",
        title: "Hex Bar",
        titleHe: "מוט משושה",
        description: "Scan with a straight beam from three adjacent faces. Also, when T exceeds a value where attenuation reduces the signal to an unacceptable value scan from opposite sides."
      };

    // Default to Figure 6 for other shapes
    default:
      return {
        page: 11,
        figure: "Figure 6",
        title: "Standard Shapes",
        titleHe: "צורות סטנדרטיות",
        description: "Refer to ASTM E2375 for specific scanning requirements for this geometry."
      };
  }
};

// Direction colors for legend
const DIRECTION_INFO: Record<string, { color: string; name: string; wave: string }> = {
  "A": { color: "#22c55e", name: "Primary Straight Beam (Top)", wave: "LW 0°" },
  "A₁": { color: "#16a34a", name: "Primary Dual Element", wave: "LW 0° DE" },
  "B": { color: "#3b82f6", name: "Secondary Straight Beam (Side)", wave: "LW 0°" },
  "B₁": { color: "#2563eb", name: "Secondary Dual Element", wave: "LW 0° DE" },
  "C": { color: "#f59e0b", name: "Tertiary/Radial Beam", wave: "LW 0°" },
  "C₁": { color: "#d97706", name: "Tertiary Dual Element", wave: "LW 0° DE" },
  "D": { color: "#ef4444", name: "Circumferential CW", wave: "SW 45°" },
  "E": { color: "#ec4899", name: "Circumferential CCW", wave: "SW 45°" },
  "F": { color: "#8b5cf6", name: "Axial Shear Dir 1", wave: "SW 45°" },
  "G": { color: "#14b8a6", name: "Axial Shear Dir 2", wave: "SW 45°" },
  "H": { color: "#06b6d4", name: "From ID Surface", wave: "LW 0°" },
  "I": { color: "#84cc16", name: "Through-Transmission", wave: "TT" },
  "J": { color: "#f97316", name: "Shear Wave 60°", wave: "SW 60°" },
  "K": { color: "#eab308", name: "Shear Wave 45°", wave: "SW 45°" },
  "L": { color: "#a855f7", name: "Rotational 360°", wave: "LW 0° Rot" },
};

// PDF Viewer Component - tries multiple methods
const PDFViewer: React.FC<{
  pdfPath: string;
  pageNumber: number;
  scale: number;
  height?: string;
}> = ({ pdfPath, pageNumber, scale, height = "550px" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderMethod, setRenderMethod] = useState<'canvas' | 'object' | 'iframe' | 'error'>('canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [canvasError, setCanvasError] = useState(false);
  const renderTaskRef = useRef<any>(null);

  // Try canvas rendering first
  useEffect(() => {
    if (renderMethod !== 'canvas') return;
    
    let isMounted = true;
    
    const renderPage = async () => {
      if (!canvasRef.current) return;
      
      setIsLoading(true);

      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch { /* ignore cancel errors */ }
        }

        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        const page = await pdf.getPage(pageNumber);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) throw new Error("No canvas context");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        } as any);
        
        await renderTaskRef.current.promise;
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Canvas PDF render failed:", err);
        if (isMounted && err?.name !== 'RenderingCancelledException') {
          setCanvasError(true);
          setRenderMethod('object');
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore cancel errors */ }
      }
    };
  }, [pdfPath, pageNumber, scale, renderMethod]);

  // Canvas method
  if (renderMethod === 'canvas' && !canvasError) {
    return (
      <div className="relative bg-white rounded-lg" style={{ minHeight: height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading E2375 Figure {pageNumber === 11 ? '6' : '7'}...</p>
            </div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className={`mx-auto block ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    );
  }

  // Object/Embed fallback
  if (renderMethod === 'object') {
    const pdfUrl = `${pdfPath}#page=${pageNumber}&view=FitH`;
    
    return (
      <div className="relative bg-white rounded-lg overflow-hidden" style={{ height }}>
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
          onError={() => setRenderMethod('iframe')}
        >
          {/* Fallback to iframe */}
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={`E2375 Page ${pageNumber}`}
            onError={() => setRenderMethod('error')}
          />
        </object>
      </div>
    );
  }

  // Iframe fallback
  if (renderMethod === 'iframe') {
    const pdfUrl = `${pdfPath}#page=${pageNumber}`;
    
    return (
      <div className="relative bg-white rounded-lg overflow-hidden" style={{ height }}>
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title={`E2375 Page ${pageNumber}`}
          onError={() => setRenderMethod('error')}
        />
      </div>
    );
  }

  // Error state - show instructions
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-amber-50 rounded-lg border-2 border-amber-200" style={{ minHeight: height }}>
      <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold text-amber-800 mb-2">
        Cannot Display PDF Inline
      </h3>
      <p className="text-sm text-amber-700 mb-4 max-w-md">
        The E2375 standard diagram cannot be displayed directly. 
        Please click the button below to open it in a separate window.
      </p>
      <div className="flex gap-3">
        <Button 
          onClick={() => window.open(pdfPath, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open PDF
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            setRenderMethod('canvas');
            setCanvasError(false);
            setIsLoading(true);
          }}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
      <p className="text-xs text-amber-600 mt-4">
        View Page {pageNumber} for Figure {pageNumber === 11 ? '6' : '7'} diagrams
      </p>
    </div>
  );
};

export const E2375StandardDiagram: React.FC<E2375StandardDiagramProps> = ({
  partType,
  scanDetails,
  highlightedDirection,
  className = ""
}) => {
  const [scale, setScale] = useState(1.5);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const pageInfo = getE2375PageInfo(partType);
  const pdfPath = "/standards/E2375.pdf";
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.75));
  const handleRetry = () => setRetryKey(prev => prev + 1);

  const enabledDirections = scanDetails?.filter(d => d.enabled) || [];

  if (!pageInfo) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground py-8">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No E2375 diagram available for: <span className="font-mono">{partType}</span></p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {pageInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ASTM E2375-16 {pageInfo.figure} (Page {pageInfo.page}) • {pageInfo.titleHe}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                title="Reload"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfPath, '_blank')}
                title="Open PDF"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Diagram */}
            <div className="lg:col-span-2 overflow-hidden bg-gray-50 rounded-lg p-2 border">
              <PDFViewer
                key={`${pageInfo.page}-${retryKey}`}
                pdfPath={pdfPath}
                pageNumber={pageInfo.page}
                scale={scale}
                height="550px"
              />
            </div>

            {/* Legend & Info Panel */}
            <div className="space-y-4">
              {/* Description from E2375 */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Scanning Procedure (per E2375)
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {pageInfo.description}
                </p>
              </div>

              {/* Enabled Scan Directions */}
              <div className="bg-slate-100 rounded-lg p-4 border border-slate-300">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Scan Directions ({enabledDirections.length})
                </h4>
                
                {enabledDirections.length === 0 ? (
                  <div className="text-center text-slate-600 py-4">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No scan directions enabled</p>
                    <p className="text-xs text-slate-500">Enable directions from the table below</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                    {enabledDirections.map(detail => {
                      const info = DIRECTION_INFO[detail.scanningDirection];
                      if (!info) return null;
                      
                      const isHighlighted = highlightedDirection === detail.scanningDirection;
                      
                      return (
                        <div
                          key={detail.scanningDirection}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            isHighlighted 
                              ? 'bg-white ring-2 ring-offset-1 border-slate-400' 
                              : 'bg-white hover:bg-slate-50 border-slate-300'
                          }`}
                          style={{ 
                            '--tw-ring-color': isHighlighted ? info.color : undefined
                          } as React.CSSProperties}
                        >
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0 border-2 border-white"
                            style={{ backgroundColor: info.color }}
                          >
                            {detail.scanningDirection}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{info.name}</p>
                            <p className="text-xs font-medium text-slate-700">{info.wave}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reference Link */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <span>Standard: ASTM E2375-16</span>
                <a
                  href={pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Full Standard
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {pageInfo.title} - ASTM E2375-16 {pageInfo.figure}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
            <PDFViewer
              key={`fullscreen-${pageInfo.page}-${retryKey}`}
              pdfPath={pdfPath}
              pageNumber={pageInfo.page}
              scale={2.5}
              height="100%"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default E2375StandardDiagram;
