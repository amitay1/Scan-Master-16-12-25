import type { ScanDetail } from "@/types/scanDetails";
import type { StandardType } from "@/types/techniqueSheet";

export const ACTIVE_MRO_STANDARD_CODES = ["NDIP-1226", "NDIP-1227"] as const satisfies readonly StandardType[];
export const HIDDEN_LEGACY_OEM_STANDARD_CODES = [
  "NDIP-1254",
  "NDIP-1257",
  "NDIP-1260",
  "PWA-SIM",
] as const satisfies readonly StandardType[];
export const PW_OEM_STANDARD_CODES = [
  ...ACTIVE_MRO_STANDARD_CODES,
  ...HIDDEN_LEGACY_OEM_STANDARD_CODES,
] as const satisfies readonly StandardType[];

export const ACTIVE_MRO_PART_NUMBERS = ["2A5001", "2A4802"] as const;

export const MRO_STANDARD_BY_PART_NUMBER = {
  "2A5001": "NDIP-1226",
  "2A4802": "NDIP-1227",
} as const;

const SUPPORTED_MRO_ASSET_PATTERNS = [
  /\bNDIP[-\s]?1226\b/i,
  /\bNDIP[-\s]?1227\b/i,
  /\b2A5001\b/i,
  /\b2A4802\b/i,
  /\bV2500\b/i,
];

const MRO_DUPLICATE_SUFFIX_PATTERN = /_(\d+)(?=\.[^.]+$)/;
const GENERIC_CIRCUMFERENTIAL_SCAN_DIRECTIONS = new Set(["D", "E"]);
const GENERIC_ANGLE_BEAM_SCAN_DIRECTIONS = new Set(["F", "G", "H", "I", "J", "K"]);

export function isActiveMroStandard(
  standard?: string | null,
): standard is (typeof ACTIVE_MRO_STANDARD_CODES)[number] {
  return ACTIVE_MRO_STANDARD_CODES.some((code) => code === standard);
}

export function isHiddenLegacyOemStandard(
  standard?: string | null,
): standard is (typeof HIDDEN_LEGACY_OEM_STANDARD_CODES)[number] {
  return HIDDEN_LEGACY_OEM_STANDARD_CODES.some((code) => code === standard);
}

export function isPwOemStandard(
  standard?: string | null,
): standard is (typeof PW_OEM_STANDARD_CODES)[number] {
  return PW_OEM_STANDARD_CODES.some((code) => code === standard);
}

export function isPwaSimStandard(standard?: string | null): standard is "PWA-SIM" {
  return standard === "PWA-SIM";
}

export function isActiveMroPartNumber(
  partNumber?: string | null,
): partNumber is (typeof ACTIVE_MRO_PART_NUMBERS)[number] {
  const normalized = partNumber?.toUpperCase().replace(/\s+/g, "");
  return ACTIVE_MRO_PART_NUMBERS.some((code) => code === normalized);
}

export function inferMroStandardFromPartNumber(partNumber?: string | null): StandardType | null {
  if (!partNumber) {
    return null;
  }

  const normalized = partNumber.toUpperCase().replace(/\s+/g, "");
  return MRO_STANDARD_BY_PART_NUMBER[normalized as keyof typeof MRO_STANDARD_BY_PART_NUMBER] ?? null;
}

export function getActiveMroStage(
  standard?: string | null,
  partNumber?: string | null,
): 1 | 2 | null {
  if (standard === "NDIP-1226") return 1;
  if (standard === "NDIP-1227") return 2;

  const inferredStandard = inferMroStandardFromPartNumber(partNumber);
  if (inferredStandard === "NDIP-1226") return 1;
  if (inferredStandard === "NDIP-1227") return 2;

  return null;
}

export function hasKnownActiveMroContext(
  standard?: string | null,
  partNumber?: string | null,
): boolean {
  return getActiveMroStage(standard, partNumber) !== null;
}

export function isSupportedMroAssetName(name: string): boolean {
  return SUPPORTED_MRO_ASSET_PATTERNS.some((pattern) => pattern.test(name));
}

export function normalizeMroAssetVariantName(name: string): string {
  return name.replace(MRO_DUPLICATE_SUFFIX_PATTERN, "");
}

export function isMroDuplicateVariantName(name: string): boolean {
  return normalizeMroAssetVariantName(name) !== name;
}

export function deriveCalibrationScanDirectionInfo(
  scanDetails: ScanDetail[] | undefined,
  standard?: string | null,
): {
  hasCircumferentialScan: boolean;
  hasAngleBeam: boolean;
} {
  const enabledScanDetails = (scanDetails ?? []).filter((detail) => detail.enabled);

  if (enabledScanDetails.length === 0) {
    return {
      hasCircumferentialScan: false,
      hasAngleBeam: false,
    };
  }

  if (isActiveMroStandard(standard)) {
    return {
      hasCircumferentialScan: true,
      hasAngleBeam: enabledScanDetails.some(
        (detail) =>
          /shear|angle/i.test(detail.waveMode || "") ||
          (typeof detail.angle === "number" && detail.angle > 0),
      ),
    };
  }

  return {
    hasCircumferentialScan: enabledScanDetails.some((detail) =>
      GENERIC_CIRCUMFERENTIAL_SCAN_DIRECTIONS.has(detail.scanningDirection),
    ),
    hasAngleBeam: enabledScanDetails.some((detail) =>
      GENERIC_ANGLE_BEAM_SCAN_DIRECTIONS.has(detail.scanningDirection),
    ),
  };
}
