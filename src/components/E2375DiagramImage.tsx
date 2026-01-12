import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Info, Maximize2, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";
import { TubeScanDiagram } from "@/components/TubeScanDiagram";
import { ConeScanDiagram } from "@/components/ConeScanDiagram";

// Check if part type should use dynamic tube diagram
const isTubeType = (partType: PartGeometry): boolean => {
  return ["tube", "pipe", "sleeve", "bushing"].includes(partType);
};

// Check if part type should use cone diagram
const isConeType = (partType: PartGeometry): boolean => {
  return ["cone", "truncated_cone", "conical"].includes(partType);
};

interface E2375DiagramImageProps {
  partType: PartGeometry;
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  className?: string;
}

// Direction info for legend
const DIRECTION_INFO: Record<string, { color: string; name: string; nameHe: string; wave: string }> = {
  "A": { color: "#22c55e", name: "Primary Straight Beam", nameHe: "קרן ישרה ראשית", wave: "LW 0°" },
  "A₁": { color: "#16a34a", name: "Primary Dual Element", nameHe: "אלמנט כפול ראשי", wave: "LW 0° DE" },
  "B": { color: "#3b82f6", name: "Secondary Straight Beam", nameHe: "קרן ישרה משנית", wave: "LW 0°" },
  "B₁": { color: "#2563eb", name: "Secondary Dual Element", nameHe: "אלמנט כפול משני", wave: "LW 0° DE" },
  "C": { color: "#f59e0b", name: "Tertiary/Radial", nameHe: "קרן שלישית/רדיאלית", wave: "LW 0°" },
  "C₁": { color: "#d97706", name: "Tertiary Dual Element", nameHe: "אלמנט כפול שלישי", wave: "LW 0° DE" },
  "D": { color: "#ef4444", name: "Circumferential CW", nameHe: "היקפי - עם השעון", wave: "SW 45°" },
  "E": { color: "#ec4899", name: "Circumferential CCW", nameHe: "היקפי - נגד השעון", wave: "SW 45°" },
  "F": { color: "#8b5cf6", name: "Axial Shear Dir 1", nameHe: "גזירה אקסיאלית 1", wave: "SW 45°" },
  "G": { color: "#14b8a6", name: "Axial Shear Dir 2", nameHe: "גזירה אקסיאלית 2", wave: "SW 45°" },
  "H": { color: "#06b6d4", name: "From ID Surface", nameHe: "מפנים (ID)", wave: "LW 0°" },
  "I": { color: "#84cc16", name: "Through-Transmission", nameHe: "TT - שני תמרים", wave: "TT" },
  "J": { color: "#f97316", name: "Shear Wave 60°", nameHe: "גל גזירה 60°", wave: "SW 60°" },
  "K": { color: "#eab308", name: "Shear Wave 45°", nameHe: "גל גזירה 45°", wave: "SW 45°" },
  "L": { color: "#a855f7", name: "Rotational 360°", nameHe: "סריקה סיבובית", wave: "LW 0° Rot" },
};

/**
 * Maps part geometry to its E2375 diagram image and info
 * Images are cropped from ASTM E2375 standard PDF Figures 6 & 7
 */
