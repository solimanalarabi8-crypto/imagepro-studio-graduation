import { describe, it, expect } from "vitest";
import { FILTER_CATALOG, type FilterMode, type FilterCategory } from "./filters-engine";

describe("Point 6: Filters & Effects Catalog", () => {
  it("contains all 7 required filter categories", () => {
    const categories = new Set(FILTER_CATALOG.map((f) => f.category));
    expect(categories.has("تمويه")).toBe(true);
    expect(categories.has("حدة")).toBe(true);
    expect(categories.has("حواف")).toBe(true);
    expect(categories.has("ضوضاء")).toBe(true);
    expect(categories.has("هندسية")).toBe(true);
    expect(categories.has("لونية")).toBe(true);
    expect(categories.has("فنية")).toBe(true);
  });

  it("contains all filters specified in graduation plan table", () => {
    const ids = FILTER_CATALOG.map((f) => f.id);
    // Blur group
    expect(ids).toContain("blur");
    expect(ids).toContain("box_blur");
    expect(ids).toContain("motion");
    // Sharpen group
    expect(ids).toContain("sharpen");
    expect(ids).toContain("unsharp");
    // Edges group
    expect(ids).toContain("sobel");
    expect(ids).toContain("canny");
    expect(ids).toContain("edges");
    expect(ids).toContain("emboss");
    // Noise group
    expect(ids).toContain("noise");
    expect(ids).toContain("median");
    expect(ids).toContain("bilateral");
    // Geometric group
    expect(ids).toContain("pixelate");
    expect(ids).toContain("posterize");
    // Color group
    expect(ids).toContain("vintage");
    expect(ids).toContain("sepia");
    expect(ids).toContain("vignette");
    expect(ids).toContain("duotone");
    // Artistic group
    expect(ids).toContain("sketch");
    expect(ids).toContain("oil");
    expect(ids).toContain("charcoal");
  });

  it("provides Arabic names and valid default intensities for every filter", () => {
    for (const filter of FILTER_CATALOG) {
      expect(filter.nameArabic.length).toBeGreaterThan(0);
      expect(filter.description.length).toBeGreaterThan(0);
      expect(filter.defaultIntensity).toBeGreaterThanOrEqual(0);
      expect(filter.defaultIntensity).toBeLessThanOrEqual(100);
    }
  });

  it("groups filters correctly by category", () => {
    const blurFilters = FILTER_CATALOG.filter((f) => f.category === "تمويه");
    expect(blurFilters.length).toBe(3);

    const artisticFilters = FILTER_CATALOG.filter((f) => f.category === "فنية");
    expect(artisticFilters.some((f) => f.id === "oil")).toBe(true);
    expect(artisticFilters.some((f) => f.id === "charcoal")).toBe(true);
    expect(artisticFilters.some((f) => f.id === "sketch")).toBe(true);
  });

  it("exports generateFilterPreviews function", async () => {
    const { generateFilterPreviews } = await import("./filters-engine");
    expect(typeof generateFilterPreviews).toBe("function");
  });
});
