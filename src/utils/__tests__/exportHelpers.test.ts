import { describe, expect, it } from "vitest";

import { getPartDimensionRows } from "../export/exportHelpers";

describe("getPartDimensionRows", () => {
  it("includes detailed HPT disk geometry rows and omits generic wall thickness", () => {
    const rows = getPartDimensionRows({
      standard: "NDIP-1226",
      partType: "hpt_disk",
      partThickness: 180.56,
      diameter: 523.54,
      innerDiameter: 147.83,
      wallThickness: 187.855,
      isHollow: true,
      hptDiskGeometry: {
        rimRootDiameterMm: 514.41,
        webMinThicknessMm: 36.2,
        boreBlendRadiusMm: 8.5,
        serrationCount: 72,
        inspectionBoreRadiusMm: 73.91,
        inspectionOffsetMm: 23.95,
        radialCoverageMm: 66.04,
        geometryNotes: "Front dish transitions to raised hub with stepped bore.",
      },
    });

    expect(rows).toContainEqual(["Overall Height", "180.6 mm"]);
    expect(rows).toContainEqual(["Max OD / Tip OD", "523.5 mm"]);
    expect(rows).toContainEqual(["Nominal Bore ID", "147.8 mm"]);
    expect(rows).toContainEqual(["Root / Base OD", "514.4 mm"]);
    expect(rows).toContainEqual(["Web Min Thickness", "36.2 mm"]);
    expect(rows).toContainEqual(["Bore Blend Radius", "8.5 mm"]);
    expect(rows).toContainEqual(["Serration Count", "72"]);
    expect(rows).toContainEqual(["Inspection Bore Radius", "73.91 mm"]);
    expect(rows).toContainEqual(["Inspection Offset", "23.95 mm"]);
    expect(rows).toContainEqual(["Radial Coverage", "66.04 mm"]);
    expect(rows).toContainEqual(["Geometry Notes", "Front dish transitions to raised hub with stepped bore."]);
    expect(rows.some(([label]) => label === "Wall Thickness")).toBe(false);
  });

  it("omits NDIP-only HPT inspection reference rows for non-NDIP standards", () => {
    const rows = getPartDimensionRows({
      standard: "AMS-STD-2154E",
      partType: "hpt_disk",
      hptDiskGeometry: {
        inspectionBoreRadiusMm: 73.91,
        inspectionOffsetMm: 23.95,
        radialCoverageMm: 66.04,
      },
    });

    expect(rows.some(([label]) => label === "Inspection Bore Radius")).toBe(false);
    expect(rows.some(([label]) => label === "Inspection Offset")).toBe(false);
    expect(rows.some(([label]) => label === "Radial Coverage")).toBe(false);
  });
});
