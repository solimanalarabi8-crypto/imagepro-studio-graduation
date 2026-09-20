import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESIGN_TEMPLATES, DesignTemplatePreset } from "@/lib/templates";
import { FilePlus2, Check, LayoutGrid, SlidersHorizontal, ArrowRight, Sparkles } from "lucide-react";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewProject: (options: {
    width: number;
    height: number;
    background: "transparent" | "white" | "black" | string;
    templateName?: string;
  }) => void;
  lang?: "ar" | "en";
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onCreateNewProject,
  lang = "ar",
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DESIGN_TEMPLATES[0].id);
  const [activeTab, setActiveTab] = useState<string>("presets");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Custom dimensions state
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [bgColor, setBgColor] = useState<"transparent" | "white" | "black">("transparent");

  const isAr = lang === "ar";

  const filteredTemplates = activeCategory === "all"
    ? DESIGN_TEMPLATES
    : DESIGN_TEMPLATES.filter((t) => t.category === activeCategory);

  const selectedTemplate = DESIGN_TEMPLATES.find((t) => t.id === selectedTemplateId) || DESIGN_TEMPLATES[0];

  const handleCreateFromPreset = () => {
    onCreateNewProject({
      width: selectedTemplate.width,
      height: selectedTemplate.height,
      background: bgColor,
      templateName: isAr ? selectedTemplate.nameAr : selectedTemplate.nameEn,
    });
    onClose();
  };

  const handleCreateCustom = () => {
    onCreateNewProject({
      width: Math.max(100, Math.min(8000, customWidth || 1080)),
      height: Math.max(100, Math.min(8000, customHeight || 1080)),
      background: bgColor,
      templateName: isAr ? "مشروع مخصص" : "Custom Canvas",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-white shadow-2xl p-0"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-slate-900/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isAr ? "مشروع جديد وقوالب التصميم الجاهزة" : "New Project & Design Templates"}
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {isAr ? "مقاسات قياسية" : "Standard Presets"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "اختر من مقاسات منصات التواصل الاجتماعي والإعلانات أو حدد أبعاداً مخصصة"
                  : "Start with pre-configured social media, ads, or custom canvas dimensions"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Top Tabs: Presets vs Custom */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/40">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-800/80 p-1">
              <TabsTrigger value="presets" className="text-xs gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? "قوالب ومقاسات جاهزة" : "Preset Templates"}</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAr ? "أبعاد مخصصة" : "Custom Dimensions"}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "presets" ? (
            <>
              {/* Canva-Grade Visual Suite Hero Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {/* Banner 1: Magic Layers & AI */}
                <div className="canva-banner-card canva-banner-purple min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <span className="canva-pointer-tag">
                      {isAr ? "ميزة جديدة كلياً ✨" : "Brand New Feature ✨"}
                    </span>
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="my-2">
                    <h3 className="text-sm font-extrabold text-white leading-snug">
                      {isAr
                        ? "حوّل صورتك إلى تصميم قابل للتعديل مع الطبقات السحرية"
                        : "Transform your photos with Magic Layers & AI"}
                    </h3>
                    <p className="text-[11px] text-white/80 mt-1">
                      {isAr
                        ? "عزل ذكي للأجسام، قوالب سوشيال ميديا مسبقة القياس، وتحكم بكسلي كامل"
                        : "Smart subject extraction, pre-measured social templates, and total pixel control"}
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId("insta_post");
                        setCustomWidth(1080);
                        setCustomHeight(1080);
                      }}
                      className="canva-white-pill-btn"
                    >
                      {isAr ? "استكشف الطبقات السحرية" : "Explore Magic Layers"}
                    </button>
                  </div>
                </div>

                {/* Banner 2: Magic Eraser */}
                <div className="canva-banner-card canva-banner-orange min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <span className="canva-pointer-tag" style={{ background: "#fde047", color: "#713f12" }}>
                      {isAr ? "تنظيف فوري ✂️" : "Instant Healing ✂️"}
                    </span>
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="my-2">
                    <h3 className="text-sm font-extrabold text-white leading-snug">
                      {isAr
                        ? "استخدم الممحاة السحرية لتنظيف عيوب الصور"
                        : "Use Magic Eraser to clean and heal photos"}
                    </h3>
                    <p className="text-[11px] text-white/80 mt-1">
                      {isAr
                        ? "مسح بكسل نقي لشفافية 100% وإزالة العناصر المزعجة بلمسة واحدة"
                        : "Pure alpha erasing to 100% transparency with intelligent edge protection"}
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId("banner_yt");
                        setCustomWidth(2560);
                        setCustomHeight(1440);
                      }}
                      className="canva-white-pill-btn"
                    >
                      {isAr ? "استكشف الممحاة السحرية" : "Explore Magic Eraser"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === "all"
                      ? "bg-cyan-500 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "الكل" : "All"}
                </button>
                <button
                  onClick={() => setActiveCategory("social")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === "social"
                      ? "bg-cyan-500 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "منصات التواصل" : "Social Media"}
                </button>
                <button
                  onClick={() => setActiveCategory("marketing")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === "marketing"
                      ? "bg-cyan-500 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "تسويق وإعلانات" : "Marketing & Ads"}
                </button>
                <button
                  onClick={() => setActiveCategory("print")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === "print"
                      ? "bg-cyan-500 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "مطبوعات وبطاقات" : "Print & Cards"}
                </button>
              </div>

              {/* Template Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredTemplates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setCustomWidth(template.width);
                        setCustomHeight(template.height);
                      }}
                      className={`p-3.5 rounded-xl text-start border transition-all duration-200 relative flex flex-col justify-between ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                          : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl mb-2">{template.icon}</span>
                        <Badge variant="outline" className="text-[10px] bg-slate-900/60 text-slate-400 border-slate-700">
                          {template.aspect}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {isAr ? template.nameAr : template.nameEn}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                          {template.width} × {template.height} px
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {isAr ? template.descriptionAr : template.descriptionEn}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 bg-cyan-500 text-white rounded-full p-0.5 shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Custom Dimensions Form */
            <div className="space-y-4 max-w-md mx-auto py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? "العرض (بكسل)" : "Width (px)"}
                  </Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    min={100}
                    max={8000}
                    className="bg-slate-800/90 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? "الارتفاع (بكسل)" : "Height (px)"}
                  </Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    min={100}
                    max={8000}
                    className="bg-slate-800/90 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
              </div>

              {/* Quick Aspect Ratio Presets */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-slate-700 bg-slate-800 hover:bg-slate-750"
                  onClick={() => { setCustomWidth(1080); setCustomHeight(1080); }}
                >
                  1:1 (1080p)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-slate-700 bg-slate-800 hover:bg-slate-750"
                  onClick={() => { setCustomWidth(1920); setCustomHeight(1080); }}
                >
                  16:9 (FHD)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-slate-700 bg-slate-800 hover:bg-slate-750"
                  onClick={() => { setCustomWidth(1080); setCustomHeight(1920); }}
                >
                  9:16 (Story)
                </Button>
              </div>
            </div>
          )}

          {/* Background Selection */}
          <div className="bg-slate-850/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              {isAr ? "لون أرضية القماش الأولية:" : "Initial Canvas Background:"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBgColor("transparent")}
                className={`px-3 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                  bgColor === "transparent"
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-semibold"
                    : "border-slate-700 bg-slate-800/80 text-slate-400"
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-slate-500 bg-[conic-gradient(#334155_25%,transparent_25%,transparent_50%,#334155_50%,#334155_75%,transparent_75%)] bg-[length:6px_6px]" />
                <span>{isAr ? "شفاف (PNG)" : "Transparent"}</span>
              </button>

              <button
                type="button"
                onClick={() => setBgColor("white")}
                className={`px-3 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                  bgColor === "white"
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-semibold"
                    : "border-slate-700 bg-slate-800/80 text-slate-400"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                <span>{isAr ? "أبيض" : "White"}</span>
              </button>

              <button
                type="button"
                onClick={() => setBgColor("black")}
                className={`px-3 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                  bgColor === "black"
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-semibold"
                    : "border-slate-700 bg-slate-800/80 text-slate-400"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-black border border-slate-600" />
                <span>{isAr ? "أسود" : "Black"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {activeTab === "presets" ? (
              <span>
                {isAr ? "المقاس المختار: " : "Selected: "}
                <strong className="text-slate-200">
                  {selectedTemplate.width} × {selectedTemplate.height} px
                </strong>
              </span>
            ) : (
              <span>
                {isAr ? "المقاس المخصص: " : "Custom: "}
                <strong className="text-slate-200">
                  {customWidth} × {customHeight} px
                </strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 text-xs h-9"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={activeTab === "presets" ? handleCreateFromPreset : handleCreateCustom}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium text-xs h-9 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>{isAr ? "إنشاء القماش والبدء" : "Create Canvas & Start"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default TemplatesModal;
