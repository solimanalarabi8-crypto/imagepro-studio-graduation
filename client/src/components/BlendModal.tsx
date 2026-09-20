import { useState, useRef, useEffect } from "react";
import { X, Upload, Layers, Sliders, ArrowLeftRight, ArrowUpDown, Sparkles, Check } from "lucide-react";
import { BLEND_MODE_OPTIONS, blendModeToCompositeOp } from "@/lib/layers-history";

interface BlendModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImageSrc: string;
  onApplyBlend: (resultDataUrl: string, asNewLayer: boolean, blendMode: string, opacity: number) => void;
  isArabic?: boolean;
}

export default function BlendModal({
  isOpen,
  onClose,
  baseImageSrc,
  onApplyBlend,
  isArabic = true,
}: BlendModalProps) {
  const [secondImageSrc, setSecondImageSrc] = useState<string | null>(null);
  const [blendType, setBlendType] = useState<"overlay" | "side-h" | "side-v" | "gradient">("overlay");
  const [blendMode, setBlendMode] = useState<string>("overlay");
  const [opacity, setOpacity] = useState<number>(85);
  const [gradientDirection, setGradientDirection] = useState<"left-right" | "top-bottom">("left-right");
  const [asNewLayer, setAsNewLayer] = useState<boolean>(true);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and composite preview whenever parameters change
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img1 = new Image();
    img1.crossOrigin = "anonymous";
    img1.onload = () => {
      const W = img1.naturalWidth || 800;
      const H = img1.naturalHeight || 600;

      if (!secondImageSrc) {
        canvas.width = Math.min(600, W);
        canvas.height = Math.round((canvas.width / W) * H);
        ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);
        return;
      }

      const img2 = new Image();
      img2.crossOrigin = "anonymous";
      img2.onload = () => {
        if (blendType === "overlay") {
          canvas.width = Math.min(600, W);
          canvas.height = Math.round((canvas.width / W) * H);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Base
          ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);

          // Overlay 2nd image
          ctx.save();
          ctx.globalAlpha = opacity / 100;
          ctx.globalCompositeOperation = blendModeToCompositeOp(blendMode);
          ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else if (blendType === "side-h") {
          // Horizontal side-by-side
          canvas.width = Math.min(700, W * 2);
          canvas.height = Math.round((canvas.width / (W * 2)) * H);
          const halfW = canvas.width / 2;

          ctx.drawImage(img1, 0, 0, halfW, canvas.height);
          ctx.drawImage(img2, halfW, 0, halfW, canvas.height);

          // Center divider
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(halfW, 0);
          ctx.lineTo(halfW, canvas.height);
          ctx.stroke();
        } else if (blendType === "side-v") {
          // Vertical side-by-side
          canvas.width = Math.min(500, W);
          canvas.height = Math.round((canvas.width / W) * (H * 2));
          const halfH = canvas.height / 2;

          ctx.drawImage(img1, 0, 0, canvas.width, halfH);
          ctx.drawImage(img2, 0, halfH, canvas.width, halfH);

          // Center divider
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, halfH);
          ctx.lineTo(canvas.width, halfH);
          ctx.stroke();
        } else if (blendType === "gradient") {
          // Gradient alpha transition
          canvas.width = Math.min(600, W);
          canvas.height = Math.round((canvas.width / W) * H);

          // Render img1
          ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);

          // Render img2 onto offscreen with gradient mask
          const off2 = document.createElement("canvas");
          off2.width = canvas.width;
          off2.height = canvas.height;
          const ctx2 = off2.getContext("2d");
          if (ctx2) {
            ctx2.drawImage(img2, 0, 0, off2.width, off2.height);

            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = off2.width;
            maskCanvas.height = off2.height;
            const mCtx = maskCanvas.getContext("2d");
            if (mCtx) {
              const grad = gradientDirection === "left-right"
                ? mCtx.createLinearGradient(0, 0, off2.width, 0)
                : mCtx.createLinearGradient(0, 0, 0, off2.height);
              grad.addColorStop(0, "rgba(0,0,0,0)");
              grad.addColorStop(0.35, "rgba(0,0,0,0.1)");
              grad.addColorStop(0.7, `rgba(0,0,0,${(opacity / 100).toFixed(2)})`);
              grad.addColorStop(1, `rgba(0,0,0,${(opacity / 100).toFixed(2)})`);
              mCtx.fillStyle = grad;
              mCtx.fillRect(0, 0, off2.width, off2.height);

              ctx2.globalCompositeOperation = "destination-in";
              ctx2.drawImage(maskCanvas, 0, 0);
            }

            ctx.drawImage(off2, 0, 0);
          }
        }
      };
      img2.src = secondImageSrc;
    };
    img1.src = baseImageSrc;
  }, [isOpen, baseImageSrc, secondImageSrc, blendType, blendMode, opacity, gradientDirection]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSecondImageSrc(url);
    }
  };

  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const resultUrl = canvas.toDataURL("image/png");
    onApplyBlend(resultUrl, asNewLayer, blendMode, opacity);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 16, 16, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: isArabic ? "rtl" : "ltr",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#182323",
          border: "1px solid rgba(45, 212, 191, 0.3)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🖼️</span>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdfa", margin: 0 }}>
                {isArabic ? "استوديو دمج صورتين الاحترافي" : "Two-Image Blend Studio"}
              </h2>
              <p style={{ fontSize: "11px", color: "#7e9c96", margin: 0 }}>
                {isArabic
                  ? "دمج الصورتين بأنماط التراكب المتقدمة أو المقارنة جنباً إلى جنب"
                  : "Blend photos with advanced overlay modes, side-by-side split, or gradient"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#7e9c96",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Canvas Preview Area */}
          <div
            style={{
              background: "#121b1b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              overflow: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                overflow: "hidden",
                background: "repeating-conic-gradient(#202a2a 0% 25%, #283434 0% 50%) 50% / 16px 16px",
                maxHeight: "100%",
                maxWidth: "100%",
              }}
            >
              <canvas ref={previewCanvasRef} style={{ display: "block", maxWidth: "100%", maxHeight: "55vh" }} />
            </div>

            {!secondImageSrc && (
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  background: "rgba(20,31,31,0.9)",
                  border: "1px solid rgba(45,212,191,0.4)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#5eead4",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>👆 {isArabic ? "قم برفع الصورة الثانية من اللوحة الجانبية لمعاينة الدمج" : "Upload 2nd image on the right panel to preview"}</span>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div
            style={{
              padding: "18px",
              borderLeft: isArabic ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              borderRight: isArabic ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Upload 2nd Image */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#2dd4bf", display: "block", marginBottom: "6px" }}>
                {isArabic ? "1. اختيار الصورة الثانية للدمج:" : "1. Choose 2nd Image:"}
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: secondImageSrc ? "rgba(45, 212, 191, 0.15)" : "rgba(255, 255, 255, 0.04)",
                  border: "1px dashed rgba(45, 212, 191, 0.4)",
                  borderRadius: "8px",
                  color: secondImageSrc ? "#2dd4bf" : "#a8c4be",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Upload size={15} />
                {secondImageSrc
                  ? (isArabic ? "✓ تم اختيار الصورة (انقر للتغيير)" : "✓ Image Selected (Click to change)")
                  : (isArabic ? "رفع الصورة الثانية من جهازك..." : "Upload 2nd image from device...")}
              </button>
            </div>

            {/* Blend Type Selector */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#2dd4bf", display: "block", marginBottom: "6px" }}>
                {isArabic ? "2. نمط الدمج المطلوب:" : "2. Blend Layout Mode:"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setBlendType("overlay")}
                  style={{
                    padding: "8px 6px",
                    background: blendType === "overlay" ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.03)",
                    border: blendType === "overlay" ? "1px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: blendType === "overlay" ? "#5eead4" : "#94a3b8",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Layers size={13} /> {isArabic ? "تراكب طبقات" : "Photo Overlay"}
                </button>

                <button
                  type="button"
                  onClick={() => setBlendType("side-h")}
                  style={{
                    padding: "8px 6px",
                    background: blendType === "side-h" ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.03)",
                    border: blendType === "side-h" ? "1px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: blendType === "side-h" ? "#5eead4" : "#94a3b8",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <ArrowLeftRight size={13} /> {isArabic ? "جنباً إلى جنب (أفقي)" : "Split (H)"}
                </button>

                <button
                  type="button"
                  onClick={() => setBlendType("side-v")}
                  style={{
                    padding: "8px 6px",
                    background: blendType === "side-v" ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.03)",
                    border: blendType === "side-v" ? "1px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: blendType === "side-v" ? "#5eead4" : "#94a3b8",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <ArrowUpDown size={13} /> {isArabic ? "جنباً إلى جنب (رأسي)" : "Split (V)"}
                </button>

                <button
                  type="button"
                  onClick={() => setBlendType("gradient")}
                  style={{
                    padding: "8px 6px",
                    background: blendType === "gradient" ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.03)",
                    border: blendType === "gradient" ? "1px solid #2dd4bf" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: blendType === "gradient" ? "#5eead4" : "#94a3b8",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Sparkles size={13} /> {isArabic ? "تدرج متلاشي" : "Gradient Alpha"}
                </button>
              </div>
            </div>

            {/* Blend Mode Dropdown (for Overlay) */}
            {blendType === "overlay" && (
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#a8c4be", display: "block", marginBottom: "4px" }}>
                  {isArabic ? "وضع الدمج (Blend Mode):" : "Blend Mode:"}
                </label>
                <select
                  value={blendMode}
                  onChange={(e) => setBlendMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#f0fdfa",
                    fontSize: "12px",
                  }}
                >
                  {BLEND_MODE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} style={{ background: "#182323", color: "#f0fdfa" }}>
                      {isArabic ? `${opt.labelArabic} (${opt.id})` : opt.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Opacity Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#a8c4be", marginBottom: "4px" }}>
                <span>{isArabic ? "شفافية الدمج:" : "Blend Opacity:"}</span>
                <span style={{ color: "#2dd4bf", fontWeight: 700 }}>{opacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#2dd4bf", cursor: "pointer" }}
              />
            </div>

            {/* Output Destination Option */}
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "11.5px", color: "#d1d5db" }}>
                <input
                  type="checkbox"
                  checked={asNewLayer}
                  onChange={(e) => setAsNewLayer(e.target.checked)}
                  style={{ accentColor: "#2dd4bf", width: "15px", height: "15px" }}
                />
                {isArabic ? "إضافة الصورة المدمجة كطبقة مستقلة جديدة" : "Add blended result as a new independent layer"}
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "9px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!secondImageSrc}
                style={{
                  flex: 2,
                  padding: "9px",
                  background: secondImageSrc
                    ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                    : "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "6px",
                  color: secondImageSrc ? "#0f172a" : "#64748b",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: secondImageSrc ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: secondImageSrc ? "0 4px 14px rgba(45, 212, 191, 0.3)" : "none",
                }}
              >
                <Check size={15} />
                {isArabic ? "تطبيق الدمج" : "Apply Blend"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { BlendModal };

