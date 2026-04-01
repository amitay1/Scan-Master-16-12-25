import { readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { enrichMroAsset } from "../mroAssets";

describe("MRO asset catalog", () => {
  it("classifies every file in public/standards/MRO into a supported category", () => {
    const mroDir = resolve(process.cwd(), "public", "standards", "MRO");
    const files = readdirSync(mroDir).filter((name) => statSync(resolve(mroDir, name)).isFile());

    expect(files.length).toBeGreaterThan(0);

    for (const fileName of files) {
      const asset = enrichMroAsset({
        name: fileName,
        extension: extname(fileName).toLowerCase(),
        size: 1,
        assetUrl: `/api/mro-assets/file/${encodeURIComponent(fileName)}`,
        downloadUrl: `/api/mro-assets/file/${encodeURIComponent(fileName)}?download=1`,
      });

      expect(asset.category).not.toBe("other");
      expect(asset.categoryLabel.length).toBeGreaterThan(0);
      expect(asset.description.length).toBeGreaterThan(5);
    }
  });
});
