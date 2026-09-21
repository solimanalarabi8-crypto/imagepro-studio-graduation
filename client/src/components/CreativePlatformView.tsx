import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Sparkles,
  Plus,
  Star,
  Eye,
  ArrowRight,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Download,
  Folder,
  Image as ImageIcon,
  Layout,
  Palette,
  Check,
  X,
  ExternalLink,
  Maximize2
} from "lucide-react";
import {
  EDITABLE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  EditableTemplate,
  TemplateCategory
} from "@/lib/editable-templates";
import {
  CREATIVE_BACKDROPS,
  CREATIVE_BACKDROP_CATEGORIES,
  CreativeBackdropPreset,
  BackdropCategory
} from "@/lib/creative-backgrounds";
import {
  ASSET_GRAPHICS,
  ASSET_CATEGORIES,
  AssetGraphicItem,
  AssetCategory
} from "@/lib/assets-library";
import {
  STOCK_PHOTOS,
  STOCK_PHOTO_CATEGORIES,
  StockPhotoItem,
  StockPhotoCategory
} from "@/lib/stock-photos-library";
import { StoredProjectMetadata } from "@/lib/autosave-manager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreativePlatformViewProps {
  onOpenNewDesign: () => void;
  onApplyTemplate: (template: EditableTemplate) => void;
  onApplyBackground: (preset: CreativeBackdropPreset) => void;
  onAddAsset: (asset: AssetGraphicItem) => void;
  onApplyStockPhoto: (photo: StockPhotoItem, asLayer: boolean) => void;
  onOpenProject: (projectId: string) => void;
  onSwitchToEditor: () => void;
  projects: StoredProjectMetadata[];
  lang?: "ar" | "en";
}

