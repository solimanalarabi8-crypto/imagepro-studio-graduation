import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DESIGN_TEMPLATES, DesignTemplatePreset } from "@/lib/templates";
import {
  Sparkles,
  Search,
  Maximize2,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  Check,
  LayoutGrid,
  FileSpreadsheet,
  Palette,
  X,
  Plus
} from "lucide-react";

interface NewDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewProject: (options: {
    width: number;
    height: number;
    background: "transparent" | "white" | "black" | string;
    templateName?: string;
  }) => void;
  onOpenTemplates?: () => void;
  lang?: "ar" | "en";
}

export const NewDesignModal: React.FC<NewDesignModalProps> = ({
  isOpen,
  onClose,
  onCreateNewProject,
  onOpenTemplates,
  lang = "ar"
}) => {
  const isAr = lang === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("insta-square");

  // Custom dimensions state
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [aspectRatioValue, setAspectRatioValue] = useState<number>(1);
  const [dimensionUnit, setDimensionUnit] = useState<"px" | "cm" | "in">("px");
  const [bgChoice, setBgChoice] = useState<"transparent" | "white" | "black" | "#0f172a">("transparent");

  const categories = useMemo(() => [
    { id: "all", nameAr: "الجميع", nameEn: "All Presets", icon: "✨" },
    { id: "social", nameAr: "سوشيال ميديا", nameEn: "Social Media", icon: "📱" },
    { id: "presentations", nameAr: "عروض تقديمية", nameEn: "Presentations", icon: "📊" },
    { id: "marketing", nameAr: "تسويق وإعلانات", nameEn: "Marketing & Ads", icon: "🚀" },
    { id: "print", nameAr: "مطبوعات ووثائق", nameEn: "Print & Docs", icon: "📄" },
    { id: "ecommerce", nameAr: "تجارة ومتاجر", nameEn: "E-Commerce", icon: "🛍️" },
    { id: "custom", nameAr: "أبعاد مخصصة", nameEn: "Custom Size", icon: "📐" },
  ], []);

  const filteredPresets = useMemo(() => {
    let list = DESIGN_TEMPLATES;
    if (selectedCategory !== "all" && selectedCategory !== "custom") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.descriptionAr.toLowerCase().includes(q) ||
          p.descriptionEn.toLowerCase().includes(q) ||
          `${p.width}x${p.height}`.includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const selectedPreset = useMemo(() => {
    return DESIGN_TEMPLATES.find((p) => p.id === selectedPresetId) || DESIGN_TEMPLATES[0];
  }, [selectedPresetId]);

  const handleSelectPreset = (p: DesignTemplatePreset) => {
    setSelectedPresetId(p.id);
    setCustomWidth(p.width);
    setCustomHeight(p.height);
    setAspectRatioValue(p.width / p.height);
  };

  const handleWidthChange = (val: number) => {
    const w = Math.max(10, Math.min(10000, val || 10));
    setCustomWidth(w);
    if (lockRatio && aspectRatioValue > 0) {
      setCustomHeight(Math.round(w / aspectRatioValue));
    }
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(10, Math.min(10000, val || 10));
    setCustomHeight(h);
    if (lockRatio && aspectRatioValue > 0) {
      setCustomWidth(Math.round(h * aspectRatioValue));
    }
  };

  const handleCreatePresetProject = () => {
    onCreateNewProject({
      width: selectedPreset.width,
      height: selectedPreset.height,
      background: bgChoice,
      templateName: isAr ? selectedPreset.nameAr : selectedPreset.nameEn,
    });
    onClose();
  };

  const handleCreateCustomProject = () => {
    // Convert cm/in to px if needed (standard 96 DPI screen or 300 DPI print)
    let finalW = customWidth;
    let finalH = customHeight;
    if (dimensionUnit === "cm") {
      finalW = Math.round(customWidth * 37.795);
      finalH = Math.round(customHeight * 37.795);
    } else if (dimensionUnit === "in") {
      finalW = Math.round(customWidth * 96);
      finalH = Math.round(customHeight * 96);
    }

    onCreateNewProject({
      width: Math.max(100, Math.min(8000, finalW)),
      height: Math.max(100, Math.min(8000, finalH)),
      background: bgChoice,
      templateName: isAr ? `تصميم مخصص (${finalW}×${finalH})` : `Custom Design (${finalW}×${finalH})`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-slate-950/95 backdrop-blur-2xl border border-slate-800 text-slate-100 shadow-2xl p-0 rounded-2xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header with gradient branding */}
        <DialogHeader className="px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-100">
                {isAr ? "إنشاء تصميم جديد" : "Create New Design"}
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {isAr ? "جميع المقاسات والمنصات" : "All Formats"}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "اختر مقاساً قياسياً لمنصات التواصل، العروض، المطبوعات أو ابدأ بأبعاد مخصصة"
                  : "Choose a standard format for social, presentations, print, or custom dimensions"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Template Library trigger */}
            {onOpenTemplates && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTemplates();
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? "استعراض القوالب الجاهزة" : "Browse Templates"}</span>
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Search & Category Pills */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? "ابحث عن مقاس (مثل: Instagram, A4, غلاف)..." : "Search format (e.g., Instagram, A4)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl ps-9 pe-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left / Center 2 Columns: Preset Cards Grid */}
          <div className="md:col-span-2 space-y-4">
            {selectedCategory === "custom" ? (
              /* Custom Dimensions Workspace */
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                    <span>{isAr ? "تعيين أبعاد مخصصة للكانفاس" : "Custom Canvas Dimensions"}</span>
                  </h4>
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                    {(["px", "cm", "in"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setDimensionUnit(unit)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          dimensionUnit === unit ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                      {isAr ? "العرض (Width)" : "Width"} ({dimensionUnit})
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                      {isAr ? "الارتفاع (Height)" : "Height"} ({dimensionUnit})
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Aspect ratio lock */}
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLockRatio(!lockRatio)}
                      className={`p-1.5 rounded-lg border transition ${
                        lockRatio
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                      title={isAr ? "قفل نسبة العرض إلى الارتفاع" : "Lock Aspect Ratio"}
                    >
                      {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-slate-300">
                      {isAr ? "قفل نسبة الأبعاد (Aspect Ratio)" : "Maintain Aspect Ratio"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {(customWidth / Math.max(1, customHeight)).toFixed(2)} : 1
                  </span>
                </div>

                {/* Background color choice */}
                <div>
                  <label className="text-xs text-slate-400 block mb-2 font-medium">
                    {isAr ? "لون خلفية الكانفاس الأولية" : "Initial Canvas Background"}
                  </label>
                  <div className="flex items-center gap-2.5">
                    {[
                      { id: "transparent", label: isAr ? "شفاف" : "Transparent", bg: "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 10px 10px" },
                      { id: "white", label: isAr ? "أبيض" : "White", bg: "#ffffff" },
                      { id: "black", label: isAr ? "أسود" : "Black", bg: "#000000" },
                      { id: "#0f172a", label: isAr ? "استوديو كحلي" : "Studio Navy", bg: "#0f172a" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBgChoice(b.id as any)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                          bgChoice === b.id
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-sm"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-600 inline-block shrink-0"
                          style={{ background: b.bg }}
                        />
                        <span>{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Custom Button */}
                <button
                  type="button"
                  onClick={handleCreateCustomProject}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? "بدء التصميم المخصص الآن" : "Start Custom Canvas Now"}</span>
                </button>
              </div>
            ) : (
              /* Presets Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pe-1">
                {filteredPresets.map((p) => {
                  const isSelected = p.id === selectedPresetId;
                  const ratio = p.width / p.height;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500 text-slate-100 shadow-md shadow-cyan-500/10"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                            {p.icon}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-100 leading-snug">
                              {isAr ? p.nameAr : p.nameEn}
                            </h5>
                            <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                              {p.width} × {p.height} px
                            </span>
                          </div>
                        </div>

                        {/* Aspect visual pill */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {p.aspect}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {isAr ? p.descriptionAr : p.descriptionEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Preset Preview & Launch Pad */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  {isAr ? "معاينة القياس المحدد" : "Selected Format"}
                </span>
                <h4 className="text-base font-bold text-slate-100">
                  {isAr ? selectedPreset.nameAr : selectedPreset.nameEn}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {selectedPreset.width} × {selectedPreset.height} px
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedPreset.aspect}
                  </span>
                </div>
              </div>

              {/* Proportional aspect box simulation */}
              <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center p-4">
                <div
                  className="rounded-lg border-2 border-dashed border-cyan-400/60 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 flex flex-col items-center justify-center shadow-inner transition-all duration-300"
                  style={{
                    width: selectedPreset.width >= selectedPreset.height ? "100%" : `${Math.round((selectedPreset.width / selectedPreset.height) * 100)}%`,
                    height: selectedPreset.height > selectedPreset.width ? "100%" : `${Math.round((selectedPreset.height / selectedPreset.width) * 100)}%`,
                    maxHeight: "140px",
                    maxWidth: "200px"
                  }}
                >
                  <span className="text-lg">{selectedPreset.icon}</span>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold mt-1">
                    {selectedPreset.aspect}
                  </span>
                </div>
              </div>

              {/* Background Color selector for preset */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  {isAr ? "لون الكانفاس" : "Canvas Background"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgChoice("transparent")}
                    className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition ${
                      bgChoice === "transparent"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isAr ? "شفاف" : "Transparent"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgChoice("white")}
                    className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition ${
                      bgChoice === "white"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isAr ? "أبيض نقي" : "Pure White"}
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleCreatePresetProject}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? "إنشاء تصميم فارغ بهذا المقاس" : "Create Blank Canvas"}</span>
              </button>

              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTemplates();
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? "تصفح قوالب التصميم الحية" : "Browse Layered Templates"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
