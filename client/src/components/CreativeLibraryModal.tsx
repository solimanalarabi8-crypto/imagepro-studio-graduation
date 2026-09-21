import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Palette,
  LayoutTemplate,
  FolderKanban,
  Shapes,
  Star,
  Search,
  Check,
  Eye,
  Plus,
  ArrowRight,
  Download,
  Sparkles,
  X,
  Layers,
  Camera,
  Image as ImageIcon,
  Folder,
  Share2,
  Home,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import {
  CREATIVE_BACKDROPS,
  CREATIVE_BACKDROP_CATEGORIES,
  CreativeBackdropPreset,
  BackdropCategory
} from "@/lib/creative-backgrounds";
import {
  EDITABLE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  EditableTemplate,
  TemplateCategory
} from "@/lib/editable-templates";
import {
  ASSET_GRAPHICS,
  ASSET_CATEGORIES,
  AssetGraphicItem
} from "@/lib/assets-library";
import {
  STOCK_PHOTOS,
  STOCK_PHOTO_CATEGORIES,
  StockPhotoItem,
  StockPhotoCategory
} from "@/lib/stock-photos-library";
import { StoredProjectMetadata } from "@/lib/autosave-manager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CreativeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackground: (preset: CreativeBackdropPreset) => void;
  onApplyTemplate: (template: EditableTemplate) => void;
  onAddAssetLayer: (asset: AssetGraphicItem) => void;
  onApplyStockPhoto?: (photo: StockPhotoItem, asLayer: boolean) => void;
  onOpenProject: (projectId: string) => void;
  projects: StoredProjectMetadata[];
  lang?: "ar" | "en";
}

// Live Canvas Thumbnail renderer for real Canva-grade preview
const LiveThumbCanvas: React.FC<{
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
    const th = Math.max(160, Math.round((tw / width) * height));
    canvas.width = tw;
    canvas.height = th;
    ctx.clearRect(0, 0, tw, th);
    renderFn(ctx, tw, th);
  }, [renderFn, width, height]);

  return <canvas ref={ref} className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105" />;
};

