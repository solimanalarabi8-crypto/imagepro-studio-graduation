import { describe, it, expect } from "vitest";
import { DESIGN_TEMPLATES } from "./templates";

describe("Templates Catalog", () => {
  it("should contain standard social, marketing, and print templates", () => {
    expect(DESIGN_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    const ids = DESIGN_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("insta-square");
    expect(ids).toContain("story-vertical");
    expect(ids).toContain("ecommerce-banner");
    expect(ids).toContain("youtube-thumb");
  });

  it("each template should have positive width and height dimensions and bilingual descriptions", () => {
    DESIGN_TEMPLATES.forEach((t) => {
      expect(t.width).toBeGreaterThan(0);
      expect(t.height).toBeGreaterThan(0);
      expect(t.nameAr.length).toBeGreaterThan(0);
      expect(t.nameEn.length).toBeGreaterThan(0);
      expect(t.aspect.length).toBeGreaterThan(0);
    });
  });
});
