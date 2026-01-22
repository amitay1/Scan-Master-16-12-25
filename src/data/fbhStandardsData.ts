/**
 * FBH (Flat Bottom Hole) Standards Data
 * Real values from ASTM E127, MIL-STD-2154, BS EN 10228-3
 * Used for dropdown selections in Calibration Model tab
 */

// ============================================================================
// FBH DIAMETER OPTIONS (from ASTM E127 / MIL-STD-2154)
// ============================================================================

export interface FBHDiameterOption {
  id: string;
  inch: string;      // Display value in inches (e.g., "3/64")
  mm: number;        // Converted value in mm
  standard: string;  // Source standard
}

export const FBH_DIAMETER_OPTIONS: FBHDiameterOption[] = [
  // ASTM E127 / MIL-STD-2154 Series (in 64ths of an inch)
  { id: '1_64', inch: '1/64', mm: 0.40, standard: 'ASTM E127' },
  { id: '2_64', inch: '2/64', mm: 0.79, standard: 'ASTM E127' },
  { id: '3_64', inch: '3/64', mm: 1.19, standard: 'ASTM E127' },
  { id: '4_64', inch: '4/64', mm: 1.59, standard: 'ASTM E127' },
  { id: '5_64', inch: '5/64', mm: 1.98, standard: 'ASTM E127' },
  { id: '6_64', inch: '6/64', mm: 2.38, standard: 'ASTM E127' },
  { id: '7_64', inch: '7/64', mm: 2.78, standard: 'ASTM E127' },
  { id: '8_64', inch: '8/64', mm: 3.18, standard: 'ASTM E127' },
  // BS EN 10228-3 Series (metric)
  { id: 'en_2mm', inch: '-', mm: 2.0, standard: 'EN 10228-3' },
  { id: 'en_3mm', inch: '-', mm: 3.0, standard: 'EN 10228-3' },
  { id: 'en_4mm', inch: '-', mm: 4.0, standard: 'EN 10228-3' },
  { id: 'en_5mm', inch: '-', mm: 5.0, standard: 'EN 10228-3' },
  { id: 'en_6mm', inch: '-', mm: 6.0, standard: 'EN 10228-3' },
  { id: 'en_8mm', inch: '-', mm: 8.0, standard: 'EN 10228-3' },
  // ASTM A388 Series
  { id: 'a388_1_16', inch: '1/16', mm: 1.59, standard: 'ASTM A388' },
  { id: 'a388_1_8', inch: '1/8', mm: 3.18, standard: 'ASTM A388' },
  { id: 'a388_3_16', inch: '3/16', mm: 4.76, standard: 'ASTM A388' },
  { id: 'a388_1_4', inch: '1/4', mm: 6.35, standard: 'ASTM A388' },
];

// ============================================================================
// METAL TRAVEL / DEPTH H OPTIONS (from ASTM E127)
// ============================================================================

export interface MetalTravelOption {
  id: string;
  depthMm: number;
  depthInch: string;
  standard: string;
}