export const CreativeLibraryModal: React.FC<CreativeLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyBackground,
  onApplyTemplate,
  onAddAssetLayer,
  onApplyStockPhoto,
  onOpenProject,
  projects,
  lang = "ar"
}) => {
  const isAr = lang === "ar";

  // Active Main Navigation Section (Matching Image 4 Sidebar):
  // "templates" = مكتبة القوالب (Panel 4)
  // "backdrops" = مكتبة الخلفيات (Panel 5)
  // "assets" = مكتبة العناصر الإبداعية (Panel 6)
  // "photos" = مكتبة الصور
  // "projects" = مشاريعي (Panel 7)
  // "favorites" = المفضلة
  const [activeSection, setActiveSection] = useState<"templates" | "backdrops" | "assets" | "photos" | "projects" | "favorites">("backdrops");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [bgCategory, setBgCategory] = useState<BackdropCategory | "all">("all");
  const [tplCategory, setTplCategory] = useState<TemplateCategory | "all">("all");
  const [assetCategory, setAssetCategory] = useState<string>("all");
  const [photoCategory, setPhotoCategory] = useState<StockPhotoCategory>("all");

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("imagepro_hub_favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("imagepro_hub_favorites", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Dedicated Big Preview Modal state
  const [previewItem, setPreviewItem] = useState<{
    type: "template" | "backdrop" | "photo" | "asset";
    title: string;
    dims: string;
    renderFn?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
    onApply: () => void;
  } | null>(null);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (tplCategory !== "all") {
      list = list.filter((t) => t.category === tplCategory);
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
  }, [tplCategory, searchQuery]);

  // Filtered Backdrops
  const filteredBackdrops = useMemo(() => {
    let list = CREATIVE_BACKDROPS;
    if (bgCategory !== "all") {
      list = list.filter((b) => b.category === bgCategory);
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
  }, [bgCategory, searchQuery]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = ASSET_GRAPHICS;
    if (assetCategory !== "all") {
      list = list.filter((a) => a.category === assetCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.nameAr.toLowerCase().includes(q) ||
          a.nameEn.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [assetCategory, searchQuery]);

  // Filtered Photos
  const filteredPhotos = useMemo(() => {
    let list = STOCK_PHOTOS;
    if (photoCategory !== "all") {
      list = list.filter((p) => p.category === photoCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [photoCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6" onClick={onClose} dir={isAr ? "rtl" : "ltr"}>
      <div
        className="w-full max-w-7xl h-[92vh] flex overflow-hidden rounded-2xl bg-[#090d16] border border-slate-800 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Left Sidebar Navigation (Matching Image 4) ── */}
        <aside className="w-56 bg-[#0d1322] border-e border-slate-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0">
          <div className="space-y-4">
            {/* Brand Logo */}
            <div className="px-3 py-2 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black tracking-wide text-white">ImagePro <span className="text-blue-400">Studio</span></div>
                <div className="text-[10px] text-slate-500">Creative Platform</div>
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1">
              {[
                { id: "backdrops", labelAr: "الخلفيات", labelEn: "Backdrops", icon: <Palette className="w-4 h-4" />, count: CREATIVE_BACKDROPS.length },
                { id: "templates", labelAr: "القوالب", labelEn: "Templates", icon: <LayoutTemplate className="w-4 h-4" />, count: EDITABLE_TEMPLATES.length },
                { id: "assets", labelAr: "العناصر", labelEn: "Elements", icon: <Shapes className="w-4 h-4" />, count: ASSET_GRAPHICS.length },
                { id: "photos", labelAr: "الصور", labelEn: "Photos", icon: <Camera className="w-4 h-4" />, count: STOCK_PHOTOS.length },
                { id: "projects", labelAr: "مشاريعي", labelEn: "My Projects", icon: <Folder className="w-4 h-4" />, count: projects.length },
                { id: "favorites", labelAr: "المفضلة", labelEn: "Favorites", icon: <Star className="w-4 h-4" />, count: favoriteIds.size },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as any);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#131b2e]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile info matching Image 4 */}
          <div className="pt-3 border-t border-slate-800/60 px-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                👤
              </div>
              <span className="text-xs text-slate-300 font-medium">سليمان العربي</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ── 2. Main Content Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
          {/* Top Search & Filter Bar */}
          <header className="px-6 py-4 border-b border-slate-800/80 bg-[#0d1322]/90 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSection === "backdrops"
                    ? (isAr ? "ابحث في الخلفيات (رخام، استوديو، خشب، نيون، طبيعة)..." : "Search backdrops...")
                    : activeSection === "templates"
                    ? (isAr ? "ابحث في القوالب (سوشيال، بوستر، سيرة، عرض)..." : "Search templates...")
                    : activeSection === "assets"
                    ? (isAr ? "ابحث في العناصر والأشكال..." : "Search elements...")
                    : (isAr ? "ابحث في الصور..." : "Search photos...")
                }
                className="w-full h-10 pr-10 pl-4 rounded-xl bg-[#131b2e] border border-slate-700/60 text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                {activeSection === "backdrops" && `${filteredBackdrops.length} ${isAr ? "خلفية متاحة" : "backdrops"}`}
                {activeSection === "templates" && `${filteredTemplates.length} ${isAr ? "قالب متاح" : "templates"}`}
                {activeSection === "assets" && `${filteredAssets.length} ${isAr ? "عنصر متاح" : "elements"}`}
                {activeSection === "photos" && `${filteredPhotos.length} ${isAr ? "صورة متاحة" : "photos"}`}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[#131b2e] hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Category Filter Pills (Matching Image 4 Middle Panels) */}
          <div className="px-6 py-2.5 border-b border-slate-800/60 bg-[#0d1322]/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {activeSection === "backdrops" && (
              <>
                {[
                  { id: "all", nameAr: "الكل" },
                  { id: "nature", nameAr: "طبيعة وجبال" },
                  { id: "marble", nameAr: "رخام فاخر" },
                  { id: "studio", nameAr: "استوديو تصوير" },
                  { id: "wood", nameAr: "خشب ومقاهي" },
                  { id: "cyberpunk", nameAr: "فضاء ونيون" },
                  { id: "ocean", nameAr: "ماء ومحيط" },
                  { id: "abstract", nameAr: "تجريدي وعمارة" },
                  { id: "luxury", nameAr: "فخامة وأوبسيديان" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setBgCategory(cat.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      bgCategory === cat.id
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold"
                        : "bg-[#131b2e] text-slate-400 hover:text-slate-200 border border-slate-700/50"
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </>
            )}

            {activeSection === "templates" && (
              <>
                {[
                  { id: "all", nameAr: "الكل" },
                  { id: "social", nameAr: "سوشيال ميديا" },
                  { id: "business", nameAr: "أعمال وشركات" },
                  { id: "marketing", nameAr: "تسويق وعروض" },
                  { id: "education", nameAr: "تعليم وشهادات" },
                  { id: "posters", nameAr: "ملصقات وفن" },
                  { id: "invitations", nameAr: "دعوات ومناسبات" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTplCategory(cat.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      tplCategory === cat.id
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold"
                        : "bg-[#131b2e] text-slate-400 hover:text-slate-200 border border-slate-700/50"
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </>
            )}

            {activeSection === "assets" && (
              <>
                {[
                  { id: "all", nameAr: "الكل" },
                  { id: "badges", nameAr: "شارات وأختام" },
                  { id: "geometric", nameAr: "أشكال هندسية" },
                  { id: "arrows", nameAr: "أسهم ومؤشرات" },
                  { id: "frames", nameAr: "إطارات ملكية" },
                  { id: "social-icons", nameAr: "أيقونات تواصل" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAssetCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      assetCategory === cat.id
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold"
                        : "bg-[#131b2e] text-slate-400 hover:text-slate-200 border border-slate-700/50"
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </>
            )}

            {activeSection === "photos" && (
              <>
                {[
                  { id: "all", nameAr: "جميع الصور" },
                  { id: "nature", nameAr: "طبيعة ومناظر" },
                  { id: "business", nameAr: "أعمال ومكاتب" },
                  { id: "lifestyle", nameAr: "لايف ستايل" },
                  { id: "food", nameAr: "مأكولات ومقاهي" },
                  { id: "architecture", nameAr: "عمارة ومدن" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPhotoCategory(cat.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      photoCategory === cat.id
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold"
                        : "bg-[#131b2e] text-slate-400 hover:text-slate-200 border border-slate-700/50"
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* ── 3. Main Grid of Cards (4 Columns Matching Image 4) ── */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Backdrops Grid (Panel 5 in Image 4) ── */}
            {activeSection === "backdrops" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBackdrops.map((bg) => {
                  const isFav = favoriteIds.has(bg.id);
                  return (
                    <div
                      key={bg.id}
                      className="group relative flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                        <LiveThumbCanvas renderFn={bg.render} width={1600} height={900} />
                        
                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                          <button
                            onClick={() => {
                              onApplyBackground(bg);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-transform active:scale-95"
                          >
                            {isAr ? "تطبيق فوري" : "Apply"}
                          </button>
                          <button
                            onClick={() =>
                              setPreviewItem({
                                type: "backdrop",
                                title: isAr ? bg.nameAr : bg.nameEn,
                                dims: "1920 × 1080",
                                renderFn: bg.render,
                                onApply: () => {
                                  onApplyBackground(bg);
                                  onClose();
                                }
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                            title="معاينة كاملة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(bg.id, e)}
                          className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                            isFav ? "bg-amber-500 text-white" : "bg-black/40 text-slate-400 hover:text-amber-400"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      <div className="p-3">
                        <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {isAr ? bg.nameAr : bg.nameEn}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="capitalize">{bg.category}</span>
                          <span className="font-mono">1920×1080</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Templates Grid (Panel 4 in Image 4) ── */}
            {activeSection === "templates" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTemplates.map((tpl) => {
                  const isFav = favoriteIds.has(tpl.id);
                  return (
                    <div
                      key={tpl.id}
                      className="group relative flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                        <LiveThumbCanvas renderFn={tpl.renderPreview} width={tpl.width} height={tpl.height} />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                          <button
                            onClick={() => {
                              onApplyTemplate(tpl);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-transform active:scale-95"
                          >
                            {isAr ? "استخدام القالب" : "Use Template"}
                          </button>
                          <button
                            onClick={() =>
                              setPreviewItem({
                                type: "template",
                                title: isAr ? tpl.nameAr : tpl.nameEn,
                                dims: `${tpl.width} × ${tpl.height}`,
                                renderFn: tpl.renderPreview,
                                onApply: () => {
                                  onApplyTemplate(tpl);
                                  onClose();
                                }
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                            title="معاينة كاملة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(tpl.id, e)}
                          className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                            isFav ? "bg-amber-500 text-white" : "bg-black/40 text-slate-400 hover:text-amber-400"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      <div className="p-3">
                        <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {isAr ? tpl.nameAr : tpl.nameEn}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="capitalize">{tpl.category}</span>
                          <span className="font-mono">{tpl.width}×{tpl.height}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Elements / Assets Grid (Panel 6 in Image 4) ── */}
            {activeSection === "assets" && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onAddAssetLayer(asset);
                      onClose();
                    }}
                    className="group flex flex-col items-center justify-center p-4 rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 transition-all hover:-translate-y-1 text-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-950/80 flex items-center justify-center overflow-hidden mb-2 group-hover:scale-110 transition-transform">
                      <canvas
                        ref={(canv) => {
                          if (!canv) return;
                          const ctx = canv.getContext("2d");
                          if (!ctx) return;
                          canv.width = 64;
                          canv.height = 64;
                          ctx.clearRect(0, 0, 64, 64);
                          asset.render(ctx, 64);
                        }}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400 line-clamp-1">
                      {isAr ? asset.nameAr : asset.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Stock Photos Grid ── */}
            {activeSection === "photos" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden transition-all hover:-translate-y-1"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                      <LiveThumbCanvas renderFn={photo.render} width={photo.width} height={photo.height} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                        <button
                          onClick={() => {
                            if (onApplyStockPhoto) onApplyStockPhoto(photo, false);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold"
                        >
                          {isAr ? "تعيين كخلفية" : "As Background"}
                        </button>
                        <button
                          onClick={() => {
                            if (onApplyStockPhoto) onApplyStockPhoto(photo, true);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs"
                        >
                          {isAr ? "كطبقة" : "As Layer"}
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-slate-100 line-clamp-1">
                        {isAr ? photo.nameAr : photo.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {photo.width}×{photo.height}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Projects Grid (Panel 7 in Image 4) ── */}
            {activeSection === "projects" && (
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <Folder className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">{isAr ? "لا توجد مشاريع محفوظة بعد" : "No saved projects yet"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => {
                          onOpenProject(String(proj.id));
                          onClose();
                        }}
                        className="group flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                          {proj.thumbnail ? (
                            <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-600" />
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-slate-100 line-clamp-1">{proj.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {proj.width}×{proj.height} px
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Favorites Grid ── */}
            {activeSection === "favorites" && (
              <div className="space-y-4">
                {favoriteIds.size === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <Star className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">{isAr ? "لم تقم بإضافة عناصر إلى المفضلة بعد" : "No favorites added yet"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {CREATIVE_BACKDROPS.filter((b) => favoriteIds.has(b.id)).map((bg) => (
                      <div
                        key={bg.id}
                        onClick={() => {
                          onApplyBackground(bg);
                          onClose();
                        }}
                        className="group relative flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="aspect-video w-full bg-slate-950 flex items-center justify-center">
                          <LiveThumbCanvas renderFn={bg.render} width={1600} height={900} />
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400 line-clamp-1">
                            {isAr ? bg.nameAr : bg.nameEn}
                          </div>
                        </div>
                      </div>
                    ))}
                    {EDITABLE_TEMPLATES.filter((t) => favoriteIds.has(t.id)).map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          onApplyTemplate(tpl);
                          onClose();
                        }}
                        className="group relative flex flex-col rounded-xl bg-[#131b2e] hover:bg-[#17223b] border border-slate-700/60 hover:border-blue-500 overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="aspect-video w-full bg-slate-950 flex items-center justify-center">
                          <LiveThumbCanvas renderFn={tpl.renderPreview} width={tpl.width} height={tpl.height} />
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400 line-clamp-1">
                            {isAr ? tpl.nameAr : tpl.nameEn}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── 4. Dedicated Full Preview Modal ── */}
      {previewItem && (
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-2xl bg-[#0d1322] border border-slate-700 text-white rounded-2xl p-6" dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>{previewItem.title}</span>
                <Badge variant="outline" className="font-mono text-xs text-blue-400 border-blue-400/40">
                  {previewItem.dims}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center mb-5">
              {previewItem.renderFn && (
                <LiveThumbCanvas renderFn={previewItem.renderFn} width={1600} height={900} />
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
              <button
                onClick={() => {
                  previewItem.onApply();
                  setPreviewItem(null);
                }}
                className="px-6 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-500/25"
              >
                {isAr ? "تطبيق على مساحة العمل" : "Apply to Canvas"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CreativeLibraryModal;
