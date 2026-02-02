import React, { useState } from "react";
import type { PWScanPlan, ScanZone } from "@/rules/pw/pwScanPlans";
import {
  PW_V2500_STAGE1_SCAN_PLAN,
  PW_V2500_STAGE2_SCAN_PLAN,
} from "@/rules/pw/pwScanPlans";

interface V2500BoreScanDiagramProps {
  stage?: 1 | 2;
  highlightedZone?: string | null;
  onZoneClick?: (zoneId: string) => void;
}

/** Color palette for scan zones */
const ZONE_COLORS: Record<string, string> = {
  // Stage 1
  E: "#3b82f6", // blue
  A: "#8b5cf6", // violet
  B: "#10b981", // emerald
  C: "#f59e0b", // amber
  D: "#ef4444", // red
  // Stage 2
  M: "#3b82f6",
  N: "#8b5cf6",
  O: "#10b981",
  P: "#ef4444",
  K: "#f59e0b",
  L: "#f97316", // orange
};

/**
 * V2500BoreScanDiagram
 *
 * Renders an accurate bore cross-section for V2500 Stage 1 (NDIP-1226) or
 * Stage 2 (NDIP-1227) HPT disks, based on Figure 2 of each document.
 *
 * Each labeled surface (E,A,B,C,D or M,N,O,P,K,L) is drawn with its correct
 * profile shape (arc, line, chamfer) and annotated with ±45° shear wave arrows.
 */
export const V2500BoreScanDiagram: React.FC<V2500BoreScanDiagramProps> = ({
  stage = 1,
  highlightedZone,
  onZoneClick,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const plan: PWScanPlan =
    stage === 1 ? PW_V2500_STAGE1_SCAN_PLAN : PW_V2500_STAGE2_SCAN_PLAN;

  const svgW = 700;
  const svgH = 520;

  // Is a zone highlighted or hovered?
  const activeZone = hoveredZone ?? highlightedZone ?? null;

  const zoneOpacity = (id: string) => (activeZone && activeZone !== id ? 0.3 : 1);
  const zoneStroke = (id: string) =>
    activeZone === id ? ZONE_COLORS[id] ?? "#1f2937" : "#1f2937";
  const zoneStrokeW = (id: string) => (activeZone === id ? 4 : 2.5);

  // Tooltip info for hovered zone
  const hoveredInfo: ScanZone | undefined = plan.scanZones.find(
    (z) => z.id === activeZone
  );

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 relative">
      {/* Tooltip */}
      {hoveredInfo && (
        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-[260px] z-10 shadow-lg">
          <div className="font-bold text-sm mb-1">
            Surface {hoveredInfo.id}: {hoveredInfo.surfaceName}
          </div>
          <div className="text-gray-300">{hoveredInfo.description}</div>
          <div className="mt-1 text-gray-400">
            Shape: {hoveredInfo.profileShape.type} — Scan: ±45° shear circumferential
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" style={{ maxHeight: "500px" }}>
        <defs>
          <pattern id="v2500-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d1d5db" strokeWidth="0.8" />
          </pattern>
          <marker id="arrow-pos" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0,0 8,3 0,6" fill="#dc2626" />
          </marker>
          <marker id="arrow-neg" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0,0 8,3 0,6" fill="#2563eb" />
          </marker>
        </defs>

        {/* Background grid */}
        <rect width={svgW} height={svgH} fill="#fafafa" />

        {/* Title */}
        <text x="20" y="28" fill="#1f2937" fontSize="16" fontWeight="bold">
          V2500 {stage === 1 ? "1st" : "2nd"} Stage HPT Disk — Bore Scan Plan
        </text>
        <text x="20" y="46" fill="#6b7280" fontSize="11">
          {plan.ndipReference} • Section 7.0 Figure 2 • PN {plan.partNumber}
        </text>

        {/* =========== CROSS-SECTION =========== */}
        {stage === 1 ? renderStage1(zoneOpacity, zoneStroke, zoneStrokeW, setHoveredZone, onZoneClick) : renderStage2(zoneOpacity, zoneStroke, zoneStrokeW, setHoveredZone, onZoneClick)}

        {/* ±45° shear wave legend */}
        <g transform="translate(20, 460)">
          <rect x="0" y="0" width="660" height="50" fill="#f9fafb" stroke="#e5e7eb" rx="4" />
          <line x1="15" y1="20" x2="55" y2="20" stroke="#dc2626" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrow-pos)" />
          <text x="70" y="24" fontSize="11" fill="#374151">+45° Shear Wave</text>
          <line x1="180" y1="20" x2="220" y2="20" stroke="#2563eb" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrow-neg)" />
          <text x="235" y="24" fontSize="11" fill="#374151">−45° Shear Wave</text>

          <text x="370" y="16" fontSize="10" fill="#6b7280">Scan: circumferential (θ) 360°</text>
          <text x="370" y="30" fontSize="10" fill="#6b7280">Index: along surface profile • Max 0.020″/rev</text>
          <text x="370" y="44" fontSize="10" fill="#6b7280">Min radial coverage: 2.6″</text>
        </g>
      </svg>
    </div>
  );
};

