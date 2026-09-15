export type LayerBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "darken" | "lighten";

export const BLEND_MODE_OPTIONS: { id: LayerBlendMode; labelArabic: string; compositeOp: GlobalCompositeOperation }[] = [
  { id: "normal", labelArabic: "عادي", compositeOp: "source-over" },
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
