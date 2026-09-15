import { describe, it, expect } from "vitest";
import {
  serializeProjectPackage,
  deserializeProjectPackage,
  estimateExportFileSize,
  type ImageProProjectPackage,
} from "./project-persistence";

describe("Phase 6: Project Persistence & Export Management", () => {
  const dummyProject: ImageProProjectPackage = {
    formatVersion: "1.0.0",
    appName: "ImagePro Studio",
    exportedAt: new Date().toISOString(),
    metadata: {
      projectName: "مشروع تخرج اختباري",
      width: 800,
      height: 600,
      layersCount: 2,
      strokesCount: 1,
    },
    state: {
      imageName: "صورة اختبارية",
      imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      brightness: 15,
      contrast: 10,
      grayscale: 0,
      saturation: 110,
      sepia: 0,
      invert: 0,
      hue: 5,
      exposure: 10,
      temperature: 5,
      gamma: 1.0,
      colorBalanceR: 5,
      colorBalanceG: 0,
      colorBalanceB: -5,
      thresholdEnabled: false,
      threshold: 128,
      rotation: 0,
      flipX: false,
      flipY: false,
      filterMode: "vintage",
      filterIntensity: 70,
      layers: [
        { id: "background", name: "الخلفية", kind: "background", visible: true, opacity: 100, blendMode: "normal" },
        { id: "paint-1", name: "طبقة رسم", kind: "paint", visible: true, opacity: 90, blendMode: "multiply" },
      ],
      strokes: [
        {
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
          color: "#2dd4bf",
          width: 8,
          mode: "brush",
          layerId: "paint-1",
        },
      ],
      shapes: [],
      textElements: [],
    },
  };

  it("serializes and deserializes a project package without data loss", () => {
    const json = serializeProjectPackage(dummyProject);
    expect(typeof json).toBe("string");
    expect(json.includes("ImagePro Studio")).toBe(true);

    const parsed = deserializeProjectPackage(json);
    expect(parsed.appName).toBe("ImagePro Studio");
    expect(parsed.metadata.projectName).toBe("مشروع تخرج اختباري");
    expect(parsed.state.brightness).toBe(15);
    expect(parsed.state.filterMode).toBe("vintage");
    expect(parsed.state.layers.length).toBe(2);
    expect(parsed.state.strokes[0].mode).toBe("brush");
  });

  it("throws descriptive error when deserializing invalid or foreign JSON", () => {
    expect(() => deserializeProjectPackage("{}")).toThrow("لا ينتمي إلى ImagePro Studio");
    expect(() => deserializeProjectPackage('{"appName":"ImagePro Studio"}')).toThrow("تالف أو غير مكتمل");
  });

  it("accurately estimates export file sizes for PNG, JPEG, and WebP", () => {
    const pngSize = estimateExportFileSize(1920, 1080, "png", 100);
    const jpegSize = estimateExportFileSize(1920, 1080, "jpeg", 80);
    const webpSize = estimateExportFileSize(1920, 1080, "webp", 80);

    expect(pngSize).toContain("MB");
    expect(jpegSize).toBeDefined();
    expect(webpSize).toBeDefined();
  });
});
