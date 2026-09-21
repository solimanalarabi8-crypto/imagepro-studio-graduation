import React, { useState, useMemo } from "react";
import {
  FolderKanban,
  Search,
  Star,
  Trash2,
  Copy,
  Edit2,
  FileDown,
  Upload,
  Plus,
  RotateCcw,
  Clock,
  Layers,
  X,
  Sparkles,
  FolderPlus
} from "lucide-react";
import { StoredProjectMetadata } from "@/lib/autosave-manager";

interface ProjectsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: StoredProjectMetadata[];
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onImportProjectFile: () => void;
  onDuplicateProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onMoveToTrash: (projectId: string) => void;
  onRestoreFromTrash: (projectId: string) => void;
  onPermanentDelete: (projectId: string) => void;
  onExportProjectFile: (projectId: string) => void;
  lang?: "ar" | "en";
}

export const ProjectsDashboardModal: React.FC<ProjectsDashboardModalProps> = ({
  isOpen,
  onClose,
  projects,
  onOpenProject,
  onNewProject,
  onImportProjectFile,
  onDuplicateProject,
  onRenameProject,
  onToggleFavorite,
  onMoveToTrash,
  onRestoreFromTrash,
  onPermanentDelete,
  onExportProjectFile,
  lang = "ar"
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "trash">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const isAr = lang === "ar";

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab === "favorites") {
      list = list.filter((p) => p.isFavorite && !p.isTrash);
    } else if (activeTab === "trash") {
      list = list.filter((p) => p.isTrash);
    } else {
      list = list.filter((p) => !p.isTrash);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [projects, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleStartRename = (p: StoredProjectMetadata) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = (projectId: string) => {
    if (editName.trim()) {
      onRenameProject(projectId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window projects-dashboard-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-sm">
              <FolderKanban size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {isAr ? "لوحة إدارة المشاريع (Projects Dashboard)" : "Projects Dashboard"}
                <span className="text-xs font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {projects.filter((p) => !p.isTrash).length} {isAr ? "مشروع" : "projects"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "استعرض مشاريعك وتصاميمك، نظمها، واستعد أو صدّر أي ملف بسهولة" : "Manage, organize, duplicate, and export your graphic projects"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="proj-header-btn proj-new-btn"
              onClick={() => {
                onClose();
                onNewProject();
              }}
            >
              <Plus size={14} />
              <span>{isAr ? "مشروع جديد" : "New Project"}</span>
            </button>
            <button
              type="button"
              className="proj-header-btn proj-import-btn"
              onClick={onImportProjectFile}
              title={isAr ? "استيراد ملف مشروع .imagepro" : "Import .imagepro file"}
            >
              <Upload size={14} />
              <span>{isAr ? "استيراد" : "Import"}</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* Toolbar: Search and Filter Tabs */}
        <div className="proj-toolbar-row">
          <div className="proj-tabs">
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              {isAr ? "كافة المشاريع" : "All Projects"} ({projects.filter((p) => !p.isTrash).length})
            </button>
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveTab("favorites")}
            >
              <Star size={12} className={activeTab === "favorites" ? "text-amber-400 fill-amber-400" : ""} />
              {isAr ? "المفضلة" : "Favorites"} ({projects.filter((p) => p.isFavorite && !p.isTrash).length})
            </button>
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "trash" ? "active" : ""}`}
              onClick={() => setActiveTab("trash")}
            >
              <Trash2 size={12} />
              {isAr ? "سلة المحذوفات" : "Trash"} ({projects.filter((p) => p.isTrash).length})
            </button>
          </div>

          <div className="proj-search-box">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? "بحث في المشاريع..." : "Search projects..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="proj-search-input"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="proj-grid-container">
          {filteredProjects.length === 0 ? (
            <div className="proj-empty-box">
              <FolderKanban size={36} className="text-slate-600 mb-2" />
              <p>{isAr ? "لا توجد مشاريع في هذا القسم" : "No projects found"}</p>
              <span>{isAr ? "ابدأ بإنشاء مشروع جديد أو استيراد ملف" : "Create a new project or import a file"}</span>
            </div>
          ) : (
            <div className="proj-cards-grid">
              {filteredProjects.map((p) => (
                <div key={p.id} className="proj-card">
                  {/* Card Thumbnail */}
                  <div
                    className="proj-card-thumb"
                    onClick={() => {
                      if (!p.isTrash) {
                        onOpenProject(p.id);
                        onClose();
                      }
                    }}
                  >
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="proj-card-img" />
                    ) : (
                      <div className="proj-card-placeholder">
                        <Sparkles size={24} className="text-teal-400/30" />
                        <span>{p.width}×{p.height}px</span>
                      </div>
                    )}
                    {!p.isTrash && (
                      <button
                        type="button"
                        className={`proj-card-fav-btn ${p.isFavorite ? "is-fav" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p.id);
                        }}
                        title={isAr ? "إضافة للمفضلة" : "Favorite"}
                      >
                        <Star size={14} />
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="proj-card-body">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-1 my-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveRename(p.id)}
                          className="proj-rename-input"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="proj-save-rename-btn"
                          onClick={() => handleSaveRename(p.id)}
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div
                        className="proj-card-title"
                        title={p.name}
                        onClick={() => {
                          if (!p.isTrash) {
                            onOpenProject(p.id);
                            onClose();
                          }
                        }}
                      >
                        {p.name}
                      </div>
                    )}

                    <div className="proj-card-meta">
                      <span><Layers size={11} /> {p.layersCount} {isAr ? "طبقات" : "layers"}</span>
                      <span>{p.width}×{p.height}px</span>
                    </div>

                    {/* Actions Bar */}
                    <div className="proj-card-actions">
                      {!p.isTrash ? (
                        <>
                          <button
                            type="button"
                            className="proj-action-icon"
                            onClick={() => handleStartRename(p)}
                            title={isAr ? "إعادة تسمية" : "Rename"}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="proj-action-icon"
                            onClick={() => onDuplicateProject(p.id)}
                            title={isAr ? "تكرار المشروع" : "Duplicate"}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            className="proj-action-icon"
                            onClick={() => onExportProjectFile(p.id)}
                            title={isAr ? "تصدير كملف .imagepro" : "Export .imagepro"}
                          >
                            <FileDown size={12} />
                          </button>
                          <button
                            type="button"
                            className="proj-action-icon text-rose-400 hover:text-rose-300"
                            onClick={() => onMoveToTrash(p.id)}
                            title={isAr ? "نقل إلى سلة المحذوفات" : "Move to Trash"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="proj-action-btn proj-restore-btn"
                            onClick={() => onRestoreFromTrash(p.id)}
                          >
                            <RotateCcw size={12} />
                            <span>{isAr ? "استعادة" : "Restore"}</span>
                          </button>
                          <button
                            type="button"
                            className="proj-action-btn proj-delete-perm-btn"
                            onClick={() => onPermanentDelete(p.id)}
                          >
                            <Trash2 size={12} />
                            <span>{isAr ? "حذف نهائي" : "Delete"}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
