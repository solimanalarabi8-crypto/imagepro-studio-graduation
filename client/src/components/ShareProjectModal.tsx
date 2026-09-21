import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Link,
  QrCode,
  FileCode,
  Layers,
  Sparkles
} from "lucide-react";
import { StoredProjectMetadata } from "@/lib/autosave-manager";

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StoredProjectMetadata | null;
  onExportFile: (id: string) => void;
  lang?: "ar" | "en";
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onExportFile,
  lang = "ar"
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const isAr = lang === "ar";

  if (!isOpen || !project) return null;

  const shareableUrl = `${window.location.origin}/#project=${project.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJson = () => {
    const raw = localStorage.getItem(`imagepro_project_${project.id}`);
    if (raw) {
      navigator.clipboard.writeText(raw);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window share-project-modal"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="modal-header flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isAr ? "مشاركة المشروع والتصدير" : "Share & Export Project"}
              </h2>
              <p className="text-xs text-slate-400">
                {project.name} ({project.width} × {project.height} px)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Shareable Link Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link size={14} className="text-teal-400" />
              {isAr ? "رابط المشروع في المتصفح" : "Browser Share Link"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-teal-500 text-slate-950 rounded-lg font-bold text-xs hover:bg-teal-400 transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{isAr ? (copiedLink ? "تم النسخ" : "نسخ") : (copiedLink ? "Copied" : "Copy")}</span>
              </button>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onExportFile(project.id)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-850 text-right transition-all group flex flex-col justify-between"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 w-fit mb-2">
                <Download size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300">
                  {isAr ? "تحميل حزمة المشروع (.ipro)" : "Download (.ipro package)"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? "حزمة كاملة لجميع الطبقات والبيانات" : "Full layers snapshot package"}
                </p>
              </div>
            </button>

            <button
              onClick={handleCopyJson}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-850 text-right transition-all group flex flex-col justify-between"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-2">
                <FileCode size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                  {isAr ? (copiedCode ? "تم نسخ بيانات JSON" : "نسخ كود JSON") : "Copy JSON Data"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? "للاستيراد اليدوي والنسخ الاحتياطي" : "Raw JSON string export"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