// ASTM E127 Standard metal travel distances
export const METAL_TRAVEL_OPTIONS: MetalTravelOption[] = [
  { id: 'e127_3', depthMm: 3.05, depthInch: '0.12"', standard: 'ASTM E127' },
  { id: 'e127_6', depthMm: 6.35, depthInch: '1/4"', standard: 'ASTM E127' },
  { id: 'e127_9.5', depthMm: 9.53, depthInch: '3/8"', standard: 'ASTM E127' },
  { id: 'e127_12.7', depthMm: 12.70, depthInch: '1/2"', standard: 'ASTM E127' },
  { id: 'e127_19', depthMm: 19.05, depthInch: '3/4"', standard: 'ASTM E127' },
  { id: 'e127_25', depthMm: 25.40, depthInch: '1"', standard: 'ASTM E127' },
  { id: 'e127_31.75', depthMm: 31.75, depthInch: '1-1/4"', standard: 'ASTM E127' },
  { id: 'e127_38', depthMm: 38.10, depthInch: '1-1/2"', standard: 'ASTM E127' },
  { id: 'e127_44.45', depthMm: 44.45, depthInch: '1-3/4"', standard: 'ASTM E127' },
  { id: 'e127_50.8', depthMm: 50.80, depthInch: '2"', standard: 'ASTM E127' },
  { id: 'e127_63.5', depthMm: 63.50, depthInch: '2-1/2"', standard: 'ASTM E127' },
  { id: 'e127_76.2', depthMm: 76.20, depthInch: '3"', standard: 'ASTM E127' },
  { id: 'e127_88.9', depthMm: 88.90, depthInch: '3-1/2"', standard: 'ASTM E127' },
  { id: 'e127_101.6', depthMm: 101.60, depthInch: '4"', standard: 'ASTM E127' },
  { id: 'e127_114.3', depthMm: 114.30, depthInch: '4-1/2"', standard: 'ASTM E127' },
  { id: 'e127_127', depthMm: 127.00, depthInch: '5"', standard: 'ASTM E127' },
  { id: 'e127_152.4', depthMm: 152.40, depthInch: '6"', standard: 'ASTM E127' },
  // EN 10228-3 metric depths
  { id: 'en_10', depthMm: 10.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_15', depthMm: 15.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_20', depthMm: 20.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_25', depthMm: 25.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_30', depthMm: 30.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_40', depthMm: 40.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_50', depthMm: 50.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_75', depthMm: 75.0, depthInch: '-', standard: 'EN 10228-3' },
  { id: 'en_100', depthMm: 100.0, depthInch: '-', standard: 'EN 10228-3' },
];

// ============================================================================
// BLOCK HEIGHT E OPTIONS (ASTM E127 standard calibration block heights)
// ============================================================================

export interface BlockHeightEOption {
  id: string;
  heightMm: number;
  heightInch: string;
  standard: string;
}

// ASTM E127 standard calibration block heights (same as metal travel depths)
export const BLOCK_HEIGHT_E_OPTIONS: BlockHeightEOption[] = [
  { id: 'e127_19', heightMm: 19.05, heightInch: '3/4"', standard: 'ASTM E127' },
  { id: 'e127_25', heightMm: 25.40, heightInch: '1"', standard: 'ASTM E127' },
  { id: 'e127_38', heightMm: 38.10, heightInch: '1-1/2"', standard: 'ASTM E127' },
  { id: 'e127_50.8', heightMm: 50.80, heightInch: '2"', standard: 'ASTM E127' },
  { id: 'e127_76.2', heightMm: 76.20, heightInch: '3"', standard: 'ASTM E127' },
  { id: 'e127_101.6', heightMm: 101.60, heightInch: '4"', standard: 'ASTM E127' },
  { id: 'e127_152.4', heightMm: 152.40, heightInch: '6"', standard: 'ASTM E127' },
  // EN 10228-3 metric heights
  { id: 'en_25', heightMm: 25.0, heightInch: '-', standard: 'EN 10228-3' },
  { id: 'en_50', heightMm: 50.0, heightInch: '-', standard: 'EN 10228-3' },
  { id: 'en_75', heightMm: 75.0, heightInch: '-', standard: 'EN 10228-3' },
  { id: 'en_100', heightMm: 100.0, heightInch: '-', standard: 'EN 10228-3' },
];

// ============================================================================
// DELTA (Δ) TYPE OPTIONS
// ============================================================================

export interface DeltaTypeOption {
  id: string;
  label: string;
  description: string;
}

export const DELTA_TYPE_OPTIONS: DeltaTypeOption[] = [
  { id: 'area', label: 'Area', description: 'Area-amplitude reference (E127)' },
  { id: 'distance', label: 'Distance', description: 'Distance-amplitude reference' },
  { id: 'dac', label: 'DAC', description: 'Distance Amplitude Correction' },
  { id: 'tcg', label: 'TCG', description: 'Time Corrected Gain' },
  { id: 'ref', label: 'REF', description: 'Reference standard' },
];

// ============================================================================
// FBH HOLE ROW DATA STRUCTURE
// ============================================================================

export interface FBHHoleRowData {
  id: number;
  partNumber: string;
  deltaType: string;         // Δ type
  diameterInch: string;      // ØFBH inch (selected from dropdown)
  diameterMm: number;        // ØFBH mm (auto-calculated)
  blockHeightE: number;      // E - calibration block height (mm)
  metalTravelH: number;      // H - metal travel depth (fixed, calculated from E)
  isCustom?: boolean;        // True if custom values entered
}

// Default 3 holes for the table
export const DEFAULT_FBH_HOLES: FBHHoleRowData[] = [
  { id: 1, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 19.05, metalTravelH: 19.05 },
  { id: 2, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 19.05, metalTravelH: 19.05 },
  { id: 3, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 19.05, metalTravelH: 19.05 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert inch fraction string to mm
 */
export function inchFractionToMm(fraction: string): number {
  if (!fraction || fraction === '-' || fraction === 'Custom') return 0;

  const cleaned = fraction.replace(/["\s]/g, '');
  const parts = cleaned.split('/');

  if (parts.length === 2) {
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return Number(((numerator / denominator) * 25.4).toFixed(2));
    }
  }

  // Try parsing as decimal
  const decimal = parseFloat(cleaned);
  if (!isNaN(decimal)) {
    return Number((decimal * 25.4).toFixed(2));
  }

  return 0;
}

/**
 * Find diameter option by inch string
 */
export function findDiameterByInch(inch: string): FBHDiameterOption | undefined {
  return FBH_DIAMETER_OPTIONS.find(opt => opt.inch === inch);
}

/**
 * Find diameter option by mm value
 */
export function findDiameterByMm(mm: number, tolerance: number = 0.1): FBHDiameterOption | undefined {
  return FBH_DIAMETER_OPTIONS.find(opt => Math.abs(opt.mm - mm) <= tolerance);
}

/**
 * Find metal travel option by depth in mm
 */
export function findMetalTravelByDepth(depthMm: number, tolerance: number = 0.5): MetalTravelOption | undefined {
  return METAL_TRAVEL_OPTIONS.find(opt => Math.abs(opt.depthMm - depthMm) <= tolerance);
}

/**
 * Get options for a specific standard
 */
export function getDiametersByStandard(standard: string): FBHDiameterOption[] {
  if (standard === 'All') return FBH_DIAMETER_OPTIONS;
  return FBH_DIAMETER_OPTIONS.filter(opt => opt.standard.includes(standard));
}

export function getMetalTravelByStandard(standard: string): MetalTravelOption[] {
  if (standard === 'All') return METAL_TRAVEL_OPTIONS;
  return METAL_TRAVEL_OPTIONS.filter(opt => opt.standard.includes(standard));
}

export function getBlockHeightEByStandard(standard: string): BlockHeightEOption[] {
  if (standard === 'All') return BLOCK_HEIGHT_E_OPTIONS;
  return BLOCK_HEIGHT_E_OPTIONS.filter(opt => opt.standard.includes(standard));
}

/**
 * Available standards for filtering
 */
export const AVAILABLE_STANDARDS = [
  { id: 'All', label: 'All Standards' },
  { id: 'ASTM E127', label: 'ASTM E127' },
  { id: 'EN 10228-3', label: 'BS EN 10228-3' },
  { id: 'ASTM A388', label: 'ASTM A388' },
  { id: 'Metric', label: 'Metric' },
];
