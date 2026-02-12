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
  /** Optional part context for dynamic profile shape */
  partGeometry?: string;
  outerDiameterMm?: number;
  innerDiameterMm?: number;
  referenceThicknessMm?: number;
}

export function FBHBlockPreview({
  holeId,
  diameterMm,
  blockHeightE,
  metalTravelH,
  width = 420,
  height = 520,
  partGeometry,
  outerDiameterMm,
  innerDiameterMm,
  referenceThicknessMm,
}: FBHBlockPreviewProps) {
  // Calculate proportional dimensions similar to FBHStraightBeamDrawing
  const dimensions = useMemo(() => {
    // Common vertical alignment - shift slightly up to make room for bottom label
    const commonCenterY = height * 0.42;
    // Shift block left to make more room for dimension lines on the right
    const sideViewCenterX = width * 0.38;

    const roundGeometries = new Set([
      "tube",
      "pipe",
      "hollow_cylinder",
      "ring",
      "sleeve",
      "ring_forging",
      "cylinder",
      "round_bar",
      "shaft",
      "solid_round",
      "disk",
      "disk_forging",
      "hub",
      "hpt_disk",
    ]);
    const isRoundProfile = !!partGeometry && roundGeometries.has(partGeometry);

    // Dynamic scale range that reacts more strongly to E changes
    const maxE = Math.max(referenceThicknessMm ? referenceThicknessMm * 6 : 180, 120);
    const minBlockHeight = isRoundProfile ? 70 : 55;
    const maxBlockHeight = height * 0.58;
    const normalizedE = Math.min(Math.max(blockHeightE / maxE, 0.05), 1);
    const blockHeight = minBlockHeight + normalizedE * (maxBlockHeight - minBlockHeight);
    const blockWidth = blockHeight * (isRoundProfile ? 0.62 : 0.55);

    const blockTop = commonCenterY - blockHeight / 2;
    const blockLeft = sideViewCenterX - blockWidth / 2;
    const blockRight = sideViewCenterX + blockWidth / 2;
    const blockBottom = commonCenterY + blockHeight / 2;

    // FBH hole dimensions - scale H proportionally to block height
    const safeE = Math.max(blockHeightE, 1);
    const hRatio = Math.min(metalTravelH / safeE, 0.95);
    const fbhHoleDepth = Math.max(blockHeight * hRatio, 14);

    // FBH diameter visualization - scale based on actual diameter
    const fbhHoleWidth = Math.max(10, Math.min(35, diameterMm * 7));

    const fbhCenterX = sideViewCenterX;
    const fbhTop = blockBottom - fbhHoleDepth; // Top of hole (flat bottom)

    // Dimension line offsets - positioned outside the block with consistent spacing
    const dimLineGap = isRoundProfile ? 18 : 15;
    const dimLineSpacing = 45;
    const hLineX = blockRight + dimLineGap + 20;
    const eLineX = hLineX + dimLineSpacing;
    const profileBulge = isRoundProfile ? blockWidth * 0.16 : 0;
    const dimensionLabelFontSize = 20;
    const dimensionLabelPadding = 6;
    const labelYMin = 24;
    const labelYMax = height - 36;

    // Avoid H/E label collision when H is close to E (deep holes)
    const defaultHLabelY = fbhTop + fbhHoleDepth / 2 + 6;
    const eLabelY = (blockTop + blockBottom) / 2 + 6;
    let hLabelY = Math.min(Math.max(defaultHLabelY, labelYMin), labelYMax);
    let hLabelX = hLineX + 12;
    let hLabelAnchor: "start" | "end" = "start";
    const eLabelX = eLineX + 12;
    const eLabelAnchor: "start" | "end" = "start";

    const hLabelText = `H=${metalTravelH.toFixed(1)}`;
    const eLabelText = `E=${blockHeightE.toFixed(1)}`;

    const estimatedTextWidth = (text: string) => Math.max(24, text.length * dimensionLabelFontSize * 0.62);
    const getTextBounds = (
      x: number,
      y: number,
      text: string,
      anchor: "start" | "end",
    ) => {
      const widthPx = estimatedTextWidth(text);
      const left = anchor === "end" ? x - widthPx : x;
      const right = anchor === "end" ? x : x + widthPx;
      const top = y - dimensionLabelFontSize * 0.85;
      const bottom = y + dimensionLabelFontSize * 0.25;
      return { left, right, top, bottom };
    };

    const areBoundsOverlapping = (
      a: { left: number; right: number; top: number; bottom: number },
      b: { left: number; right: number; top: number; bottom: number },
    ) =>
      a.left < b.right + dimensionLabelPadding &&
      a.right > b.left - dimensionLabelPadding &&
      a.top < b.bottom + dimensionLabelPadding &&
      a.bottom > b.top - dimensionLabelPadding;

    const eBounds = getTextBounds(eLabelX, eLabelY, eLabelText, eLabelAnchor);
    let hBounds = getTextBounds(hLabelX, hLabelY, hLabelText, hLabelAnchor);

    if (areBoundsOverlapping(hBounds, eBounds)) {
      // First fallback: keep same Y but render H text on the left side of its dimension line
      hLabelX = hLineX - 12;
      hLabelAnchor = "end";
      hBounds = getTextBounds(hLabelX, hLabelY, hLabelText, hLabelAnchor);
    }

    if (areBoundsOverlapping(hBounds, eBounds)) {
      // Second fallback: move H label above/under the measured region
      const preferredAbove = Math.min(Math.max(fbhTop - 10, labelYMin), labelYMax);
      const preferredBelow = Math.min(Math.max(blockBottom + 24, labelYMin), labelYMax);

      hLabelY = preferredAbove;
      hBounds = getTextBounds(hLabelX, hLabelY, hLabelText, hLabelAnchor);

      if (areBoundsOverlapping(hBounds, eBounds)) {
        hLabelY = preferredBelow;
        hBounds = getTextBounds(hLabelX, hLabelY, hLabelText, hLabelAnchor);
      }

      if (areBoundsOverlapping(hBounds, eBounds)) {
        hLabelY = Math.min(Math.max(eLabelY - dimensionLabelFontSize * 1.5, labelYMin), labelYMax);
      }
    }

    return {
      isRoundProfile,
      profileBulge,
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
      hLabelY,
      hLabelX,
      hLabelAnchor,
      eLabelY,
      eLabelX,
      eLabelAnchor,
      dimensionLabelFontSize,
    };
  }, [
    width,
    height,
    blockHeightE,
    metalTravelH,
    diameterMm,
    partGeometry,
    referenceThicknessMm,
  ]);

  const {
    isRoundProfile,
    profileBulge,
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
    hLabelY,
    hLabelX,
    hLabelAnchor,
    eLabelY,
    eLabelX,
    eLabelAnchor,
    dimensionLabelFontSize,
  } = dimensions;

  return (
    <div className="flex flex-col items-center">
      {/* Hole ID Badge - larger */}
      <div className="mb-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/30">
        <span className="text-lg font-bold text-primary">Hole #{holeId}</span>
      </div>

      <svg
        id={holeId === 1 ? "calibration-block-svg" : undefined}
        data-testid={holeId === 1 ? "calibration-block-diagram" : undefined}
        width={width}
        height={height}
        className="border-2 rounded-lg bg-slate-50 shadow-sm fbh-straight-beam-drawing"
      >
        <rect x="0" y="0" width={width} height={height} fill="#fafafa" />

        {/* ==================== SIDE VIEW ==================== */}

        {/* Main block outline - flat or curved profile based on selected part geometry */}
        {isRoundProfile ? (
          <path
            d={`M ${blockLeft} ${blockTop}
                Q ${fbhCenterX} ${blockTop - profileBulge} ${blockRight} ${blockTop}
                L ${blockRight} ${blockBottom}
                Q ${fbhCenterX} ${blockBottom + profileBulge} ${blockLeft} ${blockBottom}
                Z`}
            fill="none"
            stroke="#333"
            strokeWidth={2.5}
          />
        ) : (
          <rect
            x={blockLeft}
            y={blockTop}
            width={blockWidth}
            height={blockHeight}
            fill="none"
            stroke="#333"
            strokeWidth={2.5}
          />
        )}

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
            x={hLabelX}
            y={hLabelY}
            textAnchor={hLabelAnchor}
            fill="#16a34a"
            style={{ fontSize: dimensionLabelFontSize, fontWeight: 700 }}
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
            x={eLabelX}
            y={eLabelY}
            textAnchor={eLabelAnchor}
            fill="#ea580c"
            style={{ fontSize: dimensionLabelFontSize, fontWeight: 700 }}
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
          {isRoundProfile ? " | Profile: Round" : " | Profile: Flat"}
          {isRoundProfile && outerDiameterMm ? ` | OD: ${outerDiameterMm.toFixed(1)}mm` : ""}
          {isRoundProfile && innerDiameterMm ? ` | ID: ${innerDiameterMm.toFixed(1)}mm` : ""}
        </text>
      </svg>
    </div>
  );
}

export default FBHBlockPreview;
