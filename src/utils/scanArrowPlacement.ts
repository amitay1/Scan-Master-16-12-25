// ============================================================================
// SCAN ARROW PLACEMENT LOGIC
// Templates for positioning scan direction arrows on custom drawings
// Based on ASTM E2375 scan direction definitions
// ============================================================================

import type { PartGeometry } from '@/types/techniqueSheet';
import type { ScanArrow, ArrowTemplate, ArrowTemplateConfig } from '@/types/scanOverlay';
import { SCAN_DIRECTION_DEFINITIONS } from '@/types/scanDetails';

/**
 * Get color for a scan direction from the definitions
 */
function getDirectionColor(direction: string): string {
  const def = SCAN_DIRECTION_DEFINITIONS.find(d => d.code === direction);
  return def?.color || '#6b7280'; // gray-500 fallback
}

/**
 * Get label for a scan direction from the definitions
 */
function getDirectionLabel(direction: string): string {
  const def = SCAN_DIRECTION_DEFINITIONS.find(d => d.code === direction);
  if (!def) return direction;
  return `${direction}, ${def.waveMode.split(' ')[0]} ${def.angle}°`;
}

// ============================================================================
// ARROW TEMPLATES BY GEOMETRY
// Positions are normalized (0-1) for scale independence
// ============================================================================

/**
 * Arrow templates for PLATE / BOX geometry
 * Standard flat surface inspection
 */
