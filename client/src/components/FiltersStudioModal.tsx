import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  FILTER_CATALOG,
  FilterMode,
  FilterCategory,
  FilterDefinition
} from "@/lib/filters-engine";
import { Sparkles, Check, RotateCcw, Sliders, Eye, Wand2 } from "lucide-react";

interface FiltersStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: FilterMode;
  filterIntensity: number;
  filterThumbnails: Record<FilterMode, string>;
  onSelectFilter: (filterId: FilterMode, defaultIntensity?: number) => void;
  onChangeIntensity: (val: number) => void;
  onBakeFilter: () => void;
  onResetFilter: () => void;
  lang?: "ar" | "en";
}

const CATEGORIES: { id: "الكل" | FilterCategory; labelAr: string; labelEn: string }[] = [
  { id: "الكل", labelAr: "الكل (22)", labelEn: "All (22)" },
  { id: "لونية", labelAr: "لونية (4)", labelEn: "Color" },
  { id: "فنية", labelAr: "فنية (3)", labelEn: "Artistic" },
  { id: "تمويه", labelAr: "تمويه (3)", labelEn: "Blur" },
  { id: "حدة", labelAr: "حدة (2)", labelEn: "Sharpen" },
  { id: "حواف", labelAr: "حواف (4)", labelEn: "Edges" },
  { id: "ضوضاء", labelAr: "ضوضاء (3)", labelEn: "Noise" },
  { id: "هندسية", labelAr: "هندسية (2)", labelEn: "Geometric" },
];

export const FiltersStudioModal: React.FC<FiltersStudioModalProps> = ({
  isOpen,
  onClose,
  activeFilter,
  filterIntensity,
  filterThumbnails,
  onSelectFilter,
  onChangeIntensity,
  onBakeFilter,
  onResetFilter,
  lang = "ar",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"الكل" | FilterCategory>("الكل");
  const isAr = lang === "ar";

  const filteredCatalog = selectedCategory === "الكل"
    ? FILTER_CATALOG
    : FILTER_CATALOG.filter((f) => f.category === selectedCategory);

  const activeDef: FilterDefinition | undefined = FILTER_CATALOG.find((f) => f.id === activeFilter);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 text-white shadow-2xl p-0"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header with Canva-style gradient accent */}
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-900/40 via-slate-900/90 to-blue-900/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isAr ? "استوديو المرشحات والفلاتر الحي" : "Live Visual Filters Studio"}
                <span className="text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {isAr ? "معاينة حية على صورتك" : "Live Photo Previews"}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "شاهد كيف تبدو صورتك الحالية في جميع الفلاتر الـ 22 مباشرة قبل التطبيق"
                  : "See real-time visual previews of your photo across all 22 computational filters"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Category Pills Bar (Canva Segmented Style) */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/30 scale-[1.02]"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white"
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* Main Body: Grid of Live Photo Filter Cards */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredCatalog.map((f) => {
            const isActive = activeFilter === f.id;
            const previewUrl = filterThumbnails[f.id];

            return (
              <div
                key={f.id}
                onClick={() => onSelectFilter(f.id, f.defaultIntensity)}
                className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                  isActive
                    ? "border-purple-400 ring-2 ring-purple-500/50 shadow-xl shadow-purple-500/20 scale-[1.02] bg-slate-800/90"
                    : "border-slate-700/70 hover:border-slate-500/80 bg-slate-800/40 hover:bg-slate-800/70 hover:scale-[1.02]"
                }`}
              >
                {/* Live Filter Preview Image */}
                <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={f.nameArabic}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      {isAr ? "جارٍ المعاينة..." : "Rendering..."}
                    </div>
                  )}

                  {/* Active Selected Checkmark Badge */}
                  {isActive && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-1 shadow-lg">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-[10px] text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
                    {f.category}
                  </span>
                </div>

                {/* Filter Details */}
                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                      {f.nameArabic}
                    </span>
                    {f.id === "none" && (
                      <span className="text-[10px] text-slate-400">
                        {isAr ? "الأصل" : "Original"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Active Filter Fine-Tuning Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-4">
          {activeDef && activeFilter !== "none" ? (
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 min-w-[140px]">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">{activeDef.nameArabic}</span>
                <span className="text-xs font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {filterIntensity}%
                </span>
              </div>

              <div className="flex-1 w-full max-w-xs">
                <Slider
                  value={[filterIntensity]}
                  min={activeDef.minIntensity ?? 10}
                  max={activeDef.maxIntensity ?? 100}
                  step={1}
                  onValueChange={(val) => onChangeIntensity(val[0])}
                  className="accent-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onBakeFilter();
                    onClose();
                  }}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs px-4 shadow-lg shadow-purple-500/30"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {isAr ? "اعتماد التأثير (Bake)" : "Apply Filter"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onResetFilter()}
                  className="rounded-full border-slate-700 text-slate-300 hover:text-white text-xs px-3"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {isAr ? "إلغاء التأثير" : "Reset"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span>{isAr ? "انقر على أي مرشح لمعاينته حياً على الكانفاس" : "Click any filter to preview it live on the canvas"}</span>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="rounded-full text-slate-400 hover:text-white text-xs"
          >
            {isAr ? "إغلاق النافذة" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