const getE2375ImageInfo = (partType: PartGeometry): {
  imagePath: string;
  figure: string;
  page: number;
  title: string;
  titleHe: string;
  description: string;
  recommendedDirections: string[];
} | null => {
  const basePath = "/standards/e2375-diagrams";
  
  switch (partType) {
    // Figure 6 shapes (Page 11)
    case "box":
    case "plate":
      return {
        imagePath: `${basePath}/plate-flat-bar.png`,
        figure: "Figure 6",
        page: 11,
        title: "Plate and Flat Bar",
        titleHe: "פלייט ומוט שטוח",
        description: "Scan with a straight beam with the beam directed as shown. If W/T > 5, scan with straight beam. If W or T > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite side.",
        recommendedDirections: ["A", "A₁", "B", "B₁"]
      };
      
    case "rectangular_bar":
    case "square_bar":
    case "billet":
    case "block":
      return {
        imagePath: `${basePath}/rectangular-bar.png`,
        figure: "Figure 6",
        page: 11,
        title: "Rectangular Bar, Bloom, and Billets",
        titleHe: "מוט מלבני, בלום ובילטים",
        description: "If W/T < 5, scan with a straight beam from two adjacent sides with the sound beam directed as shown. If T or W > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite sides.",
        recommendedDirections: ["A", "A₁", "B", "B₁"]
      };
      
    case "cylinder":
    case "round_bar":
    case "shaft":
      return {
        imagePath: `${basePath}/round-bar.png`,
        figure: "Figure 6",
        page: 11,
        title: "Round Bars and Round Forging Stock",
        titleHe: "מוטות עגולים ומלאי חישול עגול",
        description: "Examine by straight beam with sound beam directed towards the center of the bar as shown while bar is rotating to locate discontinuities at or near the center of the bar.",
        recommendedDirections: ["A", "C", "L"]
      };

    // Figure 7 shapes (Page 12)
    case "tube":
    case "pipe":
    case "sleeve":
    case "bushing":
      return {
        imagePath: `${basePath}/ring-forging.png`,
        figure: "Figure 7",
        page: 12,
        title: "Tube and Pipe",
        titleHe: "צינור",
        description: "Scan with straight beam from OD surface radially, and shear wave scans in both circumferential and axial directions for complete coverage.",
        recommendedDirections: ["C", "C₁", "D", "E", "F", "G", "H"]
      };

    case "ring":
    case "ring_forging":
      return {
        imagePath: `${basePath}/ring-forging.png`,
        figure: "Figure 7",
        page: 12,
        title: "Ring Forgings",
        titleHe: "חישולי טבעת",
        description: "Scan with a straight beam from the circumference with the sound beam directed radially as shown if ring forging thickness is not > 20% of OD. Scanning with a straight beam in the axial direction is required only if L/T < 5.",
        recommendedDirections: ["A", "C", "C₁", "D", "E", "H"]
      };
      
    case "disk":
    case "disk_forging":
    case "hub":
      return {
        imagePath: `${basePath}/disk-forging.png`,
        figure: "Figure 7",
        page: 12,
        title: "Disk Forging",
        titleHe: "חישול דיסק",
        description: "Scan with straight beams as shown, from at least one flat face, and radially from the circumference whenever practical.",
        recommendedDirections: ["A", "A₁", "C", "C₁"]
      };
      
    case "hexagon":
    case "hex_bar":
      return {
        imagePath: `${basePath}/hex-bar.png`,
        figure: "Figure 7",
        page: 12,
        title: "Hex Bar",
        titleHe: "מוט משושה",
        description: "Scan with a straight beam from three adjacent faces. Also, when T exceeds a value where attenuation reduces the signal to an unacceptable value scan from opposite sides.",
        recommendedDirections: ["A", "B", "C"]
      };

    // Additional shapes - map to closest equivalent
    case "cone":
      return {
        imagePath: `${basePath}/ring-forging.png`,
        figure: "Figure 7",
        page: 12,
        title: "Tapered Tube / Cone",
        titleHe: "צינור מתחדד / חרוט",
        description: "Cone is treated as a tapered tube. Scan with straight beam from OD surface radially, and shear wave scans in both circumferential and axial directions for complete coverage.",
        recommendedDirections: ["C", "C₁", "D", "E", "F", "G", "H"]
      };

    case "l_profile":
    case "t_profile":
    case "i_profile":
    case "u_profile":
    case "z_profile":
    case "z_section":
    case "extrusion_l":
    case "extrusion_t":
    case "extrusion_i":
    case "extrusion_u":
    case "extrusion_channel":
    case "extrusion_angle":
    case "custom_profile":
      return {
        imagePath: `${basePath}/rectangular-bar.png`,
        figure: "Figure 6",
        page: 11,
        title: "Structural Profiles",
        titleHe: "פרופילים מבניים",
        description: "Scan each leg/flange separately following rectangular bar principles. Multiple scan directions required for complete coverage.",
        recommendedDirections: ["A", "A₁", "B", "B₁", "J", "K"]
      };

    default:
      return {
        imagePath: `${basePath}/plate-flat-bar.png`,
        figure: "Figure 6",
        page: 11,
        title: "Standard Shape",
        titleHe: "צורה סטנדרטית",
        description: "Refer to ASTM E2375 for specific scanning requirements for this geometry.",
        recommendedDirections: ["A", "B"]
      };
  }
};

