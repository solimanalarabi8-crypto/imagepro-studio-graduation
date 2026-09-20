import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  isProjectFile,
  isSupportedImageFile,
  calculateFittedPlacement,
} from "./smart-drop-hub";

describe("Smart Drop Hub Engine", () => {
  describe("formatFileSize", () => {
    it("formats bytes, kilobytes, and megabytes accurately", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(512)).toBe("512 B");
      expect(formatFileSize(2048)).toBe("2.0 KB");
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.50 MB");
    });
  });

  describe("file type detection", () => {
    it("identifies .imagepro project files", () => {
      expect(isProjectFile({ name: "design.imagepro" })).toBe(true);
      expect(isProjectFile({ name: "my_project.json", type: "application/json" })).toBe(true);
      expect(isProjectFile({ name: "photo.jpg" })).toBe(false);
    });

    it("identifies supported image files", () => {
      expect(isSupportedImageFile({ name: "photo.png" })).toBe(true);
      expect(isSupportedImageFile({ name: "graphic.webp" })).toBe(true);
      expect(isSupportedImageFile({ name: "icon.svg" })).toBe(true);
      expect(isSupportedImageFile({ name: "document.pdf" })).toBe(false);
    });
  });

  describe("calculateFittedPlacement", () => {
    it("fits oversized images proportionally within canvas with centering", () => {
      const placement = calculateFittedPlacement(2000, 1000, 1000, 1000, 0.8);
      // Max allowed W = 800, max allowed H = 800.
      // Aspect ratio 2:1 -> W should scale to 800, H to 400.
      expect(placement.width).toBe(800);
      expect(placement.height).toBe(400);
      expect(placement.x).toBe(100); // (1000 - 800) / 2
      expect(placement.y).toBe(300); // (1000 - 400) / 2
    });

    it("centers smaller images without unnecessary upscaling when within limits", () => {
      const placement = calculateFittedPlacement(300, 200, 1000, 800, 0.8);
      expect(placement.width).toBe(300);
      expect(placement.height).toBe(200);
      expect(placement.x).toBe(350); // (1000 - 300) / 2
      expect(placement.y).toBe(300); // (800 - 200) / 2
    });
  });
});
