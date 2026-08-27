import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brush, ChevronDown, Circle, Cloud, Crop, Download, Eraser, Eye, Hand, Image as ImageIcon,
  Layers3, Maximize2, Minus, MousePointer2, PaintBucket, PanelRight, Plus, Redo2, RotateCcw,
  Settings2, SlidersHorizontal, Sparkles, Square, SunMedium, TextCursorInput, Undo2, Upload,
  WandSparkles, ZoomIn,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** ImagePro Studio — charcoal + signal teal. Phase 3 starts with a real Canvas pipeline. */

const sampleImages = {
  portrait: "/manus-storage/editor-sample-portrait_3acb27d1.jpg",
  landscape: "/manus-storage/editor-sample-landscape_fb0ab7a9.jpg",
  stillLife: "/manus-storage/editor-sample-stilllife_1fc3f879.jpg",
};

type Tool = { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; shortcut: string };
type Stroke = { points: { x: number; y: number }[]; color: string; width: number; mode: "brush" | "eraser"; layerId?: string };
type ShapeElement = { id: string; shape: "rectangle" | "ellipse"; x: number; y: number; width: number; height: number; color: string; widthStroke: number; layerId: string };
type TextElement = { id: string; text: string; x: number; y: number; size: number; color: string };
type SelectionRect = { x: number; y: number; width: number; height: number };
type MaskRect = SelectionRect;
type EditorSnapshot = { imageSrc: string; brightness: number; contrast: number; grayscale: number; rotation: number; flipX: boolean; flipY: boolean; filterMode: "none" | "blur" | "sharpen" | "edges"; strokes: Stroke[]; shapes: ShapeElement[]; textElements: TextElement[]; maskRect: MaskRect | null; layers: LayerInfo[] };
export const toolGroups: Tool[][] = [
  [
    { id: "select", label: "تحديد", icon: MousePointer2, shortcut: "V" },
    { id: "hand", label: "تحريك", icon: Hand, shortcut: "H" },
    { id: "crop", label: "قص", icon: Crop, shortcut: "C" },
  ],
  [
    { id: "brush", label: "فرشاة", icon: Brush, shortcut: "B" },
    { id: "eraser", label: "ممحاة الرسم", icon: Eraser, shortcut: "E" },
    { id: "eyedropper", label: "قطّارة اللون", icon: PaintBucket, shortcut: "I" },
    { id: "shape", label: "أشكال", icon: Square, shortcut: "U" },
    { id: "text", label: "نص", icon: TextCursorInput, shortcut: "T" },
  ],
  [
    { id: "adjust", label: "تعديلات", icon: SlidersHorizontal, shortcut: "A" },
    { id: "magic", label: "أدوات ذكية", icon: WandSparkles, shortcut: "W" },
  ],
];

type LayerInfo = { id: string; name: string; kind: string; color: string; visible: boolean };
type SavedProject = { imageData: string; imageName: string; brightness: number; contrast: number; grayscale: number; rotation: number; flipX: boolean; flipY: boolean; filterMode: "none" | "blur" | "sharpen" | "edges"; strokes: Stroke[]; shapes?: ShapeElement[]; textElements: TextElement[]; maskRect?: MaskRect | null; layers: LayerInfo[] };

function readSavedProject(): SavedProject | null { try { const raw = window.localStorage.getItem("imagepro-studio-project"); return raw ? JSON.parse(raw) as SavedProject : null; } catch { return null; } }

const layerSeed: LayerInfo[] = [
  { id: "color", name: "تعديل لوني", kind: "adjustment", color: "#2dd4bf", visible: true },
  { id: "portrait", name: "الصورة الأصلية", kind: "image", color: "#d7b58a", visible: true },
  { id: "background", name: "الخلفية", kind: "background", color: "#8d8b87", visible: true },
];

function drawTexts(context: CanvasRenderingContext2D, textElements: TextElement[], visibleTextIds?: Set<string>) { for (const item of textElements) { if (visibleTextIds && !visibleTextIds.has(item.id)) continue; context.save(); context.fillStyle = item.color; context.font = `600 ${item.size}px Arial, sans-serif`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(item.text, item.x, item.y); context.restore(); } }

function drawShapes(context: CanvasRenderingContext2D, shapes: ShapeElement[], visiblePaintIds?: Set<string>) { for (const shape of shapes) { if (visiblePaintIds && !visiblePaintIds.has(shape.layerId)) continue; context.save(); context.strokeStyle = shape.color; context.lineWidth = shape.widthStroke; context.beginPath(); if (shape.shape === "ellipse") context.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.abs(shape.width / 2), Math.abs(shape.height / 2), 0, 0, Math.PI * 2); else context.rect(shape.x, shape.y, shape.width, shape.height); context.stroke(); context.restore(); } }
function drawStrokes(context: CanvasRenderingContext2D, strokes: Stroke[], visiblePaintIds?: Set<string>) {
  for (const stroke of strokes) { if (visiblePaintIds && stroke.layerId && !visiblePaintIds.has(stroke.layerId)) continue;
    if (stroke.points.length === 0 || stroke.mode === "eraser") continue;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = stroke.width;
    context.strokeStyle = stroke.color;
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
    if (stroke.points.length === 1) context.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
    context.stroke();
    context.restore();
  }
}

