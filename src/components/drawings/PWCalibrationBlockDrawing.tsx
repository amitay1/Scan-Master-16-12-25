/**
 * Pratt & Whitney IAE2P16675 Calibration Block Drawing Component
 *
 * Goal: Match NDIP-1226 / NDIP-1227 Figure 1 ("Calibration standard") geometry
 * closely, while keeping highlighting flexible (active vs omitted holes).
 *
 * Notes (Figure 1):
 * - Top view: 8.000 ± .015 by 1.605 ± .015
 * - Profile: end faces 60.000° ± .500° and 45.000° ± .500°
 * - Reference height: (3.500)
 * - Bottom flat: 2.479 ± .015
 * - All Figure-1 holes are displayed (J,K,L,M,N,P,Q,R,S)
 * - DAC active calibration holes: L through S (J & K omitted per 5.1.1.7.1)
 */

import React, { useId, useMemo } from "react";
import { PW_ANGLE_CALIBRATION_BLOCK } from "@/rules/pw/pwCalibrationBlocks";

// ============================================================================
// TYPES
// ============================================================================

interface PWCalibrationBlockDrawingProps {
  width?: number;
  height?: number;
  showDimensions?: boolean;
  showTitleBlock?: boolean;
  highlightedHoles?: string[];
  title?: string;
  standardRef?: "NDIP-1226" | "NDIP-1227";
}

type HoleSpec = {
  id: string;
  used: boolean;
};

// ============================================================================
// FIGURE CONSTANTS (inches)
// ============================================================================

const FIG1 = {
  topLengthIn: 8.0,
  topDepthIn: 1.605,
  heightRefIn: 3.5,
  bottomFlatIn: 2.479,
  leftFaceDeg: 60,
  rightFaceDeg: 45,
} as const;

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function normId(v: string) {
  return v.trim().toUpperCase();
}

