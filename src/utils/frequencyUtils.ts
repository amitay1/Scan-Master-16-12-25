import { StandardType } from "@/types/techniqueSheet";

/**
 * Get resolution values based on frequency (MIL-STD-2154 Table II)
 */
export const getResolutionValues = (frequency: string): { entry: number; back: number } => {
  const resolutions: Record<string, { entry: number; back: number }> = {
    "0.5": { entry: 1.000, back: 0.400 },   // 0.5 MHz (BS EN 10228-4)
    "1.0": { entry: 0.500, back: 0.200 },   // 1 MHz
    "2.0": { entry: 0.300, back: 0.120 },   // 2 MHz
    "2.25": { entry: 0.250, back: 0.100 },  // 2.25 MHz
    "4.0": { entry: 0.150, back: 0.060 },   // 4 MHz
    "5.0": { entry: 0.125, back: 0.050 },   // 5 MHz
    "10.0": { entry: 0.050, back: 0.025 },  // 10 MHz
    "15.0": { entry: 0.035, back: 0.020 },  // 15 MHz
  };
  return resolutions[frequency] || { entry: 0.125, back: 0.05 };
};

/**
 * Frequency options available for each standard
 */
export const frequencyOptionsByStandard: Record<StandardType, string[]> = {
  "MIL-STD-2154": ["1.0", "2.25", "5.0", "10.0", "15.0"],
  "AMS-STD-2154E": ["1.0", "2.25", "5.0", "10.0", "15.0"],
  "ASTM-A388": ["1.0", "2.25", "5.0"],
  "BS-EN-10228-3": ["1.0", "2.0", "4.0", "5.0"],
  "BS-EN-10228-4": ["0.5", "1.0", "2.0"],
};

/**
 * Get frequency options for a specific standard
 */
export const getFrequencyOptionsForStandard = (standard: StandardType): string[] => {
  return frequencyOptionsByStandard[standard] || frequencyOptionsByStandard["AMS-STD-2154E"];
};
