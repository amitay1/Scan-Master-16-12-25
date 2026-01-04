/**
 * Angle Beam Calibration Block Drawing Component
 *
 * SVG technical drawing of the arc-shaped (C-ring) calibration block
 * for shear wave inspection with hatched cross-sections and reference notches.
 * Per AMS-STD-2154 / ASTM E2375 for circumferential shear wave inspection.
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, RefreshCw } from "lucide-react";

interface AngleBeamCalibrationBlockDrawingProps {
  width?: number;
  height?: number;
  showDimensions?: boolean;
  title?: string;
}

export function AngleBeamCalibrationBlockDrawing({
  width = 700,
  height = 550,
  showDimensions = true,
  title = "Angle Beam Calibration Block - Shear Wave Reference Standard",
}: AngleBeamCalibrationBlockDrawingProps) {
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      fileInputRef.current.value = "";
    }
  };

  // If user loaded a custom image, show it
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
        <div
          className="flex items-center justify-center"
          style={{ height: height - 60 }}
        >
          <img
            src={loadedImage}
            alt="Angle beam calibration block"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Center of the isometric view
  const cx = width * 0.5;
  const cy = height * 0.48;

  // Block dimensions (scaled for display)
  const outerR = 130;
  const innerR = 85;
  const blockHeight = 85;
  const wallThickness = outerR - innerR;

  // Arc spans about 270 degrees - open C shape with opening at FRONT
  // Opening faces the viewer (bottom-front)
  const arcStart = -45;   // right side of opening
  const arcEnd = 225;     // left side of opening (270 degree arc)

  // Step configuration - 6 steps at the right end (like Bytest design)
  const stepCount = 6;
  const stepHeight = blockHeight / stepCount;
  const stepAngleSpan = 35; // angle span where steps are located
  const stepStartAngle = arcStart + stepAngleSpan; // steps are near the right opening

  // Convert angle to isometric coordinates - view from top-front-left
  const arcPoint = (angle: number, radius: number, zOffset: number = 0) => {
    const rad = (angle * Math.PI) / 180;
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);
    // Isometric projection - tilted view
    return {
      x: cx + x * 0.9 - y * 0.4,
      y: cy - zOffset * 0.65 + y * 0.55 + x * 0.25,
    };
  };

  // Create arc path for isometric view
  const createIsoArc = (radius: number, startAngle: number, endAngle: number, zOffset: number) => {
    const points: string[] = [];
    const segments = 72;
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const p = arcPoint(angle, radius, zOffset);
      points.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    return points.join(' ');
  };

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
        className="block mx-auto"
        style={{ background: "#f8f6f0" }}
      >
        {/* Hatching pattern definition */}
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#555" strokeWidth="0.8"/>
          </pattern>
          <pattern id="hatch2" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#555" strokeWidth="0.8"/>
          </pattern>
        </defs>

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

        {/* Main isometric view of the C-ring block with stepped end */}
        <g>
          {/* Top surface of the arc - main portion (before steps) */}
          <path
            d={`
              ${createIsoArc(outerR, arcStart, stepStartAngle, blockHeight)}
              ${createIsoArc(innerR, stepStartAngle, arcStart, blockHeight).replace(/M/g, 'L')}
              Z
            `}
            fill="#c8c8c8"
            stroke="#333"
            strokeWidth={1.5}
          />

          {/* Outer curved surface (front/visible part - before steps) */}
          <path
            d={`
              ${createIsoArc(outerR, arcStart, stepStartAngle, blockHeight)}
              ${createIsoArc(outerR, stepStartAngle, arcStart, 0).replace(/M/g, 'L')}
              Z
            `}
            fill="#6a6a6a"
            stroke="#333"
            strokeWidth={1.5}
          />

          {/* Inner curved surface */}
          <path
            d={`
              ${createIsoArc(innerR, arcStart, arcEnd, blockHeight)}
              ${createIsoArc(innerR, arcEnd, arcStart, 0).replace(/M/g, 'L')}
              Z
            `}
            fill="#888"
            stroke="#333"
            strokeWidth={1}
          />

          {/* Left end face (flat cut at arcStart) - with hatching */}
          {(() => {
            const topOuter = arcPoint(arcStart, outerR, blockHeight);
            const topInner = arcPoint(arcStart, innerR, blockHeight);
            const botOuter = arcPoint(arcStart, outerR, 0);
            const botInner = arcPoint(arcStart, innerR, 0);
            return (
              <g>
                {/* Face fill */}
                <path
                  d={`M ${topOuter.x} ${topOuter.y} L ${topInner.x} ${topInner.y} L ${botInner.x} ${botInner.y} L ${botOuter.x} ${botOuter.y} Z`}
                  fill="url(#hatch)"
                  stroke="#333"
                  strokeWidth={1.5}
                />
                {/* Hatching lines on left face */}
                {Array.from({ length: 10 }).map((_, i) => {
                  const t = (i + 1) / 11;
                  const x1 = topOuter.x + (topInner.x - topOuter.x) * t;
                  const y1 = topOuter.y + (topInner.y - topOuter.y) * t;
                  const x2 = botOuter.x + (botInner.x - botOuter.x) * t;
                  const y2 = botOuter.y + (botInner.y - botOuter.y) * t;
                  return (
                    <line
                      key={`hatch-left-${i}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#555"
                      strokeWidth={0.7}
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Stepped section at the end (arcEnd side) - 6 horizontal steps */}
          {Array.from({ length: stepCount }).map((_, i) => {
            const stepZ = blockHeight - stepHeight * i;
            const nextStepZ = blockHeight - stepHeight * (i + 1);

            // Top surface of this step
            const topOuter1 = arcPoint(stepStartAngle, outerR, stepZ);
            const topOuter2 = arcPoint(arcEnd, outerR, stepZ);
            const topInner2 = arcPoint(arcEnd, innerR, stepZ);
            const topInner1 = arcPoint(stepStartAngle, innerR, stepZ);

            // Outer curved face of step
            const outerTop1 = arcPoint(stepStartAngle, outerR, stepZ);
            const outerTop2 = arcPoint(arcEnd, outerR, stepZ);
            const outerBot1 = arcPoint(stepStartAngle, outerR, nextStepZ);
            const outerBot2 = arcPoint(arcEnd, outerR, nextStepZ);

            const topColor = i % 2 === 0 ? "#b8b8b8" : "#a8a8a8";
            const sideColor = i % 2 === 0 ? "#707070" : "#606060";

            return (
              <g key={`step-${i}`}>
                {/* Step tread (top surface) */}
                <path
                  d={`M ${topOuter1.x} ${topOuter1.y} L ${topOuter2.x} ${topOuter2.y} L ${topInner2.x} ${topInner2.y} L ${topInner1.x} ${topInner1.y} Z`}
                  fill={topColor}
                  stroke="#333"
                  strokeWidth={1}
                />
                {/* Step outer curved face */}
                <path
                  d={`
                    ${createIsoArc(outerR, stepStartAngle, arcEnd, stepZ)}
                    ${createIsoArc(outerR, arcEnd, stepStartAngle, nextStepZ).replace(/M/g, 'L')}
                    Z
                  `}
                  fill={sideColor}
                  stroke="#333"
                  strokeWidth={0.8}
                />
                {/* Reference hole on each step (FBH) */}
                {(() => {
                  const holeR = (outerR + innerR) / 2;
                  const holeZ = stepZ - stepHeight * 0.5;
                  const hole = arcPoint(arcEnd - 5, holeR, holeZ);
                  return <circle cx={hole.x} cy={hole.y} r={3} fill="#2a2a2a" stroke="#000" strokeWidth={0.5} />;
                })()}
              </g>
            );
          })}

          {/* Right end face (stepped end) - with hatching */}
          {(() => {
            const topOuter = arcPoint(arcEnd, outerR, blockHeight - stepHeight * (stepCount - 1));
            const topInner = arcPoint(arcEnd, innerR, blockHeight);
            const botOuter = arcPoint(arcEnd, outerR, 0);
            const botInner = arcPoint(arcEnd, innerR, 0);
            return (
              <g>
                {/* Face fill with hatching */}
                <path
                  d={`M ${topOuter.x} ${topOuter.y} L ${topInner.x} ${topInner.y} L ${botInner.x} ${botInner.y} L ${botOuter.x} ${botOuter.y} Z`}
                  fill="url(#hatch)"
                  stroke="#333"
                  strokeWidth={1.5}
                />
                {/* Diagonal hatching lines */}
                {Array.from({ length: 10 }).map((_, i) => {
                  const t = (i + 1) / 11;
                  const x1 = topOuter.x + (topInner.x - topOuter.x) * t;
                  const y1 = topOuter.y + (topInner.y - topOuter.y) * t;
                  const x2 = botOuter.x + (botInner.x - botOuter.x) * t;
                  const y2 = botOuter.y + (botInner.y - botOuter.y) * t;
                  return (
                    <line
                      key={`hatch-right-${i}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#555"
                      strokeWidth={0.7}
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Reference notch on outer curved surface (small rectangle) */}
          {(() => {
            const angle = arcStart + 100;
            const notchSize = 12;
            const p1 = arcPoint(angle - 4, outerR + 1, blockHeight - 25);
            const p2 = arcPoint(angle + 4, outerR + 1, blockHeight - 25);
            const p3 = arcPoint(angle + 4, outerR + 1, blockHeight - 25 - notchSize);
            const p4 = arcPoint(angle - 4, outerR + 1, blockHeight - 25 - notchSize);
            return (
              <path
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
                fill="none"
                stroke="#333"
                strokeWidth={1.2}
              />
            );
          })()}

          {/* Reference notch on left end face (small rectangle) */}
          {(() => {
            const midR = (outerR + innerR) / 2;
            const notchSize = 12;
            const p1 = arcPoint(arcStart, midR - 6, blockHeight - 40);
            const p2 = arcPoint(arcStart, midR + 6, blockHeight - 40);
            const p3 = arcPoint(arcStart, midR + 6, blockHeight - 40 - notchSize);
            const p4 = arcPoint(arcStart, midR - 6, blockHeight - 40 - notchSize);
            return (
              <path
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
                fill="none"
                stroke="#333"
                strokeWidth={1.2}
              />
            );
          })()}

          {/* Probe indicator with U-shape symbol at top pointing to steps */}
          {(() => {
            const probePos = arcPoint(arcEnd + 20, outerR + 50, blockHeight + 20);
            const arrowEnd = arcPoint(arcEnd - 5, outerR, blockHeight - stepHeight);
            return (
              <g>
                {/* Arrow line pointing down to steps */}
                <line
                  x1={probePos.x}
                  y1={probePos.y}
                  x2={arrowEnd.x}
                  y2={arrowEnd.y}
                  stroke="#333"
                  strokeWidth={1}
                />
                {/* U-shaped probe symbol */}
                <path
                  d={`M ${probePos.x - 8} ${probePos.y - 18} 
                      L ${probePos.x - 8} ${probePos.y - 5} 
                      Q ${probePos.x} ${probePos.y + 2} ${probePos.x + 8} ${probePos.y - 5} 
                      L ${probePos.x + 8} ${probePos.y - 18}`}
                  fill="none"
                  stroke="#333"
                  strokeWidth={1.5}
                />
              </g>
            );
          })()}
        </g>

      </svg>

      {/* Load Image Button */}
      <div className="absolute top-12 left-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadImage}
          className="bg-white/90 hover:bg-white"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Load Image
        </Button>
      </div>
    </div>
  );
}