const PLATE_ARROWS: ArrowTemplate[] = [
  // A - Primary from top
  { direction: 'A', defaultX: 0.5, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - Secondary from side
  { direction: 'B', defaultX: 0.05, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // B₁ - Dual element from side
  { direction: 'B₁', defaultX: 0.05, defaultY: 0.35, defaultAngle: 0, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('B₁'), label: getDirectionLabel('B₁') },
  // J - Shear 60° (thin sections)
  { direction: 'J', defaultX: 0.15, defaultY: 0.85, defaultAngle: -60, defaultLength: 0.15, defaultEnabled: false, color: getDirectionColor('J'), label: getDirectionLabel('J') },
  // K - Shear 45° (thick sections)
  { direction: 'K', defaultX: 0.85, defaultY: 0.85, defaultAngle: -135, defaultLength: 0.15, defaultEnabled: false, color: getDirectionColor('K'), label: getDirectionLabel('K') },
  // I - Through transmission
  { direction: 'I', defaultX: 0.5, defaultY: 0.95, defaultAngle: -90, defaultLength: 0.15, defaultEnabled: false, color: getDirectionColor('I'), label: getDirectionLabel('I') },
];

/**
 * Arrow templates for CYLINDER / ROUND BAR geometry
 * Solid circular cross-section
 */
const CYLINDER_ARROWS: ArrowTemplate[] = [
  // A - From top surface
  { direction: 'A', defaultX: 0.5, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From side
  { direction: 'B', defaultX: 0.05, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // B₁ - Dual element from side
  { direction: 'B₁', defaultX: 0.05, defaultY: 0.65, defaultAngle: 0, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('B₁'), label: getDirectionLabel('B₁') },
  // C - Radial from OD (circumference)
  { direction: 'C', defaultX: 0.95, defaultY: 0.5, defaultAngle: 180, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element radial
  { direction: 'C₁', defaultX: 0.95, defaultY: 0.65, defaultAngle: 180, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
  // D - Circumferential shear CW
  { direction: 'D', defaultX: 0.75, defaultY: 0.15, defaultAngle: 135, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('D'), label: getDirectionLabel('D') },
  // E - Circumferential shear CCW
  { direction: 'E', defaultX: 0.25, defaultY: 0.15, defaultAngle: 45, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('E'), label: getDirectionLabel('E') },
  // L - Rotational 360°
  { direction: 'L', defaultX: 0.5, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('L'), label: getDirectionLabel('L') },
];

/**
 * Arrow templates for TUBE / PIPE geometry
 * Hollow circular with OD and ID
 */
const TUBE_ARROWS: ArrowTemplate[] = [
  // A - Axial from top (through wall)
  { direction: 'A', defaultX: 0.5, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element axial
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From bottom/opposite
  { direction: 'B', defaultX: 0.5, defaultY: 0.95, defaultAngle: -90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // C - Radial from OD
  { direction: 'C', defaultX: 0.95, defaultY: 0.5, defaultAngle: 180, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element radial
  { direction: 'C₁', defaultX: 0.95, defaultY: 0.65, defaultAngle: 180, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
  // D - Circumferential shear CW
  { direction: 'D', defaultX: 0.8, defaultY: 0.2, defaultAngle: 135, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('D'), label: getDirectionLabel('D') },
  // E - Circumferential shear CCW
  { direction: 'E', defaultX: 0.2, defaultY: 0.2, defaultAngle: 45, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('E'), label: getDirectionLabel('E') },
  // F - Axial shear direction 1
  { direction: 'F', defaultX: 0.15, defaultY: 0.5, defaultAngle: 45, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('F'), label: getDirectionLabel('F') },
  // G - Axial shear direction 2
  { direction: 'G', defaultX: 0.15, defaultY: 0.7, defaultAngle: -45, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('G'), label: getDirectionLabel('G') },
  // H - From ID surface
  { direction: 'H', defaultX: 0.5, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('H'), label: getDirectionLabel('H') },
];

/**
 * Arrow templates for DISK geometry
 * Flat circular parts
 */
const DISK_ARROWS: ArrowTemplate[] = [
  // A - From flat top surface
  { direction: 'A', defaultX: 0.5, defaultY: 0.15, defaultAngle: 90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.15, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From bottom surface
  { direction: 'B', defaultX: 0.5, defaultY: 0.85, defaultAngle: -90, defaultLength: 0.15, defaultEnabled: false, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // C - Radial from rim
  { direction: 'C', defaultX: 0.95, defaultY: 0.5, defaultAngle: 180, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element radial
  { direction: 'C₁', defaultX: 0.05, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
  // D - Circumferential shear CW
  { direction: 'D', defaultX: 0.75, defaultY: 0.25, defaultAngle: 135, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('D'), label: getDirectionLabel('D') },
  // E - Circumferential shear CCW
  { direction: 'E', defaultX: 0.25, defaultY: 0.25, defaultAngle: 45, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('E'), label: getDirectionLabel('E') },
];

/**
 * Arrow templates for RING geometry
 * Annular shape with significant wall thickness
 */
const RING_ARROWS: ArrowTemplate[] = [
  // A - From top face
  { direction: 'A', defaultX: 0.5, defaultY: 0.1, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.1, defaultAngle: 90, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From bottom face
  { direction: 'B', defaultX: 0.5, defaultY: 0.9, defaultAngle: -90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // C - Radial from OD
  { direction: 'C', defaultX: 0.95, defaultY: 0.5, defaultAngle: 180, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element radial
  { direction: 'C₁', defaultX: 0.95, defaultY: 0.65, defaultAngle: 180, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
  // D - Circumferential shear CW
  { direction: 'D', defaultX: 0.8, defaultY: 0.2, defaultAngle: 135, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('D'), label: getDirectionLabel('D') },
  // E - Circumferential shear CCW
  { direction: 'E', defaultX: 0.2, defaultY: 0.2, defaultAngle: 45, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('E'), label: getDirectionLabel('E') },
  // F - Axial shear direction 1
  { direction: 'F', defaultX: 0.15, defaultY: 0.5, defaultAngle: 45, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('F'), label: getDirectionLabel('F') },
  // G - Axial shear direction 2
  { direction: 'G', defaultX: 0.15, defaultY: 0.7, defaultAngle: -45, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('G'), label: getDirectionLabel('G') },
  // H - From ID surface
  { direction: 'H', defaultX: 0.5, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('H'), label: getDirectionLabel('H') },
];

/**
 * Arrow templates for CONE geometry
 */
const CONE_ARROWS: ArrowTemplate[] = [
  // A - From top (narrow end)
  { direction: 'A', defaultX: 0.5, defaultY: 0.1, defaultAngle: 90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.4, defaultY: 0.1, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From base (wide end)
  { direction: 'B', defaultX: 0.5, defaultY: 0.9, defaultAngle: -90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // C - Radial from side surface
  { direction: 'C', defaultX: 0.85, defaultY: 0.5, defaultAngle: -150, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element radial
  { direction: 'C₁', defaultX: 0.15, defaultY: 0.5, defaultAngle: -30, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
];

/**
 * Arrow templates for HEX BAR geometry
 */
const HEXBAR_ARROWS: ArrowTemplate[] = [
  // A - From top face
  { direction: 'A', defaultX: 0.5, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.15, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element from top
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From side face 1
  { direction: 'B', defaultX: 0.05, defaultY: 0.35, defaultAngle: 30, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // B₁ - Dual element side 1
  { direction: 'B₁', defaultX: 0.05, defaultY: 0.5, defaultAngle: 30, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('B₁'), label: getDirectionLabel('B₁') },
  // C - From side face 2 (opposite)
  { direction: 'C', defaultX: 0.95, defaultY: 0.35, defaultAngle: 150, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element side 2
  { direction: 'C₁', defaultX: 0.95, defaultY: 0.5, defaultAngle: 150, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
];

/**
 * Arrow templates for IMPELLER / BLISK (complex aero parts)
 */
const IMPELLER_ARROWS: ArrowTemplate[] = [
  // A - From top (hub)
  { direction: 'A', defaultX: 0.5, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('A'), label: getDirectionLabel('A') },
  // A₁ - Dual element hub
  { direction: 'A₁', defaultX: 0.35, defaultY: 0.05, defaultAngle: 90, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('A₁'), label: getDirectionLabel('A₁') },
  // B - From bottom (bore)
  { direction: 'B', defaultX: 0.5, defaultY: 0.95, defaultAngle: -90, defaultLength: 0.12, defaultEnabled: true, color: getDirectionColor('B'), label: getDirectionLabel('B') },
  // B₁ - Dual element bore
  { direction: 'B₁', defaultX: 0.35, defaultY: 0.95, defaultAngle: -90, defaultLength: 0.1, defaultEnabled: false, color: getDirectionColor('B₁'), label: getDirectionLabel('B₁') },
  // C - Radial from OD (rim)
  { direction: 'C', defaultX: 0.95, defaultY: 0.5, defaultAngle: 180, defaultLength: 0.1, defaultEnabled: true, color: getDirectionColor('C'), label: getDirectionLabel('C') },
  // C₁ - Dual element rim
  { direction: 'C₁', defaultX: 0.95, defaultY: 0.65, defaultAngle: 180, defaultLength: 0.08, defaultEnabled: false, color: getDirectionColor('C₁'), label: getDirectionLabel('C₁') },
  // D - Circumferential CW (web)
  { direction: 'D', defaultX: 0.7, defaultY: 0.3, defaultAngle: 120, defaultLength: 0.1, defaultEnabled: true, color: getDirectionColor('D'), label: getDirectionLabel('D') },
  // E - Circumferential CCW (web)
  { direction: 'E', defaultX: 0.3, defaultY: 0.3, defaultAngle: 60, defaultLength: 0.1, defaultEnabled: true, color: getDirectionColor('E'), label: getDirectionLabel('E') },
  // H - From ID (bore)
  { direction: 'H', defaultX: 0.5, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.08, defaultEnabled: false, color: getDirectionColor('H'), label: getDirectionLabel('H') },
  // L - Rotational scan
  { direction: 'L', defaultX: 0.5, defaultY: 0.5, defaultAngle: 0, defaultLength: 0.06, defaultEnabled: false, color: getDirectionColor('L'), label: getDirectionLabel('L') },
];

// ============================================================================
// TEMPLATE CONFIGURATION MAP
// ============================================================================

const ARROW_TEMPLATES: ArrowTemplateConfig = {
  // Basic geometries
  box: PLATE_ARROWS,
  plate: PLATE_ARROWS,
  sheet: PLATE_ARROWS,
  slab: PLATE_ARROWS,
  flat_bar: PLATE_ARROWS,
  rectangular_bar: PLATE_ARROWS,
  square_bar: PLATE_ARROWS,
  billet: PLATE_ARROWS,
  block: PLATE_ARROWS,

  // Cylindrical
  cylinder: CYLINDER_ARROWS,
  round_bar: CYLINDER_ARROWS,
  shaft: CYLINDER_ARROWS,
  bar: CYLINDER_ARROWS,

  // Tubular
  tube: TUBE_ARROWS,
  pipe: TUBE_ARROWS,
  sleeve: TUBE_ARROWS,
  bushing: TUBE_ARROWS,
  rectangular_tube: TUBE_ARROWS, // Similar layout
  square_tube: TUBE_ARROWS,

  // Disk-like
  disk: DISK_ARROWS,
  disk_forging: DISK_ARROWS,
  hub: DISK_ARROWS,

  // Ring-like
  ring: RING_ARROWS,
  ring_forging: RING_ARROWS,

  // Cone
  cone: CONE_ARROWS,
  pyramid: CONE_ARROWS,

  // Hex bar
  hexagon: HEXBAR_ARROWS,
  hex_bar: HEXBAR_ARROWS,

  // Complex aero parts
  impeller: IMPELLER_ARROWS,
  blisk: IMPELLER_ARROWS,

  // Profiles (use plate as base)
  l_profile: PLATE_ARROWS,
  t_profile: PLATE_ARROWS,
  i_profile: PLATE_ARROWS,
  u_profile: PLATE_ARROWS,
  z_profile: PLATE_ARROWS,
  z_section: PLATE_ARROWS,
  custom_profile: PLATE_ARROWS,
  extrusion_l: PLATE_ARROWS,
  extrusion_t: PLATE_ARROWS,
  extrusion_i: PLATE_ARROWS,
  extrusion_u: PLATE_ARROWS,
  extrusion_channel: PLATE_ARROWS,
  extrusion_angle: PLATE_ARROWS,

  // Other
  sphere: CYLINDER_ARROWS,
  ellipse: DISK_ARROWS,
  irregular: PLATE_ARROWS,
  forging: PLATE_ARROWS,
  round_forging_stock: CYLINDER_ARROWS,
  rectangular_forging_stock: PLATE_ARROWS,
  near_net_forging: PLATE_ARROWS,
  machined_component: PLATE_ARROWS,
  custom: PLATE_ARROWS,
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get arrow templates for a specific geometry type
 */
export function getArrowTemplates(geometry: PartGeometry | string): ArrowTemplate[] {
  return ARROW_TEMPLATES[geometry] || PLATE_ARROWS;
}

/**
 * Generate initial scan arrows for a custom drawing based on geometry
 */
export function generateArrowsForGeometry(geometry: PartGeometry | string): ScanArrow[] {
  const templates = getArrowTemplates(geometry);

  return templates.map(template => ({
    direction: template.direction,
    x: template.defaultX,
    y: template.defaultY,
    angle: template.defaultAngle,
    length: template.defaultLength,
    visible: template.defaultEnabled,
    color: template.color,
    label: template.label,
  }));
}

/**
 * Sync arrows visibility with scan details enabled state
 * @param arrows Current arrows
 * @param scanDetails Scan details with enabled flags
 */
export function syncArrowsWithScanDetails(
  arrows: ScanArrow[],
  scanDetails: Array<{ scanningDirection: string; enabled: boolean }>
): ScanArrow[] {
  return arrows.map(arrow => {
    const detail = scanDetails.find(d => d.scanningDirection === arrow.direction);
    return {
      ...arrow,
      visible: detail?.enabled ?? arrow.visible,
    };
  });
}

/**
 * Get all available scan directions for a geometry
 */
export function getAvailableDirections(geometry: PartGeometry | string): string[] {
  const templates = getArrowTemplates(geometry);
  return templates.map(t => t.direction);
}

/**
 * Check if a direction is applicable to a geometry
 */
export function isDirectionApplicable(direction: string, geometry: PartGeometry | string): boolean {
  const templates = getArrowTemplates(geometry);
  return templates.some(t => t.direction === direction);
}