function applyKernel(context: CanvasRenderingContext2D, width: number, height: number, kernel: number[], divisor: number, offset: number) {
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const sourceData = source.data;
  const outputData = output.data;
  const side = 3;
  const half = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let red = 0; let green = 0; let blue = 0;
      for (let kernelY = 0; kernelY < side; kernelY += 1) {
        for (let kernelX = 0; kernelX < side; kernelX += 1) {
          const sampleX = Math.min(width - 1, Math.max(0, x + kernelX - half));
          const sampleY = Math.min(height - 1, Math.max(0, y + kernelY - half));
          const sampleIndex = (sampleY * width + sampleX) * 4;
          const weight = kernel[kernelY * side + kernelX];
          red += sourceData[sampleIndex] * weight;
          green += sourceData[sampleIndex + 1] * weight;
          blue += sourceData[sampleIndex + 2] * weight;
        }
      }
      const outputIndex = (y * width + x) * 4;
      outputData[outputIndex] = Math.max(0, Math.min(255, red / divisor + offset));
      outputData[outputIndex + 1] = Math.max(0, Math.min(255, green / divisor + offset));
      outputData[outputIndex + 2] = Math.max(0, Math.min(255, blue / divisor + offset));
      outputData[outputIndex + 3] = sourceData[outputIndex + 3];
    }
  }
  context.putImageData(output, 0, 0);
}

