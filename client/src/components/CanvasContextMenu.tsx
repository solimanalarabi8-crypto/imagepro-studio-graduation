import React, { useEffect, useRef } from "react";
import {
  Copy,
  Scissors,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Maximize,
  Download,
  CheckSquare
} from "lucide-react";

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onDuplicateLayer?: () => void;
  onDeleteLayer?: () => void;
  onToggleLockLayer?: () => void;
  isLayerLocked?: boolean;
  onMergeDown?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onAiCutout?: () => void;
  onFitScreen?: () => void;
  onExportLayer?: () => void;
  lang?: "ar" | "en";
}

export const CanvasContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  onCopy,
  onCut,
  onDuplicateLayer,
  onDeleteLayer,
  onToggleLockLayer,
  isLayerLocked = false,
  onMergeDown,
  onBringForward,
  onSendBackward,
  onAiCutout,
  onFitScreen,
  onExportLayer,
  lang = "ar"
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Screen boundary clamping
  const menuWidth = 230;
  const menuHeight = 360;
  const clampedX = Math.min(Math.max(10, x), window.innerWidth - menuWidth - 10);
  const clampedY = Math.min(Math.max(10, y), window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      className="canvas-context-menu"
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {onCopy && (
        <button className="ctx-item" onClick={() => { onCopy(); onClose(); }}>
          <span className="ctx-item-icon"><Copy size={13} /></span>
          <span className="ctx-item-text">{isAr ? "نسخ" : "Copy"}</span>
          <span className="ctx-shortcut">Ctrl+C</span>
        </button>
      )}

      {onCut && (
        <button className="ctx-item" onClick={() => { onCut(); onClose(); }}>
          <span className="ctx-item-icon"><Scissors size={13} /></span>
          <span className="ctx-item-text">{isAr ? "قص التحديد" : "Cut"}</span>
          <span className="ctx-shortcut">Ctrl+X</span>
        </button>
      )}

      {onDuplicateLayer && (
        <button className="ctx-item" onClick={() => { onDuplicateLayer(); onClose(); }}>
          <span className="ctx-item-icon"><CopyPlus size={13} /></span>
          <span className="ctx-item-text">{isAr ? "تكرار الطبقة النشطة" : "Duplicate Layer"}</span>
          <span className="ctx-shortcut">Ctrl+J</span>
        </button>
      )}

      <div className="ctx-separator" />

      {onToggleLockLayer && (
        <button className="ctx-item" onClick={() => { onToggleLockLayer(); onClose(); }}>
          <span className="ctx-item-icon">{isLayerLocked ? <Unlock size={13} /> : <Lock size={13} />}</span>
          <span className="ctx-item-text">{isLayerLocked ? (isAr ? "إلغاء قفل الطبقة" : "Unlock Layer") : (isAr ? "قفل الطبقة" : "Lock Layer")}</span>
        </button>
      )}

      {onBringForward && (
        <button className="ctx-item" onClick={() => { onBringForward(); onClose(); }}>
          <span className="ctx-item-icon"><ArrowUp size={13} /></span>
          <span className="ctx-item-text">{isAr ? "جلب الطبقة للأمام" : "Bring Forward"}</span>
        </button>
      )}

      {onSendBackward && (
        <button className="ctx-item" onClick={() => { onSendBackward(); onClose(); }}>
          <span className="ctx-item-icon"><ArrowDown size={13} /></span>
          <span className="ctx-item-text">{isAr ? "إرسال الطبقة للخلف" : "Send Backward"}</span>
        </button>
      )}

      {onMergeDown && (
        <button className="ctx-item" onClick={() => { onMergeDown(); onClose(); }}>
          <span className="ctx-item-icon"><ArrowDownToLine size={13} /></span>
          <span className="ctx-item-text">{isAr ? "دمج مع الطبقة السفلية" : "Merge Down"}</span>
          <span className="ctx-shortcut">Ctrl+E</span>
        </button>
      )}

      <div className="ctx-separator" />

      {onAiCutout && (
        <button className="ctx-item ctx-item-featured" onClick={() => { onAiCutout(); onClose(); }}>
          <span className="ctx-item-icon"><Sparkles size={13} /></span>
          <span className="ctx-item-text">{isAr ? "عزل المحتوى الصافي فوراً" : "Pure AI Cutout"}</span>
          <span className="ctx-badge">AI</span>
        </button>
      )}

      {onFitScreen && (
        <button className="ctx-item" onClick={() => { onFitScreen(); onClose(); }}>
          <span className="ctx-item-icon"><Maximize size={13} /></span>
          <span className="ctx-item-text">{isAr ? "ملاءمة الكانفاس للشاشة" : "Fit to Screen"}</span>
          <span className="ctx-shortcut">Ctrl+0</span>
        </button>
      )}

      {onExportLayer && (
        <button className="ctx-item" onClick={() => { onExportLayer(); onClose(); }}>
          <span className="ctx-item-icon"><Download size={13} /></span>
          <span className="ctx-item-text">{isAr ? "تصدير هذه الطبقة (PNG شفاف)" : "Export Layer (PNG)"}</span>
        </button>
      )}

      {onDeleteLayer && (
        <>
          <div className="ctx-separator" />
          <button className="ctx-item ctx-item-danger" onClick={() => { onDeleteLayer(); onClose(); }}>
            <span className="ctx-item-icon"><Trash2 size={13} /></span>
            <span className="ctx-item-text">{isAr ? "حذف الطبقة" : "Delete Layer"}</span>
            <span className="ctx-shortcut">Del</span>
          </button>
        </>
      )}
    </div>
  );
};
