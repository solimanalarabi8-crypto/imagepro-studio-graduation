import { describe, it, expect } from "vitest";
import {
  blendModeToCompositeOp,
  clampOpacity,
  opacityToAlpha,
  detectHistoryAction,
  BLEND_MODE_OPTIONS,
} from "./layers-history";

describe("Phase 5: Layers & History Utilities", () => {
  describe("Opacity Calculations", () => {
    it("clamps opacity between 0 and 100", () => {
      expect(clampOpacity(150)).toBe(100);
      expect(clampOpacity(-20)).toBe(0);
      expect(clampOpacity(55.6)).toBe(56);
      expect(clampOpacity(undefined)).toBe(100);
    });

    it("converts opacity percentage to alpha fraction for Canvas", () => {
      expect(opacityToAlpha(100)).toBe(1.0);
      expect(opacityToAlpha(50)).toBe(0.5);
      expect(opacityToAlpha(0)).toBe(0.0);
      expect(opacityToAlpha(25)).toBe(0.25);
    });
  });

  describe("Blend Mode Conversions", () => {
    it("converts Arabic and English blend modes to standard Canvas GlobalCompositeOperation", () => {
      expect(blendModeToCompositeOp("عادي")).toBe("source-over");
      expect(blendModeToCompositeOp("normal")).toBe("source-over");
      expect(blendModeToCompositeOp("ضرب")).toBe("multiply");
      expect(blendModeToCompositeOp("multiply")).toBe("multiply");
      expect(blendModeToCompositeOp("شاشة")).toBe("screen");
      expect(blendModeToCompositeOp("screen")).toBe("screen");
      expect(blendModeToCompositeOp("تراكب")).toBe("overlay");
      expect(blendModeToCompositeOp("overlay")).toBe("overlay");
      expect(blendModeToCompositeOp("ضوء ناعم")).toBe("soft-light");
    });

    it("has complete blend mode options for UI selection", () => {
      expect(BLEND_MODE_OPTIONS.length).toBeGreaterThanOrEqual(5);
      expect(BLEND_MODE_OPTIONS.map((o) => o.id)).toContain("multiply");
      expect(BLEND_MODE_OPTIONS.map((o) => o.id)).toContain("screen");
    });
  });

  describe("History Action Detection", () => {
    it("detects opening initial project", () => {
      expect(detectHistoryAction(null, {})).toBe("فتح المشروع الأصلي");
    });

    it("detects brush stroke additions", () => {
      const prev = { strokes: [] };
      const next = { strokes: [{ mode: "brush" }] };
      expect(detectHistoryAction(prev, next)).toBe("رسم بالفرشاة");
    });

    it("detects eraser actions", () => {
      const prev = { strokes: [{ id: 1 }, { id: 2 }] };
      const next = { strokes: [{ id: 1 }] };
      expect(detectHistoryAction(prev, next)).toBe("مسح خطوط بالممحاة");
    });

    it("detects layer adjustments and opacity changes", () => {
      const prev = { layers: [{ id: "paint", opacity: 100 }] };
      const next = { layers: [{ id: "paint", opacity: 50 }] };
      expect(detectHistoryAction(prev, next)).toBe("تعديل خصائص الطبقات والشفافية");
    });
  });
});
