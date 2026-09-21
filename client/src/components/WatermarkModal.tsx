import React, { useState } from "react";
import { Stamp, X, Check, Eye, Type, Image as ImageIcon, Grid3X3, Sliders } from "lucide-react";

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface WatermarkOptions {
  type: "text" | "logo";
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  isTiled: boolean;
  logoDataUrl?: string;
}

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (options: WatermarkOptions) => void;
  lang?: "ar" | "en";
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onApplyWatermark,
  lang = "ar"
}) => {
  const [wmType, setWmType] = useState<"text" | "logo">("text");
  const [wmText, setWmText] = useState("© ImagePro Studio");
  const [fontSize, setFontSize] = useState(28);
  const [opacity, setOpacity] = useState(40);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [isTiled, setIsTiled] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();

  const isAr = lang === "ar";

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    onApplyWatermark({
      type: wmType,
      text: wmText,
      fontSize,
      color,
      opacity,
      position,
      isTiled,
      logoDataUrl
    });
    onClose();
  };

  const positions: WatermarkPosition[] = [
    "top-left", "top-center", "top-right",
    "middle-left", "center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right"
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window watermark-window"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Stamp size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isAr ? "استوديو العلامة المائية وحماية الحقوق (Watermark Studio)" : "Watermark Studio"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "أضف شارة أو توقيعاً مخصصاً لحماية حقوقك الفكرية على الصورة" : "Protect intellectual property with custom signatures or logo stamps"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="wm-body">
          {/* Type Toggle: Text vs Logo */}
          <div className="wm-type-row">
            <button
              type="button"
              className={`wm-type-btn ${wmType === "text" ? "active" : ""}`}
              onClick={() => setWmType("text")}
            >
              <Type size={14} />
              <span>{isAr ? "علامة نصية (Text)" : "Text Signature"}</span>
            </button>
            <button
              type="button"
              className={`wm-type-btn ${wmType === "logo" ? "active" : ""}`}
              onClick={() => setWmType("logo")}
            >
              <ImageIcon size={14} />
              <span>{isAr ? "شعار أو صورة (Logo)" : "Logo Image"}</span>
            </button>
          </div>

          {wmType === "text" ? (
            <div className="wm-field">
              <label className="wm-label">{isAr ? "نص العلامة المائية:" : "Watermark Text:"}</label>
              <input
                type="text"
                className="wm-input"
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                placeholder="مثال: © 2026 حقوق الطبع محفوظة"
              />
            </div>
          ) : (
            <div className="wm-field">
              <label className="wm-label">{isAr ? "رفع الشعار (PNG شفاف):" : "Upload Logo (Transparent PNG):"}</label>
              <input
                type="file"
                accept="image/png,image/webp"
                onChange={handleLogoUpload}
                className="wm-file-input"
              />
            </div>
          )}

          {/* Sliders: Size & Opacity */}
          <div className="wm-grid-2">
            <div className="wm-field">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{isAr ? "الحجم:" : "Size:"}</span>
                <span className="text-teal-400 font-bold">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="wm-range"
              />
            </div>

            <div className="wm-field">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{isAr ? "الشفافية (Opacity):" : "Opacity:"}</span>
                <span className="text-teal-400 font-bold">{opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="wm-range"
              />
            </div>
          </div>

          {/* 9-Point Positioning Grid */}
          <div className="wm-field">
            <label className="wm-label">{isAr ? "موضع العلامة المائية:" : "Placement Position:"}</label>
            <div className="wm-pos-grid">
              {positions.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`wm-pos-btn ${position === p ? "active" : ""}`}
                  onClick={() => setPosition(p)}
                  title={p}
                >
                  <span className="wm-pos-dot" />
                </button>
              ))}
            </div>
          </div>

          {/* Tiled Toggle */}
          <div className="wm-toggle-row">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={isTiled}
                onChange={(e) => setIsTiled(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span>{isAr ? "تكرار مائل عبر كامل مساحة الصورة (Tiled Protection Grid)" : "Repeat diagonally across entire canvas"}</span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="wm-footer">
            <button type="button" className="wm-cancel-btn" onClick={onClose}>
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="button" className="wm-submit-btn" onClick={handleApply}>
              <Check size={14} />
              <span>{isAr ? "تطبيق العلامة المائية" : "Apply Watermark"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
