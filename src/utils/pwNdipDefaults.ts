import type { GateSettings, ScanDetail } from "@/types/scanDetails";
import type { InspectionSetupData, StandardType } from "@/types/techniqueSheet";

type V2500Standard = "NDIP-1226" | "NDIP-1227";

const SQRT_2 = Math.SQRT2;

type GateFieldKey = "gate1" | "gate2" | "gate3" | "gate4";

const GATE_KEYS: GateFieldKey[] = ["gate1", "gate2", "gate3", "gate4"];

const V2500_SETUP_DEFAULTS: Record<V2500Standard, Partial<InspectionSetupData>> = {
  "NDIP-1226": {
    partType: "hpt_disk",
    partNumber: "2A5001",
    partName: "HPT Disk First Stage",
    material: "nickel_alloy",
    materialSpec: "Powdered Nickel Metal",
    oemVendor: "PW",
  },
  "NDIP-1227": {
    partType: "hpt_disk",
    partNumber: "2A4802",
    partName: "HPT Disk Second Stage",
    material: "nickel_alloy",
    materialSpec: "Powdered Nickel Metal",
    oemVendor: "PW",
  },
};

const V2500_PART_TYPE_LABELS: Record<V2500Standard, string> = {
  "NDIP-1226": "HPT Disk First Stage",
  "NDIP-1227": "HPT Disk Second Stage",
};

const NDIP_1226_GATE_SCHEME: Record<string, GateSettings[]> = {
  A: [
    { position: 0.1, start: 0.12, stop: 1.414 },
    { position: 1.06, start: 0.12, stop: 1.414 },
  ],
  B: [
    { position: 0, start: 0.75 / SQRT_2, stop: 3.3 / SQRT_2 },
    { position: 0.45, start: 0.75 / SQRT_2, stop: 3.3 / SQRT_2 },
  ],
  C: [
    { position: 0, start: 0.7 / SQRT_2, stop: 2.3 / SQRT_2 },
    { position: 0.13, start: 0.7 / SQRT_2, stop: 2.3 / SQRT_2 },
    { position: 0.335, start: 0.7 / SQRT_2, stop: 1.85 / SQRT_2 },
  ],
  D: [
    { position: 0.1, start: 0.12, stop: 0.8 / SQRT_2 },
    { position: 1.2, start: 0.12, stop: 2 / SQRT_2 },
    { position: 2.3, start: 0.12, stop: 1.7 / SQRT_2 },
  ],
  E: [
    { position: 0, start: 0.12, stop: 1.414 },
    { position: 0.5, start: 0.12, stop: 1.6 / SQRT_2 },
  ],
};

const NDIP_1227_GATE_SCHEME: Record<string, GateSettings[]> = {
  K: [
    { position: 0.84, start: 0.7 / SQRT_2, stop: 0.9 / SQRT_2 },
    { position: 0.84 + 1.4, start: 0.7 / SQRT_2, stop: 3.54 / SQRT_2 },
  ],
  L: [
    { position: 0, start: 0.354, stop: 3.54 / SQRT_2 },
    { position: 1, start: 0.354, stop: 3 / SQRT_2 },
  ],
  M: [
    { position: 0, start: 0.354, stop: 0.707 },
    { position: 2, start: 0.354, stop: 2.121 },
  ],
  N: [
    { position: "Too much noise, do not scan" },
  ],
  O: [
    { position: 0, start: 0.75 / SQRT_2, stop: 3.125 / SQRT_2 },
    { position: 0.46, start: 0.75 / SQRT_2, stop: 3.125 / SQRT_2 },
  ],
  P: [
    { position: 0.05, start: 0.17 / SQRT_2, stop: 0.707 },
    { position: 1, start: 0.17 / SQRT_2, stop: 2.5 / SQRT_2 },
    { position: 1.7, start: 0.17 / SQRT_2, stop: 2.5 / SQRT_2 },
    { position: 2.5, start: 0.17 / SQRT_2, stop: 0.707 },
  ],
};

const V2500_GATE_SCHEMES: Record<V2500Standard, Record<string, GateSettings[]>> = {
  "NDIP-1226": NDIP_1226_GATE_SCHEME,
  "NDIP-1227": NDIP_1227_GATE_SCHEME,
};

export const isV2500NdipStandard = (
  standard?: StandardType | string | null
): standard is V2500Standard => standard === "NDIP-1226" || standard === "NDIP-1227";

export const getV2500PartTypeLabel = (standard?: StandardType | string | null): string => {
  if (!isV2500NdipStandard(standard)) {
    return "HPT Disk";
  }
  return V2500_PART_TYPE_LABELS[standard];
};

export const getV2500InspectionSetupDefaults = (
  standard?: StandardType | string | null
): Partial<InspectionSetupData> | null => {
  if (!isV2500NdipStandard(standard)) {
    return null;
  }

  return V2500_SETUP_DEFAULTS[standard];
};

const cloneGate = (gate: GateSettings): GateSettings => ({ ...gate });

export const getV2500GateSettingsForDirection = (
  standard: V2500Standard,
  direction: string
): Partial<ScanDetail> => {
  const gates = V2500_GATE_SCHEMES[standard][direction] || [];

  return gates.reduce<Partial<ScanDetail>>((accumulator, gate, index) => {
    const gateKey = GATE_KEYS[index];
    if (!gateKey) {
      return accumulator;
    }

    accumulator[gateKey] = cloneGate(gate);
    return accumulator;
  }, {});
};