function ToolButton({ tool, active, onClick }: { tool: Tool; active: boolean; onClick: () => void }) {
  const Icon = tool.icon;
  return <Tooltip><TooltipTrigger asChild><button aria-label={`${tool.label} — الاختصار ${tool.shortcut}`} title={`${tool.label} (${tool.shortcut})`} onClick={onClick} className={`tool-button ${active ? "is-active" : ""}`}><Icon size={18} strokeWidth={1.8} />{active && <span className="active-mark" />}</button></TooltipTrigger><TooltipContent side="right" className="tooltip-content">{tool.label}<span className="tooltip-key">{tool.shortcut}</span></TooltipContent></Tooltip>;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState("select");
  const [activeTab, setActiveTab] = useState<"layers" | "properties">("layers");
  const [layers, setLayers] = useState(() => readSavedProject()?.layers ?? layerSeed);
  const [selectedLayer, setSelectedLayer] = useState("portrait");
  const [imageSrc, setImageSrc] = useState(() => readSavedProject()?.imageData || sampleImages.portrait);
  const [imageName, setImageName] = useState(() => readSavedProject()?.imageName || "Untitled portrait study");
  const [sampleImageKey, setSampleImageKey] = useState<keyof typeof sampleImages>("portrait");
  const [imageSize, setImageSize] = useState({ width: 2048, height: 1536 });
  const [zoom, setZoom] = useState(78);
  const [brightness, setBrightness] = useState(() => readSavedProject()?.brightness ?? 12);
  const [contrast, setContrast] = useState(() => readSavedProject()?.contrast ?? 6);
  const [grayscale, setGrayscale] = useState(() => readSavedProject()?.grayscale ?? 0);
  const [rotation, setRotation] = useState(() => readSavedProject()?.rotation ?? 0);
  const [flipX, setFlipX] = useState(() => readSavedProject()?.flipX ?? false);
  const [flipY, setFlipY] = useState(() => readSavedProject()?.flipY ?? false);
  const [filterMode, setFilterMode] = useState<"none" | "blur" | "sharpen" | "edges">(() => readSavedProject()?.filterMode ?? "none");
  const [strokes, setStrokes] = useState<Stroke[]>(() => readSavedProject()?.strokes ?? []);
  const [shapes, setShapes] = useState<ShapeElement[]>(() => readSavedProject()?.shapes ?? []);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>(() => readSavedProject()?.textElements ?? []);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [foregroundColor, setForegroundColor] = useState("#2dd4bf");
  const [sampledRgb, setSampledRgb] = useState("RGB 45, 212, 191");
  const [blendMode, setBlendMode] = useState("عادي");
  const [layerOptionsOpen, setLayerOptionsOpen] = useState(false);
  const [quickAdjustmentsOpen, setQuickAdjustmentsOpen] = useState(true);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [selectionMode, setSelectionMode] = useState<"replace" | "add" | "subtract">("replace");
  const [selectionShape, setSelectionShape] = useState<"rectangle" | "ellipse" | "free">("rectangle");
  const [maskRect, setMaskRect] = useState<MaskRect | null>(null);
  const selectionStart = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [status, setStatus] = useState("جاهز للتحرير");
  const historyRef = useRef<EditorSnapshot[]>([]);
  const redoRef = useRef<EditorSnapshot[]>([]);
  const restoringRef = useRef(false);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    setIsRendering(true);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || 2048;
      const height = image.naturalHeight || 1536;
      const quarterTurn = ((rotation % 360) + 360) % 360;
      const outputWidth = quarterTurn === 90 || quarterTurn === 270 ? height : width;
      const outputHeight = quarterTurn === 90 || quarterTurn === 270 ? width : height;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, outputWidth, outputHeight);
      context.save();
      context.translate(outputWidth / 2, outputHeight / 2);
      context.rotate((quarterTurn * Math.PI) / 180);
      context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      const brightnessValue = 100 + brightness;
      const contrastValue = 100 + contrast;
      const blurValue = filterMode === "blur" ? " blur(4px)" : "";
      const grayscaleValue = filterMode === "edges" ? 100 : grayscale;
      context.filter = `brightness(${brightnessValue}%) contrast(${contrastValue}%) grayscale(${grayscaleValue}%)${blurValue}`;
      const activeMask = maskRect && layers.some((layer) => layer.kind === "mask" && layer.visible) ? maskRect : null;
      if (activeMask) { context.beginPath(); context.rect(activeMask.x - outputWidth / 2, activeMask.y - outputHeight / 2, activeMask.width, activeMask.height); context.clip(); }
      context.drawImage(image, -width / 2, -height / 2, width, height);
      context.filter = "none";
      context.restore();
      drawTexts(context, textElements, new Set(layers.filter((layer) => layer.kind === "text" && layer.visible).map((layer) => layer.id)));
      drawStrokes(context, strokes, new Set(layers.filter((layer) => layer.kind === "paint" && layer.visible).map((layer) => layer.id)));
      drawShapes(context, shapes, new Set(layers.filter((layer) => layer.kind === "paint" && layer.visible).map((layer) => layer.id)));
      if (filterMode === "sharpen") applyKernel(context, outputWidth, outputHeight, [0, -1, 0, -1, 5, -1, 0, -1, 0], 1, 0);
      if (filterMode === "edges") applyKernel(context, outputWidth, outputHeight, [-1, -1, -1, -1, 8, -1, -1, -1, -1], 1, 128);
      setImageSize({ width: outputWidth, height: outputHeight });
      setIsRendering(false);
    };
    image.onerror = () => { setStatus("Could not load image"); setIsRendering(false); };
    image.src = imageSrc;
  }, [brightness, contrast, filterMode, grayscale, flipX, flipY, imageSrc, rotation, strokes, shapes, textElements, maskRect, layers]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  useEffect(() => {
    const snapshot: EditorSnapshot = { imageSrc, brightness, contrast, grayscale, rotation, flipX, flipY, filterMode, strokes, shapes, textElements, maskRect, layers };
    if (restoringRef.current) { restoringRef.current = false; return; }
    const previous = historyRef.current[historyRef.current.length - 1];
    if (JSON.stringify(previous) !== JSON.stringify(snapshot)) {
      historyRef.current = [...historyRef.current, snapshot].slice(-20);
      redoRef.current = [];
    }
  }, [brightness, contrast, filterMode, flipX, flipY, grayscale, imageSrc, layers, rotation, strokes, textElements, shapes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveProject(); }
      const shortcut = event.key.toUpperCase();
      const tool = toolGroups.flat().find((item) => item.shortcut === shortcut);
      if (tool && !event.metaKey && !event.ctrlKey) setActiveTool(tool.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) { setStatus("Unsupported file format"); return; }
    if (file.size > 25 * 1024 * 1024) { setStatus("File exceeds the 25 MB limit"); return; }
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setImageName(file.name.replace(/\.[^/.]+$/, ""));
    setSampleImageKey("portrait");
    setStatus("Image loaded — original preserved");
  };

  const restoreSnapshot = (snapshot: EditorSnapshot) => { restoringRef.current = true; setImageSrc(snapshot.imageSrc); setBrightness(snapshot.brightness); setContrast(snapshot.contrast); setGrayscale(snapshot.grayscale); setRotation(snapshot.rotation); setFlipX(snapshot.flipX); setFlipY(snapshot.flipY); setFilterMode(snapshot.filterMode); setStrokes(snapshot.strokes); setShapes(snapshot.shapes ?? []); setTextElements(snapshot.textElements); setMaskRect(snapshot.maskRect); setLayers(snapshot.layers); };
  const undo = () => { if (historyRef.current.length < 2) { setStatus("Nothing to undo"); return; } const current = historyRef.current.pop(); if (current) redoRef.current.push(current); const previous = historyRef.current[historyRef.current.length - 1]; if (previous) { restoreSnapshot(previous); setStatus("Undid last action"); } };
  const redo = () => { const next = redoRef.current.pop(); if (!next) { setStatus("Nothing to redo"); return; } historyRef.current.push(next); restoreSnapshot(next); setStatus("Redid last action"); };
  const cycleSampleImage = () => { const keys: (keyof typeof sampleImages)[] = ["portrait", "landscape", "stillLife"]; const next = keys[(keys.indexOf(sampleImageKey) + 1) % keys.length]; setSampleImageKey(next); setImageSrc(sampleImages[next]); setImageName(next === "portrait" ? "Portrait study" : next === "landscape" ? "Landscape study" : "Still life study"); setStatus(`تم تحميل صورة الاختبار: ${next === "portrait" ? "شخصية" : next === "landscape" ? "منظر طبيعي" : "طبيعة صامتة"}`); };
  const cropToSquare = () => { const canvas = canvasRef.current; if (!canvas) return; const size = Math.min(canvas.width, canvas.height); const left = (canvas.width - size) / 2; const top = (canvas.height - size) / 2; const cropped = document.createElement("canvas"); cropped.width = size; cropped.height = size; const croppedContext = cropped.getContext("2d"); if (!croppedContext) return; croppedContext.drawImage(canvas, left, top, size, size, 0, 0, size, size); setImageSrc(cropped.toDataURL("image/png")); setRotation(0); setFlipX(false); setFlipY(false); setSelection(null); setStatus("تم تطبيق القص المربع"); };
  const cropToSelection = () => { const canvas = canvasRef.current; if (!canvas || !selection || selection.width < 4 || selection.height < 4) { setStatus("حدد منطقة للقص أولاً"); return; } const cropped = document.createElement("canvas"); cropped.width = Math.round(selection.width); cropped.height = Math.round(selection.height); const context = cropped.getContext("2d"); if (!context) return; context.drawImage(canvas, selection.x, selection.y, selection.width, selection.height, 0, 0, cropped.width, cropped.height); setImageSrc(cropped.toDataURL("image/png")); setRotation(0); setFlipX(false); setFlipY(false); setSelection(null); setStatus("تم قص المنطقة المحددة"); };

  const saveProject = () => { const canvas = canvasRef.current; if (!canvas) return; try { const project: SavedProject = { imageData: canvas.toDataURL("image/png"), imageName, brightness, contrast, grayscale, rotation, flipX, flipY, filterMode, strokes, shapes, textElements, maskRect, layers }; window.localStorage.setItem("imagepro-studio-project", JSON.stringify(project)); setStatus("Project saved locally"); } catch { setStatus("Local save failed — image may be too large"); } };

  const toggleFullscreen = async () => { if (!canvasStageRef.current) return; if (document.fullscreenElement) await document.exitFullscreen(); else await canvasStageRef.current.requestFullscreen(); setStatus(document.fullscreenElement ? "تم إغلاق العرض الكامل" : "تم فتح العرض الكامل"); };
  const cycleBlendMode = () => { const modes = ["عادي", "ضرب", "شاشة", "تراكب"]; const next = modes[(modes.indexOf(blendMode) + 1) % modes.length]; setBlendMode(next); setStatus(`وضع الدمج: ${next}`); };
  const exportImage = (format: "png" | "jpeg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) { setStatus("Export failed"); return; }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${imageName || "imagepro-export"}.${format === "png" ? "png" : "jpg"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(`Exported ${format.toUpperCase()} successfully`);
    }, format === "png" ? "image/png" : "image/jpeg", .92);
  };

  const toggleLayer = (id: string) => setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer));
  const setAllLayersVisibility = (visible: boolean) => { setLayers((current) => current.map((layer) => ({ ...layer, visible }))); setLayerOptionsOpen(false); setStatus(visible ? "تم إظهار جميع الطبقات" : "تم إخفاء جميع الطبقات"); };
  const addPaintLayer = () => { const id = `paint-${Date.now()}`; setLayers((current) => [{ id, name: "طبقة رسم", kind: "paint", color: "#2dd4bf", visible: true }, ...current]); setSelectedLayer(id); setStatus("تم إنشاء طبقة رسم"); };
  const ensurePaintLayer = () => { const existing = layers.find((layer) => layer.kind === "paint"); if (existing) { setSelectedLayer(existing.id); return existing.id; } const id = `paint-${Date.now()}`; setLayers((current) => [{ id, name: "طبقة رسم", kind: "paint", color: "#2dd4bf", visible: true }, ...current]); setSelectedLayer(id); return id; };
  const removeSelectedLayer = () => { if (selectedLayer === "background") { setStatus("لا يمكن حذف طبقة الخلفية"); return; } setLayers((current) => current.filter((layer) => layer.id !== selectedLayer)); setSelectedLayer("portrait"); setStatus("تم حذف الطبقة"); };
  const duplicateSelectedLayer = () => { const source = layers.find((layer) => layer.id === selectedLayer); if (!source) { setStatus("اختر طبقة أولاً"); return; } const id = `layer-${Date.now()}`; setLayers((current) => [{ ...source, id, name: `${source.name} — نسخة` }, ...current]); setSelectedLayer(id); setStatus("تم تكرار الطبقة"); };
  const clearSelectedPaint = () => { if (layers.find((layer) => layer.id === selectedLayer)?.kind !== "paint") { setStatus("التنظيف يعمل على طبقة الرسم فقط"); return; } setStrokes((current) => current.filter((stroke) => stroke.layerId !== selectedLayer)); setShapes((current) => current.filter((shape) => shape.layerId !== selectedLayer)); setStatus("تم تنظيف طبقة الرسم"); };
  const pointFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 }; const bounds = canvas.getBoundingClientRect(); return { x: (event.clientX - bounds.left) * (canvas.width / bounds.width), y: (event.clientY - bounds.top) * (canvas.height / bounds.height) }; };
  const addText = (event: React.PointerEvent<HTMLCanvasElement>) => { const point = pointFromPointer(event); const id = `text-${Date.now()}`; setTextElements((current) => [...current, { id, text: "نص ImagePro", x: point.x, y: point.y, size: Math.max(28, imageSize.width / 28), color: foregroundColor }]); setLayers((current) => [{ id, name: "نص ImagePro", kind: "text", color: foregroundColor, visible: true }, ...current]); setSelectedTextId(id); setStatus("تمت إضافة طبقة نص مستقلة"); };
  const updateSelection = (point: { x: number; y: number }) => { const start = selectionStart.current; if (!start) return; const next = { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) }; setSelection((current) => { if (!current || selectionMode === "replace") return next; const overlaps = next.x < current.x + current.width && next.x + next.width > current.x && next.y < current.y + current.height && next.y + next.height > current.y; if (!overlaps) return current; if (selectionMode === "add") return { x: Math.min(current.x, next.x), y: Math.min(current.y, next.y), width: Math.max(current.x + current.width, next.x + next.width) - Math.min(current.x, next.x), height: Math.max(current.y + current.height, next.y + next.height) - Math.min(current.y, next.y) }; return null; }); };
  const createMaskFromSelection = () => { if (!selection || selection.width < 3 || selection.height < 3) { setStatus("حدد منطقة أولاً لإنشاء القناع"); return; } setMaskRect(selection); const id = `mask-${Date.now()}`; setLayers((current) => [{ id, name: "قناع التحديد", kind: "mask", color: "#9de9dd", visible: true }, ...current]); setSelectedLayer(id); setStatus("تم إنشاء قناع غير تدميري"); };
  const updateText = (text: string) => { if (!selectedTextId) return; setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, text } : item)); setLayers((current) => current.map((layer) => layer.id === selectedTextId ? { ...layer, name: text || "نص بدون محتوى" } : layer)); };
  const sampleColor = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return; const point = pointFromPointer(event); const context = canvas.getContext("2d"); if (!context) return; const pixel = context.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data; const hex = `#${[pixel[0], pixel[1], pixel[2]].map((value) => value.toString(16).padStart(2, "0")).join("")}`; setForegroundColor(hex); setSampledRgb(`RGB ${pixel[0]}, ${pixel[1]}, ${pixel[2]}`); setStatus(`تم التقاط اللون ${hex.toUpperCase()}`); };
  const eraseAt = (point: { x: number; y: number }) => { const radius = Math.max(12, imageSize.width / 120); setStrokes((current) => current.filter((stroke) => stroke.mode !== "brush" || (stroke.layerId && stroke.layerId !== selectedLayer) || !stroke.points.some((item) => Math.hypot(item.x - point.x, item.y - point.y) <= radius))); };
  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => { if (activeTool === "hand") { event.currentTarget.setPointerCapture(event.pointerId); panStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; setStatus("التحريك فعال لمساحة العمل"); return; } if (activeTool === "crop") { event.currentTarget.setPointerCapture(event.pointerId); selectionStart.current = pointFromPointer(event); setSelection({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 }); setStatus("حدد منطقة القص بالسحب"); return; } if (activeTool === "magic") { setBrightness((value) => Math.min(100, value + 12)); setContrast((value) => Math.min(100, value + 10)); setStatus("تم تطبيق التحسين الذكي"); return; } if (activeTool === "shape") { event.currentTarget.setPointerCapture(event.pointerId); selectionStart.current = pointFromPointer(event); setSelection({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 }); setStatus("جارٍ رسم الشكل"); return; } if (activeTool === "text") { addText(event); return; } if (activeTool === "eyedropper") { sampleColor(event); return; } if (activeTool === "select") { event.currentTarget.setPointerCapture(event.pointerId); selectionStart.current = pointFromPointer(event); setSelection({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 }); setStatus("جارٍ تحديد المنطقة"); return; } if (activeTool !== "brush" && activeTool !== "eraser") return; if (activeTool === "eraser" && layers.find((layer) => layer.id === selectedLayer)?.kind !== "paint") { setStatus("الممحاة تعمل على طبقة الرسم فقط"); return; } const paintLayerId = activeTool === "brush" ? ensurePaintLayer() : selectedLayer; event.currentTarget.setPointerCapture(event.pointerId); setIsDrawing(true); const point = pointFromPointer(event); if (activeTool === "eraser") { eraseAt(point); setStatus("الممحاة تزيل الرسم فقط"); } else { setStrokes((current) => [...current, { points: [point], color: foregroundColor, width: Math.max(4, imageSize.width / 180), mode: "brush", layerId: paintLayerId }]); setStatus("الرسم فعال على طبقة مستقلة"); } };
  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => { if (activeTool === "hand" && panStart.current) { setPan({ x: panStart.current.panX + event.clientX - panStart.current.x, y: panStart.current.panY + event.clientY - panStart.current.y }); return; } const point = pointFromPointer(event); if ((activeTool === "select" || activeTool === "shape") && selectionStart.current) { updateSelection(point); return; } if (!isDrawing) return; if (activeTool === "eraser") { eraseAt(point); } else { setStrokes((current) => current.map((stroke, index) => index === current.length - 1 ? { ...stroke, points: [...stroke.points, point] } : stroke)); } };
  const finishDrawing = () => { if (activeTool === "hand") { panStart.current = null; return; } if (activeTool === "crop" && selectionStart.current) { selectionStart.current = null; cropToSelection(); return; } if (activeTool === "shape" && selectionStart.current && selection && selection.width > 3 && selection.height > 3) { const layerId = ensurePaintLayer(); setShapes((current) => [...current, { id: `shape-${Date.now()}`, shape: selectionShape === "ellipse" ? "ellipse" : "rectangle", x: selection.x, y: selection.y, width: selection.width, height: selection.height, color: foregroundColor, widthStroke: Math.max(3, imageSize.width / 240), layerId }]); selectionStart.current = null; setSelection(null); setStatus("تم إنشاء الشكل على طبقة الرسم"); return; } if (activeTool === "select" && selectionStart.current) { selectionStart.current = null; setStatus(selection && selection.width > 2 && selection.height > 2 ? `تم التحديد — الوضع: ${selectionMode === "replace" ? "استبدال" : selectionMode === "add" ? "إضافة" : "طرح"}` : "التحديد صغير جداً"); return; } if (isDrawing) { setIsDrawing(false); setStatus("تم تثبيت الرسم"); } };

  const activateTool = (toolId: string) => { setActiveTool(toolId); if (toolId === "adjust" || toolId === "crop") setActiveTab("properties"); if (toolId === "magic") { setBrightness((value) => Math.min(100, value + 12)); setContrast((value) => Math.min(100, value + 10)); setStatus("تم تطبيق التحسين الذكي على الصورة"); return; } const messages: Record<string, string> = { select: "أداة التحديد جاهزة — اسحب داخل الصورة", hand: "أداة التحريك جاهزة — اسحب مساحة العمل", crop: "أداة القص جاهزة — اسحب لتحديد المنطقة", eyedropper: "القطّارة جاهزة — انقر على لون داخل الصورة", adjust: "تم فتح لوحة تعديل A والخصائص", shape: "أداة الأشكال جاهزة — اسحب داخل الصورة" }; setStatus(messages[toolId] ?? "تم اختيار الأداة"); };

  return <TooltipProvider delayDuration={180}>
    <main className="editor-shell">
      <header className="command-bar">
        <div className="brand-lockup"><div className="brand-mark"><img src="/manus-storage/imagepro-logo_ff8f3e11.png" alt="" /></div><div><div className="brand-name">ImagePro <span>Studio</span></div><div className="brand-caption">IMAGE PROCESSING LAB <span>•</span> 03.01</div></div></div>
        <nav className="command-nav" aria-label="القائمة الرئيسية"><button onClick={() => uploadRef.current?.click()} data-testid="top-file">ملف <ChevronDown size={13} /></button><button onClick={undo} data-testid="top-edit">تحرير <ChevronDown size={13} /></button><button onClick={cycleSampleImage} data-testid="top-image">صورة <ChevronDown size={13} /></button><button onClick={() => { setActiveTab("properties"); setFilterMode("blur"); setStatus("تم فتح المرشحات وتطبيق التمويه"); }} data-testid="top-filter">مرشح <ChevronDown size={13} /></button><button onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); setStatus("تم ضبط العرض إلى 100%"); }} data-testid="top-view">عرض <ChevronDown size={13} /></button></nav>
        <div className="command-actions"><button className="save-state save-action" onClick={saveProject} data-testid="save-project"><span className="save-dot" /> {isRendering ? "جارٍ العرض" : "حفظ المشروع"}</button><button className="icon-action" aria-label="حالة التخزين السحابي" onClick={() => setStatus("التخزين السحابي غير متصل — الحفظ المحلي فعال")}><Cloud size={16} /></button><button className="export-button" onClick={() => exportImage("png")} data-testid="export-png"><Download size={15} /> تصدير <ChevronDown size={13} /></button><div className="avatar">AR</div></div>
      </header>

      <section className="workspace-grid">
        <aside className="tool-rail" aria-label="شريط الأدوات"><div className="rail-label">الأدوات</div>{toolGroups.map((group, index) => <div className="tool-group" key={index}>{group.map((tool) => <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => activateTool(tool.id)} />)}</div>)}<div className="rail-spacer" /><button className="tool-button" onClick={() => uploadRef.current?.click()} aria-label="رفع صورة"><Upload size={18} /></button><button className="tool-button" aria-label="إعدادات الأدوات" onClick={() => { setActiveTab("properties"); setStatus("تم فتح إعدادات الأدوات"); }}><Settings2 size={18} /></button><div className="color-pair" aria-label="Foreground and background colors"><span className="foreground-color" style={{ background: foregroundColor }} /><span className="background-color" /></div></aside>

        <section className="canvas-column"><div className="canvas-toolbar"><div className="document-title"><span className="signal-line" />{imageName} <span className="dirty-dot">•</span></div><div className="canvas-actions"><button className="canvas-icon" onClick={undo} aria-label="تراجع" data-testid="undo"><Undo2 size={16} /></button><button className="canvas-icon" onClick={redo} aria-label="تقدم" data-testid="redo"><Redo2 size={16} /></button><span className="toolbar-divider" /><button className="canvas-icon" onClick={toggleFullscreen} aria-label="العرض الكامل" data-testid="fullscreen"><Maximize2 size={16} /></button></div></div>
          <div ref={canvasStageRef} className="canvas-stage" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) { const data = new DataTransfer(); data.items.add(file); if (uploadRef.current) { uploadRef.current.files = data.files; uploadRef.current.dispatchEvent(new Event("change", { bubbles: true })); } } }}>
            <div className="stage-grid" /><div className="canvas-card" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}><canvas ref={canvasRef} aria-label="مساحة تحرير الصورة" style={{ touchAction: "none", backgroundColor: '#71bf31' }} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} /><div className="selection-frame"><span className="frame-label">{toolGroups.flat().find((tool) => tool.id === activeTool)?.label ?? activeTool} / نشط</span></div>{selection && selection.width > 2 && selection.height > 2 && <div className={`selection-overlay ${selectionShape === "ellipse" ? "ellipse" : selectionShape === "free" ? "free" : ""}`} style={{ left: `${(selection.x / Math.max(1, canvasRef.current?.width || 1)) * 100}%`, top: `${(selection.y / Math.max(1, canvasRef.current?.height || 1)) * 100}%`, width: `${(selection.width / Math.max(1, canvasRef.current?.width || 1)) * 100}%`, height: `${(selection.height / Math.max(1, canvasRef.current?.height || 1)) * 100}%` }}><span>{selectionShape === "ellipse" ? "تحديد بيضاوي" : selectionShape === "free" ? "تحديد حر" : "تحديد مستطيل"}</span></div>}</div><div className="canvas-crosshair" />
            <div className="canvas-badge">RGB / 8 bit <span>•</span> {imageSize.width} × {imageSize.height}</div><div className="stage-floating-tools"><button onClick={() => setZoom((value) => Math.min(140, value + 5))}><Plus size={14} /></button><span>{zoom}%</span><button onClick={() => setZoom((value) => Math.max(30, value - 5))}><Minus size={14} /></button></div>
            {isRendering && <div className="rendering-overlay"><span className="rendering-spinner" /> Rendering preview</div>}
          </div><div className="canvas-status"><span><span className="status-pulse" /> {status}</span><span>GPU preview <b>ON</b></span><span>Memory 148 MB</span><span>History 03 / 30</span></div>
        </section>

        <aside className="inspector-rail"><div className="inspector-tabs"><button className={activeTab === "layers" ? "active" : ""} onClick={() => { setActiveTab("layers"); setStatus("تم فتح لوحة الطبقات"); }} data-testid="layers-tab"><Layers3 size={15} /> الطبقات</button><button className={activeTab === "properties" ? "active" : ""} onClick={() => { setActiveTab("properties"); setStatus("تم فتح لوحة الخصائص"); }} data-testid="properties-tab"><SlidersHorizontal size={15} /> الخصائص</button><button className="panel-toggle" aria-label="حالة اللوحة" onClick={() => setStatus("لوحة الطبقات والخصائص نشطة")}><PanelRight size={15} /></button></div>
          {activeTab === "layers" ? <><div className="panel-heading"><span>الطبقات <em>{String(layers.length).padStart(2, "0")}</em></span><div><button onClick={addPaintLayer} aria-label="إضافة طبقة" data-testid="add-layer"><Plus size={15} /></button><button onClick={() => setLayerOptionsOpen((open) => !open)} aria-label="خيارات الطبقات" data-testid="layer-options"><ChevronDown size={15} /></button></div>{layerOptionsOpen && <div className="layer-options-menu"><button onClick={() => setAllLayersVisibility(true)}>إظهار الكل</button><button onClick={() => setAllLayersVisibility(false)}>إخفاء الكل</button></div>}</div><div className="layer-stack">{layers.map((layer, index) => <button key={layer.id} className={`layer-row ${selectedLayer === layer.id ? "selected" : ""}`} onClick={() => { setSelectedLayer(layer.id); setSelectedTextId(layer.kind === "text" ? layer.id : null); }}><span className="layer-drag">⋮⋮</span><span className="layer-eye" onClick={(event) => { event.stopPropagation(); toggleLayer(layer.id); }}>{layer.visible ? <Eye size={14} /> : <span className="eye-off" />}</span><span className="layer-thumb" style={{ background: layer.kind === "image" ? `url(${imageSrc}) center/cover` : layer.color }} /><span className="layer-name"><b>{layer.name}</b><small>{layer.kind === "adjustment" ? "طبقة تعديل" : layer.kind === "image" ? "كائن ذكي" : layer.kind === "mask" ? "قناع غير تدميري" : layer.kind === "text" ? "نص قابل للتحرير" : layer.kind === "background" ? "طبقة خلفية" : "طبقة رسم"}</small></span>{index === 0 && <Sparkles size={13} className="layer-spark" />}</button>)}</div><div className="layer-footer"><button onClick={addPaintLayer} aria-label="إضافة طبقة رسم" data-testid="add-paint-layer"><Plus size={16} /></button><button onClick={duplicateSelectedLayer} aria-label="تكرار الطبقة" data-testid="duplicate-layer"><Layers3 size={16} /></button><button onClick={clearSelectedPaint} aria-label="تنظيف طبقة الرسم" data-testid="clear-paint"><Eraser size={15} /></button><button onClick={removeSelectedLayer} aria-label="حذف الطبقة" data-testid="delete-layer"><span className="trash-icon">⌫</span></button></div></> : <div className="properties-panel"><div className="panel-heading"><span>الخصائص</span><button onClick={() => { setBrightness(0); setContrast(0); setGrayscale(0); setRotation(0); setFlipX(false); setFlipY(false); setFilterMode("none"); }}><RotateCcw size={14} /></button></div><Adjustment label="السطوع" value={brightness} min={-100} max={100} onChange={setBrightness} /><Adjustment label="التباين" value={contrast} min={-100} max={100} onChange={setContrast} /><Adjustment label="تدرج رمادي" value={grayscale} min={0} max={100} onChange={setGrayscale} /><div className="selection-actions"><span>التحديد</span><div className="selection-modes"><button className={selectionShape === "rectangle" ? "active" : ""} onClick={() => setSelectionShape("rectangle")}>مستطيل</button><button className={selectionShape === "ellipse" ? "active" : ""} onClick={() => setSelectionShape("ellipse")}>بيضاوي</button><button className={selectionShape === "free" ? "active" : ""} onClick={() => setSelectionShape("free")}>حر</button><button className={selectionMode === "replace" ? "active" : ""} onClick={() => setSelectionMode("replace")}>استبدال</button><button className={selectionMode === "add" ? "active" : ""} onClick={() => setSelectionMode("add")}>إضافة</button><button className={selectionMode === "subtract" ? "active" : ""} onClick={() => setSelectionMode("subtract")}>طرح</button><button onClick={() => { setSelection(null); setStatus("تم إلغاء التحديد"); }}>إلغاء</button><button onClick={createMaskFromSelection}>قناع</button></div></div><div className="transform-actions"><span>التحويل</span><button onClick={() => { setRotation((value) => (value + 90) % 360); setStatus("تم تدوير الصورة 90 درجة"); }}>تدوير 90°</button><button onClick={cropToSquare}>قص مربع</button><button onClick={() => { setFlipX((value) => !value); setStatus("تم القلب أفقياً"); }}>قلب أفقي</button><button onClick={() => { setFlipY((value) => !value); setStatus("تم القلب رأسياً"); }}>قلب رأسي</button></div>{selectedTextId && <div className="text-editor-panel"><span>تحرير النص</span><input value={textElements.find((item) => item.id === selectedTextId)?.text ?? ""} onChange={(event) => updateText(event.target.value)} aria-label="محتوى النص" placeholder="اكتب النص هنا" /></div>}<div className="properties-divider" /><div className="property-row"><span>وضع الدمج</span><button className="select-control" onClick={cycleBlendMode}>{blendMode} <ChevronDown size={13} /></button></div><div className="property-row"><span>نمط الألوان</span><span className="value-muted">sRGB IEC61966</span></div><div className="property-row"><span>اللون المحدد</span><span className="value-muted">{foregroundColor.toUpperCase()} · {sampledRgb}</span></div></div>}
          <div className="inspector-section"><div className="panel-heading"><span>تعديلات سريعة</span><button onClick={() => setQuickAdjustmentsOpen((open) => !open)} aria-label="خيارات التعديلات السريعة"><ChevronDown size={14} /></button></div>{quickAdjustmentsOpen && <div className="adjustment-grid"><button onClick={() => setBrightness((value) => Math.min(100, value + 10))}><SunMedium size={16} /> إضاءة</button><button onClick={() => setGrayscale(0)}><Circle size={15} /> ألوان</button><button onClick={() => setContrast((value) => Math.min(100, value + 10))}><Sparkles size={15} /> وضوح</button><button onClick={() => { setFilterMode("blur"); setStatus("Gaussian blur preview applied"); }}><WandSparkles size={15} /> تمويه</button><button onClick={() => { setFilterMode("sharpen"); setStatus("Sharpen filter preview applied"); }}><SlidersHorizontal size={15} /> حدة</button><button onClick={() => { setFilterMode("edges"); setStatus("Edge detection preview applied"); }}><Square size={15} /> حواف</button><button onClick={() => { setFilterMode("none"); setStatus("تمت إعادة ضبط المرشحات"); }}><RotateCcw size={15} /> إعادة ضبط</button></div>}{!quickAdjustmentsOpen && <div className="collapsed-note">لوحة التعديلات السريعة مطوية</div>}</div><div className="inspector-note"><span className="note-icon">i</span><p>Adjustments are previewed non-destructively. The original remains untouched.</p></div>
        </aside>
      </section>
      <footer className="app-footer"><span><span className="footer-signal" /> ImagePro engine v0.2.0</span><span>Canvas renderer: 2D <span className="footer-separator">/</span> WebGL ready</span><span>Keyboard shortcuts <kbd>?</kbd></span></footer>
      <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUpload} />
    </main>
  </TooltipProvider>;
}

function Adjustment({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="adjustment-row"><div><span>{label}</span><output>{value}</output></div><Slider value={[value]} min={min} max={max} step={1} onValueChange={(values) => onChange(values[0])} /></div>;
}