// Canvas Preview helper with high DPR and memoization
const LiveCanvasPreview: React.FC<{
  renderFn: (ctx: CanvasRenderingContext2D, w: number, height: number) => void;
  width: number;
  height: number;
  className?: string;
  maxDisplayHeight?: number;
}> = ({ renderFn, width, height, className = "", maxDisplayHeight = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render internal resolution
    const targetW = 320;
    const targetH = Math.round((targetW / width) * height);
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);
    renderFn(ctx, targetW, targetH);
  }, [renderFn, width, height]);

  return (
    <div
      className="relative w-full overflow-hidden flex items-center justify-center bg-slate-950/70 rounded-xl"
      style={{ maxHeight: `${maxDisplayHeight}px` }}
    >
      <canvas
        ref={canvasRef}
        className={`w-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105 ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    </div>
  );
};

export const CreativePlatformView: React.FC<CreativePlatformViewProps> = ({
  onOpenNewDesign,
  onApplyTemplate,
  onApplyBackground,
  onAddAsset,
  onApplyStockPhoto,
  onOpenProject,
  onSwitchToEditor,
  projects,
  lang = "ar"
}) => {
  const isAr = lang === "ar";

  // Global search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<TemplateCategory | "all">("all");
  const [activeBackdropCategory, setActiveBackdropCategory] = useState<BackdropCategory | "all">("all");
  const [activeAssetCategory, setActiveAssetCategory] = useState<AssetCategory | "all">("all");
  const [activePhotoCategory, setActivePhotoCategory] = useState<StockPhotoCategory>("all");

  // Favorites state
  const [favorites, setFavorites] = useState<{
    templates: string[];
    backdrops: string[];
    assets: string[];
    photos: string[];
  }>(() => {
    try {
      const saved = localStorage.getItem("imagepro_creative_favorites");
      return saved ? JSON.parse(saved) : { templates: [], backdrops: [], assets: [], photos: [] };
    } catch {
      return { templates: [], backdrops: [], assets: [], photos: [] };
    }
  });

  const toggleFavorite = (type: "templates" | "backdrops" | "assets" | "photos", id: string) => {
    setFavorites((prev) => {
      const list = prev[type] || [];
      const updated = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      const next = { ...prev, [type]: updated };
      try {
        localStorage.setItem("imagepro_creative_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Preview Modal state
  const [previewModalItem, setPreviewModalItem] = useState<{
    type: "template" | "backdrop" | "asset" | "photo";
    data: any;
  } | null>(null);

  // Quick Design Types Presets
  const quickDesignTypes = useMemo(() => [
    { id: "insta-post", nameAr: "منشور إنستغرام", nameEn: "Instagram Post", size: "1080×1080", width: 1080, height: 1080, icon: "📸", aspect: "1:1", color: "from-pink-500 to-rose-500" },
    { id: "insta-story", nameAr: "قصة / ريلز", nameEn: "Story / Reels", size: "1080×1920", width: 1080, height: 1920, icon: "📱", aspect: "9:16", color: "from-purple-500 to-indigo-500" },
    { id: "yt-thumb", nameAr: "مصغرة يوتيوب", nameEn: "YouTube Thumbnail", size: "1280×720", width: 1280, height: 720, icon: "🎬", aspect: "16:9", color: "from-red-500 to-rose-600" },
    { id: "fb-post", nameAr: "منشور فيسبوك", nameEn: "Facebook Post", size: "1200×630", width: 1200, height: 630, icon: "📘", aspect: "1.91:1", color: "from-blue-600 to-cyan-600" },
    { id: "linkedin-post", nameAr: "غلاف لينكد إن", nameEn: "LinkedIn Banner", size: "1584×396", width: 1584, height: 396, icon: "💼", aspect: "4:1", color: "from-sky-600 to-blue-700" },
    { id: "presentation", nameAr: "عرض تقديمي", nameEn: "Presentation", size: "1920×1080", width: 1920, height: 1080, icon: "📊", aspect: "16:9", color: "from-amber-500 to-orange-600" },
    { id: "a4-doc", nameAr: "وثيقة A4 / سيرة ذاتية", nameEn: "A4 Document / CV", size: "1240×1754", width: 1240, height: 1754, icon: "📄", aspect: "A4", color: "from-emerald-500 to-teal-600" },
    { id: "business-card", nameAr: "بطاقة عمل", nameEn: "Business Card", size: "1050×600", width: 1050, height: 600, icon: "💳", aspect: "1.75:1", color: "from-violet-600 to-purple-800" },
    { id: "poster", nameAr: "بوستر إعلاني", nameEn: "Event Poster", size: "1414×2000", width: 1414, height: 2000, icon: "🖼️", aspect: "3:4", color: "from-fuchsia-600 to-pink-600" },
    { id: "flyer", nameAr: "فلاير تسويقي", nameEn: "Marketing Flyer", size: "1240×1754", width: 1240, height: 1754, icon: "📰", aspect: "A4", color: "from-teal-500 to-cyan-600" },
    { id: "custom", nameAr: "أبعاد مخصصة", nameEn: "Custom Size", size: "📐 حر", width: 1080, height: 1080, icon: "✨", aspect: "Custom", color: "from-cyan-500 to-teal-400" },
  ], []);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (activeTemplateCategory !== "all") {
      list = list.filter((t) => t.category === activeTemplateCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.nameAr.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTemplateCategory, searchQuery]);

  // Featured Templates (curated highlights)
  const featuredTemplates = useMemo(() => {
    return EDITABLE_TEMPLATES.slice(0, 6);
  }, []);

  // Filtered Backgrounds
  const filteredBackdrops = useMemo(() => {
    let list = CREATIVE_BACKDROPS;
    if (activeBackdropCategory !== "all") {
      list = list.filter((b) => b.category === activeBackdropCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          b.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeBackdropCategory, searchQuery]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = ASSET_GRAPHICS;
    if (activeAssetCategory !== "all") {
      list = list.filter((a) => a.category === activeAssetCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.nameAr.toLowerCase().includes(q) ||
          a.nameEn.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeAssetCategory, searchQuery]);

  // Filtered Photos
  const filteredPhotos = useMemo(() => {
    let list = STOCK_PHOTOS;
    if (activePhotoCategory !== "all") {
      list = list.filter((p) => p.category === activePhotoCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activePhotoCategory, searchQuery]);

  // Drag & drop transfer for assets
  const handleDragStartAsset = (e: React.DragEvent, asset: AssetGraphicItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "asset-graphic", assetId: asset.id }));
  };

  const handleQuickDesignClick = (type: typeof quickDesignTypes[0]) => {
    if (type.id === "custom") {
      onOpenNewDesign();
    } else {
      // Direct create project with these dimensions
      const canvas = document.createElement("canvas");
      canvas.width = type.width;
      canvas.height = type.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, type.width, type.height);
      }
      onApplyTemplate({
        id: `blank-${type.id}`,
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        category: "social",
        width: type.width,
        height: type.height,
        aspect: type.aspect,
        tags: ["blank", "new"],
        layers: [
          { id: "bg-white", name: isAr ? "الخلفية البيضاء" : "White Background", kind: "background", color: "#ffffff" }
        ],
        renderPreview: (c, w, h) => {
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, w, h);
        }
      });
    }
  };

  return (
    <div className="w-full flex-1 overflow-y-auto bg-slate-950 text-slate-100 pb-24 select-none" dir={isAr ? "rtl" : "ltr"}>
      {/* ── 1. Hero / Search Banner ── */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-12 px-6 sm:px-12">
        {/* Ambient Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold tracking-wide mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "الجيل الجديد من استوديو التصميم الإبداعي" : "Next-Gen Creative Design Workstation"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight max-w-3xl">
            {isAr ? "ماذا تود أن تصمم اليوم؟" : "What will you design today?"}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-2xl leading-relaxed">
            {isAr
              ? "اختر من مئات القوالب الجاهزة القابلة للتعديل كطبقات كاملة، آلاف الخلفيات الاحترافية، الصور المرخصة، والأصول الإبداعية ثلاثية الأبعاد."
              : "Explore hundreds of fully layered editable templates, high-definition backdrops, licensed stock photos, and 3D creative assets."}
          </p>

          {/* Master Search Input */}
          <div className="relative w-full max-w-2xl mt-8">
            <div className="relative flex items-center">
              <Search className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? "ابحث في القوالب، الخلفيات، الأصول، أو الصور (مثال: إنستغرام، خصم، رخام، ذهبي)..."
                    : "Search templates, backdrops, assets, or photos (e.g. sale, marble, neon)..."
                }
                className="w-full h-13 pr-12 pl-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 shadow-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick search tag pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">{isAr ? "شائع:" : "Trending:"}</span>
              {["إنستغرام", "خصم وعروض", "رخام", "ذهبي", "يوتيوب", "سيرة ذاتية", "سايبربانك", "ستوديو"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-cyan-300 border border-slate-700/50 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-10 space-y-16">
        {/* ── 2. Quick Design Types (المقاسات السريعة) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{isAr ? "⚡ مقاسات وتصاميم سريعة" : "⚡ Quick Design Formats"}</span>
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                  {quickDesignTypes.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "ابدأ كانفاس جديد فوراً بالأبعاد المعيارية لأشهر المنصات والمطبوعات" : "Instantly start a new design with standard dimensions"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {quickDesignTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleQuickDesignClick(type)}
                className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-200 shadow-md hover:shadow-cyan-500/10 hover:-translate-y-1 text-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${type.color} flex items-center justify-center text-xl shadow-lg mb-2.5 group-hover:scale-110 transition-transform`}>
                  {type.icon}
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {isAr ? type.nameAr : type.nameEn}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  {type.size}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. Featured Layered Templates (القوالب المختارة) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{isAr ? "🌟 قوالب تصميم مختارة ومجهزة بطبقات كاملة" : "🌟 Featured Layered Templates"}</span>
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {isAr ? "طبقات قابلة للتعديل" : "Multi-Layer"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "عند اختيار القالب يفتح مباشرة في محرر الكانفاس كعناصر حية ونصوص وأشكال متجهة قابلة للتحرير" : "Opens inside the editor with full vector shapes, typography, and background layers"}
              </p>
            </div>
            <button
              onClick={() => setActiveTemplateCategory("all")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>{isAr ? "عرض جميع القوالب" : "Browse All"}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTemplates.map((tpl) => {
              const isFav = favorites.templates.includes(tpl.id);
              return (
                <div
                  key={tpl.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-cyan-500/10"
                >
                  {/* Canvas Preview */}
                  <div className="relative p-4 pb-0 bg-slate-950/60">
                    <LiveCanvasPreview
                      renderFn={tpl.renderPreview}
                      width={tpl.width}
                      height={tpl.height}
                      maxDisplayHeight={220}
                    />
                    {/* Dimension Badge */}
                    <span className="absolute top-6 left-6 px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-cyan-500/30 shadow-md">
                      {tpl.width}×{tpl.height} ({tpl.aspect})
                    </span>
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite("templates", tpl.id);
                      }}
                      className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isFav ? "bg-amber-500 text-slate-950" : "bg-slate-900/80 text-slate-400 hover:text-amber-400 border border-slate-700"
                      }`}
                      title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Info & Actions */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">
                        {tpl.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-1 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {isAr ? tpl.nameAr : tpl.nameEn}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => setPreviewModalItem({ type: "template", data: tpl })}
                        className="h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? "معاينة" : "Preview"}</span>
                      </button>
                      <button
                        onClick={() => onApplyTemplate(tpl)}
                        className="h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? "استخدام القالب" : "Use Template"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. All Template Categories & Catalog ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{isAr ? "🎨 مكتبة القوالب الشاملة" : "🎨 Complete Templates Library"}</span>
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                  {filteredTemplates.length} {isAr ? "قالب" : "templates"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "تصفح القوالب حسب التصنيف المخصص لوسائل التواصل، الأعمال، المطبوعات والمتاجر" : "Filter templates by category or search term"}
              </p>
            </div>
          </div>

          {/* Categories Pill Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTemplateCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTemplateCategory === cat.id
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
            {filteredTemplates.map((tpl) => {
              const isFav = favorites.templates.includes(tpl.id);
              return (
                <div
                  key={tpl.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 overflow-hidden shadow-md transition-all hover:shadow-cyan-500/10"
                >
                  <div className="relative p-3 bg-slate-950/60">
                    <LiveCanvasPreview
                      renderFn={tpl.renderPreview}
                      width={tpl.width}
                      height={tpl.height}
                      maxDisplayHeight={180}
                    />
                    <span className="absolute top-4 left-4 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                      {tpl.width}×{tpl.height}
                    </span>
                    <button
                      onClick={() => toggleFavorite("templates", tpl.id)}
                      className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isFav ? "bg-amber-500 text-slate-950" : "bg-slate-900/80 text-slate-400 hover:text-amber-400"
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {isAr ? tpl.nameAr : tpl.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 capitalize">{tpl.category}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
                      <button
                        onClick={() => setPreviewModalItem({ type: "template", data: tpl })}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title={isAr ? "معاينة القالب" : "Preview"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onApplyTemplate(tpl)}
                        className="flex-1 h-8 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isAr ? "استخدام القالب" : "Use Template"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Professional Backgrounds (مكتبة الخلفيات) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{isAr ? "🖼️ مكتبة الخلفيات الاحترافية" : "🖼️ Professional Backdrops"}</span>
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {filteredBackdrops.length} {isAr ? "خلفية" : "backdrops"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "خلفيات استوديو، رخام إيطالي، خشب دافئ، ذهب ملكي، زجاج بلوري، خرسانة، طبيعة، وجبال"
                  : "Studio spotlights, Carrara marble, warm walnut, royal gold foil, frosted glass, and mountains"}
              </p>
            </div>
          </div>

          {/* Backdrop Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CREATIVE_BACKDROP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveBackdropCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeBackdropCategory === cat.id
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Backdrops Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {filteredBackdrops.map((bg) => {
              const isFav = favorites.backdrops.includes(bg.id);
              return (
                <div
                  key={bg.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 overflow-hidden shadow-md transition-all hover:shadow-teal-500/10"
                >
                  <div className="relative p-2 bg-slate-950/60">
                    <LiveCanvasPreview
                      renderFn={bg.render}
                      width={1080}
                      height={1080}
                      maxDisplayHeight={150}
                    />
                    <button
                      onClick={() => toggleFavorite("backdrops", bg.id)}
                      className={`absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isFav ? "bg-amber-500 text-slate-950" : "bg-slate-900/80 text-slate-400 hover:text-amber-400"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-teal-300 transition-colors">
                        {isAr ? bg.nameAr : bg.nameEn}
                      </h4>
                      <span className="text-[10px] text-slate-400 capitalize">{bg.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setPreviewModalItem({ type: "backdrop", data: bg })}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title={isAr ? "معاينة" : "Preview"}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onApplyBackground(bg)}
                        className="flex-1 h-7 rounded-lg bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <span>{isAr ? "تعيين كخلفية" : "Use Background"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Creative Assets & 3D Elements ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{isAr ? "💎 مكتبة الأصول والعناصر الإبداعية (Creative Assets)" : "💎 Creative Assets & 3D Elements"}</span>
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {filteredAssets.length} {isAr ? "عنصر" : "assets"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "أيقونات، أشكال، إطارات، ملصقات، شارات وأختام، أسهم، مجسمات ثلاثية الأبعاد وزخارف" : "Icons, geometric shapes, badges, stickers, frames, 3D elements, and decorative ornaments"}
              </p>
            </div>
          </div>

          {/* Asset Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ASSET_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveAssetCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeAssetCategory === cat.id
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            {filteredAssets.map((asset) => {
              const isFav = favorites.assets.includes(asset.id);
              return (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStartAsset(e, asset)}
                  className="group relative flex flex-col items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-purple-500/10 cursor-grab active:cursor-grabbing text-center"
                >
                  <div className="relative w-full aspect-square max-w-[110px] flex items-center justify-center bg-slate-950/60 rounded-xl p-2 mb-2 group-hover:scale-105 transition-transform">
                    <canvas
                      ref={(canvas) => {
                        if (!canvas) return;
                        const ctx = canvas.getContext("2d");
                        if (!ctx) return;
                        canvas.width = 120;
                        canvas.height = 120;
                        ctx.clearRect(0, 0, 120, 120);
                        asset.render(ctx, 120);
                      }}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite("assets", asset.id);
                      }}
                      className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isFav ? "bg-amber-500 text-slate-950" : "text-slate-500 hover:text-amber-400"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {isAr ? asset.nameAr : asset.nameEn}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 capitalize">{asset.category}</span>

                  <button
                    onClick={() => onAddAsset(asset)}
                    className="w-full h-7 mt-2.5 rounded-lg bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAr ? "إضافة للكانفاس" : "Add to Canvas"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 7. Stock Photos Library (مكتبة الصور الفوتوغرافية) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{isAr ? "📷 مكتبة الصور الفوتوغرافية عالية الدقة" : "📷 High-Resolution Stock Photos"}</span>
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {filteredPhotos.length} {isAr ? "صورة" : "photos"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "صور استوديو، بورتريه، طبيعة، عمارة، أعمال ومأكولات بدقة عالية وترخيص مفتوح" : "Studio products, portraits, nature landscapes, architecture, and food photography"}
              </p>
            </div>
          </div>

          {/* Photo Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {STOCK_PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActivePhotoCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activePhotoCategory === cat.id
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {filteredPhotos.map((photo) => {
              const isFav = favorites.photos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 overflow-hidden shadow-md transition-all hover:shadow-emerald-500/10"
                >
                  <div className="relative p-2 bg-slate-950/60">
                    <LiveCanvasPreview
                      renderFn={photo.render}
                      width={photo.width}
                      height={photo.height}
                      maxDisplayHeight={160}
                    />
                    <button
                      onClick={() => toggleFavorite("photos", photo.id)}
                      className={`absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isFav ? "bg-amber-500 text-slate-950" : "bg-slate-900/80 text-slate-400 hover:text-amber-400"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {isAr ? photo.nameAr : photo.nameEn}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>{photo.width}×{photo.height}</span>
                        <span className="capitalize">{photo.category}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onApplyStockPhoto(photo, true)}
                        className="h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAr ? "كطبقة" : "Layer"}</span>
                      </button>
                      <button
                        onClick={() => onApplyStockPhoto(photo, false)}
                        className="h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <span>{isAr ? "كخلفية" : "BG"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 8. Recent Projects (مشاريعي) ── */}
        <section className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{isAr ? "📁 مشاريعي الأخيرة ومساحة العمل" : "📁 Recent Projects & Workspaces"}</span>
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                  {projects.length} {isAr ? "مشروع" : "projects"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? "استأنف مشاريعك السابقة المحفوظة بأمان محلياً مع كافة الطبقات وسجل التعديلات" : "Resume your previously saved projects with complete layers and history"}
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                {isAr ? "لا توجد مشاريع سابقة حتى الآن" : "No saved projects yet"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {isAr ? "اختر قالباً جاهزاً من الأعلى أو اضغط على '＋ تصميم جديد' في الشريط العلوي لبدء أول مشروع لك." : "Choose any template above or click '＋ New Design' in the top bar to create your first design."}
              </p>
              <button
                onClick={() => onSwitchToEditor()}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                {isAr ? "فتح استوديو الكانفاس" : "Open Canvas Studio"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projects.slice(0, 8).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj.id)}
                  className="group relative flex flex-col p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer shadow-md transition-all hover:-translate-y-1 hover:shadow-cyan-500/10"
                >
                  <div className="w-full aspect-video rounded-xl bg-slate-950 overflow-hidden relative flex items-center justify-center border border-slate-800">
                    {proj.thumbnail ? (
                      <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layout className="w-8 h-8 text-slate-700" />
                    )}
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/90 text-[9px] font-mono text-cyan-300">
                      {proj.width}×{proj.height}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {proj.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(proj.updatedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-semibold px-2 py-1 rounded bg-cyan-500/10">
                      {isAr ? "فتح" : "Open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── 9. High-Fidelity Preview Dialog ── */}
      {previewModalItem && (
        <Dialog open={!!previewModalItem} onOpenChange={(open) => !open && setPreviewModalItem(null)}>
          <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 text-slate-100 p-6 rounded-2xl" dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>
                  {isAr
                    ? previewModalItem.data.nameAr || previewModalItem.data.name
                    : previewModalItem.data.nameEn || previewModalItem.data.name}
                </span>
                <span className="text-xs font-mono text-cyan-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  {previewModalItem.data.width && previewModalItem.data.height
                    ? `${previewModalItem.data.width} × ${previewModalItem.data.height} px`
                    : "HD Asset"}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-4 min-h-[300px]">
              {previewModalItem.type === "template" && (
                <LiveCanvasPreview
                  renderFn={previewModalItem.data.renderPreview}
                  width={previewModalItem.data.width}
                  height={previewModalItem.data.height}
                  maxDisplayHeight={360}
                />
              )}
              {previewModalItem.type === "backdrop" && (
                <LiveCanvasPreview
                  renderFn={previewModalItem.data.render}
                  width={1080}
                  height={1080}
                  maxDisplayHeight={360}
                />
              )}
              {previewModalItem.type === "photo" && (
                <LiveCanvasPreview
                  renderFn={previewModalItem.data.render}
                  width={previewModalItem.data.width}
                  height={previewModalItem.data.height}
                  maxDisplayHeight={360}
                />
              )}
              {previewModalItem.type === "asset" && (
                <canvas
                  ref={(c) => {
                    if (!c) return;
                    const ctx = c.getContext("2d");
                    if (!ctx) return;
                    c.width = 240;
                    c.height = 240;
                    ctx.clearRect(0, 0, 240, 240);
                    previewModalItem.data.render(ctx, 240);
                  }}
                  className="w-48 h-48 object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
              {previewModalItem.type === "template" && (
                <button
                  onClick={() => {
                    const tpl = previewModalItem.data;
                    setPreviewModalItem(null);
                    onApplyTemplate(tpl);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
                >
                  {isAr ? "استخدام القالب داخل المحرر" : "Open in Canvas Editor"}
                </button>
              )}
              {previewModalItem.type === "backdrop" && (
                <button
                  onClick={() => {
                    const bg = previewModalItem.data;
                    setPreviewModalItem(null);
                    onApplyBackground(bg);
                  }}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-all"
                >
                  {isAr ? "تعيين كخلفية للكانفاس" : "Use as Background"}
                </button>
              )}
              {previewModalItem.type === "photo" && (
                <button
                  onClick={() => {
                    const photo = previewModalItem.data;
                    setPreviewModalItem(null);
                    onApplyStockPhoto(photo, true);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                >
                  {isAr ? "إضافة كطبقة جديدة" : "Add as Layer"}
                </button>
              )}
              {previewModalItem.type === "asset" && (
                <button
                  onClick={() => {
                    const asset = previewModalItem.data;
                    setPreviewModalItem(null);
                    onAddAsset(asset);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                >
                  {isAr ? "إضافة إلى الكانفاس" : "Add to Canvas"}
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
