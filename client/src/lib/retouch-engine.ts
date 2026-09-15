/**
 * ImagePro Studio — Retouching & Defect Removal Engine (Point 8)
 *
 * Implements professional digital retouching algorithms:
 * 1. Clone Stamp: Soft-edged source-to-target copy with adjustable feather & opacity.
 * 2. Healing Brush: Seamless texture synthesis blending source details with target luminance/chroma.
 * 3. Spot Healing: One-click local circular defect removal via boundary diffusion.
 * 4. Red-Eye Removal: Pupil red-channel suppression with specular catchlight preservation.
 * 5. Smart Skin Smoothing: Edge-preserving bilateral filter restricted to skin-tone gamut.
 * 6. Content-Aware / Inpainting Fill: Patch-diffusion defect fill for selected regions.
 * 7. Background Removal: Intelligent boundary color clustering with soft alpha matting.
 */

export interface CloneSourcePoint {
  x: number;
  y: number;
}

export interface RetouchOptions {
  radius: number; // 2 to 100 px
  opacity: number; // 10 to 100%
  hardness: number; // 0 (feathered) to 100 (hard)
}

/**
 * 1. Clone Stamp
 * Copies pixels from source (sx, sy) to target (tx, ty) with circular feathered brush.
 */
export function applyCloneStamp(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  targetX: number,
  targetY: number,
  sourceX: number,
  sourceY: number,
  radius: number,
  opacity: number = 100,
  hardness: number = 80
): boolean {
  const r = Math.max(2, Math.round(radius));
  const minX = Math.max(0, Math.floor(targetX - r));
  const minY = Math.max(0, Math.floor(targetY - r));
  const maxX = Math.min(canvasWidth - 1, Math.ceil(targetX + r));
  const maxY = Math.min(canvasHeight - 1, Math.ceil(targetY + r));

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  if (boxW <= 0 || boxH <= 0) return false;

  const targetImgData = context.getImageData(minX, minY, boxW, boxH);
  const targetData = targetImgData.data;

  // Offset vector from target to source
  const offsetX = Math.round(sourceX - targetX);
  const offsetY = Math.round(sourceY - targetY);

  // Read full canvas to sample source safely
  const fullImgData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const fullData = fullImgData.data;

  const featherRatio = Math.max(0, Math.min(1, hardness / 100));
  const innerR = r * featherRatio;
  const alphaFactor = Math.max(0.1, Math.min(1, opacity / 100));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - targetX, y - targetY);
      if (dist > r) continue;

      let falloff = 1;
      if (dist > innerR) {
        falloff = 0.5 * (1 + Math.cos(Math.PI * (dist - innerR) / (r - innerR)));
      }
      const blendWeight = falloff * alphaFactor;

      const sx = Math.max(0, Math.min(canvasWidth - 1, x + offsetX));
      const sy = Math.max(0, Math.min(canvasHeight - 1, y + offsetY));

      const srcIdx = (sy * canvasWidth + sx) * 4;
      const tgtLocalIdx = ((y - minY) * boxW + (x - minX)) * 4;

      targetData[tgtLocalIdx] = Math.round(targetData[tgtLocalIdx] * (1 - blendWeight) + fullData[srcIdx] * blendWeight);
      targetData[tgtLocalIdx + 1] = Math.round(targetData[tgtLocalIdx + 1] * (1 - blendWeight) + fullData[srcIdx + 1] * blendWeight);
      targetData[tgtLocalIdx + 2] = Math.round(targetData[tgtLocalIdx + 2] * (1 - blendWeight) + fullData[srcIdx + 2] * blendWeight);
      targetData[tgtLocalIdx + 3] = Math.max(targetData[tgtLocalIdx + 3], fullData[srcIdx + 3]);
    }
  }

  context.putImageData(targetImgData, minX, minY);
  return true;
}

/**
 * 2. Healing Brush
 * Blends source texture details with target region's color and luminance.
 */
