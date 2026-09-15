export type FilterMode =
  | "none"
  | "blur"
  | "box_blur"
  | "motion"
  | "sharpen"
  | "unsharp"
  | "edges"
  | "sobel"
  | "canny"
  | "emboss"
  | "noise"
  | "median"
  | "bilateral"
  | "pixelate"
  | "posterize"
  | "vintage"
  | "sepia"
  | "vignette"
  | "duotone"
  | "sketch"
  | "oil"
  | "charcoal";

export type FilterCategory = "تمويه" | "حدة" | "حواف" | "ضوضاء" | "هندسية" | "لونية" | "فنية";

export interface FilterDefinition {
  id: FilterMode;
  nameArabic: string;
  category: FilterCategory;
  description: string;
  defaultIntensity: number;
  intensityLabel?: string;
  minIntensity?: number;
  maxIntensity?: number;
}

export const FILTER_CATALOG: FilterDefinition[] = [
  { id: "none", nameArabic: "أصل الصورة", category: "فنية", description: "الصورة الطبيعية بدون أي مرشح", defaultIntensity: 0 },
  // 1. التمويه
  { id: "blur", nameArabic: "تمويه جاوسي (Gaussian)", category: "تمويه", description: "تنعيم وتشتيت الضوء بانسيابية", defaultIntensity: 50, intensityLabel: "نصف قطر التمويه" },
  { id: "box_blur", nameArabic: "تمويه صندوقي (Box)", category: "تمويه", description: "توسيط لوني موحد لتنعيم الضوء", defaultIntensity: 50, intensityLabel: "قوة التمويه" },
  { id: "motion", nameArabic: "تمويه حركي (Motion)", category: "تمويه", description: "محاكاة حركة السرعة الأفقية", defaultIntensity: 60, intensityLabel: "مدى الحركة" },
  // 2. الحدة
  { id: "sharpen", nameArabic: "زيادة الحدة (Sharpen)", category: "حدة", description: "إبراز التفاصيل الدقيقة والمحيط", defaultIntensity: 50, intensityLabel: "قوة الحدة" },
  { id: "unsharp", nameArabic: "قناع الحدة الفائق (Unsharp)", category: "حدة", description: "تعزيز التباين المجهري للحواف", defaultIntensity: 60, intensityLabel: "عمق القناع" },
  // 3. الحواف
  { id: "sobel", nameArabic: "كشف الحواف (Sobel)", category: "حواف", description: "استخراج التدرج الرياضي لاكتشاف الحواف", defaultIntensity: 50, intensityLabel: "حساسية الحواف" },
  { id: "canny", nameArabic: "كشف دقيق (Canny)", category: "حواف", description: "عتبة مزدوجة لخطوط حواف متصلة نقية", defaultIntensity: 50, intensityLabel: "عتبة الكشف" },
  { id: "edges", nameArabic: "كشف الحواف (Laplacian)", category: "حواف", description: "استخراج تفاصيل التردد العالي", defaultIntensity: 50, intensityLabel: "كثافة الخطوط" },
  { id: "emboss", nameArabic: "نقش بارز (Emboss)", category: "حواف", description: "تأثير مجسم ثلاثي الأبعاد بارز", defaultIntensity: 50, intensityLabel: "عمق البروز" },
  // 4. الضوضاء
  { id: "noise", nameArabic: "إضافة ضوضاء (Noise)", category: "ضوضاء", description: "حبيبات فيلمية سينمائية كلاسيكية", defaultIntensity: 35, intensityLabel: "كمية الضوضاء", maxIntensity: 100 },
  { id: "median", nameArabic: "الفلتر الوسيط (Median)", category: "ضوضاء", description: "إزالة الشوائب والضوضاء مع حماية الحواف", defaultIntensity: 50, intensityLabel: "قوة التصفية" },
  { id: "bilateral", nameArabic: "تنعيم ثنائي (Bilateral)", category: "ضوضاء", description: "تنعيم ذكي يحفظ الحدود وتفاصيل الوجه", defaultIntensity: 50, intensityLabel: "نعومة النسيج" },
  // 5. هندسية
  { id: "pixelate", nameArabic: "فسيفساء وبكسلة (Pixelate)", category: "هندسية", description: "تجزئة الصورة إلى مربعات بكسل", defaultIntensity: 45, intensityLabel: "حجم المربعات", minIntensity: 10, maxIntensity: 100 },
  { id: "posterize", nameArabic: "ملصق نغمي (Posterize)", category: "هندسية", description: "تقليص التدرجات إلى مساحات لونية صلبة", defaultIntensity: 50, intensityLabel: "عدد المستويات", minIntensity: 10, maxIntensity: 100 },
  // 6. لونية
  { id: "vintage", nameArabic: "عتيق ريترو (Vintage)", category: "لونية", description: "ألوان دافئة ونغمات كلاسيكية", defaultIntensity: 70, intensityLabel: "قوة التأثير" },
  { id: "sepia", nameArabic: "سيبيا فوتوغرافي (Sepia)", category: "لونية", description: "درجات بنية تاريخية تحاكي الصور القديمة", defaultIntensity: 80, intensityLabel: "كثافة السيبيا" },
  { id: "vignette", nameArabic: "تعتيم الأطراف (Vignette)", category: "لونية", description: "تركيز الضوء على المركز وتظليل الزوايا", defaultIntensity: 65, intensityLabel: "عمق الظل" },
  { id: "duotone", nameArabic: "ثنائي اللون (Duotone)", category: "لونية", description: "تلوين إنديجو وتركواز حديث", defaultIntensity: 80, intensityLabel: "تشبع النغمتين" },
  // 7. فنية
  { id: "sketch", nameArabic: "رسم رصاص (Sketch)", category: "فنية", description: "تحويل تفاصيل الصورة إلى خطوط قلم رصاص", defaultIntensity: 60, intensityLabel: "تباين التخطيط" },
  { id: "oil", nameArabic: "لوحة زيتية (Oil Painting)", category: "فنية", description: "محاكاة ضربات الفرشاة الفنية الكثيفة", defaultIntensity: 50, intensityLabel: "حجم ضربة الفرشاة" },
  { id: "charcoal", nameArabic: "رسم فحم (Charcoal)", category: "فنية", description: "تظليل فحمي عالي الدراما والتباين", defaultIntensity: 65, intensityLabel: "كثافة الفحم" },
];

