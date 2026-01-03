/**
 * Beam Type Classification for Calibration Blocks
 *
 * Determines which part geometries require:
 * - Straight beam only (FBH blocks)
 * - Angle beam only (rare)
 * - Both straight beam AND angle beam (circular parts)
 *
 * Per AMS-STD-2154 and ASTM E2375:
 * - Circular parts (tubes, pipes, rings) require both longitudinal (straight)
 *   and circumferential shear wave (angle beam) inspection
 * - Flat parts typically need only straight beam inspection
 */

import { PartGeometry } from "@/types/techniqueSheet";

export type BeamRequirement = "straight_only" | "angle_only" | "both";

/**
 * Part geometries that require BOTH straight beam AND angle beam inspection.
 * These are typically circular/tubular parts where circumferential shear wave
 * inspection is required per aerospace standards.
 */
const BOTH_BEAM_GEOMETRIES: PartGeometry[] = [
  // Tubular parts
  "tube",
  "pipe",
  "rectangular_tube",
  "square_tube",

  // Ring-shaped parts
  "ring",
  "ring_forging",

  // Hollow circular components
  "sleeve",
  "bushing",

  // Hollow cylinders (if marked as hollow in the part setup)
  "cylinder", // Note: Only if isHollow=true, otherwise straight only
];

/**
 * Part geometries that typically need only STRAIGHT BEAM inspection.
 * These are flat or solid parts where angle beam is not typically required.
 */
const STRAIGHT_ONLY_GEOMETRIES: PartGeometry[] = [
  // Flat products
  "box",
  "plate",
  "sheet",
  "slab",
  "flat_bar",
  "rectangular_bar",
  "square_bar",
  "block",
  "billet",
  "bar",

  // Solid rounds (radial straight beam)
  "round_bar",
  "shaft",
  "round_forging_stock",

  // Disks
  "disk",
  "disk_forging",
  "hub",

  // Hex shapes
  "hexagon",
  "hex_bar",

  // Structural profiles (primarily straight beam)
  "l_profile",
  "t_profile",
  "i_profile",
  "u_profile",
  "z_profile",
  "z_section",
  "custom_profile",
  "extrusion_l",
  "extrusion_t",
  "extrusion_i",
  "extrusion_u",
  "extrusion_channel",
  "extrusion_angle",

  // Forgings (unless ring-shaped)
  "forging",
  "rectangular_forging_stock",
  "near_net_forging",

  // Other geometries
  "sphere",
  "cone",
  "pyramid",
  "ellipse",
  "irregular",
  "machined_component",
  "custom",
];

/**
 * Determines the beam requirement for a given part geometry.
 *
 * @param partType - The part geometry type
 * @param isHollow - Whether the part is hollow (optional)
 * @returns The beam requirement: "straight_only", "angle_only", or "both"
 */
export function getBeamRequirement(
  partType: PartGeometry | string | undefined,
  isHollow?: boolean
): BeamRequirement {
  if (!partType) return "straight_only";

  const normalizedType = partType.toLowerCase() as PartGeometry;

  // Special case: cylinders are "both" only if hollow
  if (normalizedType === "cylinder") {
    return isHollow ? "both" : "straight_only";
  }

  // Check if requires both beam types
  if (BOTH_BEAM_GEOMETRIES.includes(normalizedType)) {
    return "both";
  }

  // Default to straight only
  return "straight_only";
}

/**
 * Checks if a part geometry requires angle beam inspection.
 *
 * @param partType - The part geometry type
 * @param isHollow - Whether the part is hollow (optional)
 * @returns True if angle beam inspection is required
 */
export function requiresAngleBeam(
  partType: PartGeometry | string | undefined,
  isHollow?: boolean
): boolean {
  const requirement = getBeamRequirement(partType, isHollow);
  return requirement === "both" || requirement === "angle_only";
}

/**
 * Checks if a part geometry requires straight beam inspection.
 *
 * @param partType - The part geometry type
 * @param isHollow - Whether the part is hollow (optional)
 * @returns True if straight beam inspection is required
 */
export function requiresStraightBeam(
  partType: PartGeometry | string | undefined,
  isHollow?: boolean
): boolean {
  const requirement = getBeamRequirement(partType, isHollow);
  return requirement === "both" || requirement === "straight_only";
}

/**
 * Gets descriptive labels for beam types.
 */
export const BEAM_TYPE_LABELS = {
  straight: {
    short: "Straight Beam",
    full: "Straight Beam (Longitudinal Wave 0°)",
    description: "Normal incidence inspection using longitudinal waves at 0°. Used for detecting discontinuities parallel to the inspection surface.",
  },
  angle: {
    short: "Angle Beam",
    full: "Angle Beam (Shear Wave)",
    description: "Refracted shear wave inspection typically at 45°, 60°, or 70°. Used for circumferential scanning of tubular parts and detecting discontinuities not parallel to the surface.",
  },
} as const;
