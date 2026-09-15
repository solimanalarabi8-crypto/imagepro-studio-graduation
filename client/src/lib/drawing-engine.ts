export type DrawingToolMode = "brush" | "pencil" | "eraser" | "bucket" | "gradient" | "shape" | "eyedropper";

export type ShapeType = "rectangle" | "ellipse" | "line" | "triangle" | "polygon";

export type ShapeFillMode = "stroke" | "fill" | "both";

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface AdvancedStroke {
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity?: number; // 0 - 100
  hardness?: number; // 0 - 100
  mode: "brush" | "pencil" | "eraser";
  layerId?: string;
}

export interface AdvancedShape {
  id: string;
  shape: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fillMode: ShapeFillMode;
  layerId: string;
}

export interface GradientFill {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  colorStart: string;
  colorEnd: string;
  type: "linear" | "radial";
  layerId: string;
}

/**
 * Parses Hex or CSS color string to RGBA numbers [0-255]
 */
export function parseColorToRgba(colorStr: string): [number, number, number, number] {
  const str = colorStr.trim().toLowerCase();
  if (str.startsWith("#")) {
    const hex = str.replace("#", "");
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b, 255];
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) : 255;
      return [r, g, b, a];
    }
  }
  if (str.startsWith("rgb")) {
    const match = str.match(/\d+(\.\d+)?/g);
    if (match && match.length >= 3) {
      const r = Math.round(Number(match[0]));
      const g = Math.round(Number(match[1]));
      const b = Math.round(Number(match[2]));
      const a = match[3] !== undefined ? Math.round(Number(match[3]) * (Number(match[3]) <= 1 ? 255 : 1)) : 255;
      return [r, g, b, a];
    }
  }
  return [45, 212, 191, 255]; // fallback signal teal
}

/**
 * Renders smooth quadratic bezier curve strokes to eliminate jagged lines.
 */
export function drawSmoothStroke(
  context: CanvasRenderingContext2D,
  stroke: AdvancedStroke
) {
  const { points, color, width, opacity = 100, hardness = 100, mode } = stroke;
  if (!points || points.length === 0) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(1, width);

  if (mode === "eraser") {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0,0,0,1)";
    context.fillStyle = "rgba(0,0,0,1)";
  } else {
    context.globalCompositeOperation = "source-over";
    const alpha = (opacity / 100);
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.fillStyle = color;

    // Hardness / Feathering simulation
    if (hardness < 80 && mode === "brush") {
      context.shadowBlur = (width * (1 - hardness / 100) * 0.8);
      context.shadowColor = color;
    }
  }

  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x, points[0].y, Math.max(0.5, width / 2), 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    context.lineTo(points[1].x, points[1].y);
  } else {
    // Quadratic midpoint smoothing
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      context.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);
  }

  context.stroke();
  context.restore();
}

/**
 * Renders geometric shapes (Line, Rect, Ellipse, Triangle, Star/Polygon)
 */
export function drawAdvancedShape(
  context: CanvasRenderingContext2D,
  shape: AdvancedShape
) {
  context.save();
  context.strokeStyle = shape.strokeColor;
  context.fillStyle = shape.fillColor;
  context.lineWidth = Math.max(1, shape.strokeWidth);
  context.lineJoin = "round";

  context.beginPath();
  const { x, y, width: w, height: h, shape: type, fillMode } = shape;

  switch (type) {
    case "line": {
      context.moveTo(x, y);
      context.lineTo(x + w, y + h);
      break;
    }
    case "ellipse": {
      const rx = Math.abs(w / 2);
      const ry = Math.abs(h / 2);
      const cx = x + w / 2;
      const cy = y + h / 2;
      context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      break;
    }
    case "triangle": {
      context.moveTo(x + w / 2, y);
      context.lineTo(x + w, y + h);
      context.lineTo(x, y + h);
      context.closePath();
      break;
    }
    case "polygon": {
      // 5-point star
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2;
      const innerRadius = outerRadius * 0.45;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      break;
    }
    case "rectangle":
    default: {
      context.rect(x, y, w, h);
      break;
    }
  }

  if (type === "line") {
    context.stroke();
  } else {
    if (fillMode === "fill" || fillMode === "both") context.fill();
    if (fillMode === "stroke" || fillMode === "both") context.stroke();
  }

  context.restore();
}

/**
 * Renders linear or radial gradient fills between two coordinates
 */
export function drawGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  grad: GradientFill
) {
  context.save();
  let gradientObj: CanvasGradient;

  if (grad.type === "radial") {
    const radius = Math.hypot(grad.endX - grad.startX, grad.endY - grad.startY);
    gradientObj = context.createRadialGradient(
      grad.startX, grad.startY, 0,
      grad.startX, grad.startY, Math.max(10, radius)
    );
  } else {
    gradientObj = context.createLinearGradient(grad.startX, grad.startY, grad.endX, grad.endY);
  }

  gradientObj.addColorStop(0, grad.colorStart);
  gradientObj.addColorStop(1, grad.colorEnd);

  context.fillStyle = gradientObj;
  context.fillRect(0, 0, width, height);
  context.restore();
}

/**
 * Fast 4-way Breadth-First-Search flood fill algorithm for paint bucket tool
 */
export function applyFloodFill(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColorStr: string,
  tolerance: number = 32
): boolean {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return false;

  const [fillR, fillG, fillB, fillA] = parseColorToRgba(fillColorStr);
  const imgData = context.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIndex = (startY * width + startX) * 4;
  const startR = data[startIndex];
  const startG = data[startIndex + 1];
  const startB = data[startIndex + 2];
  const startA = data[startIndex + 3];

  // If start color is practically identical to fill color, skip
  if (
    Math.abs(startR - fillR) <= 3 &&
    Math.abs(startG - fillG) <= 3 &&
    Math.abs(startB - fillB) <= 3 &&
    Math.abs(startA - fillA) <= 3
  ) {
    return false;
  }

  const matchesTarget = (idx: number) => {
    return (
      Math.abs(data[idx] - startR) <= tolerance &&
      Math.abs(data[idx + 1] - startG) <= tolerance &&
      Math.abs(data[idx + 2] - startB) <= tolerance &&
      Math.abs(data[idx + 3] - startA) <= tolerance
    );
  };

  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  queueX[tail] = startX;
  queueY[tail] = startY;
  tail++;
  visited[startY * width + startX] = 1;

  while (head < tail) {
    const cx = queueX[head];
    const cy = queueY[head];
    head++;

    const pixelIdx = (cy * width + cx) * 4;
    data[pixelIdx] = fillR;
    data[pixelIdx + 1] = fillG;
    data[pixelIdx + 2] = fillB;
    data[pixelIdx + 3] = fillA;

    // 4 directional neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!visited[nIndex]) {
          visited[nIndex] = 1;
          if (matchesTarget(nIndex * 4)) {
            queueX[tail] = nx;
            queueY[tail] = ny;
            tail++;
          }
        }
      }
    }
  }

  context.putImageData(imgData, 0, 0);
  return true;
}