export function applyKernel(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  kernel: number[],
  divisor: number,
  offset: number
) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const sourceData = source.data;
  const outputData = output.data;
  const side = 3;
  const half = 1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let kernelY = 0; kernelY < side; kernelY += 1) {
        for (let kernelX = 0; kernelX < side; kernelX += 1) {
          const scx = Math.min(width - 1, Math.max(0, x + kernelX - half));
          const scy = Math.min(height - 1, Math.max(0, y + kernelY - half));
          const srcIndex = (scy * width + scx) * 4;
          const weight = kernel[kernelY * side + kernelX];

          red += sourceData[srcIndex] * weight;
          green += sourceData[srcIndex + 1] * weight;
          blue += sourceData[srcIndex + 2] * weight;
        }
      }

      const dstIndex = (y * width + x) * 4;
      outputData[dstIndex] = Math.min(255, Math.max(0, red / divisor + offset));
      outputData[dstIndex + 1] = Math.min(255, Math.max(0, green / divisor + offset));
      outputData[dstIndex + 2] = Math.min(255, Math.max(0, blue / divisor + offset));
      outputData[dstIndex + 3] = sourceData[dstIndex + 3];
    }
  }

  context.putImageData(output, 0, 0);
}

export function applySobel(context: CanvasRenderingContext2D, width: number, height: number, sensitivity: number = 50) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const mult = (sensitivity / 50);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      let idx = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * src[pixel] + 0.587 * src[pixel + 1] + 0.114 * src[pixel + 2];
          gx += lum * kx[idx];
          gy += lum * ky[idx];
          idx++;
        }
      }

      const mag = Math.min(255, Math.hypot(gx, gy) * mult);
      const outIdx = (y * width + x) * 4;
      dst[outIdx] = mag;
      dst[outIdx + 1] = mag;
      dst[outIdx + 2] = mag;
      dst[outIdx + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
}

