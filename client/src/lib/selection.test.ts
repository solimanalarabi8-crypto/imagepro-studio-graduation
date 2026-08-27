import { describe, expect, it } from "vitest";
import { intersectsSelection, normalizeSelection, unionSelection } from "./selection";

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
});
