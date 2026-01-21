/**
 * FBH Straight Beam Drawing Component
 * ASTM E127 Standard Set Block - FIG. 1 Standard Set Block Dimensions
 * Side view + Top view of scanning surface
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, RefreshCw } from "lucide-react";

interface FBHStraightBeamDrawingProps {
  partNumber?: string;
  serialNumber?: string;
  width?: number;
  height?: number;
  showDimensions?: boolean;
  title?: string;
}

export function FBHStraightBeamDrawing({
  partNumber = "7075 5-0150",
  serialNumber = "000",
  width = 600,
  height = 450,
  showDimensions = true,
  title = "FIG. 1 Standard Set Block Dimensions",
}: FBHStraightBeamDrawingProps) {
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // COMMON VERTICAL ALIGNMENT - both views share same centerY
  // ============================================
  const commonCenterY = height * 0.45; // shared vertical center for both views

  // ============================================
  // SIDE VIEW (Centered in drawing)
  // ============================================
  const sideViewCenterX = width * 0.50;

  // Block dimensions - STRAIGHT RECTANGLE (no taper!)
  const blockWidth = 100;
  const blockHeight = 160;
  const blockTop = commonCenterY - blockHeight / 2;
  const blockLeft = sideViewCenterX - blockWidth / 2;
  const blockRight = sideViewCenterX + blockWidth / 2;
  const blockBottom = commonCenterY + blockHeight / 2;

  // FBH hole INSIDE the block (drilled from bottom going UP)
  const fbhHoleWidth = 18;
  const fbhHoleDepth = 45; // H dimension - depth into block from bottom
  const fbhCenterX = sideViewCenterX;
  const fbhTop = blockBottom - fbhHoleDepth; // top of hole (flat bottom)

  // G marker position (middle of block)
  const gMarkerY = blockTop + blockHeight * 0.35;

  // ============================================
  // TOP VIEW (Right part - circle) - aligned with side view
  // ============================================
  const topViewCenterX = width * 0.70;
  const topViewCenterY = commonCenterY; // aligned with side view center
  const circleRadius = 55;

  const handleLoadImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLoadedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setLoadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
          <img src={loadedImage} alt="Reference standard" className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg bg-white flex flex-col items-center">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <svg
        width={width}
        height={height}
        className="block mx-auto fbh-straight-beam-drawing"
        data-testid="calibration-block-diagram"
        id="calibration-block-svg"
      >
        <rect x="0" y="0" width={width} height={height} fill="#fafafa" />

        {/* ==================== SIDE VIEW ==================== */}

        {/* Main block outline - STRAIGHT RECTANGLE */}
        <rect
          x={blockLeft}
          y={blockTop}
          width={blockWidth}
          height={blockHeight}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />

        {/* FBH Hole INSIDE the block */}
        <g>
          {/* Hole outline */}
          <rect
            x={fbhCenterX - fbhHoleWidth/2}
            y={fbhTop}
            width={fbhHoleWidth}
            height={fbhHoleDepth}
            fill="#e5e5e5"
            stroke="#333"
            strokeWidth={1.5}
          />
          {/* Flat bottom of hole (the reflector) - thicker line */}
          <line
            x1={fbhCenterX - fbhHoleWidth/2}
            y1={fbhTop}
            x2={fbhCenterX + fbhHoleWidth/2}
            y2={fbhTop}
            stroke="#333"
            strokeWidth={2.5}
          />
          {/* Hatching inside hole */}
          {[...Array(4)].map((_, i) => (
            <line
              key={i}
              x1={fbhCenterX - fbhHoleWidth/2 + 4 + i * 4}
              y1={fbhTop + 4}
              x2={fbhCenterX - fbhHoleWidth/2 + 4 + i * 4}
              y2={blockBottom - 4}
              stroke="#aaa"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* Center line (dashed) through block */}
        <line
          x1={fbhCenterX}
          y1={blockTop - 15}
          x2={fbhCenterX}
          y2={blockBottom + 15}
          stroke="#333"
          strokeWidth={0.5}
          strokeDasharray="10,5"
        />

        {/* G marker - horizontal dashed line */}
        <line
          x1={blockLeft + 10}
          y1={gMarkerY}
          x2={blockRight - 10}
          y2={gMarkerY}
          stroke="#333"
          strokeWidth={0.5}
          strokeDasharray="6,3"
        />

        {/* Dimension labels - Matching FBH Table columns (ØFBH, B, H) */}
        {showDimensions && (
          <>
            {/* ØFBH - FBH Diameter (left side of hole) - BLUE */}
            <g>
              {/* Horizontal line showing hole width */}
              <line
                x1={fbhCenterX - fbhHoleWidth/2}
                y1={fbhTop + 20}
                x2={fbhCenterX + fbhHoleWidth/2}
                y2={fbhTop + 20}
                stroke="#2563eb"
                strokeWidth={1.5}
              />
              {/* End ticks */}
              <line x1={fbhCenterX - fbhHoleWidth/2} y1={fbhTop + 15} x2={fbhCenterX - fbhHoleWidth/2} y2={fbhTop + 25} stroke="#2563eb" strokeWidth={1.5} />
              <line x1={fbhCenterX + fbhHoleWidth/2} y1={fbhTop + 15} x2={fbhCenterX + fbhHoleWidth/2} y2={fbhTop + 25} stroke="#2563eb" strokeWidth={1.5} />
              {/* Label with arrow */}
              <line x1={fbhCenterX - fbhHoleWidth/2 - 5} y1={fbhTop + 20} x2={fbhCenterX - fbhHoleWidth/2 - 25} y2={fbhTop + 5} stroke="#2563eb" strokeWidth={1} />
              <text x={fbhCenterX - fbhHoleWidth/2 - 28} y={fbhTop} textAnchor="end" fill="#2563eb" style={{ fontSize: 11, fontWeight: 600 }}>ØFBH</text>
            </g>

            {/* H - Metal Travel Distance (right side) - GREEN */}
            <g>
              <line
                x1={fbhCenterX + fbhHoleWidth/2 + 18}
                y1={fbhTop}
                x2={fbhCenterX + fbhHoleWidth/2 + 18}
                y2={blockBottom}
                stroke="#16a34a"
                strokeWidth={1.5}
              />
              <line x1={fbhCenterX + fbhHoleWidth/2 + 12} y1={fbhTop} x2={fbhCenterX + fbhHoleWidth/2 + 24} y2={fbhTop} stroke="#16a34a" strokeWidth={1.5} />
              <line x1={fbhCenterX + fbhHoleWidth/2 + 12} y1={blockBottom} x2={fbhCenterX + fbhHoleWidth/2 + 24} y2={blockBottom} stroke="#16a34a" strokeWidth={1.5} />
              {/* Arrow and label */}
              <line x1={fbhCenterX + fbhHoleWidth/2 + 24} y1={fbhTop + fbhHoleDepth/2} x2={fbhCenterX + fbhHoleWidth/2 + 40} y2={fbhTop + fbhHoleDepth/2} stroke="#16a34a" strokeWidth={1} />
              <text x={fbhCenterX + fbhHoleWidth/2 + 45} y={fbhTop + fbhHoleDepth/2 + 4} fill="#16a34a" style={{ fontSize: 12, fontWeight: 600 }}>H</text>
            </g>

            {/* B - Distance from bottom (B=0 for standard FBH) - RED */}
            <g>
              {/* B indicator at bottom of block - shows B=0 */}
              <line x1={blockLeft - 20} y1={blockBottom} x2={blockLeft - 10} y2={blockBottom} stroke="#dc2626" strokeWidth={1.5} />
              <text x={blockLeft - 25} y={blockBottom + 4} textAnchor="end" fill="#dc2626" style={{ fontSize: 11, fontWeight: 600 }}>B=0</text>
            </g>

            {/* Block dimensions (secondary - lighter gray) */}
            {/* E - Block height */}
            <g opacity={0.4}>
              <line x1={blockRight + 35} y1={blockTop} x2={blockRight + 35} y2={blockBottom} stroke="#666" strokeWidth={0.5} />
              <line x1={blockRight + 31} y1={blockTop} x2={blockRight + 39} y2={blockTop} stroke="#666" strokeWidth={0.5} />
              <line x1={blockRight + 31} y1={blockBottom} x2={blockRight + 39} y2={blockBottom} stroke="#666" strokeWidth={0.5} />
              <text x={blockRight + 45} y={(blockTop + blockBottom) / 2 + 4} fill="#888" style={{ fontSize: 10 }}>E</text>
            </g>

            {/* F - Block width */}
            <g opacity={0.4}>
              <line x1={blockLeft} y1={blockBottom + 28} x2={blockRight} y2={blockBottom + 28} stroke="#666" strokeWidth={0.5} />
              <line x1={blockLeft} y1={blockBottom + 24} x2={blockLeft} y2={blockBottom + 32} stroke="#666" strokeWidth={0.5} />
              <line x1={blockRight} y1={blockBottom + 24} x2={blockRight} y2={blockBottom + 32} stroke="#666" strokeWidth={0.5} />
              <text x={fbhCenterX} y={blockBottom + 42} textAnchor="middle" fill="#888" style={{ fontSize: 10 }}>F</text>
            </g>
          </>
        )}


        {/* Title at bottom */}
        <text x={width / 2} y={height - 12} textAnchor="middle" fill="#333" style={{ fontSize: 12, fontWeight: 600 }}>
          {title}
        </text>
      </svg>

      {/* Load Image Button */}
      <div className="absolute top-4 left-4">
        <Button variant="outline" size="sm" onClick={handleLoadImage} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
          <ImageIcon className="h-4 w-4 mr-2" />
          Load Image
        </Button>
      </div>
    </div>
  );
}