export function applyHealingBrush(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  targetX: number,
  targetY: number,
  sourceX: number,
  sourceY: number,
  radius: number,
  opacity: number = 100,
  hardness: number = 70
): boolean {
  const r = Math.max(2, Math.round(radius));
  const minX = Math.max(0, Math.floor(targetX - r));
  const minY = Math.max(0, Math.floor(targetY - r));
  const maxX = Math.min(canvasWidth - 1, Math.ceil(targetX + r));
  const maxY = Math.min(canvasHeight - 1, Math.ceil(targetY + r));

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  if (boxW <= 0 || boxH <= 0) return false;

  const targetImgData = context.getImageData(minX, minY, boxW, boxH);
  const targetData = targetImgData.data;

  const offsetX = Math.round(sourceX - targetX);
  const offsetY = Math.round(sourceY - targetY);

  const fullImgData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const fullData = fullImgData.data;

  // Calculate average luminance of target and source patches
  let sumSrcLum = 0;
  let sumTgtLum = 0;
  let count = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - targetX, y - targetY);
      if (dist <= r) {
        const sx = Math.max(0, Math.min(canvasWidth - 1, x + offsetX));
        const sy = Math.max(0, Math.min(canvasHeight - 1, y + offsetY));
        const sIdx = (sy * canvasWidth + sx) * 4;
        const tIdx = ((y - minY) * boxW + (x - minX)) * 4;

        sumSrcLum += 0.299 * fullData[sIdx] + 0.587 * fullData[sIdx + 1] + 0.114 * fullData[sIdx + 2];
        sumTgtLum += 0.299 * targetData[tIdx] + 0.587 * targetData[tIdx + 1] + 0.114 * targetData[tIdx + 2];
        count++;
      }
    }
  }

  const avgSrcLum = count > 0 ? sumSrcLum / count : 128;
  const avgTgtLum = count > 0 ? sumTgtLum / count : 128;
  const lumDelta = avgTgtLum - avgSrcLum;

  const featherRatio = Math.max(0, Math.min(1, hardness / 100));
  const innerR = r * featherRatio;
  const alphaFactor = Math.max(0.1, Math.min(1, opacity / 100));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - targetX, y - targetY);
      if (dist > r) continue;

      let falloff = 1;
      if (dist > innerR) {
        falloff = 0.5 * (1 + Math.cos(Math.PI * (dist - innerR) / (r - innerR)));
      }
      const blendWeight = falloff * alphaFactor;

      const sx = Math.max(0, Math.min(canvasWidth - 1, x + offsetX));
      const sy = Math.max(0, Math.min(canvasHeight - 1, y + offsetY));

      const sIdx = (sy * canvasWidth + sx) * 4;
      const tIdx = ((y - minY) * boxW + (x - minX)) * 4;

      // Transfer source texture high frequencies, adjust luminance to match target
      const healedR = Math.max(0, Math.min(255, fullData[sIdx] + lumDelta));
      const healedG = Math.max(0, Math.min(255, fullData[sIdx + 1] + lumDelta));
      const healedB = Math.max(0, Math.min(255, fullData[sIdx + 2] + lumDelta));

      targetData[tIdx] = Math.round(targetData[tIdx] * (1 - blendWeight) + healedR * blendWeight);
      targetData[tIdx + 1] = Math.round(targetData[tIdx + 1] * (1 - blendWeight) + healedG * blendWeight);
      targetData[tIdx + 2] = Math.round(targetData[tIdx + 2] * (1 - blendWeight) + healedB * blendWeight);
    }
  }

  context.putImageData(targetImgData, minX, minY);
  return true;
}

/**
 * 3. Spot Healing
 * One-click circular defect removal by sampling the perimeter ring and diffusing inward.
 */
