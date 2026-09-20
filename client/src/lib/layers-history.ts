export type LayerBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "darken" | "lighten";

export interface LayerInfo {
  id: string;
  name: string;
  kind: string; // "image" | "subject" | "paint" | "text" | "adjustment" | "mask" | "group" | "background"
  color: string;
  visible: boolean;
  opacity?: number;
  blendMode?: string;
  locked?: boolean;
  parentId?: string;
  thumbnail?: string;
  maskData?: string;
  maskEnabled?: boolean;
  maskLinked?: boolean;
}

export const BLEND_MODE_OPTIONS: { id: LayerBlendMode; labelArabic: string; compositeOp: GlobalCompositeOperation }[] = [
  { id: "normal", labelArabic: "عادي (Normal)", compositeOp: "source-over" },
  { id: "multiply", labelArabic: "ضرب (Multiply)", compositeOp: "multiply" },
  { id: "screen", labelArabic: "شاشة (Screen)", compositeOp: "screen" },
  { id: "overlay", labelArabic: "تراكب (Overlay)", compositeOp: "overlay" },
  { id: "soft-light", labelArabic: "ضوء ناعم (Soft Light)", compositeOp: "soft-light" },
  { id: "darken", labelArabic: "تغميق (Darken)", compositeOp: "darken" },
  { id: "lighten", labelArabic: "تفتيح (Lighten)", compositeOp: "lighten" },
];

export function blendModeToCompositeOp(mode: string): GlobalCompositeOperation {
  const clean = mode.trim().toLowerCase();
  if (clean === "multiply" || clean === "ضرب" || clean.includes("ضرب")) return "multiply";
  if (clean === "screen" || clean === "شاشة" || clean.includes("شاشة")) return "screen";
  if (clean === "overlay" || clean === "تراكب" || clean.includes("تراكب")) return "overlay";
  if (clean === "soft-light" || clean.includes("ضوء ناعم")) return "soft-light";
  if (clean === "darken" || clean === "تغميق" || clean.includes("تغميق")) return "darken";
  if (clean === "lighten" || clean === "تفتيح" || clean.includes("تفتيح")) return "lighten";
  return "source-over";
}

export function clampOpacity(value: number | undefined): number {
  if (value === undefined || isNaN(value)) return 100;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function opacityToAlpha(opacityPercent: number | undefined): number {
  const clamped = clampOpacity(opacityPercent);
  return clamped / 100;
}

/**
 * Move a specific layer to the top of the stack (index 0 - make it the first layer).
 * Preserves other layers and protects background from moving.
 */
export function moveLayerToTop(
  layers: LayerInfo[],
  layerId: string
): { layers: LayerInfo[]; success: boolean; message: string } {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index < 0) {
    return { layers, success: false, message: "لم يتم العثور على الطبقة المحددة" };
  }
  const target = layers[index];
  if (target.kind === "background" || target.id === "background") {
    return { layers, success: false, message: "لا يمكن تحريك طبقة الخلفية إلى المقدمة" };
  }
  if (index === 0) {
    return { layers, success: false, message: "الطبقة بالفعل في المقدمة (الطبقة الأولى)" };
  }

  const next = [...layers];
  const [removed] = next.splice(index, 1);
  next.unshift(removed);

  return {
    layers: next,
    success: true,
    message: target.name,
  };
}

/**
 * Move a specific layer to the bottom of the editable stack (right above background).
 */
export function moveLayerToBottom(
  layers: LayerInfo[],
  layerId: string
): { layers: LayerInfo[]; success: boolean; message: string } {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index < 0) {
    return { layers, success: false, message: "لم يتم العثور على الطبقة المحددة" };
  }
  const target = layers[index];
  if (target.kind === "background" || target.id === "background") {
    return { layers, success: false, message: "لا يمكن تحريك طبقة الخلفية" };
  }

  // Find target bottom index (before background if background exists, otherwise last index)
  let bottomIndex = layers.length - 1;
  const bgIndex = layers.findIndex((l) => l.kind === "background" || l.id === "background");
  if (bgIndex > 0) {
    bottomIndex = bgIndex - 1;
  }

  if (index >= bottomIndex) {
    return { layers, success: false, message: "الطبقة بالفعل في أسفل الترتيب فوق الخلفية" };
  }

  const next = [...layers];
  const [removed] = next.splice(index, 1);
  next.splice(bottomIndex, 0, removed);

  return {
    layers: next,
    success: true,
    message: target.name,
  };
}

/**
 * Move layer one position up (towards index 0)
 */
export function moveLayerUp(
  layers: LayerInfo[],
  layerId: string
): { layers: LayerInfo[]; success: boolean; message: string } {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index < 0) return { layers, success: false, message: "لم يتم العثور على الطبقة" };
  if (index <= 0) return { layers, success: false, message: "الطبقة بالفعل في أعلى الترتيب" };

  const target = layers[index];
  if (target.kind === "background" || target.id === "background") {
    return { layers, success: false, message: "لا يمكن تحريك طبقة الخلفية" };
  }

  const next = [...layers];
  next.splice(index, 1);
  next.splice(index - 1, 0, target);

  return { layers: next, success: true, message: target.name };
}

/**
 * Move layer one position down (towards background)
 */
