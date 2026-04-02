import { describe, expect, it } from "vitest";

import {
  getInspectionSetupStandardProfile,
  normalizeInspectionSetupForStandard,
} from "../inspectionSetupProfiles";

describe("inspectionSetupProfiles", () => {
  it("locks NDIP-1226 to hpt_disk and enables MRO-only controls", () => {
    const profile = getInspectionSetupStandardProfile("NDIP-1226");

    expect(profile.lockedPartType).toBe("hpt_disk");
    expect(profile.showMroReferenceLibrary).toBe(true);
    expect(profile.showNdipHptInspectionFields).toBe(true);
    expect(profile.allowedPartTypes).toEqual(["hpt_disk"]);
  });

  it("normalizes disallowed part types away when switching to a narrow standard profile", () => {
    const normalized = normalizeInspectionSetupForStandard(
      {
        partNumber: "",
        partName: "",
        material: "",
        materialSpec: "",
        partType: "hpt_disk",
        partThickness: 25,
        partLength: 100,
        partWidth: 50,
        diameter: 0,
      },
      "PWA-SIM",
    );

    expect(normalized.partType).toBe("");
  });
});

