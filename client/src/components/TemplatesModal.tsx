import React, { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  EDITABLE_TEMPLATES,
  EditableTemplate
} from "@/lib/editable-templates";
import { Sparkles, Check, X, Search, SlidersHorizontal, Eye } from "lucide-react";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewProject: (options: {
    width: number;
    height: number;
    background: "transparent" | "white" | "black";
    templateName?: string;
  }) => void;
  onApplyTemplate?: (template: EditableTemplate) => void;
  lang?: "ar" | "en";
}

// Live Canvas Thumbnail for Templates
const TemplateCanvasThumb: React.FC<{
  template: EditableTemplate;
  width: number;
  height: number;
}> = ({ template, width, height }) => {
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
    template.renderPreview(ctx, tw, th);
  }, [template, width, height]);

  return (
    <canvas
      ref={ref}
      className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105"
    />
  );
};

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onCreateNewProject,
  onApplyTemplate,
  lang = "ar",
}) => {
  const isAr = lang === "ar";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = useMemo(() => [
    { id: "all", nameAr: "جميع القوالب", nameEn: "All" },
    { id: "social", nameAr: "سوشيال ميديا", nameEn: "Social Media" },
    { id: "business", nameAr: "أعمال وشركات", nameEn: "Business" },
    { id: "marketing", nameAr: "تسويق وعروض", nameEn: "Marketing" },
    { id: "education", nameAr: "تعليم وشهادات", nameEn: "Education" },
    { id: "posters", nameAr: "ملصقات وفن", nameEn: "Posters" },
    { id: "invitations", nameAr: "دعوات ومناسبات", nameEn: "Invitations" },
  ], []);

  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (selectedCategory !== "all") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.nameAr.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const handleApply = (tpl: EditableTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(tpl);
    } else {
      onCreateNewProject({
        width: tpl.width,
        height: tpl.height,
        background: "white",
        templateName: isAr ? tpl.nameAr : tpl.nameEn,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-6xl w-[94vw] max-h-[90vh] overflow-hidden flex flex-col bg-[#faf7f8] border border-[#e0f0ff] text-[#1c1917] shadow-2xl p-0 gap-0 rounded-3xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header matching PicsArt Pro */}
        <DialogHeader className="px-6 py-4 border-b border-[#e0f0ff] bg-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0057ff] to-[#0ea5e9] flex items-center justify-center shadow-md shadow-[#0057ff]/20 text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0057ff] flex items-center gap-2">
                <span>{isAr ? "استوديو القوالب الحية (Canva Suite)" : "Live Templates Studio"}</span>
                <Badge variant="outline" className="text-xs bg-[#eff6ff] text-[#0057ff] border-[#0057ff]/30 rounded-full font-bold">
                  {isAr ? "طبقات حية قابلة للتعديل" : "Fully Editable Layers"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-[#78716c] mt-0.5">
                {isAr
                  ? "قوالب احترافية مجهزة كطبقات ونصوص حرة وأشكال متجهة تفتح مباشرة في الكانفاس"
                  : "Layered templates with editable typography and vector shapes"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#78716c] hover:text-[#0057ff] p-1.5 rounded-full hover:bg-[#eff6ff] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Top Filter Bar: Category Pills & Search */}
        <div className="px-6 py-3 border-b border-[#e0f0ff] bg-white/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? "picsart-btn-burgundy"
                    : "bg-white text-[#78716c] hover:text-[#0057ff] border border-[#e0f0ff]"
                }`}
              >
                {isAr ? c.nameAr : c.nameEn}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716c] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "ابحث في القوالب..." : "Search templates..."}
              className="w-full h-9 pr-9 pl-3 rounded-full bg-white border border-[#e0f0ff] text-[#1c1917] placeholder-[#a8a29e] text-xs focus:outline-none focus:border-[#0057ff]"
            />
          </div>
        </div>

        {/* 4-Column Grid of Templates */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group relative flex flex-col rounded-2xl bg-white hover:bg-[#eff6ff] border border-[#e0f0ff] hover:border-[#0057ff] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-[#0057ff]/10 cursor-pointer"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  <TemplateCanvasThumb template={tpl} width={tpl.width} height={tpl.height} />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                    <button
                      onClick={() => handleApply(tpl)}
                      className="px-5 py-2 rounded-full picsart-btn-burgundy text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      {isAr ? "استخدام القالب" : "Use Template"}
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <div className="text-xs font-bold text-[#1c1917] group-hover:text-[#0057ff] transition-colors line-clamp-1">
                    {isAr ? tpl.nameAr : tpl.nameEn}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#78716c] mt-1">
                    <span className="capitalize text-[#0057ff] font-bold font-sans">{tpl.category}</span>
                    <span className="font-mono">{tpl.width}×{tpl.height}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesModal;

