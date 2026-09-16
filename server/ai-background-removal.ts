import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface RemoveBackgroundOptions {
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  model?: "small" | "medium" | "large";
}

export interface RemoveBackgroundResult {
  success: boolean;
  dataUrl: string;
  width: number;
  height: number;
  elapsedMs: number;
}

/**
 * Server-side AI Neural Background Removal (IS-Net)
 * Runs via onnxruntime-node with native C++ execution.
 * Completely immune to browser iframe / SharedArrayBuffer / CORS limitations.
 */
export async function processBackgroundRemoval(
  inputData: string | Buffer,
  options: RemoveBackgroundOptions = {}
): Promise<RemoveBackgroundResult> {
  const startTime = Date.now();

  // 1. Convert input (base64 dataURL or raw buffer) to clean PNG buffer
  let inputBuffer: Buffer;
  if (typeof inputData === "string") {
    const base64Index = inputData.indexOf("base64,");
    if (base64Index !== -1) {
      inputBuffer = Buffer.from(inputData.slice(base64Index + 7), "base64");
    } else {
      inputBuffer = Buffer.from(inputData, "base64");
    }
  } else {
    inputBuffer = inputData;
  }

  // Inspect image dimensions and metadata
  const originalMeta = await sharp(inputBuffer).metadata();
  const origWidth = originalMeta.width || 800;
  const origHeight = originalMeta.height || 600;

  // Resolve local neural model assets folder
  const publicDataDir = path.resolve(process.cwd(), "client/public/imgly-data");
  const publicPath = `file://${publicDataDir}/`;

  let finalBuffer: Buffer;

  // Check if Region of Interest (ROI) crop was requested
  const hasRoi =
    options.roi &&
    options.roi.width > 20 &&
    options.roi.height > 20 &&
    (options.roi.width < origWidth - 10 || options.roi.height < origHeight - 10);

  if (hasRoi && options.roi) {
    const roi = options.roi;
    const cropX = Math.max(0, Math.min(origWidth - 1, Math.round(roi.x)));
    const cropY = Math.max(0, Math.min(origHeight - 1, Math.round(roi.y)));
    const cropW = Math.min(origWidth - cropX, Math.round(roi.width));
    const cropH = Math.min(origHeight - cropY, Math.round(roi.height));

    // Extract subregion
    const croppedBuffer = await sharp(inputBuffer)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .png()
      .toBuffer();

    const tmpCroppedPath = path.join(
      os.tmpdir(),
      `bg_crop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`
    );
    await fs.writeFile(tmpCroppedPath, croppedBuffer);

    try {
      const blob = await removeBackground(`file://${tmpCroppedPath}`, {
        publicPath,
        model: options.model || "small",
        debug: false
      });
      const isolatedCropBuffer = Buffer.from(await blob.arrayBuffer());

      // Composite isolated crop onto full-size transparent canvas at original coordinates
      finalBuffer = await sharp({
        create: {
          width: origWidth,
          height: origHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([
          {
            input: isolatedCropBuffer,
            left: cropX,
            top: cropY
          }
        ])
        .png()
        .toBuffer();
    } finally {
      await fs.unlink(tmpCroppedPath).catch(() => {});
    }
  } else {
    // Process full image with Neural Network
    // Normalize to standard PNG first
    const normalizedInput = await sharp(inputBuffer).png().toBuffer();
    const tmpInputPath = path.join(
      os.tmpdir(),
      `bg_in_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`
    );
    await fs.writeFile(tmpInputPath, normalizedInput);

    try {
      const blob = await removeBackground(`file://${tmpInputPath}`, {
        publicPath,
        model: options.model || "small",
        debug: false
      });
      finalBuffer = Buffer.from(await blob.arrayBuffer());
    } finally {
      await fs.unlink(tmpInputPath).catch(() => {});
    }
  }

  // Get final dimensions
  const finalMeta = await sharp(finalBuffer).metadata();
  const width = finalMeta.width || origWidth;
  const height = finalMeta.height || origHeight;

  const dataUrl = `data:image/png;base64,${finalBuffer.toString("base64")}`;
  const elapsedMs = Date.now() - startTime;

  return {
    success: true,
    dataUrl,
    width,
    height,
    elapsedMs
  };
}
