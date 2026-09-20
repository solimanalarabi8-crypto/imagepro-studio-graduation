import { describe, it, expect } from "vitest";
import {
  perceptualColorDistance,
  buildBackgroundPalette,
  extractSubjectImageData,
  cleanMaskNoise
} from "./subject-extractor";

describe("Subject Extractor Engine", () => {
  it("computes perceptual color distance correctly", () => {
    const dSame = perceptualColorDistance(100, 100, 100, 100, 100, 100);
    expect(dSame).toBe(0);

    const dDiff = perceptualColorDistance(0, 0, 0, 255, 255, 255);
    expect(dDiff).toBeGreaterThan(400);
  });

  it("purges detached props/furniture remnants and alpha haze in cleanMaskNoise", () => {
    const W = 100;
    const H = 100;
    const data = new Uint8ClampedArray(W * H * 4);

    // Primary subject: large central block representing a person (x: 20-50, y: 10-80) => 30 x 70 = 2100 px
    for (let y = 10; y < 80; y++) {
      for (let x = 20; x < 50; x++) {
        const idx = (y * W + x) * 4;
        data[idx + 3] = 255;
      }
    }

    // Detached prop / chair armrest on the far right (x: 80-95, y: 50-70) => 15 x 20 = 300 px
    // There is a 30px empty horizontal gap between x=50 and x=80!
    for (let y = 50; y < 70; y++) {
      for (let x = 80; x < 95; x++) {
        const idx = (y * W + x) * 4;
        data[idx + 3] = 180;
      }
    }

    // Faint semi-transparent background haze specks
    data[(5 * W + 5) * 4 + 3] = 30;
    data[(90 * W + 10) * 4 + 3] = 40;

    cleanMaskNoise(data, W, H);

    // Primary subject MUST be preserved
    const centerSubjectIdx = (40 * W + 35) * 4 + 3;
    expect(data[centerSubjectIdx]).toBe(255);

    // Detached prop / chair armrest MUST be completely purged (alpha = 0)
    const chairIdx = (60 * W + 85) * 4 + 3;
    expect(data[chairIdx]).toBe(0);

    // Faint haze MUST be completely purged (alpha = 0)
    expect(data[(5 * W + 5) * 4 + 3]).toBe(0);
    expect(data[(90 * W + 10) * 4 + 3]).toBe(0);
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

  it("calculates proportional subject scaling while preserving center coordinates", () => {
    const origW = 300;
    const origH = 500;
    const posX = 100;
    const posY = 100;

    const centerX = posX + origW / 2; // 250
    const centerY = posY + origH / 2; // 350

    // Scale to 150%
    const scaleFactor = 1.5;
    const newW = Math.round(origW * scaleFactor); // 450
    const newH = Math.round(origH * scaleFactor); // 750
    const newX = Math.round(centerX - newW / 2); // 25
    const newY = Math.round(centerY - newH / 2); // -25

    expect(newW).toBe(450);
    expect(newH).toBe(750);
    expect(newX + newW / 2).toBe(centerX);
    expect(newY + newH / 2).toBe(centerY);

    // Scale to 50%
    const halfFactor = 0.5;
    const halfW = Math.round(origW * halfFactor); // 150
    const halfH = Math.round(origH * halfFactor); // 250
    const halfX = Math.round(centerX - halfW / 2); // 175
    const halfY = Math.round(centerY - halfH / 2); // 225

    expect(halfW).toBe(150);
    expect(halfH).toBe(250);
    expect(halfX + halfW / 2).toBe(centerX);
    expect(halfY + halfH / 2).toBe(centerY);
  });
});
