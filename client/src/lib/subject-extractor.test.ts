import { describe, it, expect } from "vitest";
import {
  perceptualColorDistance,
  buildBackgroundPalette,
  extractSubjectImageData
} from "./subject-extractor";

describe("Subject Extractor Engine", () => {
  it("computes perceptual color distance correctly", () => {
    const dSame = perceptualColorDistance(100, 100, 100, 100, 100, 100);
    expect(dSame).toBe(0);

    const dDiff = perceptualColorDistance(0, 0, 0, 255, 255, 255);
    expect(dDiff).toBeGreaterThan(400);
  });

  it("builds background palette from border pixels", () => {
    const W = 50;
    const H = 50;
    const data = new Uint8ClampedArray(W * H * 4);
    // Fill all with blue background
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = 30;
      data[i * 4 + 1] = 80;
      data[i * 4 + 2] = 200;
      data[i * 4 + 3] = 255;
    }
    const palette = buildBackgroundPalette(data, W, H);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette[0].b).toBeGreaterThan(150);
  });

  it("extracts a central foreground subject from background", () => {
    const W = 60;
    const H = 60;
    const data = new Uint8ClampedArray(W * H * 4);
    // Background: Outdoor green grass
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = 40;
      data[i * 4 + 1] = 160;
      data[i * 4 + 2] = 50;
      data[i * 4 + 3] = 255;
    }
    // Center: Red subject (e.g. person in red shirt or red apple)
    for (let y = 20; y < 40; y++) {
      for (let x = 20; x < 40; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 220;
        data[idx + 1] = 30;
        data[idx + 2] = 30;
        data[idx + 3] = 255;
      }
    }

    // Mock ImageData
    const imgData = {
      width: W,
      height: H,
      data
    } as unknown as ImageData;

    const result = extractSubjectImageData(imgData, { tolerance: 30, edgeFeather: 1 });
    expect(result.foregroundCount).toBeGreaterThan(100);
    expect(result.backgroundCount).toBeGreaterThan(1000);

    // Center pixel should be foreground (alpha = 255)
    const centerIdx = (30 * W + 30) * 4;
    expect(result.resultImageData.data[centerIdx + 3]).toBe(255);

    // Corner pixel should be background (alpha = 0)
    const cornerIdx = 0;
    expect(result.resultImageData.data[cornerIdx + 3]).toBe(0);
  });

  it("respects Region of Interest (ROI) bounding box", () => {
    const W = 80;
    const H = 80;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = 200;
      data[i * 4 + 1] = 200;
      data[i * 4 + 2] = 200;
      data[i * 4 + 3] = 255;
    }
    // Two items: item A at (10,10) and item B at (50,50)
    for (let y = 10; y < 25; y++) {
      for (let x = 10; x < 25; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 10; data[idx+1] = 10; data[idx+2] = 10;
      }
    }
    for (let y = 50; y < 65; y++) {
      for (let x = 50; x < 65; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 10; data[idx+1] = 10; data[idx+2] = 10;
      }
    }

    const imgData = { width: W, height: H, data } as unknown as ImageData;

    // Isolate ONLY item B with ROI
    const result = extractSubjectImageData(imgData, {
      roi: { x: 45, y: 45, width: 25, height: 25 },
      tolerance: 30,
      edgeFeather: 0
    });

    // Item A (at 15, 15) outside ROI should be transparent (background)
    const itemAIdx = (15 * W + 15) * 4;
    expect(result.resultImageData.data[itemAIdx + 3]).toBe(0);

    // Item B (at 55, 55) inside ROI should be opaque (foreground)
    const itemBIdx = (55 * W + 55) * 4;
    expect(result.resultImageData.data[itemBIdx + 3]).toBe(255);
  });
});
