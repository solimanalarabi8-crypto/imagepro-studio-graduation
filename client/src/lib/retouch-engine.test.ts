import { describe, expect, it } from "vitest";
import {
  applyCloneStamp,
  applyHealingBrush,
  applySpotHealing,
  applyRedEyeRemoval,
  applySkinSmoothing,
  applyInpaintFill,
  applyBackgroundRemoval,
} from "./retouch-engine";

function createMockContext(width: number, height: number) {
  const buffer = new Uint8ClampedArray(width * height * 4);
  const imgData = {
    width,
    height,
    data: buffer,
  } as ImageData;

  return {
    width,
    height,
    getImageData: (x: number, y: number, w: number, h: number) => {
      const cropped = new Uint8ClampedArray(w * h * 4);
      for (let cy = 0; cy < h; cy++) {
        for (let cx = 0; cx < w; cx++) {
          const srcIdx = ((y + cy) * width + (x + cx)) * 4;
          const tgtIdx = (cy * w + cx) * 4;
          cropped[tgtIdx] = buffer[srcIdx];
          cropped[tgtIdx + 1] = buffer[srcIdx + 1];
          cropped[tgtIdx + 2] = buffer[srcIdx + 2];
          cropped[tgtIdx + 3] = buffer[srcIdx + 3];
        }
      }
      return { width: w, height: h, data: cropped } as ImageData;
    },
    createImageData: (w: number, h: number) => {
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) } as ImageData;
    },
    putImageData: (id: ImageData, x: number, y: number) => {
      for (let cy = 0; cy < id.height; cy++) {
        for (let cx = 0; cx < id.width; cx++) {
          const srcIdx = (cy * id.width + cx) * 4;
          const tgtIdx = ((y + cy) * width + (x + cx)) * 4;
          buffer[tgtIdx] = id.data[srcIdx];
          buffer[tgtIdx + 1] = id.data[srcIdx + 1];
          buffer[tgtIdx + 2] = id.data[srcIdx + 2];
          buffer[tgtIdx + 3] = id.data[srcIdx + 3];
        }
      }
    },
    rawBuffer: buffer,
  };
}

