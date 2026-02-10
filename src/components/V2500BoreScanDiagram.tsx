import React, { useState, useMemo } from "react";
import type { PWScanPlan, ScanZone } from "@/rules/pw/pwScanPlans";
import {
  PW_V2500_STAGE1_SCAN_PLAN,
  PW_V2500_STAGE2_SCAN_PLAN,
} from "@/rules/pw/pwScanPlans";

interface V2500BoreScanDiagramProps {
  stage?: 1 | 2;
  highlightedZone?: string | null;
  onZoneClick?: (zoneId: string) => void;
  enabledDirections?: string[];
  directionColors?: Record<string, string>;
}

/** Color palette for scan zones */
const ZONE_COLORS: Record<string, string> = {
  E: "#2563eb", A: "#7c3aed", B: "#059669", C: "#d97706", D: "#dc2626",
  M: "#2563eb", N: "#7c3aed", O: "#059669", P: "#dc2626", K: "#d97706", L: "#ea580c",
};

const ZONE_COLORS_LIGHT: Record<string, string> = {
  E: "#dbeafe", A: "#ede9fe", B: "#d1fae5", C: "#fef3c7", D: "#fee2e2",
  M: "#dbeafe", N: "#ede9fe", O: "#d1fae5", P: "#fee2e2", K: "#fef3c7", L: "#ffedd5",
};

/**
 * V2500BoreScanDiagram
 *
 * Engineering-accurate bore cross-section for V2500 Stage 1 (NDIP-1226) or
 * Stage 2 (NDIP-1227) HPT disks, based on Figure 2 of each document.
 *
 * Shows a full section view with:
 * - Standard 45° section hatching for material body
 * - Accurate bore profile surfaces (E,A,B,C,D or M,N,O,P,K,L)
 * - Dimension annotations with real measurements
 * - ±45° shear wave beam paths
 * - 2.6" radial coverage zone
 */
