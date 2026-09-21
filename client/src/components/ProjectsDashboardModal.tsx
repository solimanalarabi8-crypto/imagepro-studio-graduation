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
  FolderPlus,
  Share2,
  Folder,
  History,
  Check,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { StoredProjectMetadata } from "@/lib/autosave-manager";
import {
  getProjectFolders,
  saveProjectFolders,
  ProjectFolder
} from "@/lib/design-platform-adapter";

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
  onShareProject?: (project: StoredProjectMetadata) => void;
  onViewVersionHistory?: (projectId: string) => void;
  onMoveToFolder?: (projectId: string, folderName: string) => void;
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
  onShareProject,
  onViewVersionHistory,
  onMoveToFolder,
  lang = "ar"
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "trash" | "folders">("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [folders, setFolders] = useState<ProjectFolder[]>(() => getProjectFolders());
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Track project assignments to folders (stored in localStorage)
  const [projectFolderMap, setProjectFolderMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("imagepro_project_folders_map_v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const isAr = lang === "ar";

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab === "favorites") {
      list = list.filter((p) => p.isFavorite && !p.isTrash);
    } else if (activeTab === "trash") {
      list = list.filter((p) => p.isTrash);
    } else if (activeTab === "folders" && selectedFolderId) {
      list = list.filter((p) => !p.isTrash && projectFolderMap[p.id] === selectedFolderId);
    } else {
      list = list.filter((p) => !p.isTrash);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [projects, activeTab, selectedFolderId, projectFolderMap, searchQuery]);

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

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: ProjectFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: "#38bdf8",
      createdAt: Date.now()
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    saveProjectFolders(updated);
    setNewFolderName("");
    setIsCreatingFolder(false);
    setSelectedFolderId(newFolder.id);
  };

  const handleAssignProjectFolder = (projectId: string, folderId: string | null) => {
    const updated = { ...projectFolderMap };
    if (folderId) {
      updated[projectId] = folderId;
    } else {
      delete updated[projectId];
    }
    setProjectFolderMap(updated);
    try {
      localStorage.setItem("imagepro_project_folders_map_v1", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save folder map", e);
    }
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
                {isAr ? "المشاريع الأخيرة، المفضلة، المجلدات، وسجل الإصدارات والتصدير" : "Recent Projects, Favorites, Folders, Version History & Export"}
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
              onClick={() => {
                setActiveTab("all");
                setSelectedFolderId(null);
              }}
            >
              {isAr ? "كافة المشاريع" : "All Projects"} ({projects.filter((p) => !p.isTrash).length})
            </button>
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("favorites");
                setSelectedFolderId(null);
              }}
            >
              <Star size={12} className={activeTab === "favorites" ? "text-amber-400 fill-amber-400" : ""} />
              {isAr ? "المفضلة" : "Favorites"} ({projects.filter((p) => p.isFavorite && !p.isTrash).length})
            </button>
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "folders" ? "active" : ""}`}
              onClick={() => setActiveTab("folders")}
            >
              <Folder size={12} />
              {isAr ? "المجلدات" : "Folders"} ({folders.length})
            </button>
            <button
              type="button"
              className={`proj-tab-btn ${activeTab === "trash" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("trash");
                setSelectedFolderId(null);
              }}
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

        {/* Folders Bar (When Folders Tab is selected) */}
        {activeTab === "folders" && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {folders.map((f) => {
                const count = projects.filter((p) => !p.isTrash && projectFolderMap[p.id] === f.id).length;
                const isSelected = selectedFolderId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolderId(isSelected ? null : f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? "bg-teal-500/20 border-teal-500 text-teal-300 font-semibold"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <Folder size={13} style={{ color: f.color }} />
                    <span>{f.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>

            {isCreatingFolder ? (
              <form onSubmit={handleCreateNewFolder} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder={isAr ? "اسم المجلد..." : "Folder name..."}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-teal-500/50 transition-colors whitespace-nowrap"
              >
                <FolderPlus size={13} className="text-teal-400" />
                <span>{isAr ? "مجلد جديد" : "New Folder"}</span>
              </button>
            )}
          </div>
        )}

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
              {filteredProjects.map((p) => {
                const assignedFolder = folders.find((f) => f.id === projectFolderMap[p.id]);
                return (
                  <div key={p.id} className="proj-card group">
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

                      {assignedFolder && (
                        <span
                          className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-900/90 border border-slate-700 text-slate-200 flex items-center gap-1"
                        >
                          <Folder size={10} style={{ color: assignedFolder.color }} />
                          {assignedFolder.name}
                        </span>
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
                          className="proj-card-title cursor-pointer"
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
                        <span className="flex items-center gap-1" title={new Date(p.updatedAt).toLocaleString()}>
                          <Clock size={10} />
                          {new Date(p.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
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
                            {onShareProject && (
                              <button
                                type="button"
                                className="proj-action-icon text-teal-400 hover:text-teal-300"
                                onClick={() => onShareProject(p)}
                                title={isAr ? "مشاركة المشروع" : "Share"}
                              >
                                <Share2 size={12} />
                              </button>
                            )}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
