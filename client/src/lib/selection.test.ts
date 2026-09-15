import { describe, expect, it } from "vitest";
import { featherSelection, intersectsSelection, invertSelectionRect, normalizeSelection, selectAllSelection, subtractSelection, unionSelection } from "./selection";

describe("Selection geometry", () => {
  it("normalizes a drag in any direction", () => {
    expect(normalizeSelection({ x: 90, y: 80 }, { x: 20, y: 30 })).toEqual({ x: 20, y: 30, width: 70, height: 50 });
  });

  it("combines overlapping selections", () => {
    expect(unionSelection({ x: 10, y: 10, width: 30, height: 20 }, { x: 25, y: 20, width: 30, height: 20 })).toEqual({ x: 10, y: 10, width: 45, height: 30 });
  });

  it("detects overlap for add/subtract decisions", () => {
    expect(intersectsSelection({ x: 10, y: 10, width: 30, height: 20 }, { x: 25, y: 20, width: 30, height: 20 })).toBe(true);
    expect(intersectsSelection({ x: 10, y: 10, width: 10, height: 10 }, { x: 30, y: 30, width: 10, height: 10 })).toBe(false);
  });

  it("selects all bounds correctly", () => {
    expect(selectAllSelection({ width: 1920, height: 1080 })).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("inverts selection coordinates within image bounds", () => {
    const original = { x: 100, y: 50, width: 200, height: 150 };
    const bounds = { width: 1000, height: 800 };
    const inverted = invertSelectionRect(original, bounds);
    expect(inverted.width).toBe(200);
    expect(inverted.height).toBe(150);
    expect(inverted.x).toBe(1000 - (100 + 200));
    expect(inverted.y).toBe(800 - (50 + 150));
  });

  it("subtracts overlapping selection", () => {
    const current = { x: 100, y: 100, width: 200, height: 100 };
    const subtractor = { x: 200, y: 100, width: 100, height: 100 };
    const result = subtractSelection(current, subtractor);
    expect(result).not.toBeNull();
    expect(result?.width).toBe(100);
    expect(result?.x).toBe(100);
  });

  it("feathers selection bounds expanding within bounds", () => {
    const current = { x: 50, y: 50, width: 100, height: 100 };
    const bounds = { width: 500, height: 500 };
    const feathered = featherSelection(current, 10, bounds);
    expect(feathered.x).toBe(40);
    expect(feathered.y).toBe(40);
    expect(feathered.width).toBe(120);
    expect(feathered.height).toBe(120);
  });
});