export function applySpotHealing(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const r = Math.max(3, Math.round(radius));
  const minX = Math.max(0, Math.floor(cx - r - 2));
  const minY = Math.max(0, Math.floor(cy - r - 2));
  const maxX = Math.min(canvasWidth - 1, Math.ceil(cx + r + 2));
  const maxY = Math.min(canvasHeight - 1, Math.ceil(cy + r + 2));

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  if (boxW <= 0 || boxH <= 0) return false;

  const imgData = context.getImageData(minX, minY, boxW, boxH);
  const data = imgData.data;

  // Gather boundary ring samples around [r * 0.85, r * 1.25]
  const ringSamples: { x: number; y: number; r: number; g: number; b: number }[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist >= r * 0.85 && dist <= r * 1.25) {
        const idx = ((y - minY) * boxW + (x - minX)) * 4;
        ringSamples.push({
          x,
          y,
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        });
      }
    }
  }

  if (ringSamples.length === 0) return false;

  // Diffuse into inner defect circle with inverse-distance weighting
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < r) {
        let totalWeight = 0;
        let weightedR = 0;
        let weightedG = 0;
        let weightedB = 0;

        for (let i = 0; i < ringSamples.length; i += 2) {
          const s = ringSamples[i];
          const d = Math.max(0.5, Math.hypot(x - s.x, y - s.y));
          const w = 1 / (d * d);
          weightedR += s.r * w;
          weightedG += s.g * w;
          weightedB += s.b * w;
          totalWeight += w;
        }

        const idx = ((y - minY) * boxW + (x - minX)) * 4;
        const newR = weightedR / totalWeight;
        const newG = weightedG / totalWeight;
        const newB = weightedB / totalWeight;

        // Smooth cosine falloff toward the perimeter
        const t = dist / r;
        const falloff = 0.5 * (1 + Math.cos(Math.PI * t)); // 1 at center, 0 at boundary

        data[idx] = Math.round(data[idx] * (1 - falloff) + newR * falloff);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - falloff) + newG * falloff);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - falloff) + newB * falloff);
      }
    }
  }

  context.putImageData(imgData, minX, minY);
  return true;
}

/**
 * 4. Red-Eye Removal
 * Detects hyper-saturated red pupil pixels and desaturates them while preserving specular highlights.
 */
export function applyRedEyeRemoval(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  pupilX: number,
  pupilY: number,
  radius: number = 14
): boolean {
  const r = Math.max(4, Math.round(radius));
  const minX = Math.max(0, Math.floor(pupilX - r));
  const minY = Math.max(0, Math.floor(pupilY - r));
  const maxX = Math.min(canvasWidth - 1, Math.ceil(pupilX + r));
  const maxY = Math.min(canvasHeight - 1, Math.ceil(pupilY + r));

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  if (boxW <= 0 || boxH <= 0) return false;

  const imgData = context.getImageData(minX, minY, boxW, boxH);
  const data = imgData.data;
  let affectedPixels = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - pupilX, y - pupilY);
      if (dist > r) continue;

      const idx = ((y - minY) * boxW + (x - minX)) * 4;
      const red = data[idx];
      const green = data[idx + 1];
      const blue = data[idx + 2];

      // Preserve specular catchlights (very bright highlights in the eye)
      const brightness = (red + green + blue) / 3;
      if (brightness > 220) continue;

      const maxOther = Math.max(green, blue);
      // Red eye signature: Red significantly exceeds Green and Blue
      if (red > 50 && red > 1.25 * maxOther) {
        const falloff = 1 - (dist / r);
        const naturalGray = Math.round(0.5 * green + 0.5 * blue);

        data[idx] = Math.round(red * (1 - falloff) + naturalGray * falloff);
        data[idx + 1] = Math.round(green * (1 - falloff * 0.2) + naturalGray * (falloff * 0.2));
        data[idx + 2] = Math.round(blue * (1 - falloff * 0.2) + naturalGray * (falloff * 0.2));
        affectedPixels++;
      }
    }
  }

  if (affectedPixels > 0) {
    context.putImageData(imgData, minX, minY);
    return true;
  }
  return false;
}

/**
 * 5. Smart Skin Smoothing
 * An edge-preserving bilateral filter that selectively targets skin tones while
 * keeping eyes, eyebrows, hair, and facial features crisp and sharp.
 */
