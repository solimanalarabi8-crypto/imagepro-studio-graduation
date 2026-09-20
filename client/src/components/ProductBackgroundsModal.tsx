import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PRODUCT_BACKGROUNDS, ProductBackgroundPreset, generateProductBackgroundUrl } from "@/lib/product-backgrounds";
import { Sparkles, Layers, Check, Download, Image as ImageIcon, Wand2, Maximize2 } from "lucide-react";

interface ProductBackgroundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackground: (bgDataUrl: string, options: { asLayer: boolean; addShadow: boolean; shadowOpacity: number }) => void;
  lang?: "ar" | "en";
  currentCanvasWidth?: number;
  currentCanvasHeight?: number;
}

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
  const [previewThumbnails, setPreviewThumbnails] = useState<Record<string, string>>({});
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isAr = lang === "ar";

  // Pre-render miniature thumbnails for all 8 presets
  useEffect(() => {
    const thumbs: Record<string, string> = {};
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 320;
    thumbCanvas.height = 180;
    const ctx = thumbCanvas.getContext("2d");

    if (ctx) {
      PRODUCT_BACKGROUNDS.forEach((preset) => {
        ctx.clearRect(0, 0, 320, 180);
        preset.render(ctx, 320, 180);
        thumbs[preset.id] = thumbCanvas.toDataURL("image/jpeg", 0.85);
      });
      setPreviewThumbnails(thumbs);
    }
  }, []);

  // Update big interactive preview when preset or shadow changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const preset = PRODUCT_BACKGROUNDS.find((p) => p.id === selectedPresetId) || PRODUCT_BACKGROUNDS[0];
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    preset.render(ctx, w, h);

    // Render mockup demonstration of a floating subject & contact shadow
    if (addShadow) {
      ctx.save();
      const shadowY = h * 0.76;
      const shadowW = w * 0.32;
      const shadowH = h * 0.08;
      const sGrad = ctx.createRadialGradient(w / 2, shadowY, 5, w / 2, shadowY, shadowW / 2);
      sGrad.addColorStop(0, `rgba(15, 23, 42, ${shadowOpacity / 100})`);
      sGrad.addColorStop(0.6, `rgba(15, 23, 42, ${(shadowOpacity / 100) * 0.4})`);
      sGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.ellipse(w / 2, shadowY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [selectedPresetId, addShadow, shadowOpacity]);

  const filteredPresets = activeCategory === "all"
    ? PRODUCT_BACKGROUNDS
    : PRODUCT_BACKGROUNDS.filter((p) => p.category === activeCategory);

  const selectedPreset = PRODUCT_BACKGROUNDS.find((p) => p.id === selectedPresetId) || PRODUCT_BACKGROUNDS[0];

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
        className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-white shadow-2xl p-0"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-850 bg-slate-900/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isAr ? "مكتبة خلفيات المنتجات الاحترافية" : "Product Showcase Backgrounds Studio"}
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {isAr ? "8 بيئات تصوير استوديو" : "8 Studio Presets"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "خلفيات إجرائية فائقة الدقة (Procedural 4K) تبرز المنتجات وتضيف ظلالاً واقعية تلقائياً"
                  : "High-definition procedural backdrops tailored for commercial product presentation"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Preset Selector Grid */}
          <div className="lg:col-span-7 p-4 overflow-y-auto border-b lg:border-b-0 lg:border-l border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="grid grid-cols-4 bg-slate-800/80 p-1 rounded-lg">
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    {isAr ? "الكل" : "All"}
                  </TabsTrigger>
                  <TabsTrigger value="luxury" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    {isAr ? "فاخر" : "Luxury"}
                  </TabsTrigger>
                  <TabsTrigger value="studio" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    {isAr ? "استوديو" : "Studio"}
                  </TabsTrigger>
                  <TabsTrigger value="creative" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    {isAr ? "إبداعي" : "Creative"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredPresets.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`group relative text-start rounded-xl overflow-hidden border transition-all duration-200 flex flex-col ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10 scale-[1.01]"
                        : "border-slate-800 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="w-full aspect-video bg-slate-950 relative overflow-hidden">
                      {previewThumbnails[preset.id] ? (
                        <img
                          src={previewThumbnails[preset.id]}
                          alt={preset.nameEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                          {isAr ? "جار التحميل..." : "Rendering..."}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-slate-900/90 flex-1 flex flex-col justify-between">
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {isAr ? preset.nameAr : preset.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                        {preset.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Interactive Preview & Options */}
          <div className="lg:col-span-5 p-4 flex flex-col justify-between space-y-4 bg-slate-900/50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  {isAr ? "المعاينة التفاعلية والظلال" : "Interactive Live Preview"}
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  {isAr ? selectedPreset.nameAr : selectedPreset.nameEn}
                </span>
              </div>

              {/* Big Canvas Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center aspect-video">
                <canvas
                  ref={previewCanvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-slate-300 backdrop-blur-sm pointer-events-none">
                  {currentCanvasWidth} × {currentCanvasHeight} px
                </div>
              </div>
            </div>

            {/* Smart Shadow & Application Options */}
            <div className="space-y-3.5 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addShadow}
                    onChange={(e) => setAddShadow(e.target.checked)}
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-700 w-4 h-4"
                  />
                  <span>{isAr ? "إضافة ظل أرضي ذكي (Ground Shadow)" : "Generate Smart Ground Shadow"}</span>
                </label>
                <Badge variant="outline" className="text-[10px] bg-slate-700 text-slate-300 border-none">
                  {addShadow ? `${shadowOpacity}%` : isAr ? "معطل" : "Off"}
                </Badge>
              </div>

              {addShadow && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{isAr ? "كثافة وقوة الظل" : "Shadow Intensity"}</span>
                    <span>{shadowOpacity}%</span>
                  </div>
                  <Slider
                    value={[shadowOpacity]}
                    min={10}
                    max={90}
                    step={1}
                    onValueChange={(val) => setShadowOpacity(val[0])}
                    className="w-full"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-700/60">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAsLayer}
                    onChange={(e) => setApplyAsLayer(e.target.checked)}
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-700 w-4 h-4"
                  />
                  <span>
                    {isAr
                      ? "إضافة كطبقة خلفية مستقلة (Layer)"
                      : "Add as a separate background layer"}
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 mr-6">
                  {isAr
                    ? "إذا لم يتم التحديد، سيتم وضع الخلفية تحت الصورة المفرغة الحالية مباشرة"
                    : "If unchecked, replaces canvas background preserving cutout subject"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 text-xs h-9"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleApply}
                className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-xs h-9 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isAr ? "تطبيق البيئة على التصميم" : "Apply to Canvas"}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ProductBackgroundsModal;
