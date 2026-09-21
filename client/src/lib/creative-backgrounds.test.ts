import { describe, it, expect } from "vitest";
import {
  CREATIVE_BACKDROPS,
  CREATIVE_BACKDROP_CATEGORIES,
  type BackdropCategory
} from "./creative-backgrounds";

describe("Creative Backdrops Catalog", () => {
  it("contains all 12 specified categories plus all", () => {
    const expectedCategories: BackdropCategory[] = [
      "product", "studio", "luxury", "nature", "technology", "food",
      "fashion", "beauty", "business", "abstract", "3d", "minimal"
    ];
    
    expect(CREATIVE_BACKDROP_CATEGORIES.length).toBe(13);
    expectedCategories.forEach(cat => {
      const found = CREATIVE_BACKDROP_CATEGORIES.some(c => c.id === cat);
      expect(found).toBe(true);
    });
  });

  it("contains presets for each category with valid properties and tags", () => {
    expect(CREATIVE_BACKDROPS.length).toBeGreaterThanOrEqual(12);

    CREATIVE_BACKDROPS.forEach(backdrop => {
      expect(backdrop.id).toBeTruthy();
      expect(backdrop.nameAr).toBeTruthy();
      expect(backdrop.nameEn).toBeTruthy();
      expect(backdrop.category).toBeTruthy();
      expect(Array.isArray(backdrop.tags)).toBe(true);
      expect(backdrop.tags.length).toBeGreaterThan(0);
      expect(typeof backdrop.render).toBe("function");
    });
  });
});
