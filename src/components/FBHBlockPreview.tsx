/**
 * FBH Block Preview Component - LARGE Version
 * Full-size calibration block visualization that updates in real-time
 * Based on ØFBH, E (block height), and H (hole depth) values
 * Styled to match FBHStraightBeamDrawing.tsx
 *
 * Dimension lines are positioned outside the block to avoid overlapping:
 * - ØFBH (blue): Left side with arrow pointing to hole
 * - H (green): Right side, closer to block
 * - E (orange): Right side, further out from H
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
  /** Preview width - default 420 for large display */
  width?: number;
  /** Preview height - default 520 for large display */
  height?: number;
}

export function FBHBlockPreview({
  holeId,
  diameterMm,
  blockHeightE,
  metalTravelH,
  width = 420,
  height = 520,
}: FBHBlockPreviewProps) {
  // Calculate proportional dimensions similar to FBHStraightBeamDrawing
  const dimensions = useMemo(() => {
    // Common vertical alignment - shift slightly up to make room for bottom label
    const commonCenterY = height * 0.42;
    // Shift block left to make more room for dimension lines on the right
    const sideViewCenterX = width * 0.38;

    // Base block dimensions - scale based on E (block height)
    // Maximum E value expected is 350mm
    const maxE = 350;
    const minBlockHeight = 100;
    const maxBlockHeight = height * 0.55;

    // Scale block height proportionally to E value
    const scaleFactor = Math.min(blockHeightE / maxE, 1);
    const blockHeight = Math.max(minBlockHeight, scaleFactor * maxBlockHeight + minBlockHeight * (1 - scaleFactor));
    const blockWidth = blockHeight * 0.55; // Slightly narrower aspect ratio

    const blockTop = commonCenterY - blockHeight / 2;
    const blockLeft = sideViewCenterX - blockWidth / 2;
    const blockRight = sideViewCenterX + blockWidth / 2;
    const blockBottom = commonCenterY + blockHeight / 2;

    // FBH hole dimensions - scale H proportionally to block height
    // H should be proportional to blockHeightE (H <= E)
    const hRatio = Math.min(metalTravelH / blockHeightE, 0.95);
    const fbhHoleDepth = Math.max(blockHeight * hRatio, 20);

    // FBH diameter visualization - scale based on actual diameter
    // Make it visible but proportional (min 12px, max 35px)
    const fbhHoleWidth = Math.max(12, Math.min(35, diameterMm * 7));

    const fbhCenterX = sideViewCenterX;
    const fbhTop = blockBottom - fbhHoleDepth; // Top of hole (flat bottom)

    // Dimension line offsets - positioned outside the block with consistent spacing
    const dimLineGap = 15; // Gap between block edge and first dimension line
    const dimLineSpacing = 45; // Spacing between H and E dimension lines

    // H dimension line X position (closer to block)
    const hLineX = blockRight + dimLineGap + 20;
    // E dimension line X position (further from block)
    const eLineX = hLineX + dimLineSpacing;

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
      hLineX,
      eLineX,
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
    hLineX,
    eLineX,
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

        {/* ØFBH - FBH Diameter (left side, above block) - BLUE */}
        <g>
          {/* Leader line from hole to label */}
          <line
            x1={fbhCenterX}
            y1={fbhTop + 15}
            x2={blockLeft - 25}
            y2={blockTop - 25}
            stroke="#2563eb"
            strokeWidth={2}
          />
          {/* Small tick at hole end */}
          <circle
            cx={fbhCenterX}
            cy={fbhTop + 15}
            r={3}
            fill="#2563eb"
          />
          {/* Label */}
          <text
            x={blockLeft - 30}
            y={blockTop - 30}
            textAnchor="end"
            fill="#2563eb"
            style={{ fontSize: 20, fontWeight: 700 }}
          >
            Ø{diameterMm.toFixed(2)}
          </text>
        </g>

        {/* H - Metal Travel Distance (right side, inner position) - GREEN */}
        <g>
          {/* Extension lines from hole top and block bottom */}
          <line
            x1={blockRight}
            y1={fbhTop}
            x2={hLineX + 8}
            y2={fbhTop}
            stroke="#16a34a"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          <line
            x1={blockRight}
            y1={blockBottom}
            x2={hLineX + 8}
            y2={blockBottom}
            stroke="#16a34a"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          {/* Vertical dimension line */}
          <line
            x1={hLineX}
            y1={fbhTop}
            x2={hLineX}
            y2={blockBottom}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          {/* Top tick */}
          <line
            x1={hLineX - 6}
            y1={fbhTop}
            x2={hLineX + 6}
            y2={fbhTop}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          {/* Bottom tick */}
          <line
            x1={hLineX - 6}
            y1={blockBottom}
            x2={hLineX + 6}
            y2={blockBottom}
            stroke="#16a34a"
            strokeWidth={2.5}
          />
          {/* Label - positioned to the right of H line */}
          <text
            x={hLineX + 12}
            y={fbhTop + fbhHoleDepth / 2 + 6}
            fill="#16a34a"
            style={{ fontSize: 20, fontWeight: 700 }}
          >
            H={metalTravelH.toFixed(1)}
          </text>
        </g>

        {/* E - Block height (right side, outer position) - ORANGE */}
        <g>
          {/* Extension lines from block top and bottom */}
          <line
            x1={hLineX + 35}
            y1={blockTop}
            x2={eLineX + 8}
            y2={blockTop}
            stroke="#ea580c"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          <line
            x1={hLineX + 35}
            y1={blockBottom}
            x2={eLineX + 8}
            y2={blockBottom}
            stroke="#ea580c"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          {/* Vertical dimension line */}
          <line
            x1={eLineX}
            y1={blockTop}
            x2={eLineX}
            y2={blockBottom}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          {/* Top tick */}
          <line
            x1={eLineX - 6}
            y1={blockTop}
            x2={eLineX + 6}
            y2={blockTop}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          {/* Bottom tick */}
          <line
            x1={eLineX - 6}
            y1={blockBottom}
            x2={eLineX + 6}
            y2={blockBottom}
            stroke="#ea580c"
            strokeWidth={2.5}
          />
          {/* Label - positioned to the right of E line */}
          <text
            x={eLineX + 12}
            y={(blockTop + blockBottom) / 2 + 6}
            fill="#ea580c"
            style={{ fontSize: 20, fontWeight: 700 }}
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
