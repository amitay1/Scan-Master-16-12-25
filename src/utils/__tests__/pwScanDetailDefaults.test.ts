import { describe, expect, it } from "vitest";
import { getV2500ScanDetailDefaults, normalizeScanDetailsForStandard } from "@/utils/pwScanDetailDefaults";

describe("pwScanDetailDefaults", () => {
  it("returns Stage 1 directions for NDIP-1226", () => {
    const rows = getV2500ScanDetailDefaults("NDIP-1226");
    expect(rows?.map((r) => r.scanningDirection)).toEqual(["E", "A", "B", "C", "D"]);
  });

  it("returns Stage 2 directions for NDIP-1227", () => {
    const rows = getV2500ScanDetailDefaults("NDIP-1227");
    expect(rows?.map((r) => r.scanningDirection)).toEqual(["M", "N", "O", "P", "K", "L"]);
  });

  it("merges existing row values when normalizing an NDIP standard", () => {
    const normalized = normalizeScanDetailsForStandard(
      [
        {
          scanningDirection: "M",
          waveMode: "X",
          frequency: "5.0",
          make: "",
          probe: "",
          remarkDetails: "",
          enabled: true,
        },
      ],
      "NDIP-1227"
    );

    const rowM = normalized?.find((r) => r.scanningDirection === "M");
    expect(rowM?.enabled).toBe(true);
    expect(normalized?.map((r) => r.scanningDirection)).toEqual(["M", "N", "O", "P", "K", "L"]);
  });

  it("clears stale V2500 rows when switching to a non-NDIP standard", () => {
    const normalized = normalizeScanDetailsForStandard(
      [
        { scanningDirection: "E", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "A", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "B", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "C", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "D", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
      ],
      "AMS-STD-2154E"
    );

    expect(normalized).toEqual([]);
  });

  it("does not touch non-NDIP generic rows", () => {
    const normalized = normalizeScanDetailsForStandard(
      [
        { scanningDirection: "A", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "B", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
        { scanningDirection: "C", waveMode: "", frequency: "", make: "", probe: "", remarkDetails: "", enabled: false },
      ],
      "AMS-STD-2154E"
    );

    expect(normalized).toBeNull();
  });
});