export function applyCanny(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 50
) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const lowThresh = Math.max(10, 60 - (intensity * 0.4));
  const highThresh = lowThresh * 2.2;

  const mags = new Float32Array(width * height);
  const kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      let idx = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * src[pixel] + 0.587 * src[pixel + 1] + 0.114 * src[pixel + 2];
          gx += lum * kx[idx];
          gy += lum * ky[idx];
          idx++;
        }
      }
      mags[y * width + x] = Math.hypot(gx, gy);
    }
  }

  // Hysteresis thresholding
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = mags[idx];
      let edge = 0;

      if (mag >= highThresh) {
        edge = 255;
      } else if (mag >= lowThresh) {
        // Look for neighbor with strong edge
        for (let dy = -1; dy <= 1 && edge === 0; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (mags[(y + dy) * width + (x + dx)] >= highThresh) {
              edge = 255;
              break;
            }
          }
        }
      }

      const outIdx = idx * 4;
      dst[outIdx] = edge;
      dst[outIdx + 1] = edge;
      dst[outIdx + 2] = edge;
      dst[outIdx + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
}

export function applyMedian(context: CanvasRenderingContext2D, width: number, height: number) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const rArr = new Uint8Array(9);
  const gArr = new Uint8Array(9);
  const bArr = new Uint8Array(9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          rArr[n] = src[pixel];
          gArr[n] = src[pixel + 1];
          bArr[n] = src[pixel + 2];
          n++;
        }
      }

      // Simple insertion sort on 9 values
      for (let i = 1; i < 9; i++) {
        const tr = rArr[i]; const tg = gArr[i]; const tb = bArr[i];
        let j = i - 1;
        while (j >= 0 && rArr[j] > tr) { rArr[j + 1] = rArr[j]; j--; }
        rArr[j + 1] = tr;
        j = i - 1;
        while (j >= 0 && gArr[j] > tg) { gArr[j + 1] = gArr[j]; j--; }
        gArr[j + 1] = tg;
        j = i - 1;
        while (j >= 0 && bArr[j] > tb) { bArr[j + 1] = bArr[j]; j--; }
        bArr[j + 1] = tb;
      }

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = rArr[4];
      dst[outIdx + 1] = gArr[4];
      dst[outIdx + 2] = bArr[4];
      dst[outIdx + 3] = src[outIdx + 3];
    }
  }

  context.putImageData(output, 0, 0);
}

export function applyBilateral(context: CanvasRenderingContext2D, width: number, height: number, intensity: number = 50) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const sigmaColor = Math.max(15, (intensity / 50) * 35);
  const twoColorSigmaSq = 2 * sigmaColor * sigmaColor;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerIdx = (y * width + x) * 4;
      const cR = src[centerIdx];
      const cG = src[centerIdx + 1];
      const cB = src[centerIdx + 2];

      let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          const nR = src[pixel];
          const nG = src[pixel + 1];
          const nB = src[pixel + 2];

          const dDistSq = dx * dx + dy * dy;
          const dColorSq = (nR - cR) * (nR - cR) + (nG - cG) * (nG - cG) + (nB - cB) * (nB - cB);

          const w = Math.exp(-dDistSq / 4 - dColorSq / twoColorSigmaSq);
          sumR += nR * w;
          sumG += nG * w;
          sumB += nB * w;
          sumW += w;
        }
      }

      dst[centerIdx] = Math.round(sumR / sumW);
      dst[centerIdx + 1] = Math.round(sumG / sumW);
      dst[centerIdx + 2] = Math.round(sumB / sumW);
      dst[centerIdx + 3] = src[centerIdx + 3];
    }
  }

  context.putImageData(output, 0, 0);
}

