/**
 * ImagePro Studio — Stock Photos Hub & Normalization Adapter
 */

import {
  STOCK_PHOTOS as LIBRARY_PHOTOS,
  STOCK_PHOTO_CATEGORIES as LIBRARY_CATEGORIES,
  StockPhotoItem as LibStockPhotoItem,
  StockPhotoCategory as LibStockPhotoCategory,
} from "./stock-photos-library";

export type StockPhotoCategory = LibStockPhotoCategory | "people" | "abstract" | "tech";

export interface StockPhotoItem extends LibStockPhotoItem {
  titleAr: string;
  titleEn: string;
  url: string;
  thumbnailUrl: string;
}

export const STOCK_PHOTO_CATEGORIES = LIBRARY_CATEGORIES;

/**
 * Render StockPhotoItem into a base64 PNG data URL
 */
export function renderStockPhotoToDataUrl(photo: LibStockPhotoItem, width: number = 600, height: number = 400): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  photo.render(ctx, width, height);
  return canvas.toDataURL("image/png");
}

export const STOCK_PHOTOS: StockPhotoItem[] = LIBRARY_PHOTOS.map((p) => {
  // Generate procedural preview dataUrl lazily or fallback
  const thumb = renderStockPhotoToDataUrl(p, 300, 200);
  return {
    ...p,
    titleAr: p.nameAr,
    titleEn: p.nameEn,
    url: thumb,
    thumbnailUrl: thumb,
  };
});
