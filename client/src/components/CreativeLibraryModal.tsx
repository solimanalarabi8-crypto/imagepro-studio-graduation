import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Palette,
  LayoutTemplate,
  FolderKanban,
  Shapes,
  Star,
  Clock,
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
  Move
} from "lucide-react";
import {
  CREATIVE_BACKDROPS,
  CREATIVE_BACKDROP_CATEGORIES,
  CreativeBackdropPreset,
  BackdropCategory,
  EXPANDED_BACKDROP_THEMES
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
  const [activeMainTab, setActiveMainTab] = useState<
    "backgrounds" | "templates" | "assets" | "stockPhotos" | "projects" | "favorites"
  >("backgrounds");
  const [bgCategory, setBgCategory] = useState<BackdropCategory | "all">("all");
  const [tplCategory, setTplCategory] = useState<TemplateCategory | "all">("all");
  const [assetCategory, setAssetCategory] = useState<string>("all");
  const [stockCategory, setStockCategory] = useState<StockPhotoCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBg, setSelectedBg] = useState<CreativeBackdropPreset>(CREATIVE_BACKDROPS[0]);
  const [selectedTpl, setSelectedTpl] = useState<EditableTemplate>(EDITABLE_TEMPLATES[0]);
  const [selectedStock, setSelectedStock] = useState<StockPhotoItem>(STOCK_PHOTOS[0]);
  
  // Local storage persisted favorites
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("imagepro_library_favorites");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(["prod-marble-podium", "insta-sale-bold", "stock-studio-pedestal", "shape-gold-star"]);
  });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isAr = lang === "ar";

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("imagepro_library_favorites", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Filtered Backgrounds
  const filteredBackgrounds = useMemo(() => {
    let list = CREATIVE_BACKDROPS;
    if (bgCategory !== "all") list = list.filter((b) => b.category === bgCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [bgCategory, searchQuery]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (tplCategory !== "all") list = list.filter((t) => t.category === tplCategory);
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

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = ASSET_GRAPHICS;
    if (assetCategory !== "all") list = list.filter((a) => a.category === assetCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.nameAr.toLowerCase().includes(q) ||
          a.nameEn.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [assetCategory, searchQuery]);

  // Filtered Stock Photos
  const filteredStockPhotos = useMemo(() => {
    let list = STOCK_PHOTOS;
    if (stockCategory !== "all") list = list.filter((p) => p.category === stockCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [stockCategory, searchQuery]);

  // Live Canvas Rendering for Preview Pane
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeMainTab === "backgrounds") {
      selectedBg.render(ctx, canvas.width, canvas.height);
    } else if (activeMainTab === "templates") {
      selectedTpl.renderPreview(ctx, canvas.width, canvas.height);
    } else if (activeMainTab === "stockPhotos") {
      selectedStock.render(ctx, canvas.width, canvas.height);
    }
  }, [isOpen, activeMainTab, selectedBg, selectedTpl, selectedStock]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window creative-hub-modal"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {isAr ? "المكتبة الإبداعية الشاملة (Creative Platform)" : "Creative Studio Library"}
                <span className="text-[10px] font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {isAr ? "قوالب • خلفيات • أصول • صور مرخصة" : "Templates • Backgrounds • Assets • Photos"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "مكتبة متكاملة جاهزة للتعديل: اسحب وأفلت في مساحة العمل أو اختر لتطبيق فوري"
                  : "All-in-one design assets: drag & drop onto canvas or click to apply instantly"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Navigation Tabs */}
        <div className="creative-nav-bar">
          <div className="creative-tabs-row">
            <button
              className={`creative-tab-pill ${activeMainTab === "backgrounds" ? "active" : ""}`}
              onClick={() => setActiveMainTab("backgrounds")}
            >
              <Palette size={13} />
              <span>{isAr ? "خلفيات الاستوديو" : "Backdrops"}</span>
              <span className="tab-count">{CREATIVE_BACKDROPS.length}</span>
            </button>

            <button
              className={`creative-tab-pill ${activeMainTab === "templates" ? "active" : ""}`}
              onClick={() => setActiveMainTab("templates")}
            >
              <LayoutTemplate size={13} />
              <span>{isAr ? "قوالب حية قابلة للتعديل" : "Live Templates"}</span>
              <span className="tab-count">{EDITABLE_TEMPLATES.length}</span>
            </button>

            <button
              className={`creative-tab-pill ${activeMainTab === "assets" ? "active" : ""}`}
              onClick={() => setActiveMainTab("assets")}
            >
              <Shapes size={13} />
              <span>{isAr ? "أصول وعناصر و3D" : "Creative Assets"}</span>
              <span className="tab-count">{ASSET_GRAPHICS.length}</span>
            </button>

            <button
              className={`creative-tab-pill ${activeMainTab === "stockPhotos" ? "active" : ""}`}
              onClick={() => setActiveMainTab("stockPhotos")}
            >
              <Camera size={13} />
              <span>{isAr ? "صور فوتوغرافية مرخصة" : "Stock Photos"}</span>
              <span className="tab-count">{STOCK_PHOTOS.length}</span>
            </button>

            <button
              className={`creative-tab-pill ${activeMainTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveMainTab("favorites")}
            >
              <Star size={13} className={favoriteIds.size > 0 ? "text-amber-400 fill-amber-400" : ""} />
              <span>{isAr ? "المفضلة" : "Favorites"}</span>
              <span className="tab-count">{favoriteIds.size}</span>
            </button>
          </div>

          <div className="creative-search-box">
            <Search size={13} className="text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? "بحث بالاسم أو الوسوم..." : "Search assets, tags..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="creative-search-input"
            />
          </div>
        </div>

        {/* Subcategories Filter Chips */}
        <div className="creative-subcategories-bar">
          {activeMainTab === "backgrounds" && (
            <div className="chips-scroller">
              {CREATIVE_BACKDROP_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`category-chip ${bgCategory === c.id ? "active" : ""}`}
                  onClick={() => setBgCategory(c.id as any)}
                >
                  <span>{c.icon}</span>
                  <span>{isAr ? c.nameAr : c.nameEn}</span>
                </button>
              ))}
            </div>
          )}

          {activeMainTab === "templates" && (
            <div className="chips-scroller">
              {TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`category-chip ${tplCategory === c.id ? "active" : ""}`}
                  onClick={() => setTplCategory(c.id as any)}
                >
                  <span>{c.icon}</span>
                  <span>{isAr ? c.nameAr : c.nameEn}</span>
                </button>
              ))}
            </div>
          )}

          {activeMainTab === "assets" && (
            <div className="chips-scroller">
              {ASSET_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`category-chip ${assetCategory === c.id ? "active" : ""}`}
                  onClick={() => setAssetCategory(c.id)}
                >
                  <span>{c.icon}</span>
                  <span>{isAr ? c.nameAr : c.nameEn}</span>
                </button>
              ))}
            </div>
          )}

          {activeMainTab === "stockPhotos" && (
            <div className="chips-scroller">
              {STOCK_PHOTO_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`category-chip ${stockCategory === c.id ? "active" : ""}`}
                  onClick={() => setStockCategory(c.id)}
                >
                  <span>{c.icon}</span>
                  <span>{isAr ? c.nameAr : c.nameEn}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Work Area: Catalog Grid + Live Inspector Preview Pane */}
        <div className="creative-body-split">
          {/* Left / Center Grid */}
          <div className="creative-grid-scroll">
            {/* 1. Backgrounds */}
            {activeMainTab === "backgrounds" && (
              <div className="creative-cards-grid">
                {filteredBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={`creative-card ${selectedBg.id === bg.id ? "selected" : ""}`}
                    onClick={() => setSelectedBg(bg)}
                  >
                    <div className="card-thumb-canvas-box" style={{ background: bg.accentColor }}>
                      <button
                        className={`card-fav-btn ${favoriteIds.has(bg.id) ? "is-fav" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(bg.id);
                        }}
                      >
                        <Star size={12} />
                      </button>
                    </div>
                    <div className="card-meta">
                      <span className="card-title">{isAr ? bg.nameAr : bg.nameEn}</span>
                      <div className="card-tags">
                        {bg.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="tag-pill">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Templates */}
            {activeMainTab === "templates" && (
              <div className="creative-cards-grid">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`creative-card ${selectedTpl.id === tpl.id ? "selected" : ""}`}
                    onClick={() => setSelectedTpl(tpl)}
                  >
                    <div className="card-thumb-tpl-box">
                      <span className="aspect-badge">{tpl.aspect}</span>
                      <button
                        className={`card-fav-btn ${favoriteIds.has(tpl.id) ? "is-fav" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tpl.id);
                        }}
                      >
                        <Star size={12} />
                      </button>
                      <div className="card-tpl-mini">
                        <span style={{ fontSize: "11px", fontWeight: "bold" }}>{tpl.width}×{tpl.height}</span>
                      </div>
                    </div>
                    <div className="card-meta">
                      <span className="card-title">{isAr ? tpl.nameAr : tpl.nameEn}</span>
                      <div className="card-tags">
                        <span className="tag-pill">{tpl.layers.length} {isAr ? "طبقات حية" : "layers"}</span>
                        {tpl.tags.slice(0, 1).map((t, idx) => (
                          <span key={idx} className="tag-pill">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Assets */}
            {activeMainTab === "assets" && (
              <div className="creative-assets-grid">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="asset-cell"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({
                        type: "asset",
                        assetId: asset.id
                      }));
                    }}
                    onClick={() => {
                      onAddAssetLayer(asset);
                      onClose();
                    }}
                    title={isAr ? "انقر للإضافة أو اسحب إلى مساحة العمل" : "Click to add or drag to canvas"}
                  >
                    <button
                      className={`card-fav-btn-mini ${favoriteIds.has(asset.id) ? "is-fav" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id);
                      }}
                    >
                      <Star size={10} />
                    </button>
                    <div className="asset-canvas-preview">
                      <Shapes size={28} className="text-teal-400" />
                    </div>
                    <span className="asset-label">{isAr ? asset.nameAr : asset.nameEn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Stock Photos */}
            {activeMainTab === "stockPhotos" && (
              <div className="creative-cards-grid">
                {filteredStockPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`creative-card ${selectedStock.id === photo.id ? "selected" : ""}`}
                    onClick={() => setSelectedStock(photo)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({
                        type: "stock-photo",
                        photoId: photo.id
                      }));
                    }}
                  >
                    <div className="card-thumb-canvas-box" style={{ background: photo.dominantColor }}>
                      <span className="aspect-badge">{photo.aspect}</span>
                      <button
                        className={`card-fav-btn ${favoriteIds.has(photo.id) ? "is-fav" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id);
                        }}
                      >
                        <Star size={12} />
                      </button>
                      <div className="card-tpl-mini">
                        <ImageIcon size={20} className="text-white/70" />
                      </div>
                    </div>
                    <div className="card-meta">
                      <span className="card-title">{isAr ? photo.nameAr : photo.nameEn}</span>
                      <div className="card-tags">
                        <span className="tag-pill">{photo.width}×{photo.height}</span>
                        {photo.tags.slice(0, 1).map((t, idx) => (
                          <span key={idx} className="tag-pill">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Favorites View */}
            {activeMainTab === "favorites" && (
              <div className="favorites-collection">
                <div className="fav-section-title">
                  <span>{isAr ? "العناصر المحفوظة في المفضلة" : "Favorite Items"} ({favoriteIds.size})</span>
                </div>
                <div className="creative-cards-grid">
                  {CREATIVE_BACKDROPS.filter((b) => favoriteIds.has(b.id)).map((bg) => (
                    <div
                      key={bg.id}
                      className="creative-card selected"
                      onClick={() => {
                        onApplyBackground(bg);
                        onClose();
                      }}
                    >
                      <div className="card-thumb-canvas-box" style={{ background: bg.accentColor }}>
                        <span className="tag-pill" style={{ position: "absolute", top: 6, left: 6 }}>خلفية</span>
                      </div>
                      <div className="card-meta">
                        <span className="card-title">{isAr ? bg.nameAr : bg.nameEn}</span>
                      </div>
                    </div>
                  ))}

                  {EDITABLE_TEMPLATES.filter((t) => favoriteIds.has(t.id)).map((tpl) => (
                    <div
                      key={tpl.id}
                      className="creative-card selected"
                      onClick={() => {
                        onApplyTemplate(tpl);
                        onClose();
                      }}
                    >
                      <div className="card-thumb-tpl-box">
                        <span className="tag-pill" style={{ position: "absolute", top: 6, left: 6 }}>قالب حي</span>
                      </div>
                      <div className="card-meta">
                        <span className="card-title">{isAr ? tpl.nameAr : tpl.nameEn}</span>
                      </div>
                    </div>
                  ))}

                  {STOCK_PHOTOS.filter((p) => favoriteIds.has(p.id)).map((photo) => (
                    <div
                      key={photo.id}
                      className="creative-card selected"
                      onClick={() => {
                        if (onApplyStockPhoto) onApplyStockPhoto(photo, false);
                        onClose();
                      }}
                    >
                      <div className="card-thumb-canvas-box" style={{ background: photo.dominantColor }}>
                        <span className="tag-pill" style={{ position: "absolute", top: 6, left: 6 }}>صورة</span>
                      </div>
                      <div className="card-meta">
                        <span className="card-title">{isAr ? photo.nameAr : photo.nameEn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Inspector & Live Canvas Preview Box */}
          <div className="creative-inspector-pane">
            <div className="inspector-head">
              <span className="inspector-sub">
                {activeMainTab === "backgrounds"
                  ? isAr ? "معاينة خلفية الاستوديو" : "Backdrop Preview"
                  : activeMainTab === "templates"
                  ? isAr ? "معاينة طبقات القالب" : "Template Preview"
                  : activeMainTab === "stockPhotos"
                  ? isAr ? "معاينة الصورة الفوتوغرافية" : "Stock Photo Preview"
                  : isAr ? "معاينة العنصر" : "Asset Details"}
              </span>
              <h4 className="inspector-title">
                {activeMainTab === "backgrounds"
                  ? isAr ? selectedBg.nameAr : selectedBg.nameEn
                  : activeMainTab === "templates"
                  ? isAr ? selectedTpl.nameAr : selectedTpl.nameEn
                  : activeMainTab === "stockPhotos"
                  ? isAr ? selectedStock.nameAr : selectedStock.nameEn
                  : isAr ? "أصل رسومي قابل للتخصيص" : "Vector Element"}
              </h4>
            </div>

            {/* High-definition Live Canvas Preview */}
            <div className="inspector-canvas-container">
              <canvas
                ref={previewCanvasRef}
                width={360}
                height={260}
                className="inspector-preview-canvas"
              />
            </div>

            {/* Actions Toolbar */}
            <div className="inspector-actions">
              {activeMainTab === "backgrounds" && (
                <button
                  className="inspector-btn-primary"
                  onClick={() => {
                    onApplyBackground(selectedBg);
                    onClose();
                  }}
                >
                  <Palette size={14} />
                  <span>{isAr ? "تطبيق هذه الخلفية على التصميم" : "Apply as Backdrop"}</span>
                </button>
              )}

              {activeMainTab === "templates" && (
                <button
                  className="inspector-btn-primary"
                  onClick={() => {
                    onApplyTemplate(selectedTpl);
                    onClose();
                  }}
                >
                  <LayoutTemplate size={14} />
                  <span>{isAr ? "فتح القالب وبدء التعديل الحي" : "Open & Edit Live Template"}</span>
                </button>
              )}

              {activeMainTab === "stockPhotos" && (
                <div className="space-y-2 w-full">
                  <button
                    className="inspector-btn-primary w-full"
                    onClick={() => {
                      if (onApplyStockPhoto) onApplyStockPhoto(selectedStock, false);
                      onClose();
                    }}
                  >
                    <ImageIcon size={14} />
                    <span>{isAr ? "تعيين كخلفية للكانفاس" : "Set as Canvas Background"}</span>
                  </button>

                  <button
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                    onClick={() => {
                      if (onApplyStockPhoto) onApplyStockPhoto(selectedStock, true);
                      onClose();
                    }}
                  >
                    <Layers size={14} className="text-teal-400" />
                    <span>{isAr ? "إضافة كطبقة جديدة فوق التصميم" : "Add as New Layer"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