export function applyPixelate(context: CanvasRenderingContext2D, width: number, height: number, size: number = 14) {
  const blockSize = Math.max(4, Math.round(size));
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const redIndex = (y * width + x) * 4;
      const red = data[redIndex];
      const green = data[redIndex + 1];
      const blue = data[redIndex + 2];

      for (let blockY = 0; blockY < blockSize && y + blockY < height; blockY += 1) {
        for (let blockX = 0; blockX < blockSize && x + blockX < width; blockX += 1) {
          const targetIndex = ((y + blockY) * width + (x + blockX)) * 4;
          data[targetIndex] = red;
          data[targetIndex + 1] = green;
          data[targetIndex + 2] = blue;
        }
      }
    }
  }
  context.putImageData(source, 0, 0);
}

export function applyPosterize(context: CanvasRenderingContext2D, width: number, height: number, levels: number = 4) {
  const safeLevels = Math.max(2, Math.min(16, Math.round(levels)));
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  const step = Math.floor(255 / (safeLevels - 1));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.round(data[i] / step) * step);
    data[i + 1] = Math.min(255, Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.min(255, Math.round(data[i + 2] / step) * step);
  }
  context.putImageData(source, 0, 0);
}

export function applyNoise(context: CanvasRenderingContext2D, width: number, height: number, amount: number = 35) {
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  context.putImageData(source, 0, 0);
}

