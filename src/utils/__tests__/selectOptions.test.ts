import { describe, expect, it } from "vitest";

import { includeCurrentOption } from "@/utils/selectOptions";

describe("includeCurrentOption", () => {
  it("prepends the current value when it is missing from the options", () => {
    expect(includeCurrentOption(["Annealed", "T6"], "Normalized and Tempered")).toEqual([
      "Normalized and Tempered",
      "Annealed",
      "T6",
    ]);
  });

  it("does not duplicate values when the current value already exists", () => {
    expect(includeCurrentOption(["Annealed", "T6"], "Annealed")).toEqual([
      "Annealed",
      "T6",
    ]);
  });

  it("replaces case-only matches with the exact current value", () => {
    expect(includeCurrentOption(["axial", "radial", "circumferential"], "Circumferential")).toEqual([
      "Circumferential",
      "axial",
      "radial",
    ]);
  });
});
