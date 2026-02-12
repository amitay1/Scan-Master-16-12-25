import React from "react";
import { Card } from "@/components/ui/card";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";

interface E2375DiagramViewerProps {
  partType: PartGeometry;
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  className?: string;
}

/**
 * Maps part geometry types to their corresponding ASTM E2375 Figure 6 & 7 diagrams
 * These diagrams show the sound beam directions for various wrought product shapes
 */
const getE2375DiagramInfo = (partType: PartGeometry): {
  figure: string;
  page: number;
  title: string;
  description: string;
} | null => {
  // Normalize legacy/variant types to base shapes
  const normalizedType = normalizePartType(partType);

  switch (normalizedType) {
    // Figure 6 - Plate and Flat Bar
    case "box":
    case "plate":
    case "sheet":
    case "slab":
    case "flat_bar":
      return {
        figure: "Figure 6 - Plate and Flat Bar",
        page: 11,
        title: "Plate and Flat Bar",
        description: "Scan with a straight beam with the beam directed as shown. If W/T > 5, scan with straight beam. If W or T > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite side."
      };

    // Figure 6 - Rectangular Bar, Bloom, and Billets
    case "rectangular_bar":
    case "square_bar":
    case "billet":
    case "block":
      return {
        figure: "Figure 6 - Rectangular Bar, Bloom, and Billets",
        page: 11,
        title: "Rectangular Bar, Bloom, and Billets",
        description: "If W/T < 5, scan with a straight beam from two adjacent sides with the sound beam directed as shown. If T or W > 9 inches (228.6 mm), surface resolution requirements may require scanning from opposite sides."
      };

    // Figure 6 - Round Bars and Round Forging Stock
    case "cylinder":
    case "round_bar":
    case "shaft":
    case "disk":
    case "round_forging_stock":
      return {
        figure: "Figure 6 - Round Bars and Round Forging Stock",
        page: 11,
        title: "Round Bars and Round Forging Stock",
        description: "Examine by straight beam with sound beam directed towards the center of the bar as shown while bar is rotating to locate discontinuities at or near the center of the bar. When specified in the contract documents purchase order, or engineering drawing use a circumferential angle beam technique per appendix A."
      };

    // Figure 7 - Ring Forgings
    case "tube":
    case "pipe":
    case "ring":
    case "ring_forging":
    case "sleeve":
    case "bushing":
      return {
        figure: "Figure 7 - Ring Forgings",
        page: 12,
        title: "Ring Forgings",
        description: "Scan with a straight beam from the circumference with the sound beam directed radially as shown if ring forging thickness is not > 20% of OD. Scanning with a straight beam in the axial direction is required only if L/T < 5. Scan with a circumferential shear wave technique in accordance with Appendix A in addition to the straight beam examinations mentioned."
      };

    // Figure 7 - Disk Forging
    case "disk_forging":
    case "hub":
      return {
        figure: "Figure 7 - Disk Forging",
        page: 12,
        title: "Disk Forging",
        description: "Scan with straight beams as shown, from at least one flat face, and radially from the circumference whenever practical."
      };

    // Figure 7 - Hex Bar
    case "hexagon":
    case "hex_bar":
      return {
        figure: "Figure 7 - Hex Bar",
        page: 12,
        title: "Hex Bar",
        description: "Scan with a straight beam from three adjacent faces. Also, when T exceeds a value where attenuation reduces the signal to an unacceptable value scan from opposite sides."
      };

    // Additional geometries
    case "rectangular_tube":
    case "square_tube":
      return {
        figure: "Figure 7 - Ring Forgings (adapted for rectangular tubes)",
        page: 12,
        title: "Rectangular/Square Tubes",
        description: "Scan similar to ring forgings: straight beam from walls, with angle beam if wall thickness is significant."
      };

    case "cone":
      return {
        figure: "Figure 7 - Disk Forging (adapted for cones)",
        page: 12,
        title: "Cone",
        description: "Scan with straight beams from flat faces and from conical surface where practical."
      };

    default:
      return null;
  }
};

/**
 * Normalizes legacy/variant part types to their base geometry
 */
const normalizePartType = (partType: PartGeometry): string => {
  const mapping: Record<string, string> = {
    // Flat geometries
    "plate": "plate",
    "sheet": "plate",
    "slab": "plate",
    "flat_bar": "flat_bar",

    // Box/block geometries
    "box": "box",
    "rectangular_bar": "rectangular_bar",
    "square_bar": "rectangular_bar",
    "billet": "billet",
    "block": "block",

    // Cylindrical geometries
    "cylinder": "cylinder",
    "round_bar": "round_bar",
    "shaft": "round_bar",
    "disk": "disk",
    "disk_forging": "disk_forging",
    "hub": "hub",
    "hpt_disk": "disk_forging",
    "round_forging_stock": "round_forging_stock",

    // Hollow cylindrical
    "tube": "tube",
    "pipe": "tube",
    "ring": "ring",
    "ring_forging": "ring_forging",
    "sleeve": "tube",
    "bushing": "tube",

    // Rectangular tubes
    "rectangular_tube": "rectangular_tube",
    "square_tube": "square_tube",

    // Hex
    "hexagon": "hexagon",
    "hex_bar": "hex_bar",

    // Special
    "cone": "cone",
    "forging": "round_forging_stock",
  };

  return mapping[partType] || partType;
};

export const E2375DiagramViewer: React.FC<E2375DiagramViewerProps> = ({
  partType,
  scanDetails,
  highlightedDirection,
  className = ""
}) => {
  const diagramInfo = getE2375DiagramInfo(partType);

  if (!diagramInfo) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            No E2375 diagram available for part type: <span className="font-mono">{partType}</span>
          </p>
          <p className="text-xs mt-2">
            Please refer to ASTM E2375 standard for guidance on this geometry.
          </p>
        </div>
      </Card>
    );
  }

  // Construct PDF URL with page parameter
  const pdfUrl = `/standards/E2375.pdf#page=${diagramInfo.page}`;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b pb-3">
          <h3 className="text-lg font-semibold text-primary">
            {diagramInfo.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            ASTM E2375-16 {diagramInfo.figure} (Page {diagramInfo.page})
          </p>
        </div>

        {/* PDF Diagram Display - Shows actual page from the standard */}
        <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px]"
            title={`${diagramInfo.title} - ASTM E2375 Page ${diagramInfo.page}`}
            style={{ border: 'none' }}
          />
        </div>

        {/* Description */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Scanning Procedure (per E2375)
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {diagramInfo.description}
          </p>
        </div>

        {/* Enabled Scan Directions */}
        {scanDetails && scanDetails.some(d => d.enabled) && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <h4 className="text-sm font-semibold text-green-900 mb-2">
              Enabled Scan Directions for this Part
            </h4>
            <div className="flex flex-wrap gap-2">
              {scanDetails
                .filter(d => d.enabled)
                .map(detail => (
                  <span
                    key={detail.scanningDirection}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      highlightedDirection === detail.scanningDirection
                        ? 'bg-green-600 text-white scale-110 shadow-md'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {detail.scanningDirection}: {detail.waveMode}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Reference Link */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Standard: ASTM E2375-16
          </span>
          <a
            href="/standards/E2375.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Full Standard
          </a>
        </div>
      </div>
    </Card>
  );
};
