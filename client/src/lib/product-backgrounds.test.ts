import { describe, it, expect } from "vitest";
import { PRODUCT_BACKGROUNDS, generateProductBackgroundUrl } from "./product-backgrounds";

describe("Product Showcase Backgrounds Engine", () => {
  it("should have all 8 procedural studio backgrounds properly configured", () => {
    expect(PRODUCT_BACKGROUNDS.length).toBe(8);
    const ids = PRODUCT_BACKGROUNDS.map((p) => p.id);
    expect(ids).toContain("luxury-marble");
    expect(ids).toContain("soft-studio");
    expect(ids).toContain("minimal-wood");
    expect(ids).toContain("cyberpunk-neon");
    expect(ids).toContain("pastel-geometric");
    expect(ids).toContain("royal-gold");
    expect(ids).toContain("nature-bokeh");
    expect(ids).toContain("reflective-glass");
  });

  it("each preset should have Arabic, English names and a render function", () => {
    PRODUCT_BACKGROUNDS.forEach((preset) => {
      expect(preset.nameAr).toBeDefined();
      expect(preset.nameEn).toBeDefined();
      expect(typeof preset.render).toBe("function");
      expect(preset.category).toMatch(/luxury|studio|natural|creative/);
    });
  });
});