export function moveLayerDown(
  layers: LayerInfo[],
  layerId: string
): { layers: LayerInfo[]; success: boolean; message: string } {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index < 0 || index >= layers.length - 1) {
    return { layers, success: false, message: "الطبقة بالفعل في أدنى الترتيب" };
  }

  const target = layers[index];
  const nextLayer = layers[index + 1];
  if (nextLayer.kind === "background" || nextLayer.id === "background") {
    return { layers, success: false, message: "لا يمكن إنزال الطبقة تحت طبقة الخلفية" };
  }

  const next = [...layers];
  next.splice(index, 1);
  next.splice(index + 1, 0, target);

  return { layers: next, success: true, message: target.name };
}

/**
 * Reorder layer by dragging from one index to another
 */
export function reorderLayers(
  layers: LayerInfo[],
  fromIndex: number,
  toIndex: number
): { layers: LayerInfo[]; success: boolean } {
  if (
    fromIndex < 0 ||
    fromIndex >= layers.length ||
    toIndex < 0 ||
    toIndex >= layers.length ||
    fromIndex === toIndex
  ) {
    return { layers, success: false };
  }

  const source = layers[fromIndex];
  if (source.kind === "background" || source.id === "background") {
    return { layers, success: false };
  }

  const next = [...layers];
  const [removed] = next.splice(fromIndex, 1);

  // If destination would place it below background, place it just before background
  const bgIndex = next.findIndex((l) => l.kind === "background" || l.id === "background");
  let finalTargetIndex = toIndex;
  if (bgIndex >= 0 && finalTargetIndex > bgIndex) {
    finalTargetIndex = bgIndex;
  }

  next.splice(finalTargetIndex, 0, removed);
  return { layers: next, success: true };
}

/**
 * Toggle Solo mode for a specific layer.
 * When activated, all other layers are temporarily hidden, isolating this layer.
 * When deactivated, restores all previous visibility states.
 */
export function toggleLayerSolo(
  layers: LayerInfo[],
  targetLayerId: string,
  currentSoloId: string | null,
  savedVisibilities: Record<string, boolean> = {}
): {
  nextLayers: LayerInfo[];
  nextSoloId: string | null;
  nextSavedVisibilities: Record<string, boolean>;
} {
  // If already soloing this layer, deactivate and restore
  if (currentSoloId === targetLayerId) {
    const nextLayers = layers.map((layer) => ({
      ...layer,
      visible: savedVisibilities[layer.id] ?? true,
    }));
    return {
      nextLayers,
      nextSoloId: null,
      nextSavedVisibilities: {},
    };
  }

  // Otherwise, save current visibilities and solo this layer
  const snapshot: Record<string, boolean> = {};
  layers.forEach((l) => {
    snapshot[l.id] = l.visible;
  });

  const nextLayers = layers.map((layer) => ({
    ...layer,
    visible: layer.id === targetLayerId,
  }));

  return {
    nextLayers,
    nextSoloId: targetLayerId,
    nextSavedVisibilities: snapshot,
  };
}

/**
 * Duplicate a layer with a unique id
 */
export function duplicateLayer(
  layers: LayerInfo[],
  layerId: string
): { layers: LayerInfo[]; newLayerId: string | null; message: string } {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index < 0) {
    return { layers, newLayerId: null, message: "اختر طبقة أولاً" };
  }
  const source = layers[index];
  const newId = `layer-${Date.now()}`;
  const duplicated: LayerInfo = {
    ...source,
    id: newId,
    name: `${source.name} — نسخة`,
  };

  const next = [...layers];
  next.splice(index, 0, duplicated); // Insert right next to the original

  return {
    layers: next,
    newLayerId: newId,
    message: `تم تكرار الطبقة: ${duplicated.name}`,
  };
}

export function detectHistoryAction(previous: any, next: any): string {
  if (!previous) return "فتح المشروع الأصلي";
  if (previous.imageSrc !== next.imageSrc) return "قص أو تغيير الصورة";
  if ((previous.strokes?.length || 0) < (next.strokes?.length || 0)) {
    const last = next.strokes[next.strokes.length - 1];
    return last?.mode === "eraser" ? "مسح بالممحاة" : "رسم بالفرشاة";
  }
  if ((previous.strokes?.length || 0) > (next.strokes?.length || 0)) return "مسح خطوط بالممحاة";
  if ((previous.shapes?.length || 0) !== (next.shapes?.length || 0)) return "تعديل أشكال هندسية";
  if ((previous.textElements?.length || 0) !== (next.textElements?.length || 0)) return "إضافة أو تعديل نص";
  if (previous.rotation !== next.rotation || previous.flipX !== next.flipX || previous.flipY !== next.flipY) return "تدوير أو عكس الصورة";
  if (previous.filterMode !== next.filterMode) return `تطبيق فلتر ${next.filterMode}`;
  if (previous.brightness !== next.brightness || previous.contrast !== next.contrast || previous.saturation !== next.saturation) return "تعديل الإضاءة والألوان";
  if (previous.maskRect !== next.maskRect) return "تطبيق قناع الطبقة";
  if (JSON.stringify(previous.layers) !== JSON.stringify(next.layers)) return "تعديل خصائص الطبقات والشفافية";
  return "تعديل في مساحة العمل";
}