// =====================================================================
// Stage 1 — P/N 2A5001 — Surfaces E, A, B, C, D
// Cross-section showing upper bore area, axis of rotation on right
// =====================================================================
function renderStage1(
  zoneOpacity: (id: string) => number,
  zoneStroke: (id: string) => string,
  zoneStrokeW: (id: string) => number,
  setHover: (id: string | null) => void,
  onClick?: (id: string) => void,
) {
  // Coordinate system: origin upper-left of the cross-section area
  // The profile goes from left (web side) to right (bore ID / axis side)
  const ox = 80;   // origin X
  const oy = 300;  // origin Y (bottom of profile area)

  // Key waypoints derived from NDIP-1226 Figure 2 (proportional, not to-scale)
  // E: arc from web up into hub area
  // A: short chamfer upward
  // B: flat land across top
  // C: short chamfer down toward bore
  // D: bore ID vertical wall down

  const webY = oy;            // web level
  const hubTopY = oy - 160;   // top of hub
  const boreTopY = oy - 130;  // where bore ID starts (slightly below hub top)
  const boreBottomY = oy + 40; // bore ID extends below web

  // X positions (left = web side, right = bore/axis side)
  const webX = ox;
  const eArcEndX = ox + 80;
  const aEndX = ox + 120;
  const bEndX = ox + 280;
  const cEndX = ox + 310;
  const dX = ox + 310; // bore ID is at this X going down

  // Hatching for material body
  const bodyPath = `
    M ${webX} ${webY}
    Q ${webX + 20} ${webY - 60} ${eArcEndX} ${hubTopY + 30}
    L ${aEndX} ${hubTopY}
    L ${bEndX} ${hubTopY}
    L ${cEndX} ${boreTopY}
    L ${dX} ${boreBottomY}
    L ${webX + 350} ${boreBottomY}
    L ${webX + 350} ${webY + 60}
    L ${webX - 40} ${webY + 60}
    L ${webX - 40} ${webY}
    Z
  `;

  const makeZoneHandler = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onClick: () => onClick?.(id),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  return (
    <g id="stage1-bore-profile" transform="translate(50, 60)">
      {/* Section title */}
      <text x={ox + 100} y={oy - 200} textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">
        Cross-Section — Bore Area (Upper Half)
      </text>

      {/* Material body fill */}
      <path d={bodyPath} fill="url(#v2500-hatch)" stroke="none" />

      {/* Axis of rotation (dashed) */}
      <line x1={dX + 40} y1={hubTopY - 30} x2={dX + 40} y2={boreBottomY + 30} stroke="#9ca3af" strokeWidth="1" strokeDasharray="8,4" />
      <text x={dX + 45} y={hubTopY - 35} fill="#9ca3af" fontSize="9">Axis of rotation</text>

      {/* 2.6″ coverage dimension line */}
      <line x1={dX} y1={webY + 10} x2={dX - 160} y2={webY + 10} stroke="#059669" strokeWidth="1.5" />
      <line x1={dX} y1={webY + 5} x2={dX} y2={webY + 15} stroke="#059669" strokeWidth="1.5" />
      <line x1={dX - 160} y1={webY + 5} x2={dX - 160} y2={webY + 15} stroke="#059669" strokeWidth="1.5" />
      <text x={dX - 80} y={webY + 26} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">2.6″</text>

      {/* ===== Surface E: arc ===== */}
      <g opacity={zoneOpacity("E")} {...makeZoneHandler("E")}>
        <path
          d={`M ${webX} ${webY} Q ${webX + 20} ${webY - 60} ${eArcEndX} ${hubTopY + 30}`}
          fill="none"
          stroke={zoneStroke("E")}
          strokeWidth={zoneStrokeW("E")}
        />
        <text x={webX - 5} y={webY - 40} fill={ZONE_COLORS.E} fontSize="13" fontWeight="bold">E</text>
        <text x={webX - 5} y={webY - 26} fill={ZONE_COLORS.E} fontSize="8">arc</text>
      </g>

      {/* ===== Surface A: chamfer ===== */}
      <g opacity={zoneOpacity("A")} {...makeZoneHandler("A")}>
        <line
          x1={eArcEndX} y1={hubTopY + 30}
          x2={aEndX} y2={hubTopY}
          stroke={zoneStroke("A")}
          strokeWidth={zoneStrokeW("A")}
        />
        <text x={eArcEndX + 5} y={hubTopY + 10} fill={ZONE_COLORS.A} fontSize="13" fontWeight="bold">A</text>
        <text x={eArcEndX + 5} y={hubTopY + 22} fill={ZONE_COLORS.A} fontSize="8">chamfer</text>
      </g>

      {/* ===== Surface B: flat land ===== */}
      <g opacity={zoneOpacity("B")} {...makeZoneHandler("B")}>
        <line
          x1={aEndX} y1={hubTopY}
          x2={bEndX} y2={hubTopY}
          stroke={zoneStroke("B")}
          strokeWidth={zoneStrokeW("B")}
        />
        <text x={(aEndX + bEndX) / 2} y={hubTopY - 10} textAnchor="middle" fill={ZONE_COLORS.B} fontSize="13" fontWeight="bold">B</text>
        <text x={(aEndX + bEndX) / 2} y={hubTopY - 24} textAnchor="middle" fill={ZONE_COLORS.B} fontSize="8">flat land</text>
      </g>

      {/* ===== Surface C: chamfer ===== */}
      <g opacity={zoneOpacity("C")} {...makeZoneHandler("C")}>
        <line
          x1={bEndX} y1={hubTopY}
          x2={cEndX} y2={boreTopY}
          stroke={zoneStroke("C")}
          strokeWidth={zoneStrokeW("C")}
        />
        <text x={bEndX + 15} y={hubTopY + 20} fill={ZONE_COLORS.C} fontSize="13" fontWeight="bold">C</text>
        <text x={bEndX + 15} y={hubTopY + 32} fill={ZONE_COLORS.C} fontSize="8">chamfer</text>
      </g>

      {/* ===== Surface D: bore ID ===== */}
      <g opacity={zoneOpacity("D")} {...makeZoneHandler("D")}>
        <line
          x1={dX} y1={boreTopY}
          x2={dX} y2={boreBottomY}
          stroke={zoneStroke("D")}
          strokeWidth={zoneStrokeW("D")}
        />
        <text x={dX + 10} y={(boreTopY + boreBottomY) / 2} fill={ZONE_COLORS.D} fontSize="13" fontWeight="bold">D</text>
        <text x={dX + 10} y={(boreTopY + boreBottomY) / 2 + 14} fill={ZONE_COLORS.D} fontSize="8">bore ID</text>
      </g>

      {/* ±45° shear wave arrows coming from above surfaces */}
      {renderShearArrows(aEndX + 30, hubTopY - 50, hubTopY - 10, "+45")}
      {renderShearArrows(aEndX + 80, hubTopY - 50, hubTopY - 10, "-45")}
      {renderShearArrows(bEndX - 40, hubTopY - 50, hubTopY - 10, "+45")}
      {renderShearArrows(bEndX - 90, hubTopY - 50, hubTopY - 10, "-45")}

      {/* Lower body outline */}
      <line x1={webX - 40} y1={webY + 60} x2={dX + 50} y2={webY + 60} stroke="#1f2937" strokeWidth="1.5" />
      <line x1={dX} y1={boreBottomY} x2={dX + 50} y2={boreBottomY} stroke="#1f2937" strokeWidth="1" strokeDasharray="4,3" />

      {/* Bore offset annotation */}
      <text x={dX + 10} y={boreBottomY + 20} fill="#6b7280" fontSize="9">
        Bore R=2.910″ • Offset=0.943″
      </text>
    </g>
  );
}

