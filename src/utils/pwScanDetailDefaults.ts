import type { ScanDetail } from "@/types/scanDetails";
import type { StandardType } from "@/types/techniqueSheet";

const NDIP_1226_DIRECTIONS = ["E", "A", "B", "C", "D"] as const;
const NDIP_1227_DIRECTIONS = ["M", "N", "O", "P", "K", "L"] as const;

const NDIP_1226_SCAN_DETAILS: ScanDetail[] = [
  { scanningDirection: "E", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1226 Figure 2 zone E", enabled: false, entrySurface: "id", angle: 45, color: "#22c55e" },
  { scanningDirection: "A", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1226 Figure 2 zone A", enabled: false, entrySurface: "id", angle: 45, color: "#3b82f6" },
  { scanningDirection: "B", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1226 Figure 2 zone B", enabled: false, entrySurface: "id", angle: 45, color: "#f59e0b" },
  { scanningDirection: "C", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1226 Figure 2 zone C", enabled: false, entrySurface: "id", angle: 45, color: "#ef4444" },
  { scanningDirection: "D", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1226 Figure 2 zone D", enabled: false, entrySurface: "id", angle: 45, color: "#8b5cf6" },
];

const NDIP_1227_SCAN_DETAILS: ScanDetail[] = [
  { scanningDirection: "M", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone M", enabled: false, entrySurface: "id", angle: 45, color: "#22c55e" },
  { scanningDirection: "N", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone N", enabled: false, entrySurface: "id", angle: 45, color: "#3b82f6" },
  { scanningDirection: "O", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone O", enabled: false, entrySurface: "id", angle: 45, color: "#f59e0b" },
  { scanningDirection: "P", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone P", enabled: false, entrySurface: "id", angle: 45, color: "#ef4444" },
  { scanningDirection: "K", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone K", enabled: false, entrySurface: "id", angle: 45, color: "#8b5cf6" },
  { scanningDirection: "L", waveMode: "Circumferential shear wave +/-45", frequency: "5.0", make: "", probe: "", remarkDetails: "NDIP-1227 Figure 2 zone L", enabled: false, entrySurface: "id", angle: 45, color: "#14b8a6" },
];

const cloneScanDetails = (rows: ScanDetail[]): ScanDetail[] => rows.map((row) => ({ ...row }));

export const getV2500ScanDetailDefaults = (standard: StandardType): ScanDetail[] | null => {
  if (standard === "NDIP-1226") return cloneScanDetails(NDIP_1226_SCAN_DETAILS);
  if (standard === "NDIP-1227") return cloneScanDetails(NDIP_1227_SCAN_DETAILS);
  return null;
};

const hasExactDirections = (currentDirections: string[], expectedDirections: readonly string[]): boolean => {
  if (currentDirections.length !== expectedDirections.length) return false;
  return expectedDirections.every((direction) => currentDirections.includes(direction));
};

export const normalizeScanDetailsForStandard = (
  currentScanDetails: ScanDetail[] | undefined,
  standard: StandardType
): ScanDetail[] | null => {
  const current = currentScanDetails ?? [];
  const defaults = getV2500ScanDetailDefaults(standard);

  if (defaults) {
    return defaults.map((baseRow) => {
      const existing = current.find((row) => row.scanningDirection === baseRow.scanningDirection);
      return existing ? { ...baseRow, ...existing } : baseRow;
    });
  }

  const currentDirections = current.map((row) => row.scanningDirection);
  if (
    hasExactDirections(currentDirections, NDIP_1226_DIRECTIONS) ||
    hasExactDirections(currentDirections, NDIP_1227_DIRECTIONS)
  ) {
    // Moving away from V2500 NDIP: clear stale V2500 direction set so generic
    // defaults can be applied by the active scan-details UI.
    return [];
  }

  return null;
};

