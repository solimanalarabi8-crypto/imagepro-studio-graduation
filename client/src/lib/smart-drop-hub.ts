/**
 * ImagePro Studio - Smart Drag & Drop Hub Engine
 * Handles file drop detection, metadata extraction, dimension fitting, and drop action execution.
 */

export type DropActionType = "layer" | "ai_cutout" | "new_project" | "blend_studio";

export interface DroppedImageMeta {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Formats byte count into human-readable size (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Checks if a file is an .imagepro project package.
 */
export function isProjectFile(file: File | { name: string; type?: string }): boolean {
  if (!file || !file.name) return false;
  return file.name.toLowerCase().endsWith(".imagepro") || (file.name.toLowerCase().endsWith(".json") && file.type === "application/json");
}

/**
 * Checks if a file is an accepted image format.
 */
export function isSupportedImageFile(file: File | { name: string; type?: string }): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  const name = (file.name || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(name);
}

/**
 * Calculates centered and proportionally fitted coordinates and dimensions
 * for an inserted image within the current canvas boundary.
 */
export function calculateFittedPlacement(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  maxCanvasCoverageRatio: number = 0.8
): { width: number; height: number; x: number; y: number } {
  const safeCanvasW = Math.max(1, canvasWidth);
  const safeCanvasH = Math.max(1, canvasHeight);
  const safeImgW = Math.max(1, imgWidth);
  const safeImgH = Math.max(1, imgHeight);

  // If image already fits comfortably within the target coverage, keep native scale
  const maxAllowedW = safeCanvasW * maxCanvasCoverageRatio;
  const maxAllowedH = safeCanvasH * maxCanvasCoverageRatio;

  let targetW = safeImgW;
  let targetH = safeImgH;

  if (targetW > maxAllowedW || targetH > maxAllowedH) {
    const scale = Math.min(maxAllowedW / targetW, maxAllowedH / targetH);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);
  }

  // Ensure non-zero
  targetW = Math.max(20, targetW);
  targetH = Math.max(20, targetH);

  // Center on canvas
  const x = Math.round((safeCanvasW - targetW) / 2);
  const y = Math.round((safeCanvasH - targetH) / 2);

  return { width: targetW, height: targetH, x, y };
}

/**
 * Reads a File as an HTML Image element to extract dimensions and Data URL asynchronously.
 */
export async function extractDroppedImageMeta(file: File): Promise<DroppedImageMeta> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("فشل قراءة الملف المسحوب"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("فشل تحميل أبعاد الصورة"));
      img.onload = () => {
        const width = img.naturalWidth || img.width || 800;
        const height = img.naturalHeight || img.height || 600;
        resolve({
          name: file.name,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          type: file.type || "image/png",
          dataUrl,
          width,
          height,
          aspectRatio: Number((width / height).toFixed(3)),
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
