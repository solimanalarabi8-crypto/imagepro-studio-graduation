import React, { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EDITABLE_TEMPLATES,
  EditableTemplate
} from "@/lib/editable-templates";
import {
  CREATIVE_BACKDROPS,
  CreativeBackdropPreset
} from "@/lib/creative-backgrounds";
import { PRODUCT_BACKGROUNDS, ProductBackgroundPreset } from "@/lib/product-backgrounds";
import {
  Search,
  Lock,
  Unlock,
  FolderOpen
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
  onApplyTemplate?: (template: EditableTemplate) => void;
  onApplyBackground?: (preset: CreativeBackdropPreset | ProductBackgroundPreset) => void;
  onOpenTemplates?: () => void;
  lang?: "ar" | "en";
}

// Live Canvas Thumbnail component for Canva-grade rendering
const CanvasLiveThumb: React.FC<{
  renderFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  width: number;
  height: number;
}> = ({ renderFn, width, height }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tw = 320;
    const th = Math.max(120, Math.round((tw / width) * height));
    canvas.width = tw;
    canvas.height = th;
    ctx.clearRect(0, 0, tw, th);
    renderFn(ctx, tw, th);
  }, [renderFn, width, height]);

  return (
    <div className="relative w-full overflow-hidden flex items-center justify-center bg-slate-950/80 rounded-xl aspect-video max-h-[140px]">
      <canvas
        ref={ref}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};

