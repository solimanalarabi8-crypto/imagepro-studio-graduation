import { describe, expect, it } from "vitest";
import { toolGroups } from "../pages/Home";

describe("Sidebar tool contract", () => {
  it("contains every required tool exactly once", () => {
    const tools = toolGroups.flat();
    const ids = tools.map((tool) => tool.id);
    expect(ids).toEqual(expect.arrayContaining(["select", "hand", "crop", "brush", "eraser", "eyedropper", "shape", "text", "adjust", "magic"]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every tool an Arabic label and a unique keyboard shortcut", () => {
    const tools = toolGroups.flat();
    expect(tools.every((tool) => /[\u0600-\u06FF]/.test(tool.label) && tool.shortcut.length > 0)).toBe(true);
    expect(new Set(tools.map((tool) => tool.shortcut)).size).toBe(tools.length);
  });
});
