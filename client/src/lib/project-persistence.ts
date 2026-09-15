import type { FilterMode } from "./filters-engine";
import type { LayerBlendMode } from "./layers-history";

export interface ProjectLayerExport {
  id: string;
  name: string;
  kind: "background" | "paint" | "text" | "mask" | "adjustment";
  color?: string;
  visible: boolean;
  opacity?: number;
  blendMode?: LayerBlendMode;
}

export interface ProjectStrokeExport {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity?: number;
  hardness?: number;
  mode: "brush" | "pencil" | "eraser";
  layerId?: string;
}

export interface ProjectShapeExport {
  id: string;
  shape: "rectangle" | "ellipse" | "line" | "triangle" | "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor?: string;
  widthStroke: number;
  fillMode?: "stroke" | "fill" | "both";
  layerId: string;
}

export interface ProjectTextExport {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface ImageProProjectPackage {
  formatVersion: "1.0.0";
  appName: "ImagePro Studio";
  exportedAt: string;
  metadata: {
    projectName: string;
    width: number;
    height: number;
    layersCount: number;
    strokesCount: number;
  };
  state: {
    imageName: string;
    imageData: string;
    brightness: number;
    contrast: number;
    grayscale: number;
    saturation: number;
    sepia: number;
    invert: number;
    hue: number;
    exposure: number;
    temperature: number;
    gamma: number;
    colorBalanceR: number;
    colorBalanceG: number;
    colorBalanceB: number;
    thresholdEnabled: boolean;
    threshold: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    filterMode: FilterMode;
    filterIntensity: number;
    layers: ProjectLayerExport[];
    strokes: ProjectStrokeExport[];
    shapes: ProjectShapeExport[];
    textElements: ProjectTextExport[];
  };
}

export function serializeProjectPackage(data: ImageProProjectPackage): string {
  return JSON.stringify(data, null, 2);
}

export function deserializeProjectPackage(jsonString: string): ImageProProjectPackage {
  const parsed = JSON.parse(jsonString);
  if (!parsed || parsed.appName !== "ImagePro Studio") {
    throw new Error("ملف المشروع غير صالح أو لا ينتمي إلى ImagePro Studio");
  }
  if (!parsed.state || !Array.isArray(parsed.state.layers)) {
    throw new Error("هيكل بيانات المشروع تالف أو غير مكتمل");
  }
  return parsed as ImageProProjectPackage;
}

export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function estimateExportFileSize(
  width: number,
  height: number,
  format: "png" | "jpeg" | "webp",
  qualityPercent: number
): string {
  const totalPixels = width * height;
  let estimatedBytes = 0;

  if (format === "png") {
    // Lossless compression approx 2 bytes per pixel
    estimatedBytes = totalPixels * 2.2;
  } else if (format === "jpeg") {
    // JPEG approx 0.15 to 0.7 bytes per pixel depending on quality
    const qFactor = (qualityPercent / 100);
    estimatedBytes = totalPixels * (0.12 + qFactor * 0.45);
  } else {
    // WebP approx 25% smaller than JPEG
    const qFactor = (qualityPercent / 100);
    estimatedBytes = totalPixels * (0.09 + qFactor * 0.35);
  }

  if (estimatedBytes >= 1024 * 1024) {
    return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `~${Math.round(estimatedBytes / 1024)} KB`;
}
