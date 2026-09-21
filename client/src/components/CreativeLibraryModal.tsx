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
  Layers
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
import { StoredProjectMetadata } from "@/lib/autosave-manager";

interface CreativeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackground: (preset: CreativeBackdropPreset) => void;
  onApplyTemplate: (template: EditableTemplate) => void;
  onAddAssetLayer: (asset: AssetGraphicItem) => void;
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
  onOpenProject,
  projects,
  lang = "ar"
}) => {
  const [activeMainTab, setActiveMainTab] = useState<"backgrounds" | "templates" | "assets" | "projects" | "favorites">("backgrounds");
  const [bgCategory, setBgCategory] = useState<BackdropCategory | "all">("all");
  const [tplCategory, setTplCategory] = useState<TemplateCategory | "all">("all");
  const [assetCategory, setAssetCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBg, setSelectedBg] = useState<CreativeBackdropPreset>(CREATIVE_BACKDROPS[0]);
  const [selectedTpl, setSelectedTpl] = useState<EditableTemplate>(EDITABLE_TEMPLATES[0]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(["prod-marble-podium", "insta-sale-bold"]));

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isAr = lang === "ar";

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Backgrounds
  const filteredBackgrounds = useMemo(() => {
    let list = CREATIVE_BACKDROPS;
    if (bgCategory !== "all") list = list.filter((b) => b.category === bgCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.nameAr.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q)));
    }
    return list;
  }, [bgCategory, searchQuery]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    let list = EDITABLE_TEMPLATES;
    if (tplCategory !== "all") list = list.filter((t) => t.category === tplCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => t.nameAr.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q)));
    }
    return list;
  }, [tplCategory, searchQuery]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = ASSET_GRAPHICS;
    if (assetCategory !== "all") list = list.filter((a) => a.category === assetCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => a.nameAr.toLowerCase().includes(q) || a.nameEn.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q)));
    }
    return list;
  }, [assetCategory, searchQuery]);

  // Live Canvas Rendering for Preview Pane
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeMainTab === "backgrounds" && selectedBg) {
      selectedBg.render(ctx, canvas.width, canvas.height);
    } else if (activeMainTab === "templates" && selectedTpl) {
      selectedTpl.renderPreview(ctx, canvas.width, canvas.height);
    }
  }, [isOpen, activeMainTab, selectedBg, selectedTpl]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window creative-library-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {isAr ? "المكتبة الإبداعية الشاملة (Creative Library)" : "Creative Library Hub"}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  PRO STUDIO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "خلفيات استوديو عالية الدقة، قوالب قابلة للتعديل، أصول بصرية، ومشاريعك المحفوظة" : "High-resolution studio backdrops, editable templates, visual assets & projects"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="cl-search-box">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? "ابحث في الخلفيات والقوالب..." : "Search assets & templates..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cl-search-input"
              />
            </div>
            <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="cl-nav-bar">
          <button
            type="button"
            className={`cl-nav-pill ${activeMainTab === "backgrounds" ? "active" : ""}`}
            onClick={() => setActiveMainTab("backgrounds")}
          >
            <Palette size={14} />
            <span>{isAr ? "مكتبة الخلفيات (Backdrops)" : "Backdrops"}</span>
            <span className="cl-count">{CREATIVE_BACKDROPS.length}</span>
          </button>
          <button
            type="button"
            className={`cl-nav-pill ${activeMainTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveMainTab("templates")}
          >
            <LayoutTemplate size={14} />
            <span>{isAr ? "قوالب قابلة للتعديل (Templates)" : "Editable Templates"}</span>
            <span className="cl-count">{EDITABLE_TEMPLATES.length}</span>
          </button>
          <button
            type="button"
            className={`cl-nav-pill ${activeMainTab === "assets" ? "active" : ""}`}
            onClick={() => setActiveMainTab("assets")}
          >
            <Shapes size={14} />
            <span>{isAr ? "الأصول والعناصر (Assets)" : "Assets & Shapes"}</span>
            <span className="cl-count">{ASSET_GRAPHICS.length}</span>
          </button>
          <button
            type="button"
            className={`cl-nav-pill ${activeMainTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveMainTab("projects")}
          >
            <FolderKanban size={14} />
            <span>{isAr ? "المشاريع (Projects)" : "Projects"}</span>
            <span className="cl-count">{projects.filter((p) => !p.isTrash).length}</span>
          </button>
          <button
            type="button"
            className={`cl-nav-pill ${activeMainTab === "favorites" ? "active" : ""}`}
            onClick={() => setActiveMainTab("favorites")}
          >
            <Star size={14} />
            <span>{isAr ? "المفضلة" : "Favorites"}</span>
            <span className="cl-count">{favoriteIds.size}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="cl-body-grid">
          {/* Left / Center: Items Grid & Sub-Categories */}
          <div className="cl-items-section">
            {/* 1. Backgrounds View */}
            {activeMainTab === "backgrounds" && (
              <>
                <div className="cl-subcats-scroll">
                  {CREATIVE_BACKDROP_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cl-subcat-chip ${bgCategory === cat.id ? "active" : ""}`}
                      onClick={() => setBgCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  ))}
                </div>

                <div className="cl-cards-flow">
                  {filteredBackgrounds.map((bg) => {
                    const isSelected = selectedBg?.id === bg.id;
                    const isFav = favoriteIds.has(bg.id);
                    return (
                      <div
                        key={bg.id}
                        className={`cl-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedBg(bg)}
                      >
                        <div className="cl-card-preview" style={{ background: bg.accentColor }}>
                          <span className="cl-accent-dot" style={{ background: bg.accentColor }} />
                          <button
                            type="button"
                            className={`cl-fav-btn ${isFav ? "is-fav" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(bg.id);
                            }}
                          >
                            <Star size={13} />
                          </button>
                        </div>
                        <div className="cl-card-info">
                          <span className="cl-card-name">{isAr ? bg.nameAr : bg.nameEn}</span>
                          <span className="cl-card-tag">{bg.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 2. Templates View */}
            {activeMainTab === "templates" && (
              <>
                <div className="cl-subcats-scroll">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cl-subcat-chip ${tplCategory === cat.id ? "active" : ""}`}
                      onClick={() => setTplCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  ))}
                </div>

                <div className="cl-cards-flow">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = selectedTpl?.id === tpl.id;
                    const isFav = favoriteIds.has(tpl.id);
                    return (
                      <div
                        key={tpl.id}
                        className={`cl-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedTpl(tpl)}
                      >
                        <div className="cl-card-preview bg-slate-800">
                          <span className="cl-aspect-badge">{tpl.aspect}</span>
                          <button
                            type="button"
                            className={`cl-fav-btn ${isFav ? "is-fav" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(tpl.id);
                            }}
                          >
                            <Star size={13} />
                          </button>
                        </div>
                        <div className="cl-card-info">
                          <span className="cl-card-name">{isAr ? tpl.nameAr : tpl.nameEn}</span>
                          <span className="cl-card-tag">{tpl.width}×{tpl.height}px ({tpl.layers.length} {isAr ? "طبقات" : "layers"})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 3. Assets View */}
            {activeMainTab === "assets" && (
              <>
                <div className="cl-subcats-scroll">
                  {ASSET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cl-subcat-chip ${assetCategory === cat.id ? "active" : ""}`}
                      onClick={() => setAssetCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  ))}
                </div>

                <div className="cl-assets-flow">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="cl-asset-box"
                      onClick={() => {
                        onAddAssetLayer(asset);
                        onClose();
                      }}
                      title={isAr ? "انقر لإضافة العنصر كطبقة جديدة للكانفاس" : "Click to add as layer to canvas"}
                    >
                      <div className="cl-asset-thumb">
                        <Shapes size={28} className="text-teal-400" />
                      </div>
                      <span className="cl-asset-name">{isAr ? asset.nameAr : asset.nameEn}</span>
                      <span className="cl-asset-add-hint"><Plus size={11} /> {isAr ? "إضافة للكانفاس" : "Add to canvas"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 4. Projects View */}
            {activeMainTab === "projects" && (
              <div className="cl-cards-flow">
                {projects.filter((p) => !p.isTrash).map((p) => (
                  <div
                    key={p.id}
                    className="cl-card"
                    onClick={() => {
                      onOpenProject(p.id);
                      onClose();
                    }}
                  >
                    <div className="cl-card-preview bg-slate-800 flex items-center justify-center">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderKanban size={32} className="text-teal-400/40" />
                      )}
                    </div>
                    <div className="cl-card-info">
                      <span className="cl-card-name">{p.name}</span>
                      <span className="cl-card-tag">{p.width}×{p.height}px</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Favorites View */}
            {activeMainTab === "favorites" && (
              <div className="cl-cards-flow">
                {CREATIVE_BACKDROPS.filter((b) => favoriteIds.has(b.id)).map((bg) => (
                  <div
                    key={bg.id}
                    className={`cl-card ${selectedBg?.id === bg.id ? "selected" : ""}`}
                    onClick={() => {
                      setActiveMainTab("backgrounds");
                      setSelectedBg(bg);
                    }}
                  >
                    <div className="cl-card-preview" style={{ background: bg.accentColor }}>
                      <Star size={14} className="text-amber-400 fill-amber-400 absolute top-2 right-2" />
                    </div>
                    <div className="cl-card-info">
                      <span className="cl-card-name">{isAr ? bg.nameAr : bg.nameEn}</span>
                      <span className="cl-card-tag">{bg.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Live Interactive Preview & Application Pane */}
          <div className="cl-preview-pane">
            <div className="cl-live-box">
              <canvas
                ref={previewCanvasRef}
                width={360}
                height={360}
                className="cl-preview-canvas"
              />
              <span className="cl-live-badge"><Eye size={12} /> {isAr ? "معاينة حية دقيقة" : "Live Preview"}</span>
            </div>

            {activeMainTab === "backgrounds" && selectedBg && (
              <div className="cl-pane-details">
                <div className="cl-pane-title">{isAr ? selectedBg.nameAr : selectedBg.nameEn}</div>
                <div className="cl-pane-tags">
                  {selectedBg.tags.map((t) => (
                    <span key={t} className="cl-tag-pill">#{t}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="cl-apply-btn"
                  onClick={() => {
                    onApplyBackground(selectedBg);
                    onClose();
                  }}
                >
                  <Check size={16} />
                  <span>{isAr ? "تطبيق هذه الخلفية على المشروع" : "Apply Backdrop to Project"}</span>
                </button>
              </div>
            )}

            {activeMainTab === "templates" && selectedTpl && (
              <div className="cl-pane-details">
                <div className="cl-pane-title">{isAr ? selectedTpl.nameAr : selectedTpl.nameEn}</div>
                <div className="cl-pane-meta">
                  <span>الأبعاد: {selectedTpl.width} × {selectedTpl.height} px</span>
                  <span>النسبة: {selectedTpl.aspect}</span>
                </div>
                <div className="cl-layers-list-mini">
                  <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Layers size={12} className="text-teal-400" />
                    <span>{isAr ? "الطبقات القابلة للتحرير:" : "Editable Layers:"}</span>
                  </div>
                  {selectedTpl.layers.map((layer) => (
                    <div key={layer.id} className="cl-mini-layer">
                      <span className="cl-mini-layer-kind">{layer.kind}</span>
                      <span className="cl-mini-layer-name">{layer.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="cl-apply-btn"
                  onClick={() => {
                    onApplyTemplate(selectedTpl);
                    onClose();
                  }}
                >
                  <Check size={16} />
                  <span>{isAr ? "إنشاء تصميم وتوليد الطبقات" : "Create with Template Layers"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
