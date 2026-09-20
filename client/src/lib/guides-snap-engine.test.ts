import { describe, it, expect } from "vitest";
import { calculateSnap, calculateAlignment, type GuideLine } from "./guides-snap-engine";

describe("guides-snap-engine", () => {
  const canvasSize = { width: 1000, height: 800 };

  it("should snap to canvas horizontal center (X = 500) when within threshold", () => {
    // Element width = 100. Center is at x + 50.
    // If x = 448, center is at 498. Diff from 500 is 2px <= threshold 8.
    const res = calculateSnap(
      { x: 448, y: 100, width: 100, height: 100 },
      canvasSize,
      [],
      { threshold: 8 }
    );
    expect(res.snappedX).toBe(true);
    expect(res.x).toBe(450); // center is exactly 500
    expect(res.activeSnapLines.some((l) => l.orientation === "vertical" && l.position === 500)).toBe(true);
  });

  it("should snap to canvas vertical center (Y = 400) when within threshold", () => {
    // Element height = 100. Center is at y + 50.
    // If y = 347, center is at 397. Diff from 400 is 3px <= threshold 8.
    const res = calculateSnap(
      { x: 100, y: 347, width: 100, height: 100 },
      canvasSize,
      [],
      { threshold: 8 }
    );
    expect(res.snappedY).toBe(true);
    expect(res.y).toBe(350); // center is exactly 400
    expect(res.activeSnapLines.some((l) => l.orientation === "horizontal" && l.position === 400)).toBe(true);
  });

  it("should snap to user guide lines", () => {
    const guides: GuideLine[] = [
      { id: "g1", orientation: "vertical", position: 250 },
      { id: "g2", orientation: "horizontal", position: 150 },
    ];
    // Element left edge near 250 (e.g. x = 247)
    const res = calculateSnap(
      { x: 247, y: 148, width: 80, height: 80 },
      canvasSize,
      guides,
      { threshold: 6 }
    );
    expect(res.snappedX).toBe(true);
    expect(res.x).toBe(250);
    expect(res.snappedY).toBe(true);
    expect(res.y).toBe(150);
  });

  it("should calculate correct alignments", () => {
    const elem = { x: 50, y: 50, width: 200, height: 100 };
    expect(calculateAlignment("left", elem, canvasSize)).toEqual({ x: 0, y: 50 });
    expect(calculateAlignment("center-h", elem, canvasSize)).toEqual({ x: 400, y: 50 });
    expect(calculateAlignment("right", elem, canvasSize)).toEqual({ x: 800, y: 50 });
    expect(calculateAlignment("top", elem, canvasSize)).toEqual({ x: 50, y: 0 });
    expect(calculateAlignment("center-v", elem, canvasSize)).toEqual({ x: 50, y: 350 });
    expect(calculateAlignment("bottom", elem, canvasSize)).toEqual({ x: 50, y: 700 });
  });
});
