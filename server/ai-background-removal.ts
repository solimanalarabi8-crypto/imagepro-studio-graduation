import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { pathToFileURL } from "url";

// Safe dynamic loader for sharp to prevent crashes on systems lacking C++ native runtimes
let sharpModule: any = undefined;
async function getSharp() {
  if (sharpModule !== undefined) return sharpModule;
  try {
    const mod = await import("sharp");
    sharpModule = mod.default || mod;
  } catch (e) {
    console.warn("Sharp native module unavailable, falling back to pure JavaScript image parser:", (e as Error)?.message);
    sharpModule = null;
  }
  return sharpModule;
}

/**
 * Pure JavaScript image dimensions extractor (supports PNG and JPEG)
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  try {
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }

    // Check JPEG signature: FF D8
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        // SOF0 (0xC0) or SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const len = buffer.readUInt16BE(offset + 2);
        offset += 2 + len;
      }
    }
  } catch {
    /* fallback */
  }

  return { width: 800, height: 600 };
}

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
  const sharp = await getSharp();

  // 1. Convert input (base64 dataURL or raw buffer) to buffer
  let inputBuffer: Buffer;
  let fileExt = "png";
  if (typeof inputData === "string") {
    const base64Index = inputData.indexOf("base64,");
    if (base64Index !== -1) {
      if (inputData.includes("image/jpeg") || inputData.includes("image/jpg")) fileExt = "jpg";
      else if (inputData.includes("image/webp")) fileExt = "webp";
      inputBuffer = Buffer.from(inputData.slice(base64Index + 7), "base64");
    } else {
      inputBuffer = Buffer.from(inputData, "base64");
    }
  } else {
    inputBuffer = inputData;
  }

  // Inspect image dimensions
  let origWidth = 800;
  let origHeight = 600;

  if (sharp) {
    try {
      const meta = await sharp(inputBuffer).metadata();
      origWidth = meta.width || 800;
      origHeight = meta.height || 600;
    } catch {
      const dims = getImageDimensions(inputBuffer);
      origWidth = dims.width;
      origHeight = dims.height;
    }
  } else {
    const dims = getImageDimensions(inputBuffer);
    origWidth = dims.width;
    origHeight = dims.height;
  }

  // Resolve local neural model assets folder
  const publicDataDir = path.resolve(process.cwd(), "client/public/imgly-data");
  const publicPath = pathToFileURL(publicDataDir).href + "/";

  let finalBuffer: Buffer;

  // Check if Region of Interest (ROI) crop was requested AND sharp is available
  const hasRoi =
    Boolean(sharp) &&
    options.roi &&
    options.roi.width > 20 &&
    options.roi.height > 20 &&
    (options.roi.width < origWidth - 10 || options.roi.height < origHeight - 10);

  if (hasRoi && options.roi && sharp) {
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

    const cropBlob = new Blob([croppedBuffer], { type: "image/png" });
    const blob = await removeBackground(cropBlob, {
      publicPath,
      model: options.model || "small",
      debug: false,
    });
    const isolatedCropBuffer = Buffer.from(await blob.arrayBuffer());

    // Composite isolated crop onto full-size transparent canvas at original coordinates
    finalBuffer = await sharp({
      create: {
        width: origWidth,
        height: origHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: isolatedCropBuffer,
          left: cropX,
          top: cropY,
        },
      ])
      .png()
      .toBuffer();
  } else {
    // Process full image with Neural Network
    let normalizedInput = inputBuffer;
    let mimeType = "image/png";
    if (sharp) {
      try {
        normalizedInput = await sharp(inputBuffer).png().toBuffer();
      } catch {
        normalizedInput = inputBuffer;
        if (fileExt === "jpg") mimeType = "image/jpeg";
      }
    } else if (fileExt === "jpg") {
      mimeType = "image/jpeg";
    }

    const inputBlob = new Blob([normalizedInput], { type: mimeType });
    const blob = await removeBackground(inputBlob, {
      publicPath,
      model: options.model || "small",
      debug: false,
    });
    finalBuffer = Buffer.from(await blob.arrayBuffer());
  }

  // Get final dimensions
  let width = origWidth;
  let height = origHeight;

  if (sharp) {
    try {
      const finalMeta = await sharp(finalBuffer).metadata();
      width = finalMeta.width || origWidth;
      height = finalMeta.height || origHeight;
    } catch {
      const dims = getImageDimensions(finalBuffer);
      width = dims.width;
      height = dims.height;
    }
  } else {
    const dims = getImageDimensions(finalBuffer);
    width = dims.width;
    height = dims.height;
  }

  const dataUrl = `data:image/png;base64,${finalBuffer.toString("base64")}`;
  const elapsedMs = Date.now() - startTime;

  return {
    success: true,
    dataUrl,
    width,
    height,
    elapsedMs,
  };
}
