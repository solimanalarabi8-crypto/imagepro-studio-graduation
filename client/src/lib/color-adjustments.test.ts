import { describe, it, expect } from "vitest";
import {
  calculateHistogram,
  buildCssFilter,
  DEFAULT_ADJUSTMENTS,
} from "./color-adjustments";

describe("Point 5: Color Adjustments & Histogram", () => {
  describe("Histogram Calculation", () => {
    it("calculates correct 256-bin RGB and Luminance histograms", () => {
      // Create a 2x2 mock ImageData (4 pixels: Red, Green, Blue, White)
      const data = new Uint8ClampedArray([
        255, 0, 0, 255,     // Red
        0, 255, 0, 255,     // Green
        0, 0, 255, 255,     // Blue
        255, 255, 255, 255, // White
      ]);
      const mockImageData = { data, width: 2, height: 2 } as ImageData;

      const hist = calculateHistogram(mockImageData);

      expect(hist.r.length).toBe(256);
      expect(hist.g.length).toBe(256);
      expect(hist.b.length).toBe(256);
      expect(hist.lum.length).toBe(256);

      // Red channel has two 255 pixels (pure red + white)
      expect(hist.r[255]).toBe(2);
      expect(hist.r[0]).toBe(2);

      // Max count should be 2
      expect(hist.maxCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("CSS Filter Construction", () => {
    it("incorporates hue-rotate, brightness, contrast, and tone maps", () => {
      const filter = buildCssFilter({
        brightness: 15,
        contrast: 10,
        saturation: 110,
        hue: 45,
        grayscale: 0,
        sepia: 0,
        invert: 0,
      });

      expect(filter).toContain("brightness(115%)");
      expect(filter).toContain("contrast(110%)");
      expect(filter).toContain("saturate(110%)");
      expect(filter).toContain("hue-rotate(45deg)");
    });
  });

  describe("Default Adjustment Values for Reset", () => {
    it("has zero or baseline defaults for all sliders", () => {
      expect(DEFAULT_ADJUSTMENTS.brightness).toBe(0);
      expect(DEFAULT_ADJUSTMENTS.contrast).toBe(0);
      expect(DEFAULT_ADJUSTMENTS.saturation).toBe(100);
      expect(DEFAULT_ADJUSTMENTS.hue).toBe(0);
      expect(DEFAULT_ADJUSTMENTS.exposure).toBe(0);
      expect(DEFAULT_ADJUSTMENTS.temperature).toBe(0);
      expect(DEFAULT_ADJUSTMENTS.gamma).toBe(1.0);
    });
  });
});
