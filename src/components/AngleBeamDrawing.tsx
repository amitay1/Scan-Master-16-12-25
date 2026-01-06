/**
 * Angle Beam Drawing Component
 * For ring forgings, tubes, pipes - shows circumferential shear wave inspection
 * Per AMS-STD-2154 Appendix A - Circumferential shear wave required for rings
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AngleBeamDrawingProps {
  // Part dimensions
  outerDiameter?: number;   // OD in mm
  innerDiameter?: number;   // ID in mm (0 for solid)
  wallThickness?: number;   // Wall thickness in mm
  partLength?: number;      // Length/height in mm

  // Inspection parameters
  beamAngle?: number;       // Refracted angle (45°, 60°, 70°)

  // Display options
  width?: number;
  height?: number;
  showDimensions?: boolean;
  title?: string;
}

export function AngleBeamDrawing({
  outerDiameter = 100,
  innerDiameter = 60,
  wallThickness,
  partLength = 50,
  beamAngle = 45,
  width = 550,
  height = 350,
  showDimensions = true,
  title = "Angle Beam - Circumferential Shear Wave",
}: AngleBeamDrawingProps) {
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate wall thickness if not provided
  const wall = wallThickness || (outerDiameter - innerDiameter) / 2;
  const isHollow = innerDiameter > 0;

  // SVG layout constants
  const padding = 60;
  const drawingWidth = width - padding * 2;
  const drawingHeight = height - padding * 2 - 40;

  // Scale to fit
  const maxDim = Math.max(outerDiameter, partLength);
  const scale = Math.min(drawingWidth, drawingHeight) / (maxDim * 1.4);

  // Scaled dimensions
  const scaledOD = outerDiameter * scale;
  const scaledID = innerDiameter * scale;
  const scaledLength = partLength * scale;
  const scaledWall = wall * scale;

  // Center position for cross-section view
  const centerX = width / 2 - scaledLength / 2 - 20;
  const centerY = height / 2;

  // Side view position
  const sideViewX = width / 2 + 40;
  const sideViewY = height / 2;

  const handleLoadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLoadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setLoadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download SVG as PNG
  const handleDownload = useCallback(() => {
    const svgElement = document.querySelector('.angle-beam-drawing') as SVGSVGElement;
    if (!svgElement) {
      toast.error("Drawing not found");
      return;
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Ensure xmlns is set for proper rendering
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Get the SVG dimensions
    const svgWidth = width;
    const svgHeight = height;

    // Create a canvas
    const canvas = document.createElement('canvas');
    const scale = 2; // Higher resolution
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error("Failed to create canvas context");
      return;
    }

    // Scale the context for higher resolution
    ctx.scale(scale, scale);

    // Convert SVG to data URL using base64 encoding
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const base64Data = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${base64Data}`;

    // Create image and draw to canvas
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, svgWidth, svgHeight);
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

      // Download the canvas as PNG
      const link = document.createElement('a');
      link.download = `angle-beam-circumferential-shear-wave-OD${outerDiameter}mm.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Drawing downloaded successfully");
    };

    img.onerror = (e) => {
      console.error("Image load error:", e);
      toast.error("Failed to generate image");
    };

    img.src = dataUrl;
  }, [width, height, outerDiameter]);

  // Calculate beam path for angle beam
  const beamAngleRad = (beamAngle * Math.PI) / 180;
  const beamLength = scaledWall * 1.5;

  if (loadedImage) {
    return (
      <div className="relative border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <Button variant="outline" size="sm" onClick={handleClearImage}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Back to Drawing
          </Button>
        </div>
        <div className="flex items-center justify-center" style={{ height: height - 60 }}>
          <img
            src={loadedImage}
            alt="Reference standard"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg bg-white flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <svg
        width={width}
        height={height}
        className="block mx-auto angle-beam-drawing"
        data-testid="calibration-block-diagram"
        id="calibration-block-svg"
      >
        {/* Background */}
        <rect x="0" y="0" width={width} height={height} fill="#fafafa" />

        {/* Title */}
        <text
          x={width / 2}
          y={25}
          textAnchor="middle"
          fill="#333"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          {title}
        </text>

        {/* Cross-Section View (Ring/Tube end view) */}
        <g>
          <text
            x={centerX}
            y={centerY - scaledOD / 2 - 15}
            textAnchor="middle"
            fill="#666"
            style={{ fontSize: 11 }}
          >
            Cross Section
          </text>

          {/* Center lines (dash-dot pattern) */}
          <line
            x1={centerX - scaledOD / 2 - 15}
            y1={centerY}
            x2={centerX + scaledOD / 2 + 15}
            y2={centerY}
            stroke="#dc2626"
            strokeWidth={0.5}
            strokeDasharray="10,3,2,3"
          />
          <line
            x1={centerX}
            y1={centerY - scaledOD / 2 - 15}
            x2={centerX}
            y2={centerY + scaledOD / 2 + 15}
            stroke="#dc2626"
            strokeWidth={0.5}
            strokeDasharray="10,3,2,3"
          />


          {/* Angle beam probe position and beam path */}
          <g>
            {/* Probe on outer surface */}
            <rect
              x={centerX + scaledOD / 2 - 5}
              y={centerY - 8}
              width={15}
              height={16}
              fill="#4a90d9"
              stroke="#2563eb"
              strokeWidth={1}
              rx={2}
            />
            {/* Probe numbering */}
            <text
              x={centerX + scaledOD / 2 + 20}
              y={centerY - 12}
              fill="#333"
              style={{ fontSize: 10 }}
            >
              (1)
            </text>

            {/* Beam path - entering at angle */}
            <line
              x1={centerX + scaledOD / 2}
              y1={centerY}
              x2={centerX + scaledOD / 2 - beamLength * Math.cos(beamAngleRad)}
              y2={centerY + beamLength * Math.sin(beamAngleRad)}
              stroke="#e53e3e"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />

            {/* Reflected beam (circumferential) */}
            <path
              d={`M ${centerX + scaledOD / 2 - beamLength * Math.cos(beamAngleRad)} ${centerY + beamLength * Math.sin(beamAngleRad)}
                  Q ${centerX + scaledOD / 4} ${centerY + scaledOD / 3} ${centerX} ${centerY + scaledOD / 2 - scaledWall / 2}`}
              fill="none"
              stroke="#e53e3e"
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />

            {/* Angle annotation */}
            <text
              x={centerX + scaledOD / 2 + 18}
              y={centerY + 5}
              fill="#e53e3e"
              style={{ fontSize: 10, fontWeight: 'bold' }}
            >
              {beamAngle}°
            </text>
          </g>

          {/* Circumferential scan direction arrows - CW and CCW for bi-directional coverage */}
          <g>
            {/* CW (clockwise) arrow */}
            <path
              d={`M ${centerX} ${centerY - scaledOD / 2 - 8}
                  A ${scaledOD / 2 + 8} ${scaledOD / 2 + 8} 0 0 1 ${centerX + scaledOD / 2 + 8} ${centerY}`}
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              markerEnd="url(#greenArrow)"
            />
            <text
              x={centerX + scaledOD / 2 + 20}
              y={centerY - scaledOD / 4}
              fill="#22c55e"
              style={{ fontSize: 9 }}
            >
              CW
            </text>

            {/* CCW (counter-clockwise) arrow for bi-directional coverage */}
            <path
              d={`M ${centerX} ${centerY + scaledOD / 2 + 8}
                  A ${scaledOD / 2 + 8} ${scaledOD / 2 + 8} 0 0 1 ${centerX - scaledOD / 2 - 8} ${centerY}`}
              fill="none"
              stroke="#f97316"
              strokeWidth={1.5}
              markerEnd="url(#orangeArrow)"
            />
            <text
              x={centerX - scaledOD / 2 - 28}
              y={centerY + scaledOD / 4}
              fill="#f97316"
              style={{ fontSize: 9 }}
            >
              CCW
            </text>
          </g>
        </g>

        {/* Side View (Longitudinal section) */}
        <g>
          <text
            x={sideViewX + scaledLength / 2}
            y={sideViewY - scaledOD / 2 - 15}
            textAnchor="middle"
            fill="#666"
            style={{ fontSize: 11 }}
          >
            Side View
          </text>

          {/* Center line (dash-dot pattern) */}
          <line
            x1={sideViewX - 10}
            y1={sideViewY}
            x2={sideViewX + scaledLength + 10}
            y2={sideViewY}
            stroke="#dc2626"
            strokeWidth={0.5}
            strokeDasharray="10,3,2,3"
          />

          {/* Outer rectangle */}
          <rect
            x={sideViewX}
            y={sideViewY - scaledOD / 2}
            width={scaledLength}
            height={scaledOD}
            fill="none"
            stroke="#333"
            strokeWidth={2}
          />

          {/* Inner cavity (if hollow) */}
          {isHollow && (
            <rect
              x={sideViewX}
              y={sideViewY - scaledID / 2}
              width={scaledLength}
              height={scaledID}
              fill="#e5e5e5"
              stroke="#333"
              strokeWidth={1}
              strokeDasharray="4,2"
            />
          )}

          {/* Radial scan arrows */}
          <line
            x1={sideViewX + scaledLength / 2}
            y1={sideViewY - scaledOD / 2 - 20}
            x2={sideViewX + scaledLength / 2}
            y2={sideViewY - scaledOD / 2 + 5}
            stroke="#0066cc"
            strokeWidth={1.5}
            markerEnd="url(#blueArrow)"
          />
          <text
            x={sideViewX + scaledLength / 2 + 5}
            y={sideViewY - scaledOD / 2 - 10}
            fill="#0066cc"
            style={{ fontSize: 9 }}
          >
            Radial
          </text>
        </g>

        {/* Arrow marker definitions and patterns */}
        <defs>
          {/* Material hatching pattern for sections */}
          <pattern id="sectionHatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#e53e3e" />
          </marker>
          <marker
            id="greenArrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
          </marker>
          <marker
            id="orangeArrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
          </marker>
          <marker
            id="blueArrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#0066cc" />
          </marker>
        </defs>

        {/* Dimension Labels */}
        {showDimensions && (
          <>
            {/* OD dimension */}
            <g>
              <line
                x1={centerX - scaledOD / 2}
                y1={centerY + scaledOD / 2 + 25}
                x2={centerX + scaledOD / 2}
                y2={centerY + scaledOD / 2 + 25}
                stroke="#0066cc"
                strokeWidth={1}
              />
              <line x1={centerX - scaledOD / 2} y1={centerY + scaledOD / 2 + 20} x2={centerX - scaledOD / 2} y2={centerY + scaledOD / 2 + 30} stroke="#0066cc" strokeWidth={1} />
              <line x1={centerX + scaledOD / 2} y1={centerY + scaledOD / 2 + 20} x2={centerX + scaledOD / 2} y2={centerY + scaledOD / 2 + 30} stroke="#0066cc" strokeWidth={1} />
              <text
                x={centerX}
                y={centerY + scaledOD / 2 + 40}
                textAnchor="middle"
                fill="#0066cc"
                style={{ fontSize: 11, fontWeight: 'bold' }}
              >
                OD = {outerDiameter} mm
              </text>
            </g>

            {/* Wall thickness */}
            <g>
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                fill="#333"
                style={{ fontSize: 10 }}
              >
                t = {wall.toFixed(1)} mm
              </text>
            </g>

            {/* Length dimension */}
            <g>
              <line
                x1={sideViewX}
                y1={sideViewY + scaledOD / 2 + 25}
                x2={sideViewX + scaledLength}
                y2={sideViewY + scaledOD / 2 + 25}
                stroke="#0066cc"
                strokeWidth={1}
              />
              <line x1={sideViewX} y1={sideViewY + scaledOD / 2 + 20} x2={sideViewX} y2={sideViewY + scaledOD / 2 + 30} stroke="#0066cc" strokeWidth={1} />
              <line x1={sideViewX + scaledLength} y1={sideViewY + scaledOD / 2 + 20} x2={sideViewX + scaledLength} y2={sideViewY + scaledOD / 2 + 30} stroke="#0066cc" strokeWidth={1} />
              <text
                x={sideViewX + scaledLength / 2}
                y={sideViewY + scaledOD / 2 + 40}
                textAnchor="middle"
                fill="#0066cc"
                style={{ fontSize: 11, fontWeight: 'bold' }}
              >
                L = {partLength} mm
              </text>
            </g>
          </>
        )}

        {/* Reference note */}
        <text
          x={width / 2}
          y={height - 15}
          textAnchor="middle"
          fill="#666"
          style={{ fontSize: 10, fontStyle: 'italic' }}
        >
          Reference: AMS-STD-2154 Appendix A - Circumferential Shear Wave for Ring Forgings
        </text>
      </svg>

      {/* Action Buttons */}
      <div className="absolute top-12 left-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadImage}
          className="bg-white/90 hover:bg-white"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Load Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