export function applySkinSmoothing(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  intensity: number = 50, // 1 to 100
  roi?: { x: number; y: number; width: number; height: number } | null
): boolean {
  const minX = roi ? Math.max(0, Math.floor(roi.x)) : 0;
  const minY = roi ? Math.max(0, Math.floor(roi.y)) : 0;
  const maxX = roi ? Math.min(canvasWidth - 1, Math.ceil(roi.x + roi.width)) : canvasWidth - 1;
  const maxY = roi ? Math.min(canvasHeight - 1, Math.ceil(roi.y + roi.height)) : canvasHeight - 1;

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  if (w <= 0 || h <= 0) return false;

  const srcImgData = context.getImageData(minX, minY, w, h);
  const src = srcImgData.data;
  const outImgData = context.createImageData(w, h);
  const out = outImgData.data;

  // Copy original by default
  out.set(src);

  const radius = Math.max(1, Math.min(5, Math.round((intensity / 100) * 4) + 1));
  const spatialSigma = radius;
  const rangeSigma = Math.max(10, 45 - (intensity * 0.25)); // color difference threshold
  const strength = intensity / 100;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const centerIdx = (y * w + x) * 4;
      const cR = src[centerIdx];
      const cG = src[centerIdx + 1];
      const cB = src[centerIdx + 2];

      // Fast Skin Tone Classifier in normalized RGB:
      // (R > G > B, with sufficient red saturation and warm tone)
      const isSkinTone =
        cR > 50 &&
        cG > 35 &&
        cB > 20 &&
        cR > cG &&
        cG > cB &&
        (cR - cG) > 10 &&
        (cR - cB) > 15 &&
        cR < 250;

      if (!isSkinTone) {
        continue;
      }

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumW = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;

          const nIdx = (ny * w + nx) * 4;
          const nR = src[nIdx];
          const nG = src[nIdx + 1];
          const nB = src[nIdx + 2];

          // Spatial gaussian weight
          const dSpatialSq = dx * dx + dy * dy;
          const wSpatial = Math.exp(-dSpatialSq / (2 * spatialSigma * spatialSigma));

          // Photometric / Range weight (stops blurring at prominent edges!)
          const dColor = Math.hypot(nR - cR, nG - cG, nB - cB);
          const wRange = Math.exp(-(dColor * dColor) / (2 * rangeSigma * rangeSigma));

          const wTotal = wSpatial * wRange;
          sumR += nR * wTotal;
          sumG += nG * wTotal;
          sumB += nB * wTotal;
          sumW += wTotal;
        }
      }

      if (sumW > 0) {
        const smoothR = sumR / sumW;
        const smoothG = sumG / sumW;
        const smoothB = sumB / sumW;

        out[centerIdx] = Math.round(cR * (1 - strength) + smoothR * strength);
        out[centerIdx + 1] = Math.round(cG * (1 - strength) + smoothG * strength);
        out[centerIdx + 2] = Math.round(cB * (1 - strength) + smoothB * strength);
      }
    }
  }

  context.putImageData(outImgData, minX, minY);
  return true;
}

/**
 * 6. Content-Aware Inpainting Fill
 * Removes selected object or defect and fills it smoothly with surrounding texture.
 */