export const NewDesignModal: React.FC<NewDesignModalProps> = ({
  isOpen,
  onClose,
  onCreateNewProject,
  onApplyTemplate,
  onApplyBackground,
  onOpenTemplates,
  lang = "ar"
}) => {
  const isAr = lang === "ar";

  // Active Tab in New Design:
  // "presets" = The 8 Standard Cards from Image 4 Panel 3
  // "templates" = Canva Live Templates catalog
  // "backdrops" = Live Studio Backdrops catalog
  // "custom" = Custom Dimension Width/Height inputs
  const [activeTab, setActiveTab] = useState<"presets" | "templates" | "backdrops" | "custom">("presets");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateCat, setSelectedTemplateCat] = useState("all");
  const [selectedBackdropCat, setSelectedBackdropCat] = useState("all");

  // Custom dimensions state
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [aspectRatioValue, setAspectRatioValue] = useState<number>(1);
  const [bgChoice, setBgChoice] = useState<"white" | "transparent" | "black">("white");

  // Project file input ref for "فتح مشروع موجود"
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 8 Standard Preset Cards matching Image 4 Panel 3 ("قائمة تصميم جديد")
  const standardPresets = useMemo(() => [
    {
      id: "instagram-post",
      nameAr: "Instagram Post",
      nameEn: "Instagram Post",
      width: 1080,
      height: 1080,
      dimensions: "1080 × 1080",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </div>
      )
    },
    {
      id: "instagram-story",
      nameAr: "Instagram Story",
      nameEn: "Instagram Story",
      width: 1080,
      height: 1920,
      dimensions: "1080 × 1920",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <path d="M12 18h.01" />
          </svg>
        </div>
      )
    },
    {
      id: "youtube-thumbnail",
      nameAr: "Youtube Thumbnail",
      nameEn: "YouTube Thumbnail",
      width: 1280,
      height: 720,
      dimensions: "1280 × 720",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff0000] to-[#cc0000] flex items-center justify-center text-white shadow-lg shadow-red-500/20">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      )
    },
    {
      id: "facebook-post",
      nameAr: "Facebook Post",
      nameEn: "Facebook Post",
      width: 1200,
      height: 630,
      dimensions: "1200 × 630",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1877f2] to-[#0d65d9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      )
    },
    {
      id: "presentation",
      nameAr: "عرض تقديمي",
      nameEn: "Presentation",
      width: 1920,
      height: 1080,
      dimensions: "1920 × 1080",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#06b6d4] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
      )
    },
    {
      id: "business-card",
      nameAr: "بطاقة عمل",
      nameEn: "Business Card",
      width: 1050,
      height: 600,
      dimensions: "85 × 55",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="6" y1="9" x2="10" y2="9" />
            <line x1="6" y1="13" x2="14" y2="13" />
          </svg>
        </div>
      )
    },
    {
      id: "resume-cv",
      nameAr: "سيرة ذاتية",
      nameEn: "Resume / CV",
      width: 1240,
      height: 1754,
      dimensions: "A4",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#06b6d4] flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
      )
    },
    {
      id: "custom-dimensions",
      nameAr: "تصميم مخصص",
      nameEn: "Custom Size",
      width: 1080,
      height: 1080,
      dimensions: "أبعاد مخصصة",
      bg: "white",
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#a855f7] to-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
          </svg>
        </div>
      )
    }
  ], []);

  // Filtered Templates for tab 2
  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (selectedTemplateCat !== "all") {
      list = list.filter((t) => t.category === selectedTemplateCat);
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
  }, [selectedTemplateCat, searchQuery]);

  // Merged Backdrops list (Product + Creative Backdrops)
  const allBackdrops = useMemo(() => {
    const pBgs: CreativeBackdropPreset[] = PRODUCT_BACKGROUNDS.map((p) => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      category: p.category as any,
      tags: ["product", "studio", p.id],
      accentColor: p.accentColor,
      render: p.render
    }));
    return [...pBgs, ...CREATIVE_BACKDROPS];
  }, []);

  const filteredBackdrops = useMemo(() => {
    let list = allBackdrops;
    if (selectedBackdropCat !== "all") {
      list = list.filter((b) => b.category === selectedBackdropCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allBackdrops, selectedBackdropCat, searchQuery]);

  const handleSelectPreset = (preset: typeof standardPresets[0]) => {
    if (preset.id === "custom-dimensions") {
      setActiveTab("custom");
      return;
    }
    onCreateNewProject({
      width: preset.width,
      height: preset.height,
      background: preset.bg,
      templateName: isAr ? preset.nameAr : preset.nameEn
    });
    onClose();
  };

  const handleApplyTemplateDirect = (tpl: EditableTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(tpl);
    } else {
      onCreateNewProject({
        width: tpl.width,
        height: tpl.height,
        background: "white",
        templateName: isAr ? tpl.nameAr : tpl.nameEn
      });
    }
    onClose();
  };

  const handleApplyBackdropDirect = (bg: CreativeBackdropPreset) => {
    if (onApplyBackground) {
      onApplyBackground(bg);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) bg.render(ctx, 1920, 1080);
      onCreateNewProject({
        width: 1920,
        height: 1080,
        background: canvas.toDataURL("image/png"),
        templateName: isAr ? bg.nameAr : bg.nameEn
      });
    }
    onClose();
  };

  const handleCreateCustom = () => {
    onCreateNewProject({
      width: Math.max(100, Math.min(8000, customWidth)),
      height: Math.max(100, Math.min(8000, customHeight)),
      background: bgChoice,
      templateName: isAr ? `تصميم مخصص (${customWidth}×${customHeight})` : `Custom Design (${customWidth}×${customHeight})`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-4xl w-[94vw] max-h-[90vh] overflow-hidden flex flex-col bg-[#faf7f8] border border-[#e0f0ff] text-[#1c1917] shadow-2xl p-0 gap-0 rounded-3xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header - Royal Burgundy & Pure Pearl */}
        <DialogHeader className="px-6 py-4 border-b border-[#e0f0ff] bg-white flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-[#0057ff] tracking-wide flex items-center gap-2">
              <span>{isAr ? "تصميم جديد" : "New Design"}</span>
            </DialogTitle>
            <p className="text-xs text-[#78716c] mt-1">
              {isAr ? "اختر نوع التصميم الذي تريده" : "Choose the design format you want"}
            </p>
          </div>

          {/* Clean PicsArt Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#f5eff1] border border-[#e0f0ff]">
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "presets"
                  ? "picsart-btn-burgundy"
                  : "text-[#78716c] hover:text-[#0057ff] hover:bg-white/80"
              }`}
            >
              {isAr ? "المقاسات الجاهزة" : "Presets"}
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "templates"
                  ? "picsart-btn-burgundy"
                  : "text-[#78716c] hover:text-[#0057ff] hover:bg-white/80"
              }`}
            >
              {isAr ? "قوالب كانفا" : "Templates"}
            </button>
            <button
              onClick={() => setActiveTab("backdrops")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "backdrops"
                  ? "picsart-btn-burgundy"
                  : "text-[#78716c] hover:text-[#0057ff] hover:bg-white/80"
              }`}
            >
              {isAr ? "استوديو الخلفيات" : "Backdrops"}
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "picsart-btn-burgundy"
                  : "text-[#78716c] hover:text-[#0057ff] hover:bg-white/80"
              }`}
            >
              {isAr ? "أبعاد مخصصة" : "Custom"}
            </button>
          </div>
        </DialogHeader>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* ── TAB 1: 8 Standard Presets Cards (PicsArt Squircle Cards) ── */}
          {activeTab === "presets" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {standardPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white hover:bg-[#eff6ff] border border-[#e0f0ff] hover:border-[#0057ff] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0057ff]/10 text-center cursor-pointer shadow-xs"
                  >
                    <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
                      {preset.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#1c1917] group-hover:text-[#0057ff] transition-colors whitespace-nowrap">
                      {isAr ? preset.nameAr : preset.nameEn}
                    </span>
                    <span className="text-[11px] text-[#78716c] mt-1 font-mono tracking-wide">
                      {preset.dimensions}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom Action: PicsArt Burgundy Pill Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 picsart-btn-burgundy flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 shadow-md group cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-[#fda4af] group-hover:scale-110 transition-transform" />
                  <span>{isAr ? "فتح مشروع موجود" : "Open Existing Project"}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".imagepro,application/json,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        onCreateNewProject({
                          width: 1920,
                          height: 1080,
                          background: reader.result as string,
                          templateName: file.name.replace(/\.[^/.]+$/, "")
                        });
                        onClose();
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ── TAB 2: Canva Live Templates (PicsArt & Burgundy) ── */}
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                  {[
                    { id: "all", nameAr: "الكل", nameEn: "All" },
                    { id: "social", nameAr: "سوشيال ميديا", nameEn: "Social Media" },
                    { id: "business", nameAr: "أعمال", nameEn: "Business" },
                    { id: "marketing", nameAr: "تسويق", nameEn: "Marketing" },
                    { id: "education", nameAr: "تعليم وشهادات", nameEn: "Education" },
                    { id: "posters", nameAr: "ملصقات وفن", nameEn: "Posters" },
                    { id: "invitations", nameAr: "دعوات ومناسبات", nameEn: "Invitations" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedTemplateCat(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedTemplateCat === cat.id
                          ? "picsart-btn-burgundy"
                          : "bg-white text-[#78716c] hover:text-[#0057ff] border border-[#e0f0ff]"
                      }`}
                    >
                      {isAr ? cat.nameAr : cat.nameEn}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleApplyTemplateDirect(tpl)}
                    className="group relative flex flex-col rounded-2xl bg-white hover:bg-[#eff6ff] border border-[#e0f0ff] hover:border-[#0057ff] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-[#0057ff]/10"
                  >
                    <CanvasLiveThumb
                      renderFn={tpl.renderPreview}
                      width={tpl.width}
                      height={tpl.height}
                    />
                    <div className="p-3">
                      <div className="text-xs font-bold text-[#1c1917] group-hover:text-[#0057ff] transition-colors line-clamp-1">
                        {isAr ? tpl.nameAr : tpl.nameEn}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#78716c] mt-1 font-mono">
                        <span>{tpl.width}×{tpl.height}</span>
                        <span className="capitalize text-[#0057ff] font-bold font-sans">{tpl.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 3: Live Studio Backdrops (PicsArt & Burgundy) ── */}
          {activeTab === "backdrops" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                  {[
                    { id: "all", nameAr: "الكل", nameEn: "All" },
                    { id: "luxury", nameAr: "رخام وفاخر", nameEn: "Luxury" },
                    { id: "studio", nameAr: "استوديو تصوير", nameEn: "Studio" },
                    { id: "natural", nameAr: "طبيعة وخشب", nameEn: "Natural" },
                    { id: "creative", nameAr: "نيون وسايبر", nameEn: "Cyber" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedBackdropCat(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedBackdropCat === cat.id
                          ? "picsart-btn-burgundy"
                          : "bg-white text-[#78716c] hover:text-[#0057ff] border border-[#e0f0ff]"
                      }`}
                    >
                      {isAr ? cat.nameAr : cat.nameEn}
                    </button>
                  ))}
                </div>

                <div className="relative w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716c] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? "ابحث في الخلفيات..." : "Search backdrops..."}
                    className="w-full h-9 pr-9 pl-3 rounded-full bg-white border border-[#e0f0ff] text-[#1c1917] placeholder-[#a8a29e] text-xs focus:outline-none focus:border-[#0057ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredBackdrops.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => handleApplyBackdropDirect(bg)}
                    className="group relative flex flex-col rounded-2xl bg-white hover:bg-[#eff6ff] border border-[#e0f0ff] hover:border-[#0057ff] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-[#0057ff]/10"
                  >
                    <CanvasLiveThumb
                      renderFn={bg.render}
                      width={1600}
                      height={900}
                    />
                    <div className="p-3">
                      <div className="text-xs font-bold text-[#1c1917] group-hover:text-[#0057ff] transition-colors line-clamp-1">
                        {isAr ? bg.nameAr : bg.nameEn}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#78716c] mt-1">
                        <span className="capitalize">{bg.category}</span>
                        <span className="text-[#0057ff] font-bold">{isAr ? "تطبيق فوري" : "Apply"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: Custom Dimensions ── */}
          {activeTab === "custom" && (
            <div className="max-w-md mx-auto space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#1c1917] block mb-1.5">
                    {isAr ? "العرض (بكسل)" : "Width (px)"}
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomWidth(val);
                      if (lockRatio) setCustomHeight(Math.round(val / aspectRatioValue));
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#e0f0ff] text-[#1c1917] font-mono text-sm focus:outline-none focus:border-[#0057ff]"
                    min="50"
                    max="8000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1c1917] block mb-1.5">
                    {isAr ? "الارتفاع (بكسل)" : "Height (px)"}
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomHeight(val);
                      if (lockRatio) setCustomWidth(Math.round(val * aspectRatioValue));
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#e0f0ff] text-[#1c1917] font-mono text-sm focus:outline-none focus:border-[#0057ff]"
                    min="50"
                    max="8000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-[#e0f0ff]">
                <span className="text-xs font-semibold text-[#1c1917]">
                  {isAr ? "قفل نسبة العرض إلى الارتفاع" : "Lock Aspect Ratio"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLockRatio(!lockRatio);
                    if (!lockRatio && customHeight > 0) {
                      setAspectRatioValue(customWidth / customHeight);
                    }
                  }}
                  className={`p-1.5 rounded-lg cursor-pointer ${lockRatio ? "picsart-btn-burgundy" : "bg-[#f5eff1] text-[#78716c]"}`}
                >
                  {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1c1917] block mb-1.5">
                  {isAr ? "لون الخلفية" : "Background Color"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "white", label: isAr ? "أبيض" : "White" },
                    { id: "transparent", label: isAr ? "شفاف" : "Transparent" },
                    { id: "black", label: isAr ? "أسود" : "Black" },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setBgChoice(bg.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        bgChoice === bg.id
                          ? "picsart-btn-burgundy"
                          : "bg-white text-[#78716c] border-[#e0f0ff] hover:text-[#0057ff]"
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateCustom}
                className="w-full py-3.5 picsart-btn-burgundy text-sm font-bold shadow-lg transition-all mt-2 cursor-pointer"
              >
                {isAr ? "إنشاء الكانفاس الجديد" : "Create Canvas"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewDesignModal;

