/**
 * Rules Module - Industry Standards and OEM-Specific Calibration Rules
 *
 * Exports:
 * - Generic impeller/blisk calibration standards
 * - PW (Pratt & Whitney) V2500 specific rules
 * - Future: GE, RR specific rules
 */

// Generic impeller/blisk calibration (aerospace industry standard)
export * from './impellerCalibration';

// OEM-specific rules
export * from './pw';
