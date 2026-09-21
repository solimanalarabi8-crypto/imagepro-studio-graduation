import React, { useState } from "react";
import {
  History,
  Clock,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  X,
  Layers,
  Calendar,
  Check
} from "lucide-react";
import { ProjectSnapshot } from "@/lib/autosave-manager";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: ProjectSnapshot[];
  onRestoreSnapshot: (snapshot: ProjectSnapshot) => void;
  onCreateManualSnapshot: (note: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  lang?: "ar" | "en";
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  onCreateManualSnapshot,
  onDeleteSnapshot,
  lang = "ar"
}) => {
  const [newNote, setNewNote] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const isAr = lang === "ar";

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onCreateManualSnapshot(newNote.trim());
    setNewNote("");
  };

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window version-history-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <History size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isAr ? "سجل الإصدارات ونقاط الاستعادة (Version History)" : "Version History & Snapshots"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "استعرض النسخ السابقة للمشروع واستعد أي نقطة زمنية سابقة دون فقدان البيانات" : "Browse and restore previous project milestones anytime"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Create Manual Snapshot Form */}
        <form onSubmit={handleCreate} className="vh-create-row">
          <input
            type="text"
            className="vh-input"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={isAr ? "اكتب وصفاً لنقطة الاستعادة (مثال: قبل عزل الخلفية)" : "Snapshot note (e.g. Before AI Cutout)"}
          />
          <button type="submit" className="vh-create-btn" disabled={!newNote.trim()}>
            <BookmarkPlus size={14} />
            <span>{isAr ? "حفظ نقطة جديدة" : "Save Milestone"}</span>
          </button>
        </form>

        <div className="vh-content-layout">
          {/* Snapshots Timeline List */}
          <div className="vh-timeline-list">
            {snapshots.length === 0 ? (
              <div className="vh-empty-state">
                <Clock size={28} className="text-slate-600 mb-2" />
                <p>{isAr ? "لا توجد نقاط استعادة محفوظة بعد" : "No milestones saved yet"}</p>
                <span>{isAr ? "يقوم النظام بالحفظ التلقائي دورياً أثناء العمل" : "System autosaves milestones as you edit"}</span>
              </div>
            ) : (
              snapshots.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    className={`vh-card ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedSnapshotId(snap.id)}
                  >
                    <div className="vh-card-header">
                      <span className="vh-time"><Clock size={12} /> {snap.dateFormatted}</span>
                      <span className="vh-layers-badge"><Layers size={11} /> {snap.layersCount} {isAr ? "طبقات" : "layers"}</span>
                    </div>
                    <div className="vh-card-note">{snap.note}</div>
                    <div className="vh-card-dims">{snap.width}×{snap.height}px</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Snapshot Preview & Action Pane */}
          {selectedSnapshot && (
            <div className="vh-preview-pane">
              <div className="vh-preview-box">
                {selectedSnapshot.thumbnail ? (
                  <img src={selectedSnapshot.thumbnail} alt={selectedSnapshot.projectName} className="vh-thumb-img" />
                ) : (
                  <div className="vh-no-thumb">
                    <History size={36} className="text-teal-500/30" />
                    <span>{selectedSnapshot.width} × {selectedSnapshot.height} px</span>
                  </div>
                )}
              </div>

              <div className="vh-details-card">
                <div className="vh-meta-row">
                  <span className="vh-meta-label">{isAr ? "المشروع:" : "Project:"}</span>
                  <span className="vh-meta-val">{selectedSnapshot.projectName}</span>
                </div>
                <div className="vh-meta-row">
                  <span className="vh-meta-label">{isAr ? "التوقيت:" : "Time:"}</span>
                  <span className="vh-meta-val">{selectedSnapshot.dateFormatted}</span>
                </div>
                <div className="vh-meta-row">
                  <span className="vh-meta-label">{isAr ? "ملاحظة الحفظ:" : "Note:"}</span>
                  <span className="vh-meta-val text-teal-400 font-semibold">{selectedSnapshot.note}</span>
                </div>
                <div className="vh-meta-row">
                  <span className="vh-meta-label">{isAr ? "الطبقات:" : "Layers:"}</span>
                  <span className="vh-meta-val">{selectedSnapshot.layersCount} {isAr ? "طبقة" : "layers"}</span>
                </div>
              </div>

              <div className="vh-actions-row">
                <button
                  type="button"
                  className="vh-restore-btn"
                  onClick={() => {
                    onRestoreSnapshot(selectedSnapshot);
                    onClose();
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{isAr ? "استعادة هذه النسخة للمشروع" : "Restore This Version"}</span>
                </button>
                <button
                  type="button"
                  className="vh-delete-btn"
                  onClick={() => onDeleteSnapshot(selectedSnapshot.id)}
                  title={isAr ? "حذف هذه النقطة" : "Delete snapshot"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