export function applyInpaintFill(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  selection: { x: number; y: number; width: number; height: number }
): boolean {
  const minX = Math.max(0, Math.floor(selection.x));
  const minY = Math.max(0, Math.floor(selection.y));
  const maxX = Math.min(canvasWidth - 1, Math.ceil(selection.x + selection.width));
  const maxY = Math.min(canvasHeight - 1, Math.ceil(selection.y + selection.height));

  const selW = maxX - minX + 1;
  const selH = maxY - minY + 1;
  if (selW <= 3 || selH <= 3) return false;

  // Margin for boundary sampling
  const pad = Math.min(30, Math.max(8, Math.round(Math.min(selW, selH) * 0.4)));
  const bMinX = Math.max(0, minX - pad);
  const bMinY = Math.max(0, minY - pad);
  const bMaxX = Math.min(canvasWidth - 1, maxX + pad);
  const bMaxY = Math.min(canvasHeight - 1, maxY + pad);

  const blockW = bMaxX - bMinX + 1;
  const blockH = bMaxY - bMinY + 1;

  const imgData = context.getImageData(bMinX, bMinY, blockW, blockH);
  const data = imgData.data;

  // Collect boundary samples around selection perimeter
  const borderPixels: { x: number; y: number; r: number; g: number; b: number }[] = [];

  for (let y = bMinY; y <= bMaxY; y++) {
    for (let x = bMinX; x <= bMaxX; x++) {
      const isInsideSel = x >= minX && x <= maxX && y >= minY && y <= maxY;
      if (!isInsideSel) {
        const localIdx = ((y - bMinY) * blockW + (x - bMinX)) * 4;
        borderPixels.push({
          x,
          y,
          r: data[localIdx],
          g: data[localIdx + 1],
          b: data[localIdx + 2],
        });
      }
    }
  }

  if (borderPixels.length === 0) return false;

  // Bilinear + Inverse Distance boundary diffusion
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const localIdx = ((y - bMinY) * blockW + (x - bMinX)) * 4;

      let sumW = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      // Sample border pixels in steps for speed
      const step = Math.max(1, Math.floor(borderPixels.length / 40));
      for (let i = 0; i < borderPixels.length; i += step) {
        const bp = borderPixels[i];
        const dist = Math.max(1, Math.hypot(x - bp.x, y - bp.y));
        const w = 1 / (dist * dist);
        sumR += bp.r * w;
        sumG += bp.g * w;
        sumB += bp.b * w;
        sumW += w;
      }

      if (sumW > 0) {
        // Add subtle natural variation to avoid plastic flat look
        const noise = (Math.random() - 0.5) * 4;
        data[localIdx] = Math.max(0, Math.min(255, Math.round(sumR / sumW + noise)));
        data[localIdx + 1] = Math.max(0, Math.min(255, Math.round(sumG / sumW + noise)));
        data[localIdx + 2] = Math.max(0, Math.min(255, Math.round(sumB / sumW + noise)));
      }
    }
  }

  context.putImageData(imgData, bMinX, bMinY);
  return true;
}

/**
 * 7. Background Removal
 * Samples corner seeds to cluster background colors and feathers alpha transparency.
 */
export function applyBackgroundRemoval(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tolerance: number = 30 // 10 to 60
): boolean {
  if (canvasWidth <= 0 || canvasHeight <= 0) return false;

  const imgData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imgData.data;

  // Sample corner background reference pixels
  const cornerCoords = [
    [0, 0],
    [canvasWidth - 1, 0],
    [0, canvasHeight - 1],
    [canvasWidth - 1, canvasHeight - 1],
    [Math.floor(canvasWidth / 2), 0], // top-center
  ];

  const visited = new Uint8Array(canvasWidth * canvasHeight);
  const queue: number[] = [];

  const pushQ = (x: number, y: number) => {
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;
    const pIdx = y * canvasWidth + x;
    if (visited[pIdx] === 0) {
      visited[pIdx] = 1;
      queue.push(x, y);
    }
  };

  // Initialize queue with border pixels (top, bottom, left, right)
  for (let x = 0; x < canvasWidth; x++) {
    pushQ(x, 0);
    pushQ(x, canvasHeight - 1);
  }
  for (let y = 1; y < canvasHeight - 1; y++) {
    pushQ(0, y);
    pushQ(canvasWidth - 1, y);
  }

  // Get average background color from corners
  let br = 0, bg = 0, bb = 0;
  for (const [cx, cy] of cornerCoords) {
    const idx = (cy * canvasWidth + cx) * 4;
    br += data[idx]; bg += data[idx + 1]; bb += data[idx + 2];
  }
  br /= cornerCoords.length; bg /= cornerCoords.length; bb /= cornerCoords.length;

  // BFS Flood Fill from edges
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    
    const pIdx = y * canvasWidth + x;
    const dataIdx = pIdx * 4;
    const r = data[dataIdx];
    const g = data[dataIdx + 1];
    const b = data[dataIdx + 2];

    const diffSq = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
    const diff = Math.sqrt(diffSq);

    if (diff <= tolerance) {
      data[dataIdx + 3] = 0; // Make transparent
      
      // Add neighbors
      pushQ(x - 1, y);
      pushQ(x + 1, y);
      pushQ(x, y - 1);
      pushQ(x, y + 1);
    } else if (diff <= tolerance + 15) {
      // Soft anti-aliasing edge
      const alphaT = (diff - tolerance) / 15;
      data[dataIdx + 3] = Math.round(data[dataIdx + 3] * alphaT);
    }
  }

  context.putImageData(imgData, 0, 0);
  return true;
}
