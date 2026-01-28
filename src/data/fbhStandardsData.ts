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
  // Extended metric heights (up to 350mm)
  { id: 'metric_125', heightMm: 125.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_150', heightMm: 150.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_175', heightMm: 175.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_200', heightMm: 200.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_225', heightMm: 225.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_250', heightMm: 250.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_275', heightMm: 275.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_300', heightMm: 300.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_325', heightMm: 325.0, heightInch: '-', standard: 'Metric' },
  { id: 'metric_350', heightMm: 350.0, heightInch: '-', standard: 'Metric' },
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
  soundPath?: string;        // Sound path (optional, for angle beam only)
  isCustom?: boolean;        // True if custom values entered
}

// Default 3 holes for Straight Beam table - RECOMMENDED values for DAC curve construction
// Uses 3 different depths: 1", 2", 3" for proper area-amplitude calibration per ASTM E127
// FBH diameter 3/64" (1.19mm) is standard for AAA/AA acceptance class
export const DEFAULT_FBH_HOLES: FBHHoleRowData[] = [
  { id: 1, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 25.40, metalTravelH: 25.40 },   // 1" depth
  { id: 2, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 50.80, metalTravelH: 50.80 },   // 2" depth
  { id: 3, partNumber: '', deltaType: 'area', diameterInch: '3/64', diameterMm: 1.19, blockHeightE: 76.20, metalTravelH: 76.20 },   // 3" depth
];

