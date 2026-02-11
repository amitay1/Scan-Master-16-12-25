import type { InspectionSetupData } from "@/types/techniqueSheet";

type InspectionThicknessSource = Pick<
  InspectionSetupData,
  "partType" | "partThickness" | "wallThickness" | "isHollow" | "diameter" | "innerDiameter"
>;

const WALL_DRIVEN_PART_TYPES = new Set<string>([
  "tube",
  "pipe",
  "ring",
  "ring_forging",
  "sleeve",
  "bushing",
  "rectangular_tube",
  "square_tube",
  "hollow_cylinder",
  "cone",
]);

function toPositive(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

export function resolveWallThickness(source: InspectionThicknessSource): number | undefined {
  const directWall = toPositive(source.wallThickness);
  if (directWall) return directWall;

  const od = toPositive(source.diameter);
  const id = toPositive(source.innerDiameter);
  if (!od || !id || od <= id) return undefined;

  return Number(((od - id) / 2).toFixed(3));
}

/**
 * Returns the thickness that should drive calibration and standard lookups.
 * For tubular profiles we prioritize wall thickness. For solid sections we use part thickness.
 */
export function getInspectionThickness(
  source: InspectionThicknessSource,
  fallback = 25
): number {
  const partType = (source.partType || "").toString().toLowerCase();
  const partThickness = toPositive(source.partThickness);
  const wallThickness = resolveWallThickness(source);
  const preferWall = WALL_DRIVEN_PART_TYPES.has(partType);

  if (preferWall && wallThickness) return wallThickness;
  if (partThickness) return partThickness;
  if (wallThickness) return wallThickness;

  return fallback;
}