// =====================================================================
// Stage 2 — P/N 2A4802 — Surfaces M, N, O, P (upper) + K, L (lower)
// =====================================================================
function renderStage2(
  zoneOpacity: (id: string) => number,
  zoneStroke: (id: string) => string,
  zoneStrokeW: (id: string) => number,
  setHover: (id: string | null) => void,
  onClick?: (id: string) => void,
) {
  const ox = 80;
  const oy = 280;

  // Upper profile: M (large arc) → N (small arc) → O (flat land) → P (bore ID)
  const webY = oy;
  const hubTopY = oy - 140;
  const boreTopY = oy - 110;
  const boreBottomY = oy + 50;

  const webX = ox;
  const mArcEndX = ox + 100;
  const nEndX = ox + 140;
  const oEndX = ox + 280;
  const pX = ox + 310;

  // Lower profile: K (fillet) → L (diagonal)
  const kStartX = ox + 20;
  const kEndX = ox + 80;
  const lEndX = ox + 160;
  const lowerY = oy + 80;
  const kY = oy + 30;

  const makeZoneHandler = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onClick: () => onClick?.(id),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  // Body fill
  const bodyPath = `
    M ${webX - 20} ${webY}
    Q ${webX + 30} ${webY - 80} ${mArcEndX} ${hubTopY + 20}
    Q ${mArcEndX + 15} ${hubTopY} ${nEndX} ${hubTopY}
    L ${oEndX} ${hubTopY}
    L ${pX} ${boreTopY}
    L ${pX} ${boreBottomY}
    L ${pX + 50} ${boreBottomY}
    L ${pX + 50} ${lowerY + 30}
    L ${webX - 40} ${lowerY + 30}
    L ${webX - 40} ${webY}
    Z
  `;

  return (
    <g id="stage2-bore-profile" transform="translate(50, 60)">
      <text x={ox + 120} y={hubTopY - 50} textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">
        Cross-Section — Bore Area
      </text>

      {/* Material body */}
      <path d={bodyPath} fill="url(#v2500-hatch)" stroke="none" />

      {/* Axis of rotation */}
      <line x1={pX + 40} y1={hubTopY - 30} x2={pX + 40} y2={boreBottomY + 30} stroke="#9ca3af" strokeWidth="1" strokeDasharray="8,4" />
      <text x={pX + 45} y={hubTopY - 35} fill="#9ca3af" fontSize="9">Axis of rotation</text>

      {/* 2.6″ coverage */}
      <line x1={pX} y1={webY + 10} x2={pX - 160} y2={webY + 10} stroke="#059669" strokeWidth="1.5" />
      <line x1={pX} y1={webY + 5} x2={pX} y2={webY + 15} stroke="#059669" strokeWidth="1.5" />
      <line x1={pX - 160} y1={webY + 5} x2={pX - 160} y2={webY + 15} stroke="#059669" strokeWidth="1.5" />
      <text x={pX - 80} y={webY + 26} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">2.6″</text>

      {/* ===== Surface M: large arc ===== */}
      <g opacity={zoneOpacity("M")} {...makeZoneHandler("M")}>
        <path
          d={`M ${webX - 20} ${webY} Q ${webX + 30} ${webY - 80} ${mArcEndX} ${hubTopY + 20}`}
          fill="none"
          stroke={zoneStroke("M")}
          strokeWidth={zoneStrokeW("M")}
        />
        <text x={webX - 10} y={webY - 50} fill={ZONE_COLORS.M} fontSize="13" fontWeight="bold">M</text>
        <text x={webX - 10} y={webY - 36} fill={ZONE_COLORS.M} fontSize="8">arc</text>
      </g>

      {/* ===== Surface N: small fillet ===== */}
      <g opacity={zoneOpacity("N")} {...makeZoneHandler("N")}>
        <path
          d={`M ${mArcEndX} ${hubTopY + 20} Q ${mArcEndX + 15} ${hubTopY} ${nEndX} ${hubTopY}`}
          fill="none"
          stroke={zoneStroke("N")}
          strokeWidth={zoneStrokeW("N")}
        />
        <text x={mArcEndX + 5} y={hubTopY + 8} fill={ZONE_COLORS.N} fontSize="13" fontWeight="bold">N</text>
        <text x={mArcEndX + 5} y={hubTopY + 20} fill={ZONE_COLORS.N} fontSize="8">fillet</text>
      </g>

      {/* ===== Surface O: flat land ===== */}
      <g opacity={zoneOpacity("O")} {...makeZoneHandler("O")}>
        <line
          x1={nEndX} y1={hubTopY}
          x2={oEndX} y2={hubTopY}
          stroke={zoneStroke("O")}
          strokeWidth={zoneStrokeW("O")}
        />
        <text x={(nEndX + oEndX) / 2} y={hubTopY - 10} textAnchor="middle" fill={ZONE_COLORS.O} fontSize="13" fontWeight="bold">O</text>
        <text x={(nEndX + oEndX) / 2} y={hubTopY - 24} textAnchor="middle" fill={ZONE_COLORS.O} fontSize="8">flat land</text>
      </g>

      {/* ===== Surface P: bore ID ===== */}
      <g opacity={zoneOpacity("P")} {...makeZoneHandler("P")}>
        <line
          x1={pX} y1={boreTopY}
          x2={pX} y2={boreBottomY}
          stroke={zoneStroke("P")}
          strokeWidth={zoneStrokeW("P")}
        />
        <text x={pX + 10} y={(boreTopY + boreBottomY) / 2} fill={ZONE_COLORS.P} fontSize="13" fontWeight="bold">P</text>
        <text x={pX + 10} y={(boreTopY + boreBottomY) / 2 + 14} fill={ZONE_COLORS.P} fontSize="8">bore ID</text>
      </g>

      {/* ===== Surface K: lower fillet ===== */}
      <g opacity={zoneOpacity("K")} {...makeZoneHandler("K")}>
        <path
          d={`M ${kStartX} ${kY} Q ${kStartX + 20} ${kY + 20} ${kEndX} ${kY + 35}`}
          fill="none"
          stroke={zoneStroke("K")}
          strokeWidth={zoneStrokeW("K")}
        />
        <text x={kStartX - 15} y={kY + 15} fill={ZONE_COLORS.K} fontSize="13" fontWeight="bold">K</text>
        <text x={kStartX - 15} y={kY + 27} fill={ZONE_COLORS.K} fontSize="8">arc</text>
      </g>

      {/* ===== Surface L: diagonal ===== */}
      <g opacity={zoneOpacity("L")} {...makeZoneHandler("L")}>
        <line
          x1={kEndX} y1={kY + 35}
          x2={lEndX} y2={lowerY}
          stroke={zoneStroke("L")}
          strokeWidth={zoneStrokeW("L")}
        />
        <text x={(kEndX + lEndX) / 2 - 15} y={(kY + 35 + lowerY) / 2} fill={ZONE_COLORS.L} fontSize="13" fontWeight="bold">L</text>
        <text x={(kEndX + lEndX) / 2 - 15} y={(kY + 35 + lowerY) / 2 + 14} fill={ZONE_COLORS.L} fontSize="8">diagonal</text>
      </g>

      {/* ±45° shear wave arrows */}
      {renderShearArrows(nEndX + 30, hubTopY - 50, hubTopY - 10, "+45")}
      {renderShearArrows(nEndX + 80, hubTopY - 50, hubTopY - 10, "-45")}
      {renderShearArrows(oEndX - 40, hubTopY - 50, hubTopY - 10, "+45")}
      {renderShearArrows(oEndX - 90, hubTopY - 50, hubTopY - 10, "-45")}

      {/* Lower body outline */}
      <line x1={webX - 40} y1={lowerY + 30} x2={pX + 50} y2={lowerY + 30} stroke="#1f2937" strokeWidth="1.5" />

      {/* Bore offset annotation */}
      <text x={pX + 10} y={boreBottomY + 20} fill="#6b7280" fontSize="9">
        Bore R=2.773″ • Offset=0.898″
      </text>
    </g>
  );
}

// =====================================================================
// Shear wave arrow helper — draws a dashed angled arrow
// =====================================================================
function renderShearArrows(x: number, y1: number, y2: number, mode: "+45" | "-45") {
  const dx = mode === "+45" ? 20 : -20;
  const color = mode === "+45" ? "#dc2626" : "#2563eb";
  const dashArr = mode === "+45" ? "6,3" : "4,4";
  const markerId = mode === "+45" ? "url(#arrow-pos)" : "url(#arrow-neg)";

  return (
    <g opacity={0.7}>
      <line
        x1={x - dx}
        y1={y1}
        x2={x + dx}
        y2={y2}
        stroke={color}
        strokeWidth="1.8"
        strokeDasharray={dashArr}
        markerEnd={markerId}
      />
      <text x={x - dx - 4} y={y1 - 4} fill={color} fontSize="8" textAnchor="middle">
        {mode}°
      </text>
    </g>
  );
}

export default V2500BoreScanDiagram;
