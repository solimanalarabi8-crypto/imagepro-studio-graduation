import { describe, it, expect } from "vitest";
import {
  EDITABLE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateCategory
} from "./editable-templates";

describe("Editable Templates Studio", () => {
  it("defines standard social and commercial categories", () => {
    const expected: TemplateCategory[] = ["instagram", "tiktok", "youtube", "ads", "ecommerce", "business"];
    expected.forEach(cat => {
      const found = TEMPLATE_CATEGORIES.some(c => c.id === cat);
      expect(found).toBe(true);
    });
  });

  it("ensures each template has true multi-layer definitions (background, shape, text)", () => {
    expect(EDITABLE_TEMPLATES.length).toBeGreaterThanOrEqual(6);

    EDITABLE_TEMPLATES.forEach(tpl => {
      expect(tpl.id).toBeTruthy();
      expect(tpl.width).toBeGreaterThan(0);
      expect(tpl.height).toBeGreaterThan(0);
      expect(tpl.layers.length).toBeGreaterThanOrEqual(2);

      const hasBackground = tpl.layers.some(l => l.kind === "background");
      expect(hasBackground).toBe(true);

      const hasTextOrShape = tpl.layers.some(l => l.kind === "text" || l.kind === "shape");
      expect(hasTextOrShape).toBe(true);
      expect(typeof tpl.renderPreview).toBe("function");
    });
  });
});