export function PWCalibrationBlockDrawing({
  width = 950,
  height = 700,
  showDimensions = true,
  showTitleBlock = true,
  highlightedHoles = [],
  title = "IAE2P16675 - 45° Angle Calibration Block",
  standardRef = "NDIP-1226",
}: PWCalibrationBlockDrawingProps) {
  const uniqueId = useId().replace(/:/g, "");

  const holes: HoleSpec[] = useMemo(
    () =>
      PW_ANGLE_CALIBRATION_BLOCK.holes.map((h) => ({
        id: normId(h.id),
        used: Boolean(h.used),
      })),
    []
  );

  const highlighted = useMemo(() => new Set(highlightedHoles.map(normId)), [highlightedHoles]);

  // Adaptive layout sizing to avoid view overlap on narrower canvases.
  const layout = {
    leftMargin: 70,
    rightMargin: 32,
    topViewY: 90,
    profileY: 270,
    isoY: 270,
    minGap: 24,
  } as const;
  const isoFace = {
    width: 260,
    height: 140,
    depthX: 90,
    depthY: 60,
  } as const;

  // Keep enough room for the isometric block (including back-face offset)
  // and preserve a minimum horizontal gap from the left views.
  const maxScaleByWidth =
    (width -
      layout.rightMargin -
      isoFace.width -
      isoFace.depthX -
      layout.minGap -
      layout.leftMargin) / FIG1.topLengthIn;

  // Keep profile + dimensions above the optional title block.
  const titleBlockTop = showTitleBlock ? height - 120 : height - 24;
  const profileExtra = 82; // dimension text and arrows under profile
  const maxScaleByHeight = (titleBlockTop - layout.profileY - profileExtra) / FIG1.heightRefIn;

  const SCALE = Math.max(34, Math.min(60, maxScaleByWidth, maxScaleByHeight)); // px per inch
  const topLenPx = FIG1.topLengthIn * SCALE;
  const topDepthPx = FIG1.topDepthIn * SCALE;
  const profHeightPx = FIG1.heightRefIn * SCALE;

  // Trapezoid math (matches the OEM dimensions exactly)
  const runLeftIn = FIG1.heightRefIn / Math.tan(degToRad(FIG1.leftFaceDeg));
  const runRightIn = FIG1.heightRefIn / Math.tan(degToRad(FIG1.rightFaceDeg));
  const runLeftPx = runLeftIn * SCALE;
  const runRightPx = runRightIn * SCALE;
  const bottomLeftPx = runLeftPx;
  const bottomRightPx = topLenPx - runRightPx;
  const bottomFlatPx = bottomRightPx - bottomLeftPx;

  // View anchors
  const topView = { x: layout.leftMargin, y: layout.topViewY };
  const profileView = { x: layout.leftMargin, y: layout.profileY };
  const leftViewsRight = topView.x + topLenPx;
  const isoFrontX = Math.max(
    width - layout.rightMargin - isoFace.width,
    leftViewsRight + layout.minGap + isoFace.depthX
  );
  const isoView = { x: isoFrontX, y: layout.isoY };

  const stroke = "#111827";
  const dim = "#374151";
  const muted = "#6b7280";
  const dimArrow = `url(#arrow-${uniqueId})`;
  const dimArrowRev = `url(#arrow-rev-${uniqueId})`;

  const drawDimH = (
    x1: number,
    x2: number,
    y: number,
    label: string,
    extY1: number,
    extY2: number,
    textDy = -6
  ) => (
    <g>
      <line x1={x1} y1={extY1} x2={x1} y2={extY2} stroke={dim} strokeWidth="1" />
      <line x1={x2} y1={extY1} x2={x2} y2={extY2} stroke={dim} strokeWidth="1" />
      <line
        x1={x1 + 6}
        y1={y}
        x2={x2 - 6}
        y2={y}
        stroke={dim}
        strokeWidth="1.2"
        markerStart={dimArrowRev}
        markerEnd={dimArrow}
      />
      <rect x={(x1 + x2) / 2 - 58} y={y + textDy - 10} width="116" height="18" fill="white" />
      <text x={(x1 + x2) / 2} y={y + textDy + 3} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={stroke}>
        {label}
      </text>
    </g>
  );

  const drawDimV = (
    x: number,
    y1: number,
    y2: number,
    label: string,
    extX1: number,
    extX2: number
  ) => (
    <g>
      <line x1={extX1} y1={y1} x2={extX2} y2={y1} stroke={dim} strokeWidth="1" />
      <line x1={extX1} y1={y2} x2={extX2} y2={y2} stroke={dim} strokeWidth="1" />
      <line
        x1={x}
        y1={y1 + 6}
        x2={x}
        y2={y2 - 6}
        stroke={dim}
        strokeWidth="1.2"
        markerStart={dimArrowRev}
        markerEnd={dimArrow}
      />
      <rect x={x - 48} y={(y1 + y2) / 2 - 9} width="96" height="18" fill="white" />
      <text x={x} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={stroke}>
        {label}
      </text>
    </g>
  );

  // Approximate hole layout from the OEM isometric view (front face).
  // Coordinates are normalized to the front face rectangle.
  const isoHoleLayout: Record<string, { x: number; y: number }> = {
    // Bottom row
    S: { x: 0.18, y: 0.78 },
    Q: { x: 0.44, y: 0.78 },
    N: { x: 0.66, y: 0.78 },
    L: { x: 0.84, y: 0.78 },
    J: { x: 0.93, y: 0.78 },
    // Top row
    R: { x: 0.30, y: 0.40 },
    P: { x: 0.56, y: 0.40 },
    M: { x: 0.80, y: 0.40 },
    K: { x: 0.93, y: 0.40 },
  };

  return (
    <div
      data-testid="angle-beam-image-capture"
      className="pw-calibration-block-drawing angle-beam-image-capture bg-white rounded-lg border-2 border-blue-200 shadow-lg overflow-x-auto"
    >
      {/* Header (kept compact; main fidelity is in the figure itself) */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-800 px-3 py-1 rounded font-bold text-lg">P&W</div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm opacity-90">Calibration Standard - {standardRef} - Figure 1</p>
            </div>
          </div>
          <div className="text-right text-xs leading-5 opacity-90 font-mono">
            <div>PN: {PW_ANGLE_CALIBRATION_BLOCK.partNumber}</div>
            <div>FBH: #{PW_ANGLE_CALIBRATION_BLOCK.fbhSize} (1/64")</div>
          </div>
        </div>
      </div>

      <svg
        data-testid="angle-beam-calibration-block"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-auto min-w-[760px] mx-auto bg-white angle-beam-calibration-image"
      >
        <defs>
          <marker id={`arrow-${uniqueId}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 L2,5 Z" fill={dim} />
          </marker>
          <marker id={`arrow-rev-${uniqueId}`} markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto">
            <path d="M10,0 L0,5 L10,10 L8,5 Z" fill={dim} />
          </marker>
        </defs>

        {/* Figure label */}
        <text x={width / 2} y={40} textAnchor="middle" fontSize="14" fontWeight="700" fill={stroke} fontFamily="monospace">
          FIGURE 1 - CALIBRATION STANDARD (IAE2P16675)
        </text>

        {/* ====================== TOP VIEW ====================== */}
        <g transform={`translate(${topView.x}, ${topView.y})`}>
          <text x={topLenPx / 2} y={-18} textAnchor="middle" fontSize="12" fontWeight="700" fill={stroke} fontFamily="monospace">
            TOP VIEW
          </text>

          <rect x={0} y={0} width={topLenPx} height={topDepthPx} fill="#ffffff" stroke={stroke} strokeWidth="2" />

          {showDimensions && (
            <>
              {drawDimH(0, topLenPx, topDepthPx + 28, '8.000 ± .015', -4, topDepthPx + 10)}
              {drawDimV(-28, 0, topDepthPx, '1.605 ± .015', -8, 8)}
            </>
          )}
        </g>

        {/* ====================== PROFILE VIEW ====================== */}
        <g transform={`translate(${profileView.x}, ${profileView.y})`}>
          <text x={topLenPx / 2} y={-18} textAnchor="middle" fontSize="12" fontWeight="700" fill={stroke} fontFamily="monospace">
            PROFILE VIEW
          </text>

          {/* Trapezoid profile (matches the OEM dimension set) */}
          <path
            d={[
              `M 0 0`,
              `L ${topLenPx} 0`,
              `L ${bottomRightPx} ${profHeightPx}`,
              `L ${bottomLeftPx} ${profHeightPx}`,
              `Z`,
            ].join(" ")}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth="2.5"
          />

          {/* Center reference line (3.500) */}
          <line x1={topLenPx / 2} y1={0} x2={topLenPx / 2} y2={profHeightPx} stroke={muted} strokeWidth="1" />

          {/* Face angle labels (approximate placement) */}
          <text x={topLenPx * 0.16} y={36} fontSize="11" fontFamily="monospace" fill={stroke}>
            {FIG1.leftFaceDeg.toFixed(0)}.000° ± .500°
          </text>
          <text x={topLenPx * 0.67} y={36} fontSize="11" fontFamily="monospace" fill={stroke}>
            {FIG1.rightFaceDeg.toFixed(0)}.000° ± .500°
          </text>

          {/* Bottom flat highlight */}
          <line
            x1={bottomLeftPx}
            y1={profHeightPx}
            x2={bottomRightPx}
            y2={profHeightPx}
            stroke={stroke}
            strokeWidth="3"
          />

          {showDimensions && (
            <>
              {/* Top length */}
              {drawDimH(0, topLenPx, profHeightPx + 50, "8.000 ± .015", -8, profHeightPx + 18)}

              {/* Bottom flat */}
              {drawDimH(
                bottomLeftPx,
                bottomRightPx,
                profHeightPx + 24,
                "2.479 ± .015",
                profHeightPx - 10,
                profHeightPx + 10,
                -6
              )}

              {/* Height ref (3.500) */}
              {drawDimV(topLenPx + 30, 0, profHeightPx, "(3.500)", topLenPx + 14, topLenPx + 46)}

              {/* Scale label */}
              <text x={topLenPx / 2} y={profHeightPx + 72} textAnchor="middle" fontSize="10" fontFamily="monospace" fill={muted}>
                SCALE: 2/1
              </text>
            </>
          )}
        </g>

        {/* ====================== ISOMETRIC VIEW (HOLE LAYOUT) ====================== */}
        <g transform={`translate(${isoView.x}, ${isoView.y})`}>
          <text x={140} y={-18} textAnchor="middle" fontSize="12" fontWeight="700" fill={stroke} fontFamily="monospace">
            ISOMETRIC - HOLE LAYOUT
          </text>

          {(() => {
            const faceW = isoFace.width;
            const faceH = isoFace.height;
            const dx = -isoFace.depthX;
            const dy = -isoFace.depthY;

            // Front face origin (0,0) to (faceW, faceH)
            const front = { x: 0, y: 0 };
            const back = { x: dx, y: dy };

            return (
              <>
                {/* Back face */}
                <polygon
                  points={[
                    `${back.x},${back.y}`,
                    `${back.x + faceW},${back.y}`,
                    `${back.x + faceW},${back.y + faceH}`,
                    `${back.x},${back.y + faceH}`,
                  ].join(" ")}
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth="1.5"
                />

                {/* Top face */}
                <polygon
                  points={[
                    `${back.x},${back.y}`,
                    `${back.x + faceW},${back.y}`,
                    `${front.x + faceW},${front.y}`,
                    `${front.x},${front.y}`,
                  ].join(" ")}
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth="1.5"
                />

                {/* Side face */}
                <polygon
                  points={[
                    `${back.x},${back.y}`,
                    `${front.x},${front.y}`,
                    `${front.x},${front.y + faceH}`,
                    `${back.x},${back.y + faceH}`,
                  ].join(" ")}
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth="1.5"
                />

                {/* Front face (hole face) */}
                <rect x={front.x} y={front.y} width={faceW} height={faceH} fill="#ffffff" stroke={stroke} strokeWidth="2" />

                {/* 45-degree label on top (matches the OEM isometric annotation) */}
                <text x={front.x + faceW - 62} y={front.y - 6} fontSize="14" fontFamily="monospace" fill={stroke}>
                  45°
                </text>

                {/* Holes */}
                {holes
                  .filter((h) => isoHoleLayout[h.id])
                  .map((h) => {
                    const pos = isoHoleLayout[h.id];
                    const cx = front.x + faceW * pos.x;
                    const cy = front.y + faceH * pos.y;
                    const r = 6;
                    const isHighlighted = highlighted.has(h.id);

                    return (
                      <g key={h.id}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill={isHighlighted ? "#fef3c7" : "#111827"}
                          stroke={isHighlighted ? "#f59e0b" : stroke}
                          strokeWidth={isHighlighted ? 2 : 1.5}
                        />

                        {/* Label */}
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={700}
                          fontFamily="monospace"
                          fill={stroke}
                        >
                          {h.id}
                        </text>
                      </g>
                    );
                  })}
              </>
            );
          })()}
        </g>

        {/* ====================== TITLE BLOCK ====================== */}
        {showTitleBlock && (
          <g transform={`translate(40, ${height - 120})`}>
            <rect x={0} y={0} width={width - 80} height={90} fill="#f8fafc" stroke={stroke} strokeWidth="1.2" />
            <line x1={0} y1={28} x2={width - 80} y2={28} stroke={stroke} strokeWidth="1" />
            <text x={12} y={20} fontSize="11" fontFamily="monospace" fill={stroke} fontWeight="700">
              STANDARD: {standardRef}
            </text>
            <text x={12} y={52} fontSize="11" fontFamily="monospace" fill={stroke}>
              PART: {PW_ANGLE_CALIBRATION_BLOCK.partNumber} (Calibration Block)
            </text>
            <text x={12} y={72} fontSize="11" fontFamily="monospace" fill={stroke}>
              HOLES SHOWN: J, K, L, M, N, P, Q, R, S | DAC: L-S
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default PWCalibrationBlockDrawing;