// Legend component showing active scan directions
const ScanDirectionLegend: React.FC<{ 
  scanDetails?: ScanDetail[]; 
  recommendedDirections: string[];
}> = ({ scanDetails, recommendedDirections }) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled) || [];
  
  if (enabledDirections.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No scan directions enabled</p>
        <p className="text-xs mt-1">Enable directions from the table below</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {enabledDirections.map((detail) => {
        const info = DIRECTION_INFO[detail.scanningDirection];
        if (!info) return null;
        
        const isRecommended = recommendedDirections.includes(detail.scanningDirection);
        
        return (
          <div 
            key={detail.scanningDirection}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              isRecommended ? 'bg-green-100 border-green-400' : 'bg-white border-slate-300'
            }`}
          >
            <div 
              className="w-5 h-5 rounded-full flex-shrink-0 shadow-md border-2 border-white"
              style={{ backgroundColor: info.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-slate-900">{detail.scanningDirection}</span>
                <span className="text-sm font-medium text-slate-800">{info.name}</span>
                {isRecommended && (
                  <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded shadow-sm">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-700">{info.wave}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const E2375DiagramImage: React.FC<E2375DiagramImageProps> = ({
  partType,
  scanDetails,
  highlightedDirection,
  className = ""
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);

  const imageInfo = getE2375ImageInfo(partType);

  if (!imageInfo) {
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
                {imageInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ASTM E2375-16 {imageInfo.figure} (Page {imageInfo.page}) • {imageInfo.titleHe}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                disabled={zoom >= 2}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
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
                onClick={() => window.open('/standards/E2375.pdf', '_blank')}
                title="Open Full PDF"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Diagram - Dynamic SVG for tube/cone types, Static image for others */}
            <div
              className="lg:col-span-2 overflow-hidden bg-white rounded-lg border-2 border-gray-200 e2375-diagram-container"
              data-testid="e2375-diagram"
            >
              {isTubeType(partType) ? (
                /* Dynamic interactive SVG diagram for tube/pipe geometries */
                <TubeScanDiagram
                  scanDetails={scanDetails}
                  highlightedDirection={highlightedDirection}
                />
              ) : isConeType(partType) ? (
                /* Dynamic interactive SVG diagram for cone geometries */
                <ConeScanDiagram
                  scanDetails={scanDetails}
                  highlightedDirection={highlightedDirection}
                />
              ) : (
                <div
                  className="flex items-center justify-center p-4 min-h-[400px] overflow-auto e2375-diagram-image"
                  style={{ maxHeight: '550px' }}
                >
                  {imageError ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Info className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h4 className="font-semibold mb-2">Image Not Found</h4>
                      <p className="text-sm mb-4">
                        Please add the cropped diagram image to:
                      </p>
                      <code className="text-xs bg-gray-100 px-3 py-2 rounded block">
                        public{imageInfo.imagePath}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => window.open('/standards/E2375.pdf', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open PDF to Crop
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={imageInfo.imagePath}
                      alt={`ASTM E2375 ${imageInfo.figure} - ${imageInfo.title}`}
                      className="max-w-full h-auto transition-transform duration-200"
                      style={{ transform: `scale(${zoom})` }}
                      onError={() => setImageError(true)}
                      data-testid="e2375-diagram-img"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Legend & Info Panel */}
            <div className="space-y-4">
              {/* Scanning Procedure Description */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Scanning Procedure (per E2375)
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {imageInfo.description}
                </p>
              </div>

              {/* Active Directions Legend */}
              <div className="bg-slate-100 rounded-lg p-4 border border-slate-300">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Scan Directions ({scanDetails?.filter(d => d.enabled).length || 0})
                </h4>
                <ScanDirectionLegend 
                  scanDetails={scanDetails} 
                  recommendedDirections={imageInfo.recommendedDirections}
                />
              </div>

              {/* Standard Reference */}
              <div className="text-xs text-muted-foreground border-t pt-3">
                <p>Standard: ASTM E2375-16</p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => window.open('/standards/E2375.pdf', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Full Standard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{imageInfo.title} - ASTM E2375 {imageInfo.figure}</DialogTitle>
            <DialogDescription>{imageInfo.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-white rounded-lg border overflow-auto flex items-center justify-center p-4">
            {!imageError && (
              <img
                src={imageInfo.imagePath}
                alt={`ASTM E2375 ${imageInfo.figure} - ${imageInfo.title}`}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default E2375DiagramImage;
