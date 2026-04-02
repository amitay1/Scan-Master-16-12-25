import { describe, expect, it } from "vitest";

import {
  getActiveMroStage,
  isActiveMroStandard,
  isPwaSimStandard,
  isPwOemStandard,
} from "../mroPolicy";

describe("mroPolicy", () => {
  it("keeps active V2500 MRO standards separate from other PW OEM standards", () => {
    expect(isActiveMroStandard("NDIP-1226")).toBe(true);
    expect(isActiveMroStandard("NDIP-1227")).toBe(true);
    expect(isActiveMroStandard("NDIP-1254")).toBe(false);
    expect(isActiveMroStandard("PWA-SIM")).toBe(false);

    expect(isPwOemStandard("NDIP-1226")).toBe(true);
    expect(isPwOemStandard("NDIP-1254")).toBe(true);
    expect(isPwOemStandard("PWA-SIM")).toBe(true);
    expect(isPwOemStandard("AMS-STD-2154E")).toBe(false);
  });

  it("detects PWA-SIM without treating it as active V2500 MRO", () => {
    expect(isPwaSimStandard("PWA-SIM")).toBe(true);
    expect(isPwaSimStandard("NDIP-1226")).toBe(false);
  });

  it("infers active V2500 stage from standard or part number", () => {
    expect(getActiveMroStage("NDIP-1226")).toBe(1);
    expect(getActiveMroStage("NDIP-1227")).toBe(2);
    expect(getActiveMroStage(undefined, "2A5001")).toBe(1);
    expect(getActiveMroStage(undefined, "2a 4802")).toBe(2);
    expect(getActiveMroStage("NDIP-1254", "2A5001")).toBe(1);
    expect(getActiveMroStage("NDIP-1257")).toBeNull();
  });
});
