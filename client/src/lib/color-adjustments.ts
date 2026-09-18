export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  maxCount: number;
}

export const DEFAULT_ADJUSTMENTS = {
  brightness: 0,
  contrast: 0,
  saturation: 100,
  hue: 0,
  exposure: 0,
  temperature: 0,
  gamma: 1.0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  threshold: 128,
  colorBalanceR: 0,
  colorBalanceG: 0,
  colorBalanceB: 0,
};

export function calculateHistogram(imageData: ImageData): HistogramData {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const lum = new Array(256).fill(0);
  const data = imageData.data;
  const len = data.length;

  // Sampling optimization for large images: sample every 2nd pixel if > 1M pixels
  const step = len > 4000000 ? 8 : 4;

  for (let i = 0; i < len; i += step) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

    r[red]++;
    g[green]++;
    b[blue]++;
    lum[l]++;
  }

  let maxCount = 1;
  for (let i = 0; i < 256; i++) {
    if (r[i] > maxCount) maxCount = r[i];
    if (g[i] > maxCount) maxCount = g[i];
    if (b[i] > maxCount) maxCount = b[i];
    if (lum[i] > maxCount) maxCount = lum[i];
  }

  return { r, g, b, lum, maxCount };
}

export function buildCssFilter(params: {
  brightness: number;
  contrast: number;
  saturation: number;
  hue?: number;
  grayscale: number;
  sepia: number;
  invert: number;
  blur?: boolean;
}): string {
  const bVal = 100 + params.brightness;
  const cVal = 100 + params.contrast;
  const sVal = params.saturation;
  const hVal = params.hue || 0;
  const gVal = params.grayscale;
  const sepVal = params.sepia;
  const invVal = params.invert;
  const blurVal = params.blur ? " blur(4px)" : "";

  return `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) hue-rotate(${hVal}deg) grayscale(${gVal}%) sepia(${sepVal}%) invert(${invVal}%)${blurVal}`;
}

export function applyPixelAdjustments(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    exposure?: number;
    temperature?: number;
    gamma?: number;
    balanceR?: number;
    balanceG?: number;
    balanceB?: number;
  }
) {
  const exp = options.exposure ?? 0;
  const temp = options.temperature ?? 0;
  const gamma = options.gamma ?? 1.0;
  const balR = options.balanceR ?? 0;
  const balG = options.balanceG ?? 0;
  const balB = options.balanceB ?? 0;

  // Skip pixel iteration if all adjustments are at default
  if (exp === 0 && temp === 0 && Math.abs(gamma - 1.0) < 0.01 && balR === 0 && balG === 0 && balB === 0) {
    return;
  }

  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  const len = data.length;

  // 1. Exposure factor (2^(exposure / 50))
  const expFactor = exp !== 0 ? Math.pow(2, exp / 50) : 1;

  // 2. Temperature offsets
  const tempR = temp > 0 ? temp * 0.4 : temp * 0.15;
  const tempB = temp < 0 ? -temp * 0.4 : -temp * 0.15;

  // Precompute full Look-Up Tables for R, G, B channels (only 256 values each!)
  // This turns 14,000,000 math operations into instantaneous array lookups (under 4ms).
  const lutR = new Uint8Array(256);
  const lutG = new Uint8Array(256);
  const lutB = new Uint8Array(256);

  for (let i = 0; i < 256; i++) {
    // 1. Exposure
    let r = expFactor !== 1 ? Math.min(255, i * expFactor) : i;
    let g = expFactor !== 1 ? Math.min(255, i * expFactor) : i;
    let b = expFactor !== 1 ? Math.min(255, i * expFactor) : i;

    // 2. Temperature
    if (temp !== 0) {
      r = Math.max(0, Math.min(255, r + tempR));
      b = Math.max(0, Math.min(255, b + tempB));
    }

    // 3. Color Balance
    if (balR !== 0) r = Math.max(0, Math.min(255, r + balR * 0.7));
    if (balG !== 0) g = Math.max(0, Math.min(255, g + balG * 0.7));
    if (balB !== 0) b = Math.max(0, Math.min(255, b + balB * 0.7));

    // 4. Gamma
    if (Math.abs(gamma - 1.0) >= 0.01) {
      const gammaInv = 1 / Math.max(0.1, gamma);
      r = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.max(0, r) / 255, gammaInv))));
      g = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.max(0, g) / 255, gammaInv))));
      b = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.max(0, b) / 255, gammaInv))));
    }

    lutR[i] = Math.round(r);
    lutG[i] = Math.round(g);
    lutB[i] = Math.round(b);
  }

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // Preserve transparent pixels untouched
    data[i] = lutR[data[i]];
    data[i + 1] = lutG[data[i + 1]];
    data[i + 2] = lutB[data[i + 2]];
  }

  context.putImageData(source, 0, 0);
}
