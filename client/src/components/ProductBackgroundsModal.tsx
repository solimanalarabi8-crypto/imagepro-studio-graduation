import React, { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { PRODUCT_BACKGROUNDS, ProductBackgroundPreset, generateProductBackgroundUrl } from "@/lib/product-backgrounds";
import { Sparkles, Check, X, SlidersHorizontal, Image as ImageIcon } from "lucide-react";

interface ProductBackgroundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackground: (bgDataUrl: string, options: { asLayer: boolean; addShadow: boolean; shadowOpacity: number }) => void;
  lang?: "ar" | "en";
  currentCanvasWidth?: number;
  currentCanvasHeight?: number;
}

// High-DPR miniature canvas renderer
const StudioCanvasThumb: React.FC<{
  preset: ProductBackgroundPreset;
  width: number;
  height: number;
}> = ({ preset, width, height }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tw = 320;
    const th = Math.max(160, Math.round((tw / width) * height));
    canvas.width = tw;
    canvas.height = th;
    ctx.clearRect(0, 0, tw, th);
    preset.render(ctx, tw, th);
  }, [preset, width, height]);

  return (
    <canvas
      ref={ref}
      className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105"
    />
  );
};

export const ProductBackgroundsModal: React.FC<ProductBackgroundsModalProps> = ({
  isOpen,
  onClose,
  onApplyBackground,
  lang = "ar",
  currentCanvasWidth = 1920,
  currentCanvasHeight = 1080,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRODUCT_BACKGROUNDS[0].id);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [addShadow, setAddShadow] = useState<boolean>(true);
  const [shadowOpacity, setShadowOpacity] = useState<number>(45);
  const [applyAsLayer, setApplyAsLayer] = useState<boolean>(false);

  const isAr = lang === "ar";

  const categories = useMemo(() => [
    { id: "all", nameAr: "جميع الخلفيات", nameEn: "All" },
    { id: "luxury", nameAr: "رخام فاخر", nameEn: "Luxury Marble" },
    { id: "studio", nameAr: "استوديو تصوير", nameEn: "Studio Cyclorama" },
    { id: "natural", nameAr: "طبيعة وخشب", nameEn: "Natural Wood" },
    { id: "creative", nameAr: "إبداعي ونيون", nameEn: "Cyberpunk" },
  ], []);

  const filteredPresets = useMemo(() => {
    if (activeCategory === "all") return PRODUCT_BACKGROUNDS;
    return PRODUCT_BACKGROUNDS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const selectedPreset = useMemo(() => {
    return PRODUCT_BACKGROUNDS.find((p) => p.id === selectedPresetId) || PRODUCT_BACKGROUNDS[0];
  }, [selectedPresetId]);

  const handleApply = () => {
    const targetW = currentCanvasWidth || 1920;
    const targetH = currentCanvasHeight || 1080;
    const bgUrl = generateProductBackgroundUrl(selectedPresetId, targetW, targetH);
    onApplyBackground(bgUrl, {
      asLayer: applyAsLayer,
      addShadow,
      shadowOpacity: shadowOpacity / 100,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-5xl w-[94vw] max-h-[90vh] overflow-hidden flex flex-col bg-[#0b101b] border border-slate-800 text-slate-100 shadow-2xl p-0 gap-0 rounded-2xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header matching Image 4 */}
        <DialogHeader className="px-6 py-4 border-b border-slate-800/80 bg-[#0e1524] flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isAr ? "مكتبة خلفيات المنتجات الاحترافية" : "Product Studio Backdrops"}</span>
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {isAr ? "8 بيئات تصوير استوديو" : "8 Studio Environments"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "خلفيات إجرائية فائقة الدقة (Procedural 4K) تبرز المنتجات مع ظلال تلامس واقعية (Contact Shadow)"
                  : "Photorealistic procedural backdrops with smart contact shadow for product presentation"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Top Category Filter Pills */}
        <div className="px-6 py-2.5 border-b border-slate-800/60 bg-[#0d1322]/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold"
                  : "bg-[#131b2e] text-slate-400 hover:text-slate-200 border border-slate-700/50"
              }`}
            >
              {isAr ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>

        {/* Full-width 4-column Grid (NO VERTICAL SCROLLBAR SPLIT) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filteredPresets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? "bg-[#17223b] border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/15 scale-[1.02]"
                      : "bg-[#131b2e] hover:bg-[#17223b] border-slate-700/60 hover:border-blue-500/50"
                  }`}
                >
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
                    <StudioCanvasThumb preset={preset} width={1600} height={900} />
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-[#2563eb] text-white rounded-full p-1 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {isAr ? preset.nameAr : preset.nameEn}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{preset.category}</span>
                      <span className="font-mono">4K Studio</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Control Bar with Contact Shadow Slider & Apply Button */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#0e1524] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            {/* Contact Shadow Toggle & Slider */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addShadow}
                  onChange={(e) => setAddShadow(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 accent-[#2563eb]"
                />
                <span className="font-semibold">{isAr ? "إضافة ظل أرضي ذكي (Contact Shadow)" : "Smart Contact Shadow"}</span>
              </label>

              {addShadow && (
                <div className="flex items-center gap-2 min-w-[130px]">
                  <Slider
                    value={[shadowOpacity]}
                    onValueChange={(val) => setShadowOpacity(val[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-24"
                  />
                  <span className="font-mono text-[11px] text-blue-400">{shadowOpacity}%</span>
                </div>
              )}
            </div>

            {/* As Layer Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyAsLayer}
                onChange={(e) => setApplyAsLayer(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 accent-[#2563eb]"
              />
              <span>{isAr ? "إدراج كطبقة منفصلة (Layer)" : "Insert as Layer"}</span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex-1 sm:flex-none"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? "تطبيق البيئة على التصميم" : "Apply to Canvas"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBackgroundsModal;
