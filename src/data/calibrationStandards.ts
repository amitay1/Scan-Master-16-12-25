export interface CalibrationStandardRow {
  /** Standard sample ID, e.g. "3/0012" */
  defectId: string;
  /** Defect type (FBH, SDH, etc.) */
  type: string;
  /** Length of sample, if specified (mm) */
  lengthMm?: number | null;
  /** Width of sample, if specified (mm) */
  widthMm?: number | null;
  /** Drilling depth from entry surface (mm) */
  depthMm: number;
  /** Flat-bottom hole diameter (mm) */
  holeDiameterMm: number;
  /** Optional note column */
  note?: string | null;
}

/**
 * FBH series from the calibration standard table:
 * "Campioni utilizzati per taratura / Standards used for calibration".
 *
 * All samples here are FBH with Ø1.19 mm (~3/64").
 * Depths are metric conversions from inches (0.12"–12.00").
 */
export const FBH_3_64_SERIES: CalibrationStandardRow[] = [
  { defectId: "3/0012", type: "FBH", lengthMm: null, widthMm: null, depthMm: 3.05, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0050", type: "FBH", lengthMm: null, widthMm: null, depthMm: 12.70, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0100", type: "FBH", lengthMm: null, widthMm: null, depthMm: 25.40, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0225", type: "FBH", lengthMm: null, widthMm: null, depthMm: 57.15, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0325", type: "FBH", lengthMm: null, widthMm: null, depthMm: 82.55, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0425", type: "FBH", lengthMm: null, widthMm: null, depthMm: 107.95, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0525", type: "FBH", lengthMm: null, widthMm: null, depthMm: 133.35, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0575", type: "FBH", lengthMm: null, widthMm: null, depthMm: 146.10, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0700", type: "FBH", lengthMm: null, widthMm: null, depthMm: 177.80, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/0900", type: "FBH", lengthMm: null, widthMm: null, depthMm: 228.60, holeDiameterMm: 1.19, note: "-" },
  { defectId: "3/1200", type: "FBH", lengthMm: null, widthMm: null, depthMm: 304.80, holeDiameterMm: 1.19, note: "-" },
];

/**
 * Pick the best-matching FBH sample for a desired metal travel distance.
 * Uses simple nearest-neighbour on depth (mm).
 */
export function pickStandardForMetalTravel(
  targetTravelMm: number,
  standards: CalibrationStandardRow[] = FBH_3_64_SERIES,
): CalibrationStandardRow | null {
  if (!Number.isFinite(targetTravelMm) || standards.length === 0) return null;

  let best: CalibrationStandardRow | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const row of standards) {
    const delta = Math.abs(row.depthMm - targetTravelMm);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = row;
    }
  }

  return best;
}