export const V2500BoreScanDiagram: React.FC<V2500BoreScanDiagramProps> = ({
  stage = 1,
  highlightedZone,
  onZoneClick,
  enabledDirections,
  directionColors,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const plan: PWScanPlan =
    stage === 1 ? PW_V2500_STAGE1_SCAN_PLAN : PW_V2500_STAGE2_SCAN_PLAN;

  const activeZone = hoveredZone ?? highlightedZone ?? null;

  const hoveredInfo: ScanZone | undefined = plan.scanZones.find(
    (z) => z.id === activeZone
  );

  const uid = useMemo(() => `v2500-${stage}-${Math.random().toString(36).slice(2, 8)}`, [stage]);

  const norm = (v: string) => v.trim().toUpperCase();
  const enabled = (enabledDirections ?? []).map(norm).filter(Boolean);
  const enabledSet = new Set(enabled);

  // Beam visibility:
  // Default is to show both beams (each surface is scanned in both modes per NDIP Figure 2).
  // Only hide a beam if the UI explicitly enables a beam/direction flag.
  const hasPosBeamFlag =
    enabledSet.has("E") ||
    enabledSet.has("+45") ||
    enabledSet.has("POSITIVE") ||
    enabledSet.has("POS");
  const hasNegBeamFlag =
    enabledSet.has("D") ||
    enabledSet.has("-45") ||
    enabledSet.has("NEGATIVE") ||
    enabledSet.has("NEG");
  const beamFlagsProvided = hasPosBeamFlag || hasNegBeamFlag;
  const showPos = !beamFlagsProvided || hasPosBeamFlag;
  const showNeg = !beamFlagsProvided || hasNegBeamFlag;

  const posColor =
    directionColors?.E ??
    directionColors?.["+45"] ??
    directionColors?.POS ??
    directionColors?.POSITIVE ??
    "#dc2626";
  const negColor =
    directionColors?.D ??
    directionColors?.["-45"] ??
    directionColors?.NEG ??
    directionColors?.NEGATIVE ??
    "#2563eb";
  const zoneOpacity = (id: string) => (activeZone && activeZone !== id ? 0.35 : 1);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 relative">
      {/* Tooltip */}
      {hoveredInfo && (
        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-[280px] z-10 shadow-lg">
          <div className="font-bold text-sm mb-1">
            Surface {hoveredInfo.id}: {hoveredInfo.surfaceName}
          </div>
          <div className="text-gray-300">{hoveredInfo.description}</div>
          <div className="mt-1 text-gray-400">
            Profile: {hoveredInfo.profileShape.type} — Scan: ±45° circumferential shear
          </div>
        </div>
      )}

      <svg viewBox="0 0 920 740" className="w-full h-auto" style={{ maxHeight: "600px" }}>
        <defs>
          {/* Section hatching - standard 45° engineering pattern */}
          <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="0.6" />
          </pattern>
          {/* Dense hatching for emphasis areas */}
          <pattern id={`hatch-dense-${uid}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="3" stroke="#6b7280" strokeWidth="0.5" />
          </pattern>
          {/* Coverage zone fill */}
          <pattern id={`coverage-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#059669" strokeWidth="0.3" opacity="0.3" />
          </pattern>
          {/* Dimension arrow markers */}
          <marker id={`dim-arrow-${uid}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0,1 8,3 0,5" fill="#374151" />
          </marker>
          <marker id={`dim-arrow-rev-${uid}`} markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
            <polygon points="8,1 0,3 8,5" fill="#374151" />
          </marker>
          {/* Beam arrow markers */}
          <marker id={`beam-pos-${uid}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0,0.5 10,3.5 0,6.5" fill={posColor} />
          </marker>
          <marker id={`beam-neg-${uid}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0,0.5 10,3.5 0,6.5" fill={negColor} />
          </marker>
        </defs>

        {/* Drawing border */}
        <rect x="2" y="2" width="916" height="736" fill="none" stroke="#1f2937" strokeWidth="1.5" />
        <rect x="6" y="6" width="908" height="728" fill="#fafafa" stroke="#d1d5db" strokeWidth="0.5" />

        {/* Title block */}
        <rect x="6" y="6" width="908" height="56" fill="#f8fafc" stroke="#d1d5db" strokeWidth="0.5" />
        <text x="20" y="30" fill="#111827" fontSize="15" fontWeight="bold" fontFamily="monospace">
          FIGURE 2 — BORE SCAN PLAN
        </text>
        <text x="20" y="50" fill="#374151" fontSize="11" fontFamily="monospace">
          {plan.ndipReference} • {plan.description} • PN {plan.partNumber}
        </text>
        <text x="890" y="30" textAnchor="end" fill="#6b7280" fontSize="10" fontFamily="monospace">
          SECTION VIEW A-A
        </text>
        <text x="890" y="48" textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">
          Scale: NOT TO SCALE
        </text>

        {/* Main cross-section */}
        <g transform="translate(70, 80)">
          {stage === 1
            ? renderStage1Section(uid, plan, zoneOpacity, setHoveredZone, onZoneClick, activeZone, { showPos, showNeg, posColor, negColor })
            : renderStage2Section(uid, zoneOpacity, setHoveredZone, onZoneClick, activeZone, { showPos, showNeg, posColor, negColor })}
        </g>

        {/* Legend bar */}
        {renderLegend(uid, plan, stage, { showPos, showNeg, posColor, negColor })}
      </svg>
    </div>
  );
};

// =====================================================================
// Stage 1 — NDIP-1226 — P/N 2A5001 — Surfaces E, A, B, C, D
// Full section view of bore area
// =====================================================================
function renderStage1Section(
  uid: string,
  plan: PWScanPlan,
  zoneOpacity: (id: string) => number,
  setHover: (id: string | null) => void,
  onClick?: (id: string) => void,
  activeZone?: string | null,
  beam?: { showPos: boolean; showNeg: boolean; posColor: string; negColor: string },
) {
  // --- Coordinate system ---
  // The section shows the bore area looking from the side (axial section cut).
  // LEFT  = radially outward (web direction)
  // RIGHT = radially inward (toward axis of rotation)
  // The bore cavity is the open space between upper and lower profiles.
  const cy = 270; // vertical center (axis of symmetry for upper/lower bore)

  // Upper bore profile (inner surface) — E → A → B → C → D
  // These coordinates define the machined bore surface
  const E_start = { x: 40, y: cy - 55 };    // web transition start
  const E_ctrl1 = { x: 55, y: cy - 90 };    // bezier control
  const E_ctrl2 = { x: 80, y: cy - 135 };   // bezier control
  const E_end   = { x: 120, y: cy - 152 };  // end of arc / start of A

  const A_end   = { x: 170, y: cy - 168 };  // end of chamfer A / start of B

  const B_end   = { x: 430, y: cy - 168 };  // end of flat land B / start of C

  const C_end   = { x: 470, y: cy - 132 };  // end of chamfer C / start of D

  const D_top   = { x: 470, y: cy - 132 };  // bore wall top
  const D_bot   = { x: 470, y: cy };         // bore wall at centerline

  // Lower bore profile (mirror of upper about cy)
  const mirror = (p: {x: number; y: number}) => ({ x: p.x, y: 2 * cy - p.y });
  const E_start_m = mirror(E_start);
  const E_ctrl1_m = mirror(E_ctrl1);
  const E_ctrl2_m = mirror(E_ctrl2);
  const E_end_m = mirror(E_end);
  const A_end_m = mirror(A_end);
  const B_end_m = mirror(B_end);
  const C_end_m = mirror(C_end);
  const D_top_m = mirror(D_top);

  // Hub outer surface (the outer contour of the material body)
  const hubTop = 42;
  const hubBot = 2 * cy - hubTop;
  const hubLeft = 0;
  const hubRight = 530;

  // Web extensions (thin web connecting hub to rim, extends to the left)
  const webThick = 38; // web half-thickness in px
  const webLeft = -60;

  // --- Paths ---

  // Material body path (outer contour + bore cavity hole, even-odd fill)
  // Outer contour (clockwise): hub rectangle + web stubs
  const outerPath = `
    M ${hubLeft} ${hubTop}
    L ${hubRight} ${hubTop}
    L ${hubRight} ${hubBot}
    L ${hubLeft} ${hubBot}
    L ${hubLeft} ${cy + webThick}
    L ${webLeft} ${cy + webThick}
    L ${webLeft} ${cy - webThick}
    L ${hubLeft} ${cy - webThick}
    Z
  `;

  // Bore cavity (counterclockwise, as a hole in the material)
  const cavityPath = `
    M ${D_bot.x} ${D_bot.y}
    L ${D_top.x} ${D_top.y}
    L ${C_end.x} ${C_end.y}
    L ${B_end.x} ${B_end.y}
    L ${A_end.x} ${A_end.y}
    L ${E_end.x} ${E_end.y}
    C ${E_ctrl2.x} ${E_ctrl2.y} ${E_ctrl1.x} ${E_ctrl1.y} ${E_start.x} ${E_start.y}
    L ${E_start.x} ${cy}
    L ${E_start_m.x} ${E_start_m.y}
    C ${E_ctrl1_m.x} ${E_ctrl1_m.y} ${E_ctrl2_m.x} ${E_ctrl2_m.y} ${E_end_m.x} ${E_end_m.y}
    L ${A_end_m.x} ${A_end_m.y}
    L ${B_end_m.x} ${B_end_m.y}
    L ${C_end_m.x} ${C_end_m.y}
    L ${D_top_m.x} ${D_top_m.y}
    Z
  `;

  // Bore cavity extends to the right (toward axis) — show the open bore space
  const boreCavityRight = `
    M ${D_top.x} ${D_top.y}
    L ${hubRight} ${D_top.y}
    L ${hubRight} ${D_top_m.y}
    L ${D_top_m.x} ${D_top_m.y}
    L ${D_top_m.x} ${D_bot.y}
    L ${D_top.x} ${D_bot.y}
    Z
  `;

  const makeZoneHandler = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onClick: () => onClick?.(id),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  return (
    <g id="stage1-section">
      {/* Sub-title */}
      <text x="260" y="15" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold" fontFamily="monospace">
        BORE AREA — UPPER &amp; LOWER HALF SECTION
      </text>

      <g transform="translate(60, 25)">
        {/* Material body with section hatching */}
        <path d={outerPath + " " + cavityPath + " " + boreCavityRight} fill={`url(#hatch-${uid})`} fillRule="evenodd" stroke="none" />

        {/* Material outline (thick visible edges) */}
        {/* Hub outer rectangle */}
        <line x1={hubLeft} y1={hubTop} x2={hubRight} y2={hubTop} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={hubTop} x2={hubRight} y2={D_top.y} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={D_top_m.y} x2={hubRight} y2={hubBot} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={hubBot} x2={hubLeft} y2={hubBot} stroke="#111827" strokeWidth="2" />
        <line x1={hubLeft} y1={hubBot} x2={hubLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />
        <line x1={hubLeft} y1={cy - webThick} x2={hubLeft} y2={hubTop} stroke="#111827" strokeWidth="2" />

        {/* Web stubs */}
        <line x1={hubLeft} y1={cy - webThick} x2={webLeft} y2={cy - webThick} stroke="#111827" strokeWidth="2" />
        <line x1={webLeft} y1={cy - webThick} x2={webLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />
        <line x1={webLeft} y1={cy + webThick} x2={hubLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />

        {/* Web label */}
        <text x={webLeft + 5} y={cy + 4} fill="#6b7280" fontSize="8" fontFamily="monospace">WEB</text>

        {/* Bore cavity area (white fill to clear hatching) */}
        <path d={cavityPath} fill="white" stroke="none" />
        <path d={boreCavityRight} fill="white" stroke="none" />

        {/* Bore cavity label */}
        <text x={D_top.x + 20} y={cy} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">
          BORE
        </text>
        <text x={D_top.x + 20} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
          CAVITY
        </text>

        {/* Axis of rotation (center-dot-dash line) */}
        <line x1={webLeft - 20} y1={cy} x2={hubRight + 30} y2={cy}
          stroke="#6b7280" strokeWidth="0.8" strokeDasharray="20,4,4,4" />
        <text x={hubRight + 35} y={cy + 4} fill="#6b7280" fontSize="8" fontFamily="monospace">
          ℄ AXIS
        </text>

        {/* ===== BORE PROFILE SURFACES (upper half) ===== */}

        {/* Surface E: arc/fillet from web to hub */}
        <g opacity={zoneOpacity("E")} {...makeZoneHandler("E")}>
          <path
            d={`M ${E_start.x} ${E_start.y} C ${E_ctrl1.x} ${E_ctrl1.y} ${E_ctrl2.x} ${E_ctrl2.y} ${E_end.x} ${E_end.y}`}
            fill="none" stroke={ZONE_COLORS.E} strokeWidth={activeZone === "E" ? 5 : 3.5}
          />
          {/* Surface highlight */}
          <path
            d={`M ${E_start.x} ${E_start.y} C ${E_ctrl1.x} ${E_ctrl1.y} ${E_ctrl2.x} ${E_ctrl2.y} ${E_end.x} ${E_end.y}`}
            fill="none" stroke={ZONE_COLORS_LIGHT.E} strokeWidth="12" opacity="0.4"
          />
          <circle cx={80} cy={cy - 120} r="14" fill={ZONE_COLORS_LIGHT.E} stroke={ZONE_COLORS.E} strokeWidth="1.5" />
          <text x={80} y={cy - 116} textAnchor="middle" fill={ZONE_COLORS.E} fontSize="12" fontWeight="bold">E</text>
          <text x={80} y={cy - 138} textAnchor="middle" fill={ZONE_COLORS.E} fontSize="7" fontFamily="monospace">ARC</text>
        </g>

        {/* Surface A: chamfer */}
        <g opacity={zoneOpacity("A")} {...makeZoneHandler("A")}>
          <line x1={E_end.x} y1={E_end.y} x2={A_end.x} y2={A_end.y}
            stroke={ZONE_COLORS.A} strokeWidth={activeZone === "A" ? 5 : 3.5} />
          <line x1={E_end.x} y1={E_end.y} x2={A_end.x} y2={A_end.y}
            stroke={ZONE_COLORS_LIGHT.A} strokeWidth="12" opacity="0.4" />
          <circle cx={145} cy={cy - 178} r="14" fill={ZONE_COLORS_LIGHT.A} stroke={ZONE_COLORS.A} strokeWidth="1.5" />
          <text x={145} y={cy - 174} textAnchor="middle" fill={ZONE_COLORS.A} fontSize="12" fontWeight="bold">A</text>
          <text x={145} y={cy - 192} textAnchor="middle" fill={ZONE_COLORS.A} fontSize="7" fontFamily="monospace">CHAMFER</text>
        </g>

        {/* Surface B: flat land */}
        <g opacity={zoneOpacity("B")} {...makeZoneHandler("B")}>
          <line x1={A_end.x} y1={A_end.y} x2={B_end.x} y2={B_end.y}
            stroke={ZONE_COLORS.B} strokeWidth={activeZone === "B" ? 5 : 3.5} />
          <line x1={A_end.x} y1={A_end.y} x2={B_end.x} y2={B_end.y}
            stroke={ZONE_COLORS_LIGHT.B} strokeWidth="12" opacity="0.4" />
          <circle cx={300} cy={cy - 195} r="14" fill={ZONE_COLORS_LIGHT.B} stroke={ZONE_COLORS.B} strokeWidth="1.5" />
          <text x={300} y={cy - 191} textAnchor="middle" fill={ZONE_COLORS.B} fontSize="12" fontWeight="bold">B</text>
          <text x={300} y={cy - 209} textAnchor="middle" fill={ZONE_COLORS.B} fontSize="7" fontFamily="monospace">LAND</text>
        </g>

        {/* Surface C: chamfer to bore */}
        <g opacity={zoneOpacity("C")} {...makeZoneHandler("C")}>
          <line x1={B_end.x} y1={B_end.y} x2={C_end.x} y2={C_end.y}
            stroke={ZONE_COLORS.C} strokeWidth={activeZone === "C" ? 5 : 3.5} />
          <line x1={B_end.x} y1={B_end.y} x2={C_end.x} y2={C_end.y}
            stroke={ZONE_COLORS_LIGHT.C} strokeWidth="12" opacity="0.4" />
          <circle cx={450} cy={cy - 168} r="14" fill={ZONE_COLORS_LIGHT.C} stroke={ZONE_COLORS.C} strokeWidth="1.5" />
          <text x={450} y={cy - 164} textAnchor="middle" fill={ZONE_COLORS.C} fontSize="12" fontWeight="bold">C</text>
          <text x={450} y={cy - 182} textAnchor="middle" fill={ZONE_COLORS.C} fontSize="7" fontFamily="monospace">CHAMFER</text>
        </g>

        {/* Surface D: bore ID wall */}
        <g opacity={zoneOpacity("D")} {...makeZoneHandler("D")}>
          <line x1={D_top.x} y1={D_top.y} x2={D_bot.x} y2={D_bot.y}
            stroke={ZONE_COLORS.D} strokeWidth={activeZone === "D" ? 5 : 3.5} />
          <line x1={D_top.x} y1={D_top.y} x2={D_bot.x} y2={D_bot.y}
            stroke={ZONE_COLORS_LIGHT.D} strokeWidth="12" opacity="0.4" />
          <circle cx={D_top.x + 28} cy={(D_top.y + D_bot.y) / 2} r="14"
            fill={ZONE_COLORS_LIGHT.D} stroke={ZONE_COLORS.D} strokeWidth="1.5" />
          <text x={D_top.x + 28} y={(D_top.y + D_bot.y) / 2 + 4} textAnchor="middle"
            fill={ZONE_COLORS.D} fontSize="12" fontWeight="bold">D</text>
          <text x={D_top.x + 28} y={(D_top.y + D_bot.y) / 2 - 18} textAnchor="middle"
            fill={ZONE_COLORS.D} fontSize="7" fontFamily="monospace">BORE ID</text>
        </g>

        {/* ===== BORE PROFILE SURFACES (lower half — mirror) ===== */}

        {/* Surface E' (mirror) */}
        <g opacity={zoneOpacity("E")}>
          <path
            d={`M ${E_start_m.x} ${E_start_m.y} C ${E_ctrl1_m.x} ${E_ctrl1_m.y} ${E_ctrl2_m.x} ${E_ctrl2_m.y} ${E_end_m.x} ${E_end_m.y}`}
            fill="none" stroke={ZONE_COLORS.E} strokeWidth="3" strokeDasharray="6,3"
          />
        </g>
        {/* Surface A' */}
        <g opacity={zoneOpacity("A")}>
          <line x1={E_end_m.x} y1={E_end_m.y} x2={A_end_m.x} y2={A_end_m.y}
            stroke={ZONE_COLORS.A} strokeWidth="3" strokeDasharray="6,3" />
        </g>
        {/* Surface B' */}
        <g opacity={zoneOpacity("B")}>
          <line x1={A_end_m.x} y1={A_end_m.y} x2={B_end_m.x} y2={B_end_m.y}
            stroke={ZONE_COLORS.B} strokeWidth="3" strokeDasharray="6,3" />
        </g>
        {/* Surface C' */}
        <g opacity={zoneOpacity("C")}>
          <line x1={B_end_m.x} y1={B_end_m.y} x2={C_end_m.x} y2={C_end_m.y}
            stroke={ZONE_COLORS.C} strokeWidth="3" strokeDasharray="6,3" />
        </g>
        {/* Surface D' */}
        <g opacity={zoneOpacity("D")}>
          <line x1={D_top_m.x} y1={D_top_m.y} x2={D_bot.x} y2={D_bot.y}
            stroke={ZONE_COLORS.D} strokeWidth="3" strokeDasharray="6,3" />
        </g>

        {/* Lower profile outline (solid thin line) */}
        <path
          d={`
            M ${E_start_m.x} ${E_start_m.y}
            C ${E_ctrl1_m.x} ${E_ctrl1_m.y} ${E_ctrl2_m.x} ${E_ctrl2_m.y} ${E_end_m.x} ${E_end_m.y}
            L ${A_end_m.x} ${A_end_m.y}
            L ${B_end_m.x} ${B_end_m.y}
            L ${C_end_m.x} ${C_end_m.y}
            L ${D_top_m.x} ${D_top_m.y}
          `}
          fill="none" stroke="#374151" strokeWidth="1.5"
        />

        {/* Bore wall right edge (connecting D top to D' bottom through axis area) */}
        <line x1={hubRight} y1={D_top.y} x2={hubRight} y2={D_top_m.y}
          stroke="#111827" strokeWidth="2" />

        {/* ===== BEAM PATH VISUALIZATION ===== */}
        {renderBeamPaths(uid, A_end, B_end, C_end, D_top, D_bot, cy, beam)}

        {/* ===== DIMENSION ANNOTATIONS ===== */}
        {renderDimensions(uid, plan, E_start, D_top, D_bot, A_end, B_end, cy, hubTop, hubBot, hubRight, webLeft)}

        {/* ===== COVERAGE ZONE ===== */}
        {renderCoverageZone(uid, E_start, D_top, cy, A_end)}

        {/* Material label */}
        <text x={130} y={hubTop + 25} fill="#6b7280" fontSize="8" fontFamily="monospace">
          POWDERED NICKEL ALLOY
        </text>

        {/* HUB label */}
        <text x={250} y={hubTop + 25} fill="#374151" fontSize="9" fontWeight="bold" fontFamily="monospace">
          HUB
        </text>
      </g>
    </g>
  );
}

// =====================================================================
// Stage 2 — NDIP-1227 — P/N 2A4802 — Surfaces M, N, O, P (upper) + K, L (lower)
// =====================================================================
function renderStage2Section(
  uid: string,
  zoneOpacity: (id: string) => number,
  setHover: (id: string | null) => void,
  onClick?: (id: string) => void,
  activeZone?: string | null,
  beam?: { showPos: boolean; showNeg: boolean; posColor: string; negColor: string },
) {
  const cy = 270;

  // Upper bore profile — M (large arc) → N (small fillet) → O (flat land) → P (bore ID)
  // Proportions corrected to match NDIP-1227 Figure 2 accurately
  const M_start = { x: 30, y: cy - 50 };
  const M_ctrl1 = { x: 55, y: cy - 95 };
  const M_ctrl2 = { x: 100, y: cy - 145 };
  const M_end   = { x: 150, y: cy - 165 };

  const N_ctrl  = { x: 175, y: cy - 185 };
  const N_end   = { x: 205, y: cy - 190 };

  const O_end   = { x: 295, y: cy - 190 };

  const P_top   = { x: 320, y: cy - 190 }; // bore wall starts at land level (no chamfer on Stage 2)
  const P_bot   = { x: 320, y: cy };

  // Lower bore profile — K (fillet) → L (diagonal) — asymmetric from upper
  const K_start = { x: 30, y: cy + 50 };
  const K_ctrl1 = { x: 55, y: cy + 95 };
  const K_ctrl2 = { x: 85, y: cy + 125 };
  const K_end   = { x: 130, y: cy + 150 };

  const L_end   = { x: 225, y: cy + 200 };

  // Lower bore continues with flat/bore wall area (not labeled in NDIP but closes the section)
  const LowerFlat_end = { x: 295, y: cy + 200 };
  const P_bot_m = { x: 320, y: cy + 200 };

  // Hub dimensions
  const hubTop = 38;
  const hubBot = 2 * cy - hubTop;
  const hubLeft = 0;
  const hubRight = 520;
  const webThick = 36;
  const webLeft = -55;

  // Outer contour
  const outerPath = `
    M ${hubLeft} ${hubTop}
    L ${hubRight} ${hubTop}
    L ${hubRight} ${hubBot}
    L ${hubLeft} ${hubBot}
    L ${hubLeft} ${cy + webThick}
    L ${webLeft} ${cy + webThick}
    L ${webLeft} ${cy - webThick}
    L ${hubLeft} ${cy - webThick}
    Z
  `;

  // Bore cavity (counterclockwise)
  const cavityPath = `
    M ${P_bot.x} ${P_bot.y}
    L ${P_top.x} ${P_top.y}
    L ${O_end.x} ${O_end.y}
    L ${N_end.x} ${N_end.y}
    Q ${N_ctrl.x} ${N_ctrl.y} ${M_end.x} ${M_end.y}
    C ${M_ctrl2.x} ${M_ctrl2.y} ${M_ctrl1.x} ${M_ctrl1.y} ${M_start.x} ${M_start.y}
    L ${M_start.x} ${cy}
    L ${K_start.x} ${K_start.y}
    C ${K_ctrl1.x} ${K_ctrl1.y} ${K_ctrl2.x} ${K_ctrl2.y} ${K_end.x} ${K_end.y}
    L ${L_end.x} ${L_end.y}
    L ${LowerFlat_end.x} ${LowerFlat_end.y}
    L ${P_bot_m.x} ${P_bot_m.y}
    Z
  `;

  const boreCavityRight = `
    M ${P_top.x} ${P_top.y}
    L ${hubRight} ${P_top.y}
    L ${hubRight} ${P_bot_m.y}
    L ${P_bot_m.x} ${P_bot_m.y}
    L ${P_bot_m.x} ${P_bot.y}
    L ${P_top.x} ${P_bot.y}
    Z
  `;

  const makeZoneHandler = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onClick: () => onClick?.(id),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  return (
    <g id="stage2-section">
      <text x="260" y="15" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold" fontFamily="monospace">
        BORE AREA — ASYMMETRIC SECTION (UPPER: M,N,O,P • LOWER: K,L)
      </text>

      <g transform="translate(60, 25)">
        {/* Material body */}
        <path d={outerPath + " " + cavityPath + " " + boreCavityRight} fill={`url(#hatch-${uid})`} fillRule="evenodd" stroke="none" />

        {/* Hub outline */}
        <line x1={hubLeft} y1={hubTop} x2={hubRight} y2={hubTop} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={hubTop} x2={hubRight} y2={P_top.y} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={P_bot_m.y} x2={hubRight} y2={hubBot} stroke="#111827" strokeWidth="2" />
        <line x1={hubRight} y1={hubBot} x2={hubLeft} y2={hubBot} stroke="#111827" strokeWidth="2" />
        <line x1={hubLeft} y1={hubBot} x2={hubLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />
        <line x1={hubLeft} y1={cy - webThick} x2={hubLeft} y2={hubTop} stroke="#111827" strokeWidth="2" />

        {/* Web stubs */}
        <line x1={hubLeft} y1={cy - webThick} x2={webLeft} y2={cy - webThick} stroke="#111827" strokeWidth="2" />
        <line x1={webLeft} y1={cy - webThick} x2={webLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />
        <line x1={webLeft} y1={cy + webThick} x2={hubLeft} y2={cy + webThick} stroke="#111827" strokeWidth="2" />
        <text x={webLeft + 5} y={cy + 4} fill="#6b7280" fontSize="8" fontFamily="monospace">WEB</text>

        {/* Clear bore cavity */}
        <path d={cavityPath} fill="white" stroke="none" />
        <path d={boreCavityRight} fill="white" stroke="none" />

        <text x={P_top.x + 20} y={cy} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace">BORE</text>
        <text x={P_top.x + 20} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">CAVITY</text>

        {/* Axis of rotation */}
        <line x1={webLeft - 20} y1={cy} x2={hubRight + 30} y2={cy}
          stroke="#6b7280" strokeWidth="0.8" strokeDasharray="20,4,4,4" />
        <text x={hubRight + 35} y={cy + 4} fill="#6b7280" fontSize="8" fontFamily="monospace">℄ AXIS</text>

        {/* Bore wall right edge */}
        <line x1={hubRight} y1={P_top.y} x2={hubRight} y2={P_bot_m.y} stroke="#111827" strokeWidth="2" />

        {/* ===== UPPER SURFACES: M, N, O, P ===== */}

        {/* Surface M: large arc */}
        <g opacity={zoneOpacity("M")} {...makeZoneHandler("M")}>
          <path
            d={`M ${M_start.x} ${M_start.y} C ${M_ctrl1.x} ${M_ctrl1.y} ${M_ctrl2.x} ${M_ctrl2.y} ${M_end.x} ${M_end.y}`}
            fill="none" stroke={ZONE_COLORS.M} strokeWidth={activeZone === "M" ? 5 : 3.5}
          />
          <path d={`M ${M_start.x} ${M_start.y} C ${M_ctrl1.x} ${M_ctrl1.y} ${M_ctrl2.x} ${M_ctrl2.y} ${M_end.x} ${M_end.y}`}
            fill="none" stroke={ZONE_COLORS_LIGHT.M} strokeWidth="12" opacity="0.4" />
          <circle cx={85} cy={cy - 125} r="14" fill={ZONE_COLORS_LIGHT.M} stroke={ZONE_COLORS.M} strokeWidth="1.5" />
          <text x={85} y={cy - 121} textAnchor="middle" fill={ZONE_COLORS.M} fontSize="12" fontWeight="bold">M</text>
          <text x={85} y={cy - 142} textAnchor="middle" fill={ZONE_COLORS.M} fontSize="7" fontFamily="monospace">ARC</text>
        </g>

        {/* Surface N: small fillet */}
        <g opacity={zoneOpacity("N")} {...makeZoneHandler("N")}>
          <path
            d={`M ${M_end.x} ${M_end.y} Q ${N_ctrl.x} ${N_ctrl.y} ${N_end.x} ${N_end.y}`}
            fill="none" stroke={ZONE_COLORS.N} strokeWidth={activeZone === "N" ? 5 : 3.5}
          />
          <path d={`M ${M_end.x} ${M_end.y} Q ${N_ctrl.x} ${N_ctrl.y} ${N_end.x} ${N_end.y}`}
            fill="none" stroke={ZONE_COLORS_LIGHT.N} strokeWidth="12" opacity="0.4" />
          <circle cx={178} cy={cy - 205} r="14" fill={ZONE_COLORS_LIGHT.N} stroke={ZONE_COLORS.N} strokeWidth="1.5" />
          <text x={178} y={cy - 201} textAnchor="middle" fill={ZONE_COLORS.N} fontSize="12" fontWeight="bold">N</text>
          <text x={178} y={cy - 220} textAnchor="middle" fill={ZONE_COLORS.N} fontSize="7" fontFamily="monospace">FILLET</text>
        </g>

        {/* Surface O: flat land */}
        <g opacity={zoneOpacity("O")} {...makeZoneHandler("O")}>
          <line x1={N_end.x} y1={N_end.y} x2={O_end.x} y2={O_end.y}
            stroke={ZONE_COLORS.O} strokeWidth={activeZone === "O" ? 5 : 3.5} />
          <line x1={N_end.x} y1={N_end.y} x2={O_end.x} y2={O_end.y}
            stroke={ZONE_COLORS_LIGHT.O} strokeWidth="12" opacity="0.4" />
          <circle cx={250} cy={cy - 215} r="14" fill={ZONE_COLORS_LIGHT.O} stroke={ZONE_COLORS.O} strokeWidth="1.5" />
          <text x={250} y={cy - 211} textAnchor="middle" fill={ZONE_COLORS.O} fontSize="12" fontWeight="bold">O</text>
          <text x={250} y={cy - 229} textAnchor="middle" fill={ZONE_COLORS.O} fontSize="7" fontFamily="monospace">LAND</text>
        </g>

        {/* Surface P: bore ID */}
        <g opacity={zoneOpacity("P")} {...makeZoneHandler("P")}>
          <line x1={P_top.x} y1={P_top.y} x2={P_bot.x} y2={P_bot.y}
            stroke={ZONE_COLORS.P} strokeWidth={activeZone === "P" ? 5 : 3.5} />
          <line x1={P_top.x} y1={P_top.y} x2={P_bot.x} y2={P_bot.y}
            stroke={ZONE_COLORS_LIGHT.P} strokeWidth="12" opacity="0.4" />
          <circle cx={P_top.x + 28} cy={(P_top.y + P_bot.y) / 2} r="14"
            fill={ZONE_COLORS_LIGHT.P} stroke={ZONE_COLORS.P} strokeWidth="1.5" />
          <text x={P_top.x + 28} y={(P_top.y + P_bot.y) / 2 + 4} textAnchor="middle"
            fill={ZONE_COLORS.P} fontSize="12" fontWeight="bold">P</text>
          <text x={P_top.x + 28} y={(P_top.y + P_bot.y) / 2 - 18} textAnchor="middle"
            fill={ZONE_COLORS.P} fontSize="7" fontFamily="monospace">BORE ID</text>
        </g>

        {/* ===== LOWER SURFACES: K, L ===== */}

        {/* Surface K: lower fillet */}
        <g opacity={zoneOpacity("K")} {...makeZoneHandler("K")}>
          <path
            d={`M ${K_start.x} ${K_start.y} C ${K_ctrl1.x} ${K_ctrl1.y} ${K_ctrl2.x} ${K_ctrl2.y} ${K_end.x} ${K_end.y}`}
            fill="none" stroke={ZONE_COLORS.K} strokeWidth={activeZone === "K" ? 5 : 3.5}
          />
          <path d={`M ${K_start.x} ${K_start.y} C ${K_ctrl1.x} ${K_ctrl1.y} ${K_ctrl2.x} ${K_ctrl2.y} ${K_end.x} ${K_end.y}`}
            fill="none" stroke={ZONE_COLORS_LIGHT.K} strokeWidth="12" opacity="0.4" />
          <circle cx={70} cy={cy + 115} r="14" fill={ZONE_COLORS_LIGHT.K} stroke={ZONE_COLORS.K} strokeWidth="1.5" />
          <text x={70} y={cy + 119} textAnchor="middle" fill={ZONE_COLORS.K} fontSize="12" fontWeight="bold">K</text>
          <text x={70} y={cy + 135} textAnchor="middle" fill={ZONE_COLORS.K} fontSize="7" fontFamily="monospace">FILLET</text>
        </g>

        {/* Surface L: diagonal slope */}
        <g opacity={zoneOpacity("L")} {...makeZoneHandler("L")}>
          <line x1={K_end.x} y1={K_end.y} x2={L_end.x} y2={L_end.y}
            stroke={ZONE_COLORS.L} strokeWidth={activeZone === "L" ? 5 : 3.5} />
          <line x1={K_end.x} y1={K_end.y} x2={L_end.x} y2={L_end.y}
            stroke={ZONE_COLORS_LIGHT.L} strokeWidth="12" opacity="0.4" />
          <circle cx={175} cy={cy + 180} r="14" fill={ZONE_COLORS_LIGHT.L} stroke={ZONE_COLORS.L} strokeWidth="1.5" />
          <text x={175} y={cy + 184} textAnchor="middle" fill={ZONE_COLORS.L} fontSize="12" fontWeight="bold">L</text>
          <text x={175} y={cy + 200} textAnchor="middle" fill={ZONE_COLORS.L} fontSize="7" fontFamily="monospace">SLOPE</text>
        </g>

        {/* Lower profile outline (unlabeled portion from L to P) */}
        <path
          d={`M ${L_end.x} ${L_end.y} L ${LowerFlat_end.x} ${LowerFlat_end.y} L ${P_bot_m.x} ${P_bot_m.y}`}
          fill="none" stroke="#374151" strokeWidth="1.5" />

        {/* Lower bore wall */}
        <line x1={P_bot_m.x} y1={P_bot_m.y} x2={P_bot.x} y2={P_bot.y}
          stroke={ZONE_COLORS.P} strokeWidth="3" strokeDasharray="6,3" />

        {/* ===== BEAM PATHS ===== */}
        {renderBeamPathsStage2(uid, N_end, O_end, P_top, P_bot, cy, beam)}

        {/* ===== DIMENSIONS ===== */}
        {renderDimensionsStage2(uid, cy, hubTop, hubBot, hubRight, webLeft, M_start, P_top, P_bot, N_end)}

        {/* Material label */}
        <text x={130} y={hubTop + 22} fill="#6b7280" fontSize="8" fontFamily="monospace">POWDERED NICKEL ALLOY</text>
        <text x={250} y={hubTop + 22} fill="#374151" fontSize="9" fontWeight="bold" fontFamily="monospace">HUB</text>
      </g>
    </g>
  );
}

// =====================================================================
// Beam path visualization for Stage 1
// =====================================================================
function renderBeamPaths(
  uid: string,
  A_end: {x: number; y: number},
  B_end: {x: number; y: number},
  C_end: {x: number; y: number},
  D_top: {x: number; y: number},
  D_bot: {x: number; y: number},
  cy: number,
  beam?: { showPos: boolean; showNeg: boolean; posColor: string; negColor: string },
) {
  // Show ±45° shear wave beam paths entering through the bore surface
  // The beam enters from the water (bore cavity side) and refracts into the material
  const beamLen = 70;
  const midB = (A_end.x + B_end.x) / 2;

  const showPos = beam?.showPos ?? true;
  const showNeg = beam?.showNeg ?? true;
  const posColor = beam?.posColor ?? "#dc2626";
  const negColor = beam?.negColor ?? "#2563eb";

  return (
    <g id="beam-paths" opacity={0.7}>
      {/* +45° beam entering land B surface */}
      <line
        x1={midB} y1={A_end.y - 55}
        x2={midB + beamLen * Math.sin(Math.PI/4)} y2={A_end.y - 55 + beamLen * Math.cos(Math.PI/4)}
        stroke={posColor} strokeWidth="2" strokeDasharray="6,3" opacity={showPos ? 1 : 0}
        markerEnd={`url(#beam-pos-${uid})`}
      />
      <text x={midB - 8} y={A_end.y - 60} fill={posColor} fontSize="8" fontWeight="bold" opacity={showPos ? 1 : 0}>+45°</text>

      {/* -45° beam entering land B surface */}
      <line
        x1={midB + 60} y1={A_end.y - 55}
        x2={midB + 60 - beamLen * Math.sin(Math.PI/4)} y2={A_end.y - 55 + beamLen * Math.cos(Math.PI/4)}
        stroke={negColor} strokeWidth="2" strokeDasharray="6,3" opacity={showNeg ? 1 : 0}
        markerEnd={`url(#beam-neg-${uid})`}
      />
      <text x={midB + 68} y={A_end.y - 60} fill={negColor} fontSize="8" fontWeight="bold" opacity={showNeg ? 1 : 0}>−45°</text>

      {/* Beam entering bore wall D */}
      <line
        x1={D_top.x + 50} y1={(D_top.y + cy) / 2 - 15}
        x2={D_top.x + 5} y2={(D_top.y + cy) / 2 - 15 + 40}
        stroke={posColor} strokeWidth="1.8" strokeDasharray="5,3" opacity={showPos ? 1 : 0}
        markerEnd={`url(#beam-pos-${uid})`}
      />
      <line
        x1={D_top.x + 50} y1={(D_top.y + cy) / 2 + 15}
        x2={D_top.x + 5} y2={(D_top.y + cy) / 2 + 15 - 40}
        stroke={negColor} strokeWidth="1.8" strokeDasharray="5,3" opacity={showNeg ? 1 : 0}
        markerEnd={`url(#beam-neg-${uid})`}
      />

      {/* Water path indicator */}
      <text x={D_top.x + 55} y={(D_top.y + cy) / 2 - 2} fill="#0ea5e9" fontSize="7"
        fontFamily="monospace" textAnchor="start" opacity={showPos || showNeg ? 1 : 0}>
        WATER
      </text>
      <text x={D_top.x + 55} y={(D_top.y + cy) / 2 + 10} fill="#0ea5e9" fontSize="7"
        fontFamily="monospace" textAnchor="start" opacity={showPos || showNeg ? 1 : 0}>
        8.0″
      </text>
    </g>
  );
}

// =====================================================================
// Beam path visualization for Stage 2
// =====================================================================
function renderBeamPathsStage2(
  uid: string,
  N_end: {x: number; y: number},
  O_end: {x: number; y: number},
  P_top: {x: number; y: number},
  P_bot: {x: number; y: number},
  cy: number,
  beam?: { showPos: boolean; showNeg: boolean; posColor: string; negColor: string },
) {
  const beamLen = 65;
  const midO = (N_end.x + O_end.x) / 2;

  const showPos = beam?.showPos ?? true;
  const showNeg = beam?.showNeg ?? true;
  const posColor = beam?.posColor ?? "#dc2626";
  const negColor = beam?.negColor ?? "#2563eb";

  return (
    <g id="beam-paths-s2" opacity={0.7}>
      <line
        x1={midO} y1={N_end.y - 55}
        x2={midO + beamLen * Math.sin(Math.PI/4)} y2={N_end.y - 55 + beamLen * Math.cos(Math.PI/4)}
        stroke={posColor} strokeWidth="2" strokeDasharray="6,3" opacity={showPos ? 1 : 0}
        markerEnd={`url(#beam-pos-${uid})`}
      />
      <text x={midO - 8} y={N_end.y - 60} fill={posColor} fontSize="8" fontWeight="bold" opacity={showPos ? 1 : 0}>+45°</text>

      <line
        x1={midO + 60} y1={N_end.y - 55}
        x2={midO + 60 - beamLen * Math.sin(Math.PI/4)} y2={N_end.y - 55 + beamLen * Math.cos(Math.PI/4)}
        stroke={negColor} strokeWidth="2" strokeDasharray="6,3" opacity={showNeg ? 1 : 0}
        markerEnd={`url(#beam-neg-${uid})`}
      />
      <text x={midO + 68} y={N_end.y - 60} fill={negColor} fontSize="8" fontWeight="bold" opacity={showNeg ? 1 : 0}>−45°</text>

      <line
        x1={P_top.x + 45} y1={(P_top.y + cy) / 2 - 10}
        x2={P_top.x + 5} y2={(P_top.y + cy) / 2 + 30}
        stroke={posColor} strokeWidth="1.8" strokeDasharray="5,3" opacity={showPos ? 1 : 0}
        markerEnd={`url(#beam-pos-${uid})`}
      />
      <line
        x1={P_top.x + 45} y1={(P_top.y + cy) / 2 + 10}
        x2={P_top.x + 5} y2={(P_top.y + cy) / 2 - 30}
        stroke={negColor} strokeWidth="1.8" strokeDasharray="5,3" opacity={showNeg ? 1 : 0}
        markerEnd={`url(#beam-neg-${uid})`}
      />
      <text x={P_top.x + 50} y={(P_top.y + cy) / 2 - 2} fill="#0ea5e9" fontSize="7" fontFamily="monospace" opacity={showPos || showNeg ? 1 : 0}>WATER</text>
      <text x={P_top.x + 50} y={(P_top.y + cy) / 2 + 10} fill="#0ea5e9" fontSize="7" fontFamily="monospace" opacity={showPos || showNeg ? 1 : 0}>8.0″</text>
    </g>
  );
}

// =====================================================================
// Dimension annotations for Stage 1
// =====================================================================
function renderDimensions(
  uid: string,
  plan: PWScanPlan,
  E_start: {x: number; y: number},
  D_top: {x: number; y: number},
  D_bot: {x: number; y: number},
  A_end: {x: number; y: number},
  B_end: {x: number; y: number},
  cy: number,
  hubTop: number,
  hubBot: number,
  hubRight: number,
  webLeft: number,
) {
  const dimOffset = 30;
  return (
    <g id="dimensions" fill="none" stroke="#374151" strokeWidth="0.8">
      {/* Bore radius dimension (horizontal, below the section) */}
      <g>
        <line x1={D_top.x} y1={hubBot + dimOffset} x2={hubRight + 10} y2={hubBot + dimOffset}
          stroke="#374151" strokeWidth="0.8"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        {/* Extension lines */}
        <line x1={D_top.x} y1={D_bot.y + 5} x2={D_top.x} y2={hubBot + dimOffset + 5} stroke="#374151" strokeWidth="0.5" strokeDasharray="3,2" />
        <line x1={hubRight + 10} y1={cy} x2={hubRight + 10} y2={hubBot + dimOffset + 5} stroke="#374151" strokeWidth="0.5" strokeDasharray="3,2" />
        <text x={(D_top.x + hubRight + 10) / 2} y={hubBot + dimOffset - 5}
          textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold" fontFamily="monospace">
          R {plan.boreRadius}″
        </text>
      </g>

      {/* Coverage dimension (horizontal, above the section) */}
      <g>
        <line x1={E_start.x} y1={hubTop - dimOffset} x2={D_top.x} y2={hubTop - dimOffset}
          stroke="#059669" strokeWidth="1"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        <line x1={E_start.x} y1={hubTop} x2={E_start.x} y2={hubTop - dimOffset - 5} stroke="#059669" strokeWidth="0.5" strokeDasharray="3,2" />
        <line x1={D_top.x} y1={hubTop} x2={D_top.x} y2={hubTop - dimOffset - 5} stroke="#059669" strokeWidth="0.5" strokeDasharray="3,2" />
        <text x={(E_start.x + D_top.x) / 2} y={hubTop - dimOffset - 6}
          textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold" fontFamily="monospace">
          2.6″ COVERAGE
        </text>
      </g>

      {/* Bore offset dimension (vertical, right side) */}
      <g>
        <line x1={hubRight + 30} y1={cy} x2={hubRight + 30} y2={A_end.y}
          stroke="#6b7280" strokeWidth="0.8"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        <line x1={hubRight + 5} y1={cy} x2={hubRight + 35} y2={cy} stroke="#6b7280" strokeWidth="0.4" strokeDasharray="3,2" />
        <line x1={hubRight + 5} y1={A_end.y} x2={hubRight + 35} y2={A_end.y} stroke="#6b7280" strokeWidth="0.4" strokeDasharray="3,2" />
        <text x={hubRight + 45} y={(cy + A_end.y) / 2 + 4} fill="#6b7280" fontSize="9" fontFamily="monospace">
          {plan.boreOffset}″
        </text>
        <text x={hubRight + 45} y={(cy + A_end.y) / 2 + 16} fill="#6b7280" fontSize="7" fontFamily="monospace">
          OFFSET
        </text>
      </g>

      {/* Scan increment note */}
      <text x={webLeft + 10} y={hubBot + 20} fill="#6b7280" fontSize="8" fontFamily="monospace">
        MAX SCAN: 0.020″
      </text>
      <text x={webLeft + 10} y={hubBot + 32} fill="#6b7280" fontSize="8" fontFamily="monospace">
        MAX INDEX: 0.020″/REV
      </text>
    </g>
  );
}

// =====================================================================
// Dimension annotations for Stage 2
// =====================================================================
function renderDimensionsStage2(
  uid: string,
  cy: number,
  hubTop: number,
  hubBot: number,
  hubRight: number,
  webLeft: number,
  M_start: {x: number; y: number},
  P_top: {x: number; y: number},
  P_bot: {x: number; y: number},
  N_end: {x: number; y: number},
) {
  const dimOffset = 30;
  return (
    <g id="dimensions-s2" fill="none" stroke="#374151" strokeWidth="0.8">
      {/* Bore radius */}
      <g>
        <line x1={P_top.x} y1={hubBot + dimOffset} x2={hubRight + 10} y2={hubBot + dimOffset}
          stroke="#374151" strokeWidth="0.8"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        <line x1={P_top.x} y1={P_bot.y + 5} x2={P_top.x} y2={hubBot + dimOffset + 5} stroke="#374151" strokeWidth="0.5" strokeDasharray="3,2" />
        <line x1={hubRight + 10} y1={cy} x2={hubRight + 10} y2={hubBot + dimOffset + 5} stroke="#374151" strokeWidth="0.5" strokeDasharray="3,2" />
        <text x={(P_top.x + hubRight + 10) / 2} y={hubBot + dimOffset - 5}
          textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold" fontFamily="monospace">
          R 2.773″
        </text>
      </g>

      {/* Coverage */}
      <g>
        <line x1={M_start.x} y1={hubTop - dimOffset} x2={P_top.x} y2={hubTop - dimOffset}
          stroke="#059669" strokeWidth="1"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        <line x1={M_start.x} y1={hubTop} x2={M_start.x} y2={hubTop - dimOffset - 5} stroke="#059669" strokeWidth="0.5" strokeDasharray="3,2" />
        <line x1={P_top.x} y1={hubTop} x2={P_top.x} y2={hubTop - dimOffset - 5} stroke="#059669" strokeWidth="0.5" strokeDasharray="3,2" />
        <text x={(M_start.x + P_top.x) / 2} y={hubTop - dimOffset - 6}
          textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold" fontFamily="monospace">
          2.6″ COVERAGE
        </text>
      </g>

      {/* Offset */}
      <g>
        <line x1={hubRight + 30} y1={cy} x2={hubRight + 30} y2={N_end.y}
          stroke="#6b7280" strokeWidth="0.8"
          markerStart={`url(#dim-arrow-rev-${uid})`}
          markerEnd={`url(#dim-arrow-${uid})`}
        />
        <line x1={hubRight + 5} y1={cy} x2={hubRight + 35} y2={cy} stroke="#6b7280" strokeWidth="0.4" strokeDasharray="3,2" />
        <line x1={hubRight + 5} y1={N_end.y} x2={hubRight + 35} y2={N_end.y} stroke="#6b7280" strokeWidth="0.4" strokeDasharray="3,2" />
        <text x={hubRight + 45} y={(cy + N_end.y) / 2 + 4} fill="#6b7280" fontSize="9" fontFamily="monospace">0.898″</text>
        <text x={hubRight + 45} y={(cy + N_end.y) / 2 + 16} fill="#6b7280" fontSize="7" fontFamily="monospace">OFFSET</text>
      </g>

      {/* Scan params */}
      <text x={webLeft + 10} y={hubBot + 20} fill="#6b7280" fontSize="8" fontFamily="monospace">
        MAX SCAN: 0.020″
      </text>
      <text x={webLeft + 10} y={hubBot + 32} fill="#6b7280" fontSize="8" fontFamily="monospace">
        MAX INDEX: 0.020″/REV
      </text>
    </g>
  );
}

// =====================================================================
// Coverage zone highlight
// =====================================================================
function renderCoverageZone(
  uid: string,
  E_start: {x: number; y: number},
  D_top: {x: number; y: number},
  cy: number,
  A_end: {x: number; y: number},
) {
  // Light green shading over the coverage area
  return (
    <g id="coverage-zone" opacity={0.15}>
      <rect
        x={E_start.x}
        y={A_end.y - 15}
        width={D_top.x - E_start.x}
        height={(cy - A_end.y + 15) * 2}
        fill="#059669"
        rx="3"
      />
    </g>
  );
}

// =====================================================================
// Legend bar (shared between stages)
// =====================================================================
function renderLegend(uid: string, plan: PWScanPlan, stage: number, beam?: { showPos: boolean; showNeg: boolean; posColor: string; negColor: string }) {
  const zones = plan.scanZones;
  const legendY = 650;

  const showPos = beam?.showPos ?? true;
  const showNeg = beam?.showNeg ?? true;
  const posColor = beam?.posColor ?? "#dc2626";
  const negColor = beam?.negColor ?? "#2563eb";

  return (
    <g transform={`translate(20, ${legendY})`}>
      <rect x="0" y="0" width="880" height="75" fill="#f8fafc" stroke="#d1d5db" strokeWidth="0.5" rx="3" />

      {/* Surface zone chips */}
      <text x="10" y="16" fill="#374151" fontSize="9" fontWeight="bold" fontFamily="monospace">SCAN ZONES:</text>
      {zones.map((z, i) => (
        <g key={z.id} transform={`translate(${10 + i * (stage === 1 ? 100 : 82)}, 24)`}>
          <rect x="0" y="0" width={stage === 1 ? 90 : 74} height="20" rx="3"
            fill={ZONE_COLORS_LIGHT[z.id] ?? "#f3f4f6"}
            stroke={ZONE_COLORS[z.id] ?? "#9ca3af"} strokeWidth="1" />
          <text x="5" y="14" fill={ZONE_COLORS[z.id] ?? "#374151"} fontSize="9" fontWeight="bold">{z.id}</text>
          <text x="18" y="14" fill="#374151" fontSize="7.5" fontFamily="monospace">
            {z.profileShape.type === 'arc' ? 'ARC' : z.profileShape.type === 'chamfer' ? 'CHAMFER' : 'LINE'}
          </text>
        </g>
      ))}

      {/* Beam legend */}
      <g transform="translate(10, 52)">
        <line x1="0" y1="6" x2="35" y2="6" stroke={posColor} strokeWidth="2" strokeDasharray="6,3" opacity={showPos ? 1 : 0}
          markerEnd={`url(#beam-pos-${uid})`} />
        <text x="48" y="10" fill="#374151" fontSize="8" fontFamily="monospace" opacity={showPos ? 1 : 0}>+45° SHEAR</text>

        <line x1="130" y1="6" x2="165" y2="6" stroke={negColor} strokeWidth="2" strokeDasharray="6,3" opacity={showNeg ? 1 : 0}
          markerEnd={`url(#beam-neg-${uid})`} />
        <text x="178" y="10" fill="#374151" fontSize="8" fontFamily="monospace" opacity={showNeg ? 1 : 0}>−45° SHEAR</text>

        <text x="280" y="10" fill="#6b7280" fontSize="8" fontFamily="monospace">
          CIRCUMFERENTIAL (θ) 360° • INDEX ALONG SURFACE • WATER PATH: 8.0″
        </text>

        <text x="700" y="10" fill="#6b7280" fontSize="8" fontFamily="monospace">
          TRANSDUCER: IAE2P16679
        </text>
      </g>
    </g>
  );
}

export default V2500BoreScanDiagram;
