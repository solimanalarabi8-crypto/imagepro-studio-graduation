/**
 * ImagePro Studio — AI Background Removal Service
 *
 * Uses @imgly/background-removal (ONNX / U2Net model) running entirely in the browser.
 * - Same AI model quality as server-side @imgly/background-removal-node
 * - Lazy-initialised: model downloads on first use then cached by the browser
 * - Returns a transparent PNG Blob / dataURL suitable for the Layers system
 */

import { removeBackground, type Config } from "@imgly/background-removal";

// Model assets served from jsDelivr CDN (cached after first use)
const MODEL_BASE_URL =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

const IMGLY_CONFIG: Config = {
  publicPath: MODEL_BASE_URL,
  model: "isnet",
  output: {
    format: "image/png",
    quality: 1.0,
  },
};

let isModelLoaded = false;

export async function aiRemoveBackground(
  canvas: HTMLCanvasElement,
  onProgress?: (p: number) => void
): Promise<string> {
  const sourceBlob = await canvasToBlob(canvas, "image/jpeg", 0.95);

  const config: Config = {
    ...IMGLY_CONFIG,
    progress: onProgress
      ? (_key: string, current: number, total: number) => {
          onProgress(total > 0 ? current / total : 0);
        }
      : undefined,
  };

  const resultBlob = await removeBackground(sourceBlob, config);
  isModelLoaded = true;
  return blobToDataUrl(resultBlob);
}

export async function aiPortraitBokeh(
  canvas: HTMLCanvasElement,
  blurRadius: number = 12,
  onProgress?: (p: number) => void
): Promise<string> {
  const W = canvas.width;
  const H = canvas.height;
  const subjectDataUrl = await aiRemoveBackground(canvas, onProgress);

  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = W;
  bgCanvas.height = H;
  const bgCtx = bgCanvas.getContext("2d")!;
  bgCtx.filter = `blur(${Math.max(1, blurRadius)}px)`;
  bgCtx.drawImage(canvas, 0, 0);
  bgCtx.filter = "none";

  const outCanvas = document.createElement("canvas");
  outCanvas.width = W;
  outCanvas.height = H;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(bgCanvas, 0, 0);
  const subjectImg = await loadImage(subjectDataUrl);
  outCtx.drawImage(subjectImg, 0, 0, W, H);
  return outCanvas.toDataURL("image/png");
}

export async function aiReplaceBackground(
  canvas: HTMLCanvasElement,
  style: "transparent" | "black" | "white" | "chroma" | "studio-dark" = "transparent",
  onProgress?: (p: number) => void
): Promise<string> {
  const W = canvas.width;
  const H = canvas.height;
  const subjectDataUrl = await aiRemoveBackground(canvas, onProgress);

  if (style === "transparent") return subjectDataUrl;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = W;
  outCanvas.height = H;
  const ctx = outCanvas.getContext("2d")!;

  if (style === "black") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
  } else if (style === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  } else if (style === "chroma") {
    ctx.fillStyle = "#00b140";
    ctx.fillRect(0, 0, W, H);
  } else if (style === "studio-dark") {
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.4);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const subjectImg = await loadImage(subjectDataUrl);
  ctx.drawImage(subjectImg, 0, 0, W, H);
  return outCanvas.toDataURL("image/png");
}

export function isAiModelReady(): boolean {
  return isModelLoaded;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error("Canvas toBlob returned null")); },
      type, quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
