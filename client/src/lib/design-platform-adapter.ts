/**
 * ImagePro Studio — Creative Platform Adapter Layer
 * Clean, decoupled bridge between Creative Libraries/Dashboard and the Core Editor Canvas
 */

import { AssetGraphicItem } from "./assets-library";
import { CreativeBackdropPreset } from "./creative-backgrounds";
import { EditableTemplate, TemplateLayerDefinition } from "./editable-templates";
import { StockPhotoItem } from "./stock-photos";

const RECENT_ITEMS_KEY = "imagepro_creative_recent_v1";
const FAVORITES_KEY = "imagepro_creative_favorites_v1";
const FOLDERS_KEY = "imagepro_project_folders_v1";

export interface CreativeItemRecent {
  id: string;
  type: "template" | "background" | "asset" | "photo";
  name: string;
  timestamp: number;
}

export interface ProjectFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

/**
 * Render any AssetGraphicItem into a high-definition transparent DataURL
 */
export function renderAssetToDataUrl(asset: AssetGraphicItem, color?: string, targetSize: number = 300): string {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, targetSize, targetSize);
  asset.render(ctx, targetSize, color);
  return canvas.toDataURL("image/png");
}

/**
 * Render any BackdropPreset into a canvas DataURL
 */
export function renderBackdropToDataUrl(preset: CreativeBackdropPreset, width: number = 1920, height: number = 1080): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  preset.render(ctx, width, height);
  return canvas.toDataURL("image/png");
}

/**
 * Recent items tracking in LocalStorage
 */
export function getRecentItems(): CreativeItemRecent[] {
  try {
    const raw = localStorage.getItem(RECENT_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function trackRecentItem(item: Omit<CreativeItemRecent, "timestamp">): void {
  try {
    const list = getRecentItems().filter((r) => r.id !== item.id);
    list.unshift({ ...item, timestamp: Date.now() });
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn("Could not save recent item", e);
  }
}

/**
 * Favorites tracking in LocalStorage
 */
export function getFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set(["prod-marble-podium", "insta-sale-bold", "shape-gold-star"]);
  } catch {
    return new Set();
  }
}

export function toggleFavoriteId(id: string): Set<string> {
  try {
    const favs = getFavoriteIds();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs)));
    return new Set(favs);
  } catch {
    return new Set();
  }
}

/**
 * Folders management in LocalStorage
 */
export function getProjectFolders(): ProjectFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) {
      const defaults: ProjectFolder[] = [
        { id: "folder-social", name: "سوشيال ميديا وإعلانات", color: "#38bdf8", createdAt: Date.now() },
        { id: "folder-brand", name: "هوية تجارية ومطبوعات", color: "#f59e0b", createdAt: Date.now() },
        { id: "folder-products", name: "صور منتجات وعروض", color: "#2dd4bf", createdAt: Date.now() },
      ];
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProjectFolders(folders: ProjectFolder[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.warn("Could not save folders", e);
  }
}

/**
 * Helper to encode drag data for dropping on canvas
 */
export function encodeDragPayload(type: "asset" | "backdrop" | "template" | "photo", id: string, extra?: Record<string, unknown>): string {
  return JSON.stringify({ type, id, ...extra, timestamp: Date.now() });
}
