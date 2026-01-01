import React, { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, ZoomIn, ZoomOut, Maximize2, ExternalLink, RotateCw } from "lucide-react";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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

export const E2375StandardDiagram: React.FC<E2375StandardDiagramProps> = ({
  partType,
  scanDetails,
  highlightedDirection,
  className = ""
}) => {
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  const pageInfo = getE2375PageInfo(partType);
  const pdfPath = "/standards/E2375.pdf";
  
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setLoadError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setLoadError("Failed to load E2375 standard PDF");
    setIsLoading(false);
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

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

  const PDFViewer = ({ fullscreen = false }: { fullscreen?: boolean }) => (
    <div className={`bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm ${fullscreen ? 'h-full' : ''}`}>
      <Document
        file={pdfPath}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-8">
            <Skeleton className="w-[500px] h-[700px]" />
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center p-8 text-red-500">
            <Info className="w-12 h-12 mb-2" />
            <p>Error loading PDF</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.open(pdfPath, '_blank')}
            >
              Open PDF Externally
            </Button>
          </div>
        }
      >
        <Page
          pageNumber={pageInfo.page}
          scale={fullscreen ? 2 : scale}
          className="mx-auto"
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={
            <div className="flex items-center justify-center p-8">
              <Skeleton className="w-[500px] h-[700px]" />
            </div>
          }
        />
      </Document>
    </div>
  );

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
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfPath, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Diagram */}
            <div className="lg:col-span-2 overflow-auto max-h-[600px] bg-gray-50 rounded-lg p-2">
              {loadError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Info className="w-16 h-16 text-amber-500 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Cannot display PDF inline</p>
                  <p className="text-sm text-gray-500 mb-4">{loadError}</p>
                  <Button onClick={() => window.open(pdfPath, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF in New Window
                  </Button>
                </div>
              ) : (
                <PDFViewer />
              )}
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
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Scan Directions ({enabledDirections.length})
                </h4>
                
                {enabledDirections.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No scan directions enabled</p>
                    <p className="text-xs opacity-70">Enable directions from the table below</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {enabledDirections.map(detail => {
                      const info = DIRECTION_INFO[detail.scanningDirection];
                      if (!info) return null;
                      
                      const isHighlighted = highlightedDirection === detail.scanningDirection;
                      
                      return (
                        <div
                          key={detail.scanningDirection}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                            isHighlighted 
                              ? 'bg-gray-100 ring-2 ring-offset-1' 
                              : 'hover:bg-gray-50'
                          }`}
                          style={{ 
                            '--tw-ring-color': isHighlighted ? info.color : undefined
                          } as React.CSSProperties}
                        >
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
                            style={{ backgroundColor: info.color }}
                          >
                            {detail.scanningDirection}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{info.name}</p>
                            <p className="text-[10px] text-muted-foreground">{info.wave}</p>
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
            <PDFViewer fullscreen />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default E2375StandardDiagram;
