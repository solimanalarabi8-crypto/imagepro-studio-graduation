import * as ort from "onnxruntime-node";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface BackgroundRemovalOptions {
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  model?: "fast" | "ultra" | "small" | "medium" | "large";
  feather?: number;       // 0 to 20 px
  threshold?: number;     // 0.0 to 1.0 (default 0.5)
  defringe?: boolean;     // remove edge color bleeding
  matteMode?: "auto" | "sharp" | "soft";
}

export interface BackgroundRemovalResult {
  success: boolean;
  dataUrl: string;       // transparent PNG cutout
  maskDataUrl: string;   // 8-bit grayscale PNG mask
  width: number;
  height: number;
  elapsedMs: number;
  modelUsed: string;
  foregroundRatio: number;
}

// Persistent pre-warmed ONNX sessions for instant inference
let fastSessionPromise: Promise<ort.InferenceSession> | null = null;
let ultraSessionPromise: Promise<ort.InferenceSession> | null = null;

function getModelPath(filename: string): string {
  const localPath = path.resolve(process.cwd(), "server/models", filename);
  return localPath;
}

async function getFastSession(): Promise<ort.InferenceSession> {
  if (!fastSessionPromise) {
    const modelPath = getModelPath("u2netp.onnx");
    fastSessionPromise = ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
      executionMode: "parallel",
      intraOpNumThreads: 2,
    });
  }
  return fastSessionPromise;
}

async function getUltraSession(): Promise<ort.InferenceSession> {
  if (!ultraSessionPromise) {
    const modelPath = getModelPath("rmbg-1.4.onnx");
    ultraSessionPromise = ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
      executionMode: "parallel",
      intraOpNumThreads: 2,
    });
  }
  return ultraSessionPromise;
}

/**
 * Pre-warm the fast neural network at server startup so user's first click is instant.
 */
export function prewarmModels(): void {
  getFastSession().catch(err => console.warn("Prewarm fast model error:", err.message));
}

/**
 * Execute fast U2-NetP inference (320x320)
 */
