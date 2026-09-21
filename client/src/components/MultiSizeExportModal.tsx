import React, { useState } from "react";
import { Download, X, Check, FileImage, Layers, Sparkles } from "lucide-react";

export interface ExportPresetSize {
  id: string;
  labelAr: string;
  labelEn: string;
  width: number;
  height: number;
  badge: string;
}

interface MultiSizeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalWidth: number;
  originalHeight: number;
  onExecuteMultiExport: (options: {
    format: "png" | "jpeg" | "webp";
    quality: number;
    selectedSizes: { width: number; height: number; suffix: string }[];
  }) => void;
  lang?: "ar" | "en";
}

export const MultiSizeExportModal: React.FC<MultiSizeExportModalProps> = ({
  isOpen,
  onClose,
  originalWidth,
  originalHeight,
  onExecuteMultiExport,
  lang = "ar"
}) => {
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(92);
  const [checkedSizes, setCheckedSizes] = useState<Record<string, boolean>>({
    "orig": true,
    "2x": true,
    "insta": false,
    "story": false,
    "yt": false,
    "web": false
  });

  const isAr = lang === "ar";

  if (!isOpen) return null;

  const presetSizes: ExportPresetSize[] = [
    { id: "orig", labelAr: "الحجم الأصلي للمشروع", labelEn: "Original Size", width: originalWidth, height: originalHeight, badge: "1x" },
    { id: "2x", labelAr: "شاشات ريتينا العالية الدقة (Retina)", labelEn: "High-DPI Retina", width: originalWidth * 2, height: originalHeight * 2, badge: "2x" },
    { id: "web", labelAr: "نسخة ويب مصغرة خفيفة", labelEn: "Web Compressed Half", width: Math.round(originalWidth * 0.5), height: Math.round(originalHeight * 0.5), badge: "0.5x" },
    { id: "insta", labelAr: "منشور إنستغرام مربع", labelEn: "Instagram Square Post", width: 1080, height: 1080, badge: "1080p" },
    { id: "story", labelAr: "قصة تيك توك وريلز رأسية", labelEn: "TikTok & Story Vertical", width: 1080, height: 1920, badge: "9:16" },
    { id: "yt", labelAr: "غلاف فيديو يوتيوب عريض", labelEn: "YouTube HD Thumbnail", width: 1280, height: 720, badge: "16:9" },
  ];

  const toggleCheck = (id: string) => {
    setCheckedSizes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(checkedSizes).filter(Boolean).length;

  const handleExport = () => {
    const targets = presetSizes
      .filter((p) => checkedSizes[p.id])
      .map((p) => ({ width: p.width, height: p.height, suffix: p.badge }));

    if (targets.length === 0) return;

    onExecuteMultiExport({
      format,
      quality: quality / 100,
      selectedSizes: targets
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window multi-export-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Download size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isAr ? "التصدير متعدد المقاسات (Multi-Size Export)" : "Multi-Size Export Studio"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "صدّر مشروعك بعدة أبعاد وقياسات لمنصات التواصل بنقرة واحدة" : "Export project to multiple dimensions and social formats simultaneously"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="multi-exp-body">
          {/* Format Selector */}
          <div className="multi-exp-field">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {isAr ? "صيغة التصدير المطلوبة:" : "Export Format:"}
            </label>
            <div className="flex gap-2">
              {(["png", "jpeg", "webp"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className={`multi-fmt-btn ${format === fmt ? "active" : ""}`}
                  onClick={() => setFormat(fmt)}
                >
                  <span className="font-bold uppercase">{fmt}</span>
                  <span className="text-[9.5px] opacity-75">
                    {fmt === "png" ? (isAr ? "شفافية كاملة" : "Lossless") : fmt === "jpeg" ? (isAr ? "ضغط عالي" : "Standard") : (isAr ? "فائق السرعة" : "Modern")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for jpg/webp) */}
          {format !== "png" && (
            <div className="multi-exp-field">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{isAr ? "جودة الضغط:" : "Quality Level:"}</span>
                <span className="text-teal-400 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="multi-range"
              />
            </div>
          )}

          {/* Target Sizes Checkboxes */}
          <div className="multi-exp-field">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? "اختر المقاسات والأبعاد المطلوبة:" : "Select Export Dimensions:"}
              </label>
              <button
                type="button"
                className="text-[10px] text-teal-400 hover:underline"
                onClick={() => {
                  const allTrue = Object.keys(checkedSizes).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                  setCheckedSizes(allTrue);
                }}
              >
                {isAr ? "تحديد الكل" : "Select All"}
              </button>
            </div>

            <div className="multi-sizes-list">
              {presetSizes.map((preset) => {
                const isChecked = Boolean(checkedSizes[preset.id]);
                return (
                  <label key={preset.id} className={`multi-size-card ${isChecked ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(preset.id)}
                      className="rounded border-slate-700 text-teal-500 focus:ring-teal-500"
                    />
                    <div className="multi-size-info">
                      <span className="multi-size-title">{isAr ? preset.labelAr : preset.labelEn}</span>
                      <span className="multi-size-dims">{preset.width} × {preset.height} px</span>
                    </div>
                    <span className="multi-size-badge">{preset.badge}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="multi-exp-footer">
            <span className="text-xs text-slate-400">
              {isAr ? `سيتم تصدير ${selectedCount} ملفات` : `${selectedCount} files will be exported`}
            </span>
            <button
              type="button"
              className="multi-submit-btn"
              disabled={selectedCount === 0}
              onClick={handleExport}
            >
              <Download size={14} />
              <span>{isAr ? `تصدير دفعة (${selectedCount}) صور` : `Export (${selectedCount}) Images`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
