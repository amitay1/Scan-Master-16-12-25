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
  // SIDE VIEW (Left part of drawing)
  // ============================================
  const sideViewCenterX = width * 0.30;

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

        {/* Dimension labels */}
        {showDimensions && (
          <>
            {/* A - Left height */}
            <g>
              <line x1={blockLeft - 25} y1={blockTop} x2={blockLeft - 25} y2={blockBottom} stroke="#333" strokeWidth={1} />
              <line x1={blockLeft - 30} y1={blockTop} x2={blockLeft - 20} y2={blockTop} stroke="#333" strokeWidth={1} />
              <line x1={blockLeft - 30} y1={blockBottom} x2={blockLeft - 20} y2={blockBottom} stroke="#333" strokeWidth={1} />
            </g>

            {/* E - Right height */}
            <g>
              <line x1={blockRight + 25} y1={blockTop} x2={blockRight + 25} y2={blockBottom} stroke="#333" strokeWidth={1} />
              <line x1={blockRight + 20} y1={blockTop} x2={blockRight + 30} y2={blockTop} stroke="#333" strokeWidth={1} />
              <line x1={blockRight + 20} y1={blockBottom} x2={blockRight + 30} y2={blockBottom} stroke="#333" strokeWidth={1} />
              <text x={blockRight + 35} y={(blockTop + blockBottom) / 2 + 4} fill="#333" style={{ fontSize: 12 }}>E</text>
            </g>

            {/* F - Bottom width */}
            <g>
              <line x1={blockLeft} y1={blockBottom + 28} x2={blockRight} y2={blockBottom + 28} stroke="#333" strokeWidth={1} />
              <line x1={blockLeft} y1={blockBottom + 22} x2={blockLeft} y2={blockBottom + 34} stroke="#333" strokeWidth={1} />
              <line x1={blockRight} y1={blockBottom + 22} x2={blockRight} y2={blockBottom + 34} stroke="#333" strokeWidth={1} />
              <text x={fbhCenterX} y={blockBottom + 45} textAnchor="middle" fill="#333" style={{ fontSize: 12 }}>F</text>
            </g>

            {/* H - FBH depth */}
            <g>
              <line
                x1={fbhCenterX + fbhHoleWidth/2 + 18}
                y1={fbhTop}
                x2={fbhCenterX + fbhHoleWidth/2 + 18}
                y2={blockBottom}
                stroke="#333"
                strokeWidth={1}
              />
              <line x1={fbhCenterX + fbhHoleWidth/2 + 12} y1={fbhTop} x2={fbhCenterX + fbhHoleWidth/2 + 24} y2={fbhTop} stroke="#333" strokeWidth={1} />
              <line x1={fbhCenterX + fbhHoleWidth/2 + 12} y1={blockBottom} x2={fbhCenterX + fbhHoleWidth/2 + 24} y2={blockBottom} stroke="#333" strokeWidth={1} />
              {/* Arrow to H */}
              <line x1={fbhCenterX + fbhHoleWidth/2 + 24} y1={fbhTop + fbhHoleDepth/2} x2={fbhCenterX + fbhHoleWidth/2 + 45} y2={fbhTop + fbhHoleDepth/2} stroke="#333" strokeWidth={1} />
              <text x={fbhCenterX + fbhHoleWidth/2 + 50} y={fbhTop + fbhHoleDepth/2 + 4} fill="#333" style={{ fontSize: 12 }}>H</text>
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
