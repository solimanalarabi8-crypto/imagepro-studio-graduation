/**
 * ImagePro Studio — Section 15 & 16: Guides, Rulers, Smart Snap & Alignment Engine
 * Built for professional digital art & image manipulation.
 */

export interface GuideLine {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number; // in canvas pixel coordinates
}

export interface SnapLine {
  orientation: "horizontal" | "vertical";
  position: number;
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  activeSnapLines: SnapLine[];
}

export interface SnapConfig {
  threshold?: number; // snap distance in pixels (default 8px)
  snapToCenter?: boolean;
  snapToEdges?: boolean;
  snapToGuides?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

export type AlignmentType = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

/**
 * Calculates smart snapping for any bounding box against canvas center, canvas edges, active guides, and grid.
 */
export function calculateSnap(
  target: { x: number; y: number; width: number; height: number },
  canvasSize: { width: number; height: number },
  guides: GuideLine[] = [],
  config: SnapConfig = {}
): SnapResult {
  const threshold = config.threshold ?? 8;
  const snapToCenter = config.snapToCenter ?? true;
  const snapToEdges = config.snapToEdges ?? true;
  const snapToGuides = config.snapToGuides ?? true;
  const snapToGrid = config.snapToGrid ?? false;
  const gridSize = config.gridSize ?? 20;

  let bestDeltaX: number | null = null;
  let bestSnapLineX: SnapLine | null = null;

  let bestDeltaY: number | null = null;
  let bestSnapLineY: SnapLine | null = null;

  // X-axis target anchors: left edge, center, right edge
  const targetXAnchors = [
    { pos: target.x, label: "يسار" },
    { pos: target.x + target.width / 2, label: "منتصف" },
    { pos: target.x + target.width, label: "يمين" },
  ];

  // Candidates for X snap (vertical lines)
  const xCandidates: { pos: number; label: string }[] = [];
  if (snapToEdges) {
    xCandidates.push({ pos: 0, label: "حافة مساحة العمل (0)" });
    xCandidates.push({ pos: canvasSize.width, label: `حافة مساحة العمل (${canvasSize.width})` });
  }
  if (snapToCenter) {
    xCandidates.push({ pos: Math.round(canvasSize.width / 2), label: "منتصف مساحة العمل أفقي" });
  }
  if (snapToGuides) {
    for (const g of guides) {
      if (g.orientation === "vertical") {
        xCandidates.push({ pos: g.position, label: `دليل رأسي (${Math.round(g.position)}px)` });
      }
    }
  }
  if (snapToGrid && gridSize > 0) {
    const nearGrid = Math.round(target.x / gridSize) * gridSize;
    xCandidates.push({ pos: nearGrid, label: `شبكة (${nearGrid}px)` });
  }

  // Find closest X snap
  for (const anchor of targetXAnchors) {
    for (const cand of xCandidates) {
      const diff = cand.pos - anchor.pos;
      if (Math.abs(diff) <= threshold) {
        if (bestDeltaX === null || Math.abs(diff) < Math.abs(bestDeltaX)) {
          bestDeltaX = diff;
          bestSnapLineX = { orientation: "vertical", position: cand.pos, label: cand.label };
        }
      }
    }
  }

  // Y-axis target anchors: top edge, center, bottom edge
  const targetYAnchors = [
    { pos: target.y, label: "أعلى" },
    { pos: target.y + target.height / 2, label: "منتصف" },
    { pos: target.y + target.height, label: "أسفل" },
  ];

  // Candidates for Y snap (horizontal lines)
  const yCandidates: { pos: number; label: string }[] = [];
  if (snapToEdges) {
    yCandidates.push({ pos: 0, label: "حافة مساحة العمل (0)" });
    yCandidates.push({ pos: canvasSize.height, label: `حافة مساحة العمل (${canvasSize.height})` });
  }
  if (snapToCenter) {
    yCandidates.push({ pos: Math.round(canvasSize.height / 2), label: "منتصف مساحة العمل رأسي" });
  }
  if (snapToGuides) {
    for (const g of guides) {
      if (g.orientation === "horizontal") {
        yCandidates.push({ pos: g.position, label: `دليل أفقي (${Math.round(g.position)}px)` });
      }
    }
  }
  if (snapToGrid && gridSize > 0) {
    const nearGrid = Math.round(target.y / gridSize) * gridSize;
    yCandidates.push({ pos: nearGrid, label: `شبكة (${nearGrid}px)` });
  }

  // Find closest Y snap
  for (const anchor of targetYAnchors) {
    for (const cand of yCandidates) {
      const diff = cand.pos - anchor.pos;
      if (Math.abs(diff) <= threshold) {
        if (bestDeltaY === null || Math.abs(diff) < Math.abs(bestDeltaY)) {
          bestDeltaY = diff;
          bestSnapLineY = { orientation: "horizontal", position: cand.pos, label: cand.label };
        }
      }
    }
  }

  const activeSnapLines: SnapLine[] = [];
  if (bestSnapLineX) activeSnapLines.push(bestSnapLineX);
  if (bestSnapLineY) activeSnapLines.push(bestSnapLineY);

  return {
    x: bestDeltaX !== null ? Math.round(target.x + bestDeltaX) : target.x,
    y: bestDeltaY !== null ? Math.round(target.y + bestDeltaY) : target.y,
    snappedX: bestDeltaX !== null,
    snappedY: bestDeltaY !== null,
    activeSnapLines,
  };
}

/**
 * Calculates alignment positions for elements or floating subjects.
 */
export function calculateAlignment(
  type: AlignmentType,
  element: { x: number; y: number; width: number; height: number },
  canvasSize: { width: number; height: number }
): { x: number; y: number } {
  switch (type) {
    case "left":
      return { x: 0, y: element.y };
    case "center-h":
      return { x: Math.round((canvasSize.width - element.width) / 2), y: element.y };
    case "right":
      return { x: Math.max(0, canvasSize.width - element.width), y: element.y };
    case "top":
      return { x: element.x, y: 0 };
    case "center-v":
      return { x: element.x, y: Math.round((canvasSize.height - element.height) / 2) };
    case "bottom":
      return { x: element.x, y: Math.max(0, canvasSize.height - element.height) };
  }
}