// Default 3 holes for Angle Beam table (SDH configuration per EN 1714 / AWS D1.1)
// Uses DAC (Distance Amplitude Correction) with SDH reflectors at T/4, T/2, T/3/4 positions
// SDH diameter: 1.5mm (4/64" = 1.59mm is closest standard inch size)
// Block height: 25mm typical for angle beam calibration
// Depths represent quarter, half, and three-quarter positions
export const DEFAULT_ANGLE_BEAM_HOLES: FBHHoleRowData[] = [
  { id: 1, partNumber: '', deltaType: 'dac', diameterInch: '4/64', diameterMm: 1.59, blockHeightE: 25.0, metalTravelH: 6.35, soundPath: '' },
  { id: 2, partNumber: '', deltaType: 'dac', diameterInch: '4/64', diameterMm: 1.59, blockHeightE: 25.0, metalTravelH: 12.70, soundPath: '' },
  { id: 3, partNumber: '', deltaType: 'dac', diameterInch: '4/64', diameterMm: 1.59, blockHeightE: 25.0, metalTravelH: 19.05, soundPath: '' },
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

// ============================================================================
// ANGLE BEAM CALIBRATION - REFLECTOR TYPES
// ============================================================================

export type ReflectorType = 'FBH' | 'SDH' | 'Notch_EDM' | 'Notch_Saw';

export interface ReflectorTypeOption {
  id: ReflectorType;
  label: string;
  description: string;
}

export const REFLECTOR_TYPE_OPTIONS: ReflectorTypeOption[] = [
  { id: 'FBH', label: 'FBH', description: 'Flat Bottom Hole' },
  { id: 'SDH', label: 'SDH', description: 'Side Drilled Hole' },
  { id: 'Notch_EDM', label: 'Notch (EDM)', description: 'EDM Notch' },
  { id: 'Notch_Saw', label: 'Notch (Saw)', description: 'Saw Cut Notch' },
];

// ============================================================================
// ANGLE BEAM CALIBRATION - ROW DATA STRUCTURE
// ============================================================================

export interface AngleBeamCalibrationRow {
  id: number;
  reflectorType: ReflectorType;
  reflectorSizeMm: number;       // Diameter (mm) for FBH/SDH, or length for notch
  acceptanceSizeInch: string;    // e.g., "3/64" - acceptance size in inches
  acceptanceSizeMm: number;      // e.g., 1.19 - acceptance size in mm
  sizeDbCorrection: number;      // Size ΔdB (auto-calculated)
  transferDbCorrection: number;  // Transfer ΔdB (manual entry)
  totalDb: number;               // Auto-calculated: sizeDb + transferDb
  depthMm: number;               // Depth position in mm
  soundPathMm: number;           // Sound path in mm
  notes: string;                 // Free text
}

// Default 3 rows for Angle Beam calibration table
export const DEFAULT_ANGLE_BEAM_CALIBRATION_ROWS: AngleBeamCalibrationRow[] = [
  {
    id: 1,
    reflectorType: 'SDH',
    reflectorSizeMm: 1.5,
    acceptanceSizeInch: '3/64',
    acceptanceSizeMm: 1.19,
    sizeDbCorrection: 0,
    transferDbCorrection: 0,
    totalDb: 0,
    depthMm: 6.35,
    soundPathMm: 0,
    notes: '',
  },
  {
    id: 2,
    reflectorType: 'SDH',
    reflectorSizeMm: 1.5,
    acceptanceSizeInch: '3/64',
    acceptanceSizeMm: 1.19,
    sizeDbCorrection: 0,
    transferDbCorrection: 0,
    totalDb: 0,
    depthMm: 12.70,
    soundPathMm: 0,
    notes: '',
  },
  {
    id: 3,
    reflectorType: 'SDH',
    reflectorSizeMm: 1.5,
    acceptanceSizeInch: '3/64',
    acceptanceSizeMm: 1.19,
    sizeDbCorrection: 0,
    transferDbCorrection: 0,
    totalDb: 0,
    depthMm: 19.05,
    soundPathMm: 0,
    notes: '',
  },
];

// ============================================================================
// ANGLE BEAM CALIBRATION - HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate size dB correction using the 6 dB per doubling rule
 * Formula: dB = 20 * log10(actual/reference)
 * Examples:
 *   - Same size → 0 dB
 *   - Half size → -6 dB
 *   - Double size → +6 dB
 */
export function calculateSizeDbCorrection(
  actualSizeMm: number,
  referenceSizeMm: number
): number {
  if (actualSizeMm <= 0 || referenceSizeMm <= 0) return 0;
  // 6 dB per doubling: dB = 20 * log10(actual/reference)
  return Number((20 * Math.log10(actualSizeMm / referenceSizeMm)).toFixed(1));
}

/**
 * Calculate sound path from depth and beam angle
 * Formula: soundPath = depth / cos(angle)
 * @param depthMm - Depth in mm
 * @param beamAngleDegrees - Beam angle in degrees (e.g., 45, 60, 70)
 * @returns Sound path in mm
 */
export function calculateSoundPath(
  depthMm: number,
  beamAngleDegrees: number
): number {
  if (depthMm <= 0 || beamAngleDegrees <= 0 || beamAngleDegrees >= 90) return depthMm;
  const angleRadians = (beamAngleDegrees * Math.PI) / 180;
  return Number((depthMm / Math.cos(angleRadians)).toFixed(1));
}

// ============================================================================
// AMS-STD-2154 REFLECTOR EQUIVALENCY CONVERSIONS
// FBH ↔ SDH ↔ Notch approximate equivalencies
// Based on AMS-STD-2154E and general UT practice (area-amplitude relationships)
// ============================================================================

/**
 * Reflector equivalency table per AMS-STD-2154
 * Each entry maps an FBH size to approximate SDH and Notch equivalents.
 * SDH equivalency: based on cylindrical vs disc reflector response ratio
 * Notch equivalency: depth × length format, based on corner reflector response
 */
export interface ReflectorEquivalency {
  fbhInch: string;
  fbhMm: number;
  sdhMm: number;          // Equivalent SDH diameter (mm)
  notchDepthMm: number;   // Equivalent notch depth (mm)
  notchLengthMm: number;  // Equivalent notch length (mm)
}

export const REFLECTOR_EQUIVALENCY_TABLE: ReflectorEquivalency[] = [
  { fbhInch: '1/64', fbhMm: 0.40, sdhMm: 0.5,  notchDepthMm: 0.25, notchLengthMm: 5 },
  { fbhInch: '2/64', fbhMm: 0.79, sdhMm: 1.0,  notchDepthMm: 0.5,  notchLengthMm: 5 },
  { fbhInch: '3/64', fbhMm: 1.19, sdhMm: 1.5,  notchDepthMm: 0.75, notchLengthMm: 10 },
  { fbhInch: '4/64', fbhMm: 1.59, sdhMm: 2.0,  notchDepthMm: 1.0,  notchLengthMm: 10 },
  { fbhInch: '5/64', fbhMm: 1.98, sdhMm: 2.4,  notchDepthMm: 1.25, notchLengthMm: 10 },
  { fbhInch: '6/64', fbhMm: 2.38, sdhMm: 2.8,  notchDepthMm: 1.5,  notchLengthMm: 10 },
  { fbhInch: '7/64', fbhMm: 2.78, sdhMm: 3.0,  notchDepthMm: 1.75, notchLengthMm: 10 },
  { fbhInch: '8/64', fbhMm: 3.18, sdhMm: 3.5,  notchDepthMm: 2.0,  notchLengthMm: 10 },
];

/**
 * Convert any reflector type/size to its FBH equivalent (inch string + mm)
 * Uses interpolation between known equivalency points.
 * Returns the closest FBH equivalent for display purposes.
 */
export function convertToFBHEquivalent(
  reflectorType: ReflectorType,
  sizeMm: number
): { fbhInch: string; fbhMm: number; description: string } | null {
  if (sizeMm <= 0) return null;

  // FBH → itself
  if (reflectorType === 'FBH') {
    const match = REFLECTOR_EQUIVALENCY_TABLE.find(e => Math.abs(e.fbhMm - sizeMm) < 0.15);
    if (match) return { fbhInch: match.fbhInch, fbhMm: match.fbhMm, description: `FBH ${match.fbhInch}"` };
    return { fbhInch: '-', fbhMm: sizeMm, description: `FBH ${sizeMm.toFixed(2)}mm` };
  }

  // SDH → FBH
  if (reflectorType === 'SDH') {
    // Find closest SDH match in equivalency table
    let best = REFLECTOR_EQUIVALENCY_TABLE[0];
    let bestDiff = Math.abs(best.sdhMm - sizeMm);
    for (const entry of REFLECTOR_EQUIVALENCY_TABLE) {
      const diff = Math.abs(entry.sdhMm - sizeMm);
      if (diff < bestDiff) { best = entry; bestDiff = diff; }
    }
    // If close match found (within 0.3mm)
    if (bestDiff <= 0.3) {
      return { fbhInch: best.fbhInch, fbhMm: best.fbhMm, description: `≈ FBH ${best.fbhInch}" (${best.fbhMm}mm)` };
    }
    // Interpolate: SDH/FBH ratio is roughly 1.26 based on table
    const estimatedFbhMm = sizeMm / 1.26;
    const closest = FBH_DIAMETER_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr.mm - estimatedFbhMm) < Math.abs(prev.mm - estimatedFbhMm) ? curr : prev
    );
    return { fbhInch: closest.inch, fbhMm: closest.mm, description: `≈ FBH ${closest.inch !== '-' ? closest.inch + '"' : closest.mm + 'mm'} (${closest.mm}mm)` };
  }

  // Notch → FBH (based on notch depth)
  if (reflectorType === 'Notch_EDM' || reflectorType === 'Notch_Saw') {
    let best = REFLECTOR_EQUIVALENCY_TABLE[0];
    let bestDiff = Math.abs(best.notchDepthMm - sizeMm);
    for (const entry of REFLECTOR_EQUIVALENCY_TABLE) {
      const diff = Math.abs(entry.notchDepthMm - sizeMm);
      if (diff < bestDiff) { best = entry; bestDiff = diff; }
    }
    if (bestDiff <= 0.3) {
      return { fbhInch: best.fbhInch, fbhMm: best.fbhMm, description: `≈ FBH ${best.fbhInch}" (${best.fbhMm}mm)` };
    }
    // Rough estimate: notch depth ≈ FBH/1.6
    const estimatedFbhMm = sizeMm * 1.6;
    const closest = FBH_DIAMETER_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr.mm - estimatedFbhMm) < Math.abs(prev.mm - estimatedFbhMm) ? curr : prev
    );
    return { fbhInch: closest.inch, fbhMm: closest.mm, description: `≈ FBH ${closest.inch !== '-' ? closest.inch + '"' : closest.mm + 'mm'} (${closest.mm}mm)` };
  }

  return null;
}

/**
 * Calculate total dB correction
 */
export function calculateTotalDb(
  sizeDbCorrection: number,
  transferDbCorrection: number
): number {
  return Number((sizeDbCorrection + transferDbCorrection).toFixed(1));
}
