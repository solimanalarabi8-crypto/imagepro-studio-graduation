import { describe, it, expect } from "vitest";
import {
  parseColorToRgba,
  drawSmoothStroke,
  drawAdvancedShape,
  type AdvancedStroke,
  type AdvancedShape,
} from "./drawing-engine";

describe("Point 7: Drawing & Painting Engine", () => {
  it("parses Hex and RGB colors accurately to RGBA components", () => {
    const teal = parseColorToRgba("#2dd4bf");
    expect(teal[0]).toBe(45);
    expect(teal[1]).toBe(212);
    expect(teal[2]).toBe(191);
    expect(teal[3]).toBe(255);

    const red = parseColorToRgba("#ff0000");
    expect(red[0]).toBe(255);
    expect(red[1]).toBe(0);
    expect(red[2]).toBe(0);

    const rgb = parseColorToRgba("rgb(100, 150, 200)");
    expect(rgb[0]).toBe(100);
    expect(rgb[1]).toBe(150);
    expect(rgb[2]).toBe(200);
  });

  it("handles smooth stroke calculations without crashing on edge cases", () => {
    // Mock canvas context
    const mockContext = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
    } as unknown as CanvasRenderingContext2D;

    const singlePointStroke: AdvancedStroke = {
      points: [{ x: 10, y: 20 }],
      color: "#2dd4bf",
      width: 10,
      opacity: 100,
      hardness: 100,
      mode: "brush",
    };
    expect(() => drawSmoothStroke(mockContext, singlePointStroke)).not.toThrow();

    const multiPointStroke: AdvancedStroke = {
      points: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 80 }],
      color: "#ffffff",
      width: 5,
      opacity: 80,
      hardness: 50,
      mode: "brush",
    };
    expect(() => drawSmoothStroke(mockContext, multiPointStroke)).not.toThrow();
  });

  it("renders shapes (rectangle, ellipse, line, triangle, polygon) correctly", () => {
    const mockContext = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      rect: () => {},
      ellipse: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
    } as unknown as CanvasRenderingContext2D;

    const shapes: AdvancedShape[] = [
      { id: "1", shape: "rectangle", x: 0, y: 0, width: 50, height: 50, strokeColor: "#000", fillColor: "#fff", strokeWidth: 2, fillMode: "both", layerId: "p1" },
      { id: "2", shape: "ellipse", x: 10, y: 10, width: 40, height: 40, strokeColor: "#000", fillColor: "#fff", strokeWidth: 2, fillMode: "fill", layerId: "p1" },
      { id: "3", shape: "line", x: 0, y: 0, width: 100, height: 100, strokeColor: "#000", fillColor: "#fff", strokeWidth: 2, fillMode: "stroke", layerId: "p1" },
      { id: "4", shape: "triangle", x: 20, y: 20, width: 60, height: 60, strokeColor: "#000", fillColor: "#fff", strokeWidth: 2, fillMode: "both", layerId: "p1" },
      { id: "5", shape: "polygon", x: 30, y: 30, width: 80, height: 80, strokeColor: "#000", fillColor: "#fff", strokeWidth: 2, fillMode: "both", layerId: "p1" },
    ];

    for (const shape of shapes) {
      expect(() => drawAdvancedShape(mockContext, shape)).not.toThrow();
    }
  });
});
