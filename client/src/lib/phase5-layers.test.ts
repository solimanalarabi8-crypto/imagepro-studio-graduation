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

  describe("Deep Layer Order Manipulations", () => {
    const createTestLayers = (): import("./layers-history").LayerInfo[] => [
      { id: "text-1", name: "نص التخرج", kind: "text", color: "#60a5fa", visible: true, opacity: 100 },
      { id: "paint-1", name: "طبقة رسم", kind: "paint", color: "#2dd4bf", visible: true, opacity: 100 },
      { id: "subject-1", name: "العنصر المعزول", kind: "subject", color: "#ec4899", visible: true, opacity: 100 },
      { id: "image-1", name: "الصورة الأصلية", kind: "image", color: "#d7b58a", visible: true, opacity: 100 },
      { id: "background", name: "الخلفية", kind: "background", color: "#8d8b87", visible: true, opacity: 100 },
    ];

    it("moves selected layer directly to top (making it the first layer)", async () => {
      const { moveLayerToTop } = await import("./layers-history");
      const layers = createTestLayers();
      
      // Move "subject-1" (index 2) to top
      const res = moveLayerToTop(layers, "subject-1");
      expect(res.success).toBe(true);
      expect(res.layers[0].id).toBe("subject-1");
      expect(res.layers[1].id).toBe("text-1");
      expect(res.layers.length).toBe(layers.length);

      // Moving already top layer
      const resTop = moveLayerToTop(res.layers, "subject-1");
      expect(resTop.success).toBe(false);
      expect(resTop.layers[0].id).toBe("subject-1");

      // Background cannot be moved to top
      const resBg = moveLayerToTop(layers, "background");
      expect(resBg.success).toBe(false);
    });

    it("moves selected layer to bottom (above background)", async () => {
      const { moveLayerToBottom } = await import("./layers-history");
      const layers = createTestLayers();

      // Move "text-1" (index 0) to bottom (above background at index 4)
      const res = moveLayerToBottom(layers, "text-1");
      expect(res.success).toBe(true);
      // Background must remain at index 4, text-1 should be at index 3
      expect(res.layers[3].id).toBe("text-1");
      expect(res.layers[4].id).toBe("background");

      // Background cannot be moved
      const resBg = moveLayerToBottom(layers, "background");
      expect(resBg.success).toBe(false);
    });

    it("moves selected layer one step up and down", async () => {
      const { moveLayerUp, moveLayerDown } = await import("./layers-history");
      const layers = createTestLayers();

      // Move paint-1 (index 1) up -> should become index 0
      const resUp = moveLayerUp(layers, "paint-1");
      expect(resUp.success).toBe(true);
      expect(resUp.layers[0].id).toBe("paint-1");

      // Move paint-1 (index 1) down -> should become index 2
      const resDown = moveLayerDown(layers, "paint-1");
      expect(resDown.success).toBe(true);
      expect(resDown.layers[2].id).toBe("paint-1");
    });

    it("reorders layers via drag-and-drop", async () => {
      const { reorderLayers } = await import("./layers-history");
      const layers = createTestLayers();

      // Drag subject-1 (from index 2 to index 0)
      const res = reorderLayers(layers, 2, 0);
      expect(res.success).toBe(true);
      expect(res.layers[0].id).toBe("subject-1");
    });

    it("supports layer solo / isolate mode and restores state on toggle", async () => {
      const { toggleLayerSolo } = await import("./layers-history");
      const layers = createTestLayers();

      // Activate solo on "subject-1"
      const soloResult = toggleLayerSolo(layers, "subject-1", null);
      expect(soloResult.nextSoloId).toBe("subject-1");
      expect(soloResult.nextLayers.find(l => l.id === "subject-1")?.visible).toBe(true);
      expect(soloResult.nextLayers.find(l => l.id === "text-1")?.visible).toBe(false);
      expect(soloResult.nextLayers.find(l => l.id === "paint-1")?.visible).toBe(false);

      // Deactivate solo by clicking same layer again
      const restoreResult = toggleLayerSolo(
        soloResult.nextLayers,
        "subject-1",
        soloResult.nextSoloId,
        soloResult.nextSavedVisibilities
      );
      expect(restoreResult.nextSoloId).toBe(null);
      expect(restoreResult.nextLayers.every(l => l.visible === true)).toBe(true);
    });

    it("duplicates a selected layer with a new unique id", async () => {
      const { duplicateLayer } = await import("./layers-history");
      const layers = createTestLayers();

      const res = duplicateLayer(layers, "paint-1");
      expect(res.newLayerId).toBeDefined();
      expect(res.layers.length).toBe(layers.length + 1);
      const dup = res.layers.find(l => l.id === res.newLayerId);
      expect(dup?.name).toContain("نسخة");
      expect(dup?.kind).toBe("paint");
    });
  });
});