async function runFastInference(
  inputBuffer: Buffer,
  cropW: number,
  cropH: number
): Promise<Uint8Array> {
  const session = await getFastSession();
  const { data: rawRgb } = await sharp(inputBuffer)
    .resize(320, 320, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const floatArr = new Float32Array(1 * 3 * 320 * 320);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const hw = 320 * 320;

  for (let i = 0; i < hw; i++) {
    floatArr[i] = ((rawRgb[i * 3] / 255) - mean[0]) / std[0];
    floatArr[hw + i] = ((rawRgb[i * 3 + 1] / 255) - mean[1]) / std[1];
    floatArr[hw * 2 + i] = ((rawRgb[i * 3 + 2] / 255) - mean[2]) / std[2];
  }

  const tensor = new ort.Tensor("float32", floatArr, [1, 3, 320, 320]);
  const results = await session.run({ [session.inputNames[0]]: tensor });
  const rawOut = results[session.outputNames[0]].data as Float32Array;

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < rawOut.length; i++) {
    const v = rawOut[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }
  const range = maxVal - minVal || 1;

  const mask320 = new Uint8Array(320 * 320);
  for (let i = 0; i < rawOut.length; i++) {
    const norm = (rawOut[i] - minVal) / range;
    mask320[i] = Math.round(norm * 255);
  }

  return mask320;
}

/**
 * Execute ultra-quality RMBG-1.4 inference (1024x1024)
 */
async function runUltraInference(
  inputBuffer: Buffer,
  cropW: number,
  cropH: number
): Promise<Uint8Array> {
  const session = await getUltraSession();
  const { data: rawRgb } = await sharp(inputBuffer)
    .resize(1024, 1024, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const floatArr = new Float32Array(1 * 3 * 1024 * 1024);
  const hw = 1024 * 1024;

  for (let i = 0; i < hw; i++) {
    floatArr[i] = (rawRgb[i * 3] / 255 - 0.5);
    floatArr[hw + i] = (rawRgb[i * 3 + 1] / 255 - 0.5);
    floatArr[hw * 2 + i] = (rawRgb[i * 3 + 2] / 255 - 0.5);
  }

  const tensor = new ort.Tensor("float32", floatArr, [1, 3, 1024, 1024]);
  const results = await session.run({ [session.inputNames[0]]: tensor });
  const rawOut = results[session.outputNames[0]].data as Float32Array;

  const mask1024 = new Uint8Array(hw);
  for (let i = 0; i < hw; i++) {
    const val = Math.max(0, Math.min(1, rawOut[i]));
    mask1024[i] = Math.round(val * 255);
  }

  return mask1024;
}

/**
 * Execute deep neural background removal using @imgly/background-removal-node (Pure Node.js AI runtime)
 */
async function runImglyRemoval(
  processBuffer: Buffer,
  origW: number,
  origH: number,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  hasRoi: boolean,
  modelName: "small" | "medium" | "large" = "small"
): Promise<{ fullMaskBytes: Buffer; fgPixels: number }> {
  const { removeBackground } = await import("@imgly/background-removal-node");

  // Speed optimization: Scale down the inference buffer to max 1024px.
  // Neural segmentation operates internally on 512-1024px, so feeding massive 2K/4K raw buffers to CPU WASM causes heavy lag.
  const maxInferenceDim = 1024;
  let inferBuffer: Buffer;
  if (cropW > maxInferenceDim || cropH > maxInferenceDim) {
    inferBuffer = await sharp(processBuffer)
      .rotate()
      .resize(maxInferenceDim, maxInferenceDim, { fit: "inside" })
      .png({ compressionLevel: 4 })
      .toBuffer();
  } else {
    inferBuffer = await sharp(processBuffer).rotate().png({ compressionLevel: 4 }).toBuffer();
  }

  const inputBlob = new Blob([inferBuffer], { type: "image/png" });
  const outputBlob = await removeBackground(inputBlob, { model: modelName });
  const outBuffer = Buffer.from(await outputBlob.arrayBuffer());

  // Upscale the neural mask back to full target resolution with high-fidelity Lanczos3 interpolation
  const { data: outRgba } = await sharp(outBuffer)
    .resize(cropW, cropH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cropAlpha = Buffer.alloc(cropW * cropH);
  let fgPixels = 0;
  for (let i = 0; i < cropW * cropH; i++) {
    const a = outRgba[i * 4 + 3];
    cropAlpha[i] = a;
    if (a > 64) fgPixels++;
  }

  let fullMaskBytes: Buffer;
  if (hasRoi) {
    fullMaskBytes = Buffer.alloc(origW * origH, 0);
    for (let row = 0; row < cropH; row++) {
      const srcOffset = row * cropW;
      const dstOffset = (cropY + row) * origW + cropX;
      cropAlpha.copy(fullMaskBytes, dstOffset, srcOffset, srcOffset + cropW);
    }
  } else {
    fullMaskBytes = cropAlpha;
  }

  return { fullMaskBytes, fgPixels };
}

/**
 * Primary Background Removal Pipeline
 */
export async function processBackgroundRemoval(
  inputData: string | Buffer,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const t0 = Date.now();

  // 1. Decode input buffer
  let inputBuffer: Buffer;
  if (typeof inputData === "string") {
    const commaIdx = inputData.indexOf("base64,");
    if (commaIdx !== -1) {
      inputBuffer = Buffer.from(inputData.slice(commaIdx + 7), "base64");
    } else {
      inputBuffer = Buffer.from(inputData, "base64");
    }
  } else {
    inputBuffer = inputData;
  }

  // AUTO-ROTATE based on camera EXIF orientation tag (crucial for smartphone portrait photos!)
  const rotatedBuffer = await sharp(inputBuffer).rotate().toBuffer();
  inputBuffer = rotatedBuffer;

  const meta = await sharp(inputBuffer).metadata();
  const origW = meta.width || 800;
  const origH = meta.height || 600;

  // 2. Handle ROI (Region of Interest) crop if requested
  const hasRoi =
    Boolean(options.roi &&
    options.roi.width > 20 &&
    options.roi.height > 20 &&
    (options.roi.width < origW - 10 || options.roi.height < origH - 10));

  const cropX = hasRoi && options.roi ? Math.max(0, Math.min(origW - 1, Math.round(options.roi.x))) : 0;
  const cropY = hasRoi && options.roi ? Math.max(0, Math.min(origH - 1, Math.round(options.roi.y))) : 0;
  const cropW = hasRoi && options.roi ? Math.min(origW - cropX, Math.round(options.roi.width)) : origW;
  const cropH = hasRoi && options.roi ? Math.min(origH - cropY, Math.round(options.roi.height)) : origH;

  let processBuffer = inputBuffer;
  if (hasRoi) {
    processBuffer = await sharp(inputBuffer)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .toBuffer();
  }

  // 3. Primary Engine: @imgly/background-removal-node (Pure Node.js AI)
  // This is the accurate neural engine requested by the user.
  let fullMaskBytes: Buffer | null = null;
  let fgPixels = 0;
  let modelUsed = "@imgly/background-removal-node (Neural AI)";

  const minExpectedFg = Math.max(40, Math.round(cropW * cropH * 0.005));

  // Try @imgly first
  try {
    const imglyRes = await runImglyRemoval(
      processBuffer,
      origW,
      origH,
      cropX,
      cropY,
      cropW,
      cropH,
      hasRoi,
      "small"
    );
    if (imglyRes.fgPixels >= minExpectedFg) {
      fullMaskBytes = imglyRes.fullMaskBytes;
      fgPixels = imglyRes.fgPixels;
      modelUsed = "@imgly/background-removal-node";
    } else {
      console.warn(`@imgly yielded only ${imglyRes.fgPixels} fg pixels, attempting fallback...`);
    }
  } catch (imglyErr) {
    console.warn("@imgly model failed:", imglyErr);
  }

  // Fallback to u2netp if @imgly didn't find sufficient foreground
  if (!fullMaskBytes) {
    try {
      const rawMaskBytes = await runFastInference(processBuffer, cropW, cropH);
      const maskSharp = sharp(Buffer.from(rawMaskBytes), {
        raw: { width: 320, height: 320, channels: 1 },
      }).resize(cropW, cropH, { fit: "fill", kernel: "lanczos3" });
      const cropMaskBuffer = await maskSharp.raw().toBuffer();
      if (hasRoi) {
        const full = Buffer.alloc(origW * origH, 0);
        for (let row = 0; row < cropH; row++) {
          const srcOffset = row * cropW;
          const dstOffset = (cropY + row) * origW + cropX;
          cropMaskBuffer.copy(full, dstOffset, srcOffset, srcOffset + cropW);
        }
        fullMaskBytes = full;
      } else {
        fullMaskBytes = cropMaskBuffer;
      }
      fgPixels = 0;
      for (let i = 0; i < origW * origH; i++) {
        if (fullMaskBytes[i] > 128) fgPixels++;
      }
      modelUsed = "u2netp (Backup)";
    } catch (fastErr) {
      console.error("Fast fallback also failed:", fastErr);
    }
  }

  if (!fullMaskBytes || fgPixels < Math.max(20, Math.round(origW * origH * 0.002))) {
    throw new Error(
      "لم يتمكن محرك الذكاء الاصطناعي من تمييز عنصر رئيسي لعزله في هذه الصورة (صُنفت أغلب البيكسلات كخلفية). يرجى التأكد من وضوح العنصر أو تحديد المنطقة يدوياً."
    );
  }

  const totalPixels = origW * origH;
  const foregroundRatio = Number((fgPixels / totalPixels).toFixed(3));

  // 6. Generate final RGBA transparent cutout
  // Directly composite the smooth, anti-aliased neural mask with the original input pixels
  const origRgba = await sharp(inputBuffer).ensureAlpha().raw().toBuffer();

  for (let i = 0; i < totalPixels; i++) {
    origRgba[i * 4 + 3] = fullMaskBytes[i];
  }

  // 7. Render high-quality PNG outputs
  const transparentPng = await sharp(origRgba, {
    raw: { width: origW, height: origH, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();

  // High-compatibility Alpha Mask: Generate RGBA PNG where RGB is mask grayscale AND Alpha is mask transparency
  // This allows HTML5 2D canvas destination-in and standard image elements to immediately use the alpha channel
  const alphaMaskBytes = Buffer.alloc(origW * origH * 4);
  for (let i = 0; i < totalPixels; i++) {
    const val = fullMaskBytes[i];
    alphaMaskBytes[i * 4] = val;
    alphaMaskBytes[i * 4 + 1] = val;
    alphaMaskBytes[i * 4 + 2] = val;
    alphaMaskBytes[i * 4 + 3] = val;
  }

  const maskPng = await sharp(alphaMaskBytes, {
    raw: { width: origW, height: origH, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const elapsedMs = Date.now() - t0;

  return {
    success: true,
    dataUrl: `data:image/png;base64,${transparentPng.toString("base64")}`,
    maskDataUrl: `data:image/png;base64,${maskPng.toString("base64")}`,
    width: origW,
    height: origH,
    elapsedMs,
    modelUsed,
    foregroundRatio,
  };
}

/**
 * Server-side Background Effects Processor (Portrait Bokeh, Studio Backdrops, Color Splash, Dimming)
 */
export interface BackgroundEffectOptions {
  effect: "bokeh" | "color-splash" | "dim" | "motion-blur" | "solid" | "gradient" | "backdrop-image" | "rim-light";
  blurRadius?: number;       // 1 - 80
  depthGradient?: boolean;   // portrait depth-of-field
  solidColor?: string;       // hex or rgb
  gradientType?: "studio-dark" | "navy" | "sunset" | "cyber" | "soft-gray";
  dimAmount?: number;        // 0.1 - 0.9
  backdropDataUrl?: string;  // user uploaded custom backdrop
}

export async function processBackgroundEffect(
  originalData: string | Buffer,
  maskData: string | Buffer,
  options: BackgroundEffectOptions
): Promise<{ success: boolean; dataUrl: string; elapsedMs: number }> {
  const t0 = Date.now();

  const decodeBuffer = (d: string | Buffer) => {
    if (typeof d === "string") {
      const idx = d.indexOf("base64,");
      return Buffer.from(idx !== -1 ? d.slice(idx + 7) : d, "base64");
    }
    return d;
  };

  const origBuffer = decodeBuffer(originalData);
  const maskBuffer = decodeBuffer(maskData);

  const meta = await sharp(origBuffer).metadata();
  const W = meta.width || 800;
  const H = meta.height || 600;

  // Prepare normalized raw mask [W x H]
  const maskRaw = await sharp(maskBuffer)
    .resize(W, H, { fit: "fill" })
    .toColourspace("b-w")
    .raw()
    .toBuffer();

  const origRgba = await sharp(origBuffer).ensureAlpha().raw().toBuffer();
  let bgRgba: Buffer;

  switch (options.effect) {
    case "bokeh": {
      const blurRadius = Math.max(1, Math.min(80, options.blurRadius || 20));
      bgRgba = await sharp(origBuffer)
        .blur(blurRadius)
        .ensureAlpha()
        .raw()
        .toBuffer();
      break;
    }

    case "color-splash": {
      // Background converted to black & white
      bgRgba = await sharp(origBuffer)
        .grayscale()
        .ensureAlpha()
        .raw()
        .toBuffer();
      break;
    }

    case "dim": {
      const factor = 1 - Math.max(0.1, Math.min(0.9, options.dimAmount || 0.5));
      bgRgba = await sharp(origBuffer)
        .modulate({ brightness: factor })
        .ensureAlpha()
        .raw()
        .toBuffer();
      break;
    }

    case "solid": {
      const hex = options.solidColor || "#ffffff";
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      bgRgba = Buffer.alloc(W * H * 4);
      for (let i = 0; i < W * H; i++) {
        bgRgba[i * 4] = r;
        bgRgba[i * 4 + 1] = g;
        bgRgba[i * 4 + 2] = b;
        bgRgba[i * 4 + 3] = 255;
      }
      break;
    }

    case "gradient": {
      // Create rich SVG gradient background
      let g1 = "#1e293b", g2 = "#0f172a";
      if (options.gradientType === "navy") {
        g1 = "#0f2027"; g2 = "#203a43";
      } else if (options.gradientType === "sunset") {
        g1 = "#4a00e0"; g2 = "#8e2de2";
      } else if (options.gradientType === "cyber") {
        g1 = "#050505"; g2 = "#1a002c";
      } else if (options.gradientType === "soft-gray") {
        g1 = "#334155"; g2 = "#1e293b";
      }

      const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad" cx="50%" cy="40%" r="70%" fx="50%" fy="30%">
            <stop offset="0%" stop-color="${g2}" />
            <stop offset="100%" stop-color="${g1}" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>`;
      bgRgba = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
      break;
    }

    default: {
      bgRgba = await sharp(origBuffer).ensureAlpha().raw().toBuffer();
      break;
    }
  }

  // Composite: result = (Subject * alpha) + (Background * (1 - alpha))
  const compositeRgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = maskRaw[i] / 255;
    const invA = 1 - a;

    compositeRgba[i * 4] = Math.round(origRgba[i * 4] * a + bgRgba[i * 4] * invA);
    compositeRgba[i * 4 + 1] = Math.round(origRgba[i * 4 + 1] * a + bgRgba[i * 4 + 1] * invA);
    compositeRgba[i * 4 + 2] = Math.round(origRgba[i * 4 + 2] * a + bgRgba[i * 4 + 2] * invA);
    compositeRgba[i * 4 + 3] = 255;
  }

  const outPng = await sharp(compositeRgba, {
    raw: { width: W, height: H, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();

  return {
    success: true,
    dataUrl: `data:image/png;base64,${outPng.toString("base64")}`,
    elapsedMs: Date.now() - t0,
  };
}