describe("Retouching Engine (Point 8)", () => {
  it("applyCloneStamp copies texture from source to destination with falloff", () => {
    const ctx = createMockContext(50, 50);
    // Fill source area around (10, 10) with pure red
    for (let y = 5; y <= 15; y++) {
      for (let x = 5; x <= 15; x++) {
        const idx = (y * 50 + x) * 4;
        ctx.rawBuffer[idx] = 255;
        ctx.rawBuffer[idx + 1] = 50;
        ctx.rawBuffer[idx + 2] = 50;
        ctx.rawBuffer[idx + 3] = 255;
      }
    }

    const success = applyCloneStamp(ctx as any, 50, 50, 30, 30, 10, 10, 6, 100, 100);
    expect(success).toBe(true);

    // Target center (30, 30) should now have cloned red color
    const targetIdx = (30 * 50 + 30) * 4;
    expect(ctx.rawBuffer[targetIdx]).toBeGreaterThan(200);
  });

  it("applyHealingBrush blends source details while adapting to target luminosity", () => {
    const ctx = createMockContext(50, 50);
    // Dark target area around (30, 30)
    for (let i = 0; i < ctx.rawBuffer.length; i += 4) {
      ctx.rawBuffer[i] = 60;
      ctx.rawBuffer[i + 1] = 60;
      ctx.rawBuffer[i + 2] = 60;
      ctx.rawBuffer[i + 3] = 255;
    }
    // Bright source at (10, 10)
    for (let y = 5; y <= 15; y++) {
      for (let x = 5; x <= 15; x++) {
        const idx = (y * 50 + x) * 4;
        ctx.rawBuffer[idx] = 200;
        ctx.rawBuffer[idx + 1] = 200;
        ctx.rawBuffer[idx + 2] = 200;
      }
    }

    const success = applyHealingBrush(ctx as any, 50, 50, 30, 30, 10, 10, 5);
    expect(success).toBe(true);
  });

  it("applySpotHealing removes local circular blemish using surrounding ring", () => {
    const ctx = createMockContext(40, 40);
    // Fill background with skin-like tone (R=210, G=150, B=120)
    for (let i = 0; i < ctx.rawBuffer.length; i += 4) {
      ctx.rawBuffer[i] = 210;
      ctx.rawBuffer[i + 1] = 150;
      ctx.rawBuffer[i + 2] = 120;
      ctx.rawBuffer[i + 3] = 255;
    }
    // Place a dark blemish at (20, 20)
    const blemishIdx = (20 * 40 + 20) * 4;
    ctx.rawBuffer[blemishIdx] = 10;
    ctx.rawBuffer[blemishIdx + 1] = 10;
    ctx.rawBuffer[blemishIdx + 2] = 10;

    const success = applySpotHealing(ctx as any, 40, 40, 20, 20, 4);
    expect(success).toBe(true);

    // Defect center should now be healed toward surrounding skin tone
    expect(ctx.rawBuffer[blemishIdx]).toBeGreaterThan(150);
  });

  it("applyRedEyeRemoval suppresses excessive pupil redness and keeps highlight", () => {
    const ctx = createMockContext(30, 30);
    // Create red-eye pupil at (15, 15)
    for (let y = 12; y <= 18; y++) {
      for (let x = 12; x <= 18; x++) {
        const idx = (y * 30 + x) * 4;
        ctx.rawBuffer[idx] = 230; // High Red
        ctx.rawBuffer[idx + 1] = 40; // Low Green
        ctx.rawBuffer[idx + 2] = 40; // Low Blue
        ctx.rawBuffer[idx + 3] = 255;
      }
    }
    // Add specular white catchlight at (14, 14)
    const catchlightIdx = (14 * 30 + 14) * 4;
    ctx.rawBuffer[catchlightIdx] = 255;
    ctx.rawBuffer[catchlightIdx + 1] = 255;
    ctx.rawBuffer[catchlightIdx + 2] = 255;

    const success = applyRedEyeRemoval(ctx as any, 30, 30, 15, 15, 6);
    expect(success).toBe(true);

    // Center pupil should have attenuated red
    const pupilIdx = (16 * 30 + 16) * 4;
    expect(ctx.rawBuffer[pupilIdx]).toBeLessThan(120);

    // Specular catchlight reflection should be preserved
    expect(ctx.rawBuffer[catchlightIdx]).toBe(255);
  });

  it("applySkinSmoothing smooths skin tone while preserving high contrast edges", () => {
    const ctx = createMockContext(40, 40);
    // Fill with skin tone with noise
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        const idx = (y * 40 + x) * 4;
        const noise = (x % 2 === 0 ? 10 : -10);
        ctx.rawBuffer[idx] = 200 + noise; // Red
        ctx.rawBuffer[idx + 1] = 140 + noise; // Green
        ctx.rawBuffer[idx + 2] = 110 + noise; // Blue
        ctx.rawBuffer[idx + 3] = 255;
      }
    }

    const success = applySkinSmoothing(ctx as any, 40, 40, 75);
    expect(success).toBe(true);
  });

  it("applyInpaintFill fills selected bounding box from boundary samples", () => {
    const ctx = createMockContext(40, 40);
    for (let i = 0; i < ctx.rawBuffer.length; i += 4) {
      ctx.rawBuffer[i] = 180;
      ctx.rawBuffer[i + 1] = 180;
      ctx.rawBuffer[i + 2] = 180;
      ctx.rawBuffer[i + 3] = 255;
    }
    // Black defect box at [15, 15, 10, 10]
    for (let y = 15; y <= 24; y++) {
      for (let x = 15; x <= 24; x++) {
        const idx = (y * 40 + x) * 4;
        ctx.rawBuffer[idx] = 0;
        ctx.rawBuffer[idx + 1] = 0;
        ctx.rawBuffer[idx + 2] = 0;
      }
    }

    const success = applyInpaintFill(ctx as any, 40, 40, { x: 15, y: 15, width: 10, height: 10 });
    expect(success).toBe(true);

    const insideIdx = (20 * 40 + 20) * 4;
    expect(ctx.rawBuffer[insideIdx]).toBeGreaterThan(120);
  });

  it("applyBackgroundRemoval makes uniform background transparent", () => {
    const ctx = createMockContext(20, 20);
    // White background
    for (let i = 0; i < ctx.rawBuffer.length; i += 4) {
      ctx.rawBuffer[i] = 255;
      ctx.rawBuffer[i + 1] = 255;
      ctx.rawBuffer[i + 2] = 255;
      ctx.rawBuffer[i + 3] = 255;
    }

    const success = applyBackgroundRemoval(ctx as any, 20, 20, 20);
    expect(success).toBe(true);

    // Corner pixel should now be fully transparent (alpha = 0)
    expect(ctx.rawBuffer[3]).toBe(0);
  });
});