export function applyVignette(context: CanvasRenderingContext2D, width: number, height: number, strength: number = 0.65) {
  context.save();
  const radius = Math.max(width, height) * 0.7;
  const grad = context.createRadialGradient(width / 2, height / 2, radius * 0.25, width / 2, height / 2, radius);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.7, `rgba(0,0,0,${Math.min(0.8, strength * 0.5)})`);
  grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.95, strength * 0.9)})`);
  context.fillStyle = grad;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export function applySepia(context: CanvasRenderingContext2D, width: number, height: number, intensity: number = 0.8) {
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  const k = Math.max(0, Math.min(1, intensity));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const tr = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
    const tg = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
    const tb = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);

    data[i] = Math.round(r + (tr - r) * k);
    data[i + 1] = Math.round(g + (tg - g) * k);
    data[i + 2] = Math.round(b + (tb - b) * k);
  }

  context.putImageData(source, 0, 0);
}

export function applyDuotone(context: CanvasRenderingContext2D, width: number, height: number, intensity: number = 0.8) {
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  const factor = Math.max(0, Math.min(1, intensity));

  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const targetR = Math.round(15 + lum * (60 - 15));
    const targetG = Math.round(45 + lum * (240 - 45));
    const targetB = Math.round(75 + lum * (215 - 75));

    data[i] = Math.round(data[i] + (targetR - data[i]) * factor);
    data[i + 1] = Math.round(data[i + 1] + (targetG - data[i + 1]) * factor);
    data[i + 2] = Math.round(data[i + 2] + (targetB - data[i + 2]) * factor);
  }
  context.putImageData(source, 0, 0);
}

export function applySketch(context: CanvasRenderingContext2D, width: number, height: number, intensity: number = 60) {
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  const threshold = 180 - (intensity * 0.6);

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const sketchVal = gray < (threshold * 0.5) ? 30 : gray > threshold ? 245 : Math.round(gray * 0.9);
    data[i] = sketchVal;
    data[i + 1] = sketchVal;
    data[i + 2] = sketchVal;
  }
  context.putImageData(source, 0, 0);
}

export function applyOilPainting(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number = 2,
  intensityLevels: number = 20
) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const binCount = new Int32Array(intensityLevels);
  const binR = new Float32Array(intensityLevels);
  const binG = new Float32Array(intensityLevels);
  const binB = new Float32Array(intensityLevels);

  const rad = Math.max(1, Math.min(3, Math.round(radius)));

  for (let y = rad; y < height - rad; y++) {
    for (let x = rad; x < width - rad; x++) {
      binCount.fill(0);
      binR.fill(0);
      binG.fill(0);
      binB.fill(0);

      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          const r = src[pixel];
          const g = src[pixel + 1];
          const b = src[pixel + 2];

          const curIntensity = Math.min(
            intensityLevels - 1,
            Math.floor(((0.299 * r + 0.587 * g + 0.114 * b) * intensityLevels) / 256)
          );

          binCount[curIntensity]++;
          binR[curIntensity] += r;
          binG[curIntensity] += g;
          binB[curIntensity] += b;
        }
      }

      let maxCount = 0;
      let dominantBin = 0;
      for (let i = 0; i < intensityLevels; i++) {
        if (binCount[i] > maxCount) {
          maxCount = binCount[i];
          dominantBin = i;
        }
      }

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = Math.round(binR[dominantBin] / maxCount);
      dst[outIdx + 1] = Math.round(binG[dominantBin] / maxCount);
      dst[outIdx + 2] = Math.round(binB[dominantBin] / maxCount);
      dst[outIdx + 3] = src[outIdx + 3];
    }
  }

  context.putImageData(output, 0, 0);
}

export function applyCharcoal(context: CanvasRenderingContext2D, width: number, height: number, intensity: number = 65) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const src = source.data;
  const dst = output.data;

  const kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const strength = intensity / 40;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      let idx = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * src[pixel] + 0.587 * src[pixel + 1] + 0.114 * src[pixel + 2];
          gx += lum * kx[idx];
          gy += lum * ky[idx];
          idx++;
        }
      }

      const mag = Math.hypot(gx, gy) * strength;
      const grain = (Math.random() - 0.5) * 16;
      const charcoal = Math.min(255, Math.max(15, 255 - mag + grain));

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = charcoal;
      dst[outIdx + 1] = charcoal;
      dst[outIdx + 2] = charcoal;
      dst[outIdx + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
}

/**
 * Universal dispatcher to execute any filter from the catalog with adjustable intensity.
 */
export function executeFilter(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: FilterMode,
  intensity: number = 50
) {
  if (mode === "none") return;

  switch (mode) {
    case "box_blur":
      applyKernel(context, width, height, [1, 1, 1, 1, 1, 1, 1, 1, 1], 9, 0);
      break;
    case "motion":
      applyKernel(context, width, height, [0, 0, 0, 1 / 3, 1 / 3, 1 / 3, 0, 0, 0], 1, 0);
      break;
    case "sharpen": {
      const w = 4 + (intensity / 50);
      applyKernel(context, width, height, [0, -1, 0, -1, w, -1, 0, -1, 0], 1, 0);
      break;
    }
    case "unsharp":
      applyKernel(context, width, height, [-1, -1, -1, -1, 9, -1, -1, -1, -1], 1, 0);
      break;
    case "edges":
      applyKernel(context, width, height, [-1, -1, -1, -1, 8, -1, -1, -1, -1], 1, 128);
      break;
    case "sobel":
      applySobel(context, width, height, intensity);
      break;
    case "canny":
      applyCanny(context, width, height, intensity);
      break;
    case "emboss":
      applyKernel(context, width, height, [-2, -1, 0, -1, 1, 1, 0, 1, 2], 1, 128);
      break;
    case "noise":
      applyNoise(context, width, height, Math.max(10, intensity * 0.7));
      break;
    case "median":
      applyMedian(context, width, height);
      break;
    case "bilateral":
      applyBilateral(context, width, height, intensity);
      break;
    case "pixelate": {
      const blockSize = Math.round(4 + (intensity / 100) * 28);
      applyPixelate(context, width, height, blockSize);
      break;
    }
    case "posterize": {
      const levels = Math.max(2, Math.round(8 - (intensity / 100) * 5));
      applyPosterize(context, width, height, levels);
      break;
    }
    case "vignette":
      applyVignette(context, width, height, (intensity / 100) * 0.95);
      break;
    case "sepia":
      applySepia(context, width, height, intensity / 100);
      break;
    case "duotone":
      applyDuotone(context, width, height, intensity / 100);
      break;
    case "sketch":
      applySketch(context, width, height, intensity);
      break;
    case "oil": {
      const radius = intensity > 60 ? 3 : intensity > 30 ? 2 : 1;
      applyOilPainting(context, width, height, radius, 18);
      break;
    }
    case "charcoal":
      applyCharcoal(context, width, height, intensity);
      break;
    default:
      break;
  }
}
