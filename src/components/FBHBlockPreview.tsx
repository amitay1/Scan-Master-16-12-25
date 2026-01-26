/**
 * FBH Block Preview Component - LARGE Version
 * Full-size calibration block visualization that updates in real-time
 * Based on ØFBH, E (block height), and H (hole depth) values
 * Styled to match FBHStraightBeamDrawing.tsx
 */

import { useMemo } from 'react';

interface FBHBlockPreviewProps {
  /** Hole ID for labeling */
  holeId: number;
  /** FBH diameter in mm */
  diameterMm: number;
  /** Block height E in mm */
  blockHeightE: number;
  /** Metal travel / hole depth H in mm */
  metalTravelH: number;
  /** Preview width - default 350 for large display */
  width?: number;
  /** Preview height - default 450 for large display */
  height?: number;
}

export function FBHBlockPreview({
  holeId,
  diameterMm,
  blockHeightE,
  metalTravelH,
  width = 350,
  height = 450,
}: FBHBlockPreviewProps) {
  // Calculate proportional dimensions similar to FBHStraightBeamDrawing
  const dimensions = useMemo(() => {
    // Common vertical alignment
    const commonCenterY = height * 0.45;
    const sideViewCenterX = width * 0.50;

    // Base block dimensions - scale based on E (block height)
    // Maximum E value expected is 350mm
    const maxE = 350;
    const minBlockHeight = 120;
    const maxBlockHeight = height * 0.6;

    // Scale block height proportionally to E value
    const scaleFactor = Math.min(blockHeightE / maxE, 1);
    const blockHeight = Math.max(minBlockHeight, scaleFactor * maxBlockHeight + minBlockHeight * (1 - scaleFactor));
    const blockWidth = blockHeight * 0.65; // Keep aspect ratio

    const blockTop = commonCenterY - blockHeight / 2;
    const blockLeft = sideViewCenterX - blockWidth / 2;
    const blockRight = sideViewCenterX + blockWidth / 2;
    const blockBottom = commonCenterY + blockHeight / 2;

    // FBH hole dimensions - scale H proportionally to block height
    // H should be proportional to blockHeightE (H <= E)
    const hRatio = Math.min(metalTravelH / blockHeightE, 0.95);
    const fbhHoleDepth = Math.max(blockHeight * hRatio, 20);

    // FBH diameter visualization - scale based on actual diameter
    // Make it visible but proportional (min 12px, max 40px)
    const fbhHoleWidth = Math.max(12, Math.min(40, diameterMm * 8));

    const fbhCenterX = sideViewCenterX;
    const fbhTop = blockBottom - fbhHoleDepth; // Top of hole (flat bottom)

    return {
      commonCenterY,
      sideViewCenterX,
      blockWidth,
      blockHeight,
      blockTop,
      blockLeft,
      blockRight,
      blockBottom,
      fbhHoleWidth,
      fbhHoleDepth,
      fbhCenterX,
      fbhTop,
    };
  }, [width, height, blockHeightE, metalTravelH, diameterMm]);

  const {
    blockWidth,
    blockHeight,
    blockTop,
    blockLeft,
    blockRight,
    blockBottom,
    fbhHoleWidth,
    fbhHoleDepth,
    fbhCenterX,
    fbhTop,
  } = dimensions;

  return (
    <div className="flex flex-col items-center">
      {/* Hole ID Badge - larger */}
      <div className="mb-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/30">
        <span className="text-lg font-bold text-primary">Hole #{holeId}</span>
      </div>

      <svg
        width={width}
        height={height}
        className="border-2 rounded-lg bg-slate-50 shadow-sm"
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
          strokeWidth={2.5}
        />

        {/* FBH Hole INSIDE the block */}
        <g>
          {/* Hole outline */}
          <rect
            x={fbhCenterX - fbhHoleWidth / 2}
            y={fbhTop}
            width={fbhHoleWidth}
            height={fbhHoleDepth}
            fill="#e5e5e5"
            stroke="#333"
            strokeWidth={2}
          />
          {/* Flat bottom of hole (the reflector) - thicker line */}
          <line
            x1={fbhCenterX - fbhHoleWidth / 2}
            y1={fbhTop}
            x2={fbhCenterX + fbhHoleWidth / 2}
            y2={fbhTop}
            stroke="#333"
            strokeWidth={3}
          />
          {/* Hatching inside hole */}
          {[...Array(Math.max(3, Math.floor(fbhHoleWidth / 8)))].map((_, i) => (
            <line
              key={i}
              x1={fbhCenterX - fbhHoleWidth / 2 + 4 + i * 6}
              y1={fbhTop + 4}
              x2={fbhCenterX - fbhHoleWidth / 2 + 4 + i * 6}
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

        {/* ==================== DIMENSIONS ==================== */}

        {/* ØFBH - FBH Diameter (left side of hole) - BLUE */}
        <g>
          {/* Horizontal line showing hole width */}
          <line
            x1={fbhCenterX - fbhHoleWidth / 2}
            y1={fbhTop + 20}
            x2={fbhCenterX + fbhHoleWidth / 2}
            y2={fbhTop + 20}
            stroke="#2563eb"
            strokeWidth={2.5}
          />
          {/* End ticks */}
          <line
            x1={fbhCenterX - fbhHoleWidth / 2}
            y1={fbhTop + 14}
            x2={fbhCenterX - fbhHoleWidth / 2}
            y2={fbhTop + 26}
            stroke="#2563eb"
            strokeWidth={2.5}
          />
          <line
            x1={fbhCenterX + fbhHoleWidth / 2}
            y1={fbhTop + 14}
            x2={fbhCenterX + fbhHoleWidth / 2}
            y2={fbhTop + 26}
            stroke="#2563eb"
            strokeWidth={2.5}
          />
          {/* Label with arrow */}
          <line
            x1={fbhCenterX - fbhHoleWidth / 2 - 5}
            y1={fbhTop + 20}
            x2={fbhCenterX - fbhHoleWidth / 2 - 40}
            y2={fbhTop - 15}
            stroke="#2563eb"
            strokeWidth={2.5}
          />
          <text
            x={blockLeft - 10}
            y={fbhTop - 10}
            textAnchor="end"
            fill="#2563eb"
            style={{ fontSize: 22, fontWeight: 700 }}
          >
            Ø{diameterMm.toFixed(2)}
          </text>
        </g>

        {/* H - Metal Travel Distance (right side) - GREEN */}
        <g>
          <line
            x1={fbhCenterX + fbhHoleWidth / 2 + 25}
            y1={fbhTop}
            x2={fbhCenterX + fbhHoleWidth / 2 + 25}
            y2={blockBottom}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          <line
            x1={fbhCenterX + fbhHoleWidth / 2 + 18}
            y1={fbhTop}
            x2={fbhCenterX + fbhHoleWidth / 2 + 32}
            y2={fbhTop}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          <line
            x1={fbhCenterX + fbhHoleWidth / 2 + 18}
            y1={blockBottom}
            x2={fbhCenterX + fbhHoleWidth / 2 + 32}
            y2={blockBottom}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          {/* Arrow and label */}
          <line
            x1={fbhCenterX + fbhHoleWidth / 2 + 32}
            y1={fbhTop + fbhHoleDepth / 2}
            x2={fbhCenterX + fbhHoleWidth / 2 + 55}
            y2={fbhTop + fbhHoleDepth / 2}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          <text
            x={fbhCenterX + fbhHoleWidth / 2 + 60}
            y={fbhTop + fbhHoleDepth / 2 + 8}
            fill="#16a34a"
            style={{ fontSize: 24, fontWeight: 700 }}
          >
            H={metalTravelH.toFixed(1)}
          </text>
        </g>

        {/* E - Block height - ORANGE */}
        <g>
          <line
            x1={blockRight + 50}
            y1={blockTop}
            x2={blockRight + 50}
            y2={blockBottom}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          <line
            x1={blockRight + 42}
            y1={blockTop}
            x2={blockRight + 58}
            y2={blockTop}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          <line
            x1={blockRight + 42}
            y1={blockBottom}
            x2={blockRight + 58}
            y2={blockBottom}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          <text
            x={blockRight + 65}
            y={(blockTop + blockBottom) / 2 + 8}
            fill="#ea580c"
            style={{ fontSize: 24, fontWeight: 700 }}
          >
            E={blockHeightE.toFixed(1)}
          </text>
        </g>

        {/* Title at bottom with values */}
        <text
          x={width / 2}
          y={height - 25}
          textAnchor="middle"
          fill="#333"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          ØFBH: {diameterMm.toFixed(2)}mm | E: {blockHeightE.toFixed(1)}mm | H: {metalTravelH.toFixed(1)}mm
        </text>
      </svg>
    </div>
  );
}

export default FBHBlockPreview;
